import JSZip from 'jszip';

export interface ZipExportProgress {
  current: number;
  total: number;
  currentFilename: string;
  percent: number;
}

/**
 * Downloads multiple image URLs and compiles them into a single .zip file.
 */
export async function exportImagesToZip(
  items: Array<{ url: string; filename: string }>,
  zipName = 'IMGIVO_Export.zip',
  onProgress?: (progress: ZipExportProgress) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('IMGIVO') || zip;
  const usedNames = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let filename = item.filename || `resim_${i + 1}.png`;

    // Ensure unique filename inside zip
    if (usedNames.has(filename)) {
      const extIdx = filename.lastIndexOf('.');
      const base = extIdx !== -1 ? filename.substring(0, extIdx) : filename;
      const ext = extIdx !== -1 ? filename.substring(extIdx) : '';
      filename = `${base}_${i + 1}${ext}`;
    }
    usedNames.add(filename);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: items.length,
        currentFilename: filename,
        percent: Math.round(((i + 0.5) / items.length) * 100),
      });
    }

    try {
      const response = await fetch(item.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      folder.file(filename, blob);
    } catch (err) {
      console.warn(`[ZIP Export] Could not fetch ${item.url} directly, trying canvas fallback`, err);
      try {
        const blob = await fetchViaImageCanvas(item.url);
        if (blob) {
          folder.file(filename, blob);
        }
      } catch (fallbackErr) {
        console.error(`[ZIP Export] Failed to include ${filename}:`, fallbackErr);
      }
    }

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: items.length,
        currentFilename: filename,
        percent: Math.round(((i + 1) / items.length) * 100),
      });
    }
  }

  // Generate zip binary
  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  
  // Trigger file download in browser
  const link = document.createElement('a');
  link.href = URL.createObjectURL(zipBlob);
  link.download = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 15000);
}

/**
 * Fallback to fetch image via Canvas in case of cross-origin or special blob requirements
 */
function fetchViaImageCanvas(url: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
