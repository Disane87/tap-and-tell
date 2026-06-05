/**
 * GET /api/g/:id/info
 * Public endpoint — fetches guestbook metadata by ID.
 */
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { resolveGuestbook } from '~~/server/utils/guestbook-resolver'

export default defineEventHandler(async (event) => {
  const guestbookId = getRouterParam(event, 'id')

  if (!guestbookId) {
    throw createError({ statusCode: 400, statusMessage: 'Guestbook ID is required' })
  }

  const guestbook = await resolveGuestbook(guestbookId)

  if (!guestbook) {
    throw createError({ statusCode: 404, statusMessage: 'Guestbook not found' })
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
})
