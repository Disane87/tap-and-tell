/**
 * Composable for client-side image compression.
 *
 * Resizes large images, compresses JPEG quality, and converts
 * other formats to JPEG for smaller file sizes.
 *
 * Configuration via environment variables:
 * - IMAGE_MAX_DIMENSION: Maximum pixel dimension (default: 1920)
 * - IMAGE_JPEG_QUALITY: JPEG quality 0-1 (default: 0.8)
 * - IMAGE_TARGET_SIZE: Target file size in bytes (default: 512000 = 500KB)
 */
export function useImageCompression() {
  const config = useRuntimeConfig()
  const isCompressing = ref(false)
  const compressionProgress = ref(0)

  /**
   * Maximum dimension for resized images (width or height).
   * Configurable via IMAGE_MAX_DIMENSION env variable.
   */
  const MAX_DIMENSION = config.public.imageMaxDimension || 1920

  /**
   * JPEG compression quality (0-1).
   * Configurable via IMAGE_JPEG_QUALITY env variable.
   */
  const JPEG_QUALITY = config.public.imageJpegQuality || 0.8

  /**
   * Target maximum file size in bytes.
   * Configurable via IMAGE_TARGET_SIZE env variable.
   * Default: 500KB (512000 bytes).
   */
  const TARGET_SIZE = config.public.imageTargetSize || 500 * 1024

  /**
   * Compresses an image file to a smaller base64 string.
   *
   * @param file - The image file to compress.
   * @returns Promise resolving to compressed base64 string.
   */
  async function compressImage(file: File): Promise<string> {
    isCompressing.value = true
    compressionProgress.value = 0

    try {
      // Load image into an Image element
      const imageBitmap = await loadImage(file)
      compressionProgress.value = 30

      // Calculate new dimensions while maintaining aspect ratio
      const { width, height } = calculateDimensions(
        imageBitmap.width,
        imageBitmap.height,
        MAX_DIMENSION
      )
      compressionProgress.value = 50

      // Draw to canvas and compress
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(imageBitmap, 0, 0, width, height)
      compressionProgress.value = 70

      // Convert to JPEG with compression
      let quality = JPEG_QUALITY
      let dataUrl = canvas.toDataURL('image/jpeg', quality)

      // If still too large, reduce quality iteratively
      while (getBase64Size(dataUrl) > TARGET_SIZE && quality > 0.3) {
        quality -= 0.1
        dataUrl = canvas.toDataURL('image/jpeg', quality)
      }

      compressionProgress.value = 100
      return dataUrl
    } finally {
      isCompressing.value = false
    }
  }

  /**
   * Loads a file into an HTMLImageElement.
   *
   * @param file - The file to load.
   * @returns Promise resolving to the loaded image.
   */
  function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
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
    // Remove the data:image/jpeg;base64, prefix
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
