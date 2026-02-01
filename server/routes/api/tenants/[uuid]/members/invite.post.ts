import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { tenantInvites, tenants } from '~~/server/database/schema'
import { canPerformAction } from '~~/server/utils/tenant'

/**
 * POST /api/tenants/:uuid/members/invite
 * Creates an invitation for a user to join a tenant as co_owner.
 * Requires authentication and manage permission (owner only).
 *
 * @body { email: string } - Email of the user to invite.
 * @returns The created invite object with a unique token.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  if (!await canPerformAction(uuid, user.id, 'manage')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody<{ email: string }>(event)
  if (!body?.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    throw createError({ statusCode: 400, message: 'Valid email is required' })
  }

  const db = useDb()

  // Check tenant exists
  const tenantRows = await db.select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.id, uuid))

  const tenant = tenantRows[0]

  if (!tenant) {
    throw createError({ statusCode: 404, message: 'Tenant not found' })
  }

  const id = generateId()
  const token = generateId()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db.insert(tenantInvites).values({
    id,
    tenantId: uuid,
    email: body.email.trim().toLowerCase(),
    role: 'co_owner',
    invitedBy: user.id,
    token,
    expiresAt,
    createdAt: now
  })

  await recordAuditLog(event, 'member.add', { tenantId: uuid, resourceType: 'invite', resourceId: id, details: { email: body.email.trim().toLowerCase() } })

  return {
    success: true,
    data: {
      id,
      tenantId: uuid,
      email: body.email.trim().toLowerCase(),
      role: 'co_owner',
      token,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString()
    }
  }
})
