import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, UserRecord } from '../db.js';
import { authenticateToken, generateToken, requireAuth, AuthRequest } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Register
router.post('/register', authRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, username, password } = req.body;

    const settings = db.getSettings();
    if (settings.maintenance_mode) {
      return res.status(503).json({ error: 'Sistem şu anda bakım modundadır. Yeni kayıt işlemi geçici olarak kapalıdır.' });
    }
    if (!settings.allow_user_registration) {
      return res.status(403).json({ error: 'Yeni kullanıcı kayıtları geçici olarak durdurulmuştur.' });
    }

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Lütfen tüm zorunlu alanları doldurun.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanUsername = String(username).trim();

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return res.status(400).json({ error: 'Kullanıcı adı 3 ile 20 karakter arasında olmalıdır.' });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Kullanıcı adı sadece harf, rakam, alt tire ve tire içerebilir.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifreniz en az 6 karakter olmalıdır.' });
    }

    if (db.getUserByEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanılmaktadır.' });
    }

    if (db.getUserByUsername(cleanUsername)) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmıştır.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser: UserRecord = {
      id: 'usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
      email: cleanEmail,
      username: cleanUsername,
      password_hash,
      role: 'user',
      created_at: new Date().toISOString(),
      status: 'active',
    };

    db.createUser(newUser);
    db.addLog('info', `Yeni kullanıcı kaydoldu: ${cleanUsername} (${cleanEmail})`);

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    });

    const planName = newUser.plan || 'free';
    const planLimits = db.getPlanLimits(planName);
    const stats = db.getUserStats(newUser.id);
    const todayUploads = db.getUserDailyUploadCount(newUser.id);

    return res.json({
      message: 'Kayıt başarılı! Hoş geldiniz.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        plan: planName,
        created_at: newUser.created_at,
        image_count: 0,
        stats,
        plan_limits: planLimits,
        today_uploads: todayUploads,
        storage_bytes: 0,
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Kayıt işlemi sırasında bir sunucu hatası oluştu.' });
  }
});

// Login
router.post('/login', authRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'E-posta/kullanıcı adı ve şifre gereklidir.' });
    }

    const cleanIdentifier = String(identifier).trim();
    let user = db.getUserByEmail(cleanIdentifier) || db.getUserByUsername(cleanIdentifier);

    if (!user) {
      return res.status(401).json({ error: 'E-posta/kullanıcı adı veya şifre hatalı.' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ error: 'Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'E-posta/kullanıcı adı veya şifre hatalı.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    db.addLog('info', `Kullanıcı giriş yaptı: ${user.username}`);

    const planName = user.plan || (user.role === 'admin' ? 'admin' : 'free');
    const planLimits = db.getPlanLimits(planName);
    const stats = db.getUserStats(user.id);
    const todayUploads = db.getUserDailyUploadCount(user.id);

    return res.json({
      message: 'Giriş başarılı!',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        plan: planName,
        created_at: user.created_at,
        image_count: stats.total_images,
        stats,
        plan_limits: planLimits,
        today_uploads: todayUploads,
        storage_bytes: stats.total_bytes,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Giriş işlemi sırasında bir hata oluştu.' });
  }
});

// Current User
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.json({ user: null });
  }

  const dbUser = db.getUserById(req.user.id);
  if (!dbUser) {
    return res.json({ user: null });
  }

  const stats = db.getUserStats(dbUser.id);
  const planName = dbUser.plan || (dbUser.role === 'admin' ? 'admin' : 'free');
  const planLimits = db.getPlanLimits(planName);
  const todayUploads = db.getUserDailyUploadCount(dbUser.id);

  return res.json({
    user: {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      role: dbUser.role,
      plan: planName,
      created_at: dbUser.created_at,
      image_count: stats.total_images,
      stats,
      plan_limits: planLimits,
      today_uploads: todayUploads,
      bio: dbUser.bio || '',
      avatar_url: dbUser.avatar_url || '',
      two_factor_enabled: dbUser.two_factor_enabled || false,
      favorites: dbUser.favorites || [],
    },
  });
});

