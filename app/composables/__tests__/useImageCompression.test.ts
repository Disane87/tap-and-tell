/**
 * Unit tests for useImageCompression composable.
 *
 * Since canvas and Image are browser-only APIs, we test:
 * - Initial state values (isCompressing, compressionProgress)
 * - compressImage with mocked browser APIs (Image, canvas, URL.createObjectURL)
 * - Error handling when canvas context is unavailable
 *
 * The internal pure functions (calculateDimensions, getBase64Size) are tested
 * indirectly through compressImage behavior with mocked canvas.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, computed } from 'vue'

// Mock Vue auto-imports
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

// Import after mocks
import { useImageCompression } from '../useImageCompression'

describe('useImageCompression', () => {
  describe('initial state', () => {
    it('should have isCompressing set to false', () => {
      const { isCompressing } = useImageCompression()
      expect(isCompressing.value).toBe(false)
    })

    it('should have compressionProgress set to 0', () => {
      const { compressionProgress } = useImageCompression()
      expect(compressionProgress.value).toBe(0)
    })
  })

  describe('return value structure', () => {
    it('should return compressImage, compressToFile, isCompressing, and compressionProgress', () => {
      const result = useImageCompression()

      expect(result).toHaveProperty('compressImage')
      expect(result).toHaveProperty('compressToFile')
      expect(result).toHaveProperty('isCompressing')
      expect(result).toHaveProperty('compressionProgress')
      expect(typeof result.compressImage).toBe('function')
      expect(typeof result.compressToFile).toBe('function')
    })
  })

  describe('compressImage with mocked browser APIs', () => {
    let mockCtx: {
      imageSmoothingEnabled: boolean
      imageSmoothingQuality: string
      drawImage: ReturnType<typeof vi.fn>
    }
    let mockCanvas: {
      width: number
      height: number
      getContext: ReturnType<typeof vi.fn>
      toDataURL: ReturnType<typeof vi.fn>
    }

    beforeEach(() => {
      mockCtx = {
        imageSmoothingEnabled: false,
        imageSmoothingQuality: '',
        drawImage: vi.fn()
      }

      // Create a base64 string small enough to not trigger quality reduction
      // The TARGET_SIZE is 500 * 1024 = 512000 bytes
      // A base64 string of ~100 chars is about 75 bytes
      const smallBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(100)

      mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockCtx),
        toDataURL: vi.fn().mockReturnValue(smallBase64)
      }

      vi.stubGlobal('document', {
        ...globalThis.document,
        createElement: vi.fn().mockReturnValue(mockCanvas)
      })

      vi.stubGlobal('URL', {
        createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
        revokeObjectURL: vi.fn()
      })

      // Mock Image constructor
      vi.stubGlobal('Image', class MockImage {
        width = 800
        height = 600
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null

        constructor() {
          // Simulate async image load
          setTimeout(() => {
            if (this.onload) this.onload()
          }, 0)
        }
      })
    })

    it('should set isCompressing to true during compression', async () => {
      const { compressImage, isCompressing } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const promise = compressImage(file)
      // isCompressing should be true immediately after calling
      expect(isCompressing.value).toBe(true)

      await promise
      // Should be false after completion
      expect(isCompressing.value).toBe(false)
    })

    it('should return a data URL string', async () => {
      const { compressImage } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const result = await compressImage(file)
      expect(result).toContain('data:image/jpeg;base64,')
    })

    it('should set compressionProgress to 100 after completion', async () => {
      const { compressImage, compressionProgress } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await compressImage(file)
      expect(compressionProgress.value).toBe(100)
    })

    it('should reset isCompressing to false even on error', async () => {
      // Make getContext return null to trigger error
      mockCanvas.getContext.mockReturnValue(null)

      const { compressImage, isCompressing } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await expect(compressImage(file)).rejects.toThrow('Could not get canvas context')
      expect(isCompressing.value).toBe(false)
    })

    it('should not resize images smaller than MAX_DIMENSION', async () => {
      // Mock an image that is already small (800x600)
      vi.stubGlobal('Image', class MockImage {
        width = 800
        height = 600
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor() {
          setTimeout(() => { if (this.onload) this.onload() }, 0)
        }
      })

      const { compressImage } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await compressImage(file)

      // Canvas should be set to original dimensions (800x600 < 1920)
      expect(mockCanvas.width).toBe(800)
      expect(mockCanvas.height).toBe(600)
    })

    it('should resize large landscape images proportionally', async () => {
      vi.stubGlobal('Image', class MockImage {
        width = 3840
        height = 2160
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor() {
          setTimeout(() => { if (this.onload) this.onload() }, 0)
        }
      })

      const { compressImage } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await compressImage(file)

      // ratio = min(1920/3840, 1920/2160) = min(0.5, 0.888) = 0.5
      // width = round(3840 * 0.5) = 1920, height = round(2160 * 0.5) = 1080
      expect(mockCanvas.width).toBe(1920)
      expect(mockCanvas.height).toBe(1080)
    })

    it('should resize large portrait images proportionally', async () => {
      vi.stubGlobal('Image', class MockImage {
        width = 2160
        height = 3840
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor() {
          setTimeout(() => { if (this.onload) this.onload() }, 0)
        }
      })

      const { compressImage } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await compressImage(file)

      // ratio = min(1920/2160, 1920/3840) = min(0.888, 0.5) = 0.5
      // width = round(2160 * 0.5) = 1080, height = round(3840 * 0.5) = 1920
      expect(mockCanvas.width).toBe(1080)
      expect(mockCanvas.height).toBe(1920)
    })

    it('should resize large square images proportionally', async () => {
      vi.stubGlobal('Image', class MockImage {
        width = 4000
        height = 4000
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor() {
          setTimeout(() => { if (this.onload) this.onload() }, 0)
        }
      })

      const { compressImage } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await compressImage(file)

      // ratio = min(1920/4000, 1920/4000) = 0.48
      // width = round(4000 * 0.48) = 1920, height = round(4000 * 0.48) = 1920
      expect(mockCanvas.width).toBe(1920)
      expect(mockCanvas.height).toBe(1920)
    })

    it('should reduce quality iteratively if image is too large', async () => {
      // Create a base64 string that represents a large file (> TARGET_SIZE = 1MB).
      // 1024 * 1024 = 1048576 bytes. Base64 expands by 4/3, so we need
      // ~1398101 base64 chars to represent 1048576 bytes.
      const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(1_500_000)
      const smallBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(100)

      let callCount = 0
      mockCanvas.toDataURL.mockImplementation(() => {
        callCount++
        // First call is the WebP-support probe (returns jpeg → unsupported),
        // then the quality-reduction loop runs until a small result is returned.
        if (callCount <= 3) return largeBase64
        return smallBase64
      })

      const { compressImage } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await compressImage(file)

      // toDataURL should be called multiple times due to quality reduction
      expect(mockCanvas.toDataURL.mock.calls.length).toBeGreaterThan(1)
    })

    it('should output WebP when the canvas supports it', async () => {
      const webpBase64 = 'data:image/webp;base64,' + 'A'.repeat(100)
      mockCanvas.toDataURL.mockReturnValue(webpBase64)

      const { compressImage } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const result = await compressImage(file)
      expect(result).toContain('data:image/webp;base64,')
      // The encode call must request WebP, not JPEG.
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/webp', expect.any(Number))
    })

    it('should fall back to JPEG when WebP is not supported', async () => {
      const { compressImage } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      const result = await compressImage(file)
      // Default mock returns a jpeg data URL → WebP probe fails → JPEG output.
      expect(result).toContain('data:image/jpeg;base64,')
    })

    it('should use high quality image smoothing', async () => {
      const { compressImage } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await compressImage(file)

      expect(mockCtx.imageSmoothingEnabled).toBe(true)
      expect(mockCtx.imageSmoothingQuality).toBe('high')
    })

    it('should call drawImage on canvas context', async () => {
      const { compressImage } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await compressImage(file)

      expect(mockCtx.drawImage).toHaveBeenCalledTimes(1)
    })

    it('should honour a custom maxDimension option', async () => {
      vi.stubGlobal('Image', class MockImage {
        width = 3840
        height = 2160
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor() {
          setTimeout(() => { if (this.onload) this.onload() }, 0)
        }
      })

      const { compressImage } = useImageCompression()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      await compressImage(file, { maxDimension: 1000 })

      // ratio = min(1000/3840, 1000/2160) = 0.2604 → width = 1000
      expect(mockCanvas.width).toBe(1000)
    })
  })

  describe('compressToFile', () => {
    let mockCtx: { imageSmoothingEnabled: boolean; imageSmoothingQuality: string; drawImage: ReturnType<typeof vi.fn> }
    let mockCanvas: { width: number; height: number; getContext: ReturnType<typeof vi.fn>; toDataURL: ReturnType<typeof vi.fn> }

    beforeEach(() => {
      mockCtx = { imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage: vi.fn() }
      mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue(mockCtx),
        // Valid base64 payload so atob() in dataUrlToBlob can decode it.
        toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,' + 'A'.repeat(100))
      }
      vi.stubGlobal('document', { ...globalThis.document, createElement: vi.fn().mockReturnValue(mockCanvas) })
      vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:mock-url'), revokeObjectURL: vi.fn() })
      vi.stubGlobal('Image', class MockImage {
        width = 800
        height = 600
        src = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor() {
          setTimeout(() => { if (this.onload) this.onload() }, 0)
        }
      })
    })

    it('should return a File with the source basename and jpeg extension (WebP unsupported)', async () => {
      const { compressToFile } = useImageCompression()
      const file = new File(['test'], 'holiday.png', { type: 'image/png' })

      const result = await compressToFile(file)

      expect(result).toBeInstanceOf(File)
      expect(result.type).toBe('image/jpeg')
      expect(result.name).toBe('holiday.jpg')
      expect(result.size).toBeGreaterThan(0)
    })

    it('should produce a WebP File when the canvas supports WebP', async () => {
      mockCanvas.toDataURL.mockReturnValue('data:image/webp;base64,' + 'A'.repeat(100))

      const { compressToFile } = useImageCompression()
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

      const result = await compressToFile(file)

      expect(result.type).toBe('image/webp')
      expect(result.name).toBe('photo.webp')
    })
  })
})
