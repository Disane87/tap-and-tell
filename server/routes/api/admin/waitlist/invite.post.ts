import { eq, desc, and } from 'drizzle-orm'
import { waitlist } from '~~/server/database/schema'
import { createBetaInvite } from '~~/server/utils/beta'

interface InviteFromWaitlistBody {
  /** Number of top entries to invite (by priority). */
  count?: number
  /** Specific waitlist entry IDs to invite. */
  ids?: string[]
  /** Minimum priority score to invite. */
  minPriority?: number
  /** Plan to grant on registration. */
  grantedPlan?: 'free' | 'pro' | 'business'
  /** Days until invite expires. */
  expiresInDays?: number
  /** Send invite emails. */
  sendEmails?: boolean
}

/**
 * POST /api/admin/waitlist/invite
 * Batch invites users from the waitlist.
 *
 * Body (one of count or ids required):
 * - count: number (invite top N by priority)
 * - ids: string[] (invite specific entries)
 * - minPriority: number (optional, only invite if priority >= value)
 * - grantedPlan: 'free' | 'pro' | 'business' (default: 'pro')
 * - expiresInDays: number (default: 30)
 * - sendEmails: boolean (default: true)
 *
 * Requires admin authentication.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<InviteFromWaitlistBody>(event)

  if (!body?.count && !body?.ids) {
    throw createError({
      statusCode: 400,
      message: 'Either count or ids is required'
    })
  }

  const db = useDrizzle()
  let entriesToInvite: typeof waitlist.$inferSelect[] = []

  if (body.ids && body.ids.length > 0) {
    // Invite specific entries
    for (const id of body.ids) {
      const entry = await db
        .select()
        .from(waitlist)
        .where(and(eq(waitlist.id, id), eq(waitlist.status, 'waiting')))
        .limit(1)

      if (entry[0]) {
        entriesToInvite.push(entry[0])
      }
    }
  } else if (body.count) {
    // Invite top N by priority
    const query = db
      .select()
      .from(waitlist)
      .where(eq(waitlist.status, 'waiting'))
      .orderBy(desc(waitlist.priority), waitlist.position)
      .limit(body.count)

    entriesToInvite = await query

    // Filter by minimum priority if specified
    if (body.minPriority !== undefined) {
      entriesToInvite = entriesToInvite.filter(e => e.priority >= body.minPriority!)
    }
  }

  if (entriesToInvite.length === 0) {
    return {
      success: true,
      data: {
        invited: 0,
        message: 'No eligible entries found'
      }
    }
  }

  const results = {
    invited: 0,
    failed: 0,
    emailsSent: 0,
    emailsFailed: 0,
    invites: [] as Array<{ email: string; waitlistId: string }>
  }

  for (const entry of entriesToInvite) {
    try {
      // Create beta invite
      const invite = await createBetaInvite({
        email: entry.email,
        grantedPlan: body.grantedPlan || 'pro',
        expiresInDays: body.expiresInDays || 30,
        source: 'waitlist'
      })

      // Update waitlist entry status
      await db
        .update(waitlist)
        .set({
          status: 'invited',
          invitedAt: new Date()
        })
        .where(eq(waitlist.id, entry.id))

      results.invited++
      results.invites.push({
        email: entry.email,
        waitlistId: entry.id
      })

      // Send email unless disabled — use stored locale from waitlist entry
      if (body.sendEmails !== false) {
        try {
          const entryLocale = entry.locale || 'en'
          const dateLocale = entryLocale === 'de' ? 'de-DE' : 'en-US'
          const siteUrl = process.env.PUBLIC_URL || 'https://tap-and-tell.com'
          const inviteUrl = `${siteUrl}/register?token=${invite.token}`

          await sendTemplateEmail(
            'beta_invite',
            entry.email,
            {
              inviteUrl,
              plan: (body.grantedPlan || 'pro').toUpperCase(),
              expiresAt: invite.expiresAt.toLocaleDateString(dateLocale),
              appName: 'Tap & Tell'
            },
            {
              locale: entryLocale,
              category: 'invite',
              metadata: { waitlistId: entry.id }
            }
          )
          results.emailsSent++
        } catch {
          results.emailsFailed++
        }
      }
    } catch (error) {
      console.error(`Failed to invite ${entry.email}:`, error)
      results.failed++
    }
  }

  const user = event.context.user as { id: string; email: string }
  await recordAuditLog(event, 'beta.waitlist_batch_invited', {
    userId: user.id,
    details: {
      invited: results.invited,
      failed: results.failed,
      grantedPlan: body.grantedPlan || 'pro'
    }
  })

  return {
    success: true,
    data: results
  }
})
