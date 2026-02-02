/**
 * GET /api/g/:id/entries
 * Returns approved entries for a guestbook's public view.
 * No authentication required.
 */
export default defineEventHandler(async (event) => {
  const guestbookId = getRouterParam(event, 'id')

  if (!guestbookId) {
    throw createError({ statusCode: 400, message: 'Guestbook ID is required' })
  }

  const guestbook = await getGuestbookById(guestbookId)
  if (!guestbook) {
    throw createError({ statusCode: 404, message: 'Guestbook not found' })
  }

  const guestbookEntries = await readApprovedEntries(guestbook.tenantId, guestbookId)

  return {
    success: true,
    data: guestbookEntries
  }
})
