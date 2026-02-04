import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

const isDev = process.env.NODE_ENV !== 'production'

// Load basicSsl plugin only in development
function getBasicSslPlugin(): Plugin | null {
  if (!isDev) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const basicSsl = require('@vitejs/plugin-basic-ssl').default
    return basicSsl()
  } catch {
    return null
  }
}

// Load SSL certs only in development if they exist
function getDevServerHttps() {
  if (!isDev) return undefined
  const keyPath = path.resolve(__dirname, 'certs/localhost-key.pem')
  const certPath = path.resolve(__dirname, 'certs/localhost-cert.pem')
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: fs.readFileSync(keyPath, 'utf-8'),
      cert: fs.readFileSync(certPath, 'utf-8')
    }
  }
  return undefined
}

// Site configuration constants
const siteConfig = {
  name: 'Tap & Tell',
  shortName: 'Tap & Tell',
  description: 'Create memorable digital guestbooks with NFC technology. Perfect for weddings, events, and parties. Let your guests tap, record, and share their wishes.',
  descriptionDe: 'Erstelle unvergessliche digitale Gästebücher mit NFC-Technologie. Perfekt für Hochzeiten, Events und Feiern. Lass deine Gäste tippen, aufnehmen und ihre Wünsche teilen.',
  url: process.env.NUXT_PUBLIC_SITE_URL || 'https://tap-and-tell.app',
  author: 'Tap & Tell Team',
  twitterHandle: '@tapandtell',
  themeColor: '#18181b',
  backgroundColor: '#ffffff',
  locale: 'en_US',
  localeAlternate: 'de_DE'
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  devServer: {
    host: 'localhost',
    https: getDevServerHttps()
  },

  modules: [
    'shadcn-nuxt',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt'
  ],

  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'icons/*.svg', 'robots.txt'],
    manifest: {
      name: siteConfig.name,
      short_name: siteConfig.shortName,
      description: siteConfig.description,
      theme_color: siteConfig.themeColor,
      background_color: siteConfig.backgroundColor,
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      lang: 'en',
      dir: 'ltr',
      categories: ['lifestyle', 'social', 'utilities'],
      prefer_related_applications: false,
      icons: [
        {
          src: '/icons/icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any'
        },
        {
          src: '/icons/icon-maskable.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'maskable'
        }
      ],
      screenshots: [
        {
          src: '/screenshots/mobile-home.png',
          sizes: '390x844',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Home screen'
        },
        {
          src: '/screenshots/mobile-guestbook.png',
          sizes: '390x844',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Guestbook view'
        }
      ],
      shortcuts: [
        {
          name: 'Dashboard',
          short_name: 'Dashboard',
          description: 'Open the admin dashboard',
          url: '/dashboard',
          icons: [{ src: '/icons/icon.svg', sizes: 'any' }]
        }
      ],
      related_applications: [],
      handle_links: 'preferred'
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2,webp,jpg,jpeg}'],
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/api\.iconify\.design\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'iconify-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /\/api\/g\/.*\/entries/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-entries-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 5 // 5 minutes
            },
            networkTimeoutSeconds: 10,
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    devOptions: {
      enabled: false
    }
  },

  i18n: {
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
      { code: 'de', language: 'de-DE', file: 'de.json', name: 'Deutsch' }
    ],
    defaultLocale: 'en',
    lazy: true,
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'en'
    }
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui'
  },

  vite: {
    plugins: [tailwindcss(), getBasicSslPlugin()].filter(Boolean) as Plugin[]
  },

  runtimeConfig: {
    postgresUrl: process.env.POSTGRES_URL || process.env.DATABASE_URL || '',
    public: {
      siteUrl: siteConfig.url,
      siteName: siteConfig.name
    }
  },

  nitro: {
    externals: {
      inline: [],
    },
    rollupConfig: {
      external: ['pg'],
    },
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      title: siteConfig.name,
      titleTemplate: '%s | Tap & Tell',
      meta: [
        // Basic SEO
        { charset: 'utf-8' },
        { name: 'description', content: siteConfig.description },
        { name: 'author', content: siteConfig.author },
        { name: 'generator', content: 'Nuxt 4' },
        { name: 'referrer', content: 'origin-when-cross-origin' },
        { name: 'color-scheme', content: 'light dark' },

        // iOS/Safari specific - CRITICAL for modern iPhones
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: siteConfig.shortName },
        { name: 'format-detection', content: 'telephone=no' },

        // Android/Chrome specific
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'theme-color', content: siteConfig.themeColor, media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: siteConfig.themeColor, media: '(prefers-color-scheme: dark)' },

        // Microsoft/Windows specific
        { name: 'msapplication-TileColor', content: siteConfig.themeColor },
        { name: 'msapplication-config', content: '/browserconfig.xml' },

        // OpenGraph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: siteConfig.url },
        { property: 'og:title', content: siteConfig.name },
        { property: 'og:description', content: siteConfig.description },
        { property: 'og:image', content: `${siteConfig.url}/og-image.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Tap & Tell - Digital Guestbook' },
        { property: 'og:site_name', content: siteConfig.name },
        { property: 'og:locale', content: siteConfig.locale },
        { property: 'og:locale:alternate', content: siteConfig.localeAlternate },

        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: siteConfig.twitterHandle },
        { name: 'twitter:creator', content: siteConfig.twitterHandle },
        { name: 'twitter:title', content: siteConfig.name },
        { name: 'twitter:description', content: siteConfig.description },
        { name: 'twitter:image', content: `${siteConfig.url}/og-image.png` },
        { name: 'twitter:image:alt', content: 'Tap & Tell - Digital Guestbook' },

        // Robots/Indexing
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'googlebot', content: 'index, follow' }
      ],
      link: [
        // Favicon
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/icon.svg', sizes: 'any' },
        { rel: 'alternate icon', type: 'image/png', href: '/icons/icon.svg' },

        // Apple Touch Icons - for iOS home screen
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icons/apple-touch-icon.svg' },

        // Manifest
        { rel: 'manifest', href: '/manifest.webmanifest' },

        // Canonical URL
        { rel: 'canonical', href: siteConfig.url },

        // Preconnect for performance
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://api.iconify.design', crossorigin: '' },

        // DNS prefetch
        { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
        { rel: 'dns-prefetch', href: 'https://api.iconify.design' },

        // Fonts
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Caveat:wght@400;500;600;700&display=swap' },

        // Apple splash screens (for PWA on iOS)
        { rel: 'apple-touch-startup-image', href: '/splash/apple-splash-2048-2732.png', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/apple-splash-1170-2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/apple-splash-1179-2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/apple-splash-1290-2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/apple-splash-1284-2778.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' }
      ],
      script: [
        // Theme initialization (FOUC prevention)
        {
          innerHTML: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark')}catch(e){}})()`,
          type: 'text/javascript'
        }
      ]
    }
  }
})
