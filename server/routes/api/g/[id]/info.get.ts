/**
 * GET /api/g/:id/info
 * Public endpoint — fetches guestbook metadata by ID.
 */
import { defineEventHandler, getRouterParam } from 'h3'
import { resolveGuestbook } from '~~/server/utils/guestbook-resolver'

export default defineEventHandler(async (event) => {
  const guestbookId = getRouterParam(event, 'id')

  if (!guestbookId) {
    return { success: false, error: 'Guestbook ID is required' }
  }

  try {
    const guestbook = await resolveGuestbook(guestbookId)

    if (!guestbook) {
      return { success: false, error: 'Guestbook not found' }
    }

    return {
      success: true,
      data: {
        id: guestbook.id,
        tenantId: guestbook.tenantId,
        name: guestbook.name,
        type: guestbook.type,
        settings: guestbook.settings || {}
      }
    }
  } catch (error) {
    console.error('Failed to fetch guestbook info:', error)
    return { success: false, error: 'Failed to fetch guestbook info' }
  }
})
