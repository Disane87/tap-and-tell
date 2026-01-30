/**
 * DELETE /api/entries/:id
 * Deletes a guest entry by ID.
 * NOTE: This endpoint is currently unprotected. Use /api/admin/entries/:id for authenticated deletion.
 */
export default defineEventHandler((event) => {
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