// Public Creator Profile & Portfolio
router.get('/public/profile/:username', (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const user = db.getUserByUsername(username);
    if (!user || user.status === 'banned') {
      return res.status(404).json({ error: 'İçerik üreticisi bulunamadı.' });
    }

    const publicImages = db.getImagesByUserId(user.id).filter((img) => img.is_public && !img.password_hash && !img.is_one_time_view);
    const totalViews = publicImages.reduce((acc, i) => acc + (i.views || 0), 0);
    const totalLikes = publicImages.reduce((acc, i) => acc + (i.likes || 0), 0);

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        plan: user.plan || 'free',
        bio: user.bio || '',
        avatar_url: user.avatar_url || '',
        created_at: user.created_at,
      },
      images: publicImages,
      stats: {
        total_public_images: publicImages.length,
        total_views: totalViews,
        total_likes: totalLikes,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Profil bilgisi yüklenemedi.' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { password, new_password, email, bio, avatar_url, two_factor_enabled } = req.body;
    const userId = req.user!.id;

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Email change is strictly prohibited for security & account integrity
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      return res.status(400).json({ error: 'Güvenlik nedeniyle hesap e-posta adresi değiştirilemez.' });
    }

    const updates: Partial<UserRecord> = {};

    if (typeof bio === 'string') updates.bio = bio.slice(0, 300);
    if (typeof avatar_url === 'string') updates.avatar_url = avatar_url;
    if (typeof two_factor_enabled === 'boolean') updates.two_factor_enabled = two_factor_enabled;

    // If changing password
    if (new_password) {
      if (!password) {
        return res.status(400).json({ error: 'Şifrenizi değiştirmek için mevcut şifrenizi girmelisiniz.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Mevcut şifreniz yanlış.' });
      }

      if (new_password.length < 6) {
        return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır.' });
      }

      updates.password_hash = await bcrypt.hash(new_password, 10);
    }

    if (Object.keys(updates).length > 0) {
      db.updateUser(userId, updates);
      db.addAuditLog('USER_PROFILE_UPDATED', user.id, user.username, user.username, 'Kullanıcı profilini ve ayarlarını güncelledi');
    }

    const updatedUser = db.getUserById(userId);

    return res.json({
      message: 'Profiliniz ve ayarlarınız başarıyla güncellendi.',
      user: updatedUser ? {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        plan: updatedUser.plan || 'free',
        bio: updatedUser.bio || '',
        avatar_url: updatedUser.avatar_url || '',
        two_factor_enabled: updatedUser.two_factor_enabled || false,
      } : null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Profil güncellenirken hata oluştu.' });
  }
});

// Delete Account
router.delete('/account', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;
    const userId = req.user!.id;

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Admin hesabı bu menüden silinemez.' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Hesabınızı silmek için şifrenizi girmelisiniz.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Girdiğiniz şifre hatalı.' });
    }

    db.addAuditLog('USER_SELF_DELETED', user.id, user.username, user.username, 'Kullanıcı kendi hesabını sildi');
    db.deleteUser(userId);

    return res.json({ message: 'Hesabınız başarıyla silindi.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Hesap silinirken bir sorun oluştu.' });
  }
});

// User Notifications
router.get('/notifications', authenticateToken, requireAuth, (req: AuthRequest, res: Response) => {
  const notifications = db.getNotificationsByUserId(req.user!.id);
  return res.json({ notifications });
});

router.post('/notifications/:id/read', authenticateToken, requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const success = db.markNotificationAsRead(id, req.user!.id);
  return res.json({ success });
});

router.post('/notifications/read-all', authenticateToken, requireAuth, (req: AuthRequest, res: Response) => {
  const success = db.markAllNotificationsAsRead(req.user!.id);
  return res.json({ success });
});

// Logout
router.post('/logout', (req, res) => {
  return res.json({ message: 'Çıkış yapıldı.' });
});

export default router;
