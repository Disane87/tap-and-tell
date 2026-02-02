/**
 * TypeScript interfaces for the API Apps & Tokens management system.
 */

/** An API app registered by a tenant owner. */
export interface ApiApp {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  tokenCount: number
}

/** An API token belonging to an app (metadata only, no plaintext). */
export interface ApiToken {
  id: string
  name: string
  tokenPrefix: string
  scopes: string[]
  expiresAt: string | null
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

/** Response from token creation — contains the plaintext token shown once. */
export interface ApiTokenCreateResponse {
  id: string
  name: string
  token: string
  prefix: string
  scopes: string[]
  expiresAt: string | null
}

/** Input for creating a new API token. */
export interface CreateApiTokenInput {
  name: string
  scopes: string[]
  expiresInDays?: number
}

/** A scope definition with its description. */
export interface ApiScopeDefinition {
  scope: string
  description: string
}
