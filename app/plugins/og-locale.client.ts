/**
 * Sets locale-aware OG image meta tags on the client.
 *
 * Updates og:image and twitter:image when locale changes.
 * Default (for crawlers) is set in nuxt.config.ts.
 */
export default defineNuxtPlugin(() => {
  const { locale } = useI18n()
  const config = useRuntimeConfig()

  const baseUrl = (config.public.siteUrl as string) || ''

  const updateOgImage = (lang: string) => {
    const ogUrl = `${baseUrl}/api/og?lang=${lang}`

    useHead({
      meta: [
        { property: 'og:image', content: ogUrl },
        { name: 'twitter:image', content: ogUrl }
      ]
    })
  }

  updateOgImage(locale.value)
  watch(locale, (newLocale) => updateOgImage(newLocale))
})
