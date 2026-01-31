<script setup lang="ts">
/**
 * Tenant root page — redirects to the first guestbook's guest form.
 * If no guestbooks exist, shows a message.
 */
const route = useRoute()
const router = useRouter()
const tenantId = computed(() => route.params.uuid as string)

const loading = ref(true)
const notFound = ref(false)

onMounted(async () => {
  try {
    const response = await $fetch<{ success: boolean; data?: Array<{ id: string }> }>(
      `/api/t/${tenantId.value}/guestbooks`
    )
    if (response.success && response.data && response.data.length > 0) {
      router.replace(`/t/${tenantId.value}/g/${response.data[0].id}`)
    } else {
      notFound.value = true
    }
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <p v-if="loading" class="animate-gentle-pulse text-muted-foreground">{{ $t('common.loading') }}</p>
    <div v-else-if="notFound" class="text-center">
      <p class="text-muted-foreground">{{ $t('guestbookAdmin.empty') }}</p>
    </div>
  </div>
</template>
