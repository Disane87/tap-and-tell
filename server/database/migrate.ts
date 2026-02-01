import { Pool } from 'pg'

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
  const client = await pool.connect()

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
    `)

    // ── Enable Row-Level Security ──────────────────────────────────

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

    console.log('[migrate] PostgreSQL migration complete with RLS policies')
  } finally {
    client.release()
    await pool.end()
  }
}
