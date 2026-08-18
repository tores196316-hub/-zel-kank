import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, AlbumRecord } from '../db.js';
import { authenticateToken, requireAuth, AuthRequest } from '../middleware/auth.js';
import { resolveImageUrl, getCloudinaryThumbnailUrl } from '../cloudinary.js';

const router = Router();

// Expiration helper
function calculateExpirationDate(expiration?: string): string | null {
  if (!expiration || expiration === 'none') return null;
  const now = Date.now();
  switch (expiration) {
    case '10m':
      return new Date(now + 10 * 60 * 1000).toISOString();
    case '1h':
      return new Date(now + 60 * 60 * 1000).toISOString();
    case '24h':
      return new Date(now + 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return null;
  }
}

// Album Unlock Token Generation & Verification
function createAlbumUnlockToken(albumId: string): string {
  const secret = process.env.JWT_SECRET || 'imgivo_secret_burn_2026';
  const timestamp = Date.now();
  const signature = crypto.createHmac('sha256', secret).update(`album:${albumId}:${timestamp}`).digest('hex');
  return `${timestamp}.${signature}`;
}

function verifyAlbumUnlockToken(albumId: string, token?: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  // Valid for 2 hours
  if (isNaN(timestamp) || Date.now() - timestamp > 2 * 60 * 60 * 1000) {
    return false;
  }
  const secret = process.env.JWT_SECRET || 'imgivo_secret_burn_2026';
  const expectedSignature = crypto.createHmac('sha256', secret).update(`album:${albumId}:${timestamp}`).digest('hex');
  return signature === expectedSignature;
}

// Plan limits for albums
function getPlanAlbumLimits(planName: string = 'free') {
  const plan = planName.toLowerCase();
  if (plan === 'vip' || plan === 'admin') {
    return { maxAlbums: 9999, maxImagesPerAlbum: 1000 };
  }
  if (plan === 'premium') {
    return { maxAlbums: 50, maxImagesPerAlbum: 200 };
  }
  return { maxAlbums: 10, maxImagesPerAlbum: 50 };
}

// Format image for album views
function formatAlbumImage(img: any, baseUrl: string) {
  const directUrl = resolveImageUrl(img.cloudinary_url, baseUrl);
  const thumbnailUrl = getCloudinaryThumbnailUrl(img.cloudinary_url, 400, 400, baseUrl);
  const shareUrl = `${baseUrl}/i/${img.id}`;

  return {
    image: {
      id: img.id,
      user_id: img.user_id,
      uploader_username: img.uploader_username,
      cloudinary_public_id: img.cloudinary_public_id,
      cloudinary_url: img.cloudinary_url,
      original_filename: img.original_filename,
      format: img.format,
      width: img.width,
      height: img.height,
      size: img.size,
      created_at: img.created_at,
      views: img.views,
      downloads: img.downloads,
      is_public: img.is_public,
      status: img.status,
      is_favorite: img.is_favorite,
      folder_id: img.folder_id,
    },
    share_url: shareUrl,
    direct_url: directUrl,
    thumbnail_url: thumbnailUrl,
    html_code: `<a href="${shareUrl}" target="_blank"><img src="${directUrl}" alt="${img.original_filename}" /></a>`,
    markdown_code: `[![${img.original_filename}](${directUrl})](${shareUrl})`,
    bbcode: `[url=${shareUrl}][img]${directUrl}[/img][/url]`,
  };
}

// Resolve cover image url
function resolveCoverUrl(album: AlbumRecord, baseUrl: string): string | null {
  if (album.cover_image_url) {
    return resolveImageUrl(album.cover_image_url, baseUrl);
  }
  if (album.cover_image_id) {
    const img = db.getImageById(album.cover_image_id);
    if (img) {
      return getCloudinaryThumbnailUrl(img.cloudinary_url, 600, 400, baseUrl);
    }
  }
  if (album.image_ids && album.image_ids.length > 0) {
    const firstImg = db.getImageById(album.image_ids[0]);
    if (firstImg) {
      return getCloudinaryThumbnailUrl(firstImg.cloudinary_url, 600, 400, baseUrl);
    }
  }
  return null;
}

/**
 * 1. CREATE ALBUM
 * POST /api/albums
 */
router.post('/', authenticateToken, requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const user = req.user!;
    const {
      title,
      description,
      cover_image_id,
      privacy = 'public',
      view_mode = 'grid',
      password,
      expiration = 'none',
      image_ids = [],
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Albüm başlığı zorunludur.' });
    }

    const limits = getPlanAlbumLimits(user.plan);
    const userAlbums = db.getAlbumsByUserId(user.id);

    if (userAlbums.length >= limits.maxAlbums) {
      return res.status(403).json({
        error: `Planınız için maksimum albüm limitine (${limits.maxAlbums} adet) ulaştınız. Daha fazla albüm oluşturmak için Premium veya VIP plana geçebilirsiniz.`,
      });
    }

    if (Array.isArray(image_ids) && image_ids.length > limits.maxImagesPerAlbum) {
      return res.status(403).json({
        error: `Planınız tek bir albümde en fazla ${limits.maxImagesPerAlbum} resim içerebilir.`,
      });
    }

    // Filter valid image IDs
    const validImageIds: string[] = [];
    if (Array.isArray(image_ids)) {
      for (const id of image_ids) {
        const img = db.getImageById(id);
        if (img) {
          validImageIds.push(id);
        }
      }
    }

    const albumId = 'alb_' + crypto.randomBytes(6).toString('hex');
    const shareId = crypto.randomBytes(5).toString('hex');
    const passwordHash = password && password.trim().length > 0 ? bcrypt.hashSync(password.trim(), 10) : null;
    const expiresAt = calculateExpirationDate(expiration);

    const newAlbum: AlbumRecord = {
      id: albumId,
      share_id: shareId,
      user_id: user.id,
      creator_username: user.username,
      title: title.trim(),
      description: description ? description.trim() : '',
      cover_image_id: cover_image_id || (validImageIds.length > 0 ? validImageIds[0] : null),
      cover_image_url: null,
      image_ids: validImageIds,
      privacy: ['public', 'unlisted', 'private'].includes(privacy) ? privacy : 'public',
      view_mode: ['grid', 'masonry', 'slideshow', 'modern'].includes(view_mode) ? view_mode : 'grid',
      password_hash: passwordHash,
      expires_at: expiresAt,
      views: 0,
      view_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
    };

    db.createAlbum(newAlbum);

    db.addAuditLog(
      'album_created',
      user.id,
      user.username,
      albumId,
      `"${newAlbum.title}" başlıklı albüm oluşturuldu (${validImageIds.length} görsel).`
    );

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const coverUrl = resolveCoverUrl(newAlbum, baseUrl);

    return res.status(201).json({
      message: 'Albüm başarıyla oluşturuldu.',
      album: {
        ...newAlbum,
        cover_image_url: coverUrl,
        is_password_protected: !!passwordHash,
        image_count: validImageIds.length,
        share_url: `${baseUrl}/a/${newAlbum.share_id}`,
      },
    });
  } catch (err: any) {
    console.error('[Albums] Create album error:', err);
    return res.status(500).json({ error: 'Albüm oluşturulurken bir hata oluştu.' });
  }
});

