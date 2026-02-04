import { withTenantContext } from '~~/server/utils/drizzle'
import { analyticsEvents, analyticsSessions, entries, guestbooks } from '~~/server/database/schema'
import { eq, and, gte, sql, count, countDistinct } from 'drizzle-orm'

/**
 * GET /api/tenants/:uuid/analytics/overview
 * Returns analytics overview metrics for a tenant.
 * Supports filtering by guestbook and time period.
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

  // Calculate date range based on period
  const now = new Date()
  let startDate: Date
  let previousStartDate: Date
  let previousEndDate: Date

  switch (period) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
      previousEndDate = startDate
      break
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousEndDate = startDate
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      previousEndDate = startDate
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000)
      previousEndDate = startDate
      break
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousEndDate = startDate
  }

  // Use tenant context for RLS
  const metrics = await withTenantContext(uuid, async (db) => {
    // Build base conditions
    const currentConditions = guestbookId
      ? [eq(analyticsEvents.tenantId, uuid), eq(analyticsEvents.guestbookId, guestbookId), gte(analyticsEvents.createdAt, startDate)]
      : [eq(analyticsEvents.tenantId, uuid), gte(analyticsEvents.createdAt, startDate)]

    const previousConditions = guestbookId
      ? [eq(analyticsEvents.tenantId, uuid), eq(analyticsEvents.guestbookId, guestbookId), gte(analyticsEvents.createdAt, previousStartDate), sql`${analyticsEvents.createdAt} < ${previousEndDate}`]
      : [eq(analyticsEvents.tenantId, uuid), gte(analyticsEvents.createdAt, previousStartDate), sql`${analyticsEvents.createdAt} < ${previousEndDate}`]

    // Current period metrics
    const [currentPageViews] = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(and(...currentConditions, eq(analyticsEvents.eventType, 'page_view')))

    const [currentUniqueVisitors] = await db
      .select({ count: countDistinct(analyticsEvents.visitorId) })
      .from(analyticsEvents)
      .where(and(...currentConditions))

    const [currentSessions] = await db
      .select({ count: countDistinct(analyticsEvents.sessionId) })
      .from(analyticsEvents)
      .where(and(...currentConditions))

    const [currentFormStarts] = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(and(...currentConditions, eq(analyticsEvents.eventType, 'form_start')))

    const [currentFormSubmits] = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(and(...currentConditions, eq(analyticsEvents.eventType, 'form_submit')))

    // Previous period metrics for comparison
    const [previousPageViews] = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(and(...previousConditions, eq(analyticsEvents.eventType, 'page_view')))

    const [previousUniqueVisitors] = await db
      .select({ count: countDistinct(analyticsEvents.visitorId) })
      .from(analyticsEvents)
      .where(and(...previousConditions))

    const [previousSessions] = await db
      .select({ count: countDistinct(analyticsEvents.sessionId) })
      .from(analyticsEvents)
      .where(and(...previousConditions))

    const [previousFormStarts] = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(and(...previousConditions, eq(analyticsEvents.eventType, 'form_start')))

    const [previousFormSubmits] = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(and(...previousConditions, eq(analyticsEvents.eventType, 'form_submit')))

    // Get actual entry counts from entries table
    const entryConditions = guestbookId
      ? [eq(entries.guestbookId, guestbookId), gte(entries.createdAt, startDate)]
      : [gte(entries.createdAt, startDate)]

    // Get guestbook IDs for this tenant to filter entries
    const tenantGuestbooks = await db
      .select({ id: guestbooks.id })
      .from(guestbooks)
      .where(eq(guestbooks.tenantId, uuid))

    const guestbookIds = tenantGuestbooks.map(g => g.id)

    let entriesCreated = 0
    let entriesWithPhoto = 0
    let previousEntriesCreated = 0

    if (guestbookIds.length > 0) {
      const entryResults = await db
        .select({
          total: count(),
          withPhoto: sql<number>`COUNT(CASE WHEN ${entries.photoUrl} IS NOT NULL THEN 1 END)`
        })
        .from(entries)
        .where(
          guestbookId
            ? and(eq(entries.guestbookId, guestbookId), gte(entries.createdAt, startDate))
            : and(sql`${entries.guestbookId} = ANY(${guestbookIds})`, gte(entries.createdAt, startDate))
        )

      entriesCreated = entryResults[0]?.total || 0
      entriesWithPhoto = Number(entryResults[0]?.withPhoto) || 0

      // Previous period entries
      const prevEntryResults = await db
        .select({ total: count() })
        .from(entries)
        .where(
          guestbookId
            ? and(eq(entries.guestbookId, guestbookId), gte(entries.createdAt, previousStartDate), sql`${entries.createdAt} < ${previousEndDate}`)
            : and(sql`${entries.guestbookId} = ANY(${guestbookIds})`, gte(entries.createdAt, previousStartDate), sql`${entries.createdAt} < ${previousEndDate}`)
        )

      previousEntriesCreated = prevEntryResults[0]?.total || 0
    }

    // Calculate trends (percentage change)
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    // Calculate conversion rate (form submits / form starts)
    const conversionRate = currentFormStarts.count > 0
      ? Math.round((currentFormSubmits.count / currentFormStarts.count) * 100)
      : 0
    const previousConversionRate = previousFormStarts.count > 0
      ? Math.round((previousFormSubmits.count / previousFormStarts.count) * 100)
      : 0

    return {
      pageViews: {
        value: currentPageViews.count,
        trend: calculateTrend(currentPageViews.count, previousPageViews.count)
      },
      uniqueVisitors: {
        value: currentUniqueVisitors.count,
        trend: calculateTrend(currentUniqueVisitors.count, previousUniqueVisitors.count)
      },
      sessions: {
        value: currentSessions.count,
        trend: calculateTrend(currentSessions.count, previousSessions.count)
      },
      entriesCreated: {
        value: entriesCreated,
        trend: calculateTrend(entriesCreated, previousEntriesCreated)
      },
      entriesWithPhoto: {
        value: entriesWithPhoto,
        percentage: entriesCreated > 0 ? Math.round((entriesWithPhoto / entriesCreated) * 100) : 0
      },
      conversionRate: {
        value: conversionRate,
        trend: conversionRate - previousConversionRate
      },
      formStarts: {
        value: currentFormStarts.count,
        trend: calculateTrend(currentFormStarts.count, previousFormStarts.count)
      },
      formCompletions: {
        value: currentFormSubmits.count,
        trend: calculateTrend(currentFormSubmits.count, previousFormSubmits.count)
      }
    }
  })

  return {
    success: true,
    data: {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      metrics
    }
  }
})
