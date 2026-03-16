import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('session utilities', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
    vi.doUnmock('~~/server/utils/drizzle')
    vi.doUnmock('~~/server/utils/jwt')
    vi.doUnmock('~~/server/database/schema')
    vi.doUnmock('drizzle-orm')
    vi.doUnmock('h3')
  })

  describe('cookie options', () => {
    let getAccessTokenCookieOptions: typeof import('../session').getAccessTokenCookieOptions
    let getRefreshTokenCookieOptions: typeof import('../session').getRefreshTokenCookieOptions

    beforeEach(async () => {
      vi.resetModules()

      vi.doMock('drizzle-orm', () => ({
        eq: vi.fn(), and: vi.fn(), gt: vi.fn()
      }))
      vi.doMock('h3', () => ({
        setCookie: vi.fn()
      }))
      vi.doMock('~~/server/database/schema', () => ({
        sessions: {}, users: {}, userTwoFactor: {}
      }))
      vi.doMock('~~/server/utils/jwt', () => ({
        createAccessToken: vi.fn(),
        createRefreshToken: vi.fn(),
        verifyJwt: vi.fn()
      }))

      const mod = await import('../session')
      getAccessTokenCookieOptions = mod.getAccessTokenCookieOptions
      getRefreshTokenCookieOptions = mod.getRefreshTokenCookieOptions
    })

    it('should return httpOnly, strict sameSite, 15min maxAge for access token', () => {
      const opts = getAccessTokenCookieOptions()
      expect(opts.httpOnly).toBe(true)
      expect(opts.sameSite).toBe('strict')
      expect(opts.maxAge).toBe(15 * 60)
      expect(opts.path).toBe('/')
    })

    it('should return httpOnly, strict sameSite, 7day maxAge for refresh token', () => {
      const opts = getRefreshTokenCookieOptions()
      expect(opts.httpOnly).toBe(true)
      expect(opts.sameSite).toBe('strict')
      expect(opts.maxAge).toBe(7 * 24 * 60 * 60)
      expect(opts.path).toBe('/')
    })

    it('should set secure=true in production', () => {
      process.env.NODE_ENV = 'production'
      expect(getAccessTokenCookieOptions().secure).toBe(true)
      expect(getRefreshTokenCookieOptions().secure).toBe(true)
    })

    it('should set secure=false in non-production', () => {
      process.env.NODE_ENV = 'development'
      expect(getAccessTokenCookieOptions().secure).toBe(false)
      expect(getRefreshTokenCookieOptions().secure).toBe(false)
    })
  })

  describe('setAuthCookies', () => {
    it('should set both auth_token and refresh_token cookies', async () => {
      vi.resetModules()

      const mockSetCookie = vi.fn()
      vi.doMock('h3', () => ({
        setCookie: mockSetCookie
      }))
      vi.doMock('drizzle-orm', () => ({
        eq: vi.fn(), and: vi.fn(), gt: vi.fn()
      }))
      vi.doMock('~~/server/database/schema', () => ({
        sessions: {}, users: {}, userTwoFactor: {}
      }))
      vi.doMock('~~/server/utils/jwt', () => ({
        createAccessToken: vi.fn(),
        createRefreshToken: vi.fn(),
        verifyJwt: vi.fn()
      }))

      const { setAuthCookies } = await import('../session')
      const mockEvent = {} as Parameters<typeof mockSetCookie>[0]
      const tokens = { accessToken: 'access-jwt', refreshToken: 'refresh-jwt' }

      setAuthCookies(mockEvent, tokens)

      expect(mockSetCookie).toHaveBeenCalledTimes(2)
      expect(mockSetCookie).toHaveBeenCalledWith(
        mockEvent, 'auth_token', 'access-jwt', expect.objectContaining({ maxAge: 15 * 60 })
      )
      expect(mockSetCookie).toHaveBeenCalledWith(
        mockEvent, 'refresh_token', 'refresh-jwt', expect.objectContaining({ maxAge: 7 * 24 * 60 * 60 })
      )
    })
  })

  describe('createSession', () => {
    it('should create access + refresh tokens and insert session into DB', async () => {
      vi.resetModules()

      const mockDb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined)
      }
      vi.stubGlobal('useDrizzle', vi.fn(() => mockDb))
      vi.stubGlobal('generateId', vi.fn(() => 'session-id-123'))

      vi.doMock('drizzle-orm', () => ({
        eq: vi.fn(), and: vi.fn(), gt: vi.fn()
      }))
      vi.doMock('h3', () => ({ setCookie: vi.fn() }))
      vi.doMock('~~/server/database/schema', () => ({
        sessions: { id: 'id', userId: 'userId', token: 'token', expiresAt: 'expiresAt' },
        users: {},
        userTwoFactor: {}
      }))
      vi.doMock('~~/server/utils/jwt', () => ({
        createAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
        createRefreshToken: vi.fn().mockResolvedValue('mock-refresh-token'),
        verifyJwt: vi.fn()
      }))

      const { createSession } = await import('../session')
      const result = await createSession('user-1', 'user@test.com')

      expect(result.accessToken).toBe('mock-access-token')
      expect(result.refreshToken).toBe('mock-refresh-token')
      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'session-id-123',
          userId: 'user-1',
          token: 'mock-refresh-token'
        })
      )
    })
  })

  describe('validateAccessToken', () => {
    let mockDb: Record<string, ReturnType<typeof vi.fn>>
    let mockVerifyJwt: ReturnType<typeof vi.fn>

    beforeEach(async () => {
      vi.resetModules()

      mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      }
      mockVerifyJwt = vi.fn().mockResolvedValue(null)

      vi.stubGlobal('useDrizzle', vi.fn(() => mockDb))

      vi.doMock('drizzle-orm', () => ({
        eq: vi.fn((_a: unknown, _b: unknown) => ({})),
        and: vi.fn((...args: unknown[]) => args),
        gt: vi.fn()
      }))
      vi.doMock('h3', () => ({ setCookie: vi.fn() }))
      vi.doMock('~~/server/database/schema', () => ({
        sessions: {},
        users: { id: 'id', email: 'email', name: 'name', avatarUrl: 'avatarUrl', isAdmin: 'isAdmin', locale: 'locale' },
        userTwoFactor: { userId: 'userId', enabled: 'enabled' }
      }))
      vi.doMock('~~/server/utils/jwt', () => ({
        createAccessToken: vi.fn(),
        createRefreshToken: vi.fn(),
        verifyJwt: mockVerifyJwt
      }))
    })

    it('should return null for invalid JWT', async () => {
      mockVerifyJwt.mockResolvedValue(null)
      const { validateAccessToken } = await import('../session')
      const result = await validateAccessToken('invalid-token')
      expect(result).toBeNull()
    })

    it('should return null when user not found in DB', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: 'nonexistent', email: 'test@test.com' })
      mockDb.where.mockResolvedValue([])
      const { validateAccessToken } = await import('../session')
      const result = await validateAccessToken('valid-jwt')
      expect(result).toBeNull()
    })

    it('should return user object for valid token', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: 'user-1', email: 'user@test.com' })
      mockDb.where.mockResolvedValue([{
        id: 'user-1', email: 'user@test.com', name: 'Test User',
        avatarUrl: null, isAdmin: false, locale: 'en', twoFactorEnabled: null
      }])
      const { validateAccessToken } = await import('../session')
      const result = await validateAccessToken('valid-jwt')
      expect(result).not.toBeNull()
      expect(result!.id).toBe('user-1')
      expect(result!.email).toBe('user@test.com')
      expect(result!.name).toBe('Test User')
    })

    it('should map twoFactorEnabled correctly', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: 'user-1', email: 'user@test.com' })

      // 2FA enabled
      mockDb.where.mockResolvedValue([{
        id: 'user-1', email: 'user@test.com', name: 'User',
        avatarUrl: null, isAdmin: false, locale: 'en', twoFactorEnabled: 'true'
      }])
      const { validateAccessToken } = await import('../session')
      const result1 = await validateAccessToken('token')
      expect(result1!.twoFactorEnabled).toBe(true)

      // 2FA not enabled
      mockDb.where.mockResolvedValue([{
        id: 'user-1', email: 'user@test.com', name: 'User',
        avatarUrl: null, isAdmin: false, locale: 'en', twoFactorEnabled: null
      }])
      const result2 = await validateAccessToken('token')
      expect(result2!.twoFactorEnabled).toBe(false)
    })
  })

  describe('refreshSession', () => {
    it('should return null for invalid refresh token', async () => {
      vi.resetModules()

      const mockVerifyJwt = vi.fn().mockResolvedValue(null)
      vi.stubGlobal('useDrizzle', vi.fn())

      vi.doMock('drizzle-orm', () => ({
        eq: vi.fn(), and: vi.fn(), gt: vi.fn()
      }))
      vi.doMock('h3', () => ({ setCookie: vi.fn() }))
      vi.doMock('~~/server/database/schema', () => ({
        sessions: {}, users: {}, userTwoFactor: {}
      }))
      vi.doMock('~~/server/utils/jwt', () => ({
        createAccessToken: vi.fn(),
        createRefreshToken: vi.fn(),
        verifyJwt: mockVerifyJwt
      }))

      const { refreshSession } = await import('../session')
      const result = await refreshSession('invalid-refresh')
      expect(result).toBeNull()
    })

    it('should return null when session not found in DB', async () => {
      vi.resetModules()

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([])
      }
      vi.stubGlobal('useDrizzle', vi.fn(() => mockDb))

      vi.doMock('drizzle-orm', () => ({
        eq: vi.fn(), and: vi.fn((...args: unknown[]) => args), gt: vi.fn()
      }))
      vi.doMock('h3', () => ({ setCookie: vi.fn() }))
      vi.doMock('~~/server/database/schema', () => ({
        sessions: { token: 'token', expiresAt: 'expiresAt', id: 'id' },
        users: {}, userTwoFactor: {}
      }))
      vi.doMock('~~/server/utils/jwt', () => ({
        createAccessToken: vi.fn(),
        createRefreshToken: vi.fn(),
        verifyJwt: vi.fn().mockResolvedValue({ sub: 'user-1', email: 'u@t.com' })
      }))

      const { refreshSession } = await import('../session')
      const result = await refreshSession('valid-refresh-but-no-session')
      expect(result).toBeNull()
    })

    it('should return new tokens and rotate refresh in DB', async () => {
      vi.resetModules()

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ id: 'sess-1', userId: 'user-1', token: 'old-refresh', expiresAt: new Date(Date.now() + 86400000) }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis()
      }
      vi.stubGlobal('useDrizzle', vi.fn(() => mockDb))

      vi.doMock('drizzle-orm', () => ({
        eq: vi.fn(), and: vi.fn((...args: unknown[]) => args), gt: vi.fn()
      }))
      vi.doMock('h3', () => ({ setCookie: vi.fn() }))
      vi.doMock('~~/server/database/schema', () => ({
        sessions: { token: 'token', expiresAt: 'expiresAt', id: 'id' },
        users: {}, userTwoFactor: {}
      }))
      vi.doMock('~~/server/utils/jwt', () => ({
        createAccessToken: vi.fn().mockResolvedValue('new-access'),
        createRefreshToken: vi.fn().mockResolvedValue('new-refresh'),
        verifyJwt: vi.fn().mockResolvedValue({ sub: 'user-1', email: 'u@t.com' })
      }))

      const { refreshSession } = await import('../session')
      const result = await refreshSession('old-refresh-token')

      expect(result).not.toBeNull()
      expect(result!.accessToken).toBe('new-access')
      expect(result!.refreshToken).toBe('new-refresh')
      expect(mockDb.update).toHaveBeenCalled()
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'new-refresh' })
      )
    })
  })

  describe('deleteSession', () => {
    it('should delete session by refresh token', async () => {
      vi.resetModules()

      const mockDb = {
        delete: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined)
      }
      vi.stubGlobal('useDrizzle', vi.fn(() => mockDb))

      vi.doMock('drizzle-orm', () => ({
        eq: vi.fn(), and: vi.fn(), gt: vi.fn()
      }))
      vi.doMock('h3', () => ({ setCookie: vi.fn() }))
      vi.doMock('~~/server/database/schema', () => ({
        sessions: { token: 'token' }, users: {}, userTwoFactor: {}
      }))
      vi.doMock('~~/server/utils/jwt', () => ({
        createAccessToken: vi.fn(), createRefreshToken: vi.fn(), verifyJwt: vi.fn()
      }))

      const { deleteSession } = await import('../session')
      await deleteSession('refresh-to-delete')
      expect(mockDb.delete).toHaveBeenCalled()
    })
  })

  describe('deleteAllUserSessions', () => {
    it('should delete all sessions for a user', async () => {
      vi.resetModules()

      const mockDb = {
        delete: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(undefined)
      }
      vi.stubGlobal('useDrizzle', vi.fn(() => mockDb))

      vi.doMock('drizzle-orm', () => ({
        eq: vi.fn(), and: vi.fn(), gt: vi.fn()
      }))
      vi.doMock('h3', () => ({ setCookie: vi.fn() }))
      vi.doMock('~~/server/database/schema', () => ({
        sessions: { userId: 'userId' }, users: {}, userTwoFactor: {}
      }))
      vi.doMock('~~/server/utils/jwt', () => ({
        createAccessToken: vi.fn(), createRefreshToken: vi.fn(), verifyJwt: vi.fn()
      }))

      const { deleteAllUserSessions } = await import('../session')
      await deleteAllUserSessions('user-1')
      expect(mockDb.delete).toHaveBeenCalled()
    })
  })
})
