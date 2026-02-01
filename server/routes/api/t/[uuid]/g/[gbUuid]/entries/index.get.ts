/**
 * GET /api/t/:uuid/g/:gbUuid/entries
 * Returns approved entries for a guestbook's public view.
 * No authentication required.
 */
export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  const gbUuid = getRouterParam(event, 'gbUuid')
  if (!uuid || !gbUuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID and Guestbook ID are required' })
  }

  const guestbook = await getGuestbookById(gbUuid)
  if (!guestbook || guestbook.tenantId !== uuid) {
    throw createError({ statusCode: 404, message: 'Guestbook not found' })
  }

  const guestbookEntries = await readApprovedEntries(uuid, gbUuid)

  return {
    success: true,
    data: guestbookEntries
  }
})
