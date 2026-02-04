<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { AnalyticsOverview } from '~/composables/useAnalyticsData'

const props = defineProps<{
  data: AnalyticsOverview | null
  loading?: boolean
}>()

const { t } = useI18n()

/** Format large numbers with K/M suffix */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

/** Get trend icon based on value */
function getTrendIcon(trend: number): string {
  if (trend > 0) return 'lucide:trending-up'
  if (trend < 0) return 'lucide:trending-down'
  return 'lucide:minus'
}

/** Get trend color class */
function getTrendColor(trend: number, inverse = false): string {
  if (inverse) trend = -trend
  if (trend > 0) return 'text-green-500'
  if (trend < 0) return 'text-red-500'
  return 'text-gray-400'
}

const metrics = computed(() => {
  if (!props.data?.metrics) return []

  const m = props.data.metrics
  return [
    {
      key: 'pageViews',
      label: t('analytics.metrics.pageViews'),
      value: formatNumber(m.pageViews.value),
      trend: m.pageViews.trend,
      icon: 'lucide:eye'
    },
    {
      key: 'uniqueVisitors',
      label: t('analytics.metrics.uniqueVisitors'),
      value: formatNumber(m.uniqueVisitors.value),
      trend: m.uniqueVisitors.trend,
      icon: 'lucide:users'
    },
    {
      key: 'entriesCreated',
      label: t('analytics.metrics.entriesCreated'),
      value: formatNumber(m.entriesCreated.value),
      trend: m.entriesCreated.trend,
      icon: 'lucide:message-square'
    },
    {
      key: 'conversionRate',
      label: t('analytics.metrics.conversionRate'),
      value: `${m.conversionRate.value}%`,
      trend: m.conversionRate.trend,
      icon: 'lucide:target'
    }
  ]
})
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Loading skeleton -->
    <template v-if="loading">
      <div
        v-for="i in 4"
        :key="i"
        class="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 animate-pulse"
      >
        <div class="h-4 bg-white/20 rounded w-24 mb-2" />
        <div class="h-8 bg-white/20 rounded w-16 mb-1" />
        <div class="h-3 bg-white/20 rounded w-12" />
      </div>
    </template>

    <!-- Metric cards -->
    <template v-else>
      <div
        v-for="metric in metrics"
        :key="metric.key"
        class="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50 transition-all hover:bg-white/15 dark:hover:bg-gray-800/70"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ metric.label }}
          </span>
          <Icon :icon="metric.icon" class="w-5 h-5 text-gray-400" />
        </div>

        <div class="flex items-end gap-2">
          <span class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ metric.value }}
          </span>

          <div
            v-if="metric.trend !== 0"
            class="flex items-center text-sm"
            :class="getTrendColor(metric.trend)"
          >
            <Icon :icon="getTrendIcon(metric.trend)" class="w-4 h-4" />
            <span class="ml-0.5">{{ Math.abs(metric.trend) }}%</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
