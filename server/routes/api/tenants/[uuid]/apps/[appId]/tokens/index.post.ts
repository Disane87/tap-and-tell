import { apiTokens, apiApps } from '~~/server/database/schema'
import { eq } from 'drizzle-orm'

/**
 * POST /api/tenants/:uuid/apps/:appId/tokens
 * Creates a new API token for an app.
 * Returns the plaintext token ONCE — it cannot be retrieved again.
 * Body: { name: string, scopes: string[], expiresInDays?: number }
 */
export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Authentication required' })

  const uuid = getRouterParam(event, 'uuid')
  const appId = getRouterParam(event, 'appId')
  if (!uuid || !appId) throw createError({ statusCode: 400, message: 'Tenant ID and App ID required' })

  if (!await canPerformAction(uuid, user.id, 'manage'))
    throw createError({ statusCode: 403, message: 'Forbidden' })

  const body = await readBody<{ name: string; scopes: string[]; expiresInDays?: number }>(event)
  if (!body?.name?.trim()) throw createError({ statusCode: 400, message: 'Token name is required' })
  if (!Array.isArray(body.scopes) || body.scopes.length === 0)
    throw createError({ statusCode: 400, message: 'At least one scope is required' })
  if (!validateScopes(body.scopes))
    throw createError({ statusCode: 400, message: `Invalid scopes. Valid scopes: ${ALL_SCOPES.join(', ')}` })

  // Verify the app exists and belongs to this tenant
  const db = useDrizzle()
  const appRows = await db.select().from(apiApps).where(eq(apiApps.id, appId))
  const app = appRows[0]
  if (!app || app.tenantId !== uuid)
    throw createError({ statusCode: 404, message: 'App not found' })

  const { plaintext, hash, prefix } = generateApiToken()
  const id = generateId()
  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000)
    : null

  await db.insert(apiTokens).values({
    id,
    appId,
    name: body.name.trim(),
    tokenHash: hash,
    tokenPrefix: prefix,
    scopes: body.scopes,
    expiresAt,
    createdAt: new Date()
  })

  await recordAuditLog(event, 'api_token.create', {
    tenantId: uuid,
    resourceType: 'api_token',
    resourceId: id,
    details: { appId, scopes: body.scopes, expiresInDays: body.expiresInDays || null }
  })

  return {
    success: true,
    data: {
      id,
      name: body.name.trim(),
      token: plaintext, // Shown ONCE — cannot be retrieved again
      prefix,
      scopes: body.scopes,
      expiresAt: expiresAt?.toISOString() || null
    }
  }
})
