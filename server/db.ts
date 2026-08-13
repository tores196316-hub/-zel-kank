import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hizliyukle_db.json');
const DB_BACKUP_FILE = path.join(DATA_DIR, 'hizliyukle_db.backup.json');

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: string;
  status: 'active' | 'banned';
  plan?: 'free' | 'premium' | 'vip' | 'admin';
}

export interface FolderRecord {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface ImageRecord {
  id: string;
  user_id: string | null;
  uploader_username: string;
  cloudinary_public_id: string;
  cloudinary_url: string;
  original_filename: string;
  format: string;
  width: number;
  height: number;
  size: number;
  created_at: string;
  views: number;
  downloads: number;
  is_public: boolean;
  status: 'active' | 'deleted' | 'flagged';
  delete_token: string;
  is_favorite?: boolean;
  folder_id?: string | null;
}

export interface ReportRecord {
  id: string;
  image_id: string;
  reason: string;
  ip: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  notes?: string;
  created_at: string;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  active: boolean;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  actor_id?: string;
  actor_username?: string;
  target?: string;
  details?: string;
  created_at: string;
}

export interface PlanConfig {
  name: string;
  daily_upload_limit: number;
  max_file_size_mb: number;
  storage_limit_gb: number;
  ads_enabled: boolean;
  features: string[];
}

export interface SiteSettingsRecord {
  site_title: string;
  site_description: string;
  max_file_size_mb: number;
  allow_guest_upload: boolean;
  allow_user_registration: boolean;
  maintenance_mode: boolean;
  announcement_enabled: boolean;
  announcement_text: string;
  allowed_formats?: string[];
  header_ad_code?: string;
  sidebar_ad_code?: string;
  image_page_ad_code?: string;
  plans?: Record<string, PlanConfig>;
}

export interface DatabaseSchema {
  users: UserRecord[];
  images: ImageRecord[];
  folders: FolderRecord[];
  reports: ReportRecord[];
  announcements: AnnouncementRecord[];
  notifications: NotificationRecord[];
  audit_logs: AuditLogRecord[];
  settings: SiteSettingsRecord;
  logs: { id: string; level: string; message: string; timestamp: string }[];
  view_logs: { image_id: string; ip: string; timestamp: number }[];
}

const defaultPlans: Record<string, PlanConfig> = {
  free: {
    name: 'Ücretsiz (Free)',
    daily_upload_limit: 15,
    max_file_size_mb: 10,
    storage_limit_gb: 1,
    ads_enabled: true,
    features: ['15 Günlük Yükleme', '10 MB Maksimum Dosya Boyutu', '1 GB Güvenli Depolama', 'Doğrudan CDN Bağlantıları', 'Temel Klasörleme'],
  },
  premium: {
    name: 'Premium',
    daily_upload_limit: 100,
    max_file_size_mb: 30,
    storage_limit_gb: 15,
    ads_enabled: false,
    features: ['100 Günlük Yükleme', '30 MB Maksimum Dosya Boyutu', '15 GB Güvenli Depolama', 'Tamamen Reklamsız Deneyim', 'Öncelikli CDN Bant Genişliği', 'Sınırsız Klasör Yönetimi'],
  },
  vip: {
    name: 'VIP',
    daily_upload_limit: 500,
    max_file_size_mb: 50,
    storage_limit_gb: 50,
    ads_enabled: false,
    features: ['500 Günlük Yükleme', '50 MB Maksimum Dosya Boyutu', '50 GB Güvenli Depolama', 'Sıfır Reklam', 'Maksimum Hız ve Öncelik', 'Gelişmiş İstatistikler & VIP Rozeti'],
  },
  admin: {
    name: 'Yönetici (Admin)',
    daily_upload_limit: 9999,
    max_file_size_mb: 100,
    storage_limit_gb: 500,
    ads_enabled: false,
    features: ['Sınırsız Yükleme', '100 MB Dosya Boyutu', '500 GB Depolama', 'Tam Yönetim Yetkisi'],
  },
};

const defaultSettings: SiteSettingsRecord = {
  site_title: 'AnlıkResim',
  site_description: 'Hızlı, güvenli ve yüksek kaliteli resim yükleme ve paylaşım platformu',
  max_file_size_mb: 20,
  allow_guest_upload: true,
  allow_user_registration: true,
  maintenance_mode: false,
  announcement_enabled: true,
  announcement_text: 'AnlıkResim V3 yayında! Kullanıcı Paneli, Plan Altyapısı, Gelişmiş Ayarlar ve Bildirimler aktif.',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  header_ad_code: '',
  sidebar_ad_code: '',
  image_page_ad_code: '',
  plans: defaultPlans,
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: [],
      images: [],
      folders: [],
      reports: [],
      announcements: [],
      notifications: [],
      audit_logs: [],
      settings: defaultSettings,
      logs: [],
      view_logs: [],
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      let loaded = false;

      // Try primary DB file
      if (fs.existsSync(DB_FILE)) {
        try {
          const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
          if (fileContent && fileContent.trim().length > 0) {
            const parsed = JSON.parse(fileContent);
            this.populateFromData(parsed);
            loaded = true;
          }
        } catch (e) {
          console.warn('Failed to parse primary DB file, trying backup:', e);
        }
      }

      // If primary failed or was empty, try backup DB file
      if (!loaded && fs.existsSync(DB_BACKUP_FILE)) {
        try {
          const backupContent = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
          if (backupContent && backupContent.trim().length > 0) {
            const parsed = JSON.parse(backupContent);
            this.populateFromData(parsed);
            loaded = true;
          }
        } catch (e) {
          console.error('Failed to parse backup DB file:', e);
        }
      }

      this.seedInitialData();
      this.save();
    } catch (err) {
      console.error('Database initialization error:', err);
      this.seedInitialData();
      this.save();
    }
  }

  private populateFromData(parsed: any) {
    this.data = {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      images: Array.isArray(parsed.images) ? parsed.images : [],
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      audit_logs: Array.isArray(parsed.audit_logs) ? parsed.audit_logs : [],
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      view_logs: Array.isArray(parsed.view_logs) ? parsed.view_logs : [],
    };
    if (!this.data.settings.plans) {
      this.data.settings.plans = defaultPlans;
    }
  }

  private seedInitialData() {
    if (!this.data.users) this.data.users = [];
    if (!this.data.images) this.data.images = [];
    if (!this.data.folders) this.data.folders = [];
    if (!this.data.reports) this.data.reports = [];
    if (!this.data.announcements) this.data.announcements = [];
    if (!this.data.notifications) this.data.notifications = [];
    if (!this.data.audit_logs) this.data.audit_logs = [];
    if (!this.data.logs) this.data.logs = [];
    if (!this.data.view_logs) this.data.view_logs = [];

    const isProduction = process.env.NODE_ENV === 'production';

    // Only configure seed passwords if creating new accounts
    const initialAdminPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD || (isProduction ? crypto.randomBytes(16).toString('hex') : 'admin123');
    const adminPasswordHash = bcrypt.hashSync(initialAdminPass, 10);

    const defaultAdmin: UserRecord = {
      id: 'usr_admin_1',
      email: 'admin@hizliyukle.com',
      username: 'admin',
      password_hash: adminPasswordHash,
      role: 'admin',
      plan: 'admin',
      created_at: new Date().toISOString(),
      status: 'active',
    };

    const ownerAdmin: UserRecord = {
      id: 'usr_owner_tores',
      email: 'tores196316@gmail.com',
      username: 'tores',
      password_hash: adminPasswordHash,
      role: 'admin',
      plan: 'admin',
      created_at: new Date().toISOString(),
      status: 'active',
    };

    // Seed admin accounts only if they don't already exist
    if (!this.data.users.some((u) => u.username.toLowerCase() === 'admin' || u.email.toLowerCase() === 'admin@hizliyukle.com')) {
      this.data.users.push(defaultAdmin);
    }

    if (!this.data.users.some((u) => u.username.toLowerCase() === 'tores' || u.email.toLowerCase() === 'tores196316@gmail.com')) {
      this.data.users.push(ownerAdmin);
    }

    // Only create demo user in non-production environments if not already present
    if (!isProduction) {
      const demoPasswordHash = bcrypt.hashSync('user123', 10);
      const defaultUser: UserRecord = {
        id: 'usr_demo_1',
        email: 'kullanici@hizliyukle.com',
        username: 'demo_user',
        password_hash: demoPasswordHash,
        role: 'user',
        plan: 'free',
        created_at: new Date().toISOString(),
        status: 'active',
      };

      if (!this.data.users.some((u) => u.username.toLowerCase() === 'demo_user' || u.email.toLowerCase() === 'kullanici@hizliyukle.com')) {
        this.data.users.push(defaultUser);
      }
    }

    // Ensure all existing users have a valid plan
    this.data.users.forEach((u) => {
      if (!u.plan) {
        u.plan = u.role === 'admin' ? 'admin' : 'free';
      }
    });

    if (!this.data.settings) {
      this.data.settings = defaultSettings;
    }
    if (!this.data.settings.plans) {
      this.data.settings.plans = defaultPlans;
    }

    if (!this.data.announcements || this.data.announcements.length === 0) {
      this.data.announcements = [
        {
          id: 'ann_1',
          title: 'AnlıkResim V3 Yayında!',
          content: 'Kullanıcı Paneli, Plan Altyapısı (Free / Premium / VIP), Gelişmiş Ayarlar, Bildirimler ve Detaylı İstatistikler kullanıma sunuldu.',
          type: 'info',
          active: true,
          created_at: new Date().toISOString(),
        },
      ];
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const serialized = JSON.stringify(this.data, null, 2);
      
      // Atomic write to primary DB file
      const tmpFile = DB_FILE + '.tmp';
      fs.writeFileSync(tmpFile, serialized, 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);

      // Write to backup DB file for extra safety
      fs.writeFileSync(DB_BACKUP_FILE, serialized, 'utf-8');
    } catch (err) {
      console.error('Database save error:', err);
      try {
        const serialized = JSON.stringify(this.data, null, 2);
        fs.writeFileSync(DB_FILE, serialized, 'utf-8');
        fs.writeFileSync(DB_BACKUP_FILE, serialized, 'utf-8');
      } catch (e) {
        console.error('Fallback database save error:', e);
      }
    }
  }

  // Users
  public getUsers(): UserRecord[] {
    return this.data.users;
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): UserRecord | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByUsername(username: string): UserRecord | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public createUser(user: UserRecord): UserRecord {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return undefined;
  }

  // Images
  public getImages(): ImageRecord[] {
    return this.data.images.filter((img) => img.status !== 'deleted');
  }

  public getAllImagesForAdmin(): ImageRecord[] {
    return this.data.images;
  }

  public getImageById(id: string): ImageRecord | undefined {
    const img = this.data.images.find((i) => i.id === id);
    if (img && img.status !== 'deleted') return img;
    return undefined;
  }

  public getImagesByUserId(userId: string): ImageRecord[] {
    return this.data.images.filter((i) => i.user_id === userId && i.status !== 'deleted');
  }

  public createImage(img: ImageRecord): ImageRecord {
    this.data.images.unshift(img);
    this.save();
    return img;
  }

  public updateImage(id: string, updates: Partial<ImageRecord>): ImageRecord | undefined {
    const idx = this.data.images.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.data.images[idx] = { ...this.data.images[idx], ...updates };
      this.save();
      return this.data.images[idx];
    }
    return undefined;
  }

  public deleteImage(id: string): boolean {
    const idx = this.data.images.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.data.images[idx].status = 'deleted';
      this.save();
      return true;
    }
    return false;
  }

  public incrementImageViews(id: string): void {
    const img = this.getImageById(id);
    if (img) {
      img.views = (img.views || 0) + 1;
      this.save();
    }
  }

  public incrementImageDownloads(id: string): void {
    const img = this.getImageById(id);
    if (img) {
      img.downloads = (img.downloads || 0) + 1;
      this.save();
    }
  }

  // Reports
  public createReport(report: ReportRecord): ReportRecord {
    this.data.reports.unshift(report);
    this.save();
    return report;
  }

  public getReports(): ReportRecord[] {
    return this.data.reports;
  }

  public updateReportStatus(id: string, status: 'pending' | 'investigating' | 'resolved' | 'dismissed', notes?: string): boolean {
    const r = this.data.reports.find((item) => item.id === id);
    if (r) {
      r.status = status;
      if (notes !== undefined) r.notes = notes;
      this.save();
      return true;
    }
    return false;
  }

  // Plans Management
  public getPlanLimits(planName?: string): PlanConfig {
    const plans = this.data.settings.plans || defaultPlans;
    const planKey = (planName || 'free').toLowerCase();
    return plans[planKey] || plans['free'] || defaultPlans['free'];
  }

  public updatePlanLimits(planKey: string, updates: Partial<PlanConfig>): boolean {
    if (!this.data.settings.plans) {
      this.data.settings.plans = { ...defaultPlans };
    }
    if (this.data.settings.plans[planKey]) {
      this.data.settings.plans[planKey] = { ...this.data.settings.plans[planKey], ...updates };
      this.save();
      return true;
    }
    return false;
  }

  public getUserDailyUploadCount(userId: string): number {
    const today = new Date().toISOString().split('T')[0];
    return this.data.images.filter(
      (img) => img.user_id === userId && img.status !== 'deleted' && img.created_at.startsWith(today)
    ).length;
  }

  public getUserStorageUsed(userId: string): number {
    const userImages = this.getImagesByUserId(userId);
    return userImages.reduce((acc, img) => acc + (img.size || 0), 0);
  }

  // Delete User (Safe Account deletion)
  public deleteUser(userId: string): boolean {
    const idx = this.data.users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      // Mark images as guest or deleted
      this.data.images.forEach((img) => {
        if (img.user_id === userId) {
          img.user_id = null;
          img.uploader_username = 'Eski Kullanıcı (Silindi)';
        }
      });
      // Delete user's folders and notifications
      this.data.folders = (this.data.folders || []).filter((f) => f.user_id !== userId);
      this.data.notifications = (this.data.notifications || []).filter((n) => n.user_id !== userId);
      this.data.users.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Notifications
  public getNotificationsByUserId(userId: string): NotificationRecord[] {
    return (this.data.notifications || []).filter((n) => n.user_id === userId);
  }

  public createNotification(userId: string, title: string, message: string, type: 'info' | 'warning' | 'success' = 'info'): NotificationRecord {
    if (!this.data.notifications) this.data.notifications = [];
    const notif: NotificationRecord = {
      id: 'notif_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
      user_id: userId,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    // Keep max 50 notifications per user
    if (this.data.notifications.length > 500) {
      this.data.notifications = this.data.notifications.slice(0, 500);
    }
    this.save();
    return notif;
  }

  public markNotificationAsRead(id: string, userId: string): boolean {
    if (!this.data.notifications) return false;
    const notif = this.data.notifications.find((n) => n.id === id && n.user_id === userId);
    if (notif) {
      notif.read = true;
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsAsRead(userId: string): boolean {
    if (!this.data.notifications) return false;
    let modified = false;
    this.data.notifications.forEach((n) => {
      if (n.user_id === userId && !n.read) {
        n.read = true;
        modified = true;
      }
    });
    if (modified) this.save();
    return true;
  }

  // Audit Logs
  public addAuditLog(action: string, actor_id?: string, actor_username?: string, target?: string, details?: string): void {
    if (!this.data.audit_logs) this.data.audit_logs = [];
    this.data.audit_logs.unshift({
      id: 'audit_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'),
      action,
      actor_id,
      actor_username,
      target,
      details,
      created_at: new Date().toISOString(),
    });
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
    this.save();
  }

  public getAuditLogs(): AuditLogRecord[] {
    return this.data.audit_logs || [];
  }

  // Advanced Analytics
  public getAnalytics() {
    const images = this.getImages();
    const users = this.getUsers();

    // 14-day upload trend
    const last14Days: { date: string; label: string; count: number; bytes: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayImages = images.filter((img) => img.created_at.startsWith(dateStr));
      const dayBytes = dayImages.reduce((sum, img) => sum + (img.size || 0), 0);
      last14Days.push({
        date: dateStr,
        label: `${d.getDate()} ${d.toLocaleString('tr-TR', { month: 'short' })}`,
        count: dayImages.length,
        bytes: dayBytes,
      });
    }

    // Plan distribution
    const planDistribution = {
      free: users.filter((u) => !u.plan || u.plan === 'free').length,
      premium: users.filter((u) => u.plan === 'premium').length,
      vip: users.filter((u) => u.plan === 'vip').length,
      admin: users.filter((u) => u.plan === 'admin' || u.role === 'admin').length,
    };

    // Top 15 most viewed images
    const topViewedImages = [...images]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 15)
      .map((img) => ({
        id: img.id,
        original_filename: img.original_filename,
        cloudinary_url: img.cloudinary_url,
        views: img.views || 0,
        downloads: img.downloads || 0,
        size: img.size,
        format: img.format,
        created_at: img.created_at,
        uploader_username: img.uploader_username,
      }));

    return {
      daily_uploads: last14Days,
      plan_distribution: planDistribution,
      top_viewed: topViewedImages,
    };
  }

  // Settings
  public getSettings(): SiteSettingsRecord {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SiteSettingsRecord>): SiteSettingsRecord {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }

  // Announcements
  public getAnnouncements(): AnnouncementRecord[] {
    return this.data.announcements;
  }

  public createAnnouncement(ann: AnnouncementRecord): AnnouncementRecord {
    this.data.announcements.unshift(ann);
    this.save();
    return ann;
  }

  public deleteAnnouncement(id: string): boolean {
    this.data.announcements = this.data.announcements.filter((a) => a.id !== id);
    this.save();
    return true;
  }

  // Folders
  public getFoldersByUserId(userId: string): FolderRecord[] {
    return (this.data.folders || []).filter((f) => f.user_id === userId);
  }

  public createFolder(folder: FolderRecord): FolderRecord {
    if (!this.data.folders) this.data.folders = [];
    this.data.folders.push(folder);
    this.save();
    return folder;
  }

  public deleteFolder(id: string, userId: string): boolean {
    if (!this.data.folders) return false;
    const initialLen = this.data.folders.length;
    this.data.folders = this.data.folders.filter((f) => !(f.id === id && f.user_id === userId));
    
    // Remove folder_id reference from images in this folder
    this.data.images.forEach((img) => {
      if (img.user_id === userId && img.folder_id === id) {
        img.folder_id = null;
      }
    });

    this.save();
    return this.data.folders.length < initialLen;
  }

  // Favorites & Folder Updates
  public toggleFavorite(imageId: string, userId: string): boolean {
    const img = this.data.images.find((i) => i.id === imageId && i.user_id === userId && i.status !== 'deleted');
    if (img) {
      img.is_favorite = !img.is_favorite;
      this.save();
      return img.is_favorite;
    }
    return false;
  }

  public setImageFolder(imageId: string, userId: string, folderId: string | null): boolean {
    const img = this.data.images.find((i) => i.id === imageId && i.user_id === userId && i.status !== 'deleted');
    if (!img) return false;

    // If removing folder assignment
    if (!folderId || folderId === '') {
      img.folder_id = null;
      this.save();
      return true;
    }

    // Verify folder belongs to the same user
    const folder = (this.data.folders || []).find((f) => f.id === folderId && f.user_id === userId);
    if (!folder) {
      return false;
    }

    img.folder_id = folderId;
    this.save();
    return true;
  }

  // Throttled View Increment (1 view per IP per image every 5 minutes)
  public incrementImageViewsThrottled(id: string, ip: string): void {
    if (!this.data.view_logs) this.data.view_logs = [];
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    const existingLog = this.data.view_logs.find((v) => v.image_id === id && v.ip === ip);
    if (existingLog) {
      if (now - existingLog.timestamp > fiveMinutes) {
        existingLog.timestamp = now;
        this.incrementImageViews(id);
      }
    } else {
      this.data.view_logs.push({ image_id: id, ip, timestamp: now });
      this.incrementImageViews(id);
      // Clean up view logs older than 1 hour
      if (this.data.view_logs.length > 500) {
        this.data.view_logs = this.data.view_logs.filter((v) => now - v.timestamp < 3600000);
      }
    }
  }

  // User Stats & Today Stats
  public getUserStats(userId: string) {
    const userImages = this.getImagesByUserId(userId);
    const totalBytes = userImages.reduce((acc, img) => acc + (img.size || 0), 0);
    const totalViews = userImages.reduce((acc, img) => acc + (img.views || 0), 0);
    const favoriteCount = userImages.filter((img) => img.is_favorite).length;

    return {
      total_images: userImages.length,
      total_bytes: totalBytes,
      total_views: totalViews,
      favorite_count: favoriteCount,
      last_upload_at: userImages[0] ? userImages[0].created_at : null,
    };
  }

  public getTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayImages = this.data.images.filter((img) => img.status !== 'deleted' && img.created_at.startsWith(today)).length;
    const todayUsers = this.data.users.filter((u) => u.created_at.startsWith(today)).length;

    return {
      today_images: todayImages,
      today_users: todayUsers,
    };
  }

  // Logs
  public addLog(level: 'info' | 'warn' | 'error', message: string) {
    this.data.logs.unshift({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      level,
      message,
      timestamp: new Date().toISOString(),
    });
    // Keep max 200 logs
    if (this.data.logs.length > 200) {
      this.data.logs = this.data.logs.slice(0, 200);
    }
    this.save();
  }

  public getLogs() {
    return this.data.logs;
  }
}

export const db = new Database();
