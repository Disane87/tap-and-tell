import { createHmac } from 'crypto'
import type { H3Event } from 'h3'

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'tap-and-tell-secret'

export function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [timestamp, random, signature] = decoded.split(':')

    if (!timestamp || !random || !signature) {
      return false
    }

    const expectedSignature = createHmac('sha256', TOKEN_SECRET)
      .update(`${timestamp}:${random}`)
      .digest('hex')

    if (signature !== expectedSignature) {
      return false
    }

    // Token expires after 24 hours
    const tokenTime = parseInt(timestamp, 10)
    const now = Date.now()
    const twentyFourHours = 24 * 60 * 60 * 1000

    return now - tokenTime < twentyFourHours
  } catch {
    return false
  }
}

export function requireAuth(event: H3Event): void {
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const token = authHeader.slice(7)

  if (!verifyToken(token)) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token'
    })
  }
}
