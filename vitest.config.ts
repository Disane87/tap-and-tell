import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

const baseRoot = resolve(__dirname)

export default defineConfig({
  plugins: [vue()],
  define: {
    'import.meta.client': true,
    'import.meta.server': false
  },
  test: {
    root: baseRoot,
    include: [
      'server/utils/__tests__/**/*.test.ts',
      'app/composables/__tests__/**/*.test.ts',
      'app/utils/__tests__/**/*.test.ts'
    ],
    exclude: [
      '**/node_modules/**',
      'e2e/**/*.spec.ts',
      'server/utils/__tests__/storage.test.ts'
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
      '~~/': baseRoot + '/',
      '~/': resolve(baseRoot, 'app') + '/',
      '#imports': resolve(__dirname, './.nuxt/imports.d.ts')
    }
  }
})
