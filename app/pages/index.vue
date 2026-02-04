<script setup lang="ts">
/**
 * Marketing landing page for Tap & Tell.
 *
 * "Warm Memories" Design - Emotional, inviting, human-centered.
 * Optimized for maximum conversion with social proof, urgency, and clear CTAs.
 */
import { Icon } from '@iconify/vue'

definePageMeta({
  layout: false
})

const { t } = useI18n()
const { isAuthenticated } = useAuth()
const { public: { betaMode } } = useRuntimeConfig()
const { openSettings: openCookieSettings } = useCookieConsent()

/** Whether we're in beta mode (not open) - hides pricing, shows beta/waitlist */
const isBeta = computed(() => betaMode !== 'open')

const scrollY = ref(0)
const headerSolid = ref(false)

/** Selected card style for customization demo */
const selectedCardStyle = ref('polaroid')
const cardStyles = ['polaroid', 'minimal', 'rounded', 'bordered']

/** Selected accent color for customization demo */
const selectedColor = ref('#E07A5F')
const accentColors = [
  { value: '#E07A5F', name: 'Coral' },
  { value: '#6366f1', name: 'Indigo' },
  { value: '#10b981', name: 'Emerald' },
  { value: '#f59e0b', name: 'Amber' },
  { value: '#ec4899', name: 'Pink' },
  { value: '#8b5cf6', name: 'Violet' }
]

/** Selected NFC tag color */
const selectedNfcColor = ref('black')

/** Pricing toggle */
const isYearly = ref(true)

/**
 * Feature groups for organized display.
 */
const featureGroups = computed(() => [
  {
    key: 'experience',
    features: [
      { icon: 'lucide:smartphone-nfc', key: 'nfc' },
      { icon: 'lucide:camera', key: 'photo' },
      { icon: 'lucide:wand-2', key: 'wizard' },
      { icon: 'lucide:message-square-plus', key: 'customQuestions' },
      { icon: 'lucide:wifi-off', key: 'offline' },
      { icon: 'lucide:languages', key: 'i18n' }
    ]
  },
  {
    key: 'customization',
    features: [
      { icon: 'lucide:sun-moon', key: 'theme' },
      { icon: 'lucide:image', key: 'headerImage' },
      { icon: 'lucide:square', key: 'cardStyles' },
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
      { icon: 'lucide:file-down', key: 'pdf' },
      { icon: 'lucide:qr-code', key: 'qr' },
      { icon: 'lucide:users', key: 'team' },
      { icon: 'lucide:webhook', key: 'api' }
    ]
  }
])

/**
 * How it works steps.
 */
const steps = computed(() => [
  { icon: 'lucide:plus-circle', key: 'create', num: '01' },
  { icon: 'lucide:share-2', key: 'share', num: '02' },
  { icon: 'lucide:heart', key: 'collect', num: '03' }
])

/**
 * Use cases with detailed entries.
 */
const useCases = computed(() => ['wedding', 'birthday', 'housewarming'])

/**
 * More use cases (simple cards).
 */
const moreUseCases = computed(() => [
  { emoji: '✈️', key: 'farewell' },
  { emoji: '🎓', key: 'graduation' },
  { emoji: '👶', key: 'babyshower' }
])

/**
 * Security features.
 */
const securityFeatures = ['twoFactor', 'encryption', 'rls', 'csrf']

/**
 * Beta features for waitlist section.
 */
const betaFeatures = ['free', 'feedback', 'early', 'limit']

/**
 * NFC tag colors.
 */
const nfcColors = computed(() => [
  { key: 'black', color: '#1a1a1a' },
  { key: 'white', color: '#f5f5f5' },
  { key: 'mint', color: '#81B29A' },
  { key: 'coral', color: '#E07A5F' },
  { key: 'custom', color: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }
])

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
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )

  document.querySelectorAll('.reveal').forEach((el) => {
    observer.observe(el)
  })
}

