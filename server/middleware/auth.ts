import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const isProduction = process.env.NODE_ENV === 'production';
const rawJwtSecret = process.env.JWT_SECRET;

if (isProduction && (!rawJwtSecret || rawJwtSecret.trim().length < 16)) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing or too short in production mode! Server startup aborted.');
  process.exit(1);
}

export const JWT_SECRET = rawJwtSecret || 'anlikresim_dev_fallback_secret_key_2026_v3';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: 'admin' | 'user';
    plan?: string;
  };
}

export function generateToken(payload: { id: string; email: string; username: string; role: 'admin' | 'user' }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = undefined;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const dbUser = db.getUserById(decoded.id);

    if (!dbUser || dbUser.status === 'banned') {
      return res.status(403).json({ error: 'Hesabınız askıya alınmıştır veya bulunamadı.' });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      role: dbUser.role,
      plan: dbUser.plan || (dbUser.role === 'admin' ? 'admin' : 'free'),
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum jetonu.' });
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Bu işlem için giriş yapmalısınız.' });
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu alana erişim yetkiniz bulunmamaktadır.' });
  }
  next();
}
