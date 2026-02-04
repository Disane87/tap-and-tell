<script setup lang="ts">
/**
 * Guestbook analytics dashboard page.
 * URL: /g/[id]/analytics
 * Displays comprehensive analytics for a guestbook.
 * Requires authentication and tenant membership.
 */
import { BarChart3, ArrowLeft, RefreshCw } from 'lucide-vue-next'
import type { AnalyticsPeriod } from '~/composables/useAnalyticsData'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const guestbookId = computed(() => route.params.id as string)
const { isAuthenticated } = useAuth()

const resolvedTenantId = ref('')
const tenantId = computed(() => resolvedTenantId.value)
const guestbookName = ref('')

const period = ref<AnalyticsPeriod>('7d')
const refreshing = ref(false)

const {
  overview,
  traffic,
  sources,
  devices,
  funnel,
  loading,
  error,
  fetchAll
} = useAnalyticsData(tenantId)

async function loadAnalytics(): Promise<void> {
  if (!tenantId.value) return
  await fetchAll(period.value, guestbookId.value)
}

async function handleRefresh(): Promise<void> {
  refreshing.value = true
  await loadAnalytics()
  refreshing.value = false
}

watch(period, () => {
  loadAnalytics()
})

onMounted(async () => {
  if (!isAuthenticated.value) {
    router.push('/login')
    return
  }

  // Resolve tenantId from guestbook info
  try {
    const infoResponse = await $fetch<{ success: boolean; data?: { id: string; name: string; tenantId: string } }>(
      `/api/g/${guestbookId.value}/info`
    )
    if (infoResponse.data?.tenantId) {
      resolvedTenantId.value = infoResponse.data.tenantId
      guestbookName.value = infoResponse.data.name
    } else {
      router.push('/dashboard')
      return
    }
  } catch {
    router.push('/dashboard')
    return
  }

  await loadAnalytics()
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <!-- Header -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <NuxtLink :to="`/g/${guestbookId}/admin`">
          <Button variant="ghost" size="icon" class="rounded-xl">
            <ArrowLeft class="h-5 w-5" />
          </Button>
        </NuxtLink>
        <div>
          <h1 class="font-display text-2xl font-semibold text-foreground flex items-center gap-2">
            <BarChart3 class="h-6 w-6 text-primary-500" />
            {{ t('analytics.title') }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ guestbookName }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <AnalyticsPeriodSelector v-model="period" />
        <Button
          variant="outline"
          size="sm"
          class="rounded-xl"
          :disabled="refreshing"
          @click="handleRefresh"
        >
          <RefreshCw class="h-4 w-4 mr-2" :class="{ 'animate-spin': refreshing }" />
          {{ t('common.refresh') }}
        </Button>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="error" class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
      {{ error }}
    </div>

    <!-- Overview KPI Cards -->
    <section class="mb-8">
      <AnalyticsAnalyticsOverview :data="overview" :loading="loading" />
    </section>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Traffic Chart (full width on larger screens) -->
      <div class="lg:col-span-2">
        <AnalyticsTrafficChart :data="traffic" :loading="loading" />
      </div>

      <!-- Sources Chart -->
      <AnalyticsSourcesChart :data="sources" :loading="loading" />

      <!-- Devices Chart -->
      <AnalyticsDevicesChart :data="devices" :loading="loading" />

      <!-- Funnel Chart (full width) -->
      <div class="lg:col-span-2">
        <AnalyticsFunnelChart :data="funnel" :loading="loading" />
      </div>
    </div>

    <!-- Empty state when no data -->
    <div
      v-if="!loading && !overview?.metrics"
      class="mt-8 p-8 text-center rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-white/10 dark:border-gray-700/50"
    >
      <BarChart3 class="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {{ t('analytics.noDataTitle') }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
        {{ t('analytics.noDataDescription') }}
      </p>
    </div>
  </div>
</template>
