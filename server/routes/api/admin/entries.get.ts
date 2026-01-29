import { requireAuth } from '../../../utils/auth'
import { getEntries } from '../../../utils/storage'

/** GET /api/admin/entries — Returns all entries with count (admin auth required). */
export default defineEventHandler(async (event) => {
  requireAuth(event)

  try {
    const entries = await getEntries()
    return {
      success: true,
      data: entries,
      count: entries.length
    }
  } catch (error) {
    console.error('Failed to get entries:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve entries'
    })
  }
})