/**
 * 2. GET MY ALBUMS
 * GET /api/albums/my
 */
router.get('/my', authenticateToken, requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const user = req.user!;
    const albums = db.getAlbumsByUserId(user.id);
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const now = Date.now();
    const formatted = albums.map((alb) => {
      const isExpired = alb.expires_at ? new Date(alb.expires_at).getTime() <= now : false;
      const coverUrl = resolveCoverUrl(alb, baseUrl);
      return {
        id: alb.id,
        share_id: alb.share_id,
        user_id: alb.user_id,
        creator_username: alb.creator_username,
        title: alb.title,
        description: alb.description,
        cover_image_id: alb.cover_image_id,
        cover_image_url: coverUrl,
        image_ids: alb.image_ids,
        image_count: (alb.image_ids || []).length,
        privacy: alb.privacy,
        view_mode: alb.view_mode,
        is_password_protected: !!alb.password_hash,
        expires_at: alb.expires_at,
        is_expired: isExpired,
        views: alb.views || 0,
        created_at: alb.created_at,
        updated_at: alb.updated_at,
        share_url: `${baseUrl}/a/${alb.share_id}`,
      };
    });

    const limits = getPlanAlbumLimits(user.plan);

    return res.json({
      albums: formatted,
      limits: {
        total: formatted.length,
        max_albums: limits.maxAlbums,
        max_images_per_album: limits.maxImagesPerAlbum,
      },
    });
  } catch (err: any) {
    console.error('[Albums] Get my albums error:', err);
    return res.status(500).json({ error: 'Albümler yüklenemedi.' });
  }
});

