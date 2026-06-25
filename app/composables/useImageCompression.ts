/**
 * Composable for client-side image compression.
 *
 * Decodes any image the browser/OS can hand us — including iPhone HEIC/HEIF
 * (converted on the fly via heic2any) — fixes EXIF orientation, resizes large
 * images, and encodes to WebP (falling back to JPEG when WebP encoding is not
 * available) under a target file size. This guarantees that virtually any photo
 * a guest picks can be uploaded, regardless of source format or size.
 */
export function useImageCompression() {
  const isCompressing = ref(false)
  const compressionProgress = ref(0)

  /**
   * Maximum dimension for resized images (width or height) in pixels.
   * 1920px keeps photos crisp on a TV slideshow while staying lightweight.
   */
  const MAX_DIMENSION = 1920

  /**
   * Initial encoder quality (0-1). WebP at 0.82 is visually near-lossless
   * for photos while producing small files.
   */
  const INITIAL_QUALITY = 0.82

  /**
   * Lowest quality we are willing to drop to before accepting the result.
   */
  const MIN_QUALITY = 0.4

  /**
   * Target maximum file size in bytes (~1 MB). Generous enough for slideshow
   * quality; storage cost on Vercel Blob is negligible.
   */
  const TARGET_SIZE = 1024 * 1024

  /**
   * Compresses an image file to a smaller base64 data URL.
   *
   * @param file - The image file to compress (any browser-pickable format).
   * @returns Promise resolving to a compressed base64 data URL (WebP or JPEG).
   * @throws If the image cannot be decoded or the canvas is unavailable.
   */
  async function compressImage(file: File): Promise<string> {
    isCompressing.value = true
    compressionProgress.value = 0

    try {
      // iPhone HEIC/HEIF cannot be decoded by most browsers — convert first.
      const decodable = await ensureDecodable(file)
      compressionProgress.value = 20

      // Decode the image, respecting EXIF orientation where supported.
      const source = await decodeImage(decodable)
      compressionProgress.value = 50

      const { width, height } = calculateDimensions(
        sourceWidth(source),
        sourceHeight(source),
        MAX_DIMENSION
      )

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(source as CanvasImageSource, 0, 0, width, height)

      // Release decoded bitmap memory where supported (ImageBitmap only).
      if (typeof (source as ImageBitmap).close === 'function') {
        (source as ImageBitmap).close()
      }
      compressionProgress.value = 70

      // Prefer WebP for better size/quality; fall back to JPEG when needed.
      const mimeType = supportsWebp(canvas) ? 'image/webp' : 'image/jpeg'

      let quality = INITIAL_QUALITY
      let dataUrl = canvas.toDataURL(mimeType, quality)

      // If still too large, reduce quality iteratively.
      while (getBase64Size(dataUrl) > TARGET_SIZE && quality > MIN_QUALITY) {
        quality = Math.round((quality - 0.1) * 100) / 100
        dataUrl = canvas.toDataURL(mimeType, quality)
      }

      compressionProgress.value = 100
      return dataUrl
    } finally {
      isCompressing.value = false
    }
  }

  /**
   * Detects whether a file is in Apple's HEIC/HEIF container.
   *
   * Some browsers report an empty MIME type for HEIC, so we also check the
   * file extension as a fallback.
   *
   * @param file - The file to inspect.
   * @returns True if the file is HEIC/HEIF.
   */
  function isHeic(file: File): boolean {
    const type = file.type.toLowerCase()
    if (type === 'image/heic' || type === 'image/heif') return true
    return /\.(heic|heif)$/i.test(file.name)
  }

  /**
   * Ensures the given file is in a format the browser can decode onto a canvas.
   *
   * HEIC/HEIF images are converted to JPEG via heic2any (lazily imported so the
   * libheif WASM payload only loads when a HEIC file is actually selected).
   *
   * @param file - The original file.
   * @returns A blob the browser can decode.
   */
  async function ensureDecodable(file: File): Promise<Blob> {
    if (!isHeic(file)) return file

    const mod = await import('heic2any')
    const heic2any = (mod as unknown as { default?: typeof import('heic2any') }).default ?? mod
    const converted = await (heic2any as unknown as (opts: {
      blob: Blob
      toType?: string
      quality?: number
    }) => Promise<Blob | Blob[]>)({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92
    })

    return Array.isArray(converted) ? converted[0]! : converted
  }

  /**
   * Decodes a blob into a drawable image source.
   *
   * Prefers `createImageBitmap` (faster, off-main-thread, honours EXIF
   * orientation) and falls back to an `<img>` element when unavailable.
   *
   * @param blob - The image blob to decode.
   * @returns A drawable ImageBitmap or HTMLImageElement.
   */
  async function decodeImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
    if (typeof createImageBitmap === 'function') {
      try {
        return await createImageBitmap(blob, { imageOrientation: 'from-image' })
      } catch {
        // Fall through to the <img> decoder below.
      }
    }
    return loadImage(blob)
  }

  /**
   * Loads a blob into an HTMLImageElement.
   *
   * @param blob - The blob to load.
   * @returns Promise resolving to the loaded image.
   */
  function loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(blob)
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }
      img.src = url
    })
  }

  /**
   * Reads the intrinsic width of a decoded image source.
   */
  function sourceWidth(source: ImageBitmap | HTMLImageElement): number {
    return source.width
  }

  /**
   * Reads the intrinsic height of a decoded image source.
   */
  function sourceHeight(source: ImageBitmap | HTMLImageElement): number {
    return source.height
  }

  /**
   * Detects whether the canvas can actually encode WebP.
   *
   * Some older engines silently fall back to PNG when asked for WebP, so we
   * verify the returned data URL's MIME type rather than trusting the request.
   *
   * @param canvas - A canvas element to probe.
   * @returns True if WebP encoding is supported.
   */
  function supportsWebp(canvas: HTMLCanvasElement): boolean {
    try {
      return canvas.toDataURL('image/webp', 0.5).startsWith('data:image/webp')
    } catch {
      return false
    }
  }

  /**
   * Calculates new dimensions while maintaining aspect ratio.
   *
   * @param width - Original width.
   * @param height - Original height.
   * @param maxDim - Maximum dimension allowed.
   * @returns Object with new width and height.
   */
  function calculateDimensions(
    width: number,
    height: number,
    maxDim: number
  ): { width: number; height: number } {
    if (width <= maxDim && height <= maxDim) {
      return { width, height }
    }

    const ratio = Math.min(maxDim / width, maxDim / height)
    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio)
    }
  }

  /**
   * Estimates the byte size of a base64 data URL.
   *
   * @param dataUrl - The data URL to measure.
   * @returns Approximate size in bytes.
   */
  function getBase64Size(dataUrl: string): number {
    // Remove the data:image/...;base64, prefix
    const base64 = dataUrl.split(',')[1] || ''
    // Base64 encodes 3 bytes as 4 characters
    return Math.round((base64.length * 3) / 4)
  }

  return {
    compressImage,
    isCompressing,
    compressionProgress
  }
}
