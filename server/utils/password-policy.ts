/**
 * Password policy enforcement utilities.
 * Validates password strength requirements for a production-ready SaaS product.
 */

/** Result of a password policy check. */
interface PasswordPolicyResult {
  /** Whether the password meets all requirements. */
  valid: boolean
  /** List of policy violations, empty if valid. */
  errors: string[]
}

/** Minimum password length. */
const MIN_LENGTH = 12

/** Top common passwords to reject (subset for embedded use). */
const COMMON_PASSWORDS = new Set([
  'password1234', 'password123!', '123456789012', 'qwertyuiop12',
  'admin1234567', 'letmein12345', 'welcome12345', 'monkey1234567',
  'dragon123456', 'master123456', 'qwerty123456', 'login1234567',
  'princess1234', 'football1234', 'shadow123456', 'sunshine1234',
  'trustno1234!', 'iloveyou1234', 'batman123456', 'access123456',
  'hello1234567', 'charlie12345', 'donald123456', '!@#$%^&*()12',
  'password!234', 'passw0rd1234', 'pa$$word1234', 'p@ssword1234',
  'changeme1234', 'welcome1234!', 'abc123456789', '1234567890ab',
  'administrator', 'root12345678', 'toor12345678', 'default12345',
  'guest1234567', 'temp12345678', 'test12345678', 'user12345678',
  'admin12345678', 'pass12345678', 'super1234567', 'secret123456',
  'fuckyou12345', 'asshole123456', 'baseball1234', 'michael12345',
  'jordan123456', 'jennifer1234', 'hunter123456', 'thomas123456'
])

/**
 * Validates a password against the security policy.
 *
 * Requirements:
 * - At least 12 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one digit
 * - Contains at least one special character
 * - Not in the common passwords list
 *
 * @param password - The password to validate.
 * @returns A result object indicating whether the password is valid and any errors.
 */
export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  const errors: string[] = []

  if (password.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters long`)
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit')
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a more unique password')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
