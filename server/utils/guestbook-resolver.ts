/**
 * Guestbook resolver utility.
 * Resolves tenant information from a guestbook ID.
 */
import { useDrizzle } from './drizzle'
import { guestbooks } from '../database/schema'
import { eq } from 'drizzle-orm'

/**
 * Resolves the tenant ID from a guestbook ID.
 * @param guestbookId - The guestbook UUID
 * @returns The tenant ID or null if not found
 */
export async function resolveTenantFromGuestbook(guestbookId: string): Promise<string | null> {
  const db = useDrizzle()
  const result = await db
    .select({ tenantId: guestbooks.tenantId })
    .from(guestbooks)
    .where(eq(guestbooks.id, guestbookId))
    .limit(1)

  return result[0]?.tenantId ?? null
}

/**
 * Resolves full guestbook info including tenant ID.
 * @param guestbookId - The guestbook UUID
 * @returns Guestbook with tenant ID or null if not found
 */
export async function resolveGuestbook(guestbookId: string) {
  const db = useDrizzle()
  const result = await db
    .select()
    .from(guestbooks)
    .where(eq(guestbooks.id, guestbookId))
    .limit(1)

  return result[0] ?? null
}
