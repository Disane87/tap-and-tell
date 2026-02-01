/**
 * GET /api/admin/entries
 * Returns all guest entries. Requires admin authentication.
 */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (!validateAuthHeader(authHeader ?? null)) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const tenantId = await getDefaultTenantId()
  if (!tenantId) {
    throw createError({ statusCode: 500, message: 'No default tenant configured' })
  }

  const entries = await readEntries(tenantId)

  return {
    success: true,
    data: entries
  }
})
