import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    include: ['server/utils/__tests__/**/*.test.ts'],
    environment: 'node'
  },
  resolve: {
    alias: {
      '~~/': resolve(__dirname, './') + '/',
      '~/': resolve(__dirname, './app/') + '/'
    }
  }
})
