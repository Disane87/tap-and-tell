<script setup lang="ts">
/**
 * Dialog for creating a new API token with scope selection and expiry.
 */
import type { ApiScopeDefinition } from '~/types/api-app'

const props = defineProps<{
  open: boolean
  scopes: ApiScopeDefinition[]
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  create: [payload: { name: string; scopes: string[]; expiresInDays?: number }]
}>()

const { t } = useI18n()

const tokenName = ref('')
const selectedScopes = ref<string[]>([])
const selectedExpiry = ref<number | undefined>(90)

const expiryOptions = [
  { value: 30, label: 'apiApps.expiryOptions.30' },
  { value: 60, label: 'apiApps.expiryOptions.60' },
  { value: 90, label: 'apiApps.expiryOptions.90' },
  { value: 365, label: 'apiApps.expiryOptions.365' },
  { value: undefined, label: 'apiApps.expiryOptions.never' }
]

/** Groups scopes by their resource prefix (e.g. entries, guestbooks). */
const groupedScopes = computed(() => {
  const groups: Record<string, ApiScopeDefinition[]> = {}
  for (const scope of props.scopes) {
    const resource = scope.scope.split(':')[0]
    if (!groups[resource]) {
      groups[resource] = []
    }
    groups[resource].push(scope)
  }
  return groups
})

const nameValid = computed(() => tokenName.value.trim().length > 0)
const scopesValid = computed(() => selectedScopes.value.length > 0)
const formValid = computed(() => nameValid.value && scopesValid.value)

function toggleScope(scope: string): void {
  const idx = selectedScopes.value.indexOf(scope)
  if (idx >= 0) {
    selectedScopes.value.splice(idx, 1)
  } else {
    selectedScopes.value.push(scope)
  }
}

function handleCreate(): void {
  if (!formValid.value) return
  emit('create', {
    name: tokenName.value.trim(),
    scopes: [...selectedScopes.value],
    expiresInDays: selectedExpiry.value
  })
}

function resetForm(): void {
  tokenName.value = ''
  selectedScopes.value = []
  selectedExpiry.value = 90
}

watch(() => props.open, (open) => {
  if (open) resetForm()
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ $t('apiApps.createTokenTitle') }}</DialogTitle>
        <DialogDescription>{{ $t('apiApps.createTokenDescription') }}</DialogDescription>
      </DialogHeader>

      <div class="space-y-5 py-2">
        <!-- Token Name -->
        <div class="space-y-2">
          <Label for="tokenName">{{ $t('apiApps.tokenName') }}</Label>
          <Input
            id="tokenName"
            v-model="tokenName"
            :placeholder="$t('apiApps.tokenNamePlaceholder')"
          />
        </div>

        <!-- Scopes -->
        <div class="space-y-3">
          <div>
            <Label>{{ $t('apiApps.tokenScopes') }}</Label>
            <p class="text-xs text-muted-foreground">{{ $t('apiApps.tokenScopesHint') }}</p>
          </div>

          <div class="space-y-4 rounded-xl border border-border/20 bg-muted/30 p-4">
            <div v-for="(groupScopes, resource) in groupedScopes" :key="resource" class="space-y-2">
              <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {{ $t(`apiApps.scopeGroups.${resource}`) }}
              </p>
              <div v-for="scope in groupScopes" :key="scope.scope" class="flex items-center gap-2">
                <Checkbox
                  :id="`scope-${scope.scope}`"
                  :checked="selectedScopes.includes(scope.scope)"
                  @update:checked="toggleScope(scope.scope)"
                />
                <label :for="`scope-${scope.scope}`" class="cursor-pointer text-sm text-foreground">
                  <code class="rounded bg-muted px-1 py-0.5 text-xs">{{ scope.scope }}</code>
                  <span class="ml-1.5 text-muted-foreground">{{ scope.description }}</span>
                </label>
              </div>
            </div>
          </div>

          <p v-if="!scopesValid && selectedScopes.length === 0" class="text-xs text-muted-foreground">
            {{ $t('apiApps.scopeRequired') }}
          </p>
        </div>

        <!-- Expiry -->
        <div class="space-y-2">
          <Label>{{ $t('apiApps.tokenExpiry') }}</Label>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="option in expiryOptions"
              :key="String(option.value)"
              :variant="selectedExpiry === option.value ? 'default' : 'outline'"
              size="sm"
              @click="selectedExpiry = option.value"
            >
              {{ $t(option.label) }}
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          :disabled="!formValid || loading"
          @click="handleCreate"
        >
          {{ loading ? $t('common.saving') : $t('apiApps.createToken') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
