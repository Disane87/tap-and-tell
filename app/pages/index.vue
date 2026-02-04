<script setup lang="ts">
/**
 * Marketing landing page for Tap & Tell.
 *
 * Apple-inspired design with video hero, scroll-reveal animations,
 * pricing table, NFC shop, open source section, and extended footer.
 * Uses layout: false for full-width immersive design.
 */
import { Icon } from '@iconify/vue'

definePageMeta({
  layout: false
})

const { t, tm, rt, te } = useI18n()
const { isAuthenticated } = useAuth()
const { public: { betaMode } } = useRuntimeConfig()

/** Whether we're in beta mode (not open) - hides pricing, shows beta badge */
const isBeta = computed(() => betaMode !== 'open')

const heroVideo = ref<HTMLVideoElement | null>(null)
const videoLoaded = ref(false)
const scrollY = ref(0)
const headerSolid = ref(false)
const billingCycle = ref<'monthly' | 'yearly'>('yearly')

/**
 * Hero video source path. Defined as a const to prevent
 * Vite from trying to resolve the static asset at build time.
 */
const heroVideoSrc = '/videos/hero.mp4'

/**
 * Feature groups displayed in the features section.
 * Three groups: Guest Experience, Customization, Management & Security.
 */
const featureGroups = computed(() => [
  {
    key: 'experience',
    features: [
      { icon: 'lucide:nfc', key: 'nfc' },
      { icon: 'lucide:camera', key: 'photo' },
      { icon: 'lucide:list-checks', key: 'wizard' },
      { icon: 'lucide:message-square-plus', key: 'customQuestions' },
      { icon: 'lucide:wifi-off', key: 'offline' },
      { icon: 'lucide:languages', key: 'i18n' }
    ]
  },
  {
    key: 'customization',
    features: [
      { icon: 'lucide:sun-moon', key: 'theme' },
      { icon: 'lucide:image-plus', key: 'headerImage' },
      { icon: 'lucide:layout-template', key: 'cardStyles' },
      { icon: 'lucide:layout-grid', key: 'viewLayouts' },
      { icon: 'lucide:type', key: 'fonts' },
      { icon: 'lucide:palette', key: 'colorScheme' }
    ]
  },
  {
    key: 'management',
    features: [
      { icon: 'lucide:shield-check', key: 'moderation' },
      { icon: 'lucide:presentation', key: 'slideshow' },
      { icon: 'lucide:file-text', key: 'pdf' },
      { icon: 'lucide:qr-code', key: 'qr' },
      { icon: 'lucide:users', key: 'team' },
      { icon: 'lucide:code-2', key: 'api' }
    ]
  }
])

/**
 * Customization showcase state.
 */
const selectedCardStyle = ref<'polaroid' | 'minimal' | 'rounded' | 'bordered'>('polaroid')
const selectedPreviewColor = ref('#10b981')
const previewColors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4']

const cardStyleOptions = ['polaroid', 'minimal', 'rounded', 'bordered'] as const

/**
 * Security feature cards.
 */
const securityFeatures = computed(() => [
  { icon: 'lucide:lock-keyhole', key: 'twoFactor' },
  { icon: 'lucide:shield', key: 'encryption' },
  { icon: 'lucide:database', key: 'rls' },
  { icon: 'lucide:key-round', key: 'csrf' }
])

/**
 * Steps displayed in the "How it works" section.
 */
const steps = computed(() => [
  { icon: 'lucide:plus-circle', key: 'create', step: 1 },
  { icon: 'lucide:share-2', key: 'share', step: 2 },
  { icon: 'lucide:book-open', key: 'entries', step: 3 }
])

/**
 * Problem section points.
 */
const problemPoints = computed(() => [
  { icon: 'lucide:image-off', key: 'point1' },
  { icon: 'lucide:message-circle-off', key: 'point2' },
  { icon: 'lucide:bell-off', key: 'point3' }
])

/**
 * Solution section points.
 */
const solutionPoints = computed(() => [
  { icon: 'lucide:heart', key: 'point1' },
  { icon: 'lucide:book-open', key: 'point2' },
  { icon: 'lucide:infinity', key: 'point3' }
])

/**
 * Use case scenarios with fictional demo entries.
 * Avatars generated via DiceBear Avataaars API (deterministic SVGs, browser-cached).
 */
const useCases = computed(() => [
  {
    key: 'wedding',
    entries: [
      { name: 'Sophie Bergmann', seed: 'SophieBergmann', badges: ['tea', 'mountains'] },
      { name: 'Luca Fontana', seed: 'LucaFontana', badges: ['coffee', 'earlyBird'] }
    ]
  },
  {
    key: 'birthday',
    entries: [
      { name: 'Tom Fischer', seed: 'TomFischer', badges: ['coffee', 'nightOwl'] },
      { name: 'Mia Chen', seed: 'MiaChen', badges: ['tea', 'beach'] }
    ]
  },
  {
    key: 'housewarming',
    entries: [
      { name: 'Nina Hartmann', seed: 'NinaHartmann', badges: ['coffee', 'mountains'] },
      { name: 'Felix Braun', seed: 'FelixBraun', badges: ['tea', 'earlyBird'] }
    ]
  },
  {
    key: 'farewell',
    entries: [
      { name: 'Julia Meier', seed: 'JuliaMeier', badges: ['coffee', 'beach'] },
      { name: 'David Park', seed: 'DavidPark', badges: ['tea', 'nightOwl'] }
    ]
  }
])

/**
 * Generates a DiceBear avatar URL. Deterministic based on seed,
 * browser-cached via standard HTTP caching.
 */
function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

/**
 * Pricing plans.
 */
const plans = computed(() => [
  { key: 'free', popular: false },
  { key: 'home', popular: true },
  { key: 'family', popular: false },
  { key: 'enterprise', popular: false }
])

/**
 * NFC tag color swatches.
 */
const nfcColors = [
  { key: 'black', hex: '#1a1a1a' },
  { key: 'white', hex: '#f5f5f5' },
  { key: 'mint', hex: '#10b981' },
  { key: 'coral', hex: '#f97316' },
  { key: 'custom', hex: 'conic-gradient(from 0deg, #f97316, #eab308, #22c55e, #06b6d4, #8b5cf6, #ec4899, #f97316)' }
]

const selectedNfcColor = ref('mint')

/**
 * Handles scroll for header transparency.
 */
