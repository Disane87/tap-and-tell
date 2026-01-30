/**
 * Authenticated user object returned from API.
 */
export interface AuthUser {
  id: string
  email: string
  name: string
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
}
