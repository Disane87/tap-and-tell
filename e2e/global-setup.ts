import { chromium, type FullConfig } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

/**
 * One-shot login that produces a `storageState.json` reused by every spec
 * that needs an authenticated session. Avoids hammering /api/auth/login from
 * each individual test and keeps the suite resilient against the production
 * rate limiter.
 */
export const STORAGE_STATE_PATH = './e2e/.auth/dev-user.json'

const DEV_EMAIL = 'dev@tap-and-tell.local'
const DEV_PASSWORD = 'dev123'

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'https://localhost:3000'

  mkdirSync(dirname(STORAGE_STATE_PATH), { recursive: true })

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, baseURL })
  const page = await ctx.newPage()

  await page.goto('/login')
  const emailInput = page.locator('input[type="email"], input[name="email"]').first()
  await emailInput.waitFor({ state: 'visible', timeout: 15000 })
  await emailInput.fill(DEV_EMAIL)
  await page.locator('input[type="password"], input[name="password"]').first().fill(DEV_PASSWORD)
  await page.getByRole('button', { name: /login|anmelden|sign in/i }).click()
  await page.waitForURL(/dashboard|_admin|profile/, { timeout: 15000 })

  await ctx.storageState({ path: STORAGE_STATE_PATH })
  await browser.close()
}
