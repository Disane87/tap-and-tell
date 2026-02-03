import { createBetaInvite } from '~~/server/utils/beta'
import { sendBetaInviteEmail } from '~~/server/utils/email'

interface CreateInviteBody {
  email: string
  grantedPlan?: 'free' | 'pro' | 'business'
  isFounder?: boolean
  note?: string
  expiresInDays?: number
  sendEmail?: boolean
}

/**
 * POST /api/admin/beta-invites
 * Creates a new beta invite.
 *
 * Body:
 * - email: string (required)
 * - grantedPlan: 'free' | 'pro' | 'business' (default: 'pro')
 * - isFounder: boolean (default: false)
 * - note: string (optional, internal note)
 * - expiresInDays: number (default: 30)
 * - sendEmail: boolean (default: true, sends invite email)
 *
 * Requires admin authentication.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<CreateInviteBody>(event)

  if (!body?.email) {
    throw createError({ statusCode: 400, message: 'Email is required' })
  }

  const email = body.email.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email format' })
  }

  const invite = await createBetaInvite({
    email,
    grantedPlan: body.grantedPlan,
    isFounder: body.isFounder,
    note: body.note,
    expiresInDays: body.expiresInDays,
    source: 'manual'
  })

  // Send invite email unless explicitly disabled
  if (body.sendEmail !== false) {
    try {
      await sendBetaInviteEmail({
        to: email,
        token: invite.token,
        expiresAt: invite.expiresAt,
        isFounder: invite.isFounder
      })
    } catch (error) {
      console.error('Failed to send beta invite email:', error)
      // Don't fail the request if email fails - invite is still created
    }
  }

  const user = event.context.user as { id: string; email: string }
  await recordAuditLog(event, 'beta.invite_created', {
    userId: user.id,
    details: {
      inviteId: invite.id,
      email: invite.email,
      grantedPlan: invite.grantedPlan,
      isFounder: invite.isFounder
    }
  })

  return {
    success: true,
    data: {
      ...invite,
      // Include token in response for admin to share manually if needed
      registrationUrl: `${getRequestURL(event).origin}/register?token=${invite.token}`
    }
  }
})
