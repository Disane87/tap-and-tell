<script setup lang="ts">
/**
 * Password strength indicator with visual bar and rule checklist.
 *
 * Checks 5 rules: min length (12), uppercase, lowercase, digit, special char.
 */
import { Check, X } from 'lucide-vue-next'

const props = defineProps<{
  password: string
}>()

const { t } = useI18n()

const rules = computed(() => [
  { key: 'minLength', met: props.password.length >= 12, label: t('validation.minLength') },
  { key: 'uppercase', met: /[A-Z]/.test(props.password), label: t('validation.uppercase') },
  { key: 'lowercase', met: /[a-z]/.test(props.password), label: t('validation.lowercase') },
  { key: 'digit', met: /[0-9]/.test(props.password), label: t('validation.digit') },
  { key: 'special', met: /[^A-Za-z0-9]/.test(props.password), label: t('validation.special') }
])

const metCount = computed(() => rules.value.filter(r => r.met).length)

const strengthColor = computed(() => {
  if (metCount.value <= 1) return 'bg-red-500'
  if (metCount.value <= 2) return 'bg-orange-500'
  if (metCount.value <= 3) return 'bg-amber-500'
  if (metCount.value <= 4) return 'bg-lime-500'
  return 'bg-green-500'
})

const strengthPercent = computed(() => (metCount.value / 5) * 100)
</script>

<template>
  <div v-if="password.length > 0" class="space-y-2">
    <!-- Strength Bar -->
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="strengthColor"
        :style="{ width: `${strengthPercent}%` }"
      />
    </div>

    <!-- Rule Checklist -->
    <ul class="space-y-0.5">
      <li
        v-for="rule in rules"
        :key="rule.key"
        class="flex items-center gap-1.5 text-xs"
        :class="rule.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'"
      >
        <Check v-if="rule.met" class="h-3 w-3" />
        <X v-else class="h-3 w-3" />
        {{ rule.label }}
      </li>
    </ul>
  </div>
</template>
