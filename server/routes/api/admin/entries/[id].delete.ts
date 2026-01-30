/**
 * DELETE /api/admin/entries/:id
 * Deletes a guest entry by ID. Requires admin authentication.
 */
export default defineEventHandler((event) => {
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

  const deleted = deleteEntry(id)

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
