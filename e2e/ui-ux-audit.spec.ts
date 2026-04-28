import { test, expect, type Page } from '@playwright/test'

/**
 * UI/UX Audit Tests
 * Systematically checks all main pages for usability issues, accessibility problems,
 * visual defects, mobile responsiveness, and interaction quality.
 */

const BASE_URL = 'https://localhost:3000'
const GUESTBOOK_ID = 'dev00000gb01'
const DEV_EMAIL = 'dev@tap-and-tell.local'
const DEV_PASSWORD = 'dev123'

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.getByLabel(/email/i).fill(DEV_EMAIL)
  await page.getByLabel(/password|passwort/i).fill(DEV_PASSWORD)
  await page.getByRole('button', { name: /login|anmelden|sign in/i }).click()
  await page.waitForURL(/dashboard|_admin/, { timeout: 10000 })
}

async function takeNamedScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `playwright-report/audit-${name}.png`, fullPage: true })
}

async function checkScrollability(page: Page, label: string): Promise<string[]> {
  const issues: string[] = []
  const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  if (hasHScroll) {
    issues.push(`[${label}] Horizontal scroll detected — likely overflow/layout bug`)
  }
  return issues
}

async function checkTouchTargets(page: Page, label: string): Promise<string[]> {
  const issues: string[] = []
  const smallTargets = await page.evaluate(() => {
    const interactive = Array.from(document.querySelectorAll('a, button, [role="button"], input, select, textarea'))
    return interactive
      .map(el => {
        const rect = el.getBoundingClientRect()
        return { tag: el.tagName, text: el.textContent?.trim().slice(0, 40), w: rect.width, h: rect.height }
      })
      .filter(t => t.w > 0 && t.h > 0 && (t.w < 44 || t.h < 44))
  })
  if (smallTargets.length > 0) {
    issues.push(`[${label}] ${smallTargets.length} touch targets smaller than 44×44px: ${smallTargets.map(t => `"${t.text}" (${Math.round(t.w)}×${Math.round(t.h)})`).slice(0, 5).join(', ')}`)
  }
  return issues
}

async function checkImages(page: Page, label: string): Promise<string[]> {
  const issues: string[] = []
  const badImages = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img'))
      .filter(img => !img.alt && img.naturalWidth > 0)
      .map(img => img.src.split('/').pop())
  })
  if (badImages.length > 0) {
    issues.push(`[${label}] ${badImages.length} images missing alt text: ${badImages.slice(0, 3).join(', ')}`)
  }
  return issues
}

async function checkFormLabels(page: Page, label: string): Promise<string[]> {
  const issues: string[] = []
  const unlabelled = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, textarea, select'))
      .filter(input => {
        const el = input as HTMLElement
        const id = el.getAttribute('id')
        const hasLabel = id ? !!document.querySelector(`label[for="${id}"]`) : false
        const hasAriaLabel = !!(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('placeholder'))
        return !hasLabel && !hasAriaLabel && el.getAttribute('type') !== 'hidden' && el.getAttribute('type') !== 'submit'
      })
      .map(el => el.getAttribute('name') || el.getAttribute('type') || 'unknown')
  })
  if (unlabelled.length > 0) {
    issues.push(`[${label}] ${unlabelled.length} form inputs without accessible label: ${unlabelled.slice(0, 5).join(', ')}`)
  }
  return issues
}

async function checkTruncation(page: Page, label: string): Promise<string[]> {
  const issues: string[] = []
  const truncated = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, h3, p, span, button'))
      .filter(el => {
        return el.scrollWidth > el.clientWidth + 2 && el.textContent!.trim().length > 0
      })
      .map(el => el.textContent!.trim().slice(0, 60))
      .slice(0, 5)
  })
  if (truncated.length > 0) {
    issues.push(`[${label}] Text truncated/overflowing: "${truncated.join('", "')}"`)
  }
  return issues
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