/**
 * 3. GET ALBUM DETAIL (Public / Share / Owner / Admin)
 * GET /api/albums/:idOrShareId
 */
router.get('/:idOrShareId', authenticateToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { idOrShareId } = req.params;
    const album = db.getAlbumByShareId(idOrShareId);

    if (!album || album.status === 'deleted') {
      return res.status(404).json({ error: 'Albüm bulunamadı veya silinmiş.' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const user = req.user;
    const isOwner = !!(user && user.id === album.user_id);
    const isAdmin = !!(user && user.role === 'admin');

    // Expiration check
    const isExpired = album.expires_at ? new Date(album.expires_at).getTime() <= Date.now() : false;
    if (isExpired && !isOwner && !isAdmin) {
      return res.status(410).json({
        error: 'Bu albümün paylaşım süresi sona ermiştir.',
        is_expired: true,
        album: {
          id: album.id,
          share_id: album.share_id,
          title: album.title,
          is_expired: true,
        },
      });
    }

    // Privacy check
    if (album.privacy === 'private' && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Bu albüm gizlidir. Yalnızca albüm sahibi görüntüleyebilir.' });
    }

    const coverUrl = resolveCoverUrl(album, baseUrl);

    // Password Protection check
    const hasPassword = !!album.password_hash;
    const unlockToken = req.query.unlock_token as string | undefined;
    const isUnlocked = unlockToken ? verifyAlbumUnlockToken(album.id, unlockToken) : false;

    if (hasPassword && !isOwner && !isAdmin && !isUnlocked) {
      return res.json({
        is_locked: true,
        is_password_protected: true,
        album: {
          id: album.id,
          share_id: album.share_id,
          title: album.title,
          description: album.description,
          cover_image_url: coverUrl,
          image_count: (album.image_ids || []).length,
          creator_username: album.creator_username,
          created_at: album.created_at,
          views: album.views || 0,
          is_expired: isExpired,
          share_url: `${baseUrl}/a/${album.share_id}`,
        },
      });
    }

    // Increment views if viewer is not owner/admin
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    if (!isOwner && !isAdmin) {
      db.incrementAlbumViewsThrottled(album.id, clientIp);
    }

    // Populate images
    const populatedImages: any[] = [];
    for (const imgId of album.image_ids || []) {
      const img = db.getImageById(imgId);
      if (img && img.status !== 'deleted') {
        populatedImages.push(formatAlbumImage(img, baseUrl));
      }
    }

    const stats = isOwner || isAdmin ? db.getAlbumStats(album.id) : undefined;

    return res.json({
      is_locked: false,
      is_password_protected: hasPassword,
      is_owner: isOwner,
      is_admin: isAdmin,
      is_expired: isExpired,
      album: {
        id: album.id,
        share_id: album.share_id,
        user_id: album.user_id,
        creator_username: album.creator_username,
        title: album.title,
        description: album.description,
        cover_image_id: album.cover_image_id,
        cover_image_url: coverUrl,
        image_ids: album.image_ids,
        image_count: populatedImages.length,
        privacy: album.privacy,
        view_mode: album.view_mode,
        expires_at: album.expires_at,
        views: album.views || 0,
        created_at: album.created_at,
        updated_at: album.updated_at,
        share_url: `${baseUrl}/a/${album.share_id}`,
        images: populatedImages,
        stats: stats || {
          total_views: album.views || 0,
          views_24h: 1,
          views_7d: 1,
          image_count: populatedImages.length,
          top_image: null,
        },
      },
    });
  } catch (err: any) {
    console.error('[Albums] Get album detail error:', err);
    return res.status(500).json({ error: 'Albüm detayları yüklenemedi.' });
  }
});

/**
 * 4. UNLOCK PASSWORD PROTECTED ALBUM
 * POST /api/albums/:idOrShareId/unlock
 */
router.post('/:idOrShareId/unlock', async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { idOrShareId } = req.params;
    const { password } = req.body;

    const album = db.getAlbumByShareId(idOrShareId);
    if (!album || album.status === 'deleted') {
      return res.status(404).json({ error: 'Albüm bulunamadı.' });
    }

    if (!album.password_hash) {
      return res.json({ unlocked: true });
    }

    if (!password) {
      return res.status(400).json({ error: 'Lütfen albüm parolasını girin.' });
    }

    const isValid = bcrypt.compareSync(password, album.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Hatalı parola! Lütfen tekrar deneyin.' });
    }

    const unlockToken = createAlbumUnlockToken(album.id);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const coverUrl = resolveCoverUrl(album, baseUrl);

    // Populate images for unlocked viewer
    const populatedImages: any[] = [];
    for (const imgId of album.image_ids || []) {
      const img = db.getImageById(imgId);
      if (img && img.status !== 'deleted') {
        populatedImages.push(formatAlbumImage(img, baseUrl));
      }
    }

    return res.json({
      unlocked: true,
      unlock_token: unlockToken,
      album: {
        id: album.id,
        share_id: album.share_id,
        creator_username: album.creator_username,
        title: album.title,
        description: album.description,
        cover_image_url: coverUrl,
        image_ids: album.image_ids,
        image_count: populatedImages.length,
        privacy: album.privacy,
        view_mode: album.view_mode,
        expires_at: album.expires_at,
        views: album.views || 0,
        created_at: album.created_at,
        updated_at: album.updated_at,
        share_url: `${baseUrl}/a/${album.share_id}`,
        images: populatedImages,
      },
    });
  } catch (err: any) {
    console.error('[Albums] Unlock album error:', err);
    return res.status(500).json({ error: 'Kilit açma işlemi başarısız oldu.' });
  }
});

