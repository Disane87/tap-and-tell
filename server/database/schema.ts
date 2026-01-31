import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import type { GuestbookSettings, GuestbookType } from '~~/server/types/guestbook'

/**
 * Users table for owner authentication.
 * Each user can own multiple tenants.
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

/**
 * Sessions table for JWT-based authentication.
 * Stores active sessions with expiry timestamps.
 */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

/**
 * Tenants table representing organizational units.
 * Settings have moved to guestbook level.
 */
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

/**
 * Guestbooks table representing individual guestbook instances.
 * Each guestbook belongs to a tenant and has its own settings.
 */
export const guestbooks = sqliteTable('guestbooks', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['permanent', 'event'] }).notNull().default('permanent'),
  settings: text('settings', { mode: 'json' }).$type<GuestbookSettings>().default({}),
  startDate: text('start_date'),
  endDate: text('end_date'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

/**
 * Entries table for guestbook entries, scoped to a guestbook.
 */
export const entries = sqliteTable('entries', {
  id: text('id').primaryKey(),
  guestbookId: text('guestbook_id').notNull().references(() => guestbooks.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  message: text('message').notNull(),
  photoUrl: text('photo_url'),
  answers: text('answers', { mode: 'json' }).$type<Record<string, unknown>>(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

/**
 * Tenant members table for role-based access control.
 * Links users to tenants with a specific role (owner or co_owner).
 */
export const tenantMembers = sqliteTable('tenant_members', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'co_owner'] }).notNull(),
  invitedBy: text('invited_by').references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

/**
 * Tenant invites table for inviting users to join a tenant.
 * Stores pending invitations with a unique token.
 */
export const tenantInvites = sqliteTable('tenant_invites', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role', { enum: ['co_owner'] }).notNull().default('co_owner'),
  invitedBy: text('invited_by').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  acceptedAt: text('accepted_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

/**
 * Tenant role type. Owner has full control, co_owner can moderate entries.
 */
export type TenantRole = 'owner' | 'co_owner'
