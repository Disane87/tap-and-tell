/**
 * Centralized image size configuration.
 *
 * All image-related size limits are configured via environment variables
 * with sensible defaults. Sizes are in bytes unless otherwise noted.
 */

/**
 * Parses a size string (e.g., "5MB", "500KB", "1024") into bytes.
 * Supports: B, KB, MB, GB suffixes (case-insensitive).
 *
 * @param value - The size string or number to parse.
 * @param defaultValue - Default value in bytes if parsing fails.
 * @returns Size in bytes.
 */
function parseSize(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue

  const trimmed = value.trim().toUpperCase()
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/)

  if (!match) return defaultValue

  const num = parseFloat(match[1])
  const unit = match[2] || 'B'

  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024
  }

  return Math.round(num * (multipliers[unit] || 1))
}

/**
 * Maximum photo size for guestbook entries (Base64-encoded).
 * Base64 encoding increases size by ~33%, so actual file limit is roughly 75% of this.
 * Default: 7MB (allows ~5MB actual file size).
 *
 * Environment variable: IMAGE_MAX_PHOTO_SIZE
 */
export const MAX_PHOTO_SIZE = parseSize(
  process.env.IMAGE_MAX_PHOTO_SIZE,
  7 * 1024 * 1024
)

/**
 * Maximum avatar file size for user profile images.
 * Default: 5MB.
 *
 * Environment variable: IMAGE_MAX_AVATAR_SIZE
 */
export const MAX_AVATAR_SIZE = parseSize(
  process.env.IMAGE_MAX_AVATAR_SIZE,
  5 * 1024 * 1024
)

/**
 * Maximum background image file size for guestbooks.
 * Default: 5MB.
 *
 * Environment variable: IMAGE_MAX_BACKGROUND_SIZE
 */
export const MAX_BACKGROUND_SIZE = parseSize(
  process.env.IMAGE_MAX_BACKGROUND_SIZE,
  5 * 1024 * 1024
)

/**
 * Formats a byte size into a human-readable string.
 *
 * @param bytes - Size in bytes.
 * @returns Human-readable size string (e.g., "5 MB").
 */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}

/**
 * Calculates the approximate decoded size from a Base64 string length.
 * Base64 encodes 3 bytes as 4 characters.
 *
 * @param base64Length - Length of the Base64-encoded string.
 * @returns Approximate decoded size in bytes.
 */
export function estimateDecodedSize(base64Length: number): number {
  return Math.round((base64Length * 3) / 4)
}
