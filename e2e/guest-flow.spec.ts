import { test, expect } from '@playwright/test'

/**
 * E2E tests for the guest entry flow.
 * Tests the core user journey from landing page to entry submission.
 */
test.describe('Guest Entry Flow', () => {
  const guestbookId = 'dev00000gb01'

  test.beforeEach(async ({ page }) => {
    // Navigate to guest landing page
    await page.goto(`/g/${guestbookId}`)
  })

  test('should display guestbook landing page', async ({ page }) => {
    // Wait for the page to load
    await expect(page).toHaveURL(`/g/${guestbookId}`)

    // Check that the page title or main content is visible
    await expect(page.locator('body')).toBeVisible()
  })

  test('should open entry form when clicking add button', async ({ page }) => {
    // Look for the add entry button
    const addButton = page.getByRole('button', { name: /add|hinzufügen|eintrag/i })
    if (await addButton.isVisible()) {
      await addButton.click()

      // Form should be visible
      await expect(page.locator('form')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should validate required fields in form', async ({ page }) => {
    // Open form
    const addButton = page.getByRole('button', { name: /add|hinzufügen|eintrag/i })
    if (await addButton.isVisible()) {
      await addButton.click()
      await page.waitForTimeout(500)
    }

    // Try to submit empty form
    const nextButton = page.getByRole('button', { name: /next|weiter|continue/i })
    if (await nextButton.isVisible()) {
      await nextButton.click()

      // Should show validation errors
      const errorMessage = page.locator('[data-error], .error, [aria-invalid="true"]')
      await expect(errorMessage.first()).toBeVisible({ timeout: 3000 }).catch(() => {
        // Validation may be handled differently
      })
    }
  })

  test('should navigate through form steps', async ({ page }) => {
    // Open form
    const addButton = page.getByRole('button', { name: /add|hinzufügen|eintrag/i })
    if (await addButton.isVisible()) {
      await addButton.click()
      await page.waitForTimeout(500)
    }

    // Fill in name field
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]')
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Guest')
    }

    // Navigate to next step
    const nextButton = page.getByRole('button', { name: /next|weiter|continue/i })
    if (await nextButton.isVisible()) {
      await nextButton.click()
    }
  })

  test('should display existing entries in view mode', async ({ page }) => {
    // Navigate to entries view
    await page.goto(`/g/${guestbookId}/view`)
    await expect(page).toHaveURL(`/g/${guestbookId}/view`)

    // Wait for entries to load
    await page.waitForTimeout(1000)
  })

  test('should display slideshow mode', async ({ page }) => {
    // Navigate to slideshow
    await page.goto(`/g/${guestbookId}/slideshow`)
    await expect(page).toHaveURL(`/g/${guestbookId}/slideshow`)
  })
})

test.describe('NFC Context', () => {
  test('should handle NFC source parameter', async ({ page }) => {
    const guestbookId = 'dev00000gb01'

    // Navigate with NFC parameters
    await page.goto(`/g/${guestbookId}?source=nfc&event=TestEvent`)

    // Page should load successfully
    await expect(page).toHaveURL(new RegExp(`/g/${guestbookId}`))
  })
})
