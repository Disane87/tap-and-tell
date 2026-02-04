import { useDrizzle, withTenantContext } from '~~/server/utils/drizzle'
import { analyticsEvents } from '~~/server/database/schema'
import { eq, and, gte, sql, count, countDistinct } from 'drizzle-orm'

/**
 * GET /api/tenants/:uuid/analytics/traffic
 * Returns traffic data over time for charts.
 * Requires authentication and tenant membership.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  requireScope(event, 'tenant:read')

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  if (!await canPerformAction(uuid, user.id, 'read')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // Parse query parameters
  const query = getQuery(event)
  const period = (query.period as string) || '7d'
  const granularity = (query.granularity as string) || 'day'
  const guestbookId = query.guestbook_id as string | undefined

  // Calculate date range
  const now = new Date()
  let startDate: Date
  let dateFormat: string

  switch (period) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      dateFormat = 'YYYY-MM-DD HH24:00'
      break
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFormat = 'YYYY-MM-DD'
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      dateFormat = 'YYYY-MM-DD'
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      dateFormat = granularity === 'week' ? 'IYYY-IW' : 'YYYY-MM-DD'
      break
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFormat = 'YYYY-MM-DD'
  }

  const db = useDrizzle()

  const trafficData = await withTenantContext(db, uuid, async () => {
    // Build conditions
    const conditions = guestbookId
      ? [eq(analyticsEvents.tenantId, uuid), eq(analyticsEvents.guestbookId, guestbookId), gte(analyticsEvents.createdAt, startDate)]
      : [eq(analyticsEvents.tenantId, uuid), gte(analyticsEvents.createdAt, startDate)]

    // Group by date/time period
    const results = await db
      .select({
        period: sql<string>`TO_CHAR(${analyticsEvents.createdAt}, ${dateFormat})`,
        pageViews: count(),
        uniqueVisitors: countDistinct(analyticsEvents.visitorId),
        sessions: countDistinct(analyticsEvents.sessionId)
      })
      .from(analyticsEvents)
      .where(and(...conditions, eq(analyticsEvents.eventType, 'page_view')))
      .groupBy(sql`TO_CHAR(${analyticsEvents.createdAt}, ${dateFormat})`)
      .orderBy(sql`TO_CHAR(${analyticsEvents.createdAt}, ${dateFormat})`)

    return results.map(r => ({
      period: r.period,
      pageViews: r.pageViews,
      uniqueVisitors: r.uniqueVisitors,
      sessions: r.sessions
    }))
  })

  return {
    success: true,
    data: {
      period,
      granularity,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      traffic: trafficData
    }
  }
})
