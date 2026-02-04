import { nanoid } from 'nanoid'
import { useDrizzle } from '~~/server/utils/drizzle'
import { analyticsEvents, analyticsSessions } from '~~/server/database/schema'
import { resolveTenantFromGuestbook } from '~~/server/utils/guestbook-resolver'
import type { AnalyticsEventType, AnalyticsEventCategory } from '~~/server/database/schema'

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

  const db = useDrizzle()
  const insertedEvents: string[] = []
  const sessionUpdates = new Map<string, { guestbookId?: string; tenantId?: string; source?: string }>()

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

    // Resolve tenant from guestbook if provided
    let tenantId: string | null = null
    if (eventData.guestbookId) {
      tenantId = await resolveTenantFromGuestbook(eventData.guestbookId)
      if (!tenantId) {
        continue // Skip events for non-existent guestbooks
      }
    } else {
      continue // Skip events without guestbook context
    }

    // Track session info for updates
    if (!sessionUpdates.has(eventData.sessionId)) {
      sessionUpdates.set(eventData.sessionId, {
        guestbookId: eventData.guestbookId,
        tenantId: tenantId,
        source: eventData.properties?.source as string | undefined
      })
    }

    const eventId = nanoid()

    // Insert event
    await db.insert(analyticsEvents).values({
      id: eventId,
      tenantId: tenantId,
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

    insertedEvents.push(eventId)
  }

  // Update or create sessions
  for (const [sessId, info] of sessionUpdates.entries()) {
    if (!info.tenantId || !info.guestbookId) continue

    try {
      // Try to upsert session info
      await db.insert(analyticsSessions).values({
        id: sessId,
        tenantId: info.tenantId,
        guestbookId: info.guestbookId,
        visitorId: body.events[0]?.visitorId,
        startedAt: new Date(),
        entryPage: body.events[0]?.pagePath?.slice(0, 255),
        source: info.source?.slice(0, 20),
        referrer: body.referrer?.slice(0, 500),
        deviceType: body.deviceInfo.deviceType,
        browser: body.deviceInfo.browser?.slice(0, 50),
        os: body.deviceInfo.os?.slice(0, 50),
        pageCount: 1,
        converted: false,
        formStepReached: 0
      }).onConflictDoNothing()
    } catch {
      // Session already exists, that's fine
    }
  }

  return {
    success: true,
    processed: insertedEvents.length
  }
})
