/**
 * Re-exports from the canonical server/utils/drizzle.ts utility.
 * This file exists so that internal database modules (migrate, seed)
 * can import via relative paths.
 *
 * All server routes and utils should import from the auto-imported
 * useDrizzle() / withTenantContext() / withTenantClient() instead.
 *
 * @deprecated Import from server/utils/drizzle.ts or use auto-imports.
 */
export { useDrizzle, useDrizzle as useDb, withTenantContext, withTenantClient } from '~~/server/utils/drizzle'
