import { eq, like, desc, and } from 'drizzle-orm'
import { waitlist } from '~~/server/database/schema'
import type { WaitlistStatus } from '~~/server/database/schema'

/**
 * GET /api/admin/waitlist
 * Lists all waitlist entries with pagination and filters.
 *
 * Query parameters:
 * - status: 'waiting' | 'invited' | 'registered' | 'unsubscribed' (optional)
 * - email: search by email (optional)
 * - page: page number (default: 1)
 * - limit: items per page (default: 50)
 * - sort: 'position' | 'priority' | 'createdAt' (default: 'priority')
 *
 * Requires admin authentication.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const status = query.status as WaitlistStatus | undefined
  const emailSearch = query.email as string | undefined
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 50))
  const offset = (page - 1) * limit

  const db = useDrizzle()

  // Build filter conditions
  const conditions = []

  if (status) {
    conditions.push(eq(waitlist.status, status))
  }

  if (emailSearch) {
    conditions.push(like(waitlist.email, `%${emailSearch.toLowerCase()}%`))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // Get total count
  const countResult = await db
    .select()
    .from(waitlist)
    .where(whereClause)

  const total = countResult.length

  // Get paginated results, sorted by priority (highest first), then position
  const results = await db
    .select()
    .from(waitlist)
    .where(whereClause)
    .orderBy(desc(waitlist.priority), waitlist.position)
    .limit(limit)
    .offset(offset)

  // Get stats
  const allEntries = await db.select().from(waitlist)
  const stats = {
    total: allEntries.length,
    waiting: allEntries.filter(e => e.status === 'waiting').length,
    invited: allEntries.filter(e => e.status === 'invited').length,
    registered: allEntries.filter(e => e.status === 'registered').length,
    unsubscribed: allEntries.filter(e => e.status === 'unsubscribed').length
  }

  return {
    success: true,
    data: {
      entries: results,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
})
