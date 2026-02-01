import { pgTable, text, timestamp, uniqueIndex, index, jsonb, varchar } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import type { GuestbookSettings, GuestbookType } from '~~/server/types/guestbook'

/**
 * Users table for owner authentication.
 * Each user can own multiple tenants.
 * Not RLS-protected (no tenant_id). Filtered in application code.
 */
export const users = pgTable('users', {
  id: varchar('id', { length: 24 }).primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

/**
 * Sessions table for JWT-based authentication.
 * Stores active sessions with expiry timestamps.
 * Not RLS-protected (no tenant_id). Filtered by user_id in application code.
 */
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 24 }).primaryKey(),
  userId: varchar('user_id', { length: 24 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

/**
 * Tenants table representing organizational units.
 * RLS-protected: policies restrict access based on app.current_tenant_id.
 */
export const tenants = pgTable('tenants', {
  id: varchar('id', { length: 24 }).primaryKey(),
  name: text('name').notNull(),
  ownerId: varchar('owner_id', { length: 24 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  /** Per-tenant encryption salt for photo encryption key derivation (hex-encoded). */
  encryptionSalt: varchar('encryption_salt', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
})

/**
 * Guestbooks table representing individual guestbook instances.
 * Each guestbook belongs to a tenant and has its own settings.
 * RLS-protected via tenant_id.
 */
export const guestbooks = pgTable('guestbooks', {
  id: varchar('id', { length: 24 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 24 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['permanent', 'event'] }).notNull().default('permanent'),
  settings: jsonb('settings').$type<GuestbookSettings>().default({}),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_guestbooks_tenant').on(table.tenantId)
])

/**
 * Entries table for guestbook entries, scoped to a guestbook.
 * RLS-protected via guestbook → tenant_id relationship.
 */
export const entries = pgTable('entries', {
  id: varchar('id', { length: 24 }).primaryKey(),
  guestbookId: varchar('guestbook_id', { length: 24 }).notNull().references(() => guestbooks.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  message: text('message').notNull(),
  photoUrl: text('photo_url'),
  answers: jsonb('answers').$type<Record<string, unknown>>(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_entries_guestbook').on(table.guestbookId)
])

/**
 * Tenant members table for role-based access control.
 * Links users to tenants with a specific role (owner or co_owner).
 * RLS-protected via tenant_id.
 */
export const tenantMembers = pgTable('tenant_members', {
  id: varchar('id', { length: 24 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 24 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 24 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'co_owner'] }).notNull(),
  invitedBy: varchar('invited_by', { length: 24 }).references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  uniqueIndex('idx_tenant_members_unique').on(table.tenantId, table.userId),
  index('idx_tenant_members_tenant').on(table.tenantId),
  index('idx_tenant_members_user').on(table.userId)
])

/**
 * Tenant invites table for inviting users to join a tenant.
 * Stores pending invitations with a unique token.
 * RLS-protected via tenant_id.
 */
export const tenantInvites = pgTable('tenant_invites', {
  id: varchar('id', { length: 24 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 24 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role', { enum: ['co_owner'] }).notNull().default('co_owner'),
  invitedBy: varchar('invited_by', { length: 24 }).notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_tenant_invites_token').on(table.token),
  index('idx_tenant_invites_email').on(table.email)
])

/**
 * Tenant role type. Owner has full control, co_owner can moderate entries.
 */
export type TenantRole = 'owner' | 'co_owner'
