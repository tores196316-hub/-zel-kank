export interface CompressionOptions {
  format: 'image/webp' | 'image/avif' | 'image/jpeg' | 'image/png';
  quality: number; // 0.1 - 1.0
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
}

export interface CompressedImageResult {
  id: string;
  originalFile: File;
  originalName: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalFormat: string;
  
  compressedBlob: Blob;
  compressedUrl: string;
  compressedName: string;
  compressedSize: number;
  compressedWidth: number;
  compressedHeight: number;
  targetFormat: string;
  
  savedBytes: number;
  savedPercent: number;
  processingTimeMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

/**
 * Checks if browser natively supports AVIF canvas export
 */
export function isAvifEncodingSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').startsWith('data:image/avif');
  } catch {
    return false;
  }
}

/**
 * Checks if browser supports WebP canvas export (universally supported in modern browsers)
 */
export function isWebpEncodingSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return true;
  }
}

/**
 * Compresses and converts an image file using browser Canvas API
 */
export async function compressAndConvertImage(
  file: File,
  options: CompressionOptions
): Promise<CompressedImageResult> {
  const startTime = performance.now();
  const id = Math.random().toString(36).substring(2, 10);

  // Derive target extension
  const extensionMap: Record<string, string> = {
    'image/webp': '.webp',
    'image/avif': '.avif',
    'image/jpeg': '.jpg',
    'image/png': '.png',
  };
  const targetExt = extensionMap[options.format] || '.webp';
  const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
  const compressedName = `${baseName}_imgivo${targetExt}`;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const originalWidth = img.naturalWidth || img.width;
      const originalHeight = img.naturalHeight || img.height;

      // Calculate target dimensions
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (options.maxWidth && options.maxWidth > 0 && targetWidth > options.maxWidth) {
        const ratio = options.maxWidth / targetWidth;
        targetWidth = options.maxWidth;
        targetHeight = Math.round(targetHeight * ratio);
      }

      if (options.maxHeight && options.maxHeight > 0 && targetHeight > options.maxHeight) {
        const ratio = options.maxHeight / targetHeight;
        targetHeight = options.maxHeight;
        targetWidth = Math.round(targetWidth * ratio);
      }

      // Create high-fidelity canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { alpha: true });

      if (!ctx) {
        return resolve({
          id,
          originalFile: file,
          originalName: file.name,
          originalSize: file.size,
          originalWidth,
          originalHeight,
          originalFormat: file.type || 'image/unknown',
          compressedBlob: file,
          compressedUrl: URL.createObjectURL(file),
          compressedName,
          compressedSize: file.size,
          compressedWidth: originalWidth,
          compressedHeight: originalHeight,
          targetFormat: options.format,
          savedBytes: 0,
          savedPercent: 0,
          processingTimeMs: Math.round(performance.now() - startTime),
          status: 'error',
          errorMessage: 'Canvas 2D context oluşturulamadı.',
        });
      }

      // Set highest smoothing quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // For JPEG format, fill transparent background with white
      if (options.format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // Render image onto canvas
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Check if requested format is AVIF and supported, fallback to WebP if not
      let effectiveFormat = options.format;
      if (options.format === 'image/avif' && !isAvifEncodingSupported()) {
        effectiveFormat = 'image/webp';
      }

      canvas.toBlob(
        (blob) => {
          const endTime = performance.now();
          const processingTimeMs = Math.round(endTime - startTime);

          if (!blob) {
            return resolve({
              id,
              originalFile: file,
              originalName: file.name,
              originalSize: file.size,
              originalWidth,
              originalHeight,
              originalFormat: file.type || 'image/unknown',
              compressedBlob: file,
              compressedUrl: URL.createObjectURL(file),
              compressedName,
              compressedSize: file.size,
              compressedWidth: targetWidth,
              compressedHeight: targetHeight,
              targetFormat: effectiveFormat,
              savedBytes: 0,
              savedPercent: 0,
              processingTimeMs,
              status: 'error',
              errorMessage: 'Blob dönüşümü tamamlanamadı.',
            });
          }

          const compressedSize = blob.size;
          const savedBytes = Math.max(0, file.size - compressedSize);
          const savedPercent = file.size > 0 ? Math.round(((file.size - compressedSize) / file.size) * 100) : 0;
          const compressedUrl = URL.createObjectURL(blob);

          resolve({
            id,
            originalFile: file,
            originalName: file.name,
            originalSize: file.size,
            originalWidth,
            originalHeight,
            originalFormat: file.type || 'image/unknown',
            compressedBlob: blob,
            compressedUrl,
            compressedName,
            compressedSize,
            compressedWidth: targetWidth,
            compressedHeight: targetHeight,
            targetFormat: effectiveFormat,
            savedBytes,
            savedPercent,
            processingTimeMs,
            status: 'success',
          });
        },
        effectiveFormat,
        options.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        id,
        originalFile: file,
        originalName: file.name,
        originalSize: file.size,
        originalWidth: 0,
        originalHeight: 0,
        originalFormat: file.type || 'image/unknown',
        compressedBlob: file,
        compressedUrl: '',
        compressedName,
        compressedSize: file.size,
        compressedWidth: 0,
        compressedHeight: 0,
        targetFormat: options.format,
        savedBytes: 0,
        savedPercent: 0,
        processingTimeMs: Math.round(performance.now() - startTime),
        status: 'error',
        errorMessage: 'Resim dosyası okunamadı veya bozuk.',
      });
    };

    img.src = objectUrl;
  });
}
