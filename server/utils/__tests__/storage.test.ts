import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getPhotoMimeType } from '../storage'

/**
 * Unit tests for storage utilities.
 * Tests MIME type detection and path handling.
 * Note: Database operations are tested in integration tests.
 */
describe('storage utilities', () => {
  describe('getPhotoMimeType', () => {
    it('should return correct MIME type for JPEG files', () => {
      expect(getPhotoMimeType('photo.jpg')).toBe('image/jpeg')
      expect(getPhotoMimeType('photo.jpeg')).toBe('image/jpeg')
      expect(getPhotoMimeType('PHOTO.JPG')).toBe('image/jpeg')
      expect(getPhotoMimeType('Photo.JPEG')).toBe('image/jpeg')
    })

    it('should return correct MIME type for PNG files', () => {
      expect(getPhotoMimeType('photo.png')).toBe('image/png')
      expect(getPhotoMimeType('PHOTO.PNG')).toBe('image/png')
    })

    it('should return correct MIME type for GIF files', () => {
      expect(getPhotoMimeType('animation.gif')).toBe('image/gif')
      expect(getPhotoMimeType('IMAGE.GIF')).toBe('image/gif')
    })

    it('should return correct MIME type for WebP files', () => {
      expect(getPhotoMimeType('photo.webp')).toBe('image/webp')
      expect(getPhotoMimeType('IMAGE.WEBP')).toBe('image/webp')
    })

    it('should return octet-stream for unknown extensions', () => {
      expect(getPhotoMimeType('file.unknown')).toBe('application/octet-stream')
      expect(getPhotoMimeType('file.bmp')).toBe('application/octet-stream')
      expect(getPhotoMimeType('file.tiff')).toBe('application/octet-stream')
      expect(getPhotoMimeType('noextension')).toBe('application/octet-stream')
    })

    it('should handle encrypted file extensions (.enc)', () => {
      expect(getPhotoMimeType('photo.jpg.enc')).toBe('image/jpeg')
      expect(getPhotoMimeType('photo.png.enc')).toBe('image/png')
      expect(getPhotoMimeType('photo.gif.enc')).toBe('image/gif')
      expect(getPhotoMimeType('photo.webp.enc')).toBe('image/webp')
    })

    it('should handle files with multiple dots', () => {
      expect(getPhotoMimeType('my.photo.name.jpg')).toBe('image/jpeg')
      expect(getPhotoMimeType('2024.01.15.photo.png')).toBe('image/png')
    })

    it('should handle filenames with paths', () => {
      expect(getPhotoMimeType('photos/guestbook/photo.jpg')).toBe('image/jpeg')
      expect(getPhotoMimeType('/api/photos/abc123/photo.png.enc')).toBe('image/png')
    })
  })
})
