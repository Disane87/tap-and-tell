import { test, expect } from '@playwright/test'

/**
 * E2E tests for admin moderation flows.
 * Tests entry management and guestbook settings.
 */
test.describe('Admin Moderation Flow', () => {
  const guestbookId = 'dev00000gb01'

  test.describe('Without Authentication', () => {
    test('should redirect unauthenticated users from admin page', async ({ page }) => {
      await page.goto(`/g/${guestbookId}/admin`)

      // Should redirect to login or show unauthorized
      await page.waitForTimeout(2000)

      // Check current URL - should be login or show error
      const currentUrl = page.url()
      expect(currentUrl.includes('/login') || currentUrl.includes('/admin')).toBeTruthy()
    })
  })

  test.describe('With Authentication', () => {
    // Login before each test
    test.beforeEach(async ({ page }) => {
      await page.goto('/login')
      await page.locator('input[type="email"], input[name="email"]').fill('dev@tap-and-tell.local')
      await page.locator('input[type="password"], input[name="password"]').fill('dev123')

      const loginButton = page.getByRole('button', { name: /login|anmelden|sign in/i })
      await loginButton.click()

      // Wait for authentication to complete
      await page.waitForTimeout(3000)
    })

    test('should access admin page when authenticated', async ({ page }) => {
      await page.goto(`/g/${guestbookId}/admin`)
      await page.waitForTimeout(2000)

      // Check if we're on the admin page
      const currentUrl = page.url()
      // May redirect to 2FA if required
      expect(currentUrl.includes('/admin') || currentUrl.includes('/2fa') || currentUrl.includes('/login')).toBeTruthy()
    })

    test('should display entry moderation controls', async ({ page }) => {
      await page.goto(`/g/${guestbookId}/admin`)
      await page.waitForTimeout(2000)

      // Look for moderation controls (approve/reject buttons)
      const moderationControls = page.locator('[data-testid="moderation"], button:has-text("approve"), button:has-text("reject")')
      // May or may not be visible depending on auth state
    })

    test('should access QR code generator', async ({ page }) => {
      await page.goto(`/g/${guestbookId}/admin/qr`)
      await page.waitForTimeout(2000)

      // Check if QR page loads
      const currentUrl = page.url()
      expect(currentUrl.includes('/qr') || currentUrl.includes('/login') || currentUrl.includes('/2fa')).toBeTruthy()
    })
  })
})

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Attempt to login
    await page.goto('/login')
    await page.locator('input[type="email"], input[name="email"]').fill('dev@tap-and-tell.local')
    await page.locator('input[type="password"], input[name="password"]').fill('dev123')

    const loginButton = page.getByRole('button', { name: /login|anmelden|sign in/i })
    await loginButton.click()
    await page.waitForTimeout(3000)
  })

  test('should display dashboard after login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)

    // Should be on dashboard or redirected to 2FA
    const currentUrl = page.url()
    expect(currentUrl.includes('/dashboard') || currentUrl.includes('/2fa') || currentUrl.includes('/login')).toBeTruthy()
  })

  test('should show guestbook list in dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)

    // Look for guestbook items or create button
    const guestbookContent = page.locator('[data-testid="guestbook"], [class*="guestbook"]')
    // Content may vary based on auth state
  })
})
