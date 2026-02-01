import type { H3Event } from 'h3'
import { useDb } from '~~/server/database'
import { auditLogs } from '~~/server/database/schema'

/** Audit action types for type safety. */
export type AuditAction =
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.2fa_setup'
  | 'auth.2fa_verify'
  | 'auth.2fa_disable'
  | 'auth.password_change'
  | 'entry.create'
  | 'entry.delete'
  | 'entry.update_status'
  | 'entry.bulk_update'
  | 'tenant.create'
  | 'tenant.update'
  | 'tenant.delete'
  | 'guestbook.create'
  | 'guestbook.update'
  | 'guestbook.delete'
  | 'member.add'
  | 'member.remove'
  | 'key.rotate'

/**
 * Records an audit log entry.
 * Uses the non-RLS db since audit logs may be written without tenant context.
 *
 * @param event - The H3 event (for extracting IP and user agent).
 * @param action - The action being performed.
 * @param options - Additional audit log fields.
 */
export async function recordAuditLog(
  event: H3Event,
  action: AuditAction,
  options: {
    tenantId?: string
    userId?: string
    resourceType?: string
    resourceId?: string
    details?: Record<string, unknown>
  } = {}
): Promise<void> {
  try {
    const db = useDb()
    const ip = getRequestIP(event, { xForwardedFor: true }) || null
    const userAgent = getRequestHeader(event, 'user-agent') || null

    await db.insert(auditLogs).values({
      id: generateId(),
      tenantId: options.tenantId || null,
      userId: options.userId || event.context.user?.id || null,
      action,
      resourceType: options.resourceType || null,
      resourceId: options.resourceId || null,
      details: options.details || null,
      ipAddress: ip,
      userAgent: userAgent
    })
  } catch (error) {
    // Audit logging should never break the main request
    console.error('[audit] Failed to record audit log:', error)
  }
}
