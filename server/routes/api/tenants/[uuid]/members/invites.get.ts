import { eq } from 'drizzle-orm'
import { tenantInvites, users } from '~~/server/database/schema'
import { canPerformAction } from '~~/server/utils/tenant'

/**
 * GET /api/tenants/:uuid/members/invites
 * Lists all invitations for a tenant with computed status.
 * Requires authentication and manage permission (owner only).
 *
 * @returns Array of invite objects with status: pending | accepted | expired | revoked
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  requireScope(event, 'members:read')

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  if (!await canPerformAction(uuid, user.id, 'manage')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const db = useDrizzle()
  const rows = await db.select({
    id: tenantInvites.id,
    email: tenantInvites.email,
    role: tenantInvites.role,
    expiresAt: tenantInvites.expiresAt,
    acceptedAt: tenantInvites.acceptedAt,
    revokedAt: tenantInvites.revokedAt,
    createdAt: tenantInvites.createdAt,
    inviterName: users.name
  })
    .from(tenantInvites)
    .leftJoin(users, eq(tenantInvites.invitedBy, users.id))
    .where(eq(tenantInvites.tenantId, uuid))

  const now = new Date()
  const invites = rows.map((row) => {
    let status: 'pending' | 'accepted' | 'expired' | 'revoked' = 'pending'
    if (row.acceptedAt) {
      status = 'accepted'
    } else if (row.revokedAt) {
      status = 'revoked'
    } else if (new Date(row.expiresAt) < now) {
      status = 'expired'
    }

    return {
      id: row.id,
      email: row.email,
      role: row.role,
      status,
      inviterName: row.inviterName || 'Unknown',
      expiresAt: row.expiresAt,
      acceptedAt: row.acceptedAt,
      createdAt: row.createdAt
    }
  })

  return {
    success: true,
    data: invites
  }
})
