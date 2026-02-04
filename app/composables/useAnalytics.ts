/**
 * Analytics composable for client-side event tracking.
 * Provides methods to track user interactions, page views, form progress, and conversions.
 * Events are batched and sent to the analytics API.
 */
import type { Ref } from 'vue'
import type { AnalyticsEventType, AnalyticsEventCategory, AnalyticsSource, AnalyticsDeviceType } from '~~/server/database/schema'

/** Analytics event data structure */
export interface AnalyticsEvent {
  eventType: AnalyticsEventType
  eventCategory: AnalyticsEventCategory
  guestbookId?: string
  pagePath?: string
  properties?: Record<string, unknown>
}

/** Device information detected from user agent */
interface DeviceInfo {
  deviceType: AnalyticsDeviceType
  browser: string
  os: string
}

/** Batch of events to send to the API */
interface EventBatch {
  events: Array<AnalyticsEvent & { sessionId: string; visitorId: string; timestamp: string }>
  deviceInfo: DeviceInfo
  referrer: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

// Module-level state (singleton)
const SESSION_KEY = 'tap_analytics_session'
const VISITOR_KEY = 'tap_analytics_visitor'
const BATCH_SIZE = 10
const BATCH_INTERVAL = 5000 // 5 seconds

let sessionId: string | null = null
let visitorId: string | null = null
let eventQueue: EventBatch['events'] = []
let batchTimer: ReturnType<typeof setTimeout> | null = null
let deviceInfo: DeviceInfo | null = null

/**
 * Generates a random session ID (per tab).
 */
function generateSessionId(): string {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Generates or retrieves a hashed visitor ID.
 * Rotates monthly for privacy.
 */
function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr'

  try {
    const stored = localStorage.getItem(VISITOR_KEY)
    if (stored) {
      const { id, month } = JSON.parse(stored)
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      if (month === currentMonth) {
        return id
      }
    }

    // Generate new visitor ID with current month
    const newId = `v_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`
    const currentMonth = new Date().toISOString().slice(0, 7)
    localStorage.setItem(VISITOR_KEY, JSON.stringify({ id: newId, month: currentMonth }))
    return newId
  } catch {
    // localStorage not available
    return `v_${Math.random().toString(36).substring(2, 11)}`
  }
}

/**
 * Detects device information from user agent.
 */
function detectDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined' || !navigator) {
    return { deviceType: 'desktop', browser: 'unknown', os: 'unknown' }
  }

  const ua = navigator.userAgent.toLowerCase()

  // Detect device type
  let deviceType: AnalyticsDeviceType = 'desktop'
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    deviceType = 'mobile'
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet'
  }

  // Detect browser
  let browser = 'unknown'
  if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('edg/')) browser = 'Edge'
  else if (ua.includes('chrome')) browser = 'Chrome'
  else if (ua.includes('safari')) browser = 'Safari'
  else if (ua.includes('opera') || ua.includes('opr/')) browser = 'Opera'

  // Detect OS
  let os = 'unknown'
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac')) os = 'macOS'
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'

  return { deviceType, browser, os }
}

/**
 * Gets UTM parameters from current URL.
 */
function getUtmParams(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined
  }
}

/**
 * Detects traffic source from URL and referrer.
 */
function detectSource(): AnalyticsSource {
  if (typeof window === 'undefined') return 'direct'

  const params = new URLSearchParams(window.location.search)

  // Check for explicit source parameter
  if (params.get('source') === 'nfc') return 'nfc'
  if (params.get('source') === 'qr') return 'qr'

  // Check referrer
  if (document.referrer) {
    try {
      const referrerHost = new URL(document.referrer).hostname
      const currentHost = window.location.hostname
      if (referrerHost !== currentHost) {
        return 'referral'
      }
    } catch {
      // Invalid referrer URL
    }
  }

  return 'direct'
}

/**
 * Sends batched events to the analytics API.
 */
async function flushEventQueue(): Promise<void> {
  if (eventQueue.length === 0) return

  const eventsToSend = [...eventQueue]
  eventQueue = []

  if (!deviceInfo) {
    deviceInfo = detectDeviceInfo()
  }

  const batch: EventBatch = {
    events: eventsToSend,
    deviceInfo,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    ...getUtmParams()
  }

  try {
    await $fetch('/api/analytics/events', {
      method: 'POST',
      body: batch
    })
  } catch (error) {
    // Re-queue events on failure (up to a limit)
    if (eventQueue.length < BATCH_SIZE * 3) {
      eventQueue = [...eventsToSend, ...eventQueue]
    }
    console.warn('[Analytics] Failed to send events:', error)
  }
}

/**
 * Schedules batch sending of events.
 */
function scheduleBatch(): void {
  if (batchTimer) return

  batchTimer = setTimeout(() => {
    batchTimer = null
    flushEventQueue()
  }, BATCH_INTERVAL)
}

/**
 * Analytics composable for tracking user interactions.
 * @param guestbookId - Optional guestbook ID to associate events with
 */
