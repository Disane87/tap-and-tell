import { withTenantContext } from '~~/server/utils/drizzle'
import { analyticsEvents } from '~~/server/database/schema'
import { eq, and, gte, sql, count } from 'drizzle-orm'

/**
 * GET /api/tenants/:uuid/analytics/funnel
 * Returns form funnel data (step-by-step conversion).
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

  const funnelData = await withTenantContext(uuid, async (db) => {
    // Build base conditions
    const conditions = guestbookId
      ? [eq(analyticsEvents.tenantId, uuid), eq(analyticsEvents.guestbookId, guestbookId), gte(analyticsEvents.createdAt, startDate)]
      : [eq(analyticsEvents.tenantId, uuid), gte(analyticsEvents.createdAt, startDate)]

    // Count form starts
    const [formStarts] = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(and(...conditions, eq(analyticsEvents.eventType, 'form_start')))

    // Count each step completion
    const stepCounts = await db
      .select({
        step: sql<number>`(${analyticsEvents.properties}->>'step')::int`,
        count: count()
      })
      .from(analyticsEvents)
      .where(and(...conditions, eq(analyticsEvents.eventType, 'form_step_complete')))
      .groupBy(sql`(${analyticsEvents.properties}->>'step')::int`)
      .orderBy(sql`(${analyticsEvents.properties}->>'step')::int`)

    // Count form submissions
    const [formSubmits] = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(and(...conditions, eq(analyticsEvents.eventType, 'form_submit')))

    // Count form abandons by step
    const abandonCounts = await db
      .select({
        step: sql<number>`(${analyticsEvents.properties}->>'step')::int`,
        count: count()
      })
      .from(analyticsEvents)
      .where(and(...conditions, eq(analyticsEvents.eventType, 'form_abandon')))
      .groupBy(sql`(${analyticsEvents.properties}->>'step')::int`)

    // Build funnel steps (4-step wizard: Basics, Favorites, Fun, Message)
    const stepLabels = ['Basics', 'Favorites', 'Fun', 'Message', 'Submitted']
    const funnel = []

    // Step 0: Form started
    const step0Count = formStarts.count
    funnel.push({
      step: 0,
      label: 'Form Started',
      count: step0Count,
      percentage: 100,
      dropOffRate: 0
    })

    // Steps 1-4: Step completions
    let previousCount = step0Count
    for (let i = 1; i <= 4; i++) {
      const stepData = stepCounts.find(s => s.step === i)
      const currentCount = stepData?.count || 0

      const dropOffRate = previousCount > 0
        ? Math.round(((previousCount - currentCount) / previousCount) * 100)
        : 0

      funnel.push({
        step: i,
        label: stepLabels[i - 1],
        count: currentCount,
        percentage: step0Count > 0 ? Math.round((currentCount / step0Count) * 100) : 0,
        dropOffRate
      })

      previousCount = currentCount
    }

    // Step 5: Submitted
    const submitCount = formSubmits.count
    const submitDropOff = previousCount > 0
      ? Math.round(((previousCount - submitCount) / previousCount) * 100)
      : 0

    funnel.push({
      step: 5,
      label: 'Submitted',
      count: submitCount,
      percentage: step0Count > 0 ? Math.round((submitCount / step0Count) * 100) : 0,
      dropOffRate: submitDropOff
    })

    // Calculate overall conversion rate
    const conversionRate = step0Count > 0
      ? Math.round((submitCount / step0Count) * 100)
      : 0

    // Abandonment analysis
    const abandonMap = new Map(abandonCounts.map(a => [a.step, a.count]))

    return {
      funnel,
      conversionRate,
      totalStarts: step0Count,
      totalSubmissions: submitCount,
      abandonmentByStep: stepLabels.slice(0, 4).map((label, i) => ({
        step: i,
        label,
        abandons: abandonMap.get(i) || 0
      }))
    }
  })

  return {
    success: true,
    data: {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      ...funnelData
    }
  }
})
