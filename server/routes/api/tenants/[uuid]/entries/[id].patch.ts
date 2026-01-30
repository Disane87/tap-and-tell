import type { EntryStatus } from '~~/server/types/guest'

/**
 * PATCH /api/tenants/:uuid/entries/:id
 * Updates the moderation status of an entry.
 * Requires authentication and tenant ownership.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const uuid = getRouterParam(event, 'uuid')
  const id = getRouterParam(event, 'id')

  if (!uuid || !id) {
    throw createError({ statusCode: 400, message: 'Tenant ID and entry ID are required' })
  }

  if (!verifyTenantOwnership(uuid, user.id)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody<{ status: EntryStatus; rejectionReason?: string }>(event)
  if (!body?.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
    throw createError({ statusCode: 400, message: 'Invalid status' })
  }

  const entry = updateEntryStatus(id, body.status, body.rejectionReason)
  if (!entry) {
    throw createError({ statusCode: 404, message: 'Entry not found' })
  }

  return {
    success: true,
    data: entry
  }
})
