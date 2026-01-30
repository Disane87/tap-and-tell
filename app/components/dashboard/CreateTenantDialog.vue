<script setup lang="ts">
/**
 * Dialog for creating a new tenant (guestbook).
 */
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const { createTenant } = useTenants()

const name = ref('')
const saving = ref(false)

/**
 * Handles tenant creation form submission.
 */
async function handleCreate() {
  if (!name.value.trim()) return

  saving.value = true
  const tenant = await createTenant({ name: name.value.trim() })
  saving.value = false

  if (tenant) {
    toast.success(t('dashboard.createSuccess'))
    name.value = ''
    emit('close')
  } else {
    toast.error(t('dashboard.createFailed'))
  }
}

/**
 * Resets form state when dialog closes.
 */
function handleOpenChange(open: boolean) {
  if (!open) {
    name.value = ''
    emit('close')
  }
}
</script>

<template>
  <AlertDialog :open="props.open" @update:open="handleOpenChange">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('dashboard.createTenantTitle') }}</AlertDialogTitle>
        <AlertDialogDescription>{{ t('dashboard.createTenantDescription') }}</AlertDialogDescription>
      </AlertDialogHeader>

      <form @submit.prevent="handleCreate">
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="tenant-name">{{ t('dashboard.tenantName') }}</Label>
            <Input
              id="tenant-name"
              v-model="name"
              :placeholder="t('dashboard.tenantNamePlaceholder')"
              required
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel @click="emit('close')">{{ t('common.cancel') }}</AlertDialogCancel>
          <Button type="submit" :disabled="saving || !name.trim()">
            {{ saving ? t('common.saving') : t('dashboard.createButton') }}
          </Button>
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  </AlertDialog>
</template>
