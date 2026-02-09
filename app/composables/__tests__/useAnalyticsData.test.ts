import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'

/**
 * Mock $fetch for API calls
 */
const mockFetch = vi.fn()

// Type imports only (values imported dynamically)
import type {
  AnalyticsOverview,
  AnalyticsTraffic,
  AnalyticsSources,
  AnalyticsDevices,
  AnalyticsFunnel
} from '../useAnalyticsData'

/**
 * Unit tests for useAnalyticsData composable.
 * Tests analytics data fetching: overview, traffic, sources, devices, funnel.
 * Uses module-level shared state.
 *
 * Uses dynamic imports with vi.resetModules() to ensure module-level
 * refs (overview, traffic, sources, devices, funnel, loading, error)
 * are freshly created for each test, and that vi.stubGlobal calls
 * run before the composable module is evaluated.
 */
describe('useAnalyticsData', () => {
  let useAnalyticsData: typeof import('../useAnalyticsData')['useAnalyticsData']

  const mockOverview: AnalyticsOverview = {
    period: '7d',
    startDate: '2024-01-01',
    endDate: '2024-01-07',
    metrics: {
      pageViews: { value: 1500, trend: 12.5 },
      uniqueVisitors: { value: 800, trend: 8.3 },
      sessions: { value: 900, trend: 5.1 },
      entriesCreated: { value: 45, trend: 15.0 },
      entriesWithPhoto: { value: 30, percentage: 66.7 },
      conversionRate: { value: 5.6, trend: -1.2 },
      formStarts: { value: 120, trend: 10.0 },
      formCompletions: { value: 45, trend: 15.0 }
    }
  }

  const mockTraffic: AnalyticsTraffic = {
    period: '7d',
    granularity: 'day',
    startDate: '2024-01-01',
    endDate: '2024-01-07',
    traffic: [
      { period: '2024-01-01', pageViews: 200, uniqueVisitors: 120, sessions: 130 },
      { period: '2024-01-02', pageViews: 250, uniqueVisitors: 140, sessions: 150 }
    ]
  }

  const mockSources: AnalyticsSources = {
    period: '7d',
    startDate: '2024-01-01',
    endDate: '2024-01-07',
    total: 900,
    sources: [
      { name: 'direct', label: 'Direct', count: 450, percentage: 50 },
      { name: 'nfc', label: 'NFC', count: 300, percentage: 33.3 },
      { name: 'qr', label: 'QR Code', count: 150, percentage: 16.7 }
    ]
  }

  const mockDevices: AnalyticsDevices = {
    period: '7d',
    startDate: '2024-01-01',
    endDate: '2024-01-07',
    total: 800,
    devices: [
      { name: 'mobile', label: 'Mobile', count: 600, percentage: 75 },
      { name: 'desktop', label: 'Desktop', count: 200, percentage: 25 }
    ],
    browsers: [
      { name: 'Chrome', count: 500, percentage: 62.5 },
      { name: 'Safari', count: 200, percentage: 25 }
    ],
    operatingSystems: [
      { name: 'iOS', count: 400, percentage: 50 },
      { name: 'Android', count: 300, percentage: 37.5 }
    ]
  }

  const mockFunnel: AnalyticsFunnel = {
    period: '7d',
    startDate: '2024-01-01',
    endDate: '2024-01-07',
    funnel: [
      { step: 1, label: 'Page View', count: 900, percentage: 100, dropOffRate: 0 },
      { step: 2, label: 'Form Start', count: 120, percentage: 13.3, dropOffRate: 86.7 },
      { step: 3, label: 'Form Complete', count: 45, percentage: 5, dropOffRate: 62.5 }
    ],
    conversionRate: 5.0,
    totalStarts: 120,
    totalSubmissions: 45,
    abandonmentByStep: [
      { step: 1, label: 'Basics', abandons: 20 },
      { step: 2, label: 'Favorites', abandons: 15 }
    ]
  }

  beforeEach(async () => {
    vi.resetModules()
    mockFetch.mockReset()

    // Stub globals before importing the composable module
    vi.stubGlobal('$fetch', mockFetch)
    vi.stubGlobal('ref', ref)

    const module = await import('../useAnalyticsData')
    useAnalyticsData = module.useAnalyticsData
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should accept a string tenant ID', () => {
      const { overview, traffic, sources, devices, funnel, loading, error } = useAnalyticsData('tenant-123')
      expect(overview.value).toBeNull()
      expect(traffic.value).toBeNull()
      expect(sources.value).toBeNull()
      expect(devices.value).toBeNull()
      expect(funnel.value).toBeNull()
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('should accept a ref tenant ID', () => {
      const tenantId = ref('tenant-123')
      const { overview, loading } = useAnalyticsData(tenantId)
      expect(overview.value).toBeNull()
      expect(loading.value).toBe(false)
    })
  })

  describe('fetchOverview', () => {
    it('should fetch and store overview data on success', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockOverview
      })

      const { overview, fetchOverview } = useAnalyticsData('tenant-123')
      await fetchOverview('7d')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/analytics/overview?period=7d'
      )
      expect(overview.value).toEqual(mockOverview)
    })

    it('should pass guestbookId as query parameter when provided', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: mockOverview })

      const { fetchOverview } = useAnalyticsData('tenant-123')
      await fetchOverview('30d', 'gb-1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/analytics/overview?period=30d&guestbook_id=gb-1'
      )
    })

    it('should set loading and clear error during fetch', async () => {
      let resolvePromise: (value: unknown) => void
      mockFetch.mockReturnValueOnce(
        new Promise(resolve => { resolvePromise = resolve })
      )

      const { loading, error, fetchOverview } = useAnalyticsData('tenant-123')

      const fetchPromise = fetchOverview()
      expect(loading.value).toBe(true)
      expect(error.value).toBeNull()

      resolvePromise!({ success: true, data: mockOverview })
      await fetchPromise

      expect(loading.value).toBe(false)
    })

    it('should set error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'))

      const { error, fetchOverview } = useAnalyticsData('tenant-123')
      await fetchOverview()

      expect(error.value).toBe('Failed to load analytics overview')
    })

    it('should reset loading after error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'))

      const { loading, fetchOverview } = useAnalyticsData('tenant-123')
      await fetchOverview()

      expect(loading.value).toBe(false)
    })

    it('should return early when tenant ID is empty', async () => {
      const { fetchOverview } = useAnalyticsData('')
      await fetchOverview()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should return early when ref tenant ID is empty', async () => {
      const tenantId = ref('')
      const { fetchOverview } = useAnalyticsData(tenantId)
      await fetchOverview()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should use default period of 7d', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: mockOverview })

      const { fetchOverview } = useAnalyticsData('tenant-123')
      await fetchOverview()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/analytics/overview?period=7d'
      )
    })
  })

  describe('fetchTraffic', () => {
    it('should fetch and store traffic data on success', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockTraffic
      })

      const { traffic, fetchTraffic } = useAnalyticsData('tenant-123')
      await fetchTraffic('7d')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/analytics/traffic?period=7d&granularity=day'
      )
      expect(traffic.value).toEqual(mockTraffic)
    })

    it('should pass guestbookId as query parameter', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: mockTraffic })

      const { fetchTraffic } = useAnalyticsData('tenant-123')
      await fetchTraffic('24h', 'gb-1', 'hour')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/analytics/traffic?period=24h&granularity=hour&guestbook_id=gb-1'
      )
    })

    it('should set error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'))

      const { error, fetchTraffic } = useAnalyticsData('tenant-123')
      await fetchTraffic()

      expect(error.value).toBe('Failed to load traffic data')
    })

    it('should return early when tenant ID is empty', async () => {
      const { fetchTraffic } = useAnalyticsData('')
      await fetchTraffic()

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('fetchSources', () => {
    it('should fetch and store sources data on success', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockSources
      })

      const { sources, fetchSources } = useAnalyticsData('tenant-123')
      await fetchSources('7d')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/analytics/sources?period=7d'
      )
      expect(sources.value).toEqual(mockSources)
    })

    it('should pass guestbookId as query parameter', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: mockSources })

      const { fetchSources } = useAnalyticsData('tenant-123')
      await fetchSources('30d', 'gb-1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/analytics/sources?period=30d&guestbook_id=gb-1'
      )
    })

    it('should set error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'))

      const { error, fetchSources } = useAnalyticsData('tenant-123')
      await fetchSources()

      expect(error.value).toBe('Failed to load sources data')
    })

    it('should return early when tenant ID is empty', async () => {
      const { fetchSources } = useAnalyticsData('')
      await fetchSources()

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('fetchDevices', () => {
    it('should fetch and store devices data on success', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockDevices
      })

      const { devices, fetchDevices } = useAnalyticsData('tenant-123')
      await fetchDevices('7d')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/analytics/devices?period=7d'
      )
      expect(devices.value).toEqual(mockDevices)
    })

    it('should pass guestbookId as query parameter', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: mockDevices })

      const { fetchDevices } = useAnalyticsData('tenant-123')
      await fetchDevices('90d', 'gb-1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/analytics/devices?period=90d&guestbook_id=gb-1'
      )
    })

    it('should set error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'))

      const { error, fetchDevices } = useAnalyticsData('tenant-123')
      await fetchDevices()

      expect(error.value).toBe('Failed to load devices data')
    })

    it('should return early when tenant ID is empty', async () => {
      const { fetchDevices } = useAnalyticsData('')
      await fetchDevices()

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('fetchFunnel', () => {
    it('should fetch and store funnel data on success', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockFunnel
      })

      const { funnel, fetchFunnel } = useAnalyticsData('tenant-123')
      await fetchFunnel('7d')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/analytics/funnel?period=7d'
      )
      expect(funnel.value).toEqual(mockFunnel)
    })

    it('should pass guestbookId as query parameter', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: mockFunnel })

      const { fetchFunnel } = useAnalyticsData('tenant-123')
      await fetchFunnel('30d', 'gb-1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-123/analytics/funnel?period=30d&guestbook_id=gb-1'
      )
    })

    it('should set error on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'))

      const { error, fetchFunnel } = useAnalyticsData('tenant-123')
      await fetchFunnel()

      expect(error.value).toBe('Failed to load funnel data')
    })

    it('should return early when tenant ID is empty', async () => {
      const { fetchFunnel } = useAnalyticsData('')
      await fetchFunnel()

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('fetchAll', () => {
    it('should call all five fetch functions', async () => {
      mockFetch.mockResolvedValue({ success: true, data: {} })

      const { fetchAll } = useAnalyticsData('tenant-123')
      await fetchAll('7d')

      // Should have called 5 endpoints
      expect(mockFetch).toHaveBeenCalledTimes(5)
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/analytics/overview'))
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/analytics/traffic'))
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/analytics/sources'))
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/analytics/devices'))
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/analytics/funnel'))
    })

    it('should pass period and guestbookId to all fetchers', async () => {
      mockFetch.mockResolvedValue({ success: true, data: {} })

      const { fetchAll } = useAnalyticsData('tenant-123')
      await fetchAll('30d', 'gb-1')

      const calls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string)
      for (const url of calls) {
        expect(url).toContain('period=30d')
        expect(url).toContain('guestbook_id=gb-1')
      }
    })

    it('should use default period of 7d', async () => {
      mockFetch.mockResolvedValue({ success: true, data: {} })

      const { fetchAll } = useAnalyticsData('tenant-123')
      await fetchAll()

      const calls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string)
      for (const url of calls) {
        expect(url).toContain('period=7d')
      }
    })

    it('should handle partial failures gracefully', async () => {
      // Overview succeeds, traffic fails, rest succeed
      mockFetch
        .mockResolvedValueOnce({ success: true, data: mockOverview })
        .mockRejectedValueOnce(new Error('Traffic error'))
        .mockResolvedValueOnce({ success: true, data: mockSources })
        .mockResolvedValueOnce({ success: true, data: mockDevices })
        .mockResolvedValueOnce({ success: true, data: mockFunnel })

      const { overview, sources, fetchAll } = useAnalyticsData('tenant-123')
      await fetchAll()

      // Successful fetches should still populate data
      expect(overview.value).toEqual(mockOverview)
      expect(sources.value).toEqual(mockSources)
    })
  })

  describe('clear', () => {
    it('should reset all data to null/initial state', async () => {
      // Populate all data first
      mockFetch
        .mockResolvedValueOnce({ success: true, data: mockOverview })
        .mockResolvedValueOnce({ success: true, data: mockTraffic })
        .mockResolvedValueOnce({ success: true, data: mockSources })
        .mockResolvedValueOnce({ success: true, data: mockDevices })
        .mockResolvedValueOnce({ success: true, data: mockFunnel })

      const { overview, traffic, sources, devices, funnel, error, fetchAll, clear } = useAnalyticsData('tenant-123')
      await fetchAll()

      expect(overview.value).not.toBeNull()
      expect(traffic.value).not.toBeNull()

      // Clear
      clear()

      expect(overview.value).toBeNull()
      expect(traffic.value).toBeNull()
      expect(sources.value).toBeNull()
      expect(devices.value).toBeNull()
      expect(funnel.value).toBeNull()
      expect(error.value).toBeNull()
    })

    it('should clear error state', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'))

      const { error, fetchOverview, clear } = useAnalyticsData('tenant-123')
      await fetchOverview()
      expect(error.value).not.toBeNull()

      clear()
      expect(error.value).toBeNull()
    })
  })

  describe('module-level state', () => {
    it('should share state across instances', async () => {
      mockFetch.mockResolvedValueOnce({ success: true, data: mockOverview })

      const instance1 = useAnalyticsData('tenant-123')
      await instance1.fetchOverview()

      const instance2 = useAnalyticsData('tenant-456')
      expect(instance2.overview.value).toEqual(mockOverview)
    })
  })

  describe('reactive tenant ID', () => {
    it('should use updated tenant ID in API calls', async () => {
      const tenantId = ref('tenant-1')
      mockFetch.mockResolvedValue({ success: true, data: mockOverview })

      const { fetchOverview } = useAnalyticsData(tenantId)

      await fetchOverview()
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-1/analytics/overview?period=7d'
      )

      tenantId.value = 'tenant-2'
      await fetchOverview()
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tenants/tenant-2/analytics/overview?period=7d'
      )
    })
  })
})
