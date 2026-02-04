import { withTenantContext } from '~~/server/utils/drizzle'
import { analyticsEvents } from '~~/server/database/schema'
import { eq, and, gte, sql, count, countDistinct } from 'drizzle-orm'

/**
 * GET /api/tenants/:uuid/analytics/devices
 * Returns device breakdown (mobile, tablet, desktop) and browser/OS stats.
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
  const guestbookId = query.guestbook_id as string | undefined

  // Calculate date range
  const now = new Date()
  let startDate: Date

  switch (period) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  const devicesData = await withTenantContext(uuid, async (db) => {
    // Build conditions
    const conditions = guestbookId
      ? [eq(analyticsEvents.tenantId, uuid), eq(analyticsEvents.guestbookId, guestbookId), gte(analyticsEvents.createdAt, startDate)]
      : [eq(analyticsEvents.tenantId, uuid), gte(analyticsEvents.createdAt, startDate)]

    // Device type breakdown (count unique sessions)
    const deviceResults = await db
      .select({
        deviceType: analyticsEvents.deviceType,
        sessions: countDistinct(analyticsEvents.sessionId)
      })
      .from(analyticsEvents)
      .where(and(...conditions))
      .groupBy(analyticsEvents.deviceType)

    // Browser breakdown
    const browserResults = await db
      .select({
        browser: analyticsEvents.browser,
        sessions: countDistinct(analyticsEvents.sessionId)
      })
      .from(analyticsEvents)
      .where(and(...conditions))
      .groupBy(analyticsEvents.browser)
      .orderBy(sql`COUNT(DISTINCT ${analyticsEvents.sessionId}) DESC`)
      .limit(10)

    // OS breakdown
    const osResults = await db
      .select({
        os: analyticsEvents.os,
        sessions: countDistinct(analyticsEvents.sessionId)
      })
      .from(analyticsEvents)
      .where(and(...conditions))
      .groupBy(analyticsEvents.os)
      .orderBy(sql`COUNT(DISTINCT ${analyticsEvents.sessionId}) DESC`)
      .limit(10)

    // Calculate totals and percentages for devices
    const deviceTotal = deviceResults.reduce((sum, r) => sum + r.sessions, 0)

    const devices = [
      { name: 'mobile', label: 'Mobile', count: 0, percentage: 0 },
      { name: 'tablet', label: 'Tablet', count: 0, percentage: 0 },
      { name: 'desktop', label: 'Desktop', count: 0, percentage: 0 }
    ]

    for (const r of deviceResults) {
      const device = devices.find(d => d.name === r.deviceType)
      if (device) {
        device.count = r.sessions
        device.percentage = deviceTotal > 0 ? Math.round((r.sessions / deviceTotal) * 100) : 0
      }
    }

    // Calculate totals for browsers and OS
    const browserTotal = browserResults.reduce((sum, r) => sum + r.sessions, 0)
    const osTotal = osResults.reduce((sum, r) => sum + r.sessions, 0)

    return {
      total: deviceTotal,
      devices,
      browsers: browserResults.map(r => ({
        name: r.browser || 'Unknown',
        count: r.sessions,
        percentage: browserTotal > 0 ? Math.round((r.sessions / browserTotal) * 100) : 0
      })),
      operatingSystems: osResults.map(r => ({
        name: r.os || 'Unknown',
        count: r.sessions,
        percentage: osTotal > 0 ? Math.round((r.sessions / osTotal) * 100) : 0
      }))
    }
  })

  return {
    success: true,
    data: {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      ...devicesData
    }
  }
})
