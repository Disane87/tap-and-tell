import { eq, and, sql } from 'drizzle-orm'
import { guestbooks, tenants, entries } from '~~/server/database/schema'
import type { GuestbookSettings, GuestbookType } from '~~/server/types/guestbook'

/**
 * Retrieves a guestbook by ID.
 *
 * @param id - The guestbook UUID.
 * @returns The guestbook row or undefined.
 */
export async function getGuestbookById(id: string) {
  const db = useDrizzle()
  const rows = await db.select().from(guestbooks).where(eq(guestbooks.id, id))
  return rows[0]
}

/**
 * Retrieves all guestbooks for a tenant with entry counts.
 *
 * @param tenantId - The tenant UUID.
 * @returns Array of guestbooks with entry counts.
 */
export async function getGuestbooksByTenant(tenantId: string) {
  const db = useDrizzle()
  return db.select({
    id: guestbooks.id,
    tenantId: guestbooks.tenantId,
    name: guestbooks.name,
    type: guestbooks.type,
    settings: guestbooks.settings,
    startDate: guestbooks.startDate,
    endDate: guestbooks.endDate,
    createdAt: guestbooks.createdAt,
    updatedAt: guestbooks.updatedAt,
    entryCount: sql<number>`(SELECT COUNT(*) FROM entries WHERE entries.guestbook_id = ${guestbooks.id})`
  })
    .from(guestbooks)
    .where(eq(guestbooks.tenantId, tenantId))
}

/**
 * Creates a new guestbook for a tenant.
 *
 * @param tenantId - The tenant UUID.
 * @param input - Guestbook creation data.
 * @returns The created guestbook.
 */
export async function createGuestbook(tenantId: string, input: {
  name: string
  type?: GuestbookType
  settings?: GuestbookSettings
  startDate?: string
  endDate?: string
}) {
  const db = useDrizzle()
  const id = generateId()
  const now = new Date()

  await db.insert(guestbooks).values({
    id,
    tenantId,
    name: input.name,
    type: input.type || 'permanent',
    settings: input.settings || {},
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
    createdAt: now,
    updatedAt: now
  })

  return {
    id,
    tenantId,
    name: input.name,
    type: input.type || 'permanent',
    settings: input.settings || {},
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    entryCount: 0
  }
}

/**
 * Updates an existing guestbook.
 *
 * @param id - The guestbook UUID.
 * @param input - Update data.
 * @returns The updated guestbook or undefined.
 */
export async function updateGuestbook(id: string, input: {
  name?: string
  type?: GuestbookType
  settings?: GuestbookSettings
  startDate?: string
  endDate?: string
}) {
  const db = useDrizzle()
  const rows = await db.select().from(guestbooks).where(eq(guestbooks.id, id))
  const existing = rows[0]
  if (!existing) return undefined

  const updates: Record<string, unknown> = {
    updatedAt: new Date()
  }

  if (input.name !== undefined) updates.name = input.name
  if (input.type !== undefined) updates.type = input.type
  if (input.settings !== undefined) updates.settings = input.settings
  if (input.startDate !== undefined) updates.startDate = input.startDate ? new Date(input.startDate) : null
  if (input.endDate !== undefined) updates.endDate = input.endDate ? new Date(input.endDate) : null

  await db.update(guestbooks).set(updates).where(eq(guestbooks.id, id))

  const updated = await db.select().from(guestbooks).where(eq(guestbooks.id, id))
  return updated[0]
}

/**
 * Deletes a guestbook and all its entries (via CASCADE).
 *
 * @param id - The guestbook UUID.
 * @returns True if the guestbook was deleted.
 */
export async function deleteGuestbook(id: string): Promise<boolean> {
  const db = useDrizzle()
  await db.delete(guestbooks).where(eq(guestbooks.id, id))
  return true
}

/**
 * Retrieves a guestbook along with its tenant information.
 * Used for auth checks to verify the guestbook belongs to the expected tenant.
 *
 * @param guestbookId - The guestbook UUID.
 * @returns The guestbook with tenant info or undefined.
 */
export async function getGuestbookWithTenant(guestbookId: string) {
  const db = useDrizzle()
  const rows = await db.select({
    id: guestbooks.id,
    tenantId: guestbooks.tenantId,
    name: guestbooks.name,
    type: guestbooks.type,
    settings: guestbooks.settings,
    startDate: guestbooks.startDate,
    endDate: guestbooks.endDate,
    createdAt: guestbooks.createdAt,
    updatedAt: guestbooks.updatedAt,
    tenantName: tenants.name,
    tenantOwnerId: tenants.ownerId
  })
    .from(guestbooks)
    .innerJoin(tenants, eq(guestbooks.tenantId, tenants.id))
    .where(eq(guestbooks.id, guestbookId))
  return rows[0]
}
