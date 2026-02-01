/**
 * GET /api/entries/:id
 * Returns a single guest entry by ID.
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

  if (!entry) {
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