/**
 * Smooth scroll to section.
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
  <div class="min-h-screen bg-background text-foreground overflow-x-hidden">
    <!-- Decorative blobs -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div class="blob blob-1" />
      <div class="blob blob-2" />
      <div class="blob blob-3" />
    </div>

    <!-- ============================================
         Header
         ============================================ -->
    <header
      class="fixed top-0 z-50 w-full transition-all duration-500"
      :class="headerSolid
        ? 'bg-background/90 backdrop-blur-xl border-b border-border/50 shadow-sm'
        : 'bg-transparent'"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="font-handwritten text-2xl text-foreground">
            Tap & Tell
          </NuxtLink>
          <span
            v-if="isBeta"
            class="rounded-full bg-coral/10 border border-coral/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-coral"
          >
            Beta
          </span>
        </div>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-6 text-sm">
          <button class="text-muted-foreground hover:text-foreground transition-colors" @click="scrollToSection('features')">
            {{ t('landing.footer.features') }}
          </button>
          <button class="text-muted-foreground hover:text-foreground transition-colors" @click="scrollToSection('usecases')">
            {{ t('landing.useCases.badge') }}
          </button>
          <button v-if="!isBeta" class="text-muted-foreground hover:text-foreground transition-colors" @click="scrollToSection('pricing')">
            {{ t('landing.footer.pricing') }}
          </button>
          <button class="text-muted-foreground hover:text-foreground transition-colors" @click="scrollToSection('security')">
            {{ t('landing.footer.security') }}
          </button>
        </nav>

        <div class="flex items-center gap-2">
          <ClientOnly>
            <NuxtLink
              v-if="isAuthenticated"
              to="/dashboard"
            >
              <Button variant="ghost" size="sm" class="rounded-full">
                {{ t('nav.dashboard') }}
              </Button>
            </NuxtLink>
            <template v-else>
              <NuxtLink to="/login">
                <Button variant="ghost" size="sm" class="rounded-full hidden sm:inline-flex">
                  {{ t('common.login') }}
                </Button>
              </NuxtLink>
              <NuxtLink :to="isBeta ? '/waitlist' : '/register'">
                <Button size="sm" class="rounded-full bg-coral hover:bg-coral/90">
                  {{ isBeta ? t('landing.beta.cta') : t('landing.hero.cta') }}
                </Button>
              </NuxtLink>
            </template>
          </ClientOnly>
        </div>
      </div>
    </header>

    <!-- ============================================
         Hero - Emotional, Warm with Video Background
         ============================================ -->
    <section class="relative min-h-[100dvh] flex items-center justify-center px-6 pt-20 overflow-hidden">
      <!-- Video Background -->
      <video
        autoplay
        loop
        muted
        playsinline
        class="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      <!-- Overlay for readability -->
      <div class="absolute inset-0 z-[1] bg-background/60 dark:bg-background/70" />

      <!-- Gradient overlay -->
      <div class="absolute inset-0 z-[2] hero-gradient" />

      <div class="relative z-[5] max-w-4xl mx-auto text-center">
        <!-- Social Proof Badge -->
        <div class="reveal inline-flex items-center gap-2 rounded-full bg-coral/10 border border-coral/20 px-4 py-2 text-sm font-medium text-coral mb-8">
          <Icon icon="lucide:heart" class="h-4 w-4" />
          {{ t('landing.hero.badge') }}
        </div>

        <!-- Headline -->
        <h1 class="reveal font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
          {{ t('landing.hero.title') }}
          <span class="text-coral">{{ t('landing.hero.titleHighlight') }}</span>
        </h1>

        <!-- Subheadline -->
        <p class="reveal mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed" style="transition-delay: 100ms">
          {{ t('landing.hero.subtitle') }}
        </p>

        <!-- CTA Buttons -->
        <div class="reveal mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" style="transition-delay: 200ms">
          <ClientOnly>
            <NuxtLink :to="isAuthenticated ? '/dashboard' : (isBeta ? '/waitlist' : '/register')">
              <Button size="lg" class="rounded-full bg-coral hover:bg-coral/90 px-8 text-base shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 transition-all">
                {{ isBeta ? t('landing.beta.cta') : t('landing.hero.cta') }}
                <Icon icon="lucide:arrow-right" class="ml-2 h-4 w-4" />
              </Button>
            </NuxtLink>
            <NuxtLink v-if="!isAuthenticated" to="/login">
              <Button variant="outline" size="lg" class="rounded-full px-8 text-base border-border/50 hover:bg-muted/50">
                {{ t('landing.hero.login') }}
              </Button>
            </NuxtLink>
          </ClientOnly>
        </div>

        <!-- Trust indicators -->
        <div class="reveal mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground" style="transition-delay: 300ms">
          <span class="flex items-center gap-2">
            <Icon icon="lucide:shield-check" class="h-4 w-4 text-sage" />
            {{ t('landing.hero.trust1') }}
          </span>
          <span class="flex items-center gap-2">
            <Icon icon="lucide:zap" class="h-4 w-4 text-gold" />
            {{ t('landing.hero.trust2') }}
          </span>
          <span class="flex items-center gap-2">
            <Icon icon="lucide:heart" class="h-4 w-4 text-coral" />
            {{ t('landing.hero.trust3') }}
          </span>
        </div>

      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2">
        <button class="scroll-indicator" @click="scrollToSection(isBeta ? 'beta' : 'problem')">
          <Icon icon="lucide:chevrons-down" class="h-6 w-6 text-muted-foreground/50" />
        </button>
      </div>
    </section>

    <!-- ============================================
         Beta Section (only in beta mode)
         ============================================ -->
    <section v-if="isBeta" id="beta" class="px-6 py-24 sm:py-32 bg-gradient-to-br from-coral/5 via-background to-gold/5 border-y border-coral/10">
      <div class="max-w-5xl mx-auto">
        <div class="reveal text-center mb-12">
          <div class="inline-flex items-center gap-2 rounded-full bg-coral/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-coral mb-4">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral opacity-75" />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-coral" />
            </span>
            {{ t('landing.beta.badge') }}
          </div>
          <h2 class="font-display text-3xl sm:text-4xl font-bold">
            {{ t('landing.beta.title') }}
          </h2>
          <p class="mt-4 text-muted-foreground max-w-xl mx-auto">
            {{ t('landing.beta.subtitle') }}
          </p>
        </div>

        <!-- Beta Features Grid -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div
            v-for="(feature, index) in betaFeatures"
            :key="feature"
            class="reveal p-6 rounded-2xl bg-card border border-border/50 text-center"
            :style="{ transitionDelay: `${index * 80}ms` }"
          >
            <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center">
              <Icon
                :icon="feature === 'free' ? 'lucide:gift' : feature === 'feedback' ? 'lucide:message-circle' : feature === 'early' ? 'lucide:star' : 'lucide:lock'"
                class="h-6 w-6 text-coral"
              />
            </div>
            <h3 class="font-semibold mb-2">{{ t(`landing.beta.features.${feature}.title`) }}</h3>
            <p class="text-sm text-muted-foreground">{{ t(`landing.beta.features.${feature}.description`) }}</p>
          </div>
        </div>

        <!-- CTA -->
        <div class="reveal text-center">
          <NuxtLink to="/waitlist">
            <Button size="lg" class="rounded-full bg-coral hover:bg-coral/90 px-10 shadow-lg shadow-coral/25">
              {{ t('landing.beta.cta') }}
              <Icon icon="lucide:arrow-right" class="ml-2 h-4 w-4" />
            </Button>
          </NuxtLink>
          <p class="mt-4 text-sm text-muted-foreground">
            {{ t('landing.beta.hasInvite') }}
            <NuxtLink to="/login" class="font-medium text-coral hover:underline ml-1">{{ t('landing.beta.signIn') }}</NuxtLink>
          </p>
        </div>
      </div>
    </section>

    <!-- ============================================
         Problem → Solution
         ============================================ -->
    <section id="problem" class="px-6 py-24 sm:py-32">
      <div class="max-w-6xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <!-- Problem -->
          <div class="reveal">
            <p class="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
              {{ t('landing.problem.badge') }}
            </p>
            <h2 class="font-display text-3xl sm:text-4xl font-bold leading-tight">
              {{ t('landing.problem.title') }}
            </h2>
            <p class="mt-4 text-muted-foreground leading-relaxed">
              {{ t('landing.problem.description') }}
            </p>

            <div class="mt-8 space-y-4">
              <div v-for="i in 3" :key="i" class="flex items-start gap-3">
                <div class="flex-shrink-0 w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center mt-0.5">
                  <Icon icon="lucide:x" class="h-3.5 w-3.5 text-destructive" />
                </div>
                <p class="text-sm text-muted-foreground">{{ t(`landing.problem.point${i}`) }}</p>
              </div>
            </div>
          </div>

          <!-- Solution -->
          <div class="reveal" style="transition-delay: 150ms">
            <div class="relative p-8 rounded-3xl bg-gradient-to-br from-coral/5 via-gold/5 to-sage/5 border border-coral/10">
              <p class="text-sm font-semibold uppercase tracking-wider text-coral mb-3">
                {{ t('landing.solution.badge') }}
              </p>
              <h2 class="font-display text-3xl sm:text-4xl font-bold leading-tight">
                {{ t('landing.solution.title') }}
              </h2>
              <p class="mt-4 text-muted-foreground leading-relaxed">
                {{ t('landing.solution.description') }}
              </p>

              <div class="mt-8 space-y-4">
                <div v-for="i in 3" :key="i" class="flex items-start gap-3">
                  <div class="flex-shrink-0 w-6 h-6 rounded-full bg-coral/10 flex items-center justify-center mt-0.5">
                    <Icon icon="lucide:check" class="h-3.5 w-3.5 text-coral" />
                  </div>
                  <p class="text-sm text-foreground">{{ t(`landing.solution.point${i}`) }}</p>
                </div>
              </div>

              <!-- Mini CTA -->
              <div class="mt-8">
                <NuxtLink :to="isAuthenticated ? '/dashboard' : (isBeta ? '/waitlist' : '/register')">
                  <Button class="rounded-full bg-coral hover:bg-coral/90">
                    {{ isBeta ? t('landing.beta.cta') : t('landing.hero.cta') }}
                    <Icon icon="lucide:arrow-right" class="ml-2 h-4 w-4" />
                  </Button>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         Use Cases with Mock Entries
         ============================================ -->
    <section id="usecases" class="px-6 py-24 sm:py-32 bg-muted/30">
      <div class="max-w-6xl mx-auto">
        <div class="reveal text-center mb-16">
          <p class="text-sm font-semibold uppercase tracking-wider text-coral mb-3">
            {{ t('landing.useCases.badge') }}
          </p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold">
            {{ t('landing.useCases.title') }}
          </h2>
          <p class="mt-4 text-muted-foreground max-w-2xl mx-auto">
            {{ t('landing.useCases.subtitle') }}
          </p>
        </div>

        <!-- Detailed Use Cases -->
        <div class="space-y-12">
          <div
            v-for="(useCase, index) in useCases"
            :key="useCase"
            class="reveal"
            :style="{ transitionDelay: `${index * 100}ms` }"
          >
            <div class="grid lg:grid-cols-2 gap-8 items-center" :class="index % 2 === 1 ? 'lg:grid-flow-dense' : ''">
              <!-- Info -->
              <div :class="index % 2 === 1 ? 'lg:col-start-2' : ''">
                <div class="flex items-center gap-3 mb-4">
                  <span class="text-4xl">{{ t(`landing.useCases.${useCase}.emoji`) }}</span>
                  <div>
                    <h3 class="font-display text-2xl font-semibold">{{ t(`landing.useCases.${useCase}.title`) }}</h3>
                    <p class="text-sm text-coral font-medium">{{ t(`landing.useCases.${useCase}.eventName`) }}</p>
                  </div>
                </div>
                <p class="text-muted-foreground leading-relaxed mb-6">
                  {{ t(`landing.useCases.${useCase}.description`) }}
                </p>
              </div>

              <!-- Mock Entries -->
              <div class="space-y-4" :class="index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''">
                <div
                  v-for="entryNum in 2"
                  :key="entryNum"
                  class="p-5 rounded-2xl bg-card border border-border/50 shadow-sm"
                >
                  <p class="text-sm leading-relaxed mb-4">
                    "{{ t(`landing.useCases.${useCase}.entry${entryNum}.message`) }}"
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <span v-if="t(`landing.useCases.${useCase}.entry${entryNum}.song`, '')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-coral/10 text-xs">
                      <Icon icon="lucide:music" class="h-3 w-3 text-coral" />
                      <span class="text-muted-foreground">{{ t(`landing.useCases.${useCase}.entry${entryNum}.song`) }}</span>
                    </span>
                    <span v-if="t(`landing.useCases.${useCase}.entry${entryNum}.food`, '')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 text-xs">
                      <Icon icon="lucide:utensils" class="h-3 w-3 text-gold" />
                      <span class="text-muted-foreground">{{ t(`landing.useCases.${useCase}.entry${entryNum}.food`) }}</span>
                    </span>
                    <span v-if="t(`landing.useCases.${useCase}.entry${entryNum}.superpower`, '')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sage/10 text-xs">
                      <Icon icon="lucide:sparkles" class="h-3 w-3 text-sage" />
                      <span class="text-muted-foreground">{{ t(`landing.useCases.${useCase}.entry${entryNum}.superpower`) }}</span>
                    </span>
                    <span v-if="t(`landing.useCases.${useCase}.entry${entryNum}.memory`, '')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy/10 text-xs">
                      <Icon icon="lucide:heart" class="h-3 w-3 text-navy" />
                      <span class="text-muted-foreground">{{ t(`landing.useCases.${useCase}.entry${entryNum}.memory`) }}</span>
                    </span>
                  </div>
                </div>
                <p class="text-xs text-muted-foreground/60 italic text-center">
                  {{ t('landing.useCases.disclaimer') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- More Use Cases (Simple Cards) -->
        <div class="mt-16">
          <h3 class="reveal text-center font-display text-xl font-semibold mb-8">{{ t('landing.useCases.title') }}</h3>
          <div class="grid sm:grid-cols-3 gap-4">
            <div
              v-for="(useCase, index) in moreUseCases"
              :key="useCase.key"
              class="reveal p-6 rounded-2xl bg-card border border-border/50 text-center hover:border-coral/30 hover:shadow-lg transition-all"
              :style="{ transitionDelay: `${index * 50}ms` }"
            >
              <span class="text-4xl">{{ useCase.emoji }}</span>
              <h4 class="mt-3 font-semibold">{{ t(`landing.useCases.${useCase.key}.title`) }}</h4>
              <p class="mt-1 text-sm text-muted-foreground">{{ t(`landing.useCases.${useCase.key}.description`) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         Emotional Quote
         ============================================ -->
    <section class="px-6 py-24 sm:py-32">
      <div class="max-w-4xl mx-auto text-center">
        <div class="reveal">
          <Icon icon="lucide:quote" class="h-12 w-12 text-coral/30 mx-auto mb-6" />
          <blockquote class="font-handwritten text-3xl sm:text-4xl lg:text-5xl text-foreground leading-relaxed">
            "{{ t('landing.quote.text') }}"
          </blockquote>
          <p class="mt-6 text-muted-foreground">
            — {{ t('landing.quote.author') }}
          </p>
        </div>
      </div>
    </section>

    <!-- ============================================
         Features - Organized by Groups
         ============================================ -->
    <section id="features" class="px-6 py-24 sm:py-32 bg-muted/30">
      <div class="max-w-6xl mx-auto">
        <div class="reveal text-center mb-16">
          <p class="text-sm font-semibold uppercase tracking-wider text-coral mb-3">
            {{ t('landing.features.badge') }}
          </p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold">
            {{ t('landing.features.title') }}
          </h2>
          <p class="mt-4 text-muted-foreground max-w-2xl mx-auto">
            {{ t('landing.features.subtitle') }}
          </p>
        </div>

        <!-- Feature Groups -->
        <div class="space-y-16">
          <div
            v-for="(group, groupIndex) in featureGroups"
            :key="group.key"
            class="reveal"
            :style="{ transitionDelay: `${groupIndex * 100}ms` }"
          >
            <div class="text-center mb-8">
              <h3 class="font-display text-xl font-semibold">{{ t(`landing.features.groups.${group.key}.title`) }}</h3>
              <p class="text-sm text-muted-foreground">{{ t(`landing.features.groups.${group.key}.subtitle`) }}</p>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="(feature, featureIndex) in group.features"
                :key="feature.key"
                class="p-5 rounded-2xl bg-card border border-border/50 hover:border-coral/30 hover:shadow-lg transition-all group"
                :style="{ transitionDelay: `${(groupIndex * 100) + (featureIndex * 30)}ms` }"
              >
                <div class="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center mb-4 group-hover:bg-coral/20 transition-colors">
                  <Icon :icon="feature.icon" class="h-5 w-5 text-coral" />
                </div>
                <h4 class="font-semibold mb-1">{{ t(`landing.features.${feature.key}.title`) }}</h4>
                <p class="text-sm text-muted-foreground">{{ t(`landing.features.${feature.key}.description`) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="reveal mt-16 text-center">
          <NuxtLink :to="isAuthenticated ? '/dashboard' : (isBeta ? '/waitlist' : '/register')">
            <Button size="lg" class="rounded-full bg-coral hover:bg-coral/90 px-8">
              {{ t('landing.features.cta') }}
              <Icon icon="lucide:arrow-right" class="ml-2 h-4 w-4" />
            </Button>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ============================================
         How It Works
         ============================================ -->
    <section class="px-6 py-24 sm:py-32">
      <div class="max-w-5xl mx-auto">
        <div class="reveal text-center mb-16">
          <p class="text-sm font-semibold uppercase tracking-wider text-coral mb-3">
            {{ t('landing.howItWorks.badge') }}
          </p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold">
            {{ t('landing.howItWorks.title') }}
          </h2>
        </div>

        <div class="grid sm:grid-cols-3 gap-8 sm:gap-12">
          <div
            v-for="(step, index) in steps"
            :key="step.key"
            class="reveal text-center"
            :style="{ transitionDelay: `${index * 100}ms` }"
          >
            <div class="relative inline-flex">
              <div class="w-20 h-20 rounded-full bg-coral/10 flex items-center justify-center">
                <Icon :icon="step.icon" class="h-8 w-8 text-coral" />
              </div>
              <span class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-coral text-white text-sm font-bold flex items-center justify-center">
                {{ step.num }}
              </span>
            </div>
            <h3 class="mt-6 font-display text-xl font-semibold">
              {{ t(`landing.howItWorks.${step.key}.title`) }}
            </h3>
            <p class="mt-3 text-sm text-muted-foreground leading-relaxed">
              {{ t(`landing.howItWorks.${step.key}.description`) }}
            </p>
          </div>
        </div>

        <!-- CTA -->
        <div class="reveal mt-14 text-center">
          <NuxtLink :to="isAuthenticated ? '/dashboard' : (isBeta ? '/waitlist' : '/register')">
            <Button size="lg" class="rounded-full bg-coral hover:bg-coral/90 px-8">
              {{ t('landing.howItWorks.cta') }}
              <Icon icon="lucide:arrow-right" class="ml-2 h-4 w-4" />
            </Button>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ============================================
         Customization Demo
         ============================================ -->
    <section class="px-6 py-24 sm:py-32 bg-muted/30">
      <div class="max-w-6xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Info -->
          <div class="reveal">
            <p class="text-sm font-semibold uppercase tracking-wider text-coral mb-3">
              {{ t('landing.customization.badge') }}
            </p>
            <h2 class="font-display text-3xl sm:text-4xl font-bold">
              {{ t('landing.customization.title') }}
            </h2>
            <p class="mt-4 text-muted-foreground leading-relaxed">
              {{ t('landing.customization.subtitle') }}
            </p>

            <ul class="mt-8 space-y-3">
              <li v-for="bullet in ['questions', 'colorScheme', 'backgrounds', 'slideshow']" :key="bullet" class="flex items-center gap-3">
                <div class="w-5 h-5 rounded-full bg-coral/10 flex items-center justify-center">
                  <Icon icon="lucide:check" class="h-3 w-3 text-coral" />
                </div>
                <span class="text-sm">{{ t(`landing.customization.bullets.${bullet}`) }}</span>
              </li>
            </ul>

            <!-- Controls -->
            <div class="mt-8 space-y-4">
              <div>
                <label class="text-sm font-medium mb-2 block">{{ t('landing.customization.cardStyleLabel') }}</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="style in cardStyles"
                    :key="style"
                    class="px-3 py-1.5 rounded-full text-sm border transition-all"
                    :class="selectedCardStyle === style ? 'bg-coral text-white border-coral' : 'border-border hover:border-coral/50'"
                    @click="selectedCardStyle = style"
                  >
                    {{ t(`landing.customization.styles.${style}`) }}
                  </button>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium mb-2 block">{{ t('landing.customization.colorLabel') }}</label>
                <div class="flex gap-2">
                  <button
                    v-for="color in accentColors"
                    :key="color.value"
                    class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                    :class="selectedColor === color.value ? 'border-foreground scale-110' : 'border-transparent'"
                    :style="{ backgroundColor: color.value }"
                    :title="color.name"
                    @click="selectedColor = color.value"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Preview Card -->
          <div class="reveal" style="transition-delay: 150ms">
            <div
              class="p-6 rounded-3xl border transition-all duration-300"
              :class="{
                'bg-card shadow-xl': selectedCardStyle === 'polaroid',
                'bg-transparent border-0': selectedCardStyle === 'minimal',
                'bg-card rounded-[2rem]': selectedCardStyle === 'rounded',
                'bg-card border-l-4': selectedCardStyle === 'bordered'
              }"
              :style="selectedCardStyle === 'bordered' ? { borderLeftColor: selectedColor } : {}"
            >
              <!-- Photo placeholder -->
              <div
                class="aspect-square rounded-xl mb-4 flex items-center justify-center"
                :style="{ backgroundColor: selectedColor + '20' }"
              >
                <Icon icon="lucide:image" class="h-16 w-16" :style="{ color: selectedColor }" />
              </div>

              <h4 class="font-semibold text-lg">{{ t('landing.customization.mockEntry.name') }}</h4>
              <p class="mt-2 text-sm text-muted-foreground leading-relaxed">
                "{{ t('landing.customization.mockEntry.message') }}"
              </p>

              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  class="px-2.5 py-1 rounded-full text-xs"
                  :style="{ backgroundColor: selectedColor + '20', color: selectedColor }"
                >
                  <Icon icon="lucide:music" class="inline h-3 w-3 mr-1" />
                  Song
                </span>
                <span
                  class="px-2.5 py-1 rounded-full text-xs"
                  :style="{ backgroundColor: selectedColor + '20', color: selectedColor }"
                >
                  <Icon icon="lucide:heart" class="inline h-3 w-3 mr-1" />
                  Memory
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         Pricing (only when not in beta)
         ============================================ -->
    <section v-if="!isBeta" id="pricing" class="px-6 py-24 sm:py-32">
      <div class="max-w-6xl mx-auto">
        <div class="reveal text-center mb-12">
          <p class="text-sm font-semibold uppercase tracking-wider text-coral mb-3">
            {{ t('landing.pricing.badge') }}
          </p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold">
            {{ t('landing.pricing.title') }}
          </h2>
          <p class="mt-4 text-muted-foreground max-w-xl mx-auto">
            {{ t('landing.pricing.subtitle') }}
          </p>

          <!-- Billing Toggle -->
          <div class="mt-8 inline-flex items-center gap-3 p-1 bg-muted rounded-full">
            <button
              class="px-4 py-2 rounded-full text-sm font-medium transition-all"
              :class="!isYearly ? 'bg-card shadow text-foreground' : 'text-muted-foreground'"
              @click="isYearly = false"
            >
              {{ t('landing.pricing.monthly') }}
            </button>
            <button
              class="px-4 py-2 rounded-full text-sm font-medium transition-all"
              :class="isYearly ? 'bg-card shadow text-foreground' : 'text-muted-foreground'"
              @click="isYearly = true"
            >
              {{ t('landing.pricing.yearly') }}
              <span class="ml-1 text-xs text-coral">{{ t('landing.pricing.yearlyDiscount') }}</span>
            </button>
          </div>
        </div>

        <!-- Pricing Cards -->
        <div class="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          <!-- Free -->
          <div class="reveal p-6 rounded-2xl bg-card border border-border/50">
            <h3 class="font-semibold text-lg">{{ t('landing.pricing.free.name') }}</h3>
            <p class="text-sm text-muted-foreground mt-1">{{ t('landing.pricing.free.description') }}</p>
            <div class="mt-4">
              <span class="text-4xl font-bold">${{ t('landing.pricing.free.price') }}</span>
            </div>
            <Button variant="outline" class="w-full mt-6 rounded-full">{{ t('landing.pricing.free.cta') }}</Button>
            <ul class="mt-6 space-y-2 text-sm">
              <li v-for="(feature, i) in (t('landing.pricing.free.features') as unknown as string[])" :key="i" class="flex items-center gap-2">
                <Icon icon="lucide:check" class="h-4 w-4 text-coral" />
                {{ feature }}
              </li>
            </ul>
          </div>

          <!-- Home (Popular) -->
          <div class="reveal p-6 rounded-2xl bg-coral text-white relative" style="transition-delay: 100ms">
            <span class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gold text-navy text-xs font-semibold rounded-full">
              {{ t('landing.pricing.home.popular') }}
            </span>
            <h3 class="font-semibold text-lg">{{ t('landing.pricing.home.name') }}</h3>
            <p class="text-sm text-white/80 mt-1">{{ t('landing.pricing.home.description') }}</p>
            <div class="mt-4">
              <span class="text-4xl font-bold">${{ isYearly ? Math.round(parseInt(t('landing.pricing.home.priceYearly')) / 12) : t('landing.pricing.home.price') }}</span>
              <span class="text-white/70">{{ t('landing.pricing.perMonth') }}</span>
            </div>
            <Button class="w-full mt-6 rounded-full bg-white text-coral hover:bg-white/90">{{ t('landing.pricing.home.cta') }}</Button>
            <ul class="mt-6 space-y-2 text-sm">
              <li v-for="(feature, i) in (t('landing.pricing.home.features') as unknown as string[])" :key="i" class="flex items-center gap-2">
                <Icon icon="lucide:check" class="h-4 w-4" />
                {{ feature }}
              </li>
            </ul>
          </div>

          <!-- Family -->
          <div class="reveal p-6 rounded-2xl bg-card border border-border/50" style="transition-delay: 150ms">
            <h3 class="font-semibold text-lg">{{ t('landing.pricing.family.name') }}</h3>
            <p class="text-sm text-muted-foreground mt-1">{{ t('landing.pricing.family.description') }}</p>
            <div class="mt-4">
              <span class="text-4xl font-bold">${{ isYearly ? Math.round(parseInt(t('landing.pricing.family.priceYearly')) / 12) : t('landing.pricing.family.price') }}</span>
              <span class="text-muted-foreground">{{ t('landing.pricing.perMonth') }}</span>
            </div>
            <Button variant="outline" class="w-full mt-6 rounded-full">{{ t('landing.pricing.family.cta') }}</Button>
            <ul class="mt-6 space-y-2 text-sm">
              <li v-for="(feature, i) in (t('landing.pricing.family.features') as unknown as string[])" :key="i" class="flex items-center gap-2">
                <Icon icon="lucide:check" class="h-4 w-4 text-coral" />
                {{ feature }}
              </li>
            </ul>
          </div>

          <!-- Enterprise -->
          <div class="reveal p-6 rounded-2xl bg-card border border-border/50" style="transition-delay: 200ms">
            <h3 class="font-semibold text-lg">{{ t('landing.pricing.enterprise.name') }}</h3>
            <p class="text-sm text-muted-foreground mt-1">{{ t('landing.pricing.enterprise.description') }}</p>
            <div class="mt-4">
              <span class="text-4xl font-bold">{{ t('landing.pricing.enterprise.price') }}</span>
            </div>
            <Button variant="outline" class="w-full mt-6 rounded-full">{{ t('landing.pricing.enterprise.cta') }}</Button>
            <ul class="mt-6 space-y-2 text-sm">
              <li v-for="(feature, i) in (t('landing.pricing.enterprise.features') as unknown as string[])" :key="i" class="flex items-center gap-2">
                <Icon icon="lucide:check" class="h-4 w-4 text-coral" />
                {{ feature }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         Security & Trust
         ============================================ -->
    <section id="security" class="px-6 py-24 sm:py-32 bg-navy text-white">
      <div class="max-w-5xl mx-auto">
        <div class="reveal text-center mb-16">
          <p class="text-sm font-semibold uppercase tracking-wider text-coral mb-3">
            {{ t('landing.security.badge') }}
          </p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold">
            {{ t('landing.security.title') }}
          </h2>
          <p class="mt-4 text-white/70 max-w-2xl mx-auto">
            {{ t('landing.security.subtitle') }}
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="(feature, index) in securityFeatures"
            :key="feature"
            class="reveal p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            :style="{ transitionDelay: `${index * 80}ms` }"
          >
            <Icon
              :icon="feature === 'encryption' ? 'lucide:lock' : feature === 'twoFactor' ? 'lucide:shield-check' : feature === 'rls' ? 'lucide:database' : 'lucide:shield'"
              class="h-8 w-8 text-coral mb-4"
            />
            <h3 class="font-semibold mb-2">
              {{ t(`landing.security.${feature}.title`) }}
            </h3>
            <p class="text-sm text-white/60">
              {{ t(`landing.security.${feature}.description`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         NFC Shop Preview
         ============================================ -->
    <section class="px-6 py-24 sm:py-32">
      <div class="max-w-5xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Info -->
          <div class="reveal">
            <div class="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-coral mb-4">
              {{ t('landing.nfcShop.comingSoon') }}
            </div>
            <h2 class="font-display text-3xl sm:text-4xl font-bold">
              {{ t('landing.nfcShop.title') }}
            </h2>
            <p class="mt-4 text-muted-foreground leading-relaxed">
              {{ t('landing.nfcShop.subtitle') }}
            </p>

            <ul class="mt-6 space-y-3">
              <li class="flex items-center gap-3 text-sm">
                <Icon icon="lucide:check" class="h-4 w-4 text-coral" />
                {{ t('landing.nfcShop.preProgrammed') }}
              </li>
              <li class="flex items-center gap-3 text-sm">
                <Icon icon="lucide:check" class="h-4 w-4 text-coral" />
                {{ t('landing.nfcShop.durable') }}
              </li>
              <li class="flex items-center gap-3 text-sm">
                <Icon icon="lucide:check" class="h-4 w-4 text-coral" />
                {{ t('landing.nfcShop.easySetup') }}
              </li>
            </ul>

            <!-- Color selection -->
            <div class="mt-8">
              <p class="text-sm font-medium mb-3">{{ t('landing.nfcShop.colorChoice') }}</p>
              <div class="flex gap-3">
                <button
                  v-for="nfcColor in nfcColors"
                  :key="nfcColor.key"
                  class="w-10 h-10 rounded-full border-2 transition-transform hover:scale-110"
                  :class="selectedNfcColor === nfcColor.key ? 'border-coral scale-110' : 'border-border'"
                  :style="{ background: nfcColor.color }"
                  :title="t(`landing.nfcShop.colors.${nfcColor.key}`)"
                  @click="selectedNfcColor = nfcColor.key"
                />
              </div>
              <p class="mt-2 text-xs text-muted-foreground">{{ t('landing.nfcShop.colorHint') }}</p>
            </div>
          </div>

          <!-- NFC Tag Visual -->
          <div class="reveal" style="transition-delay: 150ms">
            <div class="relative w-64 h-64 mx-auto">
              <div
                class="w-full h-full rounded-full shadow-2xl flex items-center justify-center"
                :style="{ background: nfcColors.find(c => c.key === selectedNfcColor)?.color || '#1a1a1a' }"
              >
                <div class="text-center">
                  <Icon icon="lucide:nfc" class="h-16 w-16 mx-auto mb-2" :class="selectedNfcColor === 'white' ? 'text-navy' : 'text-white'" />
                  <span class="font-handwritten text-xl" :class="selectedNfcColor === 'white' ? 'text-navy' : 'text-white'">Tap & Tell</span>
                </div>
              </div>
              <!-- Tap animation ring -->
              <div class="absolute inset-0 rounded-full border-2 border-coral animate-ping opacity-30" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         Open Source
         ============================================ -->
    <section class="px-6 py-24 sm:py-32 bg-muted/30">
      <div class="max-w-5xl mx-auto text-center">
        <div class="reveal">
          <p class="text-sm font-semibold uppercase tracking-wider text-coral mb-3">
            {{ t('landing.openSource.badge') }}
          </p>
          <h2 class="font-display text-3xl sm:text-4xl font-bold">
            {{ t('landing.openSource.title') }}
          </h2>
          <p class="mt-4 text-muted-foreground max-w-xl mx-auto">
            {{ t('landing.openSource.subtitle') }}
          </p>

          <div class="mt-8 flex flex-wrap justify-center gap-4">
            <a href="https://github.com/Disane87/tap-and-tell" target="_blank">
              <Button size="lg" class="rounded-full bg-navy text-white hover:bg-navy/90">
                <Icon icon="lucide:github" class="mr-2 h-5 w-5" />
                {{ t('landing.openSource.github') }}
              </Button>
            </a>
          </div>

          <div class="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span class="flex items-center gap-2">
              <Icon icon="lucide:scale" class="h-4 w-4" />
              {{ t('landing.openSource.license') }}
            </span>
            <span class="flex items-center gap-2">
              <Icon icon="lucide:users" class="h-4 w-4" />
              {{ t('landing.openSource.contributors') }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         Final CTA
         ============================================ -->
    <section class="px-6 py-24 sm:py-32">
      <div class="max-w-4xl mx-auto">
        <div class="reveal relative overflow-hidden rounded-3xl bg-gradient-to-br from-coral via-terracotta to-gold p-12 sm:p-16 text-center text-white">
          <!-- Decorative elements -->
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div class="relative">
            <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold">
              {{ t('landing.cta.title') }}
            </h2>
            <p class="mt-4 text-lg text-white/80 max-w-xl mx-auto">
              {{ t('landing.cta.subtitle') }}
            </p>
            <div class="mt-8">
              <NuxtLink :to="isAuthenticated ? '/dashboard' : (isBeta ? '/waitlist' : '/register')">
                <Button size="lg" class="rounded-full bg-white text-coral hover:bg-white/90 px-10 text-base font-semibold shadow-xl">
                  {{ isBeta ? t('landing.beta.cta') : t('landing.cta.button') }}
                  <Icon icon="lucide:sparkles" class="ml-2 h-4 w-4" />
                </Button>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================
         Footer
         ============================================ -->
    <footer class="px-6 py-16 border-t border-border/50 bg-muted/30">
      <div class="max-w-6xl mx-auto">
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <!-- Brand -->
          <div class="lg:col-span-1">
            <span class="font-handwritten text-2xl">Tap & Tell</span>
            <p class="mt-3 text-sm text-muted-foreground">
              {{ t('landing.footer.tagline') }}
            </p>
          </div>

          <!-- Product -->
          <div>
            <h4 class="font-semibold mb-4">{{ t('landing.footer.product') }}</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li><button class="hover:text-foreground transition-colors" @click="scrollToSection('features')">{{ t('landing.footer.features') }}</button></li>
              <li><button class="hover:text-foreground transition-colors" @click="scrollToSection('security')">{{ t('landing.footer.security') }}</button></li>
              <li v-if="!isBeta"><button class="hover:text-foreground transition-colors" @click="scrollToSection('pricing')">{{ t('landing.footer.pricing') }}</button></li>
            </ul>
          </div>

          <!-- Resources -->
          <div>
            <h4 class="font-semibold mb-4">{{ t('landing.footer.resources') }}</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li><span>{{ t('landing.footer.docs') }}</span></li>
              <li><a href="https://github.com/Disane87/tap-and-tell" target="_blank" class="hover:text-foreground transition-colors">GitHub</a></li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h4 class="font-semibold mb-4">{{ t('landing.footer.legal') }}</h4>
            <ul class="space-y-2 text-sm text-muted-foreground">
              <li><span>{{ t('landing.footer.privacy') }}</span></li>
              <li><span>{{ t('landing.footer.terms') }}</span></li>
              <li><span>{{ t('landing.footer.imprint') }}</span></li>
              <li>
                <button class="hover:text-foreground transition-colors" @click="openCookieSettings">
                  {{ t('cookies.managePreferences') }}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom -->
        <div class="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>{{ t('landing.footer.copyright', { year: new Date().getFullYear() }) }}</p>
          <div class="flex items-center gap-1">
            <span>Made with</span>
            <Icon icon="lucide:heart" class="h-4 w-4 text-coral" />
            <span>in Germany</span>
          </div>
        </div>
      </div>
    </footer>

    <!-- Cookie Banner -->
    <ClientOnly>
      <CookieBanner />
    </ClientOnly>
  </div>
</template>

<style scoped>
/* Hero gradient - warm, inviting */
.hero-gradient {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(224, 122, 95, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(233, 196, 106, 0.06) 0%, transparent 40%),
    radial-gradient(ellipse at 60% 80%, rgba(129, 178, 154, 0.05) 0%, transparent 40%),
    linear-gradient(to bottom, var(--color-background), var(--color-muted));
}

