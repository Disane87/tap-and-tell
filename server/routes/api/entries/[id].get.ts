/**
 * GET /api/entries/:id
 * Returns a single guest entry by ID.
 */
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Entry ID is required'
    })
  }

  const entry = findEntryById(id)

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
