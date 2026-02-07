/**
 * Unified email layout wrapper.
 * Wraps inner HTML content in a table-based layout with header, footer,
 * branding, and optional tracking pixel for open tracking.
 */

export interface EmailLayoutOptions {
  /** Inner HTML content from the email template */
  content: string
  /** Email log ID for tracking pixel */
  logId?: string
  /** Application base URL */
  baseUrl?: string
  /** Footer language */
  locale?: 'en' | 'de'
  /** Optional unsubscribe URL */
  unsubscribeUrl?: string
}

const FOOTER_TEXT = {
  en: 'You received this email because you have an account with Tap & Tell or signed up for our waitlist.',
  de: 'Sie erhalten diese E-Mail, weil Sie ein Konto bei Tap & Tell haben oder sich auf unsere Warteliste eingetragen haben.'
}

const UNSUBSCRIBE_TEXT = {
  en: 'Unsubscribe',
  de: 'Abmelden'
}

/**
 * Wraps email template content in a consistent branded layout.
 * Uses table-based layout for maximum email client compatibility.
 * All styles are inlined.
 */
export function wrapEmailLayout(options: EmailLayoutOptions): string {
  const {
    content,
    logId,
    baseUrl = 'https://tap-and-tell.com',
    locale = 'en',
    unsubscribeUrl
  } = options

  const year = new Date().getFullYear()
  const footerText = FOOTER_TEXT[locale] || FOOTER_TEXT.en
  const unsubText = UNSUBSCRIBE_TEXT[locale] || UNSUBSCRIBE_TEXT.en

  const trackingPixel = logId
    ? `<img src="${baseUrl}/api/_admin/emails/track/${logId}/open" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`
    : ''

  const unsubscribeLink = unsubscribeUrl
    ? `<a href="${unsubscribeUrl}" style="color:#999;font-size:12px;text-decoration:underline;">${unsubText}</a>`
    : ''

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Tap &amp; Tell</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
<tr>
<td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr>
<td align="center" style="padding:24px 0 16px;">
<a href="${baseUrl}" style="text-decoration:none;">
<span style="font-size:24px;font-weight:700;color:#6366f1;letter-spacing:-0.5px;">Tap &amp; Tell</span>
</a>
</td>
</tr>

<!-- Content Card -->
<tr>
<td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
<tr>
<td style="padding:32px 28px;">
${content}
</td>
</tr>
</table>
</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:24px 16px 8px;">
<p style="margin:0 0 8px;color:#999;font-size:12px;line-height:1.5;">${footerText}</p>
<p style="margin:0 0 8px;color:#bbb;font-size:11px;">&copy; ${year} Tap &amp; Tell. All rights reserved.</p>
${unsubscribeLink ? `<p style="margin:0;">${unsubscribeLink}</p>` : ''}
</td>
</tr>

<!-- Tracking Pixel -->
${trackingPixel ? `<tr><td style="font-size:0;line-height:0;height:1px;">${trackingPixel}</td></tr>` : ''}

</table>
</td>
</tr>
</table>
</body>
</html>`
}