export function useAnalytics(guestbookId?: Ref<string> | string) {
  const gbId = guestbookId
    ? (typeof guestbookId === 'string' ? ref(guestbookId) : guestbookId)
    : ref<string | undefined>(undefined)

  // Initialize session on first use
  if (!sessionId) {
    sessionId = generateSessionId()
    // Store in sessionStorage for tab persistence
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        sessionId = stored
      } else {
        sessionStorage.setItem(SESSION_KEY, sessionId)
      }
    }
  }

  if (!visitorId) {
    visitorId = getOrCreateVisitorId()
  }

  if (!deviceInfo) {
    deviceInfo = detectDeviceInfo()
  }

  /**
   * Tracks a generic analytics event.
   */
  function track(
    eventType: AnalyticsEventType,
    eventCategory: AnalyticsEventCategory,
    properties?: Record<string, unknown>
  ): void {
    // Respect Do Not Track
    if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') {
      return
    }

    // Respect cookie consent - only track if analytics cookies are consented
    const { hasConsent } = useCookieConsent()
    if (!hasConsent('analytics')) {
      return
    }

    const event = {
      eventType,
      eventCategory,
      guestbookId: gbId.value,
      pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
      properties,
      sessionId: sessionId!,
      visitorId: visitorId!,
      timestamp: new Date().toISOString()
    }

    eventQueue.push(event)

    // Send immediately if batch is full
    if (eventQueue.length >= BATCH_SIZE) {
      flushEventQueue()
    } else {
      scheduleBatch()
    }
  }

  /**
   * Tracks a page view.
   */
  function trackPageView(path?: string): void {
    track('page_view', 'page', {
      path: path || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      source: detectSource()
    })
  }

  /**
   * Tracks page exit with time spent.
   */
  function trackPageExit(timeSpentSeconds: number): void {
    track('page_exit', 'page', {
      timeSpent: timeSpentSeconds
    })
  }

  /**
   * Tracks form wizard start.
   */
  function trackFormStart(): void {
    track('form_start', 'form', { step: 0 })
  }

  /**
   * Tracks form step completion.
   */
  function trackFormStep(step: number, durationSeconds?: number): void {
    track('form_step_complete', 'form', {
      step,
      duration: durationSeconds
    })
  }

  /**
   * Tracks form abandonment.
   */
  function trackFormAbandon(step: number, durationSeconds?: number): void {
    track('form_abandon', 'form', {
      step,
      duration: durationSeconds
    })
  }

  /**
   * Tracks successful form submission (conversion).
   */
  function trackConversion(hasPhoto: boolean): void {
    track('form_submit', 'form', {
      hasPhoto,
      source: detectSource()
    })
  }

  /**
   * Tracks entry view.
   */
  function trackEntryView(entryId: string): void {
    track('entry_view', 'entry', { entryId })
  }

  /**
   * Tracks entry share.
   */
  function trackEntryShare(entryId: string, method: string): void {
    track('entry_share', 'entry', { entryId, method })
  }

  /**
   * Tracks slideshow start.
   */
  function trackSlideshowStart(): void {
    track('slideshow_start', 'slideshow')
  }

  /**
   * Tracks slideshow exit.
   */
  function trackSlideshowExit(durationSeconds: number, slidesViewed: number): void {
    track('slideshow_exit', 'slideshow', {
      duration: durationSeconds,
      slidesViewed
    })
  }

  /**
   * Tracks PDF export.
   */
  function trackPdfExport(entryCount: number): void {
    track('pdf_export', 'export', { entryCount })
  }

  /**
   * Tracks QR code scan.
   */
  function trackQrScan(eventName?: string): void {
    track('qr_scan', 'qr', { eventName })
  }

  /**
   * Tracks NFC tap.
   */
  function trackNfcTap(eventName?: string): void {
    track('nfc_tap', 'nfc', { eventName })
  }

  /**
   * Tracks admin settings change.
   */
  function trackSettingsChange(settingKey: string): void {
    track('settings_change', 'admin', { settingKey })
  }

  /**
   * Tracks entry moderation action.
   */
  function trackEntryModerate(action: 'approve' | 'reject', entryId: string): void {
    track('entry_moderate', 'admin', { action, entryId })
  }

  /**
   * Forces immediate sending of queued events.
   */
  function flush(): void {
    if (batchTimer) {
      clearTimeout(batchTimer)
      batchTimer = null
    }
    flushEventQueue()
  }

  // Flush events when page is about to unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flush)
    window.addEventListener('pagehide', flush)
  }

  return {
    track,
    trackPageView,
    trackPageExit,
    trackFormStart,
    trackFormStep,
    trackFormAbandon,
    trackConversion,
    trackEntryView,
    trackEntryShare,
    trackSlideshowStart,
    trackSlideshowExit,
    trackPdfExport,
    trackQrScan,
    trackNfcTap,
    trackSettingsChange,
    trackEntryModerate,
    flush,
    sessionId: computed(() => sessionId),
    visitorId: computed(() => visitorId)
  }
}
