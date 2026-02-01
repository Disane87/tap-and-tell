import { eq } from 'drizzle-orm'
import { apiTokens, apiApps } from '~~/server/database/schema'

/**
 * DELETE /api/tenants/:uuid/apps/:appId/tokens/:tokenId
 * Revokes an API token (soft delete by setting revoked_at).
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Authentication required' })

  const uuid = getRouterParam(event, 'uuid')
  const appId = getRouterParam(event, 'appId')
  const tokenId = getRouterParam(event, 'tokenId')
  if (!uuid || !appId || !tokenId) throw createError({ statusCode: 400, message: 'Missing required parameters' })

  if (!await canPerformAction(uuid, user.id, 'manage'))
    throw createError({ statusCode: 403, message: 'Forbidden' })

  await withTenantContext(uuid, async (db) => {
    await db.update(apiTokens)
      .set({ revokedAt: new Date() })
      .where(eq(apiTokens.id, tokenId))
  })

  await recordAuditLog(event, 'api_token.revoke', {
    tenantId: uuid,
    resourceType: 'api_token',
    resourceId: tokenId,
    details: { appId }
  })

  return { success: true }
})
