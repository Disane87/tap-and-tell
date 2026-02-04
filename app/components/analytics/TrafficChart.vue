<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import type { AnalyticsTraffic } from '~/composables/useAnalyticsData'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  data: AnalyticsTraffic | null
  loading?: boolean
}>()

const { t } = useI18n()

const chartData = computed(() => {
  if (!props.data?.traffic) {
    return {
      labels: [],
      datasets: []
    }
  }

  const traffic = props.data.traffic

  return {
    labels: traffic.map(t => {
      // Format date labels
      if (t.period.includes(':')) {
        // Hourly format: show hour only
        return t.period.split(' ')[1] || t.period
      }
      // Daily format: show short date
      const date = new Date(t.period)
      return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: t('analytics.metrics.pageViews'),
        data: traffic.map(t => t.pageViews),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: t('analytics.metrics.uniqueVisitors'),
        data: traffic.map(t => t.uniqueVisitors),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    }
  }
}))
</script>

<template>
  <div class="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {{ t('analytics.charts.traffic') }}
    </h3>

    <div class="h-64">
      <!-- Loading state -->
      <div v-if="loading" class="h-full flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>

      <!-- Empty state -->
      <div v-else-if="!data?.traffic?.length" class="h-full flex items-center justify-center text-gray-400">
        {{ t('analytics.noData') }}
      </div>

      <!-- Chart -->
      <Line
        v-else
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>
