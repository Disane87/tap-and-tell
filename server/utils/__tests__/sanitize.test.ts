import { describe, it, expect } from 'vitest'
import { stripHtmlTags, sanitizeText, sanitizeEntryInput, validatePhotoMimeType, sanitizeTenantName } from '../sanitize'

describe('stripHtmlTags', () => {
  it('removes simple HTML tags', () => {
    expect(stripHtmlTags('<b>bold</b>')).toBe('bold')
  })

  it('removes self-closing tags', () => {
    expect(stripHtmlTags('before<br/>after')).toBe('beforeafter')
  })

  it('removes HTML comments', () => {
    expect(stripHtmlTags('before<!-- comment -->after')).toBe('beforeafter')
  })

  it('removes named HTML entities', () => {
    expect(stripHtmlTags('&lt;script&gt;')).toBe('script')
  })

  it('removes numeric HTML entities', () => {
    expect(stripHtmlTags('&#60;test&#62;')).toBe('test')
  })

  it('handles nested tags', () => {
    expect(stripHtmlTags('<div><p>text</p></div>')).toBe('text')
  })
})

describe('sanitizeText', () => {
  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello')
  })

  it('collapses multiple spaces', () => {
    expect(sanitizeText('hello    world')).toBe('hello world')
  })

  it('strips HTML and trims', () => {
    expect(sanitizeText('  <b>hello</b>  ')).toBe('hello')
  })
})

describe('sanitizeEntryInput', () => {
  it('sanitizes name and message', () => {
    const result = sanitizeEntryInput({
      name: '<script>alert("xss")</script>John',
      message: '<p>Hello</p>'
    })
    expect(result.name).toBe('alert("xss")John')
    expect(result.message).toBe('Hello')
  })

  it('deep sanitizes answers', () => {
    const result = sanitizeEntryInput({
      name: 'John',
      message: 'Hi',
      answers: { color: '<b>red</b>', nested: { song: '<i>test</i>' } }
    })
    expect(result.answers?.color).toBe('red')
    expect((result.answers?.nested as Record<string, string>).song).toBe('test')
  })

  it('deep sanitizes arrays in answers', () => {
    const result = sanitizeEntryInput({
      name: 'John',
      message: 'Hi',
      answers: { colors: ['<b>red</b>', '<i>blue</i>'] }
    })
    expect(result.answers?.colors).toEqual(['red', 'blue'])
  })

  it('preserves non-string primitives in answers', () => {
    const result = sanitizeEntryInput({
      name: 'John',
      message: 'Hi',
      answers: { count: 42, active: true, empty: null }
    })
    expect(result.answers?.count).toBe(42)
    expect(result.answers?.active).toBe(true)
    expect(result.answers?.empty).toBeNull()
  })

  it('handles deeply nested arrays and objects', () => {
    const result = sanitizeEntryInput({
      name: 'John',
      message: 'Hi',
      answers: {
        nested: {
          items: [
            { name: '<script>bad</script>good' },
            { name: '<p>text</p>' }
          ]
        }
      }
    })
    const nested = result.answers?.nested as Record<string, unknown>
    const items = nested.items as Array<Record<string, string>>
    expect(items[0].name).toBe('badgood')
    expect(items[1].name).toBe('text')
  })

  it('returns result without answers when answers is undefined', () => {
    const result = sanitizeEntryInput({
      name: 'John',
      message: 'Hi'
    })
    expect(result.answers).toBeUndefined()
    expect('answers' in result).toBe(false)
  })
})

describe('validatePhotoMimeType', () => {
  it('validates JPEG magic bytes', () => {
    // FF D8 FF + padding
    const jpegBuffer = Buffer.alloc(12)
    jpegBuffer[0] = 0xFF
    jpegBuffer[1] = 0xD8
    jpegBuffer[2] = 0xFF
    const base64 = jpegBuffer.toString('base64')
    const result = validatePhotoMimeType(base64)
    expect(result.valid).toBe(true)
    expect(result.mimeType).toBe('image/jpeg')
  })

  it('validates PNG magic bytes', () => {
    const pngBuffer = Buffer.alloc(12)
    pngBuffer[0] = 0x89
    pngBuffer[1] = 0x50
    pngBuffer[2] = 0x4E
    pngBuffer[3] = 0x47
    const base64 = pngBuffer.toString('base64')
    const result = validatePhotoMimeType(base64)
    expect(result.valid).toBe(true)
    expect(result.mimeType).toBe('image/png')
  })

  it('validates WebP magic bytes', () => {
    // WebP: RIFF at offset 0 + WEBP at offset 8
    const webpBuffer = Buffer.alloc(12)
    // RIFF
    webpBuffer[0] = 0x52
    webpBuffer[1] = 0x49
    webpBuffer[2] = 0x46
    webpBuffer[3] = 0x46
    // WEBP at offset 8
    webpBuffer[8] = 0x57
    webpBuffer[9] = 0x45
    webpBuffer[10] = 0x42
    webpBuffer[11] = 0x50
    const base64 = webpBuffer.toString('base64')
    const result = validatePhotoMimeType(base64)
    expect(result.valid).toBe(true)
    expect(result.mimeType).toBe('image/webp')
  })

  it('validates HEIC magic bytes', () => {
    // HEIC: ftyp at offset 4
    const heicBuffer = Buffer.alloc(12)
    heicBuffer[4] = 0x66 // f
    heicBuffer[5] = 0x74 // t
    heicBuffer[6] = 0x79 // y
    heicBuffer[7] = 0x70 // p
    const base64 = heicBuffer.toString('base64')
    const result = validatePhotoMimeType(base64)
    expect(result.valid).toBe(true)
    expect(result.mimeType).toBe('image/heic')
  })

  it('rejects data that is too short', () => {
    // Create a buffer with less than 12 bytes
    const shortBuffer = Buffer.alloc(8)
    const base64 = shortBuffer.toString('base64')
    const result = validatePhotoMimeType(base64)
    expect(result.valid).toBe(false)
    expect(result.mimeType).toBeNull()
  })

  it('rejects invalid base64 that throws during decode', () => {
    // A string that would cause Buffer.from to throw or produce invalid output
    // Using a string with invalid base64 characters that may cause issues
    const result = validatePhotoMimeType('!!!invalid-base64$$$')
    expect(result.valid).toBe(false)
    expect(result.mimeType).toBeNull()
  })

  it('rejects unrecognized magic bytes', () => {
    // Valid base64 but unrecognized image format
    const unknownBuffer = Buffer.alloc(12)
    unknownBuffer[0] = 0x00
    unknownBuffer[1] = 0x01
    unknownBuffer[2] = 0x02
    unknownBuffer[3] = 0x03
    const base64 = unknownBuffer.toString('base64')
    const result = validatePhotoMimeType(base64)
    expect(result.valid).toBe(false)
    expect(result.mimeType).toBeNull()
  })

  it('handles data URI prefix', () => {
    const jpegBuffer = Buffer.alloc(12)
    jpegBuffer[0] = 0xFF
    jpegBuffer[1] = 0xD8
    jpegBuffer[2] = 0xFF
    const base64 = `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`
    const result = validatePhotoMimeType(base64)
    expect(result.valid).toBe(true)
  })
})

describe('sanitizeTenantName', () => {
  it('strips HTML and truncates to 200 chars', () => {
    const longName = 'A'.repeat(250)
    expect(sanitizeTenantName(longName).length).toBe(200)
  })

  it('strips HTML tags from name', () => {
    expect(sanitizeTenantName('<script>bad</script>My Guestbook')).toBe('badMy Guestbook')
  })
})
