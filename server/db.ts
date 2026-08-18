import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DB_FILE = path.join(DATA_DIR, 'hizliyukle_db.json');
const DB_BACKUP_FILE = path.join(DATA_DIR, 'hizliyukle_db.backup.json');
const DB_USERS_ARCHIVE = path.join(DATA_DIR, 'hizliyukle_users_archive.json');
const DB_IMAGES_ARCHIVE = path.join(DATA_DIR, 'hizliyukle_images_archive.json');
const DB_FOLDERS_ARCHIVE = path.join(DATA_DIR, 'hizliyukle_folders_archive.json');
const DB_SETTINGS_ARCHIVE = path.join(DATA_DIR, 'hizliyukle_settings_archive.json');
const DB_REPORTS_ARCHIVE = path.join(DATA_DIR, 'hizliyukle_reports_archive.json');
const DB_ANNOUNCEMENTS_ARCHIVE = path.join(DATA_DIR, 'hizliyukle_announcements_archive.json');

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: string;
  status: 'active' | 'banned';
  plan?: 'free' | 'premium' | 'vip' | 'admin';
  bio?: string;
  avatar_url?: string;
  two_factor_enabled?: boolean;
  two_factor_secret?: string;
  favorites?: string[];
}

export interface FolderRecord {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface CommentRecord {
  id: string;
  image_id: string;
  user_id?: string | null;
  username: string;
  avatar_url?: string;
  text: string;
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
  password_hash?: string | null;
  expires_at?: string | null;
  view_limit?: number | null;
  is_one_time_view?: boolean;
  likes?: number;
  liked_by?: string[];
  protect_copy?: boolean;
  comments?: CommentRecord[];
  tags?: string[];
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
  ai_assistant_enabled?: boolean;
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
  ai_assistant_enabled: true,
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

      const sources: any[] = [];

      // 1. Primary DB file
      if (fs.existsSync(DB_FILE)) {
        try {
          const content = fs.readFileSync(DB_FILE, 'utf-8');
          if (content && content.trim().length > 0) {
            sources.push(JSON.parse(content));
          }
        } catch (e) {
          console.warn('[DB] Failed reading primary DB file:', e);
        }
      }

      // 2. Backup DB file
      if (fs.existsSync(DB_BACKUP_FILE)) {
        try {
          const content = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
          if (content && content.trim().length > 0) {
            sources.push(JSON.parse(content));
          }
        } catch (e) {
          console.warn('[DB] Failed reading backup DB file:', e);
        }
      }

