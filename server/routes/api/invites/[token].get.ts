import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenantInvites, tenants } from '~~/server/database/schema'

/**
 * GET /api/invites/:token
 * Returns invite details for a given token. Public endpoint.
 * Used to display invite information before accepting.
 */
export default defineEventHandler((event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, message: 'Token is required' })
  }

  const db = useDb()
  const invite = db.select({
    id: tenantInvites.id,
    tenantId: tenantInvites.tenantId,
    email: tenantInvites.email,
    role: tenantInvites.role,
    expiresAt: tenantInvites.expiresAt,
    acceptedAt: tenantInvites.acceptedAt,
    createdAt: tenantInvites.createdAt,
    tenantName: tenants.name
  })
    .from(tenantInvites)
    .innerJoin(tenants, eq(tenantInvites.tenantId, tenants.id))
    .where(eq(tenantInvites.token, token))
    .get()

  if (!invite) {
    throw createError({ statusCode: 404, message: 'Invite not found' })
  }

  if (invite.acceptedAt) {
    throw createError({ statusCode: 410, message: 'Invite already accepted' })
  }

  if (new Date(invite.expiresAt) < new Date()) {
    throw createError({ statusCode: 410, message: 'Invite has expired' })
  }

  return {
    success: true,
    data: invite
  }
})
