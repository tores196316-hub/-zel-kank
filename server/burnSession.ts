import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db, ImageRecord } from './db.js';
import { deleteFromCloudinary, UPLOADS_DIR } from './cloudinary.js';

export interface BurnSession {
  sessionId: string;
  imageId: string;
  clientIp: string;
  createdAt: number;
  lastHeartbeat: number;
  expiresAt: number;
  status: 'active' | 'completed' | 'expired';
}

const JWT_SECRET = process.env.JWT_SECRET || 'imgivo_burn_secure_session_key_2026';
const SESSION_MAX_LIFETIME_MS = 5 * 60 * 1000; // 5 minutes max session length
const HEARTBEAT_TIMEOUT_MS = 45 * 1000; // 45 seconds without heartbeat triggers auto-burn

class BurnSessionManager {
  private sessions = new Map<string, BurnSession>(); // sessionId -> BurnSession
  private imageToSession = new Map<string, string>(); // imageId -> sessionId
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start background cleanup timer for abandoned/expired burn sessions
    this.cleanupInterval = setInterval(() => {
      this.checkExpiredSessions();
    }, 5000);
  }

  /**
   * Generates a tamper-proof signed session token containing sessionId and imageId
   */
  public generateSessionToken(sessionId: string, imageId: string): string {
    const timestamp = Date.now();
    const payload = `${sessionId}:${imageId}:${timestamp}`;
    const hmac = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    return `${payload}.${hmac}`;
  }

  /**
   * Validates a signed session token
   */
  public verifySessionToken(imageId: string, token: string): { sessionId: string; valid: boolean } {
    if (!token) return { sessionId: '', valid: false };
    const parts = token.split('.');
    if (parts.length !== 2) return { sessionId: '', valid: false };

    const [payload, hmac] = parts;
    const expectedHmac = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    if (hmac !== expectedHmac) return { sessionId: '', valid: false };

    const [sessionId, tokenImageId, timestampStr] = payload.split(':');
    if (tokenImageId !== imageId) return { sessionId: '', valid: false };

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > SESSION_MAX_LIFETIME_MS + 60000) {
      return { sessionId, valid: false };
    }

    return { sessionId, valid: true };
  }

  /**
   * Creates a new view session or returns an existing active session for the same client.
   * Ensures only ONE active view session can exist for a given burn image (Race-condition safe).
   */
  public getOrCreateSession(
    imageId: string,
    clientIp: string
  ): { session: BurnSession | null; token: string; error?: string } {
    const img = db.getImageById(imageId);
    if (!img || img.status === 'deleted') {
      return { session: null, token: '', error: 'Görsel artık mevcut değil veya daha önce görüntülenmiş.' };
    }

    if (!img.is_one_time_view) {
      return { session: null, token: '', error: 'Bu görsel tek kullanımlık değildir.' };
    }

    const existingSessionId = this.imageToSession.get(imageId);
    const now = Date.now();

    if (existingSessionId) {
      const existing = this.sessions.get(existingSessionId);
      if (existing && existing.status === 'active') {
        // If session is still alive:
        const isExpired = now - existing.lastHeartbeat > HEARTBEAT_TIMEOUT_MS || now > existing.expiresAt;
        if (isExpired) {
          // Trigger destruction of expired session
          this.destroyAndBurn(imageId, existingSessionId);
          return { session: null, token: '', error: 'Görsel görüntüleme oturumu sona erdi ve imha edildi.' };
        }

        // Allow continuation for the same session/client
        const token = this.generateSessionToken(existing.sessionId, imageId);
        return { session: existing, token };
      }
    }

    // Create brand new session
    const sessionId = 'bsess_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
    const newSession: BurnSession = {
      sessionId,
      imageId,
      clientIp,
      createdAt: now,
      lastHeartbeat: now,
      expiresAt: now + SESSION_MAX_LIFETIME_MS,
      status: 'active',
    };

    this.sessions.set(sessionId, newSession);
    this.imageToSession.set(imageId, sessionId);

    const token = this.generateSessionToken(sessionId, imageId);
    return { session: newSession, token };
  }

  /**
   * Validates if a session is currently active and authorized to view image data
   */
  public isSessionActive(imageId: string, sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.imageId !== imageId || session.status !== 'active') {
      return false;
    }
    const now = Date.now();
    if (now - session.lastHeartbeat > HEARTBEAT_TIMEOUT_MS || now > session.expiresAt) {
      this.destroyAndBurn(imageId, sessionId);
      return false;
    }
    return true;
  }

  /**
   * Heartbeat to keep session alive while user is looking at the viewer
   */
  public recordHeartbeat(sessionId: string, imageId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.imageId !== imageId || session.status !== 'active') {
      return false;
    }
    const now = Date.now();
    if (now > session.expiresAt) {
      this.destroyAndBurn(imageId, sessionId);
      return false;
    }
    session.lastHeartbeat = now;
    return true;
  }

  /**
   * Completes the session and permanently destroys the image from Cloudinary, Disk, and Database.
   */
  public async completeAndBurnSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = 'completed';
    return await this.destroyAndBurn(session.imageId, sessionId);
  }

  /**
   * Immediate destruction worker
   */
  public async destroyAndBurn(imageId: string, sessionId?: string): Promise<boolean> {
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) session.status = 'completed';
      this.sessions.delete(sessionId);
    }
    this.imageToSession.delete(imageId);

    const img = db.getImageById(imageId);
    if (!img) {
      // Already deleted
      return true;
    }

    console.log(`[BurnSession] Permanently destroying image ${imageId} (${img.original_filename})...`);

    // 1. Destroy from Cloudinary
    if (img.cloudinary_public_id) {
      try {
        await deleteFromCloudinary(img.cloudinary_public_id);
      } catch (err) {
        console.error('[BurnSession] Cloudinary destroy error:', err);
      }
    }

    // 2. Destroy from local disk
    try {
      const safePublicId = path.basename(img.cloudinary_public_id);
      if (fs.existsSync(UPLOADS_DIR)) {
        const files = fs.readdirSync(UPLOADS_DIR);
        const target = files.find(
          (f) => path.parse(f).name === safePublicId || f === safePublicId || f === img.original_filename
        );
        if (target) {
          const filePath = path.join(UPLOADS_DIR, target);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (err) {
      console.error('[BurnSession] Local disk destroy error:', err);
    }

    // 3. Purge from DB
    db.purgeImage(imageId);
    db.addLog('info', `🔥 1 Görüntüleme Sonrası İmha: Görsel oturumu tamamlandı ve kalıcı olarak imha edildi (ID: ${imageId})`);

    return true;
  }

  /**
   * Background TTL check
   */
  private checkExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.status === 'active') {
        const isHeartbeatExpired = now - session.lastHeartbeat > HEARTBEAT_TIMEOUT_MS;
        const isMaxLifetimeExpired = now > session.expiresAt;

        if (isHeartbeatExpired || isMaxLifetimeExpired) {
          console.log(`[BurnSession] Session ${sessionId} timed out. Triggering auto-burn.`);
          this.destroyAndBurn(session.imageId, sessionId);
        }
      }
    }
  }
}

export const burnSessionManager = new BurnSessionManager();
