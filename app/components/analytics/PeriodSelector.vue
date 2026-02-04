<script setup lang="ts">
import type { AnalyticsPeriod } from '~/composables/useAnalyticsData'

const props = defineProps<{
  modelValue: AnalyticsPeriod
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: AnalyticsPeriod): void
}>()

const { t } = useI18n()

const periods: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: '24h', label: t('analytics.period.24h') },
  { value: '7d', label: t('analytics.period.7d') },
  { value: '30d', label: t('analytics.period.30d') },
  { value: '90d', label: t('analytics.period.90d') }
]

function selectPeriod(period: AnalyticsPeriod) {
  emit('update:modelValue', period)
}
</script>

<template>
  <div class="flex items-center gap-1 bg-white/10 dark:bg-gray-800/50 rounded-lg p-1">
    <button
      v-for="period in periods"
      :key="period.value"
      class="px-3 py-1.5 text-sm rounded-md transition-all"
      :class="modelValue === period.value
        ? 'bg-primary-500 text-white'
        : 'text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-gray-700/50'"
      @click="selectPeriod(period.value)"
    >
      {{ period.label }}
    </button>
  </div>
</template>
