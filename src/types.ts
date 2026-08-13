export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface UserStats {
  total_images: number;
  total_bytes: number;
  total_views: number;
  favorite_count: number;
  last_upload_at: string | null;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
  status: 'active' | 'banned';
  image_count?: number;
  plan?: 'free' | 'premium' | 'vip' | 'admin';
  stats?: UserStats;
}

export interface ImageMetadata {
  id: string;
  user_id: string | null;
  uploader_username?: string;
  cloudinary_public_id: string;
  cloudinary_url: string;
  original_filename: string;
  format: string;
  width: number;
  height: number;
  size: number; // bytes
  created_at: string;
  views: number;
  downloads: number;
  is_public: boolean;
  status: 'active' | 'deleted' | 'flagged';
  delete_token?: string;
  is_favorite?: boolean;
  folder_id?: string | null;
}

export interface UploadResult {
  image: ImageMetadata;
  share_url: string;
  direct_url: string;
  thumbnail_url?: string;
  html_code: string;
  markdown_code: string;
  bbcode: string;
}

export interface Report {
  id: string;
  image_id: string;
  reason: string;
  ip: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
  image_url?: string;
  original_filename?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  active: boolean;
  created_at: string;
}

export interface SiteSettings {
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

export interface AdminStats {
  total_users: number;
  total_images: number;
  today_images?: number;
  today_users?: number;
  total_storage_bytes: number;
  total_views: number;
  total_reports: number;
  cloudinary_connected: boolean;
  cloudinary_cloud_name: string;
}

export interface UploadProgressFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';
  error_message?: string;
  result?: UploadResult;
  previewUrl?: string;
  abortController?: AbortController;
}