/* Decorative blobs */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}

.blob-1 {
  top: 10%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(224, 122, 95, 0.15), transparent 70%);
  animation: blob-float 20s ease-in-out infinite;
}

.blob-2 {
  bottom: 20%;
  left: -15%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(233, 196, 106, 0.12), transparent 70%);
  animation: blob-float 25s ease-in-out infinite reverse;
}

.blob-3 {
  top: 50%;
  right: 20%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(129, 178, 154, 0.1), transparent 70%);
  animation: blob-float 30s ease-in-out infinite;
}

@keyframes blob-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(30px, -30px) scale(1.05); }
  50% { transform: translate(-20px, 20px) scale(0.95); }
  75% { transform: translate(20px, 30px) scale(1.02); }
}

/* Floating polaroids */
.polaroid {
  position: absolute;
  width: 120px;
  padding: 8px 8px 32px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  opacity: 0.6;
  pointer-events: none;
}

.polaroid-inner {
  border-radius: 2px;
  overflow: hidden;
}

.polaroid-1 {
  top: 15%;
  left: 5%;
  transform: rotate(-12deg);
  animation: polaroid-float 8s ease-in-out infinite;
}

.polaroid-2 {
  top: 25%;
  right: 8%;
  transform: rotate(8deg);
  animation: polaroid-float 10s ease-in-out infinite reverse;
}

.polaroid-3 {
  bottom: 20%;
  left: 10%;
  transform: rotate(6deg);
  animation: polaroid-float 12s ease-in-out infinite;
}

@keyframes polaroid-float {
  0%, 100% { transform: translateY(0) rotate(var(--rotate, 0deg)); }
  50% { transform: translateY(-15px) rotate(calc(var(--rotate, 0deg) + 2deg)); }
}

/* Scroll indicator */
.scroll-indicator {
  animation: scroll-bounce 2s ease-in-out infinite;
}

@keyframes scroll-bounce {
  0%, 100% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(8px); opacity: 0.5; }
}

/* Reveal animations */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Dark mode adjustments */
.dark .polaroid {
  background: var(--color-card);
  opacity: 0.4;
}

.dark .hero-gradient {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(224, 122, 95, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(233, 196, 106, 0.08) 0%, transparent 40%),
    radial-gradient(ellipse at 60% 80%, rgba(129, 178, 154, 0.06) 0%, transparent 40%),
    linear-gradient(to bottom, var(--color-background), var(--color-muted));
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .blob,
  .polaroid,
  .scroll-indicator {
    animation: none !important;
  }

  .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
