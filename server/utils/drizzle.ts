import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool, type PoolClient } from 'pg'
import * as schema from '~~/server/database/schema'

export type DrizzleDb = NodePgDatabase<typeof schema>

/**
 * Singleton PostgreSQL connection pool.
 */
let _pool: Pool | null = null

/**
 * Singleton Drizzle instance (without RLS context).
 */
let _db: DrizzleDb | null = null

/**
 * Returns the PostgreSQL connection pool, creating it if necessary.
 * Reads the connection string from Nuxt runtimeConfig.
 */
function getPool(): Pool {
  if (_pool) return _pool

  const config = useRuntimeConfig()
  const connectionString = config.postgresUrl

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
 * Use for operations on non-tenant-scoped tables (users, sessions).
 *
 * Follows the Nuxt `useDrizzle()` convention for server utilities.
 */
export function useDrizzle(): DrizzleDb {
  if (_db) return _db
  _db = drizzle(getPool(), { schema })
  return _db
}

/**
 * Executes a callback within a PostgreSQL transaction with RLS
 * tenant context set via `SET LOCAL app.current_tenant_id`.
 *
 * @param tenantId - The tenant ID to set as RLS context.
 * @param callback - Function receiving a tenant-scoped Drizzle instance.
 * @returns The result of the callback.
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (db: DrizzleDb) => Promise<T>
): Promise<T> {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
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
 * Use when you need raw SQL access with RLS.
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

/**
 * Re-export schema for convenient access alongside useDrizzle().
 */
export { schema }
