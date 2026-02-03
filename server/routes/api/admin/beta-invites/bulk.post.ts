import { createBetaInvite } from '~~/server/utils/beta'
import { sendBetaInviteEmail } from '~~/server/utils/email'

interface BulkCreateBody {
  emails: string[]
  grantedPlan?: 'free' | 'pro' | 'business'
  isFounder?: boolean
  expiresInDays?: number
  sendEmails?: boolean
}

/**
 * POST /api/admin/beta-invites/bulk
 * Bulk creates beta invites from a list of emails.
 *
 * Body:
 * - emails: string[] (required, list of email addresses)
 * - grantedPlan: 'free' | 'pro' | 'business' (default: 'pro')
 * - isFounder: boolean (default: false)
 * - expiresInDays: number (default: 30)
 * - sendEmails: boolean (default: true)
 *
 * Requires admin authentication.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<BulkCreateBody>(event)

  if (!body?.emails || !Array.isArray(body.emails) || body.emails.length === 0) {
    throw createError({ statusCode: 400, message: 'Emails array is required' })
  }

  if (body.emails.length > 100) {
    throw createError({ statusCode: 400, message: 'Maximum 100 emails per bulk request' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const validEmails = body.emails
    .map(e => e.trim().toLowerCase())
    .filter(e => emailRegex.test(e))
    .filter((e, i, arr) => arr.indexOf(e) === i) // Remove duplicates

  if (validEmails.length === 0) {
    throw createError({ statusCode: 400, message: 'No valid email addresses provided' })
  }

  const results = {
    created: [] as Array<{ email: string; token: string; registrationUrl: string }>,
    failed: [] as Array<{ email: string; error: string }>,
    emailsSent: 0,
    emailsFailed: 0
  }

  const baseUrl = getRequestURL(event).origin

  for (const email of validEmails) {
    try {
      const invite = await createBetaInvite({
        email,
        grantedPlan: body.grantedPlan,
        isFounder: body.isFounder,
        expiresInDays: body.expiresInDays,
        source: 'manual'
      })

      results.created.push({
        email: invite.email,
        token: invite.token,
        registrationUrl: `${baseUrl}/register?token=${invite.token}`
      })

      // Send email unless explicitly disabled
      if (body.sendEmails !== false) {
        try {
          await sendBetaInviteEmail({
            to: email,
            token: invite.token,
            expiresAt: invite.expiresAt,
            isFounder: invite.isFounder
          })
          results.emailsSent++
        } catch {
          results.emailsFailed++
        }
      }
    } catch (error) {
      results.failed.push({
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const user = event.context.user as { id: string; email: string }
  await recordAuditLog(event, 'beta.bulk_invites_created', {
    userId: user.id,
    details: {
      totalEmails: validEmails.length,
      created: results.created.length,
      failed: results.failed.length,
      grantedPlan: body.grantedPlan || 'pro',
      isFounder: body.isFounder || false
    }
  })

  return {
    success: true,
    data: results
  }
})
