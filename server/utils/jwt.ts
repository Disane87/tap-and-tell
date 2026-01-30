import { SignJWT, jwtVerify } from 'jose'

/**
 * JWT signing secret from environment variable.
 */
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'tap-and-tell-jwt-secret-change-me'
  return new TextEncoder().encode(secret)
}

/**
 * JWT token payload structure.
 */
export interface JwtPayload {
  /** User ID. */
  sub: string
  /** User email. */
  email: string
}

/**
 * Creates a signed JWT token for a user.
 * Token expires in 7 days.
 *
 * @param payload - The JWT payload with user ID and email.
 * @returns The signed JWT string.
 */
export async function createJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

/**
 * Verifies and decodes a JWT token.
 *
 * @param token - The JWT string to verify.
 * @returns The decoded payload or null if invalid/expired.
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub || !payload.email) return null
    return {
      sub: payload.sub,
      email: payload.email as string
    }
  } catch {
    return null
  }
}
