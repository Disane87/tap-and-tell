import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

/**
 * Users table for owner authentication.
 * Each user can own multiple tenants (guestbooks).
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
 * Tenants table representing individual guestbooks.
 * Each tenant is owned by a user and has its own settings.
 */
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  settings: text('settings', { mode: 'json' }).$type<TenantSettings>().default({}),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`)
})

/**
 * Entries table for guestbook entries, scoped to a tenant.
 */
export const entries = sqliteTable('entries', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  message: text('message').notNull(),
  photoUrl: text('photo_url'),
  answers: text('answers', { mode: 'json' }).$type<Record<string, unknown>>(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`)
})

/**
 * Settings for a tenant guestbook.
 */
export interface TenantSettings {
  /** Whether entries require moderation before appearing publicly. */
  moderationEnabled?: boolean
  /** Custom welcome message for guests. */
  welcomeMessage?: string
  /** Custom theme color. */
  themeColor?: string
}
