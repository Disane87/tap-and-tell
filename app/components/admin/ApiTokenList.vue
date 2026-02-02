<script setup lang="ts">
/**
 * Token list showing status badges, scope pills, and revoke actions.
 */
import { Plus, ShieldOff, Clock } from 'lucide-vue-next'
import type { ApiToken } from '~/types/api-app'

const props = defineProps<{
  tokens: ApiToken[]
}>()

const emit = defineEmits<{
  create: []
  revoke: [tokenId: string]
}>()

const { t, d } = useI18n()

type TokenStatus = 'active' | 'revoked' | 'expired'

/** Determines the display status of a token. */
function getTokenStatus(token: ApiToken): TokenStatus {
  if (token.revokedAt) return 'revoked'
  if (token.expiresAt && new Date(token.expiresAt) < new Date()) return 'expired'
  return 'active'
}

/** Returns CSS classes for the status dot. */
function statusDotClass(status: TokenStatus): string {
  switch (status) {
    case 'active': return 'bg-primary shadow-[0_0_8px_rgba(16,185,129,0.6)]'
    case 'revoked': return 'bg-muted-foreground/50'
    case 'expired': return 'bg-destructive/70'
  }
}

/** Returns CSS classes for the status badge background. */
function statusBadgeClass(status: TokenStatus): string {
  switch (status) {
    case 'active': return 'bg-primary/15 text-primary border border-primary/30 backdrop-blur-md'
    case 'revoked': return 'bg-muted/50 text-muted-foreground border border-border/20 backdrop-blur-md'
    case 'expired': return 'bg-destructive/10 text-destructive border border-destructive/20 backdrop-blur-md'
  }
}

/** Formats a relative time string. */
function formatRelative(dateStr: string | null): string {
  if (!dateStr) return t('apiApps.never')
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-foreground">{{ $t('apiApps.tokens') }}</h4>
      <Button size="sm" variant="outline" @click="emit('create')">
        <Plus class="mr-1.5 h-3.5 w-3.5" />
        {{ $t('apiApps.createToken') }}
      </Button>
    </div>

    <!-- Empty state -->
    <p v-if="tokens.length === 0" class="py-4 text-center text-sm text-muted-foreground">
      {{ $t('apiApps.noTokens') }}
    </p>

    <!-- Token cards -->
    <div v-for="token in tokens" :key="token.id" class="rounded-2xl border border-border/20 bg-card/70 backdrop-blur-xl p-4 transition-all duration-300 hover:shadow-md">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1 space-y-2">
          <!-- Name + Status -->
          <div class="flex items-center gap-2">
            <span class="truncate text-sm font-medium text-foreground">{{ token.name }}</span>
            <span
              :class="['inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', statusBadgeClass(getTokenStatus(token))]"
            >
              <span :class="['inline-block h-1.5 w-1.5 rounded-full', statusDotClass(getTokenStatus(token)), getTokenStatus(token) === 'active' ? 'animate-pulse' : '']" />
              {{ $t(`apiApps.tokenStatus.${getTokenStatus(token)}`) }}
            </span>
          </div>

          <!-- Prefix -->
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <code class="rounded bg-muted px-1.5 py-0.5">{{ token.tokenPrefix }}...</code>
          </div>

          <!-- Scopes -->
          <div class="flex flex-wrap gap-1">
            <span
              v-for="scope in token.scopes"
              :key="scope"
              class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              {{ scope }}
            </span>
          </div>

          <!-- Meta info -->
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              <Clock class="mr-1 inline h-3 w-3" />
              {{ $t('apiApps.lastUsed') }}: {{ formatRelative(token.lastUsedAt) }}
            </span>
            <span v-if="token.expiresAt">
              {{ $t('apiApps.expiresAt') }}: {{ new Date(token.expiresAt).toLocaleDateString() }}
            </span>
          </div>
        </div>

        <!-- Revoke button -->
        <div v-if="getTokenStatus(token) === 'active'">
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="ghost" size="sm" class="text-muted-foreground hover:text-destructive">
                <ShieldOff class="mr-1.5 h-3.5 w-3.5" />
                {{ $t('apiApps.revoke') }}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{{ $t('apiApps.revokeTitle') }}</AlertDialogTitle>
                <AlertDialogDescription>
                  {{ $t('apiApps.revokeConfirm') }}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{{ $t('common.cancel') }}</AlertDialogCancel>
                <AlertDialogAction
                  class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  @click="emit('revoke', token.id)"
                >
                  {{ $t('apiApps.revoke') }}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  </div>
</template>
