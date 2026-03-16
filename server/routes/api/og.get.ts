import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

/**
 * Serves locale-aware OG images.
 *
 * GET /api/og?lang=de  → German OG image (default)
 * GET /api/og?lang=en  → English OG image
 *
 * Returns the pre-generated PNG with aggressive caching headers.
 * Social media crawlers use this URL in og:image meta tags.
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const lang = (query.lang as string) || 'de'

  const filename = lang === 'en' ? 'og-image-en.png' : 'og-image.png'

  // Resolve from the public directory
  const filePath = resolve(process.cwd(), 'public', filename)

  // Fallback to .output/public for production builds
  const outputPath = resolve(process.cwd(), '.output', 'public', filename)

  const resolvedPath = existsSync(filePath) ? filePath : existsSync(outputPath) ? outputPath : null

  if (!resolvedPath) {
    throw createError({ statusCode: 404, message: `OG image not found: ${filename}` })
  }

  const image = readFileSync(resolvedPath)

  setHeaders(event, {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    'Content-Length': String(image.length)
  })

  return image
})
