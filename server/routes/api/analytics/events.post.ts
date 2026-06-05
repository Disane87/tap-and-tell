import { nanoid } from 'nanoid'
import { withTenantContext } from '~~/server/utils/drizzle'
import { analyticsEvents, analyticsSessions } from '~~/server/database/schema'
import { resolveTenantFromGuestbook } from '~~/server/utils/guestbook-resolver'
import type { AnalyticsEventType, AnalyticsEventCategory } from '~~/server/database/schema'

/**
 * A single analytics event row prepared for insertion, scoped to a tenant.
 */
type PreparedEventRow = typeof analyticsEvents.$inferInsert

/**
 * A session upsert row prepared for insertion, scoped to a tenant.
 */
type PreparedSessionRow = typeof analyticsSessions.$inferInsert

/**
 * All analytics writes grouped under a single tenant so they can be wrapped
 * in one RLS-scoped transaction via `withTenantContext`. Sessions are keyed
 * by session ID so each session is upserted at most once per request.
 */
interface TenantBatch {
  events: PreparedEventRow[]
  sessions: Map<string, PreparedSessionRow>
}

/**
 * Event batch request body structure.
 */
interface EventBatchRequest {
  events: Array<{
    eventType: AnalyticsEventType
    eventCategory: AnalyticsEventCategory
    guestbookId?: string
    pagePath?: string
    properties?: Record<string, unknown>
    sessionId: string
    visitorId: string
    timestamp: string
  }>
  deviceInfo: {
    deviceType: 'mobile' | 'tablet' | 'desktop'
    browser: string
    os: string
  }
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

// Rate limiter: max 100 events per session per minute
const sessionEventCounts = new Map<string, { count: number; resetAt: number }>()

function checkSessionRateLimit(sessionId: string): boolean {
  const now = Date.now()
  const entry = sessionEventCounts.get(sessionId)

  if (!entry || now > entry.resetAt) {
    sessionEventCounts.set(sessionId, { count: 1, resetAt: now + 60000 })
    return true
  }

  if (entry.count >= 100) {
    return false
  }

  entry.count++
  return true
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [sessionId, entry] of sessionEventCounts.entries()) {
    if (now > entry.resetAt + 300000) { // Remove after 5 minutes of inactivity
      sessionEventCounts.delete(sessionId)
    }
  }
}, 60000)

/**
 * Valid event types for validation.
 */
const VALID_EVENT_TYPES: AnalyticsEventType[] = [
  'page_view', 'page_exit', 'form_start', 'form_step_complete',
  'form_abandon', 'form_submit', 'entry_view', 'entry_share',
  'slideshow_start', 'slideshow_exit', 'pdf_export', 'qr_scan',
  'nfc_tap', 'settings_change', 'entry_moderate'
]

/**
 * Valid event categories for validation.
 */
const VALID_EVENT_CATEGORIES: AnalyticsEventCategory[] = [
  'page', 'form', 'entry', 'slideshow', 'export', 'qr', 'nfc', 'admin'
]

