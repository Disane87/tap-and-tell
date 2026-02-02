import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs'
import { dirname } from 'path'

/**
 * Interface for storage backends (local filesystem, S3, etc.).
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
}

/** Singleton storage driver instance. */
let _driver: StorageDriver | null = null

/**
 * Returns the configured storage driver instance.
 *
 * Reads the STORAGE_DRIVER environment variable (default: 'local').
 * Creates a singleton instance on first call.
 *
 * @returns The storage driver.
 */
export function getStorageDriver(): StorageDriver {
  if (_driver) return _driver

  const driverType = process.env.STORAGE_DRIVER || 'local'

  switch (driverType) {
    case 's3':
      _driver = new S3StorageDriver()
      break
    case 'local':
    default:
      _driver = new LocalStorageDriver()
      break
  }

  return _driver
}
