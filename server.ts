import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/auth.js';
import imageRoutes from './server/routes/images.js';
import adminRoutes from './server/routes/admin.js';
import publicRoutes from './server/routes/public.js';
import { UPLOADS_DIR } from './server/cloudinary.js';
import { apiRateLimiter } from './server/middleware/rateLimiter.js';
import { db } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Trust reverse proxy (Railway, Cloud Run, Cloudflare, Nginx)
  app.set('trust proxy', 1);

  // Essential Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // General API rate limit
  app.use('/api', apiRateLimiter);

  // Static Uploads route
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Health Endpoint for Railway / Cloud Run probes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // SEO: Robots.txt
  app.get('/robots.txt', (req, res) => {
    const baseUrl = (req.protocol + '://' + req.get('host')) || 'https://anlikresim.com';
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${baseUrl}/sitemap.xml`);
  });

  // SEO: Dynamic Sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = (req.protocol + '://' + req.get('host')) || 'https://anlikresim.com';
    const images = db.getImages().slice(0, 100);

    const staticPages = ['', '/yukle', '/galerim', '/hakkimizda', '/yardim', '/sartlar', '/gizlilik', '/iletisim'];
    const now = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    staticPages.forEach((p) => {
      xml += `  <url>\n    <loc>${baseUrl}${p}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${p === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
    });

    images.forEach((img) => {
      xml += `  <url>\n    <loc>${baseUrl}/i/${img.id}</loc>\n    <lastmod>${img.created_at}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;
    res.type('application/xml');
    res.send(xml);
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/images', imageRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/public', publicRoutes);

  // Central Express Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[AnlıkResim Server Error]:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Sunucu tarafında beklenmeyen bir hata oluştu.',
    });
  });

  // Vite Middleware for Development or Dist Static for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AnlıkResim Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Hızlı Yükle Server Startup Error]:', err);
});
