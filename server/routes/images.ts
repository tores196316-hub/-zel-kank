import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { db, ImageRecord } from '../db.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../cloudinary.js';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Multer memory storage configuration
const storage = multer.memoryStorage();

const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB default limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeAllowed = allowedMimeTypes.includes(file.mimetype);
    const isExtAllowed = allowedExtensions.includes(ext);

    if (isMimeAllowed && isExtAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü. Sadece JPG, PNG, WEBP ve GIF yükleyebilirsiniz.'));
    }
  },
});

function buildUploadResult(img: ImageRecord, appUrl: string) {
  const baseUrl = appUrl || process.env.APP_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/i/${img.id}`;
  const directUrl = img.cloudinary_url;

  return {
    image: img,
    share_url: shareUrl,
    direct_url: directUrl,
    html_code: `<a href="${shareUrl}" target="_blank"><img src="${directUrl}" alt="${img.original_filename}" /></a>`,
    markdown_code: `[![${img.original_filename}](${directUrl})](${shareUrl})`,
    bbcode: `[URL=${shareUrl}][IMG]${directUrl}[/IMG][/URL]`,
  };
}

// Upload endpoint
router.post('/upload', uploadRateLimiter, authenticateToken, upload.array('files', 10), async (req: AuthRequest, res: Response) => {
  try {
    const settings = db.getSettings();

    if (!req.user && !settings.allow_guest_upload) {
      return res.status(403).json({ error: 'Misafir resim yüklemesi kapalıdır. Lütfen giriş yapın.' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Lütfen yüklenecek en az bir resim seçin.' });
    }

    const maxBytes = (settings.max_file_size_mb || 20) * 1024 * 1024;
    const results = [];

    const appUrl = (req.protocol + '://' + req.get('host')) || process.env.APP_URL || 'http://localhost:3000';

    for (const file of files) {
      if (file.size > maxBytes) {
        return res.status(400).json({
          error: `"${file.originalname}" dosyası çok büyük. Maksimum dosya boyutu ${settings.max_file_size_mb} MB olmalıdır.`,
        });
      }

      // Generate unique random ID for image share link (e.g. img_9x2k7m)
      const imageId = Math.random().toString(36).substring(2, 10);
      const deleteToken = 'del_' + Math.random().toString(36).substring(2, 12);

      // Perform upload to Cloudinary (or local fallback)
      const uploadRes = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype, appUrl);

      const imageRecord: ImageRecord = {
        id: imageId,
        user_id: req.user ? req.user.id : null,
        uploader_username: req.user ? req.user.username : 'Misafir',
        cloudinary_public_id: uploadRes.cloudinary_public_id,
        cloudinary_url: uploadRes.cloudinary_url,
        original_filename: file.originalname,
        format: uploadRes.format,
        width: uploadRes.width,
        height: uploadRes.height,
        size: uploadRes.size,
        created_at: new Date().toISOString(),
        views: 0,
        downloads: 0,
        is_public: true,
        status: 'active',
        delete_token: deleteToken,
      };

      db.createImage(imageRecord);
      db.addLog('info', `Resim yüklendi: ${imageId} (${file.originalname}) - ${uploadRes.size} bytes`);

      results.push(buildUploadResult(imageRecord, appUrl));
    }

    return res.json({
      message: `${results.length} resim başarıyla yüklendi.`,
      results,
    });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return res.status(500).json({
      error: err?.message || 'Resim yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.',
    });
  }
});

// Get User's Gallery
router.get('/my', authenticateToken, requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const images = db.getImagesByUserId(req.user!.id);
    const appUrl = (req.protocol + '://' + req.get('host')) || process.env.APP_URL || 'http://localhost:3000';

    const formatted = images.map((img) => buildUploadResult(img, appUrl));
    return res.json({ images: formatted });
  } catch (err: any) {
    return res.status(500).json({ error: 'Galeri yüklenirken bir hata oluştu.' });
  }
});

// Get Single Image Detail
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const img = db.getImageById(id);

    if (!img) {
      return res.status(404).json({ error: 'Aradığınız resim bulunamadı veya silinmiş.' });
    }

    db.incrementImageViews(id);

    const appUrl = (req.protocol + '://' + req.get('host')) || process.env.APP_URL || 'http://localhost:3000';
    const isOwner = req.user ? req.user.id === img.user_id || req.user.role === 'admin' : false;

    return res.json({
      ...buildUploadResult(img, appUrl),
      is_owner: isOwner,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Resim bilgisi alınamadı.' });
  }
});

// Increment Download
router.post('/:id/download', (req, res) => {
  const { id } = req.params;
  db.incrementImageDownloads(id);
  return res.json({ success: true });
});

// Delete Image
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { delete_token } = req.query;

    const img = db.getImageById(id);
    if (!img) {
      return res.status(404).json({ error: 'Resim bulunamadı veya zaten silinmiş.' });
    }

    const isOwner = req.user && (req.user.id === img.user_id || req.user.role === 'admin');
    const hasTokenMatch = delete_token && delete_token === img.delete_token;

    if (!isOwner && !hasTokenMatch) {
      return res.status(403).json({ error: 'Bu resmi silmek için yetkiniz bulunmuyor.' });
    }

    // Delete from Cloudinary/Local
    await deleteFromCloudinary(img.cloudinary_public_id);

    // Delete metadata from DB
    db.deleteImage(id);
    db.addLog('info', `Resim silindi: ${id}`);

    return res.json({ message: 'Resim başarıyla silindi.' });
  } catch (err: any) {
    console.error('Delete image error:', err);
    return res.status(500).json({ error: 'Resim silinirken hata oluştu.' });
  }
});

// Report Image
router.post('/:id/report', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const img = db.getImageById(id);
    if (!img) {
      return res.status(404).json({ error: 'Bildirilmek istenen resim bulunamadı.' });
    }

    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({ error: 'Lütfen şikayet nedeninizi açıklayın.' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';

    db.createReport({
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      image_id: id,
      reason: String(reason).trim(),
      ip: clientIp,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    return res.json({ message: 'Şikayetiniz alındı. İnceleme ekiplerimize iletildi.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Rapor iletilirken bir hata oluştu.' });
  }
});

export default router;
