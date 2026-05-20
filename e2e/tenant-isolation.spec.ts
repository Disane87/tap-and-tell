import { test, expect, type APIRequestContext } from '@playwright/test'
import { randomBytes } from 'node:crypto'

/**
 * Cross-tenant RLS enforcement.
 *
 * Registers two fresh users (each gets their own tenant on signup), creates a
 * guestbook in each, then confirms user A cannot list, read, or mutate
 * tenant B's resources via the authenticated API.
 *
 * Registration is gated by BETA_MODE in production-like envs, so the suite
 * probes /api/beta/validate first and skips when the form would be locked.
 */

async function skipIfRegistrationGated(request: APIRequestContext) {
  const status = await request.get('/api/beta/validate').then((r) => r.json()).catch(() => null)
  if (status?.betaModeEnabled && !status?.valid) {
    test.skip(true, 'Registration is gated by BETA_MODE — set BETA_MODE=open for this spec')
  }
}

async function registerUser(request: APIRequestContext): Promise<{ email: string; password: string }> {
  const id = randomBytes(6).toString('hex')
  const email = `e2e-iso-${id}@example.test`
  const password = 'TestPassword123!'
  const res = await request.post('/api/auth/register', {
    data: { email, password, name: `E2E Iso ${id}` },
  })
  expect(res.ok(), `registration must succeed (status ${res.status()})`).toBeTruthy()
  return { email, password }
}

async function getOwnTenantId(request: APIRequestContext): Promise<string> {
  const res = await request.get('/api/tenants')
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  const tenants = body?.data ?? body?.tenants ?? body
  expect(Array.isArray(tenants) && tenants.length > 0).toBeTruthy()
  return tenants[0].uuid ?? tenants[0].id
}

async function createGuestbook(request: APIRequestContext, tenantId: string): Promise<string> {
  const res = await request.post(`/api/tenants/${tenantId}/guestbooks`, {
    data: { name: 'Iso Test', type: 'permanent' },
  })
  expect(res.ok(), `guestbook creation must succeed (status ${res.status()})`).toBeTruthy()
  const body = await res.json()
  return body?.data?.id ?? body?.id
}

test.describe('Tenant isolation (RLS)', () => {
  test('user A cannot access tenant B resources', async ({ browser, request }) => {
    await skipIfRegistrationGated(request)

    // Two isolated browser contexts so cookies do not bleed across users.
    const ctxA = await browser.newContext({ ignoreHTTPSErrors: true })
    const ctxB = await browser.newContext({ ignoreHTTPSErrors: true })

    const reqA = ctxA.request
    const reqB = ctxB.request

    await registerUser(reqA)
    await registerUser(reqB)

    const tenantA = await getOwnTenantId(reqA)
    const tenantB = await getOwnTenantId(reqB)
    expect(tenantA).not.toBe(tenantB)

    const gbB = await createGuestbook(reqB, tenantB)

    // User A asks tenant B's resources — every endpoint must reject.
    const detail = await reqA.get(`/api/tenants/${tenantB}`, { failOnStatusCode: false })
    expect([401, 403, 404]).toContain(detail.status())

    const list = await reqA.get(`/api/tenants/${tenantB}/guestbooks`, { failOnStatusCode: false })
    expect([401, 403, 404]).toContain(list.status())

    const single = await reqA.get(`/api/tenants/${tenantB}/guestbooks/${gbB}`, { failOnStatusCode: false })
    expect([401, 403, 404]).toContain(single.status())

    const del = await reqA.delete(`/api/tenants/${tenantB}/guestbooks/${gbB}`, { failOnStatusCode: false })
    expect([401, 403, 404]).toContain(del.status())

    // The guestbook must still exist for user B.
    const stillThere = await reqB.get(`/api/tenants/${tenantB}/guestbooks/${gbB}`)
    expect(stillThere.ok()).toBeTruthy()

    await ctxA.close()
    await ctxB.close()
  })
})
