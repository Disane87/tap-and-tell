<script setup lang="ts">
import { Toaster as Sonner, type ToasterProps } from 'vue-sonner'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    v-bind="props"
    class="toaster group"
    :toast-options="{
      classes: {
        toast: [
          'group toast card-polaroid',
          'group-[.toaster]:bg-background group-[.toaster]:text-foreground',
          'group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          'animate-scale-in',
          'relative overflow-hidden',
        ].join(' '),
        title: 'font-handwritten text-lg flex items-center gap-2',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground rounded-md px-3 py-1 font-semibold shadow-md hover:scale-105 transition-transform',
        cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground rounded-md px-3 py-1 font-semibold hover:scale-105 transition-transform',
        icon: 'inline-block mr-2 align-middle text-xl',
      },
      render: {
        icon: (type) => {
          if (type === 'success') return '✅';
          if (type === 'error') return '❌';
          if (type === 'warning') return '⚠️';
          if (type === 'info') return 'ℹ️';
          return '💬';
        },
      },
    }"
  />
</template>
