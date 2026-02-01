import type { CreateGuestbookInput } from '~~/server/types/guestbook'

/**
 * POST /api/tenants/:uuid/guestbooks
 * Creates a new guestbook for the tenant.
 * Requires authentication and manage permission (owner only).
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

  const body = await readBody<CreateGuestbookInput>(event)

  if (!body?.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Guestbook name is required' })
  }

  if (body.name.length > 100) {
    throw createError({ statusCode: 400, message: 'Name must be 100 characters or less' })
  }

  const guestbook = await createGuestbook(uuid, {
    name: body.name.trim(),
    type: body.type,
    settings: body.settings,
    startDate: body.startDate,
    endDate: body.endDate
  })

  return {
    success: true,
    data: guestbook
  }
})
