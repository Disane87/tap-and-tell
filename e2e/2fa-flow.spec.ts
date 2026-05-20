import { test, expect } from '@playwright/test'
import { STORAGE_STATE_PATH } from './global-setup'

/**
 * E2E coverage for the 2FA setup/disable lifecycle.
 *
 * Strategy:
 *  - Run against the dev user (idempotent dev seed, no 2FA on by default).
 *  - Exercise the API surface end-to-end rather than the UI screen-by-screen,
 *    so the flow is robust regardless of frontend wording.
 *  - Each test cleans up after itself by disabling 2FA if it was enabled.
 *
 * Out of scope (separate spec when implemented): backup codes, recovery.
 */
test.use({ storageState: STORAGE_STATE_PATH })

const DEV_EMAIL = 'dev@tap-and-tell.local'
const DEV_PASSWORD = 'dev123'

async function disable2faIfEnabled(request: import('@playwright/test').APIRequestContext) {
  // Best-effort cleanup. We don't have a fresh OTP, so we accept failure.
  await request.post('/api/auth/2fa/disable', {
    data: { password: DEV_PASSWORD },
    failOnStatusCode: false,
  })
}

test.describe('2FA — TOTP setup', () => {
  test.beforeEach(async ({ request }) => {
    await disable2faIfEnabled(request)
  })

  test.afterEach(async ({ request }) => {
    await disable2faIfEnabled(request)
  })

  test('setup endpoint returns a TOTP secret + provisioning URI', async ({ request }) => {
    const res = await request.post('/api/auth/2fa/setup', { data: { method: 'totp' } })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.method).toBe('totp')
    expect(body.data.secret).toMatch(/^[A-Z2-7]{16,}$/) // base32 secret
    expect(body.data.uri).toMatch(/^otpauth:\/\/totp\//)
    expect(body.data.uri).toContain(encodeURIComponent(DEV_EMAIL))
  })

  test('setup rejects unknown methods', async ({ request }) => {
    const res = await request.post('/api/auth/2fa/setup', {
      data: { method: 'sms' },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(400)
  })

  test('setup twice without verification overwrites the pending entry', async ({ request }) => {
    const a = await request.post('/api/auth/2fa/setup', { data: { method: 'totp' } }).then((r) => r.json())
    const b = await request.post('/api/auth/2fa/setup', { data: { method: 'totp' } }).then((r) => r.json())
    expect(a.data.secret).not.toBe(b.data.secret) // fresh secret each time
  })

  test('verify rejects wrong code', async ({ request }) => {
    await request.post('/api/auth/2fa/setup', { data: { method: 'totp' } })
    const res = await request.post('/api/auth/2fa/verify', {
      data: { code: '000000' },
      failOnStatusCode: false,
    })
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })
})

test.describe('2FA — Email OTP setup', () => {
  test.beforeEach(async ({ request }) => {
    await disable2faIfEnabled(request)
  })

  test.afterEach(async ({ request }) => {
    await disable2faIfEnabled(request)
  })

  test('email setup returns a confirmation payload', async ({ request }) => {
    const res = await request.post('/api/auth/2fa/setup', { data: { method: 'email' } })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.method).toBe('email')
    expect(body.data.message).toMatch(/code/i)
  })
})

test.describe('2FA — unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('setup endpoint is gated by authentication', async ({ request }) => {
    const res = await request.post('/api/auth/2fa/setup', {
      data: { method: 'totp' },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(401)
  })
})
