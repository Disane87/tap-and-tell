import { eq, and, isNull, gt } from 'drizzle-orm'
import { betaInvites, waitlist, users } from '~~/server/database/schema'
import type { BetaMode, WaitlistStatus } from '~~/server/database/schema'

/**
 * Input for creating a beta invite.
 */
export interface CreateBetaInviteInput {
  email: string
  grantedPlan?: 'free' | 'pro' | 'business'
  isFounder?: boolean
  note?: string
  expiresInDays?: number
  source?: 'manual' | 'waitlist'
}

/**
 * Beta invite record from database.
 */
export interface BetaInvite {
  id: string
  email: string
  token: string
  source: string
  grantedPlan: string
  isFounder: boolean
  note: string | null
  expiresAt: Date
  acceptedAt: Date | null
  acceptedByUserId: string | null
  createdAt: Date
}

/**
 * Validates a beta invite token.
 * Returns the invite if valid, null if invalid/expired/used.
 */
export async function validateBetaInvite(token: string): Promise<BetaInvite | null> {
  const db = useDrizzle()

  const results = await db
    .select()
    .from(betaInvites)
    .where(
      and(
        eq(betaInvites.token, token),
        isNull(betaInvites.acceptedAt),
        gt(betaInvites.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!results[0]) {
    return null
  }

  return {
    ...results[0],
    isFounder: results[0].isFounder ?? false
  } as BetaInvite
}

/**
 * Marks a beta invite as accepted by a user.
 */
export async function acceptBetaInvite(token: string, userId: string): Promise<void> {
  const db = useDrizzle()

  await db
    .update(betaInvites)
    .set({
      acceptedAt: new Date(),
      acceptedByUserId: userId
    })
    .where(eq(betaInvites.token, token))

  // Update user's beta tracking fields
  const invite = await db
    .select()
    .from(betaInvites)
    .where(eq(betaInvites.token, token))
    .limit(1)

  if (invite[0]) {
    await db
      .update(users)
      .set({
        betaInviteId: invite[0].id,
        betaParticipant: true,
        isFounder: invite[0].isFounder ?? false,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))

    // If invite came from waitlist, update waitlist entry
    if (invite[0].source === 'waitlist') {
      await db
        .update(waitlist)
        .set({
          status: 'registered',
          registeredAt: new Date()
        })
        .where(eq(waitlist.email, invite[0].email.toLowerCase()))
    }
  }
}

/**
 * Creates a new beta invite.
 */
export async function createBetaInvite(input: CreateBetaInviteInput): Promise<BetaInvite> {
  const db = useDrizzle()

  const id = generateId()
  const token = generateId(32) // Longer token for security
  const expiresInDays = input.expiresInDays ?? 30
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const invite = {
    id,
    email: input.email.trim().toLowerCase(),
    token,
    source: input.source ?? 'manual',
    grantedPlan: input.grantedPlan ?? 'pro',
    isFounder: input.isFounder ?? false,
    note: input.note ?? null,
    expiresAt,
    acceptedAt: null,
    acceptedByUserId: null,
    createdAt: new Date()
  }

  await db.insert(betaInvites).values(invite)

  return invite as BetaInvite
}

/**
 * Gets a beta invite by email (most recent, unused).
 */
export async function getBetaInviteByEmail(email: string): Promise<BetaInvite | null> {
  const db = useDrizzle()

  const results = await db
    .select()
    .from(betaInvites)
    .where(
      and(
        eq(betaInvites.email, email.toLowerCase()),
        isNull(betaInvites.acceptedAt)
      )
    )
    .orderBy(betaInvites.createdAt)
    .limit(1)

  if (!results[0]) {
    return null
  }

  return results[0] as BetaInvite
}

/**
 * Revokes (deletes) an unused beta invite.
 */
export async function revokeBetaInvite(id: string): Promise<boolean> {
  const db = useDrizzle()

  const result = await db
    .delete(betaInvites)
    .where(
      and(
        eq(betaInvites.id, id),
        isNull(betaInvites.acceptedAt)
      )
    )

  return (result.rowCount ?? 0) > 0
}

/**
 * Input for joining the waitlist.
 */
export interface JoinWaitlistInput {
  email: string
  name?: string
  useCase?: string
  source?: string
  referralCode?: string
}

/**
 * Waitlist entry record.
 */
export interface WaitlistEntry {
  id: string
  email: string
  name: string | null
  useCase: string | null
  source: string | null
  referralCode: string
  position: number
  priority: number
  status: WaitlistStatus
  createdAt: Date
}

/**
 * Generates a unique referral code.
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusing chars
  let code = 'TAP-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Adds an email to the waitlist.
 * Returns existing entry if already registered.
 */
export async function joinWaitlist(input: JoinWaitlistInput): Promise<WaitlistEntry & { alreadyExists: boolean }> {
  const db = useDrizzle()
  const email = input.email.trim().toLowerCase()

  // Check if already on waitlist
  const existing = await db
    .select()
    .from(waitlist)
    .where(eq(waitlist.email, email))
    .limit(1)

  if (existing[0]) {
    return {
      ...existing[0],
      status: existing[0].status as WaitlistStatus,
      alreadyExists: true
    } as WaitlistEntry & { alreadyExists: boolean }
  }

  // Calculate priority boost from referral
  let priority = 0
  let referredByUserId: string | null = null

  if (input.referralCode) {
    // Find referrer by their referral code
    const referrer = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.referralCode, input.referralCode.toUpperCase()))
      .limit(1)

    if (referrer[0]) {
      // Boost referrer's priority
      await db
        .update(waitlist)
        .set({ priority: (referrer[0].priority ?? 0) + 10 })
        .where(eq(waitlist.id, referrer[0].id))

      // Note: referredByUserId would be set if they've registered
      // For now we track the relationship via the referral code
    }
  }

  const id = generateId()
  const referralCode = generateReferralCode()

  const entry = {
    id,
    email,
    name: input.name?.trim() || null,
    useCase: input.useCase?.trim() || null,
    source: input.source || 'organic',
    referredByUserId,
    referralCode,
    priority,
    status: 'waiting' as const
  }

  await db.insert(waitlist).values(entry)

  // Get the inserted entry with position
  const inserted = await db
    .select()
    .from(waitlist)
    .where(eq(waitlist.id, id))
    .limit(1)

  return {
    ...inserted[0]!,
    status: inserted[0]!.status as WaitlistStatus,
    alreadyExists: false
  } as WaitlistEntry & { alreadyExists: boolean }
}