/**
 * 5. UPDATE ALBUM SETTINGS
 * PUT /api/albums/:id
 */
router.put('/:id', authenticateToken, requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const album = db.getAlbumById(id);

    if (!album) {
      return res.status(404).json({ error: 'Albüm bulunamadı.' });
    }

    if (album.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu albümü düzenleme yetkiniz yok.' });
    }

    const {
      title,
      description,
      cover_image_id,
      privacy,
      view_mode,
      password,
      remove_password,
      expiration,
    } = req.body;

    const updates: Partial<AlbumRecord> = {};

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: 'Albüm başlığı boş bırakılamaz.' });
      updates.title = title.trim();
    }
    if (description !== undefined) {
      updates.description = description.trim();
    }
    if (cover_image_id !== undefined) {
      updates.cover_image_id = cover_image_id;
    }
    if (privacy && ['public', 'unlisted', 'private'].includes(privacy)) {
      updates.privacy = privacy;
    }
    if (view_mode && ['grid', 'masonry', 'slideshow', 'modern'].includes(view_mode)) {
      updates.view_mode = view_mode;
    }
    if (expiration !== undefined) {
      updates.expires_at = calculateExpirationDate(expiration);
    }
    if (remove_password) {
      updates.password_hash = null;
    } else if (password && password.trim().length > 0) {
      updates.password_hash = bcrypt.hashSync(password.trim(), 10);
    }

    const updated = db.updateAlbum(id, updates);

    db.addAuditLog('album_updated', user.id, user.username, id, `"${updated?.title}" albümü güncellendi.`);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const coverUrl = updated ? resolveCoverUrl(updated, baseUrl) : null;

    return res.json({
      message: 'Albüm ayarları başarıyla güncellendi.',
      album: {
        ...updated,
        cover_image_url: coverUrl,
        is_password_protected: !!updated?.password_hash,
      },
    });
  } catch (err: any) {
    console.error('[Albums] Update album error:', err);
    return res.status(500).json({ error: 'Albüm güncellenemedi.' });
  }
});

/**
 * 6. DELETE ALBUM
 * DELETE /api/albums/:id
 * CRITICAL: Only deletes the album wrapper; NEVER deletes the contained images!
 */
