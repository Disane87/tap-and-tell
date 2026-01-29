<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const { login, isLoading, error, checkAuth } = useAdmin()
const router = useRouter()

const password = ref('')

onMounted(() => {
  if (checkAuth()) {
    router.push('/admin')
  }
})

async function handleSubmit(event: Event) {
  event.preventDefault()

  const success = await login(password.value)

  if (success) {
    toast.success('Welcome back!')
    router.push('/admin')
  } else {
    toast.error(error.value || 'Invalid password')
  }
}
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center">
    <Card class="w-full max-w-sm">
      <CardHeader class="text-center">
        <CardTitle>Admin Login</CardTitle>
        <CardDescription>Enter the admin password to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit="handleSubmit">
          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter password"
              :disabled="isLoading"
              autocomplete="current-password"
            />
          </div>

          <p v-if="error" class="text-sm text-destructive">
            {{ error }}
          </p>

          <Button type="submit" class="w-full" :disabled="isLoading || !password">
            <span v-if="isLoading" class="flex items-center gap-2">
              <span class="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Logging in...
            </span>
            <span v-else>Login</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
