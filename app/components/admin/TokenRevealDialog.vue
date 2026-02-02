<script setup lang="ts">
/**
 * Non-dismissable dialog that shows the plaintext API token once.
 * The user must explicitly confirm they've copied it before closing.
 */
import { Copy, ShieldAlert } from 'lucide-vue-next'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal } from 'reka-ui'
import { toast } from 'vue-sonner'
import { cn } from '~/lib/utils'

const props = defineProps<{
  open: boolean
  token: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

async function copyToken(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.token)
    toast.success(t('apiApps.tokenReveal.copied'))
  } catch {
    toast.error(t('apiApps.tokenReveal.copyFailed'))
  }
}
</script>

<template>
  <Dialog :open="open">
    <DialogPortal>
      <DialogOverlay
        class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />
      <DialogContent
        :class="cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border/10 bg-card/95 backdrop-blur-2xl p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl'
        )"
        @interact-outside.prevent
        @escape-key-down.prevent
      >
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShieldAlert class="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-foreground">
                {{ $t('apiApps.tokenReveal.title') }}
              </h3>
            </div>
          </div>

          <p class="text-sm text-muted-foreground">
            {{ $t('apiApps.tokenReveal.warning') }}
          </p>

          <div class="rounded-xl border border-border/20 bg-muted/50 p-4">
            <code class="block break-all font-mono text-sm text-foreground">{{ token }}</code>
          </div>

          <div class="flex gap-2">
            <Button variant="outline" class="flex-1" @click="copyToken">
              <Copy class="mr-2 h-4 w-4" />
              {{ $t('apiApps.tokenReveal.copyButton') }}
            </Button>
          </div>

          <Button class="w-full" @click="emit('close')">
            {{ $t('apiApps.tokenReveal.confirmButton') }}
          </Button>
        </div>
      </DialogContent>
    </DialogPortal>
  </Dialog>
</template>
