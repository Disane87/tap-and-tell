import type { CreateGuestEntryInput } from '~~/server/types/guest'

/**
 * POST /api/t/:uuid/g/:gbUuid/entries
 * Creates a new entry for a guestbook.
 * No authentication required (guest submission).
 */
export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  const gbUuid = getRouterParam(event, 'gbUuid')
  if (!uuid || !gbUuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID and Guestbook ID are required' })
  }

  const guestbook = getGuestbookById(gbUuid)
  if (!guestbook || guestbook.tenantId !== uuid) {
    throw createError({ statusCode: 404, message: 'Guestbook not found' })
  }

  const body = await readBody<CreateGuestEntryInput>(event)

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Name is required' })
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Message is required' })
  }

  if (body.name.length > 100) {
    throw createError({ statusCode: 400, message: 'Name must be 100 characters or less' })
  }

  if (body.message.length > 1000) {
    throw createError({ statusCode: 400, message: 'Message must be 1000 characters or less' })
  }

  if (body.photo && body.photo.length > 7_000_000) {
    throw createError({ statusCode: 400, message: 'Photo must be 5MB or less' })
  }

  const entry = createEntry(
    gbUuid,
    body.name.trim(),
    body.message.trim(),
    body.photo,
    body.answers
  )

  return {
    success: true,
    data: entry
  }
})
