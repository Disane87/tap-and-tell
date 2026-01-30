import type { CreateGuestEntryInput } from '~~/server/types/guest'

/**
 * POST /api/t/:uuid/entries
 * Creates a new entry for a tenant's guestbook.
 * No authentication required (guest submission).
 */
export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID is required' })
  }

  const tenant = getTenantById(uuid)
  if (!tenant) {
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
    uuid,
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