      // 3. Dedicated Users Archive
      if (fs.existsSync(DB_USERS_ARCHIVE)) {
        try {
          const content = fs.readFileSync(DB_USERS_ARCHIVE, 'utf-8');
          if (content && content.trim().length > 0) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              sources.push({ users: parsed });
            } else if (parsed && Array.isArray(parsed.users)) {
              sources.push({ users: parsed.users });
            }
          }
        } catch (e) {
          console.warn('[DB] Failed reading users archive:', e);
        }
      }

      // 4. Dedicated Images Archive
      if (fs.existsSync(DB_IMAGES_ARCHIVE)) {
        try {
          const content = fs.readFileSync(DB_IMAGES_ARCHIVE, 'utf-8');
          if (content && content.trim().length > 0) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              sources.push({ images: parsed });
            } else if (parsed && Array.isArray(parsed.images)) {
              sources.push({ images: parsed.images });
            }
          }
        } catch (e) {
          console.warn('[DB] Failed reading images archive:', e);
        }
      }

      // 5. Dedicated Folders Archive
      if (fs.existsSync(DB_FOLDERS_ARCHIVE)) {
        try {
          const content = fs.readFileSync(DB_FOLDERS_ARCHIVE, 'utf-8');
          if (content && content.trim().length > 0) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              sources.push({ folders: parsed });
            } else if (parsed && Array.isArray(parsed.folders)) {
              sources.push({ folders: parsed.folders });
            }
          }
        } catch (e) {
          console.warn('[DB] Failed reading folders archive:', e);
        }
      }

      // 6. Dedicated Settings Archive
      if (fs.existsSync(DB_SETTINGS_ARCHIVE)) {
        try {
          const content = fs.readFileSync(DB_SETTINGS_ARCHIVE, 'utf-8');
          if (content && content.trim().length > 0) {
            const parsed = JSON.parse(content);
            if (parsed && typeof parsed === 'object') {
              sources.push({ settings: parsed });
            }
          }
        } catch (e) {
          console.warn('[DB] Failed reading settings archive:', e);
        }
      }

      // 7. Dedicated Announcements Archive
      if (fs.existsSync(DB_ANNOUNCEMENTS_ARCHIVE)) {
        try {
          const content = fs.readFileSync(DB_ANNOUNCEMENTS_ARCHIVE, 'utf-8');
          if (content && content.trim().length > 0) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              sources.push({ announcements: parsed });
            } else if (parsed && Array.isArray(parsed.announcements)) {
              sources.push({ announcements: parsed.announcements });
            }
          }
        } catch (e) {
          console.warn('[DB] Failed reading announcements archive:', e);
        }
      }

      // 8. Dedicated Reports Archive
      if (fs.existsSync(DB_REPORTS_ARCHIVE)) {
        try {
          const content = fs.readFileSync(DB_REPORTS_ARCHIVE, 'utf-8');
          if (content && content.trim().length > 0) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              sources.push({ reports: parsed });
            } else if (parsed && Array.isArray(parsed.reports)) {
              sources.push({ reports: parsed.reports });
            }
          }
        } catch (e) {
          console.warn('[DB] Failed reading reports archive:', e);
        }
      }

      this.mergeFromSources(sources);
      this.recoverLocalUploadsFromDisk();
      this.seedInitialData();
      this.save();
    } catch (err) {
      console.error('[DB] Database initialization error:', err);
      this.seedInitialData();
      this.save();
    }
  }

  // Scan local uploads folder and ensure no physical image file on disk is missing from database
  private recoverLocalUploadsFromDisk() {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        return;
      }

      const files = fs.readdirSync(UPLOADS_DIR);
      const existingPublicIds = new Set(this.data.images.map((i) => i.cloudinary_public_id));
      const existingUrls = new Set(this.data.images.map((i) => i.cloudinary_url));

      for (const fileName of files) {
        if (fileName.startsWith('.')) continue;
        const filePath = path.join(UPLOADS_DIR, fileName);
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;

        const ext = path.extname(fileName).replace('.', '').toLowerCase() || 'jpg';
        const baseName = path.parse(fileName).name;
        const localRelativeUrl = `/uploads/${fileName}`;

        const isKnown =
          existingPublicIds.has(baseName) ||
          Array.from(existingUrls).some((u) => u.includes(fileName));

        if (!isKnown) {
          console.log(`[DB] Recovered unindexed image from disk: ${fileName}`);
          const newImgRecord: ImageRecord = {
            id: 'rec_' + crypto.randomBytes(4).toString('hex'),
            user_id: null,
            uploader_username: 'Sistem Kurtarma',
            cloudinary_public_id: baseName,
            cloudinary_url: localRelativeUrl,
            original_filename: fileName,
            format: ext,
            width: 1200,
            height: 800,
            size: stat.size,
            created_at: stat.birthtime ? stat.birthtime.toISOString() : new Date().toISOString(),
            views: 0,
            downloads: 0,
            is_public: true,
            status: 'active',
            delete_token: 'del_' + crypto.randomBytes(16).toString('hex'),
            is_favorite: false,
            folder_id: null,
          };
          this.data.images.unshift(newImgRecord);
        }
      }
    } catch (err) {
      console.warn('[DB] Local upload disk recovery check warning:', err);
    }
  }

  private mergeFromSources(sources: any[]) {
    const userMap = new Map<string, UserRecord>();
    const imageMap = new Map<string, ImageRecord>();
    const folderMap = new Map<string, FolderRecord>();
    const reportMap = new Map<string, ReportRecord>();
    const announcementMap = new Map<string, AnnouncementRecord>();
    const notificationMap = new Map<string, NotificationRecord>();
    const auditLogs: AuditLogRecord[] = [];
    const logs: { id: string; level: string; message: string; timestamp: string }[] = [];
    let customSettings: Partial<SiteSettingsRecord> = {};

    for (const src of sources) {
      if (!src || typeof src !== 'object') continue;

      // Users merging: match by ID or Email/Username
      if (Array.isArray(src.users)) {
        for (const u of src.users) {
          if (!u || !u.id) continue;
          const existing = userMap.get(u.id);
          if (!existing) {
            userMap.set(u.id, u);
          } else {
            userMap.set(u.id, {
              ...existing,
              ...u,
              password_hash: u.password_hash || existing.password_hash,
              plan: u.plan || existing.plan || (u.role === 'admin' ? 'admin' : 'free'),
            });
          }
        }
      }

      // Images merging
      if (Array.isArray(src.images)) {
        for (const img of src.images) {
          if (!img || !img.id) continue;
          if (!imageMap.has(img.id)) {
            imageMap.set(img.id, img);
          } else {
            const prev = imageMap.get(img.id)!;
            imageMap.set(img.id, { ...prev, ...img });
          }
        }
      }

      // Folders merging
      if (Array.isArray(src.folders)) {
        for (const f of src.folders) {
          if (f && f.id && !folderMap.has(f.id)) folderMap.set(f.id, f);
        }
      }

      // Reports merging
      if (Array.isArray(src.reports)) {
        for (const r of src.reports) {
          if (r && r.id && !reportMap.has(r.id)) reportMap.set(r.id, r);
        }
      }

      // Announcements merging
      if (Array.isArray(src.announcements)) {
        for (const a of src.announcements) {
          if (a && a.id && !announcementMap.has(a.id)) announcementMap.set(a.id, a);
        }
      }

      // Notifications merging
      if (Array.isArray(src.notifications)) {
        for (const n of src.notifications) {
          if (n && n.id && !notificationMap.has(n.id)) notificationMap.set(n.id, n);
        }
      }

      // Audit logs
      if (Array.isArray(src.audit_logs)) {
        auditLogs.push(...src.audit_logs);
      }

      // Logs
      if (Array.isArray(src.logs)) {
        logs.push(...src.logs);
      }

      // Settings
      if (src.settings && typeof src.settings === 'object') {
        customSettings = { ...customSettings, ...src.settings };
      }
    }

    const dedupAuditLogs = Array.from(new Map(auditLogs.map((l) => [l.id || Math.random().toString(), l])).values());
    const dedupLogs = Array.from(new Map(logs.map((l) => [l.id || Math.random().toString(), l])).values());

    this.data = {
      users: Array.from(userMap.values()),
      images: Array.from(imageMap.values()),
      folders: Array.from(folderMap.values()),
      reports: Array.from(reportMap.values()),
      announcements: Array.from(announcementMap.values()),
      notifications: Array.from(notificationMap.values()),
      audit_logs: dedupAuditLogs,
      settings: { ...defaultSettings, ...customSettings },
      logs: dedupLogs,
      view_logs: [],
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

      // Safeguard: never overwrite with an empty user list if disk archive has users
      if ((!this.data.users || this.data.users.length === 0) && fs.existsSync(DB_USERS_ARCHIVE)) {
        try {
          const archiveContent = fs.readFileSync(DB_USERS_ARCHIVE, 'utf-8');
          if (archiveContent && archiveContent.trim().length > 0) {
            const archiveUsers = JSON.parse(archiveContent);
            if (Array.isArray(archiveUsers) && archiveUsers.length > 0) {
              this.data.users = archiveUsers;
            }
          }
        } catch (e) {
          console.warn('[DB] Could not re-read users archive during save safeguard:', e);
        }
      }

      const serialized = JSON.stringify(this.data, null, 2);
      
      // 1. Atomic write to primary DB file
      const tmpFile = DB_FILE + '.tmp';
      fs.writeFileSync(tmpFile, serialized, 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);

      // 2. Backup DB file
      fs.writeFileSync(DB_BACKUP_FILE, serialized, 'utf-8');

      // 3. Persistent Users Archive
      if (this.data.users && this.data.users.length > 0) {
        fs.writeFileSync(DB_USERS_ARCHIVE, JSON.stringify(this.data.users, null, 2), 'utf-8');
      }

      // 4. Persistent Images Archive
      if (this.data.images && this.data.images.length > 0) {
        fs.writeFileSync(DB_IMAGES_ARCHIVE, JSON.stringify(this.data.images, null, 2), 'utf-8');
      }

      // 5. Persistent Folders Archive
      if (this.data.folders && this.data.folders.length > 0) {
        fs.writeFileSync(DB_FOLDERS_ARCHIVE, JSON.stringify(this.data.folders, null, 2), 'utf-8');
      }

      // 6. Persistent Settings Archive
      if (this.data.settings) {
        fs.writeFileSync(DB_SETTINGS_ARCHIVE, JSON.stringify(this.data.settings, null, 2), 'utf-8');
      }

      // 7. Persistent Announcements Archive
      if (this.data.announcements && this.data.announcements.length > 0) {
        fs.writeFileSync(DB_ANNOUNCEMENTS_ARCHIVE, JSON.stringify(this.data.announcements, null, 2), 'utf-8');
      }

      // 8. Persistent Reports Archive
      if (this.data.reports && this.data.reports.length > 0) {
        fs.writeFileSync(DB_REPORTS_ARCHIVE, JSON.stringify(this.data.reports, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('[DB] Database save error:', err);
      try {
        const serialized = JSON.stringify(this.data, null, 2);
        fs.writeFileSync(DB_FILE, serialized, 'utf-8');
        fs.writeFileSync(DB_BACKUP_FILE, serialized, 'utf-8');
        if (this.data.users && this.data.users.length > 0) {
          fs.writeFileSync(DB_USERS_ARCHIVE, JSON.stringify(this.data.users, null, 2), 'utf-8');
        }
      } catch (e) {
        console.error('[DB] Fallback database save error:', e);
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
    const now = Date.now();
    return this.data.images.filter((img) => {
      if (img.status === 'deleted') return false;
      if (img.expires_at && new Date(img.expires_at).getTime() <= now) {
        img.status = 'deleted';
        return false;
      }
      return true;
    });
  }

  public getAllImagesForAdmin(): ImageRecord[] {
    return this.data.images;
  }

  public getImageById(id: string): ImageRecord | undefined {
    const img = this.data.images.find((i) => i.id === id);
    if (!img || img.status === 'deleted') return undefined;

    if (img.expires_at && new Date(img.expires_at).getTime() <= Date.now()) {
      img.status = 'deleted';
      this.save();
      return undefined;
    }

    return img;
  }

  public cleanExpiredImages(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const img of this.data.images) {
      if (img.status !== 'deleted' && img.expires_at && new Date(img.expires_at).getTime() <= now) {
        img.status = 'deleted';
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.save();
    }
    return cleaned;
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

  public purgeImage(id: string): boolean {
    const idx = this.data.images.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.data.images.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Atomically claims a burn-after-reading image.
   * If the image exists, is active, and is marked as is_one_time_view,
   * its status is immediately set to 'deleted' and changes saved synchronously,
   * preventing any race condition or duplicate concurrent views.
   */
  public claimAndBurnImage(id: string): ImageRecord | null {
    const idx = this.data.images.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const img = this.data.images[idx];
    if (img.status === 'deleted') return null;

    if (img.expires_at && new Date(img.expires_at).getTime() <= Date.now()) {
      img.status = 'deleted';
      this.save();
      return null;
    }

    if (img.is_one_time_view) {
      const cloned = { ...img };
      // Atomically mark as deleted so no second request can claim it
      img.status = 'deleted';
      this.save();
      return cloned;
    }

    return img;
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

  // Likes & Favorites
  public toggleLikeImage(id: string, identifier: string): { liked: boolean; likes_count: number } | null {
    const img = this.getImageById(id);
    if (!img) return null;

    if (!img.liked_by) img.liked_by = [];
    if (!img.likes) img.likes = img.liked_by.length;

    const existingIdx = img.liked_by.indexOf(identifier);
    let liked = false;

    if (existingIdx !== -1) {
      img.liked_by.splice(existingIdx, 1);
      img.likes = Math.max(0, img.likes - 1);
      liked = false;
    } else {
      img.liked_by.push(identifier);
      img.likes = img.likes + 1;
      liked = true;
    }

    this.save();
    return { liked, likes_count: img.likes };
  }

  public isImageLikedBy(id: string, identifier: string): boolean {
    const img = this.getImageById(id);
    if (!img || !img.liked_by) return false;
    return img.liked_by.includes(identifier);
  }

  public toggleFavoriteUserImage(userId: string, imageId: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    if (!user.favorites) user.favorites = [];

    const idx = user.favorites.indexOf(imageId);
    let isFav = false;
    if (idx !== -1) {
      user.favorites.splice(idx, 1);
      isFav = false;
    } else {
      user.favorites.push(imageId);
      isFav = true;
    }
    this.save();
    return isFav;
  }

  public getUserFavorites(userId: string): ImageRecord[] {
    const user = this.getUserById(userId);
    if (!user || !user.favorites || user.favorites.length === 0) return [];
    return this.getImages().filter((img) => user.favorites!.includes(img.id));
  }

  // Comments
  public addCommentToImage(imageId: string, comment: CommentRecord): CommentRecord | null {
    const img = this.getImageById(imageId);
    if (!img) return null;

    if (!img.comments) img.comments = [];
    img.comments.push(comment);
    this.save();
    return comment;
  }

  public deleteCommentFromImage(
    imageId: string,
    commentId: string,
    userId?: string,
    isAdmin?: boolean
  ): boolean {
    const img = this.getImageById(imageId);
    if (!img || !img.comments) return false;

    const commentIdx = img.comments.findIndex((c) => c.id === commentId);
    if (commentIdx === -1) return false;

    const comment = img.comments[commentIdx];
    // Can delete if user is comment author, image owner, or admin
    if (isAdmin || (userId && (comment.user_id === userId || img.user_id === userId))) {
      img.comments.splice(commentIdx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Explore & Community Feed
  public getPublicExplore(options: {
    sort?: 'popular' | 'trending' | 'newest';
    format?: string;
    query?: string;
    limit?: number;
    offset?: number;
  }): { images: ImageRecord[]; total: number } {
    const { sort = 'newest', format, query, limit = 50, offset = 0 } = options;
    const now = Date.now();

    let list = this.getImages().filter((img) => {
      // Must not be deleted
      if (img.status === 'deleted') return false;
      // Must not be expired
      if (img.expires_at && new Date(img.expires_at).getTime() <= now) return false;
      // Must not be one-time burn image
      if (img.is_one_time_view) return false;
      // Must not be password protected
      if (img.password_hash) return false;
      // Must be public (is_public must be true or undefined/default true, NOT false)
      if (img.is_public === false) return false;
      return true;
    });

    if (format && format !== 'all') {
      list = list.filter((img) => img.format.toLowerCase() === format.toLowerCase());
    }

    if (query && query.trim().length > 0) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (img) =>
          img.original_filename.toLowerCase().includes(q) ||
          (img.uploader_username && img.uploader_username.toLowerCase().includes(q))
      );
    }

    if (sort === 'newest') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'trending') {
      list.sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        const ageHoursA = Math.max(0.1, (now - timeA) / (1000 * 60 * 60));
        const ageHoursB = Math.max(0.1, (now - timeB) / (1000 * 60 * 60));
        // High freshness boost + interactions gravity score
        const scoreA = ((a.likes || 0) * 10 + (a.views || 0) * 2 + 25) / Math.pow(ageHoursA + 1, 0.6);
        const scoreB = ((b.likes || 0) * 10 + (b.views || 0) * 2 + 25) / Math.pow(ageHoursB + 1, 0.6);
        if (Math.abs(scoreB - scoreA) < 0.001) {
          return timeB - timeA;
        }
        return scoreB - scoreA;
      });
    } else {
      // popular
      list.sort((a, b) => {
        const scoreA = (a.views || 0) + (a.likes || 0) * 5;
        const scoreB = (b.views || 0) + (b.likes || 0) * 5;
        if (scoreA === scoreB) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return scoreB - scoreA;
      });
    }

    const total = list.length;
    const paginated = list.slice(offset, offset + limit);
    return { images: paginated, total };
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
