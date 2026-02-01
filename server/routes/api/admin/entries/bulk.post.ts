/**
 * POST /api/admin/entries/bulk
 * Bulk updates the moderation status of multiple entries.
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

  const body = await readBody<{ ids: string[]; status: EntryStatus }>(event)
  if (!body?.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, message: 'Entry IDs required' })
  }

  if (!body?.status || !['pending', 'approved', 'rejected'].includes(body.status)) {
    throw createError({ statusCode: 400, message: 'Invalid status' })
  }

  const tenantId = await getDefaultTenantId()
  if (!tenantId) {
    throw createError({ statusCode: 500, message: 'No default tenant configured' })
  }

  const updated = await bulkUpdateEntryStatus(tenantId, body.ids, body.status)

  return {
    success: true,
    data: { updated }
  }
})
