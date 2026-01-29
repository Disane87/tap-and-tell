import { deleteEntry } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Entry ID is required'
    })
  }

  try {
    const deleted = await deleteEntry(id)

    if (!deleted) {
      throw createError({
        statusCode: 404,
        message: 'Guest entry not found'
      })
    }

    return {
      success: true,
      message: 'Entry deleted successfully'
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Failed to delete entry:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete guest entry'
    })
  }
})
