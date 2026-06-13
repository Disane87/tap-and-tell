/**
 * Open Graph share-meta helpers for guestbook link previews.
 *
 * Because the app runs as a client-only SPA (`ssr: false`), social-media
 * crawlers — which do not execute JavaScript — never see the meta tags set via
 * `useSeoMeta()` on the client. To make shared `/g/:id` links render rich
 * previews, a server middleware intercepts crawler requests and returns a
 * minimal HTML document built from these pure helpers.
 *
 * The module is intentionally free of Nitro auto-imports and I/O so it can be
 * unit-tested in isolation.
 */

/**
 * Global fallback values used when a guestbook has no custom share settings.
 * Mirrors the `siteConfig` defaults in `nuxt.config.ts`.
 */
const SITE_DEFAULTS = {
  name: 'Tap & Tell',
  description:
    'Create memorable digital guestbooks with NFC technology. Perfect for weddings, events, and parties.',
  imagePath: '/api/og'
} as const

/**
 * Minimal shape of a guestbook row needed to build share meta.
 * Kept structural so both the Drizzle row and plain objects satisfy it.
 */
export interface ShareGuestbook {
  id: string
  name: string
  settings?: {
    shareTitle?: string
    shareDescription?: string
    shareImageUrl?: string
    headerImageUrl?: string
    backgroundImageUrl?: string
    welcomeMessage?: string
  } | null
}

/**
 * Resolved Open Graph meta for a guestbook link preview.
 */
export interface ShareMeta {
  /** og:title / twitter:title */
  title: string
  /** og:description / twitter:description */
  description: string
  /** Absolute og:image / twitter:image URL */
  image: string
  /** Canonical og:url */
  url: string
  /** og:locale, e.g. 'de_DE' */
  locale: string
}

/**
 * Known social-media / messaging crawler user-agent fragments. Matched
 * case-insensitively as substrings. These bots fetch the link to build a
 * preview card and do not run JavaScript.
 */
const CRAWLER_UA_FRAGMENTS = [
  'facebookexternalhit',
  'facebookcatalog',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
  'slackbot',
  'slack-imgproxy',
  'pinterest',
  'redditbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'vkshare',
  'w3c_validator',
  'skypeuripreview',
  'google-pagerenderer',
  'googlebot',
  'bingbot',
  'applebot',
  'mastodon',
  'bluesky',
  'iframely'
] as const

/**
 * Returns true if the given user-agent string belongs to a known social /
 * messaging crawler that needs server-rendered OG tags.
 *
 * @param userAgent - The raw `user-agent` request header (may be undefined).
 */
export function isCrawlerUserAgent(userAgent: string | undefined | null): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return CRAWLER_UA_FRAGMENTS.some((fragment) => ua.includes(fragment))
}

/**
 * Turns a possibly-relative image URL into an absolute one using the request
 * origin. Absolute URLs (http/https) and protocol-relative URLs are returned
 * unchanged.
 *
 * @param url - A relative (`/api/photos/...`) or absolute image URL.
 * @param origin - The request origin, e.g. `https://example.com`.
 */
function toAbsoluteUrl(url: string, origin: string): string {
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url
  const path = url.startsWith('/') ? url : `/${url}`
  return `${origin.replace(/\/$/, '')}${path}`
}

/**
 * Resolves the Open Graph meta for a guestbook, applying fallback chains for
 * title, description and image.
 *
 * - **Title:** `shareTitle` → guestbook `name` → site name
 * - **Description:** `shareDescription` → `welcomeMessage` → site description
 * - **Image:** `shareImageUrl` → `headerImageUrl` → `backgroundImageUrl` → global OG image
 * - **URL:** always the canonical `${origin}/g/${id}`
 *
 * @param guestbook - The guestbook with its settings.
 * @param origin - The request origin, e.g. `https://example.com`.
 * @param lang - Preview language, `'de'` (default) or `'en'`.
 */
export function getGuestbookShareMeta(
  guestbook: ShareGuestbook,
  origin: string,
  lang: 'de' | 'en' = 'de'
): ShareMeta {
  const s = guestbook.settings || {}

  const title = firstNonEmpty(s.shareTitle, guestbook.name, SITE_DEFAULTS.name)
  const description = firstNonEmpty(
    s.shareDescription,
    s.welcomeMessage,
    SITE_DEFAULTS.description
  )

  const rawImage = firstNonEmpty(
    s.shareImageUrl,
    s.headerImageUrl,
    // Only use the background image when it is an actual image URL, not a colour.
    isImageUrl(s.backgroundImageUrl) ? s.backgroundImageUrl : undefined,
    `${SITE_DEFAULTS.imagePath}?lang=${lang}`
  )

  return {
    title,
    description,
    image: toAbsoluteUrl(rawImage, origin),
    url: `${origin.replace(/\/$/, '')}/g/${guestbook.id}`,
    locale: lang === 'en' ? 'en_US' : 'de_DE'
  }
}

/** Returns the first defined, non-empty (after trim) string, else the last arg. */
function firstNonEmpty(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim()
  }
  return ''
}

/** Heuristic: treat values that look like paths/URLs as images (vs. hex colours). */
function isImageUrl(value: string | undefined | null): boolean {
  if (!value) return false
  return value.startsWith('/') || /^https?:\/\//i.test(value) || value.startsWith('//')
}

/** Escapes a string for safe interpolation into an HTML attribute value. */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Escapes a string for safe interpolation into HTML text content. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Renders a minimal HTML document carrying the Open Graph / Twitter meta tags
 * for a guestbook share preview.
 *
 * The body shows the title/description (so the response is honest, not cloaked)
 * and a meta-refresh redirect to the real SPA route for any human who lands on
 * it directly.
 *
 * @param meta - Resolved share meta.
 * @param lang - Document language, `'de'` (default) or `'en'`.
 */
export function renderShareHtml(meta: ShareMeta, lang: 'de' | 'en' = 'de'): string {
  const title = escapeAttr(meta.title)
  const description = escapeAttr(meta.description)
  const image = escapeAttr(meta.image)
  const url = escapeAttr(meta.url)

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(meta.title)}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escapeAttr(SITE_DEFAULTS.name)}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="${title}">
<meta property="og:locale" content="${meta.locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${title}">
<meta http-equiv="refresh" content="0; url=${url}">
</head>
<body>
<h1>${escapeHtml(meta.title)}</h1>
<p>${escapeHtml(meta.description)}</p>
<p><a href="${url}">${url}</a></p>
</body>
</html>`
}
