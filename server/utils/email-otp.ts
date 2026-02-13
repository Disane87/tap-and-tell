import { randomInt, timingSafeEqual } from 'crypto'
import { sendTemplateEmail } from './email-service'
import { otpEmailHtml } from './email-templates'
import { sendEmail } from './email'

/** OTP entry stored in memory. */
interface OtpEntry {
  code: string
  email: string
  expiresAt: Date
  attempts: number
  resendCount: number
}

/** Maximum verification attempts before OTP is invalidated. */
const MAX_ATTEMPTS = 3

/** Maximum resend requests per OTP. */
const MAX_RESENDS = 3

/** OTP validity duration in milliseconds (10 minutes). */
const OTP_EXPIRY_MS = 10 * 60 * 1000

/** In-memory OTP store keyed by user ID. */
const otpStore: Map<string, OtpEntry> = new Map()

/**
 * Generates a 6-digit OTP for email-based 2FA.
 *
 * Uses sendTemplateEmail (pluggable provider) with otp_code template.
 * Falls back to direct sendEmail with hardcoded HTML if no template is found.
 *
 * @param userId - The user ID to associate the OTP with.
 * @param email - The email address to send the OTP to.
 * @param locale - Locale for the email template ('en' or 'de').
 * @returns The generated 6-digit code.
 */
export function generateEmailOtp(userId: string, email: string, locale?: string): string {
  const code = randomInt(100000, 999999).toString()

  otpStore.set(userId, {
    code,
    email,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    attempts: 0,
    resendCount: 0
  })

  // In development, log the code for easy testing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[email-otp] Code for ${email}: ${code}`)
  }

  // Send OTP email via template service (SaaS provider or fallback)
  sendTemplateEmail(
    'otp_code',
    email,
    { code, email },
    { locale: locale || 'en', category: 'otp' }
  ).then((result) => {
    if (!result.success) {
      // Fallback: send directly with hardcoded HTML template
      console.warn('[email-otp] Template email failed, using fallback:', result.error)
      sendEmail({
        to: email,
        subject: 'Your Tap & Tell verification code',
        html: otpEmailHtml(code),
        source: 'otp'
      }).catch((err) => {
        console.error('[email-otp] Fallback send also failed:', err)
      })
    }
  }).catch((err) => {
    console.error('[email-otp] Failed to send template email:', err)
    // Fallback to direct send
    sendEmail({
      to: email,
      subject: 'Your Tap & Tell verification code',
      html: otpEmailHtml(code),
      source: 'otp'
    }).catch((fallbackErr) => {
      console.error('[email-otp] Fallback send also failed:', fallbackErr)
    })
  })

  return code
}

/**
 * Checks if an OTP can be resent for the given user.
 *
 * @param userId - The user ID.
 * @returns Whether a resend is allowed.
 */
export function canResendOtp(userId: string): boolean {
  const entry = otpStore.get(userId)
  if (!entry) return false
  return entry.resendCount < MAX_RESENDS
}

/**
 * Increments the resend counter for a user's OTP.
 *
 * @param userId - The user ID.
 */
export function incrementResendCount(userId: string): void {
  const entry = otpStore.get(userId)
  if (entry) {
    entry.resendCount += 1
  }
}

/**
 * Verifies an email OTP code.
 *
 * @param userId - The user ID.
 * @param code - The 6-digit code to verify.
 * @returns True if the code is valid and not expired.
 */
export function verifyEmailOtp(userId: string, code: string): boolean {
  const entry = otpStore.get(userId)
  if (!entry) return false

  // Check expiry
  if (entry.expiresAt.getTime() < Date.now()) {
    otpStore.delete(userId)
    return false
  }

  // Check max attempts
  entry.attempts += 1
  if (entry.attempts > MAX_ATTEMPTS) {
    otpStore.delete(userId)
    return false
  }

  // Timing-safe comparison
  if (code.length !== entry.code.length) return false

  const isValid = timingSafeEqual(Buffer.from(code), Buffer.from(entry.code))

  if (isValid) {
    otpStore.delete(userId)
  }

  return isValid
}

/**
 * Cleans up expired OTP entries. Called periodically.
 */
export function cleanupExpiredOtps(): void {
  const now = Date.now()
  for (const [key, entry] of otpStore) {
    if (entry.expiresAt.getTime() < now) {
      otpStore.delete(key)
    }
  }
}
