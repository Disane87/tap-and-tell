/**
 * GET /api/admin/entries
 * Returns all guest entries. Requires admin authentication.
 */
export default defineEventHandler((event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (!validateAuthHeader(authHeader ?? null)) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const entries = readEntries()

  return {
    success: true,
    data: entries
  }
})
