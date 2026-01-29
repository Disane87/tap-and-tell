<script setup lang="ts">
import { DialogRoot } from 'radix-vue'

const props = defineProps<{
  open?: boolean
  defaultOpen?: boolean
  modal?: boolean
}>()

const emits = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()
</script>

<template>
  <DialogRoot
    :open="props.open"
    :default-open="props.defaultOpen"
    :modal="props.modal"
    @update:open="emits('update:open', $event)"
  >
    <slot />
  </DialogRoot>
</template>
