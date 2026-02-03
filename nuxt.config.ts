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
    manifest: {
      name: 'Tap & Tell',
      short_name: 'Tap & Tell',
      description: 'NFC-enabled digital guestbook',
      theme_color: '#18181b',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any'
        },
        {
          src: '/icons/icon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
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
      title: 'Tap & Tell',
      meta: [
        { name: 'description', content: 'NFC-enabled digital guestbook' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Caveat:wght@400;500;600;700&display=swap' }
      ],
      script: [
        {
          innerHTML: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark')}catch(e){}})()`,
          type: 'text/javascript'
        }
      ]
    }
  }
})