router.delete('/:id', authenticateToken, requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const album = db.getAlbumById(id);

    if (!album) {
      return res.status(404).json({ error: 'Albüm bulunamadı.' });
    }

    if (album.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu albümü silme yetkiniz yok.' });
    }

    const success = db.deleteAlbum(id, user.id, user.role === 'admin');
    if (!success) {
      return res.status(400).json({ error: 'Albüm silinemedi.' });
    }

    db.addAuditLog(
      'album_deleted',
      user.id,
      user.username,
      id,
      `"${album.title}" albümü silindi. İçindeki ${album.image_ids.length} görsel korundu.`
    );

    return res.json({
      message: 'Albüm başarıyla silindi. Görselleriniz galerinizde güvenle saklanmaktadır.',
    });
  } catch (err: any) {
    console.error('[Albums] Delete album error:', err);
    return res.status(500).json({ error: 'Albüm silinirken bir hata oluştu.' });
  }
});

/**
 * 7. ADD IMAGES TO ALBUM
 * POST /api/albums/:id/images
 */
router.post('/:id/images', authenticateToken, requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const album = db.getAlbumById(id);

    if (!album) {
      return res.status(404).json({ error: 'Albüm bulunamadı.' });
    }

    if (album.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu albüme görsel ekleme yetkiniz yok.' });
    }

    const { image_ids } = req.body;
    const idsToAdd = Array.isArray(image_ids) ? image_ids : (typeof req.body.image_id === 'string' ? [req.body.image_id] : []);

    if (idsToAdd.length === 0) {
      return res.status(400).json({ error: 'Eklenecek görsel belirtilmedi.' });
    }

    const limits = getPlanAlbumLimits(user.plan);
    const totalAfterAdd = (album.image_ids?.length || 0) + idsToAdd.length;

    if (totalAfterAdd > limits.maxImagesPerAlbum) {
      return res.status(403).json({
        error: `Planınız tek bir albümde en fazla ${limits.maxImagesPerAlbum} resim barındırabilir.`,
      });
    }

    const updated = db.addImagesToAlbum(id, idsToAdd, user.id, user.role === 'admin');
    if (!updated) {
      return res.status(400).json({ error: 'Görseller albüme eklenemedi.' });
    }

    db.addAuditLog(
      'album_images_added',
      user.id,
      user.username,
      id,
      `"${album.title}" albümüne ${idsToAdd.length} görsel eklendi.`
    );

    return res.json({
      message: `${idsToAdd.length} görsel başarıyla albüme eklendi.`,
      album: updated,
    });
  } catch (err: any) {
    console.error('[Albums] Add images to album error:', err);
    return res.status(500).json({ error: 'Görseller albüme eklenemedi.' });
  }
});

/**
 * 8. REMOVE IMAGE FROM ALBUM
 * DELETE /api/albums/:id/images/:imageId
 * CRITICAL: Removing image from album does NOT delete the actual image file or record!
 */
router.delete('/:id/images/:imageId', authenticateToken, requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id, imageId } = req.params;
    const user = req.user!;
    const album = db.getAlbumById(id);

    if (!album) {
      return res.status(404).json({ error: 'Albüm bulunamadı.' });
    }

    if (album.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
    }

    const updated = db.removeImageFromAlbum(id, imageId, user.id, user.role === 'admin');
    if (!updated) {
      return res.status(400).json({ error: 'Görsel albümden çıkarılamadı.' });
    }

    return res.json({
      message: 'Görsel albümden çıkarıldı. Orijinal dosyanız galerinizde kalmaya devam ediyor.',
      album: updated,
    });
  } catch (err: any) {
    console.error('[Albums] Remove image from album error:', err);
    return res.status(500).json({ error: 'Görsel albümden çıkarılamadı.' });
  }
});

/**
 * 9. REORDER IMAGES IN ALBUM
 * PUT /api/albums/:id/reorder
 */
router.put('/:id/reorder', authenticateToken, requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const album = db.getAlbumById(id);

    if (!album) {
      return res.status(404).json({ error: 'Albüm bulunamadı.' });
    }

    if (album.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu albümü düzenleme yetkiniz yok.' });
    }

    const { image_ids } = req.body;
    if (!Array.isArray(image_ids)) {
      return res.status(400).json({ error: 'Geçersiz sıralama verisi.' });
    }

    const updated = db.reorderAlbumImages(id, image_ids, user.id, user.role === 'admin');
    return res.json({
      message: 'Görsel sıralaması kaydedildi.',
      album: updated,
    });
  } catch (err: any) {
    console.error('[Albums] Reorder album error:', err);
    return res.status(500).json({ error: 'Sıralama güncellenemedi.' });
  }
});

export default router;
