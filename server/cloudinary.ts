import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log('[Cloudinary] Configured successfully with cloud:', cloudName);
} else {
  console.warn(
    '[Cloudinary] Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET. Using high-performance local image storage fallback until keys are provided.'
  );
}

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface UploadResultData {
  cloudinary_public_id: string;
  cloudinary_url: string;
  format: string;
  width: number;
  height: number;
  size: number;
}

export function resolveImageUrl(rawUrl: string, appUrl?: string): string {
  if (!rawUrl) return '';
  if (rawUrl.includes('res.cloudinary.com')) {
    return rawUrl;
  }
  // If it is a local upload path or an old URL containing /uploads/
  if (rawUrl.includes('/uploads/')) {
    const idx = rawUrl.indexOf('/uploads/');
    const pathPart = rawUrl.substring(idx);
    if (appUrl) {
      const cleanBase = appUrl.replace(/\/$/, '');
      return `${cleanBase}${pathPart}`;
    }
    return pathPart;
  }
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  if (rawUrl.startsWith('/')) {
    if (appUrl) {
      const cleanBase = appUrl.replace(/\/$/, '');
      return `${cleanBase}${rawUrl}`;
    }
    return rawUrl;
  }
  return rawUrl;
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  appUrl: string
): Promise<UploadResultData> {
  const ext = path.extname(originalName).replace('.', '').toLowerCase() || 'png';

  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'hizliyukle',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        },
        (error, result) => {
          if (error || !result) {
            console.error('[Cloudinary Stream Upload Error]:', error);
            return reject(new Error(error?.message || 'Cloudinary upload failed'));
          }

          resolve({
            cloudinary_public_id: result.public_id,
            cloudinary_url: result.secure_url,
            format: result.format || ext,
            width: result.width || 800,
            height: result.height || 600,
            size: result.bytes || fileBuffer.length,
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  } else {
    // Local fallback when Cloudinary env vars are not set
    const uniqueId = 'local_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const fileName = `${uniqueId}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(filePath, fileBuffer);

    const baseUrl = appUrl ? appUrl.replace(/\/$/, '') : 'http://localhost:3000';
    const localUrl = `${baseUrl}/uploads/${fileName}`;

    return {
      cloudinary_public_id: uniqueId,
      cloudinary_url: localUrl,
      format: ext,
      width: 1200,
      height: 800,
      size: fileBuffer.length,
    };
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (isCloudinaryConfigured && !publicId.startsWith('local_')) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok' || result.result === 'not found';
    } catch (err) {
      console.error('[Cloudinary Delete Error]:', err);
      return false;
    }
  } else {
    // Local deletion with strict basename matching
    try {
      const safePublicId = path.basename(publicId);
      if (!safePublicId || safePublicId === '.' || safePublicId === '/') return false;

      const files = fs.readdirSync(UPLOADS_DIR);
      const target = files.find((f) => path.parse(f).name === safePublicId || f === safePublicId);
      if (target) {
        fs.unlinkSync(path.join(UPLOADS_DIR, target));
      }
      return true;
    } catch (err) {
      console.error('[Local Delete Error]:', err);
      return false;
    }
  }
}

export async function checkCloudinaryHealth(): Promise<{ configured: boolean; connected: boolean; cloudName: string; message: string }> {
  if (!isCloudinaryConfigured) {
    return {
      configured: false,
      connected: false,
      cloudName: '',
      message: 'Cloudinary API anahtarları tanımlanmamış (.env dosyasında CLOUDINARY_CLOUD_NAME vb. eksik)',
    };
  }

  try {
    const ping = await cloudinary.api.ping();
    return {
      configured: true,
      connected: ping.status === 'ok',
      cloudName: cloudName,
      message: 'Cloudinary API bağlantısı aktif ve hazır.',
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      cloudName: cloudName,
      message: 'Cloudinary bağlantı hatası: ' + (err.message || 'Geçersiz API kimlik bilgileri'),
    };
  }
}

export function getCloudinaryThumbnailUrl(url: string, width = 400, height = 400, appUrl?: string): string {
  if (!url) return '';
  const resolved = resolveImageUrl(url, appUrl);
  if (resolved.includes('res.cloudinary.com') && resolved.includes('/upload/')) {
    return resolved.replace('/upload/', `/upload/c_fill,w_${width},h_${height},q_auto,f_auto/`);
  }
  return resolved;
}
