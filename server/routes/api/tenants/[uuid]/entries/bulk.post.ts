import type { EntryStatus } from '~~/server/types/guest'

/**
 * POST /api/tenants/:uuid/entries/bulk
 * Bulk updates the moderation status of multiple entries.
 * Requires authentication and tenant ownership.
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

  if (!verifyTenantOwnership(uuid, user.id)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readBody<{ ids: string[]; status: EntryStatus }>(event)
  if (!body?.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, message: 'Entry IDs required' })
  }

  if (!body?.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
    throw createError({ statusCode: 400, message: 'Invalid status' })
  }

  const updated = bulkUpdateEntryStatus(body.ids, body.status)

  return {
    success: true,
    data: { updated }
  }
})