/**
 * POST /api/analytics/events
 * Receives batched analytics events from the client.
 * No authentication required (public tracking).
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<EventBatchRequest>(event)

  // Validate request structure
  if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
    throw createError({ statusCode: 400, message: 'Events array is required' })
  }

  if (body.events.length > 50) {
    throw createError({ statusCode: 400, message: 'Maximum 50 events per batch' })
  }

  // Get first session ID for rate limiting
  const sessionId = body.events[0]?.sessionId
  if (!sessionId) {
    throw createError({ statusCode: 400, message: 'Session ID is required' })
  }

  // Check rate limit
  if (!checkSessionRateLimit(sessionId)) {
    throw createError({ statusCode: 429, message: 'Too many events. Please slow down.' })
  }

  // Group all writes by resolved tenant. Each tenant's events and session
  // upserts are later inserted inside a single `withTenantContext` transaction
  // so that the RLS `WITH CHECK (tenant_id = current_setting('app.current_tenant_id'))`
  // policy on analytics_events / analytics_sessions is satisfied. Without the
  // SET LOCAL tenant context, the setting is NULL and every INSERT silently
  // fails its WITH CHECK under a non-superuser DB role.
  const tenantBatches = new Map<string, TenantBatch>()

  // Cache guestbook -> tenant resolutions to avoid duplicate lookups per batch.
  const tenantCache = new Map<string, string | null>()

  // Process each event
  for (const eventData of body.events) {
    // Validate event type
    if (!VALID_EVENT_TYPES.includes(eventData.eventType)) {
      continue // Skip invalid event types
    }

    // Validate event category
    if (!VALID_EVENT_CATEGORIES.includes(eventData.eventCategory)) {
      continue
    }

    // Events without guestbook context cannot be tenant-scoped → skip.
    if (!eventData.guestbookId) {
      continue
    }

    // Resolve tenant from guestbook (cached per request).
    let tenantId: string | null
    if (tenantCache.has(eventData.guestbookId)) {
      tenantId = tenantCache.get(eventData.guestbookId) ?? null
    } else {
      tenantId = await resolveTenantFromGuestbook(eventData.guestbookId)
      tenantCache.set(eventData.guestbookId, tenantId)
    }
    if (!tenantId) {
      continue // Skip events for non-existent guestbooks
    }

    // Lazily create the per-tenant batch.
    let batch = tenantBatches.get(tenantId)
    if (!batch) {
      batch = { events: [], sessions: new Map() }
      tenantBatches.set(tenantId, batch)
    }

    // Track session info for upsert (first event per session wins).
    if (!batch.sessions.has(eventData.sessionId)) {
      const source = eventData.properties?.source as string | undefined
      batch.sessions.set(eventData.sessionId, {
        id: eventData.sessionId,
        tenantId,
        guestbookId: eventData.guestbookId,
        visitorId: body.events[0]?.visitorId,
        startedAt: new Date(),
        entryPage: body.events[0]?.pagePath?.slice(0, 255),
        source: source?.slice(0, 20),
        referrer: body.referrer?.slice(0, 500),
        deviceType: body.deviceInfo.deviceType,
        browser: body.deviceInfo.browser?.slice(0, 50),
        os: body.deviceInfo.os?.slice(0, 50),
        pageCount: 1,
        converted: false,
        formStepReached: 0
      })
    }

    // Prepare the event row for insertion.
    batch.events.push({
      id: nanoid(),
      tenantId,
      guestbookId: eventData.guestbookId,
      eventType: eventData.eventType,
      eventCategory: eventData.eventCategory,
      sessionId: eventData.sessionId,
      visitorId: eventData.visitorId,
      pagePath: eventData.pagePath?.slice(0, 255),
      referrer: body.referrer?.slice(0, 500),
      utmSource: body.utmSource?.slice(0, 100),
      utmMedium: body.utmMedium?.slice(0, 100),
      utmCampaign: body.utmCampaign?.slice(0, 100),
      deviceType: body.deviceInfo.deviceType,
      browser: body.deviceInfo.browser?.slice(0, 50),
      os: body.deviceInfo.os?.slice(0, 50),
      properties: eventData.properties || {},
      createdAt: new Date(eventData.timestamp)
    })
  }

  let processed = 0

  // Persist each tenant's batch inside its own RLS-scoped transaction.
  for (const [tenantId, batch] of tenantBatches.entries()) {
    await withTenantContext(tenantId, async (db) => {
      // Insert events for this tenant.
      if (batch.events.length > 0) {
        await db.insert(analyticsEvents).values(batch.events)
        processed += batch.events.length
      }

      // Upsert sessions for this tenant in a single conflict-safe statement.
      // `onConflictDoNothing` handles existing sessions without raising, which
      // keeps this best-effort and avoids aborting the surrounding transaction.
      const sessionValues = Array.from(batch.sessions.values())
      if (sessionValues.length > 0) {
        await db.insert(analyticsSessions)
          .values(sessionValues)
          .onConflictDoNothing()
      }
    })
  }

  return {
    success: true,
    processed
  }
})
