<script setup lang="ts">
import { toast } from 'vue-sonner'

const { createEntry } = useGuests()
const {
  formState,
  validation,
  status,
  isValid,
  setName,
  setMessage,
  setPhoto,
  validate,
  reset,
  getSubmitData,
  setStatus,
  setError
} = useGuestForm()
const { welcomeMessage, nfcContext } = useNfc()

const router = useRouter()

async function handleSubmit() {
  if (!validate()) return

  setStatus('submitting')

  try {
    const entry = await createEntry(getSubmitData())

    if (entry) {
      setStatus('success')
      toast.success('Thank you for your message!')
      reset()
      // Redirect to guestbook after short delay
      setTimeout(() => {
        router.push('/guestbook')
      }, 1500)
    } else {
      setError('Failed to submit your entry. Please try again.')
      toast.error('Failed to submit your entry')
    }
  } catch {
    setError('An unexpected error occurred')
    toast.error('An unexpected error occurred')
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="mb-8 text-center">
      <h1 class="mb-2 text-3xl font-bold tracking-tight">{{ welcomeMessage }}</h1>
      <p class="text-muted-foreground">
        <template v-if="nfcContext.isNfcEntry">
          You've tapped into our guestbook. Leave a photo and message!
        </template>
        <template v-else>
          Leave your mark in our guestbook. Share a photo and a message.
        </template>
      </p>
    </div>

    <GuestForm
      :form-state="formState"
      :validation="validation"
      :status="status"
      :is-valid="isValid"
      @update:name="setName"
      @update:message="setMessage"
      @update:photo="setPhoto"
      @submit="handleSubmit"
    />
  </div>
</template>
