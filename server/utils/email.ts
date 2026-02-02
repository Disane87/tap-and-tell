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
