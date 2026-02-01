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
  /** Token type claim (e.g. 'access' or 'refresh'). */
  type?: string
}

/**
 * Creates a signed JWT access token for a user.
 * Token expires in 15 minutes.
 *
 * @param payload - The JWT payload with user ID and email.
 * @returns The signed JWT string.
 */
export async function createAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ email: payload.email, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getSecret())
}

/**
 * Creates a signed JWT refresh token for a user.
 * Token expires in 7 days.
 *
 * @param payload - The JWT payload with user ID and email.
 * @returns The signed JWT string.
 */
export async function createRefreshToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ email: payload.email, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

/**
 * Creates a signed JWT token for a user.
 * Token expires in 15 minutes (access token).
 *
 * @deprecated Use createAccessToken instead.
 * @param payload - The JWT payload with user ID and email.
 * @returns The signed JWT string.
 */
export async function createJwt(payload: JwtPayload): Promise<string> {
  return createAccessToken(payload)
}

/**
 * Verifies and decodes a JWT token.
 * Optionally checks the token type claim.
 *
 * @param token - The JWT string to verify.
 * @param expectedType - Optional expected token type ('access' or 'refresh'). If provided, the token must contain a matching type claim.
 * @returns The decoded payload or null if invalid/expired.
 */
export async function verifyJwt(token: string, expectedType?: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub || !payload.email) return null

    // Check token type if expected
    if (expectedType && payload.type !== expectedType) return null

    return {
      sub: payload.sub,
      email: payload.email as string,
      type: payload.type as string | undefined
    }
  } catch {
    return null
  }
}
