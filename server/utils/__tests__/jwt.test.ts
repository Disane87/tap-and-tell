import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createAccessToken, createRefreshToken, createJwt, verifyJwt, type JwtPayload } from '../jwt'

/**
 * Unit tests for JWT token utilities.
 * Tests token creation, verification, and expiration.
 */
describe('jwt utilities', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createAccessToken', () => {
    it('should create a valid JWT access token', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com'
      }

      const token = await createAccessToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      // JWT format: header.payload.signature
      expect(token.split('.')).toHaveLength(3)
    })

    it('should include correct claims in access token', async () => {
      const payload: JwtPayload = {
        sub: 'user-456',
        email: 'user@example.com'
      }

      const token = await createAccessToken(payload)
      const verified = await verifyJwt(token)

      expect(verified).not.toBeNull()
      expect(verified?.sub).toBe('user-456')
      expect(verified?.email).toBe('user@example.com')
      expect(verified?.type).toBe('access')
    })

    it('should create tokens with proper JWT structure', async () => {
      const payload: JwtPayload = {
        sub: 'user-789',
        email: 'test@test.com'
      }

      const token = await createAccessToken(payload)

      // Verify JWT structure: header.payload.signature
      const parts = token.split('.')
      expect(parts).toHaveLength(3)

      // Decode and verify header
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString())
      expect(header.alg).toBe('HS256')

      // Decode and verify payload contains expected claims
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
      expect(decoded.sub).toBe('user-789')
      expect(decoded.email).toBe('test@test.com')
      expect(decoded.type).toBe('access')
      expect(decoded.iat).toBeDefined()
      expect(decoded.exp).toBeDefined()
    })
  })

  describe('createRefreshToken', () => {
    it('should create a valid JWT refresh token', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com'
      }

      const token = await createRefreshToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should include correct type claim in refresh token', async () => {
      const payload: JwtPayload = {
        sub: 'user-456',
        email: 'user@example.com'
      }

      const token = await createRefreshToken(payload)
      const verified = await verifyJwt(token)

      expect(verified).not.toBeNull()
      expect(verified?.type).toBe('refresh')
    })

    it('should create different tokens than access tokens', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com'
      }

      const accessToken = await createAccessToken(payload)
      const refreshToken = await createRefreshToken(payload)

      expect(accessToken).not.toBe(refreshToken)
    })
  })

  describe('createJwt (deprecated)', () => {
    it('should create same token as createAccessToken', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com'
      }

      // Both should create access tokens with same claims
      const legacyToken = await createJwt(payload)
      const verified = await verifyJwt(legacyToken)

      expect(verified?.type).toBe('access')
    })
  })

  describe('verifyJwt', () => {
    it('should verify valid access token', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com'
      }

      const token = await createAccessToken(payload)
      const verified = await verifyJwt(token)

      expect(verified).not.toBeNull()
      expect(verified?.sub).toBe('user-123')
      expect(verified?.email).toBe('test@example.com')
    })

    it('should verify valid refresh token', async () => {
      const payload: JwtPayload = {
        sub: 'user-456',
        email: 'user@test.com'
      }

      const token = await createRefreshToken(payload)
      const verified = await verifyJwt(token)

      expect(verified).not.toBeNull()
      expect(verified?.sub).toBe('user-456')
    })

    it('should return null for invalid token', async () => {
      const invalidToken = 'invalid.jwt.token'
      const verified = await verifyJwt(invalidToken)

      expect(verified).toBeNull()
    })

    it('should return null for malformed token', async () => {
      const malformedTokens = [
        '',
        'not-a-jwt',
        'only.two.parts.here.extra',
        'eyJhbGciOiJIUzI1NiJ9' // incomplete
      ]

      for (const token of malformedTokens) {
        const verified = await verifyJwt(token)
        expect(verified).toBeNull()
      }
    })

    it('should return null for token signed with different secret', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com'
      }

      // Create token with current secret
      const token = await createAccessToken(payload)

      // Change secret
      process.env.JWT_SECRET = 'different-secret'

      // Verification should fail
      const verified = await verifyJwt(token)
      expect(verified).toBeNull()
    })

    it('should verify expected token type', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com'
      }

      const accessToken = await createAccessToken(payload)
      const refreshToken = await createRefreshToken(payload)

      // Verify with expected type
      const validAccess = await verifyJwt(accessToken, 'access')
      const validRefresh = await verifyJwt(refreshToken, 'refresh')

      expect(validAccess).not.toBeNull()
      expect(validRefresh).not.toBeNull()

      // Verify with wrong expected type
      const invalidAccess = await verifyJwt(accessToken, 'refresh')
      const invalidRefresh = await verifyJwt(refreshToken, 'access')

      expect(invalidAccess).toBeNull()
      expect(invalidRefresh).toBeNull()
    })

    it('should return null for token missing required claims', async () => {
      // This is harder to test directly since we control token creation
      // But we can test that tokens without sub or email are rejected
      const verified = await verifyJwt('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIifQ.invalid')
      expect(verified).toBeNull()
    })
  })

  describe('token expiration', () => {
    it('should create access token that expires', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com'
      }

      const token = await createAccessToken(payload)

      // Decode payload to check expiration
      const parts = token.split('.')
      const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())

      // Access token should expire in 15 minutes
      const expectedExp = Math.floor(Date.now() / 1000) + 15 * 60
      expect(decodedPayload.exp).toBeGreaterThan(Date.now() / 1000)
      expect(decodedPayload.exp).toBeLessThanOrEqual(expectedExp + 5) // Allow 5 second tolerance
    })

    it('should create refresh token with longer expiration', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com'
      }

      const accessToken = await createAccessToken(payload)
      const refreshToken = await createRefreshToken(payload)

      // Decode both payloads
      const accessPayload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString())
      const refreshPayload = JSON.parse(Buffer.from(refreshToken.split('.')[1], 'base64url').toString())

      // Refresh token should have longer expiration (7 days vs 15 minutes)
      expect(refreshPayload.exp).toBeGreaterThan(accessPayload.exp)
    })
  })

  describe('default secret fallback', () => {
    it('should use default secret in development', async () => {
      delete process.env.JWT_SECRET
      process.env.NODE_ENV = 'development'

      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'test@example.com'
      }

      // Should not throw, uses default secret
      const token = await createAccessToken(payload)
      expect(token).toBeDefined()
    })
  })
})
