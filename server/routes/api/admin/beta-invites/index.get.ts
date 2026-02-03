import { eq, like, isNull, isNotNull, lt, desc, asc, and, or } from 'drizzle-orm'
import { betaInvites } from '~~/server/database/schema'

/**
 * GET /api/admin/beta-invites
 * Lists all beta invites with pagination and filters.
 *
 * Query parameters:
 * - status: 'pending' | 'accepted' | 'expired' (optional)
 * - source: 'manual' | 'waitlist' (optional)
 * - email: search by email (optional)
 * - page: page number (default: 1)
 * - limit: items per page (default: 50)
 *
 * Requires admin authentication.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const status = query.status as string | undefined
  const source = query.source as string | undefined
  const emailSearch = query.email as string | undefined
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 50))
  const offset = (page - 1) * limit

  const db = useDrizzle()

  // Build filter conditions
  const conditions = []

  if (status === 'pending') {
    conditions.push(and(isNull(betaInvites.acceptedAt), lt(new Date(), betaInvites.expiresAt)))
  } else if (status === 'accepted') {
    conditions.push(isNotNull(betaInvites.acceptedAt))
  } else if (status === 'expired') {
    conditions.push(and(isNull(betaInvites.acceptedAt), lt(betaInvites.expiresAt, new Date())))
  }

  if (source) {
    conditions.push(eq(betaInvites.source, source))
  }

  if (emailSearch) {
    conditions.push(like(betaInvites.email, `%${emailSearch.toLowerCase()}%`))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Get total count
  const countResult = await db
    .select()
    .from(betaInvites)
    .where(whereClause)

  const total = countResult.length

  // Get paginated results
  const results = await db
    .select()
    .from(betaInvites)
    .where(whereClause)
    .orderBy(desc(betaInvites.createdAt))
    .limit(limit)
    .offset(offset)

  // Add computed status field
  const invitesWithStatus = results.map(invite => {
    let computedStatus: 'pending' | 'accepted' | 'expired'
    if (invite.acceptedAt) {
      computedStatus = 'accepted'
    } else if (new Date() > invite.expiresAt) {
      computedStatus = 'expired'
    } else {
      computedStatus = 'pending'
    }

    return {
      ...invite,
      status: computedStatus
    }
  })

  return {
    success: true,
    data: {
      invites: invitesWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
})
