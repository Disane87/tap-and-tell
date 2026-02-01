# Plan 33: PostgreSQL with Row-Level Security + Photo Encryption

## Overview

Migrate from SQLite/Turso to PostgreSQL with Row-Level Security (RLS) for
bulletproof multi-tenant data isolation. Add per-tenant AES-256-GCM photo
encryption for data-at-rest security. This is a hard requirement for a
commercially viable SaaS product.

## Why PostgreSQL + RLS?

- **RLS enforces isolation at the database level** — even a bug in application
  code cannot leak data across tenants
- **PostgreSQL is the industry standard** for SaaS multi-tenant apps
- **Drizzle ORM supports PostgreSQL** natively with `drizzle-orm/node-postgres`
- **Audit-friendly** — security policies are declarative and inspectable

## Architecture

### Database

- **Production**: PostgreSQL (Neon, Supabase, self-hosted, etc.)
- **Development**: PostgreSQL via Docker Compose
- **SQLite kept as fallback** for zero-dependency local testing only

### RLS Strategy

Every request sets a session variable before executing queries:

```sql
SET LOCAL app.current_tenant_id = '<tenant_id>';
```

RLS policies on `guestbooks`, `entries`, `tenant_members`, `tenant_invites`
enforce `tenant_id = current_setting('app.current_tenant_id')`.

Tables without tenant_id (`users`, `sessions`) are not RLS-protected but
are filtered in application code as before.

### Photo Encryption

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key derivation**: HKDF-SHA256 from master key + tenant-specific salt
- **Per-tenant isolation**: Each tenant has a unique encryption key derived
  from a master secret + their tenant ID as context
- **Storage**: Encrypted files with `.enc` extension + IV/tag prepended
- **Format**: `[12-byte IV][16-byte auth tag][ciphertext]`

## Steps

- [ ] 1. Add PostgreSQL dependencies
- [ ] 2. Rewrite schema.ts for PostgreSQL (pgTable)
- [ ] 3. Rewrite database/index.ts with PG connection pool + RLS context
- [ ] 4. Create PostgreSQL migration SQL with RLS policies
- [ ] 5. Add tenant-context middleware
- [ ] 6. Implement crypto utility for per-tenant photo encryption
- [ ] 7. Update storage.ts for encrypted read/write
- [ ] 8. Update API routes to propagate tenant context
- [ ] 9. Add docker-compose.yml for PostgreSQL dev
- [ ] 10. Update drizzle.config.ts, .env.example, nuxt.config.ts
- [ ] 11. Update seed-dev.ts for PostgreSQL
- [ ] 12. Verify build

## Environment Variables (New)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (overloaded) |
| `POSTGRES_URL` | Explicit PostgreSQL URL |
| `ENCRYPTION_MASTER_KEY` | 32-byte hex master key for photo encryption |

## Security Guarantees

1. **Tenant isolation**: RLS prevents cross-tenant data access at DB level
2. **Photo confidentiality**: AES-256-GCM encryption at rest, per-tenant keys
3. **Key derivation**: HKDF ensures compromising one tenant key doesn't
   compromise others
4. **Auth tag**: GCM mode detects tampering of encrypted photos
