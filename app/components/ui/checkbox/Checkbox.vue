<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { cn } from '~/lib/utils'

const props = defineProps<{
  class?: string
  defaultValue?: boolean | 'indeterminate'
  modelValue?: boolean | 'indeterminate' | null
  disabled?: boolean
  required?: boolean
  name?: string
  value?: string
  id?: string
}>()

const emits = defineEmits<{
  'update:modelValue': [value: boolean | 'indeterminate']
}>()
</script>

<template>
  <CheckboxRoot
    :model-value="modelValue"
    :default-value="defaultValue"
    :disabled="disabled"
    :required="required"
    :name="name"
    :value="value"
    :id="id"
    :class="
      cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        props.class,
      )
    "
    @update:model-value="emits('update:modelValue', $event)"
  >
    <CheckboxIndicator class="flex h-full w-full items-center justify-center text-current">
      <Check class="h-3.5 w-3.5" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
