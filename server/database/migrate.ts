import { Pool } from 'pg'
import { createLogger } from '~~/server/utils/logger'

const log = createLogger('migrate')

/**
 * Runs database migrations by creating tables and enabling Row-Level Security.
 * Uses raw SQL for maximum control over RLS policies.
 *
 * The application uses two PostgreSQL roles:
 * - A superuser/owner role for migrations (this script)
 * - The same role for application queries, but with RLS enforced via
 *   `app.current_tenant_id` session variable set per-transaction
 *
 * @param connectionString - PostgreSQL connection string.
 */
export async function runMigrations(connectionString: string): Promise<void> {
  const pool = new Pool({ connectionString })

  log.debug('Connecting to PostgreSQL...')
  const client = await pool.connect()
  log.debug('Connection established')

  try {
    // ── Create tables ──────────────────────────────────────────────

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(24) PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(24) PRIMARY KEY,
        user_id VARCHAR(24) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(24) PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id VARCHAR(24) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        encryption_salt VARCHAR(64),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Key rotation support: add key_version column if not present
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS key_version VARCHAR(10) NOT NULL DEFAULT '1';

      -- Profile management: avatar URL on users, plan on tenants
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

      CREATE TABLE IF NOT EXISTS guestbooks (
        id VARCHAR(24) PRIMARY KEY,
        tenant_id VARCHAR(24) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'permanent' CHECK(type IN ('permanent', 'event')),
        settings JSONB DEFAULT '{}',
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_guestbooks_tenant ON guestbooks(tenant_id);

      CREATE TABLE IF NOT EXISTS entries (
        id VARCHAR(24) PRIMARY KEY,
        guestbook_id VARCHAR(24) NOT NULL REFERENCES guestbooks(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        photo_url TEXT,
        answers JSONB,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        rejection_reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_entries_guestbook ON entries(guestbook_id);

      CREATE TABLE IF NOT EXISTS tenant_members (
        id VARCHAR(24) PRIMARY KEY,
        tenant_id VARCHAR(24) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id VARCHAR(24) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK(role IN ('owner', 'co_owner')),
        invited_by VARCHAR(24) REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);

      CREATE TABLE IF NOT EXISTS tenant_invites (
        id VARCHAR(24) PRIMARY KEY,
        tenant_id VARCHAR(24) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'co_owner' CHECK(role IN ('co_owner')),
        invited_by VARCHAR(24) NOT NULL REFERENCES users(id),
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        accepted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_tenant_invites_token ON tenant_invites(token);
      CREATE INDEX IF NOT EXISTS idx_tenant_invites_email ON tenant_invites(email);

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(24) PRIMARY KEY,
        tenant_id VARCHAR(24) REFERENCES tenants(id) ON DELETE SET NULL,
        user_id VARCHAR(24) REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id VARCHAR(24),
        details JSONB,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

      CREATE TABLE IF NOT EXISTS user_two_factor (
        id VARCHAR(24) PRIMARY KEY,
        user_id VARCHAR(24) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        method TEXT NOT NULL CHECK(method IN ('totp', 'email')),
        secret TEXT,
        backup_codes TEXT,
        enabled TEXT NOT NULL DEFAULT 'false',
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_user_two_factor_user ON user_two_factor(user_id);

      CREATE TABLE IF NOT EXISTS two_factor_tokens (
        id VARCHAR(24) PRIMARY KEY,
        user_id VARCHAR(24) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_two_factor_tokens_token ON two_factor_tokens(token);

      CREATE TABLE IF NOT EXISTS api_apps (
        id VARCHAR(24) PRIMARY KEY,
        tenant_id VARCHAR(24) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id VARCHAR(24) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_api_apps_tenant ON api_apps(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_api_apps_user ON api_apps(user_id);

      CREATE TABLE IF NOT EXISTS api_tokens (
        id VARCHAR(24) PRIMARY KEY,
        app_id VARCHAR(24) NOT NULL REFERENCES api_apps(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        token_prefix VARCHAR(12) NOT NULL,
        scopes JSONB NOT NULL DEFAULT '[]',
        expires_at TIMESTAMPTZ,
        last_used_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_api_tokens_app ON api_tokens(app_id);
      CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash);
    `)

    log.debug('Core tables created/verified')

    // ── Enable Row-Level Security ──────────────────────────────────
    log.debug('Configuring Row-Level Security policies...')

    // Helper: create an RLS policy if it doesn't exist (idempotent)
    const createPolicy = async (
      table: string,
      name: string,
      command: string,
      using: string,
      withCheck?: string
    ) => {
      // Drop and recreate to ensure policy is up-to-date
      await client.query(`DROP POLICY IF EXISTS ${name} ON ${table}`)
      const withCheckClause = withCheck ? `WITH CHECK (${withCheck})` : ''
      await client.query(
        `CREATE POLICY ${name} ON ${table} FOR ${command} USING (${using}) ${withCheckClause}`
      )
    }

    // ── Tenants RLS ──
    // Tenants table: allow access when id matches the current tenant context
    await client.query(`ALTER TABLE tenants ENABLE ROW LEVEL SECURITY`)
    await client.query(`ALTER TABLE tenants FORCE ROW LEVEL SECURITY`)
    await createPolicy(
      'tenants',
      'tenants_isolation',
      'ALL',
      `id = current_setting('app.current_tenant_id', true)`,
      `id = current_setting('app.current_tenant_id', true)`
    )

    // ── Guestbooks RLS ──
    await client.query(`ALTER TABLE guestbooks ENABLE ROW LEVEL SECURITY`)
    await client.query(`ALTER TABLE guestbooks FORCE ROW LEVEL SECURITY`)
    await createPolicy(
      'guestbooks',
      'guestbooks_isolation',
      'ALL',
      `tenant_id = current_setting('app.current_tenant_id', true)`,
      `tenant_id = current_setting('app.current_tenant_id', true)`
    )

    // ── Entries RLS ──
    // Entries are scoped through guestbooks → tenant_id
    await client.query(`ALTER TABLE entries ENABLE ROW LEVEL SECURITY`)
    await client.query(`ALTER TABLE entries FORCE ROW LEVEL SECURITY`)
    await createPolicy(
      'entries',
      'entries_isolation',
      'ALL',
      `guestbook_id IN (SELECT id FROM guestbooks WHERE tenant_id = current_setting('app.current_tenant_id', true))`,
      `guestbook_id IN (SELECT id FROM guestbooks WHERE tenant_id = current_setting('app.current_tenant_id', true))`
    )

    // ── Tenant Members RLS ──
    await client.query(`ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY`)
    await client.query(`ALTER TABLE tenant_members FORCE ROW LEVEL SECURITY`)
    await createPolicy(
      'tenant_members',
      'tenant_members_isolation',
      'ALL',
      `tenant_id = current_setting('app.current_tenant_id', true)`,
      `tenant_id = current_setting('app.current_tenant_id', true)`
    )

    // ── Tenant Invites RLS ──
    await client.query(`ALTER TABLE tenant_invites ENABLE ROW LEVEL SECURITY`)
    await client.query(`ALTER TABLE tenant_invites FORCE ROW LEVEL SECURITY`)
    await createPolicy(
      'tenant_invites',
      'tenant_invites_isolation',
      'ALL',
      `tenant_id = current_setting('app.current_tenant_id', true)`,
      `tenant_id = current_setting('app.current_tenant_id', true)`
    )

    // ── API Apps RLS ──
    await client.query(`ALTER TABLE api_apps ENABLE ROW LEVEL SECURITY`)
    await client.query(`ALTER TABLE api_apps FORCE ROW LEVEL SECURITY`)
    await createPolicy(
      'api_apps',
      'api_apps_isolation',
      'ALL',
      `tenant_id = current_setting('app.current_tenant_id', true)`,
      `tenant_id = current_setting('app.current_tenant_id', true)`
    )

    // ── API Tokens RLS (via api_apps → tenant_id) ──
    await client.query(`ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY`)
    await client.query(`ALTER TABLE api_tokens FORCE ROW LEVEL SECURITY`)
    await createPolicy(
      'api_tokens',
      'api_tokens_isolation',
      'ALL',
      `app_id IN (SELECT id FROM api_apps WHERE tenant_id = current_setting('app.current_tenant_id', true))`,
      `app_id IN (SELECT id FROM api_apps WHERE tenant_id = current_setting('app.current_tenant_id', true))`
    )

    // ── Audit Logs RLS ──
    await client.query(`ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY`)
    await client.query(`ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY`)
    await createPolicy(
      'audit_logs',
      'audit_logs_isolation',
      'ALL',
      `tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id IS NULL`,
      `tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id IS NULL`
    )

    log.success('RLS policies configured for tenant isolation')
  } finally {
    client.release()
    await pool.end()
  }
}
