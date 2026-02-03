import { join } from 'path'
import { getStorageDriver } from '~~/server/utils/storage-driver'
import { encryptData, deriveTenantKey } from '~~/server/utils/crypto'
import { validatePhotoMimeType } from '~~/server/utils/sanitize'
import { eq } from 'drizzle-orm'
import { tenants } from '~~/server/database/schema'

const DATA_DIR = process.env.DATA_DIR || '.data'

/** Default maximum file size: 5 MB */
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024

/** Maps MIME types to file extensions */
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/gif': 'gif'
}

/**
 * Result of a successful upload operation.
 */
export interface UploadResult {
  /** Public URL to access the uploaded file */
  url: string
  /** Filename as stored (may include .enc suffix) */
  filename: string
  /** Detected MIME type */
  mimeType: string
}

/**
 * Options for processing an upload.
 */
export interface UploadOptions {
  /**
   * Subdirectory within DATA_DIR (e.g., 'photos/guestbook123', 'avatars').
   * Will be created if it doesn't exist.
   */
  directory: string

  /**
   * File prefix/name without extension (e.g., 'bg', 'header', 'entry-abc123', 'user-xyz').
   */
  filePrefix: string

  /**
   * API URL prefix for the generated URL (e.g., '/api/photos/guestbook123', '/api/auth/avatar').
   */
  urlPrefix: string

  /**
   * Whether to encrypt the file with tenant-specific key.
   * @default false
   */
  encrypt?: boolean

  /**
   * Tenant ID for encryption key derivation.
   * Required if `encrypt` is true.
   */
  tenantId?: string

  /**
   * Delete existing files with the same prefix before saving.
   * Useful for background/header images that should replace previous versions.
   * @default false
   */
  deleteExisting?: boolean

  /**
   * Maximum file size in bytes.
   * @default 5 * 1024 * 1024 (5 MB)
   */
  maxSize?: number

  /**
   * Allowed MIME types. If not specified, defaults to common image types.
   * @default ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
   */
  allowedTypes?: string[]
}

/**
 * Validates file data and returns the detected MIME type.
 *
 * @param data - Raw file data as Buffer
 * @param options - Upload options for validation rules
 * @returns The detected MIME type
 * @throws Error if validation fails
 */
function validateUpload(data: Buffer, options: UploadOptions): string {
  const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE
  const allowedTypes = options.allowedTypes ?? ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

  // Check file size
  if (data.length > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024)
    throw new Error(`File too large (max ${maxMB} MB)`)
  }

  // Validate magic bytes and detect MIME type
  const base64 = data.toString('base64')
  const validation = validatePhotoMimeType(base64)

  if (!validation.valid || !validation.mimeType) {
    throw new Error('Invalid image format')
  }

  if (!allowedTypes.includes(validation.mimeType)) {
    const allowed = allowedTypes.map(t => t.replace('image/', '')).join(', ')
    throw new Error(`Unsupported image type. Allowed: ${allowed}`)
  }

  return validation.mimeType
}

/**
 * Gets the file extension for a MIME type.
 *
 * @param mimeType - The MIME type
 * @returns File extension without dot
 */
function getExtension(mimeType: string): string {
  return MIME_TO_EXT[mimeType] || 'bin'
}

/**
 * Retrieves the tenant's encryption key by looking up their salt from the DB.
 *
 * @param tenantId - The tenant ID
 * @returns The derived 32-byte tenant encryption key
 */
async function getTenantEncryptionKey(tenantId: string): Promise<Buffer> {
  const db = useDrizzle()
  const rows = await db.select({ encryptionSalt: tenants.encryptionSalt })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
  const tenant = rows[0]

  if (!tenant?.encryptionSalt) {
    throw new Error(`Tenant ${tenantId} has no encryption salt configured`)
  }

  return deriveTenantKey(tenant.encryptionSalt)
}

