<script setup lang="ts">
/**
 * User menu component for the header navigation.
 *
 * Authenticated: Shows avatar with dropdown (profile, dashboard, language, theme, logout).
 * Unauthenticated: Shows login button with language and theme toggles.
 */
import { User, LayoutDashboard, Globe, Sun, Moon, Monitor, LogOut, LogIn } from 'lucide-vue-next'

const { t } = useI18n()
const { locale, setLocale } = useI18n()
const { user, isAuthenticated, logout } = useAuth()
const { theme, cycleTheme } = useTheme()
const router = useRouter()

/**
 * User initials for avatar fallback.
 */
const initials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

/**
 * Theme icon based on current setting.
 */
const themeIcon = computed(() => {
  switch (theme.value) {
    case 'light': return Sun
    case 'dark': return Moon
    default: return Monitor
  }
})

/**
 * Theme label for display.
 */
const themeLabel = computed(() => {
  switch (theme.value) {
    case 'light': return 'Light'
    case 'dark': return 'Dark'
    default: return 'System'
  }
})

/**
 * Toggles between EN and DE locales.
 */
function toggleLocale(): void {
  setLocale(locale.value === 'en' ? 'de' : 'en')
}

/**
 * Handles logout and redirects to home.
 */
async function handleLogout(): Promise<void> {
  await logout()
  router.push('/')
}
</script>

<template>
  <ClientOnly>
    <template v-if="isAuthenticated && user">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="flex items-center rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            :aria-label="t('userMenu.profile')"
          >
            <Avatar class="h-9 w-9 cursor-pointer sm:h-8 sm:w-8">
              <AvatarImage
                v-if="user.avatarUrl"
                :src="user.avatarUrl"
                :alt="user.name"
              />
              <AvatarFallback class="bg-primary/15 text-sm font-medium text-primary">
                {{ initials }}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" class="w-56">
          <!-- User info header -->
          <DropdownMenuLabel class="font-normal">
            <div class="flex flex-col space-y-1">
              <p class="text-sm font-medium leading-none">{{ user.name }}</p>
              <p class="text-xs leading-none text-muted-foreground">{{ user.email }}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <!-- Profile -->
          <DropdownMenuItem as-child>
            <NuxtLink to="/profile" class="flex items-center gap-2">
              <User class="h-4 w-4" />
              {{ t('userMenu.profile') }}
            </NuxtLink>
          </DropdownMenuItem>

          <!-- Dashboard -->
          <DropdownMenuItem as-child>
            <NuxtLink to="/dashboard" class="flex items-center gap-2">
              <LayoutDashboard class="h-4 w-4" />
              {{ t('userMenu.dashboard') }}
            </NuxtLink>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <!-- Language toggle -->
          <DropdownMenuItem @select.prevent="toggleLocale">
            <Globe class="mr-2 h-4 w-4" />
            {{ locale.toUpperCase() === 'EN' ? 'English' : 'Deutsch' }}
            <span class="ml-auto text-xs text-muted-foreground">
              {{ locale.toUpperCase() }}
            </span>
          </DropdownMenuItem>

          <!-- Theme cycling -->
          <DropdownMenuItem @select.prevent="cycleTheme">
            <component :is="themeIcon" class="mr-2 h-4 w-4" />
            {{ themeLabel }}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <!-- Logout -->
          <DropdownMenuItem @select="handleLogout">
            <LogOut class="mr-2 h-4 w-4" />
            {{ t('userMenu.logout') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>

    <!-- Unauthenticated: show login + language + theme -->
    <template v-else>
      <NuxtLink
        to="/login"
        class="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogIn class="h-4 w-4" />
        <span class="hidden sm:inline">{{ t('common.login') }}</span>
      </NuxtLink>
      <LanguageSwitcher />
      <ThemeToggle />
    </template>
  </ClientOnly>
</template>
