import { Router, Response, Request } from 'express';
import { db } from '../db.js';
import { contactRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Site settings for frontend
router.get('/settings', (req: Request, res: Response) => {
  const settings = db.getSettings();
  return res.json({
    site_title: settings.site_title,
    site_description: settings.site_description,
    max_file_size_mb: settings.max_file_size_mb,
    allow_guest_upload: settings.allow_guest_upload,
    allow_user_registration: settings.allow_user_registration,
    maintenance_mode: settings.maintenance_mode,
    announcement_enabled: settings.announcement_enabled,
    announcement_text: settings.announcement_text,
    plans: settings.plans || {},
    allowed_formats: settings.allowed_formats || ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    header_ad_code: settings.header_ad_code || '',
    sidebar_ad_code: settings.sidebar_ad_code || '',
    image_page_ad_code: settings.image_page_ad_code || '',
  });
});

// Active announcements
router.get('/announcements', (req: Request, res: Response) => {
  const activeAnnouncements = db.getAnnouncements().filter((a) => a.active);
  return res.json({ announcements: activeAnnouncements });
});

// Contact message handler
router.post('/contact', contactRateLimiter, (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Lütfen isim, e-posta ve mesaj alanlarını doldurun.' });
  }

  db.addLog('info', `İletişim mesajı alındı: ${name} (${email}) - ${subject || 'Konusuz'}`);

  return res.json({
    message: 'Mesajınız başarıyla ekibimize iletildi. En kısa sürede dönüş yapılacaktır.',
  });
});

export default router;
