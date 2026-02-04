/**
 * Composable for fetching analytics data from the API.
 * Provides methods to fetch overview, traffic, sources, devices, and funnel data.
 */
import type { Ref } from 'vue'

/** Analytics overview metrics */
export interface AnalyticsOverview {
  period: string
  startDate: string
  endDate: string
  metrics: {
    pageViews: { value: number; trend: number }
    uniqueVisitors: { value: number; trend: number }
    sessions: { value: number; trend: number }
    entriesCreated: { value: number; trend: number }
    entriesWithPhoto: { value: number; percentage: number }
    conversionRate: { value: number; trend: number }
    formStarts: { value: number; trend: number }
    formCompletions: { value: number; trend: number }
  }
}

/** Traffic data point */
export interface TrafficDataPoint {
  period: string
  pageViews: number
  uniqueVisitors: number
  sessions: number
}

/** Traffic data response */
export interface AnalyticsTraffic {
  period: string
  granularity: string
  startDate: string
  endDate: string
  traffic: TrafficDataPoint[]
}

/** Source breakdown item */
export interface SourceItem {
  name: string
  label: string
  count: number
  percentage: number
}

/** Sources data response */
export interface AnalyticsSources {
  period: string
  startDate: string
  endDate: string
  total: number
  sources: SourceItem[]
}

/** Device breakdown item */
export interface DeviceItem {
  name: string
  label: string
  count: number
  percentage: number
}

/** Browser/OS item */
export interface BrowserOsItem {
  name: string
  count: number
  percentage: number
}

/** Devices data response */
export interface AnalyticsDevices {
  period: string
  startDate: string
  endDate: string
  total: number
  devices: DeviceItem[]
  browsers: BrowserOsItem[]
  operatingSystems: BrowserOsItem[]
}

/** Funnel step data */
export interface FunnelStep {
  step: number
  label: string
  count: number
  percentage: number
  dropOffRate: number
}

/** Abandonment by step data */
export interface AbandonmentStep {
  step: number
  label: string
  abandons: number
}

/** Funnel data response */
export interface AnalyticsFunnel {
  period: string
  startDate: string
  endDate: string
  funnel: FunnelStep[]
  conversionRate: number
  totalStarts: number
  totalSubmissions: number
  abandonmentByStep: AbandonmentStep[]
}

/** Time period options */
export type AnalyticsPeriod = '24h' | '7d' | '30d' | '90d'

// Module-level state
const overview = ref<AnalyticsOverview | null>(null)
const traffic = ref<AnalyticsTraffic | null>(null)
const sources = ref<AnalyticsSources | null>(null)
const devices = ref<AnalyticsDevices | null>(null)
const funnel = ref<AnalyticsFunnel | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

/**
 * Composable for fetching analytics data.
 * @param tenantId - Tenant ID to fetch analytics for
 */
export function useAnalyticsData(tenantId: Ref<string> | string) {
  const id = typeof tenantId === 'string' ? ref(tenantId) : tenantId

  /**
   * Fetches overview metrics.
   */
  async function fetchOverview(period: AnalyticsPeriod = '7d', guestbookId?: string): Promise<void> {
    if (!id.value) return

    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({ period })
      if (guestbookId) params.set('guestbook_id', guestbookId)

      const response = await $fetch<{ success: boolean; data?: AnalyticsOverview }>(
        `/api/tenants/${id.value}/analytics/overview?${params}`
      )

      if (response.success && response.data) {
        overview.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch analytics overview:', err)
      error.value = 'Failed to load analytics overview'
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches traffic data for charts.
   */
  async function fetchTraffic(period: AnalyticsPeriod = '7d', guestbookId?: string, granularity = 'day'): Promise<void> {
    if (!id.value) return

    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({ period, granularity })
      if (guestbookId) params.set('guestbook_id', guestbookId)

      const response = await $fetch<{ success: boolean; data?: AnalyticsTraffic }>(
        `/api/tenants/${id.value}/analytics/traffic?${params}`
      )

      if (response.success && response.data) {
        traffic.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch analytics traffic:', err)
      error.value = 'Failed to load traffic data'
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches source breakdown.
   */
  async function fetchSources(period: AnalyticsPeriod = '7d', guestbookId?: string): Promise<void> {
    if (!id.value) return

    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({ period })
      if (guestbookId) params.set('guestbook_id', guestbookId)

      const response = await $fetch<{ success: boolean; data?: AnalyticsSources }>(
        `/api/tenants/${id.value}/analytics/sources?${params}`
      )

      if (response.success && response.data) {
        sources.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch analytics sources:', err)
      error.value = 'Failed to load sources data'
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches device breakdown.
   */
  async function fetchDevices(period: AnalyticsPeriod = '7d', guestbookId?: string): Promise<void> {
    if (!id.value) return

    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({ period })
      if (guestbookId) params.set('guestbook_id', guestbookId)

      const response = await $fetch<{ success: boolean; data?: AnalyticsDevices }>(
        `/api/tenants/${id.value}/analytics/devices?${params}`
      )

      if (response.success && response.data) {
        devices.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch analytics devices:', err)
      error.value = 'Failed to load devices data'
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches funnel data.
   */
  async function fetchFunnel(period: AnalyticsPeriod = '7d', guestbookId?: string): Promise<void> {
    if (!id.value) return

    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({ period })
      if (guestbookId) params.set('guestbook_id', guestbookId)

      const response = await $fetch<{ success: boolean; data?: AnalyticsFunnel }>(
        `/api/tenants/${id.value}/analytics/funnel?${params}`
      )

      if (response.success && response.data) {
        funnel.value = response.data
      }
    } catch (err) {
      console.error('Failed to fetch analytics funnel:', err)
      error.value = 'Failed to load funnel data'
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches all analytics data.
   */
  async function fetchAll(period: AnalyticsPeriod = '7d', guestbookId?: string): Promise<void> {
    await Promise.all([
      fetchOverview(period, guestbookId),
      fetchTraffic(period, guestbookId),
      fetchSources(period, guestbookId),
      fetchDevices(period, guestbookId),
      fetchFunnel(period, guestbookId)
    ])
  }

  /**
   * Clears all analytics data.
   */
  function clear(): void {
    overview.value = null
    traffic.value = null
    sources.value = null
    devices.value = null
    funnel.value = null
    error.value = null
  }

  return {
    overview,
    traffic,
    sources,
    devices,
    funnel,
    loading,
    error,
    fetchOverview,
    fetchTraffic,
    fetchSources,
    fetchDevices,
    fetchFunnel,
    fetchAll,
    clear
  }
}
