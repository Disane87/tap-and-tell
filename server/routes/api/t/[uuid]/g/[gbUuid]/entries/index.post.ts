import type { CreateGuestEntryInput } from '~~/server/types/guest'
import { MAX_PHOTO_SIZE, formatSize, estimateDecodedSize } from '~~/server/utils/image-config'

/**
 * POST /api/t/:uuid/g/:gbUuid/entries
 * Creates a new entry for a guestbook.
 * No authentication required (guest submission).
 *
 * Photo size limit configurable via IMAGE_MAX_PHOTO_SIZE env variable.
 */
export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  const rateCheck = entryLimiter.check(ip)
  if (!rateCheck.allowed) {
    throw createError({ statusCode: 429, message: 'Too many submissions. Please try again later.' })
  }

  const uuid = getRouterParam(event, 'uuid')
  const gbUuid = getRouterParam(event, 'gbUuid')
  if (!uuid || !gbUuid) {
    throw createError({ statusCode: 400, message: 'Tenant ID and Guestbook ID are required' })
  }

  const guestbook = await getGuestbookById(gbUuid)
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

  if (body.photo && body.photo.length > MAX_PHOTO_SIZE) {
    const maxDecoded = formatSize(estimateDecodedSize(MAX_PHOTO_SIZE))
    throw createError({ statusCode: 400, message: `Photo must be ${maxDecoded} or less` })
  }

  if (body.photo && !validatePhotoMimeType(body.photo)) {
    throw createError({ statusCode: 400, message: 'Invalid photo format' })
  }

  const sanitized = sanitizeEntryInput({ name: body.name, message: body.message, answers: body.answers })

  const entry = await createEntry(
    uuid,
    gbUuid,
    sanitized.name.trim(),
    sanitized.message.trim(),
    body.photo,
    sanitized.answers
  )

  return {
    success: true,
    data: entry
  }
})
