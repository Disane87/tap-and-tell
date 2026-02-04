<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import type { AnalyticsSources } from '~/composables/useAnalyticsData'

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  data: AnalyticsSources | null
  loading?: boolean
}>()

const { t } = useI18n()

const sourceColors = {
  nfc: 'rgb(99, 102, 241)',      // Indigo
  qr: 'rgb(168, 85, 247)',       // Purple
  direct: 'rgb(34, 197, 94)',    // Green
  referral: 'rgb(249, 115, 22)'  // Orange
}

const chartData = computed(() => {
  if (!props.data?.sources) {
    return {
      labels: [],
      datasets: []
    }
  }

  return {
    labels: props.data.sources.map(s => s.label),
    datasets: [
      {
        data: props.data.sources.map(s => s.count),
        backgroundColor: props.data.sources.map(s => sourceColors[s.name as keyof typeof sourceColors] || 'rgb(156, 163, 175)'),
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        usePointStyle: true,
        padding: 16,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8
    }
  }
}))
</script>

<template>
  <div class="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {{ t('analytics.charts.sources') }}
    </h3>

    <div class="h-64">
      <!-- Loading state -->
      <div v-if="loading" class="h-full flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!data?.total" class="h-full flex items-center justify-center text-gray-400">
        {{ t('analytics.noData') }}
      </div>

      <!-- Chart -->
      <Doughnut
        v-else
        :data="chartData"
        :options="chartOptions"
      />
    </div>

    <!-- Source list -->
    <div v-if="data?.sources && !loading" class="mt-4 grid grid-cols-2 gap-2">
      <div
        v-for="source in data.sources"
        :key="source.name"
        class="flex items-center gap-2 text-sm"
      >
        <div
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: sourceColors[source.name as keyof typeof sourceColors] }"
        />
        <span class="text-gray-600 dark:text-gray-400">{{ source.label }}:</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ source.percentage }}%</span>
      </div>
    </div>
  </div>
</template>
