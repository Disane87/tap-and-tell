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

  it('rejects invalid data', () => {
    const result = validatePhotoMimeType('not-valid-base64!!!')
    expect(result.valid).toBe(false)
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
