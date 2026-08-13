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
}

export interface DatabaseSchema {
  users: UserRecord[];
  images: ImageRecord[];
  reports: ReportRecord[];
  announcements: AnnouncementRecord[];
  settings: SiteSettingsRecord;
  logs: { id: string; level: string; message: string; timestamp: string }[];
}

const defaultSettings: SiteSettingsRecord = {
  site_title: 'Hızlı Yükle',
  site_description: 'Hızlı, güvenli ve yüksek kaliteli resim yükleme ve paylaşım platformu',
  max_file_size_mb: 20,
  allow_guest_upload: true,
  allow_user_registration: true,
  maintenance_mode: false,
  announcement_enabled: true,
  announcement_text: 'Hızlı Yükle v2.0 yayında! Artık sürükle-bırak ve toplu yükleme desteği mevcut.',
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: [],
      images: [],
      reports: [],
      announcements: [],
      settings: defaultSettings,
      logs: [],
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
        this.data = JSON.parse(fileContent);
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Database initialization error:', err);
      this.seedInitialData();
    }
  }

  private seedInitialData() {
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

    this.data.users = [defaultAdmin, defaultUser];
    this.data.settings = defaultSettings;
    this.data.announcements = [
      {
        id: 'ann_1',
        title: 'Hoş Geldiniz!',
        content: 'Hızlı Yükle servisi ile resimlerinizi anında yükleyin, direkt bağlantılarınızı alın.',
        type: 'info',
        active: true,
        created_at: new Date().toISOString(),
      },
    ];
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Database save error:', err);
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
