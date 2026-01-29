import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS class names using `clsx` and `tailwind-merge`.
 * @param inputs - Class values to merge (strings, arrays, objects).
 * @returns The merged class string with Tailwind conflicts resolved.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
