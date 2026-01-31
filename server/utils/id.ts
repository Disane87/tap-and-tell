import { nanoid } from 'nanoid'

/**
 * Generates a URL-safe unique ID using nanoid.
 * Default length is 12 characters (62^12 ~ 3.2x10^21 combinations).
 *
 * @param length - The desired ID length. Defaults to 12.
 * @returns A random URL-safe string.
 */
export function generateId(length = 12): string {
  return nanoid(length)
}
