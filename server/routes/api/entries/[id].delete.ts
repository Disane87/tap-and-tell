/**
 * DELETE /api/entries/:id
 * Deletes a guest entry by ID from the default tenant.
 * Requires an authenticated tenant member with moderate permission.
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }
  requireScope(event, 'entries:write')

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

  if (!await canPerformAction(tenantId, user.id, 'moderate')) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
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
