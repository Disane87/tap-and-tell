import { getEntryById } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Entry ID is required'
    })
  }

  try {
    const entry = await getEntryById(id)

    if (!entry) {
      throw createError({
        statusCode: 404,
        message: 'Guest entry not found'
      })
    }

    return {
      success: true,
      data: entry
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Failed to get entry:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve guest entry'
    })
  }
})
