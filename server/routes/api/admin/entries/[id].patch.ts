/**
 * PATCH /api/admin/entries/:id
 * Updates the moderation status of an entry.
 * Requires admin authentication.
 */
import type { EntryStatus } from '~~/server/types/guest'

export default defineEventHandler(async (event) => {
  // Verify admin token
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const token = authHeader.slice(7)
  if (!verifyToken(token)) {
    throw createError({ statusCode: 401, message: 'Invalid or expired token' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Entry ID required' })
  }

  const body = await readBody<{ status: EntryStatus; rejectionReason?: string }>(event)
  if (!body?.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
    throw createError({ statusCode: 400, message: 'Invalid status' })
  }

  const tenantId = await getDefaultTenantId()
  if (!tenantId) {
    throw createError({ statusCode: 500, message: 'No default tenant configured' })
  }

  const entry = await updateEntryStatus(tenantId, id, body.status, body.rejectionReason)
  if (!entry) {
    throw createError({ statusCode: 404, message: 'Entry not found' })
  }

  return {
    success: true,
    data: entry
  }
})
