<script setup lang="ts">
/**
 * Admin login page.
 *
 * Simple password form that authenticates against the admin API.
 * Redirects to admin dashboard on successful login.
 */
import { toast } from 'vue-sonner'

const { isAuthenticated, login, initAuth } = useAdmin()
const router = useRouter()

const password = ref('')
const loading = ref(false)
const error = ref('')

/**
 * Handles login form submission.
 */
async function handleLogin(): Promise<void> {
  if (!password.value.trim()) {
    error.value = 'Passwort erforderlich'
    return
  }

  loading.value = true
  error.value = ''

  const success = await login(password.value)

  if (success) {
    toast.success('Angemeldet!')
    router.push('/admin')
  } else {
    error.value = 'Falsches Passwort'
    toast.error('Anmeldung fehlgeschlagen')
  }

  loading.value = false
}

onMounted(() => {
  initAuth()
  // Redirect if already authenticated
  if (isAuthenticated.value) {
    router.push('/admin')
  }
})
</script>

<template>
  <div class="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
    <Card class="w-full max-w-sm">
      <CardHeader class="text-center">
        <CardTitle class="font-display text-2xl">Admin Login</CardTitle>
        <CardDescription>
          Melde dich an um Einträge zu verwalten.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-2">
            <Label for="password">Passwort</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="Admin-Passwort"
              :class="{ 'border-destructive': error }"
              :disabled="loading"
            />
            <p v-if="error" class="text-sm text-destructive">
              {{ error }}
            </p>
          </div>
          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Wird angemeldet...' : 'Anmelden' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
