import { Album, AlbumCreateInput, AlbumUpdateInput, AdminStats, AnalyticsData, Announcement, AuditLog, Folder, ImageMetadata, Notification, PlanConfig, Report, SiteSettings, UploadResult, User } from '../types';

const TOKEN_KEY = 'hizliyukle_auth_token';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new ApiError('Sunucuya bağlanılamadı (Ağ hatası). Lütfen internet bağlantınızı kontrol edin.', 0);
  }

  let data: any = {};
  try {
    const text = await response.text();
    if (text) {
      data = JSON.parse(text);
    }
  } catch {
    data = {};
  }

  if (!response.ok) {
    const errorMsg =
      data.error ||
      data.message ||
      (response.status === 401
        ? 'Oturum süreniz doldu veya bilgiler hatalı.'
        : response.status === 403
        ? 'Bu işlem için yetkiniz bulunmamaktadır.'
        : response.status === 429
        ? 'Çok fazla istek gönderildi. Lütfen birkaç dakika bekleyin.'
        : `Sunucu hatası oluştu (HTTP ${response.status}).`);
    throw new ApiError(errorMsg, response.status);
  }

  return data as T;
}

// Auth API
export const authApi = {
  login: (identifier: string, password: string) =>
    request<{ token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  register: (email: string, username: string, password: string) =>
    request<{ token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    }),

  getMe: () => request<{ user: User | null }>('/api/auth/me'),

  updateProfile: (params: { password?: string; new_password?: string; email?: string; username?: string }) =>
    request<{ message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(params),
    }),

  deleteAccount: (password: string) =>
    request<{ message: string }>('/api/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    }),

  getNotifications: () => request<{ notifications: Notification[] }>('/api/auth/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/auth/notifications/${id}/read`, {
      method: 'POST',
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/api/auth/notifications/read-all', {
      method: 'POST',
    }),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),
};

// Image API
export const imageApi = {
  uploadFile: (
    file: File,
    onProgress?: (percent: number) => void,
    folderId?: string | null,
    xhrRef?: { current: XMLHttpRequest | null },
    options?: { password?: string; expiration?: string }
  ): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (xhrRef) xhrRef.current = xhr;

      const formData = new FormData();
      formData.append('files', file);
      if (folderId) {
        formData.append('folder_id', folderId);
      }
      if (options?.password) {
        formData.append('password', options.password);
      }
      if (options?.expiration && options.expiration !== 'none') {
        formData.append('expiration', options.expiration);
      }

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data.results[0]);
          } else {
            reject(new Error(data.error || 'Resim yükleme başarısız oldu.'));
          }
        } catch (err) {
          reject(new Error('Sunucu yanıtı okunamadı.'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Ağ hatası oluştu. Lütfen bağlantınızı kontrol edin.'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Yükleme kullanıcı tarafından iptal edildi.'));
      });

      xhr.open('POST', '/api/images/upload');

      const token = getStoredToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  },

  unlockImage: (id: string, password: string) =>
    request<UploadResult & { unlocked: boolean }>(`/api/images/${id}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  getMyImages: () => request<{ images: UploadResult[]; folders?: Folder[] }>('/api/images/my'),

  getImageDetail: (id: string) => request<UploadResult & { is_owner: boolean }>(`/api/images/${id}`),

  deleteImage: (id: string, deleteToken?: string) =>
    request<{ message: string }>(`/api/images/${id}${deleteToken ? `?delete_token=${deleteToken}` : ''}`, {
      method: 'DELETE',
    }),

  toggleFavorite: (id: string) =>
    request<{ is_favorite: boolean }>(`/api/images/${id}/favorite`, {
      method: 'POST',
    }),

  setImageFolder: (id: string, folderId: string | null) =>
    request<{ message: string }>(`/api/images/${id}/folder`, {
      method: 'PUT',
      body: JSON.stringify({ folder_id: folderId }),
    }),

  getFolders: () => request<{ folders: Folder[] }>('/api/images/folders'),

  createFolder: (name: string, color?: string) =>
    request<{ message: string; folder: Folder }>('/api/images/folders', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    }),

  deleteFolder: (id: string) =>
    request<{ message: string }>(`/api/images/folders/${id}`, {
      method: 'DELETE',
    }),

  reportImage: (id: string, reason: string) =>
    request<{ message: string }>(`/api/images/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  trackDownload: (id: string) =>
    request<{ success: boolean }>(`/api/images/${id}/download`, {
      method: 'POST',
    }),

  sendBurnHeartbeat: (id: string, sessionId: string) =>
    request<{ ok: boolean; active: boolean }>(`/api/images/${id}/burn-session/heartbeat`, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),

  completeBurnSession: (id: string, sessionId?: string) => {
    const payload = JSON.stringify({ session_id: sessionId });
    // Prefer sendBeacon for reliable leave detection
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`/api/images/${id}/burn-session/complete`, blob);
      return Promise.resolve({ ok: true, burned: true });
    }
    return request<{ ok: boolean; burned: true }>(`/api/images/${id}/burn-session/complete`, {
      method: 'POST',
      body: payload,
    });
  },
};