test.describe('UI/UX Audit', () => {
  let allIssues: string[] = []

  test.afterAll(async () => {
    if (allIssues.length > 0) {
      console.log('\n\n════════════════════════════════════════════════')
      console.log('  UI/UX AUDIT FINDINGS')
      console.log('════════════════════════════════════════════════')
      allIssues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`))
      console.log('════════════════════════════════════════════════\n')
    }
    else {
      console.log('\n  ✓ No UI/UX issues found!\n')
    }
  })

  // ── 1. Marketing Landing Page ──────────────────────────────────────────────
  test('Landing page — desktop', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await takeNamedScreenshot(page, '01-landing-desktop')

    const issues = [
      ...await checkScrollability(page, 'Landing'),
      ...await checkImages(page, 'Landing'),
      ...await checkTouchTargets(page, 'Landing'),
      ...await checkTruncation(page, 'Landing'),
    ]

    // Hero CTA visible?
    const cta = page.getByRole('link', { name: /jetzt|start|get started|try|kostenlos/i })
    if (!await cta.count()) {
      issues.push('[Landing] No visible CTA button found in hero section')
    }

    // Navigation links accessible?
    const nav = page.locator('nav')
    if (!await nav.count()) {
      issues.push('[Landing] No <nav> landmark found')
    }

    allIssues.push(...issues)
    if (issues.length) console.log('\nLanding issues:\n  ' + issues.join('\n  '))
  })

  // ── 2. Landing Page — Mobile ───────────────────────────────────────────────
  test('Landing page — mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await takeNamedScreenshot(page, '02-landing-mobile')

    const issues = [
      ...await checkScrollability(page, 'Landing/Mobile'),
      ...await checkTouchTargets(page, 'Landing/Mobile'),
      ...await checkTruncation(page, 'Landing/Mobile'),
    ]

    allIssues.push(...issues)
    if (issues.length) console.log('\nLanding Mobile issues:\n  ' + issues.join('\n  '))
  })

  // ── 3. Login Page ──────────────────────────────────────────────────────────
  test('Login page', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await takeNamedScreenshot(page, '03-login')

    const issues = [
      ...await checkScrollability(page, 'Login'),
      ...await checkFormLabels(page, 'Login'),
      ...await checkTouchTargets(page, 'Login'),
    ]

    // Check autocomplete attributes
    const emailInput = page.locator('input[type="email"]')
    const autocomplete = await emailInput.getAttribute('autocomplete')
    if (autocomplete !== 'email' && autocomplete !== 'username') {
      issues.push(`[Login] Email input missing autocomplete="email" (has: "${autocomplete}")`)
    }

    const passwordInput = page.locator('input[type="password"]').first()
    const pwAutocomplete = await passwordInput.getAttribute('autocomplete')
    if (pwAutocomplete !== 'current-password') {
      issues.push(`[Login] Password input missing autocomplete="current-password" (has: "${pwAutocomplete}")`)
    }

    // Is there a "forgot password" link?
    const forgot = page.getByRole('link', { name: /forgot|vergessen/i })
    if (!await forgot.count()) {
      issues.push('[Login] No "Forgot password?" link visible')
    }

    // Error state: wrong credentials
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/password|passwort/i).fill('wrongpassword')
    await page.getByRole('button', { name: /login|anmelden|sign in/i }).click()
    await page.waitForTimeout(2000)
    const errorVisible = await page.locator('[role="alert"], .error, [data-sonner-toast]').count()
    if (!errorVisible) {
      issues.push('[Login] No visible error feedback after wrong credentials')
    }
    await takeNamedScreenshot(page, '03b-login-error')

    allIssues.push(...issues)
    if (issues.length) console.log('\nLogin issues:\n  ' + issues.join('\n  '))
  })

  // ── 4. Guest Landing Page ──────────────────────────────────────────────────
  test('Guest landing page /g/[id]', async ({ page }) => {
    await page.goto(`/g/${GUESTBOOK_ID}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await takeNamedScreenshot(page, '04-guest-landing')

    const issues = [
      ...await checkScrollability(page, 'GuestLanding'),
      ...await checkImages(page, 'GuestLanding'),
      ...await checkTouchTargets(page, 'GuestLanding'),
    ]

    // Is there a visible "Leave Entry" / "Eintrag hinterlassen" button?
    const entryButton = page.getByRole('button', { name: /eintrag|entry|schreiben|sign|add/i })
    if (!await entryButton.count()) {
      issues.push('[GuestLanding] No visible "Add Entry" button — primary CTA missing')
    }

    allIssues.push(...issues)
    if (issues.length) console.log('\nGuest Landing issues:\n  ' + issues.join('\n  '))
  })

  // ── 5. Guest Landing — Mobile ──────────────────────────────────────────────
  test('Guest landing page — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/g/${GUESTBOOK_ID}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await takeNamedScreenshot(page, '05-guest-landing-mobile')

    const issues = [
      ...await checkScrollability(page, 'GuestLanding/Mobile'),
      ...await checkTouchTargets(page, 'GuestLanding/Mobile'),
    ]
    allIssues.push(...issues)
    if (issues.length) console.log('\nGuest Landing Mobile issues:\n  ' + issues.join('\n  '))
  })

  // ── 6. Guest Entry Form Wizard ─────────────────────────────────────────────
  test('Guest entry form — wizard flow', async ({ page }) => {
    await page.goto(`/g/${GUESTBOOK_ID}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const issues: string[] = []

    // Open form
    const entryButton = page.getByRole('button', { name: /eintrag|entry|schreiben|sign|add/i }).first()
    if (await entryButton.isVisible()) {
      await entryButton.click()
      await page.waitForTimeout(800)
      await takeNamedScreenshot(page, '06a-wizard-step1')

      // Step 1: check form labels
      issues.push(...await checkFormLabels(page, 'WizardStep1'))
      issues.push(...await checkTouchTargets(page, 'WizardStep1'))

      // Check if name field is auto-focused
      const activeElement = await page.evaluate(() => document.activeElement?.tagName)
      if (activeElement !== 'INPUT') {
        issues.push('[WizardStep1] First input not auto-focused on form open')
      }

      // Try to proceed without filling name (validation)
      const nextBtn = page.getByRole('button', { name: /next|weiter|continue/i })
      if (await nextBtn.isVisible()) {
        await nextBtn.click()
        await page.waitForTimeout(500)
        const hasValidationMsg = await page.locator('[data-error], [aria-invalid], .text-destructive').count()
        if (!hasValidationMsg) {
          issues.push('[WizardStep1] No validation feedback shown when submitting empty name field')
        }
        await takeNamedScreenshot(page, '06b-wizard-validation')
      }

      // Fill name and proceed
      const nameInput = page.locator('input').first()
      await nameInput.fill('Test Gast')
      if (await nextBtn.isVisible()) {
        await nextBtn.click()
        await page.waitForTimeout(800)
        await takeNamedScreenshot(page, '06c-wizard-step2')
        issues.push(...await checkTouchTargets(page, 'WizardStep2'))
      }
    }
    else {
      issues.push('[Wizard] Could not find entry button to open wizard')
    }

    allIssues.push(...issues)
    if (issues.length) console.log('\nWizard issues:\n  ' + issues.join('\n  '))
  })

  // ── 7. Guestbook View Page ─────────────────────────────────────────────────
  test('Guestbook view /g/[id]/view', async ({ page }) => {
    await page.goto(`/g/${GUESTBOOK_ID}/view`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await takeNamedScreenshot(page, '07-guestbook-view')

    const issues = [
      ...await checkScrollability(page, 'GuestbookView'),
      ...await checkImages(page, 'GuestbookView'),
      ...await checkTouchTargets(page, 'GuestbookView'),
      ...await checkTruncation(page, 'GuestbookView'),
    ]

    // Search/filter accessible?
    const searchInput = page.locator('input[type="search"], input[placeholder*="such" i], input[placeholder*="search" i]')
    if (await searchInput.count()) {
      await searchInput.first().fill('test')
      await page.waitForTimeout(500)
      await takeNamedScreenshot(page, '07b-view-filtered')
    }
    else {
      issues.push('[GuestbookView] No search input found')
    }

    allIssues.push(...issues)
    if (issues.length) console.log('\nGuestbook View issues:\n  ' + issues.join('\n  '))
  })

  // ── 8. Slideshow Page ─────────────────────────────────────────────────────
  test('Slideshow /g/[id]/slideshow', async ({ page }) => {
    await page.goto(`/g/${GUESTBOOK_ID}/slideshow`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await takeNamedScreenshot(page, '08-slideshow')

    const issues = [
      ...await checkScrollability(page, 'Slideshow'),
      ...await checkImages(page, 'Slideshow'),
    ]

    // Slideshow controls visible?
    const controls = page.locator('button').filter({ hasText: /play|pause|stop|exit|beenden/i })
    const controlCount = await controls.count()
    if (controlCount === 0) {
      issues.push('[Slideshow] No playback controls (play/pause/exit) found — navigation impossible')
    }

    allIssues.push(...issues)
    if (issues.length) console.log('\nSlideshow issues:\n  ' + issues.join('\n  '))
  })

  // ── 9. Dashboard (Authenticated) ───────────────────────────────────────────
  test('Dashboard (after login)', async ({ page }) => {
    await login(page)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await takeNamedScreenshot(page, '09-dashboard')

    const issues = [
      ...await checkScrollability(page, 'Dashboard'),
      ...await checkImages(page, 'Dashboard'),
      ...await checkTouchTargets(page, 'Dashboard'),
      ...await checkTruncation(page, 'Dashboard'),
    ]

    // Is the "Create Guestbook" button visible when user has guestbooks?
    const createBtn = page.getByRole('button', { name: /erstellen|create|neu|new/i })
    if (!await createBtn.count()) {
      issues.push('[Dashboard] No visible "Create" action button')
    }

    allIssues.push(...issues)
    if (issues.length) console.log('\nDashboard issues:\n  ' + issues.join('\n  '))
  })

  // ── 10. Dashboard — Mobile ──────────────────────────────────────────────────
  test('Dashboard — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await login(page)
    await page.waitForTimeout(1000)
    await takeNamedScreenshot(page, '10-dashboard-mobile')

    const issues = [
      ...await checkScrollability(page, 'Dashboard/Mobile'),
      ...await checkTouchTargets(page, 'Dashboard/Mobile'),
    ]
    allIssues.push(...issues)
    if (issues.length) console.log('\nDashboard Mobile issues:\n  ' + issues.join('\n  '))
  })

  // ── 11. Profile Page ────────────────────────────────────────────────────────
  test('Profile page', async ({ page }) => {
    await login(page)
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    await takeNamedScreenshot(page, '11-profile')

    const issues = [
      ...await checkScrollability(page, 'Profile'),
      ...await checkFormLabels(page, 'Profile'),
      ...await checkTouchTargets(page, 'Profile'),
    ]

    // Dangerous action (delete account) should have visual warning
    const deleteBtn = page.getByRole('button', { name: /delete account|konto löschen/i })
    if (await deleteBtn.count()) {
      const btnClass = await deleteBtn.first().getAttribute('class')
      if (!btnClass?.includes('destructive') && !btnClass?.includes('danger')) {
        issues.push('[Profile] "Delete Account" button lacks destructive visual styling')
      }
    }

    allIssues.push(...issues)
    if (issues.length) console.log('\nProfile issues:\n  ' + issues.join('\n  '))
  })

  // ── 12. Guestbook Admin Page ────────────────────────────────────────────────
  test('Guestbook admin page', async ({ page }) => {
    await login(page)
    await page.goto(`/g/${GUESTBOOK_ID}/admin`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await takeNamedScreenshot(page, '12-guestbook-admin')

    const issues = [
      ...await checkScrollability(page, 'GuestbookAdmin'),
      ...await checkTouchTargets(page, 'GuestbookAdmin'),
      ...await checkTruncation(page, 'GuestbookAdmin'),
    ]

    // Moderation actions visible?
    const approveBtn = page.getByRole('button', { name: /approve|genehmigen|freigeben/i })
    const rejectBtn = page.getByRole('button', { name: /reject|ablehnen/i })
    const hasModerationControls = (await approveBtn.count()) > 0 || (await rejectBtn.count()) > 0
    if (!hasModerationControls) {
      issues.push('[GuestbookAdmin] No moderation action buttons visible (approve/reject)')
    }

    allIssues.push(...issues)
    if (issues.length) console.log('\nGuestbook Admin issues:\n  ' + issues.join('\n  '))
  })

  // ── 13. 404 Page ────────────────────────────────────────────────────────────
  test('404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-at-all-404')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await takeNamedScreenshot(page, '13-404')

    const issues: string[] = []

    // Is there a visible error message or home link?
    const homeLink = page.getByRole('link', { name: /home|start|zurück/i })
    if (!await homeLink.count()) {
      issues.push('[404] No "Back to Home" link on 404 page')
    }

    const errorText = page.locator('h1, h2').filter({ hasText: /404|not found|nicht gefunden/i })
    if (!await errorText.count()) {
      issues.push('[404] No visible 404/Not Found heading on error page')
    }

    allIssues.push(...issues)
    if (issues.length) console.log('\n404 issues:\n  ' + issues.join('\n  '))
  })

  // ── 14. Dark Mode ───────────────────────────────────────────────────────────
  test('Dark mode — no white flash or unthemed elements', async ({ page }) => {
    // Set dark mode via localStorage
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await takeNamedScreenshot(page, '14a-dark-landing')

    const issues: string[] = []

    // Check that dark class is on document
    const hasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    if (!hasDark) {
      issues.push('[DarkMode] Dark class not applied to <html> on page load — FOUC likely')
    }

    await page.goto(`/g/${GUESTBOOK_ID}`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await takeNamedScreenshot(page, '14b-dark-guest')

    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark')
    })
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    await takeNamedScreenshot(page, '14c-dark-login')

    allIssues.push(...issues)
    if (issues.length) console.log('\nDark Mode issues:\n  ' + issues.join('\n  '))
  })

  // ── 15. Keyboard Navigation ─────────────────────────────────────────────────
  test('Keyboard navigation — focus trap and tab order', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const issues: string[] = []

    // Tab through login form
    await page.keyboard.press('Tab')
    const focus1 = await page.evaluate(() => document.activeElement?.tagName + ':' + document.activeElement?.getAttribute('type'))
    await page.keyboard.press('Tab')
    const focus2 = await page.evaluate(() => document.activeElement?.tagName + ':' + document.activeElement?.getAttribute('type'))
    await page.keyboard.press('Tab')
    const focus3 = await page.evaluate(() => document.activeElement?.tagName + ':' + document.activeElement?.getAttribute('type'))

    if (!focus1.includes('INPUT') && !focus1.includes('A') && !focus1.includes('BUTTON')) {
      issues.push(`[Keyboard] First Tab focus lands on non-interactive element: ${focus1}`)
    }

    // Check Enter submits form
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(DEV_EMAIL)
    await page.getByLabel(/password|passwort/i).fill(DEV_PASSWORD)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(2000)
    const url = page.url()
    if (!url.includes('dashboard') && !url.includes('_admin')) {
      issues.push(`[Keyboard] Enter key in login form does not submit (still at ${url})`)
    }

    allIssues.push(...issues)
    if (issues.length) console.log('\nKeyboard issues:\n  ' + issues.join('\n  '))
  })
})
