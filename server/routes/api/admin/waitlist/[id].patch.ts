import { eq } from 'drizzle-orm'
import { waitlist } from '~~/server/database/schema'
import type { WaitlistStatus } from '~~/server/database/schema'

interface UpdateWaitlistBody {
  priority?: number
  status?: WaitlistStatus
}

/**
 * PATCH /api/admin/waitlist/[id]
 * Updates a waitlist entry (priority boost, status change).
 *
 * Body:
 * - priority: number (optional, set new priority score)
 * - status: 'waiting' | 'invited' | 'registered' | 'unsubscribed' (optional)
 *
 * Requires admin authentication.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Waitlist entry ID is required' })
  }

  const body = await readBody<UpdateWaitlistBody>(event)

  if (body.priority === undefined && body.status === undefined) {
    throw createError({ statusCode: 400, message: 'At least one field to update is required' })
  }

  const db = useDrizzle()

  // Check entry exists
  const existing = await db
    .select()
    .from(waitlist)
    .where(eq(waitlist.id, id))
    .limit(1)

  if (!existing[0]) {
    throw createError({ statusCode: 404, message: 'Waitlist entry not found' })
  }

  // Build update object
  const updates: Partial<typeof waitlist.$inferInsert> = {}

  if (body.priority !== undefined) {
    updates.priority = body.priority
  }

  if (body.status !== undefined) {
    const validStatuses: WaitlistStatus[] = ['waiting', 'invited', 'registered', 'unsubscribed']
    if (!validStatuses.includes(body.status)) {
      throw createError({ statusCode: 400, message: 'Invalid status value' })
    }
    updates.status = body.status

    // Set timestamps based on status
    if (body.status === 'invited') {
      updates.invitedAt = new Date()
    } else if (body.status === 'registered') {
      updates.registeredAt = new Date()
    }
  }

  await db
    .update(waitlist)
    .set(updates)
    .where(eq(waitlist.id, id))

  // Fetch updated entry
  const updated = await db
    .select()
    .from(waitlist)
    .where(eq(waitlist.id, id))
    .limit(1)

  const user = event.context.user as { id: string; email: string }
  await recordAuditLog(event, 'beta.waitlist_updated', {
    userId: user.id,
    details: { waitlistId: id, updates }
  })

  return {
    success: true,
    data: updated[0]
  }
})
