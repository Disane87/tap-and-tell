import { pgTable, text, timestamp, uniqueIndex, index, jsonb, varchar, boolean, serial, integer } from 'drizzle-orm/pg-core'
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
  /** Optional avatar image URL. */
  avatarUrl: text('avatar_url'),
  /** Reference to the beta invite used for registration. */
  betaInviteId: varchar('beta_invite_id', { length: 24 }),
  /** Whether this user has lifetime benefits (founder status). */
  isFounder: boolean('is_founder').notNull().default(false),
  /** Whether this user participated in the beta program. */
  betaParticipant: boolean('beta_participant').notNull().default(false),
  /** Whether this user has admin privileges. */
  isAdmin: boolean('is_admin').notNull().default(false),
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
  /** Current plan: free, pro, or business. */
  plan: text('plan').notNull().default('free'),
  /** When the current plan expires. Null means never expires. */
  planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
  /** Reason for the current plan: beta_invite, founder, purchase, trial. */
  planGrantedReason: text('plan_granted_reason'),
  /** Per-tenant encryption salt for photo encryption key derivation (hex-encoded). */
  encryptionSalt: varchar('encryption_salt', { length: 64 }),
  /** Current encryption key version for key rotation support. */
  keyVersion: varchar('key_version', { length: 10 }).notNull().default('1'),
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
 * Audit logs table for tracking security-relevant actions.
 * RLS-protected via tenant_id. Entries with null tenant_id are visible when tenant context is not set.
 */
export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 24 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 24 }).references(() => tenants.id, { onDelete: 'set null' }),
  userId: varchar('user_id', { length: 24 }).references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: varchar('resource_id', { length: 24 }),
  details: jsonb('details').$type<Record<string, unknown>>(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_audit_logs_tenant').on(table.tenantId),
  index('idx_audit_logs_user').on(table.userId),
  index('idx_audit_logs_action').on(table.action),
  index('idx_audit_logs_created').on(table.createdAt)
])

/**
 * Two-factor authentication configuration per user.
 * Supports TOTP (authenticator app) and email-based OTP.
 */
