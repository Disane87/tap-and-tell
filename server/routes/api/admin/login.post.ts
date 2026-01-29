import { createHmac, randomBytes } from 'crypto'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'tap-and-tell-secret'

function generateToken(): string {
  const timestamp = Date.now().toString()
  const random = randomBytes(16).toString('hex')
  const data = `${timestamp}:${random}`
  const signature = createHmac('sha256', TOKEN_SECRET).update(data).digest('hex')
  return Buffer.from(`${data}:${signature}`).toString('base64')
}

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

export default defineEventHandler(async (event) => {
  const body = await readBody<{ password: string }>(event)

  if (!body.password) {
    throw createError({
      statusCode: 400,
      message: 'Password is required'
    })
  }

  if (body.password !== ADMIN_PASSWORD) {
    return {
      success: false,
      error: 'Invalid password'
    }
  }

  const token = generateToken()

  return {
    success: true,
    token
  }
})
