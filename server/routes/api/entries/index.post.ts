import { addEntry, savePhoto, generateId } from '../../../utils/storage'
import type { CreateGuestEntryInput, GuestEntry } from '../../../../app/types/guest'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CreateGuestEntryInput>(event)

    // Validate required fields
    if (!body.name?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Name is required'
      })
    }

    if (!body.message?.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Message is required'
      })
    }

    // Validate name length
    if (body.name.length > 100) {
      throw createError({
        statusCode: 400,
        message: 'Name must be 100 characters or less'
      })
    }

    // Validate message length
    if (body.message.length > 1000) {
      throw createError({
        statusCode: 400,
        message: 'Message must be 1000 characters or less'
      })
    }

    const entryId = generateId()
    let photoUrl: string | null = null

    // Save photo if provided
    if (body.photo) {
      try {
        photoUrl = await savePhoto(body.photo, entryId)
      } catch (error) {
        console.error('Failed to save photo:', error)
        // Continue without photo if save fails
      }
    }

    const entry: GuestEntry = {
      id: entryId,
      name: body.name.trim(),
      message: body.message.trim(),
      photoUrl,
      createdAt: new Date().toISOString()
    }

    const savedEntry = await addEntry(entry)

    return {
      success: true,
      data: savedEntry
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Failed to create entry:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create guest entry'
    })
  }
})
