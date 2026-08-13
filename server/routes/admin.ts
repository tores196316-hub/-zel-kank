import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { checkCloudinaryHealth, deleteFromCloudinary } from '../cloudinary.js';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

// Admin Stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const users = db.getUsers();
    const images = db.getImages();
    const reports = db.getReports();
    const cloudHealth = await checkCloudinaryHealth();

    const totalStorageBytes = images.reduce((acc, img) => acc + (img.size || 0), 0);
    const totalViews = images.reduce((acc, img) => acc + (img.views || 0), 0);

    return res.json({
      total_users: users.length,
      total_images: images.length,
      total_storage_bytes: totalStorageBytes,
      total_views: totalViews,
      total_reports: reports.filter((r) => r.status === 'pending').length,
      cloudinary_connected: cloudHealth.connected,
      cloudinary_cloud_name: cloudHealth.cloudName || 'Geliştirme / Yerel Depolama Modu',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'İstatistikler alınamadı.' });
  }
});

// Users
router.get('/users', (req: AuthRequest, res: Response) => {
  const users = db.getUsers().map((u) => {
    const userImgCount = db.getImagesByUserId(u.id).length;
    return {
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      created_at: u.created_at,
      status: u.status,
      image_count: userImgCount,
    };
  });
  return res.json({ users });
});

router.put('/users/:id/status', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'active' && status !== 'banned') {
    return res.status(400).json({ error: 'Geçersiz durum.' });
  }

  const user = db.getUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }

  if (user.role === 'admin') {
    return res.status(400).json({ error: 'Admin kullanıcısının durumu değiştirilemez.' });
  }

  db.updateUser(id, { status });
  db.addLog('warn', `Kullanıcı durumu değiştirildi: ${user.username} -> ${status}`);
  return res.json({ message: 'Kullanıcı durumu güncellendi.' });
});

// All Images
router.get('/images', (req: AuthRequest, res: Response) => {
  const images = db.getAllImagesForAdmin();
  return res.json({ images });
});

router.delete('/images/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const img = db.getImageById(id);

  if (!img) {
    return res.status(404).json({ error: 'Resim bulunamadı.' });
  }

  await deleteFromCloudinary(img.cloudinary_public_id);
  db.deleteImage(id);
  db.addLog('warn', `Admin resmi sildi: ${id}`);

  return res.json({ message: 'Resim başarıyla kaldırıldı.' });
});

// Reports
router.get('/reports', (req: AuthRequest, res: Response) => {
  const reports = db.getReports().map((rep) => {
    const img = db.getImageById(rep.image_id);
    return {
      ...rep,
      image_url: img ? img.cloudinary_url : null,
      original_filename: img ? img.original_filename : 'Silinmiş Resim',
    };
  });

  return res.json({ reports });
});

router.put('/reports/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'reviewed' | 'dismissed'

  if (status !== 'reviewed' && status !== 'dismissed') {
    return res.status(400).json({ error: 'Geçersiz durum.' });
  }

  db.updateReportStatus(id, status);
  return res.json({ message: 'Rapor güncellendi.' });
});

// Announcements
router.get('/announcements', (req: AuthRequest, res: Response) => {
  const announcements = db.getAnnouncements();
  return res.json({ announcements });
});

router.post('/announcements', (req: AuthRequest, res: Response) => {
  const { title, content, type } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Başlık ve içerik gereklidir.' });
  }

  const ann = db.createAnnouncement({
    id: 'ann_' + Date.now(),
    title: String(title).trim(),
    content: String(content).trim(),
    type: type || 'info',
    active: true,
    created_at: new Date().toISOString(),
  });

  return res.json({ message: 'Duyuru yayınlandı.', announcement: ann });
});

router.delete('/announcements/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.deleteAnnouncement(id);
  return res.json({ message: 'Duyuru silindi.' });
});

// Settings
router.get('/settings', (req: AuthRequest, res: Response) => {
  return res.json({ settings: db.getSettings() });
});

router.put('/settings', (req: AuthRequest, res: Response) => {
  const updated = db.updateSettings(req.body);
  return res.json({ message: 'Site ayarları güncellendi.', settings: updated });
});

// System Health
router.get('/health', async (req: AuthRequest, res: Response) => {
  const cloudHealth = await checkCloudinaryHealth();
  const logs = db.getLogs();

  return res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    cloudinary: cloudHealth,
    recent_logs: logs.slice(0, 30),
  });
});

export default router;
