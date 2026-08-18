import { Router, Response } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { checkCloudinaryHealth, deleteFromCloudinary, resolveImageUrl } from '../cloudinary.js';

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
    const todayStats = db.getTodayStats();

    const planCounts = {
      free: users.filter((u) => !u.plan || u.plan === 'free').length,
      premium: users.filter((u) => u.plan === 'premium').length,
      vip: users.filter((u) => u.plan === 'vip').length,
      admin: users.filter((u) => u.plan === 'admin' || u.role === 'admin').length,
    };

    return res.json({
      total_users: users.length,
      active_users: users.filter((u) => u.status === 'active').length,
      banned_users: users.filter((u) => u.status === 'banned').length,
      total_images: images.length,
      today_images: todayStats.today_images,
      today_users: todayStats.today_users,
      total_storage_bytes: totalStorageBytes,
      total_views: totalViews,
      total_reports: reports.filter((r) => r.status === 'pending' || r.status === 'investigating').length,
      plan_distribution: planCounts,
      cloudinary_connected: cloudHealth.connected,
      cloudinary_cloud_name: cloudHealth.cloudName || 'Geliştirme / Yerel Depolama Modu',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'İstatistikler alınamadı.' });
  }
});

// Users List & Search
router.get('/users', (req: AuthRequest, res: Response) => {
  const { q, plan, status } = req.query;
  let users = db.getUsers();

  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    users = users.filter((u) => u.username.toLowerCase().includes(query) || u.email.toLowerCase().includes(query));
  }

  if (plan && typeof plan === 'string' && plan !== 'all') {
    users = users.filter((u) => (u.plan || 'free') === plan);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    users = users.filter((u) => u.status === status);
  }

  const formatted = users.map((u) => {
    const userImages = db.getImagesByUserId(u.id);
    const userStorage = userImages.reduce((sum, img) => sum + (img.size || 0), 0);
    return {
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      plan: u.plan || (u.role === 'admin' ? 'admin' : 'free'),
      created_at: u.created_at,
      status: u.status,
      image_count: userImages.length,
      storage_bytes: userStorage,
    };
  });

  return res.json({ users: formatted });
});

// Single User Detail with Images
router.get('/users/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = db.getUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }

  const appUrl = (req.protocol + '://' + req.get('host')) || process.env.APP_URL || 'http://localhost:3000';
  const stats = db.getUserStats(user.id);
  const images = db.getImagesByUserId(user.id).map((img) => ({
    ...img,
    cloudinary_url: resolveImageUrl(img.cloudinary_url, appUrl),
  }));
  const planLimits = db.getPlanLimits(user.plan);

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      plan: user.plan || (user.role === 'admin' ? 'admin' : 'free'),
      created_at: user.created_at,
      status: user.status,
    },
    stats,
    plan_limits: planLimits,
    images: images.slice(0, 50),
  });
});

// Update User Status (ban/unban)
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
  db.addAuditLog(
    status === 'banned' ? 'USER_BANNED' : 'USER_UNBANNED',
    req.user!.id,
    req.user!.username,
    user.username,
    `Kullanıcı hesabı ${status === 'banned' ? 'engellendi' : 'engeli kaldırıldı'}`
  );
  db.addLog('warn', `Kullanıcı durumu değiştirildi: ${user.username} -> ${status}`);
  return res.json({ message: 'Kullanıcı durumu güncellendi.' });
});

// Update User Plan
router.put('/users/:id/plan', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { plan } = req.body;

  if (!['free', 'premium', 'vip', 'admin'].includes(plan)) {
    return res.status(400).json({ error: 'Geçersiz plan türü.' });
  }

  const user = db.getUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }

  db.updateUser(id, { plan });
  db.addAuditLog(
    'PLAN_CHANGED',
    req.user!.id,
    req.user!.username,
    user.username,
    `Kullanıcı planı değiştirildi: ${user.plan || 'free'} -> ${plan}`
  );

  db.createNotification(
    user.id,
    'Planınız Güncellendi',
    `Hesabınızın planı "${plan.toUpperCase()}" olarak güncellendi. Yeni limit ve avantajlarınızdan hemen faydalanabilirsiniz.`,
    'success'
  );

  return res.json({ message: 'Kullanıcı planı başarıyla güncellendi.' });
});

// Safe Delete User
router.delete('/users/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = db.getUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }

  if (user.role === 'admin' || user.id === req.user!.id) {
    return res.status(400).json({ error: 'Admin hesabı silinemez.' });
  }

  db.addAuditLog('USER_DELETED', req.user!.id, req.user!.username, user.username, 'Kullanıcı admin tarafından silindi');
  db.deleteUser(id);

  return res.json({ message: `"${user.username}" kullanıcısı başarıyla silindi.` });
});

// Plan Limits Management
router.get('/plans', (req: AuthRequest, res: Response) => {
  const settings = db.getSettings();
  return res.json({ plans: settings.plans || {} });
});

router.put('/plans', (req: AuthRequest, res: Response) => {
  const allPlans = req.body;
  if (typeof allPlans === 'object' && allPlans !== null) {
    for (const [key, planData] of Object.entries(allPlans)) {
      db.updatePlanLimits(key, planData as any);
    }
    db.addAuditLog(
      'PLAN_LIMITS_UPDATED',
      req.user!.id,
      req.user!.username,
      'ALL_PLANS',
      'Tüm plan limitleri güncellendi'
    );
    return res.json({ message: 'Tüm plan yapılandırmaları başarıyla kaydedildi.' });
  }
  return res.status(400).json({ error: 'Geçersiz veri biçimi.' });
});

