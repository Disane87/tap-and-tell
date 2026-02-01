/**
 * GET /api/entries
 * Returns only approved guest entries, newest first.
 * Entries without a status are treated as approved (backwards compatibility).
 */
export default defineEventHandler(async () => {
  const tenantId = await getDefaultTenantId()
  if (!tenantId) {
    throw createError({ statusCode: 500, message: 'No default tenant configured' })
  }

  const entries = await readApprovedEntries(tenantId)
  return {
    success: true,
    data: entries
  }
})
