import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hizliyukle_db.json');

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
  status: 'pending' | 'reviewed' | 'dismissed';
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
}

export interface DatabaseSchema {
  users: UserRecord[];
  images: ImageRecord[];
  folders: FolderRecord[];
  reports: ReportRecord[];
  announcements: AnnouncementRecord[];
  settings: SiteSettingsRecord;
  logs: { id: string; level: string; message: string; timestamp: string }[];
  view_logs: { image_id: string; ip: string; timestamp: number }[];
}

const defaultSettings: SiteSettingsRecord = {
  site_title: 'AnlıkResim',
  site_description: 'Hızlı, güvenli ve yüksek kaliteli resim yükleme ve paylaşım platformu',
  max_file_size_mb: 20,
  allow_guest_upload: true,
  allow_user_registration: true,
  maintenance_mode: false,
  announcement_enabled: true,
  announcement_text: 'AnlıkResim V2 yayında! Sürükle-bırak, klasörler, favoriler ve gelişmiş paylaşım kodları aktif.',
  allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  header_ad_code: '',
  sidebar_ad_code: '',
  image_page_ad_code: '',
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

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        if (fileContent && fileContent.trim().length > 0) {
          const parsed = JSON.parse(fileContent);
          this.data = {
            users: Array.isArray(parsed.users) ? parsed.users : [],
            images: Array.isArray(parsed.images) ? parsed.images : [],
            folders: Array.isArray(parsed.folders) ? parsed.folders : [],
            reports: Array.isArray(parsed.reports) ? parsed.reports : [],
            announcements: Array.isArray(parsed.announcements) ? parsed.announcements : [],
            settings: parsed.settings || defaultSettings,
            logs: Array.isArray(parsed.logs) ? parsed.logs : [],
            view_logs: Array.isArray(parsed.view_logs) ? parsed.view_logs : [],
          };
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

  private seedInitialData() {
    if (!this.data.users) this.data.users = [];
    if (!this.data.images) this.data.images = [];
    if (!this.data.folders) this.data.folders = [];
    if (!this.data.reports) this.data.reports = [];
    if (!this.data.logs) this.data.logs = [];
    if (!this.data.view_logs) this.data.view_logs = [];

    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    const demoPasswordHash = bcrypt.hashSync('user123', 10);

    const defaultAdmin: UserRecord = {
      id: 'usr_admin_1',
      email: 'admin@hizliyukle.com',
      username: 'admin',
      password_hash: adminPasswordHash,
      role: 'admin',
      created_at: new Date().toISOString(),
      status: 'active',
    };

    const defaultUser: UserRecord = {
      id: 'usr_demo_1',
      email: 'kullanici@hizliyukle.com',
      username: 'demo_user',
      password_hash: demoPasswordHash,
      role: 'user',
      created_at: new Date().toISOString(),
      status: 'active',
    };

    if (!this.data.users.some((u) => u.username === 'admin' || u.id === 'usr_admin_1')) {
      this.data.users.push(defaultAdmin);
    }

    if (!this.data.users.some((u) => u.username === 'demo_user' || u.id === 'usr_demo_1')) {
      this.data.users.push(defaultUser);
    }

    if (!this.data.settings) {
      this.data.settings = defaultSettings;
    }

    if (!this.data.announcements || this.data.announcements.length === 0) {
      this.data.announcements = [
        {
          id: 'ann_1',
          title: 'Hoş Geldiniz!',
          content: 'AnlıkResim servisi ile resimlerinizi anında yükleyin, direkt bağlantılarınızı alın.',
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
      const tmpFile = DB_FILE + '.tmp';
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Database save error:', err);
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
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

  public updateReportStatus(id: string, status: 'reviewed' | 'dismissed'): boolean {
    const r = this.data.reports.find((item) => item.id === id);
    if (r) {
      r.status = status;
      this.save();
      return true;
    }
    return false;
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
    if (img) {
      img.folder_id = folderId;
      this.save();
      return true;
    }
    return false;
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