router.put('/plans/:planKey', (req: AuthRequest, res: Response) => {
  const { planKey } = req.params;
  const updates = req.body;

  const success = db.updatePlanLimits(planKey, updates);
  if (!success) {
    return res.status(404).json({ error: 'Plan bulunamadı.' });
  }

  db.addAuditLog(
    'PLAN_LIMITS_UPDATED',
    req.user!.id,
    req.user!.username,
    planKey,
    `Plan limitleri güncellendi: ${JSON.stringify(updates)}`
  );

  return res.json({ message: `${planKey.toUpperCase()} plan limitleri güncellendi.` });
});

// All Images
router.get('/images', (req: AuthRequest, res: Response) => {
  const appUrl = (req.protocol + '://' + req.get('host')) || process.env.APP_URL || 'http://localhost:3000';
  const images = db.getAllImagesForAdmin().map((img) => ({
    ...img,
    cloudinary_url: resolveImageUrl(img.cloudinary_url, appUrl),
  }));
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
  db.addAuditLog('IMAGE_DELETED', req.user!.id, req.user!.username, id, `Resim silindi: ${img.original_filename}`);
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
  const { status, notes } = req.body; // 'pending' | 'investigating' | 'resolved' | 'dismissed'

  if (!['pending', 'investigating', 'resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Geçersiz durum.' });
  }

  db.updateReportStatus(id, status, notes);
  db.addAuditLog('REPORT_STATUS_UPDATED', req.user!.id, req.user!.username, id, `Rapor durumu: ${status}`);
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

  db.addAuditLog('ANNOUNCEMENT_CREATED', req.user!.id, req.user!.username, ann.id, `Duyuru: ${ann.title}`);
  return res.json({ message: 'Duyuru yayınlandı.', announcement: ann });
});

router.delete('/announcements/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.deleteAnnouncement(id);
  db.addAuditLog('ANNOUNCEMENT_DELETED', req.user!.id, req.user!.username, id, 'Duyuru silindi');
  return res.json({ message: 'Duyuru silindi.' });
});

// Settings
router.get('/settings', (req: AuthRequest, res: Response) => {
  return res.json({ settings: db.getSettings() });
});

router.put('/settings', (req: AuthRequest, res: Response) => {
  const updated = db.updateSettings(req.body);
  db.addAuditLog('SETTINGS_CHANGED', req.user!.id, req.user!.username, 'site_settings', 'Site ayarları güncellendi');
  return res.json({ message: 'Site ayarları güncellendi.', settings: updated });
});

// Audit Logs
router.get('/audit-logs', (req: AuthRequest, res: Response) => {
  const logs = db.getAuditLogs();
  return res.json({ audit_logs: logs });
});

// Advanced Analytics
router.get('/analytics', (req: AuthRequest, res: Response) => {
  const analytics = db.getAnalytics();
  return res.json({ analytics });
});

// Admin Albums Management
router.get('/albums', (req: AuthRequest, res: Response) => {
  const albums = db.getAllAlbumsForAdmin();
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const now = Date.now();

  const formatted = albums.map((alb) => {
    const isExpired = alb.expires_at ? new Date(alb.expires_at).getTime() <= now : false;
    let coverUrl = alb.cover_image_url || null;
    if (!coverUrl && alb.image_ids && alb.image_ids.length > 0) {
      const firstImg = db.getImageById(alb.image_ids[0]);
      if (firstImg) {
        coverUrl = resolveImageUrl(firstImg.cloudinary_url, baseUrl);
      }
    }
    return {
      id: alb.id,
      share_id: alb.share_id,
      user_id: alb.user_id,
      creator_username: alb.creator_username,
      title: alb.title,
      description: alb.description,
      image_count: (alb.image_ids || []).length,
      privacy: alb.privacy,
      view_mode: alb.view_mode,
      is_password_protected: !!alb.password_hash,
      expires_at: alb.expires_at,
      is_expired: isExpired,
      status: alb.status,
      views: alb.views || 0,
      created_at: alb.created_at,
      updated_at: alb.updated_at,
      cover_image_url: coverUrl,
      share_url: `${baseUrl}/a/${alb.share_id}`,
    };
  });

  return res.json({
    albums: formatted,
    stats: {
      total: formatted.length,
      active: formatted.filter((a) => a.status === 'active' && !a.is_expired).length,
      expired: formatted.filter((a) => a.is_expired).length,
      deleted: formatted.filter((a) => a.status === 'deleted').length,
    },
  });
});

router.delete('/albums/:id', (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const album = db.getAlbumById(id) || db.getAllAlbumsForAdmin().find((a) => a.id === id);
  if (!album) {
    return res.status(404).json({ error: 'Albüm bulunamadı.' });
  }

  db.deleteAlbum(id, undefined, true);
  db.addAuditLog('ADMIN_ALBUM_DELETED', req.user!.id, req.user!.username, id, `Admin "${album.title}" albümünü sildi (görseller korundu).`);

  return res.json({
    message: 'Albüm silindi. Görseller veri tabanında ve kullanıcının galerisinde korunmaktadır.',
  });
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
