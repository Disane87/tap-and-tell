/**
 * DELETE /api/admin/entries/:id
 * Deletes a guest entry by ID. Requires admin authentication.
 */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (!validateAuthHeader(authHeader ?? null)) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

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

  const deleted = await deleteEntry(tenantId, id)

  if (!deleted) {
    throw createError({
      statusCode: 404,
      message: 'Entry not found'
    })
  }

  return {
    success: true
  }
})
