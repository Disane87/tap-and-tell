import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  recordFailedAttempt,
  recordSuccessfulLogin,
  isLocked,
  clearExpiredLocks,
  resetLockoutStore
} from '../account-lockout'

describe('account-lockout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetLockoutStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('recordFailedAttempt', () => {
    it('should not lock account before reaching threshold', () => {
      for (let i = 0; i < 9; i++) {
        recordFailedAttempt('user@example.com')
      }
      expect(isLocked('user@example.com').locked).toBe(false)
    })

    it('should lock account after 10 failed attempts', () => {
      for (let i = 0; i < 10; i++) {
        recordFailedAttempt('user@example.com')
      }
      const status = isLocked('user@example.com')
      expect(status.locked).toBe(true)
      expect(status.lockedUntil).toBeDefined()
    })

    it('should set lockout duration to 30 minutes', () => {
      const now = Date.now()
      for (let i = 0; i < 10; i++) {
        recordFailedAttempt('user@example.com')
      }
      const status = isLocked('user@example.com')
      const expectedLockEnd = now + 30 * 60 * 1000
      expect(status.lockedUntil!.getTime()).toBe(expectedLockEnd)
    })

    it('should normalize email (case-insensitive, trimmed)', () => {
      for (let i = 0; i < 10; i++) {
        recordFailedAttempt('  Admin@Test.COM  ')
      }
      expect(isLocked('admin@test.com').locked).toBe(true)
    })
  })

  describe('isLocked', () => {
    it('should return locked: false for unknown email', () => {
      expect(isLocked('unknown@example.com')).toEqual({ locked: false })
    })

    it('should return locked: false before threshold', () => {
      recordFailedAttempt('user@example.com')
      expect(isLocked('user@example.com')).toEqual({ locked: false })
    })

    it('should clear lock after expiry', () => {
      for (let i = 0; i < 10; i++) {
        recordFailedAttempt('user@example.com')
      }
      expect(isLocked('user@example.com').locked).toBe(true)

      // Advance past 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000 + 1)

      expect(isLocked('user@example.com').locked).toBe(false)
    })

    it('should stay locked within window', () => {
      for (let i = 0; i < 10; i++) {
        recordFailedAttempt('user@example.com')
      }

      // Advance 15 minutes (still within 30-minute window)
      vi.advanceTimersByTime(15 * 60 * 1000)

      expect(isLocked('user@example.com').locked).toBe(true)
    })
  })

  describe('recordSuccessfulLogin', () => {
    it('should reset counter and remove lock', () => {
      for (let i = 0; i < 10; i++) {
        recordFailedAttempt('user@example.com')
      }
      expect(isLocked('user@example.com').locked).toBe(true)

      recordSuccessfulLogin('user@example.com')
      expect(isLocked('user@example.com').locked).toBe(false)
    })

    it('should normalize email for reset', () => {
      for (let i = 0; i < 10; i++) {
        recordFailedAttempt('user@example.com')
      }
      recordSuccessfulLogin('  USER@EXAMPLE.COM  ')
      expect(isLocked('user@example.com').locked).toBe(false)
    })

    it('should not throw for unknown email', () => {
      expect(() => recordSuccessfulLogin('unknown@example.com')).not.toThrow()
    })
  })

  describe('clearExpiredLocks', () => {
    it('should remove expired entries', () => {
      for (let i = 0; i < 10; i++) {
        recordFailedAttempt('user@example.com')
      }

      // Advance past lockout
      vi.advanceTimersByTime(30 * 60 * 1000 + 1)

      clearExpiredLocks()

      // After clearance, fresh attempts should start from 0
      for (let i = 0; i < 9; i++) {
        recordFailedAttempt('user@example.com')
      }
      expect(isLocked('user@example.com').locked).toBe(false)
    })

    it('should retain non-expired entries', () => {
      for (let i = 0; i < 10; i++) {
        recordFailedAttempt('user@example.com')
      }

      // Only advance 15 minutes
      vi.advanceTimersByTime(15 * 60 * 1000)

      clearExpiredLocks()
      expect(isLocked('user@example.com').locked).toBe(true)
    })
  })

  describe('independent tracking', () => {
    it('should track multiple emails independently', () => {
      for (let i = 0; i < 10; i++) {
        recordFailedAttempt('user1@example.com')
      }
      recordFailedAttempt('user2@example.com')

      expect(isLocked('user1@example.com').locked).toBe(true)
      expect(isLocked('user2@example.com').locked).toBe(false)
    })

    it('should not affect other emails on successful login', () => {
      for (let i = 0; i < 10; i++) {
        recordFailedAttempt('user1@example.com')
        recordFailedAttempt('user2@example.com')
      }
      recordSuccessfulLogin('user1@example.com')

      expect(isLocked('user1@example.com').locked).toBe(false)
      expect(isLocked('user2@example.com').locked).toBe(true)
    })
  })

  describe('resetLockoutStore', () => {
    it('should clear everything', () => {
      for (let i = 0; i < 10; i++) {
        recordFailedAttempt('user1@example.com')
        recordFailedAttempt('user2@example.com')
      }
      resetLockoutStore()
      expect(isLocked('user1@example.com').locked).toBe(false)
      expect(isLocked('user2@example.com').locked).toBe(false)
    })
  })
})
