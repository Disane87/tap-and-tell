/**
 * Email service with pluggable provider pattern.
 *
 * Base provides a fallback implementation using Resend (env-based) + hardcoded templates.
 * SaaS layer registers a DB-backed provider via `registerEmailServiceProvider()` at startup.
 */

import type { H3Event } from 'h3'
import { getRequestHeader } from 'h3'

/** Result of an email send operation. */
export interface EmailResult {
  success: boolean
  messageId?: string
  logId?: string
  error?: string
}

/** Options for sending a templated email. */
export interface SendOptions {
  locale?: string
  category?: string
  userId?: string
  tenantId?: string
  metadata?: Record<string, unknown>
}

/** Provider interface that SaaS (or other layers) can implement. */
export interface EmailServiceProvider {
  sendTemplateEmail(
    slug: string,
    to: string,
    vars: Record<string, string>,
    opts?: Partial<SendOptions>
  ): Promise<EmailResult>
}

// ── Provider registry ──────────────────────────────────────────────────────

let _provider: EmailServiceProvider | null = null

/**
 * Registers an email service provider.
 * Called by Nitro plugins at server startup (e.g. SaaS email-provider plugin).
 */
export function registerEmailServiceProvider(provider: EmailServiceProvider): void {
  _provider = provider
}

// ── Hardcoded fallback templates (for OSS standalone) ──────────────────────

interface FallbackTemplate {
  subject: Record<string, string>
  html: Record<string, string>
}

const FALLBACK_TEMPLATES: Record<string, FallbackTemplate> = {
  waitlist_confirmation: {
    subject: {
      en: "You're on the Tap & Tell waitlist!",
      de: 'Du bist auf der Tap & Tell Warteliste!'
    },
    html: {
      en: `<h2 style="margin:0 0 16px;color:#111;">You're on the list!</h2>
<p style="margin:0 0 12px;color:#555;">Hi {{name}},</p>
<p style="margin:0 0 12px;color:#555;">Thanks for signing up for Tap & Tell! You're currently at position <strong>#{{position}}</strong> on our waitlist.</p>
<p style="margin:0 0 12px;color:#555;">Share your referral link to move up:</p>
<p style="margin:0 0 24px;"><a href="{{referralLink}}" style="color:#6366f1;word-break:break-all;">{{referralLink}}</a></p>
<p style="margin:0;color:#555;">We'll notify you as soon as a spot opens up!</p>`,
      de: `<h2 style="margin:0 0 16px;color:#111;">Du bist auf der Liste!</h2>
<p style="margin:0 0 12px;color:#555;">Hi {{name}},</p>
<p style="margin:0 0 12px;color:#555;">Danke f\u00fcr deine Anmeldung bei Tap & Tell! Du bist aktuell auf Position <strong>#{{position}}</strong> unserer Warteliste.</p>
<p style="margin:0 0 12px;color:#555;">Teile deinen Empfehlungslink, um aufzusteigen:</p>
<p style="margin:0 0 24px;"><a href="{{referralLink}}" style="color:#6366f1;word-break:break-all;">{{referralLink}}</a></p>
<p style="margin:0;color:#555;">Wir benachrichtigen dich, sobald ein Platz frei wird!</p>`
    }
  },
  invite_accepted: {
    subject: {
      en: 'Beta invite accepted: {{inviteeName}}',
      de: 'Beta-Einladung angenommen: {{inviteeName}}'
    },
    html: {
      en: `<h2 style="margin:0 0 16px;color:#111;">Invite Accepted</h2>
<p style="margin:0 0 12px;color:#555;">Hi {{adminName}},</p>
<p style="margin:0 0 12px;color:#555;"><strong>{{inviteeName}}</strong> ({{inviteeEmail}}) has accepted the beta invite and registered with the <strong>{{plan}}</strong> plan.</p>
<p style="margin:0 0 12px;color:#555;">Accepted at: {{acceptedAt}}</p>
<p style="margin:0 0 24px;"><a href="{{dashboardUrl}}" style="display:inline-block;padding:10px 20px;background-color:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">View in Dashboard</a></p>`,
      de: `<h2 style="margin:0 0 16px;color:#111;">Einladung angenommen</h2>
<p style="margin:0 0 12px;color:#555;">Hi {{adminName}},</p>
<p style="margin:0 0 12px;color:#555;"><strong>{{inviteeName}}</strong> ({{inviteeEmail}}) hat die Beta-Einladung angenommen und sich mit dem <strong>{{plan}}</strong>-Plan registriert.</p>
<p style="margin:0 0 12px;color:#555;">Angenommen am: {{acceptedAt}}</p>
<p style="margin:0 0 24px;"><a href="{{dashboardUrl}}" style="display:inline-block;padding:10px 20px;background-color:#6366f1;color:#fff;text-decoration:none;border-radius:6px;">Im Dashboard ansehen</a></p>`
    }
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Detects locale from the Accept-Language HTTP header.
 * Returns 'de' if German is preferred, 'en' otherwise.
 */
export function detectLocaleFromHeader(event: H3Event): string {
  const header = getRequestHeader(event, 'accept-language') || ''
  return header.toLowerCase().includes('de') ? 'de' : 'en'
}

/**
 * Sends a templated email.
 *
 * If a provider has been registered (e.g. SaaS DB-backed email service),
 * delegates to that provider. Otherwise falls back to env-based Resend +
 * hardcoded templates.
 */
export async function sendTemplateEmail(
  templateSlug: string,
  to: string,
  variables: Record<string, string>,
  options?: Partial<SendOptions>
): Promise<EmailResult> {
  // Delegate to registered provider if available
  if (_provider) {
    return _provider.sendTemplateEmail(templateSlug, to, variables, options)
  }

  // Fallback: use hardcoded templates + Resend via base sendEmail
  return sendFallbackEmail(templateSlug, to, variables, options)
}

/**
 * Fallback email sender using hardcoded templates and the base `sendEmail()` util.
 */
async function sendFallbackEmail(
  templateSlug: string,
  to: string,
  variables: Record<string, string>,
  options?: Partial<SendOptions>
): Promise<EmailResult> {
  const locale = options?.locale || 'en'
  const fallback = FALLBACK_TEMPLATES[templateSlug]

  if (!fallback) {
    console.warn(`[EmailService] No fallback template for slug: ${templateSlug}`)
    return { success: false, error: `No template found for: ${templateSlug}` }
  }

  const subject = renderTemplate(
    fallback.subject[locale] || fallback.subject.en,
    variables
  )
  const rawHtml = renderTemplate(
    fallback.html[locale] || fallback.html.en,
    variables
  )

  const html = wrapEmailLayout({
    content: rawHtml,
    baseUrl: process.env.PUBLIC_URL || 'https://tap-and-tell.com',
    locale: locale as 'en' | 'de'
  })

  const sent = await sendEmail({ to, subject, html })

  return {
    success: sent,
    error: sent ? undefined : 'Failed to send email via Resend fallback'
  }
}