// Album API
export const albumApi = {
  createAlbum: (input: AlbumCreateInput) =>
    request<{ message: string; album: Album }>('/api/albums', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getMyAlbums: () =>
    request<{
      albums: Album[];
      limits: { total: number; max_albums: number; max_images_per_album: number };
    }>('/api/albums/my'),

  getAlbum: (idOrShareId: string, unlockToken?: string) => {
    const qs = unlockToken ? `?unlock_token=${encodeURIComponent(unlockToken)}` : '';
    return request<{
      is_locked: boolean;
      is_password_protected: boolean;
      is_owner?: boolean;
      is_admin?: boolean;
      is_expired?: boolean;
      album: Album;
    }>(`/api/albums/${idOrShareId}${qs}`);
  },

  unlockAlbum: (idOrShareId: string, password: string) =>
    request<{
      unlocked: boolean;
      unlock_token: string;
      album: Album;
    }>(`/api/albums/${idOrShareId}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  updateAlbum: (id: string, input: AlbumUpdateInput) =>
    request<{ message: string; album: Album }>(`/api/albums/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  deleteAlbum: (id: string) =>
    request<{ message: string }>(`/api/albums/${id}`, {
      method: 'DELETE',
    }),

  addImages: (id: string, imageIds: string[]) =>
    request<{ message: string; album: Album }>(`/api/albums/${id}/images`, {
      method: 'POST',
      body: JSON.stringify({ image_ids: imageIds }),
    }),

  removeImage: (id: string, imageId: string) =>
    request<{ message: string; album: Album }>(`/api/albums/${id}/images/${imageId}`, {
      method: 'DELETE',
    }),

  reorderImages: (id: string, imageIds: string[]) =>
    request<{ message: string; album: Album }>(`/api/albums/${id}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ image_ids: imageIds }),
    }),
};

// Public API
export const publicApi = {
  getSettings: () => request<SiteSettings>('/api/public/settings'),
  getAnnouncements: () => request<{ announcements: Announcement[] }>('/api/public/announcements'),
  sendContactMessage: (name: string, email: string, subject: string, message: string) =>
    request<{ message: string }>('/api/public/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, subject, message }),
    }),
};

// Admin API
export const adminApi = {
  getStats: () => request<AdminStats>('/api/admin/stats'),
  
  getUsers: (params?: { q?: string; plan?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.plan) query.append('plan', params.plan);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return request<{ users: User[] }>(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },

  getUserDetail: (id: string) =>
    request<{ user: User; stats: any; plan_limits: PlanConfig; images: ImageMetadata[] }>(`/api/admin/users/${id}`),

  updateUserStatus: (id: string, status: 'active' | 'banned') =>
    request<{ message: string }>(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updateUserPlan: (id: string, plan: string) =>
    request<{ message: string }>(`/api/admin/users/${id}/plan`, {
      method: 'PUT',
      body: JSON.stringify({ plan }),
    }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    }),

  getPlans: () => request<{ plans: Record<string, PlanConfig> }>('/api/admin/plans'),

  updatePlans: (plans: Record<string, PlanConfig>) =>
    request<{ message: string }>('/api/admin/plans', {
      method: 'PUT',
      body: JSON.stringify(plans),
    }),

  updatePlanLimits: (planKey: string, updates: Partial<PlanConfig>) =>
    request<{ message: string }>(`/api/admin/plans/${planKey}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  getImages: () => request<{ images: ImageMetadata[] }>('/api/admin/images'),
  deleteImage: (id: string) =>
    request<{ message: string }>(`/api/admin/images/${id}`, {
      method: 'DELETE',
    }),

  getReports: () => request<{ reports: Report[] }>('/api/admin/reports'),
  updateReportStatus: (id: string, status: 'pending' | 'investigating' | 'resolved' | 'dismissed', notes?: string) =>
    request<{ message: string }>(`/api/admin/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  getAnnouncements: () => request<{ announcements: Announcement[] }>('/api/admin/announcements'),
  createAnnouncement: (title: string, content: string, type: string) =>
    request<{ message: string; announcement: Announcement }>('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify({ title, content, type }),
    }),
  deleteAnnouncement: (id: string) =>
    request<{ message: string }>(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
    }),

  getSettings: () => request<{ settings: SiteSettings }>('/api/admin/settings'),
  updateSettings: (settings: Partial<SiteSettings>) =>
    request<{ message: string; settings: SiteSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getAuditLogs: () => request<{ audit_logs: AuditLog[] }>('/api/admin/audit-logs'),

  getAnalytics: () => request<{ analytics: AnalyticsData }>('/api/admin/analytics'),

  getAlbums: () =>
    request<{
      albums: Album[];
      stats: { total: number; active: number; expired: number; deleted: number };
    }>('/api/admin/albums'),

  deleteAlbum: (id: string) =>
    request<{ message: string }>(`/api/admin/albums/${id}`, {
      method: 'DELETE',
    }),

  getHealth: () =>
    request<{
      status: string;
      uptime: number;
      cloudinary: { configured: boolean; connected: boolean; cloudName: string; message: string };
      recent_logs: any[];
    }>('/api/admin/health'),
};

export const assistantApi = {
  ask: (question: string, history?: Array<{ role: 'user' | 'model'; text: string }>) =>
    request<{ answer: string; source: string }>('/api/assistant/ask', {
      method: 'POST',
      body: JSON.stringify({ question, history }),
    }),
};

