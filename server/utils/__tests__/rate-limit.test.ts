import { describe, it, expect, afterEach } from 'vitest'
import { RateLimiter } from '../rate-limit'

describe('RateLimiter', () => {
  const limiters: RateLimiter[] = []

  function createLimiter(opts: { maxAttempts: number; windowMs: number }): RateLimiter {
    const limiter = new RateLimiter({ ...opts, cleanupIntervalMs: 60_000 })
    limiters.push(limiter)
    return limiter
  }

  afterEach(() => {
    for (const l of limiters) l.dispose()
    limiters.length = 0
  })

  it('allows requests within the limit', () => {
    const limiter = createLimiter({ maxAttempts: 3, windowMs: 60_000 })
    const r1 = limiter.check('user1')
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = limiter.check('user1')
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)
  })

  it('blocks requests exceeding the limit', () => {
    const limiter = createLimiter({ maxAttempts: 2, windowMs: 60_000 })
    limiter.check('user1')
    limiter.check('user1')

    const r3 = limiter.check('user1')
    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
  })

  it('tracks keys independently', () => {
    const limiter = createLimiter({ maxAttempts: 1, windowMs: 60_000 })
    const r1 = limiter.check('user1')
    expect(r1.allowed).toBe(true)

    const r2 = limiter.check('user2')
    expect(r2.allowed).toBe(true)

    const r3 = limiter.check('user1')
    expect(r3.allowed).toBe(false)
  })

  it('resets all tracked attempts', () => {
    const limiter = createLimiter({ maxAttempts: 1, windowMs: 60_000 })
    limiter.check('user1')
    expect(limiter.check('user1').allowed).toBe(false)

    limiter.reset()
    expect(limiter.check('user1').allowed).toBe(true)
  })

  it('returns positive resetMs', () => {
    const limiter = createLimiter({ maxAttempts: 5, windowMs: 60_000 })
    const result = limiter.check('user1')
    expect(result.resetMs).toBeGreaterThan(0)
    expect(result.resetMs).toBeLessThanOrEqual(60_000)
  })
})
