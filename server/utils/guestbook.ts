import { eq, and, sql } from 'drizzle-orm'
import { useDb } from '~~/server/database'
import { guestbooks, tenants, entries } from '~~/server/database/schema'
import type { GuestbookSettings, GuestbookType } from '~~/server/types/guestbook'

/**
 * Retrieves a guestbook by ID.
 *
 * @param id - The guestbook UUID.
 * @returns The guestbook row or undefined.
 */
export function getGuestbookById(id: string) {
  const db = useDb()
  return db.select().from(guestbooks).where(eq(guestbooks.id, id)).get()
}

/**
 * Retrieves all guestbooks for a tenant with entry counts.
 *
 * @param tenantId - The tenant UUID.
 * @returns Array of guestbooks with entry counts.
 */
export function getGuestbooksByTenant(tenantId: string) {
  const db = useDb()
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
    .all()
}

/**
 * Creates a new guestbook for a tenant.
 *
 * @param tenantId - The tenant UUID.
 * @param input - Guestbook creation data.
 * @returns The created guestbook.
 */
export function createGuestbook(tenantId: string, input: {
  name: string
  type?: GuestbookType
  settings?: GuestbookSettings
  startDate?: string
  endDate?: string
}) {
  const db = useDb()
  const id = generateId()
  const now = new Date().toISOString()

  db.insert(guestbooks).values({
    id,
    tenantId,
    name: input.name,
    type: input.type || 'permanent',
    settings: input.settings || {},
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    createdAt: now,
    updatedAt: now
  }).run()

  return {
    id,
    tenantId,
    name: input.name,
    type: input.type || 'permanent',
    settings: input.settings || {},
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: now,
    updatedAt: now,
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
export function updateGuestbook(id: string, input: {
  name?: string
  type?: GuestbookType
  settings?: GuestbookSettings
  startDate?: string
  endDate?: string
}) {
  const db = useDb()
  const existing = db.select().from(guestbooks).where(eq(guestbooks.id, id)).get()
  if (!existing) return undefined

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString()
  }

  if (input.name !== undefined) updates.name = input.name
  if (input.type !== undefined) updates.type = input.type
  if (input.settings !== undefined) updates.settings = input.settings
  if (input.startDate !== undefined) updates.startDate = input.startDate
  if (input.endDate !== undefined) updates.endDate = input.endDate

  db.update(guestbooks).set(updates).where(eq(guestbooks.id, id)).run()

  return db.select().from(guestbooks).where(eq(guestbooks.id, id)).get()
}

/**
 * Deletes a guestbook and all its entries (via CASCADE).
 *
 * @param id - The guestbook UUID.
 * @returns True if the guestbook was deleted.
 */
export function deleteGuestbook(id: string): boolean {
  const db = useDb()
  const result = db.delete(guestbooks).where(eq(guestbooks.id, id)).run()
  return result.changes > 0
}

/**
 * Retrieves a guestbook along with its tenant information.
 * Used for auth checks to verify the guestbook belongs to the expected tenant.
 *
 * @param guestbookId - The guestbook UUID.
 * @returns The guestbook with tenant info or undefined.
 */
export function getGuestbookWithTenant(guestbookId: string) {
  const db = useDb()
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
    tenantName: tenants.name,
    tenantOwnerId: tenants.ownerId
  })
    .from(guestbooks)
    .innerJoin(tenants, eq(guestbooks.tenantId, tenants.id))
    .where(eq(guestbooks.id, guestbookId))
    .get()
}
