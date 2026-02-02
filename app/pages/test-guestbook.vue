<script setup lang="ts">
console.log('TEST GUESTBOOK: Starting')

definePageMeta({
  layout: false
})

console.log('TEST GUESTBOOK: After definePageMeta')

const { t } = useI18n()
console.log('TEST GUESTBOOK: After useI18n')

const route = useRoute()
console.log('TEST GUESTBOOK: After useRoute')

const tenantId = computed(() => route.params.uuid as string)
const guestbookId = computed(() => route.params.guestbookUuid as string)
console.log('TEST GUESTBOOK: Route params', { tenantId: tenantId.value, guestbookId: guestbookId.value })

// Try to load composables
try {
  const { entries, fetchEntries } = useTenantGuests(tenantId, guestbookId)
  console.log('TEST GUESTBOOK: useTenantGuests loaded', entries.value)
} catch (e) {
  console.error('TEST GUESTBOOK: Error loading useTenantGuests', e)
}

try {
  const { formState } = useGuestForm()
  console.log('TEST GUESTBOOK: useGuestForm loaded')
} catch (e) {
  console.error('TEST GUESTBOOK: Error loading useGuestForm', e)
}

onMounted(() => {
  console.log('TEST GUESTBOOK: Component mounted!')
})
</script>

<template>
  <div style="background: blue; color: white; min-height: 100vh; padding: 2rem; font-size: 16px;">
    <h1 style="font-size: 32px; margin-bottom: 1rem;">Test Guestbook Page</h1>
    <p>If you see this, the component rendered successfully.</p>
    <p>Check console for detailed logs.</p>
    <p>Tenant: {{ tenantId }}</p>
    <p>Guestbook: {{ guestbookId }}</p>
  </div>
</template>
