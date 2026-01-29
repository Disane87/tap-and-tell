<script setup lang="ts">
import { AlertDialogRoot } from 'radix-vue'

const props = defineProps<{
  open?: boolean
  defaultOpen?: boolean
}>()

const emits = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()
</script>

<template>
  <AlertDialogRoot
    :open="props.open"
    :default-open="props.defaultOpen"
    @update:open="emits('update:open', $event)"
  >
    <slot />
  </AlertDialogRoot>
</template>
