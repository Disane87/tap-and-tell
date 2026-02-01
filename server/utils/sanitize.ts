/**
 * Input sanitization utilities for server-side use.
 * Provides HTML stripping, text sanitization, entry input cleaning,
 * photo MIME type validation, and tenant name sanitization.
 */

/**
 * Removes all HTML tags from a string using regex replacement.
 * Also strips HTML entities (e.g., &lt; &gt; &amp; &#123; &#x1A;).
 * Handles nested tags, self-closing tags, and malformed tags.
 *
 * @param input - The string potentially containing HTML tags and entities
 * @returns The string with all HTML tags and entities removed
 */
export function stripHtmlTags(input: string): string {
  // Remove HTML comments first
  let result = input.replace(/<!--[\s\S]*?-->/g, '')

  // Remove all HTML tags (including self-closing, nested, and malformed)
  result = result.replace(/<\/?[^>]+(>|$)/g, '')

  // Remove named HTML entities (e.g., &lt; &gt; &amp; &nbsp; &quot;)
  result = result.replace(/&[a-zA-Z]+;/g, '')

  // Remove numeric HTML entities (e.g., &#123; &#x1A;)
  result = result.replace(/&#x?[0-9a-fA-F]+;/g, '')

  return result
}

/**
 * Sanitizes a text string by stripping HTML tags, trimming whitespace,
 * and collapsing multiple consecutive whitespace characters into single spaces.
 *
 * @param input - The raw text string to sanitize
 * @returns The cleaned text string
 */
export function sanitizeText(input: string): string {
  const stripped = stripHtmlTags(input)
  const trimmed = stripped.trim()
  const collapsed = trimmed.replace(/\s+/g, ' ')
  return collapsed
}

/**
 * Recursively sanitizes all string values within an object or array.
 * Non-string primitive values are returned as-is. Objects and arrays
 * are traversed recursively.
 *
 * @param value - The value to sanitize
 * @returns The value with all nested string values sanitized
 */
function sanitizeDeep(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeText(value)
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeDeep(item))
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = sanitizeDeep(val)
    }
    return result
  }

  return value
}

/**
 * Sanitizes all text fields in a guest entry input object.
 * The `name` and `message` fields are sanitized directly.
 * If `answers` is provided, all string values within it are recursively sanitized.
 *
 * @param input - The guest entry input containing name, message, and optional answers
 * @returns A new object with all text fields sanitized
 */
export function sanitizeEntryInput(input: {
  name: string
  message: string
  answers?: Record<string, unknown>
}): {
  name: string
  message: string
  answers?: Record<string, unknown>
} {
  const result: {
    name: string
    message: string
    answers?: Record<string, unknown>
  } = {
    name: sanitizeText(input.name),
    message: sanitizeText(input.message),
  }

  if (input.answers !== undefined) {
    result.answers = sanitizeDeep(input.answers) as Record<string, unknown>
  }

  return result
}

/**
 * Validates that base64-encoded photo data represents a supported image type
 * by decoding and inspecting magic bytes.
 *
 * Supported image types and their magic bytes:
 * - JPEG: FF D8 FF
 * - PNG: 89 50 4E 47
 * - WebP: 52 49 46 46 (RIFF) at offset 0 + 57 45 42 50 (WEBP) at offset 8
 * - HEIC: 66 74 79 70 (ftyp) at offset 4
 *
 * @param base64Data - The base64-encoded image data, optionally prefixed with a data URI scheme
 * @returns An object with `valid` indicating whether the data is a supported image, and `mimeType` containing the detected MIME type or null
 */
export function validatePhotoMimeType(base64Data: string): {
  valid: boolean
  mimeType: string | null
} {
  // Strip the data URI prefix if present (e.g., "data:image/png;base64,")
  const raw = base64Data.replace(/^data:[^;]+;base64,/, '')

  let bytes: Uint8Array
  try {
    const buffer = Buffer.from(raw, 'base64')
    bytes = new Uint8Array(buffer)
  }
  catch {
    return { valid: false, mimeType: null }
  }

  if (bytes.length < 12) {
    return { valid: false, mimeType: null }
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return { valid: true, mimeType: 'image/jpeg' }
  }

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return { valid: true, mimeType: 'image/png' }
  }

  // WebP: RIFF at offset 0 + WEBP at offset 8
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { valid: true, mimeType: 'image/webp' }
  }

  // HEIC: ftyp at offset 4
  if (
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  ) {
    return { valid: true, mimeType: 'image/heic' }
  }

  return { valid: false, mimeType: null }
}

/**
 * Sanitizes a tenant or guestbook name.
 * Strips HTML tags, trims whitespace, and truncates to a maximum of 200 characters.
 *
 * @param name - The raw tenant or guestbook name
 * @returns The sanitized name, at most 200 characters long
 */
export function sanitizeTenantName(name: string): string {
  const cleaned = sanitizeText(name)
  return cleaned.slice(0, 200)
}
