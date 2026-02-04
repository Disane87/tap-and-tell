import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: [
      'server/utils/__tests__/**/*.test.ts',
      'app/composables/__tests__/**/*.test.ts'
    ],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        '.nuxt/**',
        '.output/**',
        'e2e/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/types/**'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '~~/': resolve(__dirname, './') + '/',
      '~/': resolve(__dirname, './app/') + '/',
      '#imports': resolve(__dirname, './.nuxt/imports.d.ts')
    }
  }
})
