import { describe, it, expect } from 'vitest'
import {
  isCrawlerUserAgent,
  getGuestbookShareMeta,
  renderShareHtml,
  type ShareGuestbook
} from '../share-meta'

const ORIGIN = 'https://guestbook.example.com'

function makeGuestbook(settings: ShareGuestbook['settings'] = {}): ShareGuestbook {
  return { id: 'gb123', name: 'Anna & Tom', settings }
}

describe('isCrawlerUserAgent', () => {
  it('detects common social crawlers (case-insensitive)', () => {
    const crawlers = [
      'facebookexternalhit/1.1',
      'Twitterbot/1.0',
      'WhatsApp/2.23',
      'LinkedInBot/1.0',
      'TelegramBot (like TwitterBot)',
      'Discordbot/2.0',
      'Slackbot-LinkExpanding 1.0',
      'Mozilla/5.0 (compatible; Googlebot/2.1)'
    ]
    for (const ua of crawlers) {
      expect(isCrawlerUserAgent(ua), ua).toBe(true)
    }
  })

  it('returns false for regular browsers', () => {
    expect(
      isCrawlerUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
      )
    ).toBe(false)
  })

  it('returns false for empty/undefined user agents', () => {
    expect(isCrawlerUserAgent(undefined)).toBe(false)
    expect(isCrawlerUserAgent('')).toBe(false)
    expect(isCrawlerUserAgent(null)).toBe(false)
  })
})

describe('getGuestbookShareMeta — fallback chains', () => {
  it('prefers explicit share settings when present', () => {
    const meta = getGuestbookShareMeta(
      makeGuestbook({
        shareTitle: 'Custom Title',
        shareDescription: 'Custom Description',
        shareImageUrl: '/api/photos/gb123/share.jpg.enc?v=1'
      }),
      ORIGIN
    )
    expect(meta.title).toBe('Custom Title')
    expect(meta.description).toBe('Custom Description')
    expect(meta.image).toBe(`${ORIGIN}/api/photos/gb123/share.jpg.enc?v=1`)
    expect(meta.url).toBe(`${ORIGIN}/g/gb123`)
  })

  it('falls back title → name, description → welcomeMessage', () => {
    const meta = getGuestbookShareMeta(
      makeGuestbook({ welcomeMessage: 'Leave us a note!' }),
      ORIGIN
    )
    expect(meta.title).toBe('Anna & Tom')
    expect(meta.description).toBe('Leave us a note!')
  })

  it('falls back image: shareImage → headerImage → backgroundImage → global OG', () => {
    expect(getGuestbookShareMeta(makeGuestbook({ headerImageUrl: '/api/photos/gb123/header.png' }), ORIGIN).image)
      .toBe(`${ORIGIN}/api/photos/gb123/header.png`)

    expect(getGuestbookShareMeta(makeGuestbook({ backgroundImageUrl: '/api/photos/gb123/bg.png' }), ORIGIN).image)
      .toBe(`${ORIGIN}/api/photos/gb123/bg.png`)

    // A background colour (hex) is NOT an image and must not be used.
    expect(getGuestbookShareMeta(makeGuestbook({ backgroundColor: '#ff0000' } as never), ORIGIN).image)
      .toBe(`${ORIGIN}/api/og?lang=de`)

    expect(getGuestbookShareMeta(makeGuestbook({}), ORIGIN).image)
      .toBe(`${ORIGIN}/api/og?lang=de`)
  })

  it('uses site defaults when name and settings are empty', () => {
    const meta = getGuestbookShareMeta({ id: 'x', name: '', settings: {} }, ORIGIN)
    expect(meta.title).toBe('Tap & Tell')
    expect(meta.description.length).toBeGreaterThan(0)
  })

  it('keeps absolute image URLs unchanged', () => {
    const meta = getGuestbookShareMeta(
      makeGuestbook({ shareImageUrl: 'https://cdn.example.com/img.jpg' }),
      ORIGIN
    )
    expect(meta.image).toBe('https://cdn.example.com/img.jpg')
  })

  it('respects language for the global OG fallback and locale', () => {
    const de = getGuestbookShareMeta(makeGuestbook({}), ORIGIN, 'de')
    const en = getGuestbookShareMeta(makeGuestbook({}), ORIGIN, 'en')
    expect(de.image).toBe(`${ORIGIN}/api/og?lang=de`)
    expect(de.locale).toBe('de_DE')
    expect(en.image).toBe(`${ORIGIN}/api/og?lang=en`)
    expect(en.locale).toBe('en_US')
  })

  it('trims whitespace-only share fields and falls through', () => {
    const meta = getGuestbookShareMeta(
      makeGuestbook({ shareTitle: '   ', shareDescription: '\n' }),
      ORIGIN
    )
    expect(meta.title).toBe('Anna & Tom')
  })

  it('normalizes a trailing slash on the origin', () => {
    const meta = getGuestbookShareMeta(makeGuestbook({}), `${ORIGIN}/`)
    expect(meta.url).toBe(`${ORIGIN}/g/gb123`)
  })
})

describe('renderShareHtml', () => {
  it('embeds resolved OG and Twitter tags', () => {
    const html = renderShareHtml(getGuestbookShareMeta(makeGuestbook({ welcomeMessage: 'Hi' }), ORIGIN))
    expect(html).toContain('<meta property="og:title" content="Anna &amp; Tom">')
    expect(html).toContain('<meta property="og:description" content="Hi">')
    expect(html).toContain(`<meta property="og:url" content="${ORIGIN}/g/gb123">`)
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">')
    expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${ORIGIN}/g/gb123">`)
  })

  it('escapes HTML/attribute-breaking characters to prevent injection', () => {
    const meta = getGuestbookShareMeta(
      { id: 'gb123', name: '"><script>alert(1)</script>', settings: {} },
      ORIGIN
    )
    const html = renderShareHtml(meta)
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&quot;&gt;')
  })
})
