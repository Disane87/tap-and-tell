import { getEntries } from '../../../utils/storage'

export default defineEventHandler(async () => {
  try {
    const entries = await getEntries()
    return {
      success: true,
      data: entries
    }
  } catch (error) {
    console.error('Failed to get entries:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve guest entries'
    })
  }
})
