import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool, type PoolClient } from 'pg'
import * as schema from './schema'

/**
 * Singleton PostgreSQL connection pool.
 * All queries go through this pool.
 */
let _pool: Pool | null = null

/**
 * Singleton Drizzle instance (without RLS context).
 * Used for operations that don't need tenant scoping (auth, user management).
 */
let _db: NodePgDatabase<typeof schema> | null = null

/**
 * Returns the PostgreSQL connection pool, creating it if necessary.
 *
 * @returns The pg Pool instance.
 */
export function getPool(): Pool {
  if (_pool) return _pool

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'Missing database configuration. Set POSTGRES_URL or DATABASE_URL environment variable.'
    )
  }

  _pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
  })

  return _pool
}

/**
 * Returns the default Drizzle database instance (no RLS context).
 * Use this for operations on non-tenant-scoped tables (users, sessions).
 *
 * @returns Drizzle ORM database instance with schema.
 */
export function useDb(): NodePgDatabase<typeof schema> {
  if (_db) return _db
  _db = drizzle(getPool(), { schema })
  return _db
}

/**
 * Executes a callback within a PostgreSQL transaction that has the
 * RLS tenant context set via `SET LOCAL app.current_tenant_id`.
 *
 * `SET LOCAL` ensures the setting only applies within the transaction
 * and is automatically reset when the transaction ends.
 *
 * @param tenantId - The tenant ID to set as RLS context.
 * @param callback - Function receiving a tenant-scoped Drizzle instance.
 * @returns The result of the callback.
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (db: NodePgDatabase<typeof schema>) => Promise<T>
): Promise<T> {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // SET LOCAL only applies within this transaction — safe for connection pooling
    await client.query(`SET LOCAL app.current_tenant_id = $1`, [tenantId])

    const txDb = drizzle(client as any, { schema })
    const result = await callback(txDb)

    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Executes a callback with a raw PostgreSQL client that has tenant context set.
 * Use this when you need raw SQL access with RLS.
 *
 * @param tenantId - The tenant ID to set as RLS context.
 * @param callback - Function receiving a connected PoolClient.
 * @returns The result of the callback.
 */
export async function withTenantClient<T>(
  tenantId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    await client.query(`SET LOCAL app.current_tenant_id = $1`, [tenantId])

    const result = await callback(client)

    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