/**
 * Gets waitlist status for an email or referral code.
 */
export async function getWaitlistStatus(emailOrCode: string): Promise<{
  entry: WaitlistEntry | null
  totalAhead: number
  referralCount: number
} | null> {
  const db = useDrizzle()
  const normalized = emailOrCode.trim().toLowerCase()

  // Try to find by email first, then by referral code
  let entry = await db
    .select()
    .from(waitlist)
    .where(eq(waitlist.email, normalized))
    .limit(1)
    .then(r => r[0])

  if (!entry) {
    entry = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.referralCode, emailOrCode.toUpperCase()))
      .limit(1)
      .then(r => r[0])
  }

  if (!entry) {
    return null
  }

  // Count entries ahead (higher priority or same priority but earlier position)
  const aheadResult = await db
    .select()
    .from(waitlist)
    .where(eq(waitlist.status, 'waiting'))

  const totalAhead = aheadResult.filter(e =>
    e.priority > entry!.priority ||
    (e.priority === entry!.priority && e.position < entry!.position)
  ).length

  // Count referrals (entries that used this entry's referral code)
  // We'd need to track this separately; for now return 0
  const referralCount = 0

  return {
    entry: {
      ...entry,
      status: entry.status as WaitlistStatus
    } as WaitlistEntry,
    totalAhead,
    referralCount
  }
}
