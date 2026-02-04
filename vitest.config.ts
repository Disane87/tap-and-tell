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
    globals: true
  },
  resolve: {
    alias: {
      '~~/': resolve(__dirname, './') + '/',
      '~/': resolve(__dirname, './app/') + '/',
      '#imports': resolve(__dirname, './.nuxt/imports.d.ts')
    }
  }
})
