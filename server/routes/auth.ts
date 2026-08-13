import { Router, Response } from 'express';
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
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
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

    return res.json({
      message: 'Kayıt başarılı! Hoş geldiniz.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        created_at: newUser.created_at,
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

    return res.json({
      message: 'Giriş başarılı!',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        created_at: user.created_at,
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

  return res.json({
    user: {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      role: dbUser.role,
      plan: dbUser.plan || (dbUser.role === 'admin' ? 'admin' : 'free'),
      created_at: dbUser.created_at,
      image_count: stats.total_images,
      stats,
    },
  });
});

// Update Profile
router.put('/profile', authenticateToken, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { password, new_password } = req.body;
    const userId = req.user!.id;

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    if (new_password) {
      if (!password) {
        return res.status(400).json({ error: 'Mevcut şifrenizi girmelisiniz.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Mevcut şifreniz yanlış.' });
      }

      if (new_password.length < 6) {
        return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır.' });
      }

      const newHash = await bcrypt.hash(new_password, 10);
      db.updateUser(userId, { password_hash: newHash });
    }

    return res.json({ message: 'Profil bilgileriniz başarıyla güncellendi.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Profil güncellenirken hata oluştu.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  return res.json({ message: 'Çıkış yapıldı.' });
});

export default router;
