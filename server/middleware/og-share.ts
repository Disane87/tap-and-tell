/**
 * Open Graph share middleware for guestbook links.
 *
 * The app is a client-only SPA (`ssr: false`), so social-media crawlers — which
 * do not run JavaScript — never see the client-set meta tags. This middleware
 * intercepts crawler requests to public guestbook routes (`/g/:id`,
 * `/g/:id/view`, `/g/:id/slideshow`), loads the guestbook and returns a minimal
 * HTML document with per-guestbook OG/Twitter tags.
 *
 * Real visitors (non-crawler user-agents) fall through untouched and receive the
 * normal SPA, so direct navigation and app behaviour are unaffected.
 */
import { defineEventHandler, getRequestURL, getRequestHeader, getQuery, setResponseHeader } from 'h3'
import { resolveGuestbook } from '~~/server/utils/guestbook-resolver'
import { isCrawlerUserAgent, getGuestbookShareMeta, renderShareHtml } from '~~/server/utils/share-meta'

/** Matches `/g/<id>`, `/g/<id>/view`, `/g/<id>/slideshow` (with optional trailing slash). */
const GUESTBOOK_PATH = /^\/g\/([^/]+)(?:\/(?:view|slideshow))?\/?$/

export default defineEventHandler(async (event) => {
  // Only intercept GET requests.
  if (event.method !== 'GET') return

  const url = getRequestURL(event)
  const match = url.pathname.match(GUESTBOOK_PATH)
  if (!match) return

  // Only intercept known social/messaging crawlers; humans get the SPA.
  const userAgent = getRequestHeader(event, 'user-agent')
  if (!isCrawlerUserAgent(userAgent)) return

  const guestbookId = match[1]
  const guestbook = await resolveGuestbook(guestbookId)
  // Unknown guestbook → fall through to the SPA (which renders its own 404).
  if (!guestbook) return

  // Resolve preview language: ?lang= wins, else Accept-Language, else German.
  const query = getQuery(event)
  const queryLang = typeof query.lang === 'string' ? query.lang.toLowerCase() : undefined
  const acceptLang = (getRequestHeader(event, 'accept-language') || '').toLowerCase()
  const lang: 'de' | 'en' =
    queryLang === 'en' || (!queryLang && acceptLang.startsWith('en')) ? 'en' : 'de'

  const meta = getGuestbookShareMeta(guestbook, url.origin, lang)

  setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
  // Allow social CDNs to cache the preview briefly; previews change rarely.
  setResponseHeader(event, 'cache-control', 'public, max-age=300, s-maxage=600')
  return renderShareHtml(meta, lang)
})
