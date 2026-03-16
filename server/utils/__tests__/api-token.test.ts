import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('api-token utilities', () => {
  describe('pure functions (no DB)', () => {
    let generateApiToken: typeof import('../api-token').generateApiToken
    let hashToken: typeof import('../api-token').hashToken
    let isApiToken: typeof import('../api-token').isApiToken
    let validateScopes: typeof import('../api-token').validateScopes
    let hasScope: typeof import('../api-token').hasScope
    let ALL_SCOPES: typeof import('../api-token').ALL_SCOPES
    let SCOPE_DESCRIPTIONS: typeof import('../api-token').SCOPE_DESCRIPTIONS

    beforeEach(async () => {
      vi.resetModules()

      // Stub Nitro auto-imports
      vi.stubGlobal('useDrizzle', vi.fn())
      vi.stubGlobal('createError', vi.fn((opts: { statusCode: number; message: string }) => {
        const error = new Error(opts.message) as Error & { statusCode: number }
        error.statusCode = opts.statusCode
        return error
      }))

      // Mock DB-related imports so module loads
      vi.doMock('drizzle-orm', () => ({
        eq: vi.fn(),
        and: vi.fn(),
        isNull: vi.fn()
      }))
      vi.doMock('~~/server/database/schema', () => ({
        apiApps: {},
        apiTokens: {}
      }))

      const mod = await import('../api-token')
      generateApiToken = mod.generateApiToken
      hashToken = mod.hashToken
      isApiToken = mod.isApiToken
      validateScopes = mod.validateScopes
      hasScope = mod.hasScope
      ALL_SCOPES = mod.ALL_SCOPES
      SCOPE_DESCRIPTIONS = mod.SCOPE_DESCRIPTIONS
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.doUnmock('drizzle-orm')
      vi.doUnmock('~~/server/database/schema')
    })

    describe('generateApiToken', () => {
      it('should return plaintext, hash, and prefix', () => {
        const result = generateApiToken()
        expect(result).toHaveProperty('plaintext')
        expect(result).toHaveProperty('hash')
        expect(result).toHaveProperty('prefix')
      })

      it('should produce plaintext starting with tat_', () => {
        const result = generateApiToken()
        expect(result.plaintext.startsWith('tat_')).toBe(true)
      })

      it('should produce a 44-char plaintext (tat_ + 40 hex chars)', () => {
        const result = generateApiToken()
        expect(result.plaintext).toHaveLength(44)
      })

      it('should produce prefix as first 8 chars of plaintext', () => {
        const result = generateApiToken()
        expect(result.prefix).toBe(result.plaintext.substring(0, 8))
      })

      it('should produce SHA-256 hash as 64-char hex string', () => {
        const result = generateApiToken()
        expect(result.hash).toMatch(/^[0-9a-f]{64}$/)
      })

      it('should generate unique tokens', () => {
        const t1 = generateApiToken()
        const t2 = generateApiToken()
        expect(t1.plaintext).not.toBe(t2.plaintext)
        expect(t1.hash).not.toBe(t2.hash)
      })

      it('should produce hash that matches hashToken(plaintext)', () => {
        const result = generateApiToken()
        expect(result.hash).toBe(hashToken(result.plaintext))
      })
    })

    describe('hashToken', () => {
      it('should return consistent hash for same input', () => {
        const hash1 = hashToken('test-token')
        const hash2 = hashToken('test-token')
        expect(hash1).toBe(hash2)
      })

      it('should return 64-char hex string', () => {
        expect(hashToken('anything')).toMatch(/^[0-9a-f]{64}$/)
      })

      it('should return different hashes for different inputs', () => {
        expect(hashToken('token-a')).not.toBe(hashToken('token-b'))
      })
    })

    describe('isApiToken', () => {
      it('should return true for tat_ prefixed strings', () => {
        expect(isApiToken('tat_abc123')).toBe(true)
      })

      it('should return false for non-prefixed strings', () => {
        expect(isApiToken('ghp_abc123')).toBe(false)
        expect(isApiToken('Bearer xyz')).toBe(false)
      })

      it('should return false for empty string', () => {
        expect(isApiToken('')).toBe(false)
      })

      it('should return true for just the prefix', () => {
        expect(isApiToken('tat_')).toBe(true)
      })
    })

    describe('validateScopes', () => {
      it('should return true for valid scopes', () => {
        expect(validateScopes(['entries:read', 'entries:write'])).toBe(true)
      })

      it('should return false for invalid scope', () => {
        expect(validateScopes(['entries:read', 'invalid:scope'])).toBe(false)
      })

      it('should return true for empty array', () => {
        expect(validateScopes([])).toBe(true)
      })

      it('should return true for all scopes', () => {
        expect(validateScopes([...ALL_SCOPES])).toBe(true)
      })
    })

    describe('hasScope', () => {
      const mockContext = {
        tokenId: 't1', appId: 'a1', appName: 'Test', tokenName: 'Token',
        tenantId: 'ten1', userId: 'u1', scopes: ['entries:read', 'guestbooks:read']
      }

      it('should return true when scope present', () => {
        expect(hasScope(mockContext, 'entries:read')).toBe(true)
      })

      it('should return false when scope missing', () => {
        expect(hasScope(mockContext, 'entries:write')).toBe(false)
      })
    })

    describe('ALL_SCOPES', () => {
      it('should contain 9 scopes', () => {
        expect(ALL_SCOPES).toHaveLength(9)
      })

      it('should have a description for every scope', () => {
        for (const scope of ALL_SCOPES) {
          expect(SCOPE_DESCRIPTIONS[scope]).toBeDefined()
          expect(typeof SCOPE_DESCRIPTIONS[scope]).toBe('string')
        }
      })
    })
  })

  describe('requireScope', () => {
    let requireScope: typeof import('../api-token').requireScope

    beforeEach(async () => {
      vi.resetModules()

      vi.stubGlobal('useDrizzle', vi.fn())
      vi.stubGlobal('createError', vi.fn((opts: { statusCode: number; message: string }) => {
        const error = new Error(opts.message) as Error & { statusCode: number }
        error.statusCode = opts.statusCode
        return error
      }))

      vi.doMock('drizzle-orm', () => ({
        eq: vi.fn(),
        and: vi.fn(),
        isNull: vi.fn()
      }))
      vi.doMock('~~/server/database/schema', () => ({
        apiApps: {},
        apiTokens: {}
      }))

      const mod = await import('../api-token')
      requireScope = mod.requireScope
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.doUnmock('drizzle-orm')
      vi.doUnmock('~~/server/database/schema')
    })

    it('should allow cookie-authenticated users without apiApp', () => {
      const event = { context: { user: { id: 'u1' } } }
      expect(() => requireScope(event, 'entries:read')).not.toThrow()
    })

    it('should throw 401 when no auth at all', () => {
      const event = { context: {} }
      expect(() => requireScope(event, 'entries:read')).toThrow('Authentication required')
    })

    it('should throw 403 when scope missing from API token', () => {
      const event = {
        context: {
          apiApp: {
            tokenId: 't1', appId: 'a1', appName: 'Test', tokenName: 'Token',
            tenantId: 'ten1', userId: 'u1', scopes: ['guestbooks:read']
          }
        }
      }
      expect(() => requireScope(event, 'entries:write')).toThrow('Insufficient scope')
    })

    it('should allow when scope is granted', () => {
      const event = {
        context: {
          apiApp: {
            tokenId: 't1', appId: 'a1', appName: 'Test', tokenName: 'Token',
            tenantId: 'ten1', userId: 'u1', scopes: ['entries:read', 'entries:write']
          }
        }
      }
      expect(() => requireScope(event, 'entries:read')).not.toThrow()
    })
  })

  describe('validateApiToken (DB-dependent)', () => {
    let validateApiToken: typeof import('../api-token').validateApiToken
    let mockDb: Record<string, ReturnType<typeof vi.fn>>

    beforeEach(async () => {
      vi.resetModules()

      mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis()
      }

      vi.stubGlobal('useDrizzle', vi.fn(() => mockDb))
      vi.stubGlobal('createError', vi.fn((opts: { statusCode: number; message: string }) => {
        const error = new Error(opts.message) as Error & { statusCode: number }
        error.statusCode = opts.statusCode
        return error
      }))

      vi.doMock('drizzle-orm', () => ({
        eq: vi.fn((_col: unknown, _val: unknown) => ({ _col, _val })),
        and: vi.fn(),
        isNull: vi.fn()
      }))
      vi.doMock('~~/server/database/schema', () => ({
        apiApps: { id: 'id', name: 'name', tenantId: 'tenantId', userId: 'userId' },
        apiTokens: {
          id: 'id', appId: 'appId', name: 'name', scopes: 'scopes',
          expiresAt: 'expiresAt', revokedAt: 'revokedAt', tokenHash: 'tokenHash',
          lastUsedAt: 'lastUsedAt'
        }
      }))

      const mod = await import('../api-token')
      validateApiToken = mod.validateApiToken
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.doUnmock('drizzle-orm')
      vi.doUnmock('~~/server/database/schema')
    })

    it('should return null for non-API token', async () => {
      const result = await validateApiToken('not-an-api-token')
      expect(result).toBeNull()
    })

    it('should return null when token not found in DB', async () => {
      mockDb.where.mockResolvedValueOnce([])
      const result = await validateApiToken('tat_' + 'a'.repeat(40))
      expect(result).toBeNull()
    })

    it('should return null for revoked token', async () => {
      mockDb.where.mockResolvedValueOnce([{
        tokenId: 't1', appId: 'a1', tokenName: 'Token', scopes: ['entries:read'],
        expiresAt: null, revokedAt: new Date(),
        appName: 'App', tenantId: 'ten1', userId: 'u1'
      }])
      const result = await validateApiToken('tat_' + 'a'.repeat(40))
      expect(result).toBeNull()
    })

    it('should return null for expired token', async () => {
      mockDb.where.mockResolvedValueOnce([{
        tokenId: 't1', appId: 'a1', tokenName: 'Token', scopes: ['entries:read'],
        expiresAt: new Date(Date.now() - 1000), revokedAt: null,
        appName: 'App', tenantId: 'ten1', userId: 'u1'
      }])
      const result = await validateApiToken('tat_' + 'a'.repeat(40))
      expect(result).toBeNull()
    })

    it('should return context for valid token', async () => {
      // Make update().set().where() chainable and resolve
      mockDb.where
        .mockResolvedValueOnce([{
          tokenId: 't1', appId: 'a1', tokenName: 'Token', scopes: ['entries:read', 'guestbooks:read'],
          expiresAt: new Date(Date.now() + 86400000), revokedAt: null,
          appName: 'My App', tenantId: 'ten1', userId: 'u1'
        }])
        .mockResolvedValueOnce(undefined) // for the update lastUsedAt
      mockDb.set.mockReturnValue(mockDb) // set returns this for chaining

      const result = await validateApiToken('tat_' + 'a'.repeat(40))
      expect(result).not.toBeNull()
      expect(result!.tokenId).toBe('t1')
      expect(result!.appName).toBe('My App')
      expect(result!.tenantId).toBe('ten1')
      expect(result!.scopes).toEqual(['entries:read', 'guestbooks:read'])
    })

    it('should return context for token without expiry', async () => {
      mockDb.where
        .mockResolvedValueOnce([{
          tokenId: 't1', appId: 'a1', tokenName: 'Token', scopes: ['entries:read'],
          expiresAt: null, revokedAt: null,
          appName: 'App', tenantId: 'ten1', userId: 'u1'
        }])
        .mockResolvedValueOnce(undefined)
      mockDb.set.mockReturnValue(mockDb)

      const result = await validateApiToken('tat_' + 'a'.repeat(40))
      expect(result).not.toBeNull()
    })

    it('should update lastUsedAt on successful validation', async () => {
      mockDb.where
        .mockResolvedValueOnce([{
          tokenId: 't1', appId: 'a1', tokenName: 'Token', scopes: [],
          expiresAt: null, revokedAt: null,
          appName: 'App', tenantId: 'ten1', userId: 'u1'
        }])
        .mockResolvedValueOnce(undefined)
      mockDb.set.mockReturnValue(mockDb)

      await validateApiToken('tat_' + 'a'.repeat(40))
      expect(mockDb.update).toHaveBeenCalled()
    })

    it('should handle null scopes as empty array', async () => {
      mockDb.where
        .mockResolvedValueOnce([{
          tokenId: 't1', appId: 'a1', tokenName: 'Token', scopes: null,
          expiresAt: null, revokedAt: null,
          appName: 'App', tenantId: 'ten1', userId: 'u1'
        }])
        .mockResolvedValueOnce(undefined)
      mockDb.set.mockReturnValue(mockDb)

      const result = await validateApiToken('tat_' + 'a'.repeat(40))
      expect(result!.scopes).toEqual([])
    })
  })
})
