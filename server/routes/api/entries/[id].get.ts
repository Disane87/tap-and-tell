/**
 * GET /api/entries/:id
 * Returns a single guest entry by ID from the default tenant.
 * Public endpoint — only approved entries are returned to avoid leaking
 * pending or rejected entries.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Entry ID is required'
    })
  }

  const tenantId = await getDefaultTenantId()
  if (!tenantId) {
    throw createError({ statusCode: 500, message: 'No default tenant configured' })
  }

  const entry = await findEntryById(tenantId, id)

  // Only expose approved entries publicly; treat anything else as not found.
  if (!entry || entry.status !== 'approved') {
    throw createError({
      statusCode: 404,
      message: 'Entry not found'
    })
  }

  return {
    success: true,
    data: entry
  }
})
