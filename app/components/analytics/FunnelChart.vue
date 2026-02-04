<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { AnalyticsFunnel } from '~/composables/useAnalyticsData'

const props = defineProps<{
  data: AnalyticsFunnel | null
  loading?: boolean
}>()

const { t } = useI18n()

/** Get step color based on position */
function getStepColor(index: number): string {
  const colors: string[] = [
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-rose-500',
    'bg-orange-500',
    'bg-green-500'
  ]
  return colors[index % colors.length] ?? colors[0]
}

/** Get drop-off color based on rate */
function getDropOffColor(rate: number): string {
  if (rate >= 50) return 'text-red-500'
  if (rate >= 30) return 'text-orange-500'
  if (rate >= 10) return 'text-yellow-500'
  return 'text-gray-400'
}
</script>

<template>
  <div class="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ t('analytics.charts.funnel') }}
      </h3>

      <div v-if="data?.conversionRate !== undefined && !loading" class="flex items-center gap-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('analytics.metrics.conversionRate') }}:
        </span>
        <span class="text-lg font-bold text-green-500">
          {{ data.conversionRate }}%
        </span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="h-64 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!data?.funnel?.length" class="h-64 flex items-center justify-center text-gray-400">
      {{ t('analytics.noData') }}
    </div>

    <!-- Funnel visualization -->
    <div v-else class="space-y-3">
      <div
        v-for="(step, index) in data.funnel"
        :key="step.step"
        class="relative"
      >
        <!-- Step bar -->
        <div class="flex items-center gap-3">
          <div class="w-24 text-sm text-gray-600 dark:text-gray-400 text-right">
            {{ step.label }}
          </div>

          <div class="flex-1 relative h-10">
            <!-- Background bar -->
            <div class="absolute inset-0 bg-gray-200 dark:bg-gray-700/30 rounded-lg" />

            <!-- Filled bar -->
            <div
              class="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end px-3 transition-all duration-500"
              :class="getStepColor(index)"
              :style="{ width: `${step.percentage}%` }"
            >
              <span class="text-white text-sm font-medium">
                {{ step.count }}
              </span>
            </div>
          </div>

          <div class="w-16 text-sm text-gray-600 dark:text-gray-400">
            {{ step.percentage }}%
          </div>
        </div>

        <!-- Drop-off indicator -->
        <div
          v-if="index > 0 && step.dropOffRate > 0"
          class="absolute -top-3 right-24 flex items-center gap-1 text-xs"
          :class="getDropOffColor(step.dropOffRate)"
        >
          <Icon icon="lucide:arrow-down" class="w-3 h-3" />
          <span>-{{ step.dropOffRate }}%</span>
        </div>
      </div>
    </div>

    <!-- Summary stats -->
    <div v-if="data && !loading" class="mt-6 pt-4 border-t border-white/10 dark:border-gray-700/50 grid grid-cols-3 gap-4 text-center">
      <div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ data.totalStarts }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ t('analytics.funnel.started') }}
        </div>
      </div>
      <div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ data.totalSubmissions }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ t('analytics.funnel.completed') }}
        </div>
      </div>
      <div>
        <div class="text-2xl font-bold text-green-500">
          {{ data.conversionRate }}%
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ t('analytics.funnel.conversion') }}
        </div>
      </div>
    </div>
  </div>
</template>