export const userTwoFactor = pgTable('user_two_factor', {
  id: varchar('id', { length: 24 }).primaryKey(),
  userId: varchar('user_id', { length: 24 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  /** 2FA method: 'totp' for authenticator app, 'email' for email-based OTP. */
  method: text('method', { enum: ['totp', 'email'] }).notNull(),
  /** TOTP secret (base32-encoded). Only set for TOTP method. Encrypted at rest. */
  secret: text('secret'),
  /** Comma-separated bcrypt-hashed backup codes. */
  backupCodes: text('backup_codes'),
  /** Whether this 2FA method is currently active. */
  enabled: text('enabled').notNull().default('false'),
  /** When the 2FA was verified and activated. */
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_user_two_factor_user').on(table.userId)
])

/**
 * Temporary 2FA verification tokens for the login flow.
 * Created after password verification when 2FA is required.
 */
export const twoFactorTokens = pgTable('two_factor_tokens', {
  id: varchar('id', { length: 24 }).primaryKey(),
  userId: varchar('user_id', { length: 24 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  /** Random token string used to identify the pending 2FA verification. */
  token: text('token').notNull().unique(),
  /** Expiry time for this token (5 minutes). */
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

/**
 * API apps registered by tenant owners for third-party integrations.
 * Each app is scoped to exactly one tenant.
 * RLS-protected via tenant_id.
 */
export const apiApps = pgTable('api_apps', {
  id: varchar('id', { length: 24 }).primaryKey(),
  tenantId: varchar('tenant_id', { length: 24 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  /** User who created this app. */
  userId: varchar('user_id', { length: 24 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  /** Human-readable app name. */
  name: text('name').notNull(),
  /** Optional description of what this app does. */
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_api_apps_tenant').on(table.tenantId),
  index('idx_api_apps_user').on(table.userId)
])

/**
 * API tokens belonging to an API app.
 * Token secrets are SHA-256 hashed before storage.
 * Multiple tokens per app are supported (e.g. production, staging).
 * Not RLS-protected directly — scoped through api_apps → tenant_id.
 */
export const apiTokens = pgTable('api_tokens', {
  id: varchar('id', { length: 24 }).primaryKey(),
  appId: varchar('app_id', { length: 24 }).notNull().references(() => apiApps.id, { onDelete: 'cascade' }),
  /** Human-readable token name (e.g. "Production", "CI/CD"). */
  name: text('name').notNull(),
  /** SHA-256 hash of the token secret. */
  tokenHash: text('token_hash').notNull().unique(),
  /** First 8 chars of the token for identification (e.g. "tat_a1b2"). */
  tokenPrefix: varchar('token_prefix', { length: 12 }).notNull(),
  /** Array of granted scopes (e.g. ["entries:read", "guestbooks:read"]). */
  scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
  /** Optional expiry date. Null means no expiry. */
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  /** Last time this token was used for authentication. */
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  /** When the token was revoked. Non-null means revoked. */
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_api_tokens_app').on(table.appId),
  index('idx_api_tokens_hash').on(table.tokenHash)
])

/**
 * Tenant role type. Owner has full control, co_owner can moderate entries.
 */
export type TenantRole = 'owner' | 'co_owner'

/**
 * Valid API token scopes.
 */
export type ApiScope =
  | 'entries:read'
  | 'entries:write'
  | 'guestbooks:read'
  | 'guestbooks:write'
  | 'tenant:read'
  | 'tenant:write'
  | 'members:read'
  | 'members:write'
  | 'photos:read'

/**
 * Beta invites table for controlling access during beta phases.
 * Stores invite tokens that allow registration when BETA_MODE is not 'open'.
 */
export const betaInvites = pgTable('beta_invites', {
  id: varchar('id', { length: 24 }).primaryKey(),
  /** Email address the invite was sent to. */
  email: text('email').notNull(),
  /** Unique token for invite validation. */
  token: text('token').notNull().unique(),
  /** Source of the invite: manual (admin created) or waitlist. */
  source: text('source').notNull().default('manual'),
  /** Plan to grant on registration: free, pro, or business. */
  grantedPlan: text('granted_plan').notNull().default('pro'),
  /** Whether this invite grants founder status (lifetime benefits). */
  isFounder: boolean('is_founder').notNull().default(false),
  /** Internal note about the invite (e.g., "Friend of X", "Speaker at Y"). */
  note: text('note'),
  /** When the invite expires. */
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  /** When the invite was accepted (used for registration). */
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  /** User ID of who accepted this invite. */
  acceptedByUserId: varchar('accepted_by_user_id', { length: 24 }).references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_beta_invites_token').on(table.token),
  index('idx_beta_invites_email').on(table.email)
])

/**
 * Waitlist table for public beta signup.
 * Users can join the waitlist and get invited based on priority.
 */
export const waitlist = pgTable('waitlist', {
  id: varchar('id', { length: 24 }).primaryKey(),
  /** Email address of the waitlist entry. */
  email: text('email').notNull().unique(),
  /** Optional name provided by the user. */
  name: text('name'),
  /** Use case description (e.g., "Wedding", "Corporate event"). */
  useCase: text('use_case'),
  /** Traffic source (e.g., "organic", "referral", "social"). */
  source: text('source'),
  /** User ID of who referred this entry (if referral). */
  referredByUserId: varchar('referred_by_user_id', { length: 24 }).references(() => users.id),
  /** User's own referral code for sharing. */
  referralCode: text('referral_code').unique(),
  /** Auto-incrementing position in the waitlist. */
  position: serial('position'),
  /** Priority score for invite ordering. Higher = earlier invite. */
  priority: integer('priority').notNull().default(0),
  /** Current status: waiting, invited, registered, unsubscribed. */
  status: text('status').notNull().default('waiting'),
  /** When this entry was invited (beta invite created). */
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  /** When this entry completed registration. */
  registeredAt: timestamp('registered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('idx_waitlist_email').on(table.email),
  index('idx_waitlist_referral_code').on(table.referralCode),
  index('idx_waitlist_status').on(table.status),
  index('idx_waitlist_priority').on(table.priority)
])

/**
 * Beta mode values for controlling registration access.
 */
export type BetaMode = 'private' | 'waitlist' | 'open'

/**
 * Waitlist status values.
 */
export type WaitlistStatus = 'waiting' | 'invited' | 'registered' | 'unsubscribed'

/**
 * Plan granted reason values.
 */
export type PlanGrantedReason = 'beta_invite' | 'founder' | 'purchase' | 'trial'
