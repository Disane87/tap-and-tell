/**
 * Email sending utility using the Resend REST API.
 *
 * In development mode (no RESEND_API_KEY), emails are logged to the console.
 * In production, emails are sent via the Resend API.
 *
 * @module email
 */

/** Options for sending an email. */
interface SendEmailOptions {
  /** Recipient email address. */
  to: string
  /** Email subject line. */
  subject: string
  /** HTML body content. */
  html: string
}

/** Resend API base URL. */
const RESEND_API_URL = 'https://api.resend.com/emails'

/**
 * Sends an email using the Resend REST API.
 *
 * Falls back to console logging when RESEND_API_KEY is not configured.
 *
 * @param options - Email sending options.
 * @returns True if the email was sent (or logged) successfully.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || 'Tap & Tell <noreply@tap-and-tell.app>'

  if (!apiKey) {
    // Development fallback: log to console
    console.log(`[email] To: ${options.to}`)
    console.log(`[email] Subject: ${options.subject}`)
    console.log(`[email] Body:\n${options.html}`)
    return true
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html
      })
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[email] Resend API error (${response.status}): ${errorBody}`)
      return false
    }

    return true
  } catch (error) {
    console.error('[email] Failed to send email:', error)
    return false
  }
}

/** Options for sending a beta invite email. */
interface BetaInviteEmailOptions {
  /** Recipient email address. */
  to: string
  /** Beta invite token. */
  token: string
  /** When the invite expires. */
  expiresAt: Date
  /** Whether the recipient is a founder. */
  isFounder: boolean
}

/**
 * Sends a beta invite email with registration link.
 *
 * @param options - Beta invite email options.
 * @returns True if the email was sent successfully.
 */
export async function sendBetaInviteEmail(options: BetaInviteEmailOptions): Promise<boolean> {
  const baseUrl = process.env.NUXT_PUBLIC_BASE_URL || 'https://tap-and-tell.app'
  const registrationUrl = `${baseUrl}/register?token=${options.token}`
  const expiresDate = options.expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const founderBadge = options.isFounder
    ? '<span style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">🌟 FOUNDER</span>'
    : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #10b981; margin-bottom: 10px;">🎉 You're Invited to Tap & Tell!</h1>
        ${founderBadge}
      </div>

      <p>Hi there!</p>

      <p>You've been invited to join the <strong>Tap & Tell</strong> beta program! ${options.isFounder ? 'As a Founder, you\'ll receive lifetime access to all Pro features.' : ''}</p>

      <p>Tap & Tell is a beautiful NFC-powered digital guestbook for homes and events. Your guests simply tap their phone on an NFC tag to leave a photo, message, and fun answers.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${registrationUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Accept Invitation
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        This invite expires on <strong>${expiresDate}</strong>.
      </p>

      <p style="color: #666; font-size: 14px;">
        Or copy this link: <br>
        <a href="${registrationUrl}" style="color: #10b981; word-break: break-all;">${registrationUrl}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

      <p style="color: #999; font-size: 12px; text-align: center;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </body>
    </html>
  `

  return sendEmail({
    to: options.to,
    subject: options.isFounder
      ? '🌟 Your Founder Invitation to Tap & Tell'
      : '🎉 Your Beta Invitation to Tap & Tell',
    html
  })
}
