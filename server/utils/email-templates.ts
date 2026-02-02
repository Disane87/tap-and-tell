/**
 * Email HTML templates for transactional emails.
 *
 * @module email-templates
 */

/**
 * Generates the HTML email body for an OTP verification code.
 *
 * @param code - The 6-digit OTP code.
 * @returns HTML string for the email body.
 */
export function otpEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding:32px 32px 24px;text-align:center;">
        <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#18181b;">Tap &amp; Tell</h1>
        <p style="margin:0;font-size:14px;color:#71717a;">Your verification code</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 24px;text-align:center;">
        <div style="display:inline-block;padding:16px 32px;background:#f4f4f5;border-radius:8px;letter-spacing:6px;font-size:32px;font-weight:700;color:#18181b;font-family:monospace;">
          ${code}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px;text-align:center;">
        <p style="margin:0;font-size:13px;color:#a1a1aa;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}
