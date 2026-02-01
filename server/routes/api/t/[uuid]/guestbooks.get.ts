import { getGuestbooksByTenant } from '~~/server/utils/guestbook'

/**
 * Public route listing guestbooks for a tenant (id and name only).
 * Used for the tenant root redirect.
 *
 * GET /api/t/:uuid/guestbooks
 */
export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, statusMessage: 'Missing tenant UUID' })
  }

  const guestbooks = await getGuestbooksByTenant(uuid)

  return {
    success: true,
    data: guestbooks.map(gb => ({ id: gb.id, name: gb.name, type: gb.type }))
  }
})
