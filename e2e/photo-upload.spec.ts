import { test, expect } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * E2E coverage for the guest photo upload pipeline.
 *
 * Verifies:
 *  - POST /api/g/:id/entries accepts a base64 photo and returns 200.
 *  - The persisted file on disk is NOT the original plaintext bytes
 *    (i.e. AES-256-GCM encryption did happen).
 *  - Validation rejects an oversized photo (> 5 MB) and a wrong MIME type.
 *
 * Note: the spec runs against the dev-seeded permanent guestbook
 * `dev00000gb01`. Photos land at `.data/photos/dev00000gb01/<entryId>.<ext>`.
 */

const GUESTBOOK_ID = 'dev00000gb01'

// Minimal 1×1 JPEG (valid SOI/EOI markers + JFIF). 125 bytes.
const TINY_JPEG_B64 =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/AAH/9k='

test.describe('Guest entry — photo upload', () => {
  test('accepts a small JPEG and persists an encrypted file', async ({ request }) => {
    const res = await request.post(`/api/g/${GUESTBOOK_ID}/entries`, {
      data: {
        name: 'E2E Photo Uploader',
        message: 'Hello from the photo-upload spec',
        photo: TINY_JPEG_B64,
      },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBeTruthy()

    // The dev server stores photos under .data/photos/<guestbookId>/<entryId>.<ext>
    // relative to the SaaS root. We resolve from this spec file's parent.
    // Photos live under <saas-root>/.data/photos/<guestbookId>/<entryId>.<ext>.
    // Playwright runs from the SaaS root, so we resolve relative to it.
    const dataDir = process.env.DATA_DIR || '.data'
    // Encrypted photos use a `.enc` suffix on top of the original extension.
    const candidates = ['jpg', 'jpeg', 'png', 'webp'].flatMap((ext) => [
      resolve(process.cwd(), dataDir, 'photos', GUESTBOOK_ID, `${body.data.id}.${ext}.enc`),
      resolve(process.cwd(), dataDir, 'photos', GUESTBOOK_ID, `${body.data.id}.${ext}`),
    ])
    const found = candidates.find((p) => existsSync(p))
    expect(found, `expected an encrypted photo file at one of ${candidates.join(', ')}`).toBeTruthy()

    // Encrypted bytes must NOT start with the JPEG SOI marker (FF D8 FF).
    const bytes = readFileSync(found!)
    expect(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff).toBeFalsy()
    expect(bytes.length).toBeGreaterThan(0)
  })

  test('rejects payload > 5 MB', async ({ request }) => {
    // 7 MB base64 string of A's — passes the simple length check by being > 7_000_000.
    const huge = 'data:image/jpeg;base64,' + 'A'.repeat(7_000_001)
    const res = await request.post(`/api/g/${GUESTBOOK_ID}/entries`, {
      data: { name: 'Too Big', message: 'oversized', photo: huge },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(400)
  })

  test('rejects an invalid MIME type', async ({ request }) => {
    // Valid-looking data URI but content is not a real JPEG/PNG/WebP.
    const fake = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
    const res = await request.post(`/api/g/${GUESTBOOK_ID}/entries`, {
      data: { name: 'Wrong Mime', message: 'bad type', photo: fake },
      failOnStatusCode: false,
    })
    expect(res.status()).toBe(400)
  })
})
