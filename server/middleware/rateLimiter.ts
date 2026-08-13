import rateLimit from 'express-rate-limit';

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Çok fazla yükleme isteği gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.',
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Çok fazla giriş / kayıt denemesi. Lütfen birkaç dakika bekleyin.',
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

export const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 submissions per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Çok fazla bildirim veya mesaj gönderimi yapıldı. Lütfen 15 dakika sonra tekrar deneyin.',
  },
});