/**
 * Processes and stores an uploaded file.
 *
 * This utility handles:
 * - File size validation
 * - MIME type validation via magic bytes
 * - Optional encryption with tenant-specific keys
 * - Storage via the configured storage driver (local, Vercel Blob, S3)
 * - Optional deletion of existing files with the same prefix
 *
 * @param data - Raw file data as Buffer
 * @param options - Upload configuration options
 * @returns Upload result with URL and filename
 *
 * @example
 * // Upload encrypted guestbook background
 * const result = await processUpload(fileData, {
 *   directory: `photos/${guestbookId}`,
 *   filePrefix: 'bg',
 *   urlPrefix: `/api/photos/${guestbookId}`,
 *   encrypt: true,
 *   tenantId: uuid,
 *   deleteExisting: true
 * })
 *
 * @example
 * // Upload user avatar (not encrypted)
 * const result = await processUpload(fileData, {
 *   directory: 'avatars',
 *   filePrefix: `user-${userId}`,
 *   urlPrefix: '/api/auth/avatar',
 *   encrypt: false
 * })
 */
export async function processUpload(
  data: Buffer,
  options: UploadOptions
): Promise<UploadResult> {
  // Validate encryption requirements
  if (options.encrypt && !options.tenantId) {
    throw new Error('tenantId is required when encryption is enabled')
  }

  // Validate file and detect MIME type
  const mimeType = validateUpload(data, options)
  const ext = getExtension(mimeType)

  // Build filename
  const encSuffix = options.encrypt ? '.enc' : ''
  const filename = `${options.filePrefix}.${ext}${encSuffix}`

  // Build paths
  const directory = join(DATA_DIR, options.directory)
  const filePath = join(directory, filename)

  const driver = getStorageDriver()

  // Delete existing files with same prefix if requested
  if (options.deleteExisting) {
    const prefix = join(directory, `${options.filePrefix}.`)
    const existingFiles = await driver.list(prefix)
    for (const file of existingFiles) {
      await driver.delete(file)
    }
  }

  // Prepare file data (encrypt if needed)
  let fileData = data
  if (options.encrypt && options.tenantId) {
    const tenantKey = await getTenantEncryptionKey(options.tenantId)
    fileData = encryptData(data, tenantKey)
  }

  // Write file
  await driver.write(filePath, fileData)

  // Build public URL
  const url = `${options.urlPrefix}/${filename}`

  return { url, filename, mimeType }
}

/**
 * Processes a base64-encoded data URL and stores the file.
 * Convenience wrapper for handling data URLs from client uploads.
 *
 * @param dataUrl - Base64-encoded data URL (e.g., "data:image/jpeg;base64,...")
 * @param options - Upload configuration options
 * @returns Upload result with URL and filename, or undefined if dataUrl is invalid
 *
 * @example
 * const result = await processBase64Upload(photo, {
 *   directory: `photos/${guestbookId}`,
 *   filePrefix: `entry-${entryId}`,
 *   urlPrefix: `/api/photos/${guestbookId}`,
 *   encrypt: true,
 *   tenantId
 * })
 */
export async function processBase64Upload(
  dataUrl: string,
  options: UploadOptions
): Promise<UploadResult | undefined> {
  const match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/)
  if (!match) return undefined

  const data = Buffer.from(match[1], 'base64')
  return processUpload(data, options)
}

/**
 * Deletes an uploaded file by its URL.
 *
 * @param url - The public URL of the file (e.g., "/api/photos/gb123/entry.jpg.enc")
 * @param urlPrefixToStrip - The URL prefix to remove to get the relative path
 * @returns True if the file was deleted, false if not found
 *
 * @example
 * await deleteUpload('/api/photos/gb123/bg.jpg.enc', '/api/photos')
 */
export async function deleteUpload(
  url: string,
  urlPrefixToStrip: string
): Promise<boolean> {
  // Extract relative path from URL
  let relativePath = url
  if (url.startsWith(urlPrefixToStrip)) {
    relativePath = url.slice(urlPrefixToStrip.length)
  }
  if (relativePath.startsWith('/')) {
    relativePath = relativePath.slice(1)
  }

  // Build full path
  const filePath = join(DATA_DIR, 'photos', relativePath)

  const driver = getStorageDriver()
  return driver.delete(filePath)
}
