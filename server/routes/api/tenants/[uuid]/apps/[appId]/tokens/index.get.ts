import { eq } from 'drizzle-orm'
import { apiTokens, apiApps } from '~~/server/database/schema'

/**
 * GET /api/tenants/:uuid/apps/:appId/tokens
 * Lists all tokens for an app (metadata only, never shows secrets).
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Authentication required' })

  const uuid = getRouterParam(event, 'uuid')
  const appId = getRouterParam(event, 'appId')
  if (!uuid || !appId) throw createError({ statusCode: 400, message: 'Tenant ID and App ID required' })

  if (!await canPerformAction(uuid, user.id, 'read'))
    throw createError({ statusCode: 403, message: 'Forbidden' })

  const tokens = await withTenantContext(uuid, async (db) => {
    return db.select({
      id: apiTokens.id,
      name: apiTokens.name,
      tokenPrefix: apiTokens.tokenPrefix,
      scopes: apiTokens.scopes,
      expiresAt: apiTokens.expiresAt,
      lastUsedAt: apiTokens.lastUsedAt,
      revokedAt: apiTokens.revokedAt,
      createdAt: apiTokens.createdAt
    })
      .from(apiTokens)
      .innerJoin(apiApps, eq(apiTokens.appId, apiApps.id))
      .where(eq(apiTokens.appId, appId))
  })

  return { success: true, data: tokens }
})
