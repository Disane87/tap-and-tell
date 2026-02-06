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

      -- Beta access: user tracking
      ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_invite_id VARCHAR(24);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_founder BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_participant BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

      -- Beta access: tenant plan management
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_granted_reason TEXT;

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

      -- Beta invites for controlled registration
      CREATE TABLE IF NOT EXISTS beta_invites (
        id VARCHAR(24) PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        source TEXT NOT NULL DEFAULT 'manual',
        granted_plan TEXT NOT NULL DEFAULT 'pro',
        is_founder BOOLEAN NOT NULL DEFAULT false,
        note TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        accepted_at TIMESTAMPTZ,
        accepted_by_user_id VARCHAR(24) REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_beta_invites_token ON beta_invites(token);
      CREATE INDEX IF NOT EXISTS idx_beta_invites_email ON beta_invites(email);

      -- Beta invites: additional columns for admin tracking
      ALTER TABLE beta_invites ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
      ALTER TABLE beta_invites ADD COLUMN IF NOT EXISTS revoked_reason TEXT;
      ALTER TABLE beta_invites ADD COLUMN IF NOT EXISTS created_by VARCHAR(24);

      -- Waitlist for public beta signup
      CREATE TABLE IF NOT EXISTS waitlist (
        id VARCHAR(24) PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        use_case TEXT,
        source TEXT,
        referred_by_user_id VARCHAR(24) REFERENCES users(id),
        referral_code TEXT UNIQUE,
        position SERIAL NOT NULL,
        priority INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'waiting',
        invited_at TIMESTAMPTZ,
        registered_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
      CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist(referral_code);
      CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
      CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON waitlist(priority);

      -- ══════════════════════════════════════════════════════════════════════════
      -- ANALYTICS TABLES
      -- ══════════════════════════════════════════════════════════════════════════

      -- Analytics events table for tracking user interactions
      CREATE TABLE IF NOT EXISTS analytics_events (
        id VARCHAR(24) PRIMARY KEY,
        tenant_id VARCHAR(24) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        guestbook_id VARCHAR(24) REFERENCES guestbooks(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL,
        event_category VARCHAR(30) NOT NULL,
        session_id VARCHAR(64) NOT NULL,
        visitor_id VARCHAR(64),
        page_path VARCHAR(255),
        referrer VARCHAR(500),
        utm_source VARCHAR(100),
        utm_medium VARCHAR(100),
        utm_campaign VARCHAR(100),
        device_type VARCHAR(20),
        browser VARCHAR(50),
        os VARCHAR(50),
        country_code VARCHAR(2),
        region VARCHAR(100),
        properties JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_time ON analytics_events(tenant_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_guestbook_time ON analytics_events(guestbook_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

      -- Aggregated daily statistics for fast dashboard queries
      CREATE TABLE IF NOT EXISTS analytics_daily_stats (
        id VARCHAR(24) PRIMARY KEY,
        tenant_id VARCHAR(24) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        guestbook_id VARCHAR(24) REFERENCES guestbooks(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        page_views INTEGER NOT NULL DEFAULT 0,
        unique_visitors INTEGER NOT NULL DEFAULT 0,
        sessions INTEGER NOT NULL DEFAULT 0,
        entries_created INTEGER NOT NULL DEFAULT 0,
        entries_with_photo INTEGER NOT NULL DEFAULT 0,
        form_starts INTEGER NOT NULL DEFAULT 0,
        form_completions INTEGER NOT NULL DEFAULT 0,
        avg_time_on_page_seconds INTEGER,
        bounce_rate INTEGER,
        mobile_visits INTEGER NOT NULL DEFAULT 0,
        tablet_visits INTEGER NOT NULL DEFAULT 0,
        desktop_visits INTEGER NOT NULL DEFAULT 0,
        direct_visits INTEGER NOT NULL DEFAULT 0,
        nfc_visits INTEGER NOT NULL DEFAULT 0,
        qr_visits INTEGER NOT NULL DEFAULT 0,
        link_visits INTEGER NOT NULL DEFAULT 0,
        hourly_distribution JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(tenant_id, guestbook_id, date)
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_daily_tenant_date ON analytics_daily_stats(tenant_id, date);
      CREATE INDEX IF NOT EXISTS idx_analytics_daily_guestbook_date ON analytics_daily_stats(guestbook_id, date);

      -- Session details for funnel analysis
      CREATE TABLE IF NOT EXISTS analytics_sessions (
        id VARCHAR(64) PRIMARY KEY,
        tenant_id VARCHAR(24) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        guestbook_id VARCHAR(24) REFERENCES guestbooks(id) ON DELETE CASCADE,
        visitor_id VARCHAR(64),
        started_at TIMESTAMPTZ NOT NULL,
        ended_at TIMESTAMPTZ,
        duration_seconds INTEGER,
        entry_page VARCHAR(255),
        exit_page VARCHAR(255),
        page_count INTEGER NOT NULL DEFAULT 1,
        converted BOOLEAN NOT NULL DEFAULT FALSE,
        form_step_reached INTEGER NOT NULL DEFAULT 0,
        source VARCHAR(20),
        referrer VARCHAR(500),
        device_type VARCHAR(20),
        browser VARCHAR(50),
        os VARCHAR(50),
        country_code VARCHAR(2)
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_tenant ON analytics_sessions(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_guestbook ON analytics_sessions(guestbook_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started ON analytics_sessions(started_at);
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

    // ── Analytics Events RLS ──
    await client.query(`ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY`)
    await client.query(`ALTER TABLE analytics_events FORCE ROW LEVEL SECURITY`)
    await createPolicy(
      'analytics_events',
      'analytics_events_isolation',
      'ALL',
      `tenant_id = current_setting('app.current_tenant_id', true)`,
      `tenant_id = current_setting('app.current_tenant_id', true)`
    )

    // ── Analytics Daily Stats RLS ──
    await client.query(`ALTER TABLE analytics_daily_stats ENABLE ROW LEVEL SECURITY`)
    await client.query(`ALTER TABLE analytics_daily_stats FORCE ROW LEVEL SECURITY`)
    await createPolicy(
      'analytics_daily_stats',
      'analytics_daily_stats_isolation',
      'ALL',
      `tenant_id = current_setting('app.current_tenant_id', true)`,
      `tenant_id = current_setting('app.current_tenant_id', true)`
    )

    // ── Analytics Sessions RLS ──
    await client.query(`ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY`)
    await client.query(`ALTER TABLE analytics_sessions FORCE ROW LEVEL SECURITY`)
    await createPolicy(
      'analytics_sessions',
      'analytics_sessions_isolation',
      'ALL',
      `tenant_id = current_setting('app.current_tenant_id', true)`,
      `tenant_id = current_setting('app.current_tenant_id', true)`
    )

    log.success('RLS policies configured for tenant isolation')
  } finally {
    client.release()
    await pool.end()
  }
}
