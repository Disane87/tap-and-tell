import type { CreateGuestEntryInput } from '~~/server/types/guest'

/**
 * POST /api/entries
 * Creates a new guest entry with name, message, optional photo, and optional answers.
 * Uses the default tenant for backward compatibility.
 */
export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  const rateCheck = entryLimiter.check(ip)
  if (!rateCheck.allowed) {
    throw createError({ statusCode: 429, message: 'Too many submissions. Please try again later.' })
  }

  const body = await readBody<CreateGuestEntryInput>(event)

  // Validate required fields
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Name is required'
    })
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Message is required'
    })
  }

  // Validate length limits
  if (body.name.length > 100) {
    throw createError({
      statusCode: 400,
      message: 'Name must be 100 characters or less'
    })
  }

  if (body.message.length > 1000) {
    throw createError({
      statusCode: 400,
      message: 'Message must be 1000 characters or less'
    })
  }

  // Resolve media inputs: prefer the new `media` array, fall back to the
  // legacy single `photo` field for backwards compatibility.
  const mediaInputs = Array.isArray(body.media) && body.media.length > 0
    ? body.media
    : (body.photo ? [body.photo] : [])

  if (mediaInputs.some(item => typeof item !== 'string')) {
    throw createError({ statusCode: 400, message: 'Invalid media payload' })
  }

  const tenantId = await getDefaultTenantId()
  if (!tenantId) {
    throw createError({
      statusCode: 500,
      message: 'No default tenant configured'
    })
  }

  // Get the first guestbook for the default tenant
  const guestbookList = await getGuestbooksByTenant(tenantId)
  const guestbook = guestbookList[0]
  if (!guestbook) {
    throw createError({
      statusCode: 500,
      message: 'No guestbook configured for default tenant'
    })
  }

  const sanitized = sanitizeEntryInput({ name: body.name, message: body.message, answers: body.answers })

  let entry
  try {
    entry = await createEntry(
      tenantId,
      guestbook.id,
      sanitized.name.trim(),
      sanitized.message.trim(),
      mediaInputs,
      sanitized.answers,
      guestbook.settings?.moderationEnabled ?? false
    )
  }
  catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Invalid media'
    })
  }

  return {
    success: true,
    data: entry
  }
})
