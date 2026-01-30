import type { CreateGuestEntryInput } from '~~/server/types/guest'

/**
 * POST /api/entries
 * Creates a new guest entry with name, message, optional photo, and optional answers.
 * Uses the default tenant for backward compatibility.
 */
export default defineEventHandler(async (event) => {
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

  // Validate photo size (5MB limit for base64)
  if (body.photo && body.photo.length > 7_000_000) {
    throw createError({
      statusCode: 400,
      message: 'Photo must be 5MB or less'
    })
  }

  const tenantId = getDefaultTenantId()
  if (!tenantId) {
    throw createError({
      statusCode: 500,
      message: 'No default tenant configured'
    })
  }

  const entry = createEntry(
    tenantId,
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
