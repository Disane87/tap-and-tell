<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Icon } from '@iconify/vue'
import type { AnalyticsDevices } from '~/composables/useAnalyticsData'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps<{
  data: AnalyticsDevices | null
  loading?: boolean
}>()

const { t } = useI18n()

const deviceIcons = {
  mobile: 'lucide:smartphone',
  tablet: 'lucide:tablet',
  desktop: 'lucide:monitor'
}

const deviceColors = {
  mobile: 'rgb(99, 102, 241)',   // Indigo
  tablet: 'rgb(168, 85, 247)',   // Purple
  desktop: 'rgb(34, 197, 94)'    // Green
}

const chartData = computed(() => {
  if (!props.data?.browsers) {
    return {
      labels: [],
      datasets: []
    }
  }

  return {
    labels: props.data.browsers.slice(0, 5).map(b => b.name),
    datasets: [
      {
        label: t('analytics.metrics.sessions'),
        data: props.data.browsers.slice(0, 5).map(b => b.count),
        backgroundColor: 'rgb(99, 102, 241)',
        borderRadius: 4
      }
    ]
  }
})

const chartOptions = computed(() => ({
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    y: {
      grid: {
        display: false
      }
    }
  }
}))
</script>

<template>
  <div class="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 dark:border-gray-700/50">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {{ t('analytics.charts.devices') }}
    </h3>

    <!-- Loading state -->
    <div v-if="loading" class="h-64 flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!data?.total" class="h-64 flex items-center justify-center text-gray-400">
      {{ t('analytics.noData') }}
    </div>

    <template v-else>
      <!-- Device type cards -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div
          v-for="device in data.devices"
          :key="device.name"
          class="flex flex-col items-center p-3 bg-white/5 dark:bg-gray-900/30 rounded-lg"
        >
          <Icon
            :icon="deviceIcons[device.name as keyof typeof deviceIcons]"
            class="w-6 h-6 mb-2"
            :style="{ color: deviceColors[device.name as keyof typeof deviceColors] }"
          />
          <span class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ device.percentage }}%
          </span>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ device.label }}
          </span>
        </div>
      </div>

      <!-- Browser chart -->
      <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        {{ t('analytics.charts.browsers') }}
      </h4>
      <div class="h-40">
        <Bar
          :data="chartData"
          :options="chartOptions"
        />
      </div>
    </template>
  </div>
</template>
