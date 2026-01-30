<script setup lang="ts">
/**
 * Admin login page.
 *
 * Simple password form that authenticates via the admin API.
 * On success, redirects to the admin dashboard.
 */
import { toast } from 'vue-sonner'

const { isAuthenticated, isLoading, error, login, checkAuth } = useAdmin()
const router = useRouter()
const password = ref('')

async function handleLogin(): Promise<void> {
  if (!password.value.trim()) return

  const success = await login(password.value)
  if (success) {
    toast.success('Logged in')
    router.push('/admin')
  }
}

onMounted(() => {
  checkAuth()
  if (isAuthenticated.value) {
    router.push('/admin')
  }
})
</script>

<template>
  <div class="mx-auto flex min-h-[80vh] max-w-sm items-center justify-center px-4">
    <Card class="w-full">
      <CardHeader>
        <CardTitle class="font-display text-xl">Admin Login</CardTitle>
        <CardDescription>Enter the admin password to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-2">
            <Label for="admin-password">Password</Label>
            <Input
              id="admin-password"
              v-model="password"
              type="password"
              placeholder="Enter password"
              :disabled="isLoading"
            />
          </div>
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          <Button type="submit" class="w-full" :disabled="isLoading">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
