import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, readdirSync } from 'fs'
import { dirname } from 'path'
import { put, del, list } from '@vercel/blob'

/**
 * Interface for storage backends (local filesystem, Vercel Blob, S3, etc.).
 */
export interface StorageDriver {
  /** Writes data to the given path. */
  write(filePath: string, data: Buffer): Promise<void>
  /** Reads data from the given path. Returns undefined if not found. */
  read(filePath: string): Promise<Buffer | undefined>
  /** Deletes the file at the given path. Returns true if deleted. */
  delete(filePath: string): Promise<boolean>
  /** Checks if a file exists at the given path. */
  exists(filePath: string): Promise<boolean>
  /** Lists all files matching the given prefix. */
  list(prefix: string): Promise<string[]>
}

/**
 * Local filesystem storage driver.
 * Stores files on disk using Node.js fs module.
 */
class LocalStorageDriver implements StorageDriver {
  async write(filePath: string, data: Buffer): Promise<void> {
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(filePath, data)
  }

  async read(filePath: string): Promise<Buffer | undefined> {
    if (!existsSync(filePath)) return undefined
    return readFileSync(filePath)
  }

  async delete(filePath: string): Promise<boolean> {
    if (!existsSync(filePath)) return false
    unlinkSync(filePath)
    return true
  }

  async exists(filePath: string): Promise<boolean> {
    return existsSync(filePath)
  }

  async list(prefix: string): Promise<string[]> {
    const { dirname, basename, join } = await import('path')
    const dir = dirname(prefix)
    const filePrefix = basename(prefix)

    if (!existsSync(dir)) return []

    const files = readdirSync(dir)
    return files
      .filter(f => f.startsWith(filePrefix))
      .map(f => join(dir, f))
  }
}

/**
 * Vercel Blob storage driver.
 * Stores files in Vercel Blob Storage using their SDK.
 * Requires BLOB_READ_WRITE_TOKEN environment variable.
 *
 * @see https://vercel.com/docs/storage/vercel-blob
 */
class VercelBlobStorageDriver implements StorageDriver {
  /**
   * Writes data to Vercel Blob storage.
   * Uses deterministic paths (no random suffix) for consistent addressing.
   *
   * @param filePath - Logical file path (e.g., "photos/guestbook123/entry456.jpg.enc")
   * @param data - Buffer containing the file data
   */
  async write(filePath: string, data: Buffer): Promise<void> {
    const blobPath = this.normalizePath(filePath)

    await put(blobPath, data, {
      access: 'public',
      addRandomSuffix: false
    })
  }

  /**
   * Reads data from Vercel Blob storage.
   * Finds the blob by path prefix and fetches its content.
   *
   * @param filePath - Logical file path
   * @returns The file data or undefined if not found
   */
  async read(filePath: string): Promise<Buffer | undefined> {
    const blobPath = this.normalizePath(filePath)

    // Find the blob by path prefix
    const { blobs } = await list({ prefix: blobPath, limit: 1 })
    const blob = blobs.find(b => b.pathname === blobPath)

    if (!blob) return undefined

    // Fetch the blob content
    const response = await fetch(blob.url)
    if (!response.ok) return undefined

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Deletes a file from Vercel Blob storage.
   *
   * @param filePath - Logical file path
   * @returns True if the file was found and deleted
   */
  async delete(filePath: string): Promise<boolean> {
    const blobPath = this.normalizePath(filePath)

    // Find the blob to get its URL
    const { blobs } = await list({ prefix: blobPath, limit: 1 })
    const blob = blobs.find(b => b.pathname === blobPath)

    if (!blob) return false

    await del(blob.url)
    return true
  }

  /**
   * Checks if a file exists in Vercel Blob storage.
   *
   * @param filePath - Logical file path
   * @returns True if the file exists
   */
  async exists(filePath: string): Promise<boolean> {
    const blobPath = this.normalizePath(filePath)

    const { blobs } = await list({ prefix: blobPath, limit: 1 })
    return blobs.some(b => b.pathname === blobPath)
  }

  /**
   * Lists all files matching the given prefix in Vercel Blob storage.
   *
   * @param prefix - Path prefix to match
   * @returns Array of matching file paths
   */
  async list(prefix: string): Promise<string[]> {
    const blobPrefix = this.normalizePath(prefix)

    const { blobs } = await list({ prefix: blobPrefix })
    return blobs.map(b => b.pathname)
  }

  /**
   * Normalizes a file path for use with Vercel Blob.
   * Removes leading DATA_DIR prefix and ensures consistent format.
   * Handles both forward slashes (Unix) and backslashes (Windows).
   *
   * @param filePath - The original file path
   * @returns Normalized path suitable for Vercel Blob (always uses forward slashes)
   */
  private normalizePath(filePath: string): string {
    const dataDir = process.env.DATA_DIR || '.data'

    // Normalize all path separators to forward slashes for consistent handling
    let normalized = filePath.replace(/\\/g, '/')
    const normalizedDataDir = dataDir.replace(/\\/g, '/')

    // Remove DATA_DIR prefix if present (with or without trailing slash)
    if (normalized.startsWith(normalizedDataDir + '/')) {
      normalized = normalized.slice(normalizedDataDir.length + 1)
    } else if (normalized.startsWith('.data/')) {
      normalized = normalized.slice(6)
    }

    // Remove leading slash if present
    if (normalized.startsWith('/')) {
      normalized = normalized.slice(1)
    }

    return normalized
  }
}

/**
 * S3-compatible storage driver stub.
 * Not yet implemented — throws an error if used.
 */
class S3StorageDriver implements StorageDriver {
  async write(): Promise<void> {
    throw new Error('S3 storage driver is not yet configured. Set STORAGE_DRIVER=local or implement S3 support.')
  }

  async read(): Promise<Buffer | undefined> {
    throw new Error('S3 storage driver is not yet configured.')
  }

  async delete(): Promise<boolean> {
    throw new Error('S3 storage driver is not yet configured.')
  }

  async exists(): Promise<boolean> {
    throw new Error('S3 storage driver is not yet configured.')
  }

  async list(): Promise<string[]> {
    throw new Error('S3 storage driver is not yet configured.')
  }
}

/** Singleton storage driver instance. */
let _driver: StorageDriver | null = null

/**
 * Returns the configured storage driver instance.
 *
 * Reads the STORAGE_DRIVER environment variable (default: 'local').
 * Supported values: 'local', 'vercel-blob', 's3'
 * Creates a singleton instance on first call.
 *
 * @returns The storage driver.
 */
export function getStorageDriver(): StorageDriver {
  if (_driver) return _driver

  const driverType = process.env.STORAGE_DRIVER || 'local'

  switch (driverType) {
    case 'vercel-blob':
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.warn('[storage-driver] STORAGE_DRIVER=vercel-blob but BLOB_READ_WRITE_TOKEN is missing!')
      }
      console.log('[storage-driver] Initializing Vercel Blob Storage driver')
      _driver = new VercelBlobStorageDriver()
      break
    case 's3':
      console.log('[storage-driver] Initializing S3 Storage driver')
      _driver = new S3StorageDriver()
      break
    case 'local':
    default:
      console.log(`[storage-driver] Initializing Local Storage driver (STORAGE_DRIVER=${driverType})`)
      _driver = new LocalStorageDriver()
      break
  }

  return _driver
}