function handleScroll(): void {
  scrollY.value = window.scrollY
  headerSolid.value = scrollY.value > 50
}

/**
 * Intersection Observer for scroll-reveal animations.
 */
function setupRevealObserver(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  )

  document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
    observer.observe(el)
  })
}

/**
 * Scrolls to a section by ID.
 */
function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  nextTick(() => setupRevealObserver())
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- ============================================
         Header
         ============================================ -->
    <header
      class="fixed top-0 z-50 w-full transition-all duration-300"
      :class="headerSolid
        ? 'border-b border-border/50 bg-background/80 backdrop-blur-xl shadow-sm'
        : 'bg-transparent'"
    >
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div class="flex items-center gap-2">
          <NuxtLink to="/" class="font-handwritten text-xl transition-colors" :class="headerSolid ? 'text-foreground' : 'text-white'">
            Tap & Tell
          </NuxtLink>
          <span
            v-if="isBeta"
            class="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors"
            :class="headerSolid
              ? 'border-primary/50 text-primary'
              : 'border-white/50 text-white/90'"
          >
            Beta
          </span>
        </div>

        <nav class="flex items-center gap-1">
          <!-- Anchor links (desktop) -->
          <button
            class="hidden h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors sm:flex"
            :class="headerSolid ? 'text-muted-foreground hover:text-foreground' : 'text-white/70 hover:text-white'"
            @click="scrollToSection('features')"
          >
            {{ t('landing.features.badge') }}
          </button>
          <button
            class="hidden h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors sm:flex"
            :class="headerSolid ? 'text-muted-foreground hover:text-foreground' : 'text-white/70 hover:text-white'"
            @click="scrollToSection('security')"
          >
            {{ t('landing.security.badge') }}
          </button>
          <button
            v-if="!isBeta"
            class="hidden h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors sm:flex"
            :class="headerSolid ? 'text-muted-foreground hover:text-foreground' : 'text-white/70 hover:text-white'"
            @click="scrollToSection('pricing')"
          >
            {{ t('landing.pricing.badge') }}
          </button>

          <ClientOnly>
            <NuxtLink
              v-if="isAuthenticated"
              to="/dashboard"
            >
              <Button variant="ghost" size="sm" :class="!headerSolid && 'text-white/90 hover:text-white hover:bg-white/10'">
                {{ t('nav.dashboard') }}
              </Button>
            </NuxtLink>
            <NuxtLink v-else to="/login">
              <Button variant="ghost" size="sm" :class="!headerSolid && 'text-white/90 hover:text-white hover:bg-white/10'">
                {{ t('common.login') }}
              </Button>
            </NuxtLink>
          </ClientOnly>

        </nav>
      </div>
    </header>

    <!-- ============================================
         Hero
         ============================================ -->
    <section class="relative flex min-h-[100dvh] items-center justify-center overflow-hidden">
      <video
        ref="heroVideo"
        class="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
        :class="videoLoaded ? 'opacity-100' : 'opacity-0'"
        autoplay
        muted
        loop
        playsinline
        @loadeddata="videoLoaded = true"
      >
        <source :src="heroVideoSrc" type="video/mp4">
      </video>

      <div
        class="hero-gradient absolute inset-0 transition-opacity duration-1000"
        :class="videoLoaded ? 'opacity-0' : 'opacity-100'"
      />

      <div class="absolute inset-0 bg-black/40" />
      <div class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <div class="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <div class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-white/80 backdrop-blur-sm">
          <Icon icon="lucide:sparkles" class="h-3.5 w-3.5" />
          {{ t('landing.hero.badge') }}
        </div>
        <h1 class="mt-6 font-handwritten text-6xl text-white sm:text-8xl lg:text-9xl">
          Tap & Tell
        </h1>
        <p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
          {{ t('landing.hero.subtitle') }}
        </p>
        <div class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <ClientOnly>
            <template v-if="isAuthenticated">
              <NuxtLink to="/dashboard">
                <Button size="lg" class="rounded-full px-8 text-base">
                  {{ t('nav.dashboard') }}
                </Button>
              </NuxtLink>
            </template>
            <template v-else>
              <NuxtLink to="/register">
                <Button size="lg" class="rounded-full px-8 text-base">
                  {{ t('landing.hero.cta') }}
                </Button>
              </NuxtLink>
              <NuxtLink to="/login">
                <Button variant="outline" size="lg" class="rounded-full border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white">
                  {{ t('landing.hero.login') }}
                </Button>
              </NuxtLink>
            </template>
          </ClientOnly>
        </div>
      </div>

      <div class="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div class="scroll-indicator">
          <Icon icon="lucide:chevron-down" class="h-5 w-5 text-white/50" />
        </div>
      </div>
    </section>

    <!-- ============================================
         Problem Section
         ============================================ -->
    <section class="relative overflow-hidden px-6 py-28">
      <!-- Floating orbs -->
      <div class="orb orb-drift-1 absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-500/5 blur-[100px]" :style="{ transform: `translateY(${scrollY * 0.03}px)` }" />
      <div class="orb orb-drift-2 absolute -left-48 bottom-0 h-72 w-72 rounded-full bg-red-400/5 blur-[80px]" :style="{ transform: `translateY(${scrollY * -0.02}px)` }" />
      <div class="mx-auto max-w-5xl">
        <div class="reveal-on-scroll text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.15em] text-red-500">
            {{ t('landing.problem.badge') }}
          </p>
          <h2 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {{ t('landing.problem.title') }}
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {{ t('landing.problem.subtitle') }}
          </p>
        </div>

        <div class="mt-16 grid gap-8 sm:grid-cols-3">
          <div
            v-for="(point, index) in problemPoints"
            :key="point.key"
            class="reveal-on-scroll text-center"
            :style="{ transitionDelay: `${index * 100}ms` }"
          >
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
              <Icon :icon="point.icon" class="h-7 w-7 text-red-500" />
            </div>
            <h3 class="mt-5 text-lg font-semibold tracking-tight">
              {{ t(`landing.problem.${point.key}.title`) }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
              {{ t(`landing.problem.${point.key}.description`) }}
            </p>
          </div>
        </div>

        <!-- Stats -->
        <div class="reveal-on-scroll mt-16 grid gap-6 rounded-2xl border border-border/50 bg-muted/30 p-8 sm:grid-cols-3" style="transition-delay: 200ms">
          <div v-for="i in 3" :key="i" class="text-center">
            <p class="text-3xl font-bold tracking-tight text-foreground">
              {{ t(`landing.problem.stat${i}.number`) }}
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ t(`landing.problem.stat${i}.label`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         Solution Section
         ============================================ -->
    <section class="relative overflow-hidden border-t border-border/50 bg-gradient-to-b from-primary/5 to-transparent px-6 py-28">
      <!-- Floating orbs -->
      <div class="orb orb-drift-3 absolute -left-40 top-20 h-80 w-80 rounded-full bg-primary/8 blur-[100px]" :style="{ transform: `translateY(${scrollY * 0.04}px)` }" />
      <div class="orb orb-drift-1 absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-emerald-500/6 blur-[80px]" :style="{ transform: `translateY(${scrollY * -0.03}px)` }" />
      <div class="mx-auto max-w-5xl">
        <div class="reveal-on-scroll text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {{ t('landing.solution.badge') }}
          </p>
          <h2 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {{ t('landing.solution.title') }}
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {{ t('landing.solution.subtitle') }}
          </p>
        </div>

        <div class="mt-16 grid gap-8 sm:grid-cols-3">
          <div
            v-for="(point, index) in solutionPoints"
            :key="point.key"
            class="reveal-on-scroll group rounded-2xl border border-primary/10 bg-card p-8 text-center transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            :style="{ transitionDelay: `${index * 100}ms` }"
          >
            <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
              <Icon :icon="point.icon" class="h-7 w-7 text-primary" />
            </div>
            <h3 class="mt-5 text-lg font-semibold tracking-tight">
              {{ t(`landing.solution.${point.key}.title`) }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
              {{ t(`landing.solution.${point.key}.description`) }}
            </p>
          </div>
        </div>

      </div>
    </section>

    <!-- ============================================
         Features
         ============================================ -->
    <section id="features" class="relative overflow-hidden px-6 py-28">
      <!-- Floating orbs -->
      <div class="orb orb-drift-2 absolute -right-48 top-40 h-96 w-96 rounded-full bg-primary/6 blur-[120px]" :style="{ transform: `translateY(${scrollY * 0.025}px)` }" />
      <div class="orb orb-drift-3 absolute -left-32 bottom-20 h-72 w-72 rounded-full bg-emerald-400/5 blur-[90px]" :style="{ transform: `translateY(${scrollY * -0.02}px)` }" />
      <div class="mx-auto max-w-6xl">
        <div class="reveal-on-scroll text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {{ t('landing.features.badge') }}
          </p>
          <h2 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {{ t('landing.features.title') }}
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {{ t('landing.features.subtitle') }}
          </p>
        </div>

        <!-- Feature Groups -->
        <div
          v-for="(group, gIdx) in featureGroups"
          :key="group.key"
          class="mt-20 first:mt-16"
        >
          <div class="reveal-on-scroll mb-8 text-center" :style="{ transitionDelay: `${gIdx * 80}ms` }">
            <p class="text-sm font-semibold uppercase tracking-[0.15em] text-primary/70">
              {{ t(`landing.features.groups.${group.key}.title`) }}
            </p>
            <p class="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
              {{ t(`landing.features.groups.${group.key}.subtitle`) }}
            </p>
          </div>

          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="(feature, fIdx) in group.features"
              :key="feature.key"
              class="reveal-on-scroll feature-card group rounded-2xl border border-border/50 bg-card p-7 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              :style="{ transitionDelay: `${gIdx * 80 + fIdx * 60}ms` }"
            >
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
                <Icon :icon="feature.icon" class="h-6 w-6 text-primary" />
              </div>
              <h3 class="mt-5 text-lg font-semibold tracking-tight">
                {{ t(`landing.features.${feature.key}.title`) }}
              </h3>
              <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                {{ t(`landing.features.${feature.key}.description`) }}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ============================================
         How it works
         ============================================ -->
    <section class="relative overflow-hidden border-t border-border/50 bg-muted/30 px-6 py-28">
      <!-- Floating orbs -->
      <div class="orb orb-drift-1 absolute right-10 top-10 h-64 w-64 rounded-full bg-primary/5 blur-[80px]" :style="{ transform: `translateY(${scrollY * 0.02}px)` }" />
      <div class="orb orb-drift-2 absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-emerald-500/4 blur-[100px]" :style="{ transform: `translateY(${scrollY * -0.015}px)` }" />

      <div class="mx-auto max-w-4xl">
        <div class="reveal-on-scroll text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {{ t('landing.howItWorks.badge') }}
          </p>
          <h2 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {{ t('landing.howItWorks.title') }}
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {{ t('landing.howItWorks.subtitle') }}
          </p>
        </div>

        <div class="mt-20 grid gap-12 sm:grid-cols-3 sm:gap-8">
          <div
            v-for="(step, index) in steps"
            :key="step.key"
            class="reveal-on-scroll relative text-center"
            :style="{ transitionDelay: `${index * 120}ms` }"
          >
            <!-- Connector line -->
            <div
              v-if="index > 0"
              class="absolute -left-4 top-8 hidden h-px w-8 bg-border sm:block"
            />

            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg shadow-primary/5">
              <span class="text-2xl font-bold text-primary">{{ step.step }}</span>
            </div>
            <h3 class="mt-6 text-xl font-semibold tracking-tight">
              {{ t(`landing.howItWorks.${step.key}.title`) }}
            </h3>
            <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
              {{ t(`landing.howItWorks.${step.key}.description`) }}
            </p>
          </div>
        </div>

        <!-- How it works CTA -->
        <div class="reveal-on-scroll mt-14 text-center" style="transition-delay: 300ms">
          <ClientOnly>
            <NuxtLink :to="isAuthenticated ? '/dashboard' : '/register'">
              <Button size="lg" class="rounded-full px-10 text-base">
                {{ t('landing.howItWorks.cta') }}
                <Icon icon="lucide:arrow-right" class="ml-2 h-4 w-4" />
              </Button>
            </NuxtLink>
          </ClientOnly>
        </div>
      </div>
    </section>

    <!-- ============================================
         Use Cases / Scenarios
         ============================================ -->
    <section class="relative overflow-hidden px-6 py-28">
      <!-- Floating orbs -->
      <div class="orb orb-drift-3 absolute -right-40 top-0 h-96 w-96 rounded-full bg-primary/6 blur-[120px]" :style="{ transform: `translateY(${scrollY * 0.03}px)` }" />
      <div class="orb orb-drift-1 absolute left-10 bottom-20 h-64 w-64 rounded-full bg-emerald-400/5 blur-[80px]" :style="{ transform: `translateY(${scrollY * -0.025}px)` }" />

      <div class="mx-auto max-w-6xl">
        <div class="reveal-on-scroll text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {{ t('landing.useCases.badge') }}
          </p>
          <h2 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {{ t('landing.useCases.title') }}
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {{ t('landing.useCases.subtitle') }}
          </p>
        </div>

        <div class="mt-16 grid gap-10 lg:grid-cols-2">
          <div
            v-for="(useCase, index) in useCases"
            :key="useCase.key"
            class="reveal-on-scroll"
            :style="{ transitionDelay: `${index * 100}ms` }"
          >
            <!-- Use case header -->
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ t(`landing.useCases.${useCase.key}.emoji`) }}</span>
              <div>
                <h3 class="text-lg font-semibold tracking-tight">
                  {{ t(`landing.useCases.${useCase.key}.title`) }}
                </h3>
                <p class="text-xs text-muted-foreground">
                  {{ t(`landing.useCases.${useCase.key}.eventName`) }}
                </p>
              </div>
            </div>
            <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
              {{ t(`landing.useCases.${useCase.key}.description`) }}
            </p>

            <!-- Mock guestbook entries -->
            <div class="mt-5 space-y-3">
              <div
                v-for="(entry, eIdx) in useCase.entries"
                :key="entry.seed"
                class="group/entry rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-primary/15 hover:shadow-md"
              >
                <div class="flex items-center gap-3">
                  <img
                    :src="avatarUrl(entry.seed)"
                    :alt="entry.name"
                    class="h-10 w-10 shrink-0 rounded-full bg-muted"
                    loading="lazy"
                    width="40"
                    height="40"
                  >
                  <div class="min-w-0">
                    <p class="text-sm font-medium truncate">{{ entry.name }}</p>
                    <div class="flex gap-1.5 mt-0.5">
                      <span
                        v-for="badge in entry.badges"
                        :key="badge"
                        class="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary"
                      >
                        <Icon
                          :icon="badge === 'coffee' ? 'lucide:coffee' : badge === 'tea' ? 'lucide:cup-soda' : badge === 'nightOwl' ? 'lucide:moon' : badge === 'earlyBird' ? 'lucide:sunrise' : badge === 'beach' ? 'lucide:waves' : 'lucide:mountain'"
                          class="h-2.5 w-2.5"
                        />
                        {{ t(`entry.badges.${badge}`) }}
                      </span>
                    </div>
                  </div>
                </div>
                <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {{ t(`landing.useCases.${useCase.key}.entry${eIdx + 1}.message`) }}
                </p>
                <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground/70">
                  <span v-if="te(`landing.useCases.${useCase.key}.entry${eIdx + 1}.song`)">
                    <Icon icon="lucide:music" class="mr-1 inline h-3 w-3" />{{ t(`landing.useCases.${useCase.key}.entry${eIdx + 1}.song`) }}
                  </span>
                  <span v-if="te(`landing.useCases.${useCase.key}.entry${eIdx + 1}.food`)">
                    <Icon icon="lucide:utensils" class="mr-1 inline h-3 w-3" />{{ t(`landing.useCases.${useCase.key}.entry${eIdx + 1}.food`) }}
                  </span>
                  <span v-if="te(`landing.useCases.${useCase.key}.entry${eIdx + 1}.superpower`)">
                    <Icon icon="lucide:zap" class="mr-1 inline h-3 w-3" />{{ t(`landing.useCases.${useCase.key}.entry${eIdx + 1}.superpower`) }}
                  </span>
                  <span v-if="te(`landing.useCases.${useCase.key}.entry${eIdx + 1}.memory`)">
                    <Icon icon="lucide:heart" class="mr-1 inline h-3 w-3" />{{ t(`landing.useCases.${useCase.key}.entry${eIdx + 1}.memory`) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Disclaimer -->
            <p class="mt-2 text-[10px] text-muted-foreground/50 italic">
              {{ t('landing.useCases.disclaimer') }}
            </p>
          </div>
        </div>

      </div>
    </section>

    <!-- ============================================
         Customization Showcase
         ============================================ -->
    <section id="customization" class="relative overflow-hidden border-t border-border/50 bg-muted/30 px-6 py-28">
      <!-- Floating orbs -->
      <div class="orb orb-drift-1 absolute -right-32 top-20 h-80 w-80 rounded-full bg-primary/6 blur-[100px]" :style="{ transform: `translateY(${scrollY * 0.03}px)` }" />
      <div class="orb orb-drift-3 absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-emerald-400/5 blur-[80px]" :style="{ transform: `translateY(${scrollY * -0.02}px)` }" />

      <div class="mx-auto max-w-6xl">
        <div class="reveal-on-scroll text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {{ t('landing.customization.badge') }}
          </p>
          <h2 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {{ t('landing.customization.title') }}
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {{ t('landing.customization.subtitle') }}
          </p>
        </div>

        <div class="mt-16 grid items-center gap-12 lg:grid-cols-2">
          <!-- Left: Controls -->
          <div class="reveal-on-scroll space-y-8" style="transition-delay: 100ms">
            <!-- Card Style Selector -->
            <div>
              <p class="mb-3 text-sm font-medium">{{ t('landing.customization.cardStyleLabel') }}</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="style in cardStyleOptions"
                  :key="style"
                  class="rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200"
                  :class="selectedCardStyle === style
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'"
                  @click="selectedCardStyle = style"
                >
                  {{ t(`landing.customization.styles.${style}`) }}
                </button>
              </div>
            </div>

            <!-- Color Selector -->
            <div>
              <p class="mb-3 text-sm font-medium">{{ t('landing.customization.colorLabel') }}</p>
              <div class="flex gap-3">
                <button
                  v-for="color in previewColors"
                  :key="color"
                  class="relative h-10 w-10 rounded-full border-2 transition-all duration-200"
                  :class="selectedPreviewColor === color
                    ? 'border-foreground scale-110 shadow-lg'
                    : 'border-border hover:scale-105'"
                  :style="{ backgroundColor: color }"
                  @click="selectedPreviewColor = color"
                >
                  <Icon
                    v-if="selectedPreviewColor === color"
                    icon="lucide:check"
                    class="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-white"
                  />
                </button>
              </div>
            </div>

            <!-- Feature Bullets -->
            <ul class="grid gap-3 sm:grid-cols-2">
              <li v-for="bullet in ['questions', 'socialLinks', 'colorScheme', 'slideshow', 'backgrounds', 'ctaText']" :key="bullet" class="flex items-center gap-2.5 text-sm">
                <Icon icon="lucide:check" class="h-4 w-4 shrink-0 text-primary" />
                <span class="text-muted-foreground">{{ t(`landing.customization.bullets.${bullet}`) }}</span>
              </li>
            </ul>
          </div>

          <!-- Right: Mock Card Preview -->
          <div class="reveal-on-scroll flex justify-center" style="transition-delay: 200ms">
            <ClientOnly>
              <div
                class="w-full max-w-sm transition-all duration-500"
                :class="{
                  'preview-polaroid': selectedCardStyle === 'polaroid',
                  'preview-minimal': selectedCardStyle === 'minimal',
                  'preview-rounded': selectedCardStyle === 'rounded',
                  'preview-bordered': selectedCardStyle === 'bordered'
                }"
                :style="selectedCardStyle === 'bordered' ? { borderLeftColor: selectedPreviewColor } : {}"
              >
                <div
                  class="overflow-hidden bg-card p-6"
                  :class="{
                    'rounded-xl shadow-xl': selectedCardStyle === 'polaroid',
                    'rounded-lg border border-border': selectedCardStyle === 'minimal',
                    'rounded-3xl': selectedCardStyle === 'rounded',
                    'rounded-xl': selectedCardStyle === 'bordered'
                  }"
                  :style="selectedCardStyle === 'rounded' ? { backgroundColor: selectedPreviewColor + '10' } : {}"
                >
                  <!-- Mock entry header -->
                  <div class="flex items-center gap-3">
                    <img
                      :src="avatarUrl('EmmaLarsson')"
                      :alt="t('landing.customization.mockEntry.name')"
                      class="h-12 w-12 shrink-0 rounded-full bg-muted"
                      loading="lazy"
                      width="48"
                      height="48"
                    >
                    <div>
                      <p class="font-medium">{{ t('landing.customization.mockEntry.name') }}</p>
                      <div class="mt-0.5 flex gap-1.5">
                        <span
                          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                          :style="{ backgroundColor: selectedPreviewColor + '15', color: selectedPreviewColor }"
                        >
                          <Icon icon="lucide:music" class="h-2.5 w-2.5" />
                          Jazz
                        </span>
                        <span
                          class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                          :style="{ backgroundColor: selectedPreviewColor + '15', color: selectedPreviewColor }"
                        >
                          <Icon icon="lucide:heart" class="h-2.5 w-2.5" />
                          Travel
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Mock message -->
                  <p class="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {{ t('landing.customization.mockEntry.message') }}
                  </p>

                  <!-- Mock photo placeholder -->
                  <div
                    class="mt-4 flex h-40 items-center justify-center rounded-lg"
                    :style="{ backgroundColor: selectedPreviewColor + '10' }"
                  >
                    <Icon icon="lucide:image" class="h-8 w-8" :style="{ color: selectedPreviewColor + '40' }" />
                  </div>
                </div>
              </div>
            </ClientOnly>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         Why Memories Matter
         ============================================ -->
    <section class="relative overflow-hidden px-6 py-28">
      <!-- Floating orbs -->
      <div class="orb orb-drift-2 absolute -left-32 top-10 h-80 w-80 rounded-full bg-primary/5 blur-[100px]" :style="{ transform: `translateY(${scrollY * 0.02}px)` }" />
      <div class="orb orb-drift-3 absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-emerald-500/4 blur-[90px]" :style="{ transform: `translateY(${scrollY * -0.02}px)` }" />

      <div class="mx-auto max-w-3xl">
        <div class="reveal-on-scroll text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {{ t('landing.memories.badge') }}
          </p>
          <h2 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {{ t('landing.memories.title') }}
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {{ t('landing.memories.subtitle') }}
          </p>
        </div>

        <div class="reveal-on-scroll mt-14 space-y-6" style="transition-delay: 150ms">
          <p class="text-base leading-relaxed text-muted-foreground">
            {{ t('landing.memories.paragraph1') }}
          </p>
          <p class="text-base leading-relaxed text-foreground font-medium">
            {{ t('landing.memories.paragraph2') }}
          </p>
          <p class="text-base leading-relaxed text-muted-foreground">
            {{ t('landing.memories.paragraph3') }}
          </p>
        </div>

      </div>
    </section>

    <!-- ============================================
         Security & Trust
         ============================================ -->
    <section id="security" class="relative overflow-hidden border-t border-border/50 bg-muted/30 px-6 py-28">
      <!-- Floating orbs -->
      <div class="orb orb-drift-2 absolute -right-32 top-10 h-80 w-80 rounded-full bg-primary/5 blur-[100px]" :style="{ transform: `translateY(${scrollY * 0.025}px)` }" />
      <div class="orb orb-drift-1 absolute -left-24 bottom-20 h-72 w-72 rounded-full bg-emerald-400/4 blur-[80px]" :style="{ transform: `translateY(${scrollY * -0.02}px)` }" />

      <div class="mx-auto max-w-5xl">
        <div class="reveal-on-scroll text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {{ t('landing.security.badge') }}
          </p>
          <h2 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {{ t('landing.security.title') }}
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {{ t('landing.security.subtitle') }}
          </p>
        </div>

        <!-- Security Cards -->
        <div class="mt-16 grid gap-6 sm:grid-cols-2">
          <div
            v-for="(feature, index) in securityFeatures"
            :key="feature.key"
            class="reveal-on-scroll group rounded-2xl border border-border/50 bg-card p-7 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
            :style="{ transitionDelay: `${index * 80}ms` }"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
              <Icon :icon="feature.icon" class="h-6 w-6 text-primary" />
            </div>
            <h3 class="mt-5 text-lg font-semibold tracking-tight">
              {{ t(`landing.security.${feature.key}.title`) }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
              {{ t(`landing.security.${feature.key}.description`) }}
            </p>
          </div>
        </div>

        <!-- Trust Badges -->
        <div class="reveal-on-scroll mt-12 flex flex-wrap items-center justify-center gap-4" style="transition-delay: 300ms">
          <div
            v-for="badge in ['encrypted', 'openSource', 'gdpr']"
            :key="badge"
            class="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/70 px-5 py-2.5 text-sm font-medium backdrop-blur-xl"
          >
            <Icon
              :icon="badge === 'encrypted' ? 'lucide:lock' : badge === 'openSource' ? 'lucide:github' : 'lucide:shield-check'"
              class="h-4 w-4 text-primary"
            />
            {{ t(`landing.security.trustBadges.${badge}`) }}
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         Pricing (hidden in private beta)
         ============================================ -->
    <section v-if="!isBeta" id="pricing" class="relative overflow-hidden px-6 py-28">
      <!-- Floating orbs -->
      <div class="orb orb-drift-1 absolute -right-32 top-20 h-80 w-80 rounded-full bg-primary/5 blur-[100px]" :style="{ transform: `translateY(${scrollY * 0.02}px)` }" />
      <div class="orb orb-drift-3 absolute -left-40 bottom-40 h-96 w-96 rounded-full bg-emerald-400/4 blur-[120px]" :style="{ transform: `translateY(${scrollY * -0.015}px)` }" />
      <div class="mx-auto max-w-6xl">
        <div class="reveal-on-scroll text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {{ t('landing.pricing.badge') }}
          </p>
          <h2 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {{ t('landing.pricing.title') }}
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {{ t('landing.pricing.subtitle') }}
          </p>

          <!-- Billing toggle -->
          <div class="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-muted/50 p-1">
            <button
              class="rounded-full px-5 py-2 text-sm font-medium transition-all"
              :class="billingCycle === 'monthly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'"
              @click="billingCycle = 'monthly'"
            >
              {{ t('landing.pricing.monthly') }}
            </button>
            <button
              class="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all"
              :class="billingCycle === 'yearly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'"
              @click="billingCycle = 'yearly'"
            >
              {{ t('landing.pricing.yearly') }}
              <span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {{ t('landing.pricing.yearlyDiscount') }}
              </span>
            </button>
          </div>
        </div>

        <!-- Plans grid -->
        <div class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="(plan, index) in plans"
            :key="plan.key"
            class="reveal-on-scroll relative flex flex-col rounded-2xl border p-7 transition-all duration-300"
            :class="plan.popular
              ? 'border-primary bg-card shadow-xl shadow-primary/10 ring-1 ring-primary/20'
              : 'border-border/50 bg-card hover:border-border'"
            :style="{ transitionDelay: `${index * 80}ms` }"
          >
            <!-- Popular badge -->
            <div
              v-if="plan.popular"
              class="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground"
            >
              {{ t(`landing.pricing.${plan.key}.popular`) }}
            </div>

            <h3 class="text-lg font-semibold">
              {{ t(`landing.pricing.${plan.key}.name`) }}
            </h3>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ t(`landing.pricing.${plan.key}.description`) }}
            </p>

            <!-- Price -->
            <div class="mt-5 flex items-baseline gap-1">
              <template v-if="plan.key === 'enterprise'">
                <span class="text-3xl font-bold tracking-tight">
                  {{ t(`landing.pricing.${plan.key}.price`) }}
                </span>
              </template>
              <template v-else-if="plan.key === 'free'">
                <span class="text-4xl font-bold tracking-tight">${{ t(`landing.pricing.${plan.key}.price`) }}</span>
              </template>
              <template v-else>
                <span class="text-4xl font-bold tracking-tight">
                  ${{ billingCycle === 'yearly'
                    ? t(`landing.pricing.${plan.key}.priceYearly`)
                    : t(`landing.pricing.${plan.key}.price`)
                  }}
                </span>
                <span class="text-sm text-muted-foreground">
                  {{ billingCycle === 'yearly' ? t('landing.pricing.perYear') : t('landing.pricing.perMonth') }}
                </span>
              </template>
            </div>

            <!-- CTA -->
            <NuxtLink :to="plan.key === 'enterprise' ? '#' : '/register'" class="mt-6">
              <Button
                class="w-full rounded-full"
                :variant="plan.popular ? 'default' : 'outline'"
              >
                {{ t(`landing.pricing.${plan.key}.cta`) }}
              </Button>
            </NuxtLink>

            <!-- Features list -->
            <ul class="mt-7 flex flex-1 flex-col gap-3">
              <li
                v-for="(feature, fIdx) in tm(`landing.pricing.${plan.key}.features`)"
                :key="fIdx"
                class="flex items-start gap-2.5 text-sm"
              >
                <Icon icon="lucide:check" class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span class="text-muted-foreground">{{ rt(feature) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         NFC Tag Shop
         ============================================ -->
    <section id="nfc-shop" class="relative overflow-hidden border-t border-border/50 bg-muted/30 px-6 py-28">
      <!-- Floating orbs -->
      <div class="orb orb-drift-2 absolute right-20 top-0 h-72 w-72 rounded-full bg-primary/5 blur-[90px]" :style="{ transform: `translateY(${scrollY * 0.02}px)` }" />
      <div class="orb orb-drift-1 absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-emerald-500/4 blur-[80px]" :style="{ transform: `translateY(${scrollY * -0.02}px)` }" />
      <div class="mx-auto max-w-6xl">
        <div class="grid items-center gap-16 lg:grid-cols-2">
          <!-- Left: Text -->
          <div class="reveal-on-scroll">
            <p class="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              {{ t('landing.nfcShop.badge') }}
            </p>
            <h2 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              {{ t('landing.nfcShop.title') }}
            </h2>
            <p class="mt-4 text-lg leading-relaxed text-muted-foreground">
              {{ t('landing.nfcShop.subtitle') }}
            </p>

            <ul class="mt-8 flex flex-col gap-4">
              <li class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon icon="lucide:link" class="h-4 w-4 text-primary" />
                </div>
                <span class="text-sm">{{ t('landing.nfcShop.preProgrammed') }}</span>
              </li>
              <li class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon icon="lucide:shield" class="h-4 w-4 text-primary" />
                </div>
                <span class="text-sm">{{ t('landing.nfcShop.durable') }}</span>
              </li>
              <li class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon icon="lucide:zap" class="h-4 w-4 text-primary" />
                </div>
                <span class="text-sm">{{ t('landing.nfcShop.easySetup') }}</span>
              </li>
            </ul>

            <div class="mt-8 flex items-end gap-2">
              <span class="text-sm text-muted-foreground">{{ t('landing.nfcShop.startingAt') }}</span>
              <span class="text-3xl font-bold tracking-tight">$9.99</span>
              <span class="pb-0.5 text-sm text-muted-foreground">{{ t('landing.nfcShop.perTag') }}</span>
            </div>

            <Button size="lg" class="mt-6 rounded-full px-8">
              <Icon icon="lucide:shopping-bag" class="mr-2 h-4 w-4" />
              {{ t('landing.nfcShop.cta') }}
            </Button>
          </div>

          <!-- Right: Color picker visual -->
          <div class="reveal-on-scroll" style="transition-delay: 150ms">
            <div class="mx-auto max-w-sm">
              <!-- NFC Tag visual -->
              <div class="nfc-tag-visual relative mx-auto flex h-64 w-64 items-center justify-center rounded-[2rem] shadow-2xl transition-all duration-500" :style="{ background: nfcColors.find(c => c.key === selectedNfcColor)?.hex }">
                <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Icon icon="lucide:nfc" class="h-10 w-10" :class="selectedNfcColor === 'white' ? 'text-gray-800' : 'text-white'" />
                </div>
                <!-- Pulse ring -->
                <div class="nfc-pulse absolute inset-0 rounded-[2rem]" />
              </div>

              <!-- Color selector -->
              <div class="mt-8 text-center">
                <p class="text-sm font-medium text-muted-foreground">{{ t('landing.nfcShop.colorChoice') }}</p>
                <div class="mt-3 flex justify-center gap-3">
                  <button
                    v-for="color in nfcColors"
                    :key="color.key"
                    class="group relative h-10 w-10 rounded-full border-2 transition-all duration-200"
                    :class="selectedNfcColor === color.key
                      ? 'border-primary scale-110 shadow-lg'
                      : 'border-border hover:scale-105'"
                    :style="{ background: color.hex }"
                    :title="t(`landing.nfcShop.colors.${color.key}`)"
                    @click="selectedNfcColor = color.key"
                  >
                    <Icon
                      v-if="selectedNfcColor === color.key"
                      icon="lucide:check"
                      class="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2"
                      :class="['white', 'custom'].includes(color.key) ? 'text-gray-800' : 'text-white'"
                    />
                  </button>
                </div>
                <p class="mt-3 text-xs text-muted-foreground">{{ t('landing.nfcShop.colorHint') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         Open Source & Self-Hosting
         ============================================ -->
    <section id="open-source" class="relative overflow-hidden px-6 py-28">
      <!-- Floating orbs -->
      <div class="orb orb-drift-3 absolute -right-24 top-10 h-80 w-80 rounded-full bg-primary/5 blur-[100px]" :style="{ transform: `translateY(${scrollY * 0.025}px)` }" />
      <div class="orb orb-drift-2 absolute -left-32 bottom-20 h-72 w-72 rounded-full bg-emerald-400/4 blur-[80px]" :style="{ transform: `translateY(${scrollY * -0.02}px)` }" />
      <div class="mx-auto max-w-6xl">
        <div class="reveal-on-scroll text-center">
          <p class="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {{ t('landing.openSource.badge') }}
          </p>
          <h2 class="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {{ t('landing.openSource.title') }}
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {{ t('landing.openSource.subtitle') }}
          </p>
        </div>

        <div class="mt-16 grid gap-8 lg:grid-cols-2">
          <!-- GitHub Card -->
          <div class="reveal-on-scroll group rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-border hover:shadow-lg">
            <div class="flex items-center gap-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/5">
                <Icon icon="lucide:github" class="h-7 w-7" />
              </div>
              <div>
                <h3 class="text-xl font-semibold tracking-tight">tap-and-tell</h3>
                <div class="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <span class="flex items-center gap-1">
                    <Icon icon="lucide:scale" class="h-3.5 w-3.5" />
                    {{ t('landing.openSource.license') }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Icon icon="lucide:users" class="h-3.5 w-3.5" />
                    {{ t('landing.openSource.contributors') }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-6 flex gap-3">
              <Button variant="outline" class="rounded-full">
                <Icon icon="lucide:github" class="mr-2 h-4 w-4" />
                {{ t('landing.openSource.github') }}
              </Button>
              <Button variant="outline" class="rounded-full">
                <Icon icon="lucide:star" class="mr-2 h-4 w-4" />
                Star
              </Button>
            </div>
          </div>

          <!-- Docker Card -->
          <div class="reveal-on-scroll group rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-border hover:shadow-lg" style="transition-delay: 100ms">
            <div class="flex items-center gap-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
                <Icon icon="lucide:container" class="h-7 w-7 text-blue-500" />
              </div>
              <div>
                <h3 class="text-xl font-semibold tracking-tight">{{ t('landing.openSource.docker.title') }}</h3>
                <p class="mt-1 text-sm text-muted-foreground">{{ t('landing.openSource.docker.description') }}</p>
              </div>
            </div>

            <!-- Terminal-style code block -->
            <div class="mt-6 overflow-hidden rounded-xl border border-border bg-[#0d1117] text-sm">
              <div class="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
                <div class="h-3 w-3 rounded-full bg-red-500/70" />
                <div class="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div class="h-3 w-3 rounded-full bg-green-500/70" />
                <span class="ml-3 text-xs text-white/40">Terminal</span>
              </div>
              <div class="space-y-1 p-4 font-mono text-xs leading-relaxed text-green-400">
                <p><span class="text-white/40"># {{ t('landing.openSource.docker.step1') }}</span></p>
                <p>$ git clone https://github.com/tap-and-tell/tap-and-tell.git</p>
                <p class="mt-2"><span class="text-white/40"># {{ t('landing.openSource.docker.step2') }}</span></p>
                <p>$ cp .env.example .env</p>
                <p class="mt-2"><span class="text-white/40"># {{ t('landing.openSource.docker.step3') }}</span></p>
                <p>$ docker compose up -d</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         Final CTA
         ============================================ -->
    <section class="px-6 py-28">
      <div class="reveal-on-scroll mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-emerald-600 p-12 text-center sm:p-20">
        <h2 class="text-3xl font-bold tracking-tight text-white sm:text-5xl">
          {{ t('landing.ctaSection.title') }}
        </h2>
        <p class="mx-auto mt-5 max-w-md text-lg text-white/80">
          {{ t('landing.ctaSection.subtitle') }}
        </p>
        <div class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <ClientOnly>
            <NuxtLink :to="isAuthenticated ? '/dashboard' : '/register'">
              <Button size="lg" class="rounded-full bg-white px-10 text-base font-semibold text-primary shadow-xl hover:bg-white/90">
                {{ isAuthenticated ? t('nav.dashboard') : t('landing.hero.cta') }}
              </Button>
            </NuxtLink>
          </ClientOnly>
          <Button v-if="!isBeta" variant="outline" size="lg" class="rounded-full border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white" @click="scrollToSection('pricing')">
            {{ t('landing.pricing.badge') }}
          </Button>
        </div>
      </div>
    </section>

    <!-- ============================================
         Footer
         ============================================ -->
    <footer class="border-t border-border bg-muted/30 px-6 py-16">
      <div class="mx-auto max-w-6xl">
        <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Brand -->
          <div class="lg:col-span-1">
            <span class="font-handwritten text-2xl">Tap & Tell</span>
            <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
              {{ t('landing.footer.madeWith') }}
            </p>
            <div class="mt-4 flex gap-3">
              <Button variant="ghost" size="sm" class="h-9 w-9 rounded-full p-0">
                <Icon icon="lucide:github" class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <!-- Product links -->
          <div>
            <h4 class="text-sm font-semibold">{{ t('landing.footer.product') }}</h4>
            <ul class="mt-3 flex flex-col gap-2">
              <li>
                <button class="text-sm text-muted-foreground transition-colors hover:text-foreground" @click="scrollToSection('features')">
                  {{ t('landing.footer.features') }}
                </button>
              </li>
              <li v-if="!isBeta">
                <button class="text-sm text-muted-foreground transition-colors hover:text-foreground" @click="scrollToSection('pricing')">
                  {{ t('landing.footer.pricing') }}
                </button>
              </li>
              <li>
                <button class="text-sm text-muted-foreground transition-colors hover:text-foreground" @click="scrollToSection('nfc-shop')">
                  {{ t('landing.footer.nfcTags') }}
                </button>
              </li>
              <li>
                <button class="text-sm text-muted-foreground transition-colors hover:text-foreground" @click="scrollToSection('security')">
                  {{ t('landing.footer.security') }}
                </button>
              </li>
            </ul>
          </div>

          <!-- Resources -->
          <div>
            <h4 class="text-sm font-semibold">{{ t('landing.footer.resources') }}</h4>
            <ul class="mt-3 flex flex-col gap-2">
              <li><span class="text-sm text-muted-foreground">{{ t('landing.footer.docs') }}</span></li>
              <li>
                <button class="text-sm text-muted-foreground transition-colors hover:text-foreground" @click="scrollToSection('open-source')">
                  {{ t('landing.footer.github') }}
                </button>
              </li>
              <li>
                <button class="text-sm text-muted-foreground transition-colors hover:text-foreground" @click="scrollToSection('open-source')">
                  {{ t('landing.footer.docker') }}
                </button>
              </li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h4 class="text-sm font-semibold">{{ t('landing.footer.legal') }}</h4>
            <ul class="mt-3 flex flex-col gap-2">
              <li><span class="text-sm text-muted-foreground">{{ t('landing.footer.privacy') }}</span></li>
              <li><span class="text-sm text-muted-foreground">{{ t('landing.footer.terms') }}</span></li>
              <li><span class="text-sm text-muted-foreground">{{ t('landing.footer.imprint') }}</span></li>
            </ul>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p class="text-sm text-muted-foreground">
            {{ t('landing.footer.copyright', { year: new Date().getFullYear() }) }}
          </p>
          <div class="flex items-center gap-1 text-sm text-muted-foreground">
            <Icon icon="lucide:heart" class="h-3.5 w-3.5 text-red-500" />
            <span>Open Source</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Animated gradient hero background (fallback when no video) */
.hero-gradient {
  background: linear-gradient(-45deg, #0f766e, #059669, #10b981, #047857, #064e3b);
  background-size: 400% 400%;
  animation: hero-gradient-shift 15s ease infinite;
}

@keyframes hero-gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Scroll indicator bounce */
.scroll-indicator {
  animation: scroll-bounce 2s ease-in-out infinite;
}

@keyframes scroll-bounce {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(8px); opacity: 0.5; }
}

/* Scroll-reveal animation */
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal-on-scroll.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Feature card staggered reveal */
.feature-card.reveal-on-scroll {
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.3s ease,
              box-shadow 0.3s ease;
}

/* Customization showcase card style variants */
.preview-polaroid {
  box-shadow: 0 8px 30px -5px rgba(0, 0, 0, 0.15);
  transform: rotate(-1deg);
}

.preview-minimal {
  box-shadow: none;
}

.preview-rounded {
  border-radius: 1.5rem;
}

.preview-bordered {
  border-left: 4px solid;
}

/* NFC Tag pulse animation */
.nfc-pulse {
  border: 2px solid rgba(255, 255, 255, 0.3);
  animation: nfc-ring 2.5s ease-out infinite;
}

@keyframes nfc-ring {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.15);
    opacity: 0;
  }
}

/* NFC tag visual shadow */
.nfc-tag-visual {
  box-shadow:
    0 20px 60px -15px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}

/* Floating orb animations — three different drift patterns */
.orb {
  pointer-events: none;
  will-change: transform;
}

.orb-drift-1 {
  animation: orb-float-1 20s ease-in-out infinite;
}

.orb-drift-2 {
  animation: orb-float-2 25s ease-in-out infinite;
}

.orb-drift-3 {
  animation: orb-float-3 30s ease-in-out infinite;
}

@keyframes orb-float-1 {
  0%, 100% { translate: 0 0; }
  25% { translate: 30px -20px; }
  50% { translate: -15px -35px; }
  75% { translate: 20px 15px; }
}

@keyframes orb-float-2 {
  0%, 100% { translate: 0 0; }
  33% { translate: -25px 30px; }
  66% { translate: 35px -15px; }
}

@keyframes orb-float-3 {
  0%, 100% { translate: 0 0; }
  20% { translate: 20px 25px; }
  40% { translate: -30px 10px; }
  60% { translate: 10px -30px; }
  80% { translate: -20px -10px; }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .orb {
    animation: none !important;
  }
}
</style>
