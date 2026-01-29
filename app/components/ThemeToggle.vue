<script setup lang="ts">
import { Sun, Moon, Monitor } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const { theme, toggleTheme, initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    :title="`Current theme: ${theme}. Click to change.`"
    @click="toggleTheme"
  >
    <Sun v-if="theme === 'light'" class="h-5 w-5" />
    <Moon v-else-if="theme === 'dark'" class="h-5 w-5" />
    <Monitor v-else class="h-5 w-5" />
    <span class="sr-only">Toggle theme</span>
  </Button>
</template>
