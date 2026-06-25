/**
 * Composable for client-side image compression — the single, central routine
 * through which **every** image upload in the app passes.
 *
 * It decodes any image the browser/OS can hand us — including iPhone HEIC/HEIF
 * (converted on the fly via heic2any) — fixes EXIF orientation, resizes large
 * images, and encodes to WebP (falling back to JPEG when WebP encoding is not
 * available) under a target file size. This guarantees that virtually any photo
 * a guest or owner picks can be uploaded, regardless of source format or size.
 *
 * Two outputs are exposed for the two transport styles used across the app:
 * - {@link compressImage} → a base64 data URL (for JSON request bodies).
 * - {@link compressToFile} → a `File` (for `multipart/form-data` uploads).
 *
 * Both share the exact same compression pipeline, so no upload path can drift.
 */

/**
 * Per-call compression options. All fields are optional and fall back to
 * sensible defaults tuned for guest photos.
 */
export interface CompressOptions {
  /** Maximum dimension (width or height) in pixels. Default 1920. */
  maxDimension?: number
  /** Target maximum output size in bytes. Default ~1 MB. */
  targetSize?: number
  /** Initial encoder quality (0-1). Default 0.82. */
  initialQuality?: number
  /** Lowest quality to drop to before accepting the result. Default 0.4. */
  minQuality?: number
}

/** Default compression settings, tuned for guest photos. */
const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1920,
  targetSize: 1024 * 1024,
  initialQuality: 0.82,
  minQuality: 0.4
}

export function useImageCompression() {
  const isCompressing = ref(false)
  const compressionProgress = ref(0)

  /**
   * Compresses an image file to a smaller base64 data URL.
   *
   * @param file - The image file to compress (any browser-pickable format).
   * @param options - Optional overrides for dimension/size/quality.
   * @returns Promise resolving to a compressed base64 data URL (WebP or JPEG).
   * @throws If the image cannot be decoded or the canvas is unavailable.
   */
  async function compressImage(file: File, options: CompressOptions = {}): Promise<string> {
    isCompressing.value = true
    compressionProgress.value = 0
    try {
      return await compress(file, options)
    } finally {
      isCompressing.value = false
    }
  }

  /**
   * Compresses an image file to a `File` ready for `multipart/form-data` upload.
   *
   * @param file - The image file to compress (any browser-pickable format).
   * @param options - Optional overrides plus a target `filename`.
   * @returns Promise resolving to a compressed `File` (WebP or JPEG).
   * @throws If the image cannot be decoded or the canvas is unavailable.
   */
  async function compressToFile(
    file: File,
    options: CompressOptions & { filename?: string } = {}
  ): Promise<File> {
    isCompressing.value = true
    compressionProgress.value = 0
    try {
      const dataUrl = await compress(file, options)
      const blob = dataUrlToBlob(dataUrl)
      const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
      const base = (options.filename ?? file.name).replace(/\.[^.]+$/, '') || 'image'
      return new File([blob], `${base}.${ext}`, { type: blob.type })
    } finally {
      isCompressing.value = false
    }
  }

  /**
   * Core compression pipeline shared by every output format.
   *
   * @param file - The image to compress.
   * @param options - Compression overrides merged over the defaults.
   * @returns A compressed base64 data URL.
   */
  async function compress(file: File, options: CompressOptions): Promise<string> {
    const { maxDimension, targetSize, initialQuality, minQuality } = { ...DEFAULTS, ...options }

    // iPhone HEIC/HEIF cannot be decoded by most browsers — convert first.
    const decodable = await ensureDecodable(file)
    compressionProgress.value = 20

    // Decode the image, respecting EXIF orientation where supported.
    const source = await decodeImage(decodable)
    compressionProgress.value = 50

    const { width, height } = calculateDimensions(source.width, source.height, maxDimension)

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

    let quality = initialQuality
    let dataUrl = canvas.toDataURL(mimeType, quality)

    // If still too large, reduce quality iteratively.
    while (getBase64Size(dataUrl) > targetSize && quality > minQuality) {
      quality = Math.round((quality - 0.1) * 100) / 100
      dataUrl = canvas.toDataURL(mimeType, quality)
    }

    compressionProgress.value = 100
    return dataUrl
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

  /**
   * Converts a base64 data URL into a Blob.
   *
   * @param dataUrl - The data URL to convert.
   * @returns A Blob carrying the decoded bytes and MIME type.
   */
  function dataUrlToBlob(dataUrl: string): Blob {
    const [header, data] = dataUrl.split(',')
    const mime = header?.match(/data:(.*?);/)?.[1] || 'image/webp'
    const binary = atob(data || '')
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new Blob([bytes], { type: mime })
  }

  return {
    compressImage,
    compressToFile,
    isCompressing,
    compressionProgress
  }
}
