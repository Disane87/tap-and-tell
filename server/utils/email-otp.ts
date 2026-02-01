import { randomInt, timingSafeEqual } from 'crypto'

/** OTP entry stored in memory. */
interface OtpEntry {
  code: string
  email: string
  expiresAt: Date
  attempts: number
}

/** Maximum verification attempts before OTP is invalidated. */
const MAX_ATTEMPTS = 3

/** OTP validity duration in milliseconds (10 minutes). */
const OTP_EXPIRY_MS = 10 * 60 * 1000

/** In-memory OTP store keyed by user ID. */
const otpStore: Map<string, OtpEntry> = new Map()

/**
 * Generates a 6-digit OTP for email-based 2FA.
 *
 * @param userId - The user ID to associate the OTP with.
 * @param email - The email address to send the OTP to.
 * @returns The generated 6-digit code.
 */
export function generateEmailOtp(userId: string, email: string): string {
  const code = randomInt(100000, 999999).toString()

  otpStore.set(userId, {
    code,
    email,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    attempts: 0
  })

  // In development, log the code for easy testing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[email-otp] Code for ${email}: ${code}`)
  }

  // TODO: Integrate with email service (SendGrid, Resend, etc.) for production
  // await sendEmail(email, 'Your Tap & Tell verification code', `Your code is: ${code}`)

  return code
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
