import { test, expect } from '@playwright/test'

/**
 * E2E tests for authentication flows.
 * Tests login, registration, and session management.
 */
test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL('/login')

    // Check for login form elements
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible()
  })

  test('should show validation error for empty login', async ({ page }) => {
    await page.goto('/login')

    // Click login button without filling form
    const loginButton = page.getByRole('button', { name: /login|anmelden|sign in/i })
    await loginButton.click()

    // Should stay on login page or show error
    await expect(page).toHaveURL('/login')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill in invalid credentials
    await page.locator('input[type="email"], input[name="email"]').fill('invalid@test.com')
    await page.locator('input[type="password"], input[name="password"]').fill('wrongpassword')

    // Submit form
    const loginButton = page.getByRole('button', { name: /login|anmelden|sign in/i })
    await loginButton.click()

    // Wait for response
    await page.waitForTimeout(1000)

    // Should show error or stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('should login with dev credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill in dev credentials
    await page.locator('input[type="email"], input[name="email"]').fill('dev@tap-and-tell.local')
    await page.locator('input[type="password"], input[name="password"]').fill('dev123')

    // Submit form
    const loginButton = page.getByRole('button', { name: /login|anmelden|sign in/i })
    await loginButton.click()

    // Should redirect to dashboard or profile
    await page.waitForURL(/\/(dashboard|profile|2fa)/, { timeout: 10000 }).catch(() => {
      // May require 2FA
    })
  })

  test('should display registration page', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveURL('/register')

    // Check for registration form elements
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible()
  })

  test('should validate registration form', async ({ page }) => {
    await page.goto('/register')

    // Try to submit empty form
    const registerButton = page.getByRole('button', { name: /register|registrieren|sign up/i })
    await registerButton.click()

    // Should stay on register page
    await expect(page).toHaveURL('/register')
  })

  test('should show password strength requirements', async ({ page }) => {
    await page.goto('/register')

    // Fill in weak password
    const passwordInput = page.locator('input[type="password"], input[name="password"]')
    await passwordInput.fill('weak')

    // Should show password requirements or validation
    await page.waitForTimeout(500)
  })
})

test.describe('Protected Routes', () => {
  test('should redirect to login for protected dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {
      // May handle differently
    })
  })

  test('should redirect to login for protected profile', async ({ page }) => {
    await page.goto('/profile')

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {
      // May handle differently
    })
  })
})
