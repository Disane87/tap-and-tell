import { withTenantContext } from '~~/server/utils/drizzle'
import { analyticsEvents } from '~~/server/database/schema'
import { eq, and, gte, sql, count } from 'drizzle-orm'

/**
 * GET /api/tenants/:uuid/analytics/sources
 * Returns traffic source breakdown (NFC, QR, direct, referral).
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

  const sourcesData = await withTenantContext(uuid, async (db) => {
    // Build conditions for page views (first event in session determines source)
    const conditions = guestbookId
      ? [eq(analyticsEvents.tenantId, uuid), eq(analyticsEvents.guestbookId, guestbookId), gte(analyticsEvents.createdAt, startDate), eq(analyticsEvents.eventType, 'page_view')]
      : [eq(analyticsEvents.tenantId, uuid), gte(analyticsEvents.createdAt, startDate), eq(analyticsEvents.eventType, 'page_view')]

    // Count by source from properties
    const results = await db
      .select({
        source: sql<string>`COALESCE(${analyticsEvents.properties}->>'source', 'direct')`,
        count: count()
      })
      .from(analyticsEvents)
      .where(and(...conditions))
      .groupBy(sql`COALESCE(${analyticsEvents.properties}->>'source', 'direct')`)

    // Calculate totals and percentages
    const total = results.reduce((sum, r) => sum + r.count, 0)

    // Normalize source names and calculate percentages
    const sourceMap: Record<string, { count: number; percentage: number }> = {
      nfc: { count: 0, percentage: 0 },
      qr: { count: 0, percentage: 0 },
      direct: { count: 0, percentage: 0 },
      referral: { count: 0, percentage: 0 }
    }

    for (const r of results) {
      const source = r.source.toLowerCase()
      if (source in sourceMap) {
        sourceMap[source].count = r.count
        sourceMap[source].percentage = total > 0 ? Math.round((r.count / total) * 100) : 0
      } else {
        // Map unknown sources to referral
        sourceMap.referral.count += r.count
      }
    }

    // Recalculate referral percentage after mapping
    if (total > 0) {
      sourceMap.referral.percentage = Math.round((sourceMap.referral.count / total) * 100)
    }

    return {
      total,
      sources: [
        { name: 'nfc', label: 'NFC Tap', ...sourceMap.nfc },
        { name: 'qr', label: 'QR Code', ...sourceMap.qr },
        { name: 'direct', label: 'Direct Link', ...sourceMap.direct },
        { name: 'referral', label: 'Referral', ...sourceMap.referral }
      ]
    }
  })

  return {
    success: true,
    data: {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      ...sourcesData
    }
  }
})
