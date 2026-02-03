/**
 * Authenticated user object returned from API.
 */
export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
}

/**
 * Login credentials.
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Registration data.
 */
export interface RegisterData {
  email: string
  password: string
  name: string
  /** Beta invite token for invite-only registration. */
  betaToken?: string
}

/**
 * Beta invite validation result.
 */
export interface BetaInviteValidation {
  betaMode: 'private' | 'waitlist' | 'open'
  betaModeEnabled: boolean
  valid: boolean
  email?: string
  grantedPlan?: string
  isFounder?: boolean
  expiresAt?: string
  error?: string
}

/**
 * Result type for the login flow.
 * - 'success': Login completed, user is authenticated
 * - '2fa': Two-factor authentication required, show verification form
 * - 'error': Login failed (invalid credentials, etc.)
 */
export type LoginResult = 'success' | '2fa' | 'error'
