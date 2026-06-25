import { describe, it, expect } from 'vitest'
import { processBase64MediaUpload } from '../upload'

/** Builds a base64 data URL from a byte array, padded to at least 12 bytes. */
function dataUrl(mime: string, bytes: number[]): string {
  const padded = bytes.length >= 12 ? bytes : [...bytes, ...new Array(12 - bytes.length).fill(0)]
  return `data:${mime};base64,${Buffer.from(Uint8Array.from(padded)).toString('base64')}`
}

const VALID_JPEG = [0xFF, 0xD8, 0xFF, 0xE0]
const BASE_OPTIONS = { directory: 'photos/test', filePrefix: 'entry-0', urlPrefix: '/api/photos/test' }

/**
 * Unit tests for the media upload validation/branching paths. The happy path
 * (which writes to storage) is covered by integration tests; here we assert the
 * guard rails that run before any file is written.
 */
describe('processBase64MediaUpload', () => {
  it('returns undefined for a non-data-URL string', async () => {
    expect(await processBase64MediaUpload('not-a-data-url', BASE_OPTIONS)).toBeUndefined()
  })

  it('returns undefined for a non-image/video data URL', async () => {
    expect(await processBase64MediaUpload('data:text/plain;base64,AAAAAAAAAAAA', BASE_OPTIONS)).toBeUndefined()
  })

  it('throws when the declared type does not match the actual magic bytes', async () => {
    const url = dataUrl('image/png', [0x00, 0x01, 0x02, 0x03])
    await expect(processBase64MediaUpload(url, BASE_OPTIONS)).rejects.toThrow('Unsupported media format')
  })

  it('throws when the file exceeds the size cap', async () => {
    const url = dataUrl('image/jpeg', [...VALID_JPEG, ...new Array(16).fill(0)])
    await expect(
      processBase64MediaUpload(url, { ...BASE_OPTIONS, maxSize: 10 })
    ).rejects.toThrow('File too large')
  })

  it('throws when encryption is requested without a tenantId', async () => {
    const url = dataUrl('image/jpeg', VALID_JPEG)
    await expect(
      processBase64MediaUpload(url, { ...BASE_OPTIONS, encrypt: true })
    ).rejects.toThrow('tenantId is required')
  })
})
