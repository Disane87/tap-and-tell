import type { UpdateGuestbookInput } from '~~/server/types/guestbook'

/**
 * PUT /api/tenants/:uuid/guestbooks/:gbUuid
 * Updates a guestbook. Requires owner permission.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const uuid = getRouterParam(event, 'uuid')
  const gbUuid = getRouterParam(event, 'gbUuid')
  if (!uuid || !gbUuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID and Guestbook ID are required' })
  }

  if (!await canPerformAction(uuid, user.id, 'manage')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const existing = await getGuestbookById(gbUuid)
  if (!existing || existing.tenantId !== uuid) {
    throw createError({ statusCode: 404, message: 'Guestbook not found' })
  }

  const body = await readBody<UpdateGuestbookInput>(event)

  if (body?.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
    throw createError({ statusCode: 400, message: 'Guestbook name cannot be empty' })
  }

  const updated = await updateGuestbook(gbUuid, {
    name: body?.name?.trim(),
    type: body?.type,
    settings: body?.settings,
    startDate: body?.startDate,
    endDate: body?.endDate
  })

  return {
    success: true,
    data: updated
  }
})
