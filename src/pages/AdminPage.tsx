import React, { useEffect, useState, useMemo } from 'react';
import {
  Shield,
  Users,
  Images,
  Flag,
  Bell,
  Settings,
  Activity,
  Trash2,
  Ban,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  HardDrive,
  Eye,
  Server,
  Radio,
  Crown,
  FileText,
  BarChart3,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Sliders,
  DollarSign,
  Layers,
  LayoutGrid,
  List,
  Sparkles,
  ChevronRight,
  UserCheck,
  UserX,
  Lock,
  Download,
  Copy,
  Info,
  AlertCircle,
  Flame,
  Code2,
  Megaphone,
  Check,
  X,
  Zap,
  Calendar,
  Smartphone
} from 'lucide-react';
import { adminApi } from '../lib/api';
import {
  AdminStats,
  Announcement,
  ImageMetadata,
  Report,
  SiteSettings,
  User,
  AuditLog,
  PlanConfig,
  AnalyticsData
} from '../types';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { formatImageUrl } from '../lib/imageUrl';

interface AdminPageProps {
  navigate: (path: string) => void;
}

type AdminTab =
  | 'stats'
  | 'users'
  | 'images'
  | 'reports'
  | 'announcements'
  | 'plans'
  | 'settings'
  | 'ads'
  | 'audit';

export const AdminPage: React.FC<AdminPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [imagesList, setImagesList] = useState<ImageMetadata[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Users Tab Filters & Modals
  const [userSearch, setUserSearch] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<{
    user: User;
    stats: any;
    plan_limits: PlanConfig;
    images: ImageMetadata[];
  } | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [deleteUserModal, setDeleteUserModal] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [deletingUser, setDeletingUser] = useState(false);

  // Images Tab Filters & State
  const [imageSearch, setImageSearch] = useState('');
  const [imageFormatFilter, setImageFormatFilter] = useState('all');
  const [imageViewMode, setImageViewMode] = useState<'grid' | 'table'>('grid');
  const [previewImage, setPreviewImage] = useState<ImageMetadata | null>(null);

  // Reports Tab Filters
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed'>('all');
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});

  // Announcements Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<'info' | 'warning' | 'success'>('info');
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  // Audit Logs Filter
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  // Ad Settings Form State
  const [adSettings, setAdSettings] = useState<{
    header_ad_code: string;
    sidebar_ad_code: string;
    image_page_ad_code: string;
  }>({
    header_ad_code: '',
    sidebar_ad_code: '',
    image_page_ad_code: '',
  });

  const loadAllData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [sRes, uRes, iRes, rRes, aRes, stRes, hRes, plansRes, auditRes, analyticsRes] =
        await Promise.all([
          adminApi.getStats().catch(() => null),
          adminApi.getUsers().catch(() => ({ users: [] })),
          adminApi.getImages().catch(() => ({ images: [] })),
          adminApi.getReports().catch(() => ({ reports: [] })),
          adminApi.getAnnouncements().catch(() => ({ announcements: [] })),
          adminApi.getSettings().catch(() => ({ settings: null })),
          adminApi.getHealth().catch(() => null),
          adminApi.getPlans().catch(() => ({ plans: {} })),
          adminApi.getAuditLogs().catch(() => ({ audit_logs: [] })),
          adminApi.getAnalytics().catch(() => null),
        ]);

      if (sRes) setStats(sRes);
      setUsersList(uRes.users || []);
      setImagesList(iRes.images || []);
      setReportsList(rRes.reports || []);
      setAnnouncementsList(aRes.announcements || []);
      if (stRes.settings) {
        setSiteSettings(stRes.settings);
        setAdSettings({
          header_ad_code: stRes.settings.header_ad_code || '',
          sidebar_ad_code: stRes.settings.sidebar_ad_code || '',
          image_page_ad_code: stRes.settings.image_page_ad_code || '',
        });
      }
      if (hRes) setSystemHealth(hRes);
      if (plansRes.plans) setPlans(plansRes.plans);
      if (auditRes.audit_logs) setAuditLogs(auditRes.audit_logs);
      if (analyticsRes) setAnalytics(analyticsRes);

      if (isRefresh) {
        showToast('Tüm veriler başarıyla güncellendi.', 'success');
      }
    } catch (err: any) {
      showToast('Admin verileri yüklenirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAllData();
    }
  }, [user]);

  // Auth Guard: Admin Only
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-xl shadow-rose-500/10">
          <Shield className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">Yetkisiz Erişim Engellendi</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Bu kontrol paneli yalnızca sistem yöneticilerine tahsis edilmiştir. Hesabınızın bu işlem için yetkisi bulunmuyor.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} panoya kopyalandı!`, 'success');
  };

  // 1. User Management Handlers
  const handleUserStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      showToast(`Kullanıcı durumu "${newStatus === 'banned' ? 'Askıda' : 'Aktif'}" yapıldı.`, 'success');
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus as any } : u))
      );
    } catch (err: any) {
      showToast(err.message || 'Kullanıcı durumu güncellenemedi.', 'error');
    }
  };

  const handleUserPlanChange = async (userId: string, newPlan: string) => {
    try {
      await adminApi.updateUserPlan(userId, newPlan);
      showToast(`Kullanıcı planı "${newPlan.toUpperCase()}" olarak güncellendi.`, 'success');
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan: newPlan as any } : u))
      );
    } catch (err: any) {
      showToast(err.message || 'Kullanıcı planı güncellenemedi.', 'error');
    }
  };

  const handleOpenUserDetail = async (userId: string) => {
    setLoadingUserDetail(true);
    try {
      const res = await adminApi.getUserDetail(userId);
      setSelectedUserDetail(res);
    } catch (err: any) {
      showToast('Kullanıcı detayları alınamadı.', 'error');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserModal.user) return;
    setDeletingUser(true);
    try {
      await adminApi.deleteUser(deleteUserModal.user.id);
      showToast(`"${deleteUserModal.user.username}" kullanıcısı ve verileri silindi.`, 'success');
      setUsersList((prev) => prev.filter((u) => u.id !== deleteUserModal.user?.id));
      setDeleteUserModal({ open: false, user: null });
      if (selectedUserDetail?.user.id === deleteUserModal.user.id) {
        setSelectedUserDetail(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Kullanıcı silinemedi.', 'error');
    } finally {
      setDeletingUser(false);
    }
  };

  // 2. Image Management Handlers
  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Bu resmi kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await adminApi.deleteImage(imageId);
      showToast('Resim başarıyla silindi.', 'success');
      setImagesList((prev) => prev.filter((i) => i.id !== imageId));
      if (previewImage?.id === imageId) {
        setPreviewImage(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Resim silinemedi.', 'error');
    }
  };

  // 3. Reports Moderation Handlers
  const handleReportAction = async (
    reportId: string,
    status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  ) => {
    const notes = reportNotes[reportId] || '';
    try {
      await adminApi.updateReportStatus(reportId, status, notes);
      showToast(`Şikayet durumu "${status.toUpperCase()}" olarak güncellendi.`, 'success');
      setReportsList((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status, notes: notes || r.notes } : r))
      );
    } catch (err: any) {
      showToast(err.message || 'Şikayet güncellenemedi.', 'error');
    }
  };

  const handleDeleteReportedImage = async (reportId: string, imageId: string) => {
    if (!window.confirm('Şikayet edilen resmi kalıcı olarak silmek ve şikayeti çözüldü olarak işaretlemek istiyor musunuz?')) return;
    try {
      await adminApi.deleteImage(imageId);
      await adminApi.updateReportStatus(reportId, 'resolved', 'Resim yönetici tarafından yayından kaldırıldı.');
      showToast('Resim silindi ve şikayet çözüldü olarak kapatıldı.', 'success');
      setImagesList((prev) => prev.filter((i) => i.id !== imageId));
      setReportsList((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved', notes: 'Resim silindi.' } : r))
      );
    } catch (err: any) {
      showToast(err.message || 'İşlem gerçekleştirilemedi.', 'error');
    }
  };

  // 4. Announcements Handlers
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      showToast('Lütfen duyuru başlığı ve içeriğini doldurun.', 'error');
      return;
    }

    setCreatingAnnouncement(true);
    try {
      const res = await adminApi.createAnnouncement(annTitle, annContent, annType);
      showToast(res.message, 'success');
      setAnnouncementsList((prev) => [res.announcement, ...prev]);
      setAnnTitle('');
      setAnnContent('');
    } catch (err: any) {
      showToast(err.message || 'Duyuru oluşturulamadı.', 'error');
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await adminApi.deleteAnnouncement(id);
      showToast('Duyuru başarıyla kaldırıldı.', 'success');
      setAnnouncementsList((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      showToast('Duyuru silinemedi.', 'error');
    }
  };

  // 5. Plans Configuration Handlers
  const handleSaveAllPlans = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.updatePlans(plans);
      showToast(res.message || 'Plan yapılandırmaları kaydedildi.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Planlar kaydedilemedi.', 'error');
    }
  };

  // 6. Site Settings Handlers
  const handleUpdateSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;

    try {
      const res = await adminApi.updateSettings(siteSettings);
      showToast(res.message || 'Site ayarları kaydedildi.', 'success');
    } catch (err: any) {
      showToast('Site ayarları güncellenemedi.', 'error');
    }
  };

  // 7. Ad Management Handlers
  const handleSaveAdSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.updateSettings({
        ...siteSettings,
        header_ad_code: adSettings.header_ad_code,
        sidebar_ad_code: adSettings.sidebar_ad_code,
        image_page_ad_code: adSettings.image_page_ad_code,
      });
      if (res.settings) setSiteSettings(res.settings);
      showToast('Reklam kodları ve ayarları başarıyla kaydedildi.', 'success');
    } catch (err: any) {
      showToast('Reklam ayarları kaydedilemedi.', 'error');
    }
  };

  // Filtered Computed Data
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesQuery =
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesPlan = userPlanFilter === 'all' || (u.plan || 'free') === userPlanFilter;
      const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      return matchesQuery && matchesPlan && matchesStatus;
    });
  }, [usersList, userSearch, userPlanFilter, userStatusFilter]);

  const filteredImages = useMemo(() => {
    return imagesList.filter((img) => {
      const matchesQuery =
        img.original_filename.toLowerCase().includes(imageSearch.toLowerCase()) ||
        (img.uploader_username && img.uploader_username.toLowerCase().includes(imageSearch.toLowerCase()));
      const matchesFormat = imageFormatFilter === 'all' || img.format.toLowerCase() === imageFormatFilter.toLowerCase();
      return matchesQuery && matchesFormat;
    });
  }, [imagesList, imageSearch, imageFormatFilter]);

  const filteredReports = useMemo(() => {
    return reportsList.filter((rep) => {
      if (reportFilter === 'all') return true;
      return rep.status === reportFilter;
    });
  }, [reportsList, reportFilter]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        (log.actor_username && log.actor_username.toLowerCase().includes(auditSearch.toLowerCase())) ||
        (log.target && log.target.toLowerCase().includes(auditSearch.toLowerCase())) ||
        (typeof log.details === 'string' && log.details.toLowerCase().includes(auditSearch.toLowerCase()));
      const matchesAction = auditActionFilter === 'all' || log.action === auditActionFilter;
      return matchesSearch && matchesAction;
    });
  }, [auditLogs, auditSearch, auditActionFilter]);

  const pendingReportsCount = reportsList.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* ━━━━━━━━━━━━━━━━━━━━
          TOP ADMIN HEADER & IDENTITY
          ━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/5 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                IMGIVO — Admin Paneli
              </h1>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO V1
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sistem izleme, kullanıcılar, medya moderasyonu, VIP planlar ve genel ayar merkezi
            </p>
          </div>
        </div>

        {/* Top Actions: Uptime / CDN / Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          {stats?.cloudinary_connected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>CDN Aktif</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Yerel Depolama</span>
            </div>
          )}

          <button
            onClick={() => loadAllData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-[#0A1020] hover:bg-[#0F172A] text-slate-200 text-xs font-bold border border-slate-800 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Yenileniyor...' : 'Yenile'}</span>
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━
          9-SECTION NAVIGATION TABS BAR (MIDNIGHT PREMIUM)
          ━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-[#0A1020] border border-slate-800/90 rounded-2xl p-1.5 shadow-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'stats', label: 'Genel İstatistikler', icon: Activity },
            { id: 'users', label: 'Kullanıcı Yönetimi', icon: Users, badge: usersList.length },
            { id: 'images', label: 'Resim Yönetimi', icon: Images, badge: imagesList.length },
            { id: 'reports', label: 'Şikâyet Yönetimi', icon: Flag, badge: pendingReportsCount, badgeColor: 'rose' },
            { id: 'announcements', label: 'Duyurular', icon: Bell, badge: announcementsList.length },
            { id: 'plans', label: 'Premium/VIP Yönetimi', icon: Crown },
            { id: 'settings', label: 'Site Ayarları', icon: Settings },
            { id: 'ads', label: 'Reklam Yönetimi', icon: DollarSign },
            { id: 'audit', label: 'Audit Log', icon: FileText, badge: auditLogs.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      tab.badgeColor === 'rose'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━
          SECTION 1: GENEL İSTATİSTİKLER (OVERVIEW & METRICS)
          ━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6 animate-in fade-in">
          {/* Main KPI Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#0A1020] border border-slate-800 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Toplam Üye</span>
                <Users className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white block tracking-tight font-mono">
                {stats.total_users}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {stats.active_users ?? stats.total_users} Aktif Hesap
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A1020] border border-slate-800 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Toplam Resim</span>
                <Images className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-sky-400 block tracking-tight font-mono">
                {stats.total_images}
              </span>
              <span className="text-[10px] text-slate-400">Bulut + Yerel</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A1020] border border-slate-800 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Bugün Yüklenen</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 block tracking-tight font-mono">
                {stats.today_images ?? 0}
              </span>
              <span className="text-[10px] text-slate-400">Son 24 saat</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A1020] border border-slate-800 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Bugün Kayıt</span>
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-indigo-400 block tracking-tight font-mono">
                {stats.today_users ?? 0}
              </span>
              <span className="text-[10px] text-slate-400">Yeni Kullanıcı</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A1020] border border-slate-800 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Depolama</span>
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-purple-400 block tracking-tight font-mono truncate">
                {formatSize(stats.total_storage_bytes)}
              </span>
              <span className="text-[10px] text-slate-400">Disk Kullanımı</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0A1020] border border-slate-800 space-y-1.5 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Toplam İzlenme</span>
                <Eye className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-amber-400 block tracking-tight font-mono">
                {(stats.total_views || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">Görüntüleme</span>
            </div>
          </div>

          {/* Secondary Stats Row: Plan Breakdown & Cloudinary Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Plan Distribution Breakdown */}
            <div className="rounded-3xl bg-[#0A1020] border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Kullanıcı Paket Dağılımı</span>
                </h3>
                <span className="text-xs text-slate-400">{stats.total_users} Toplam</span>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { key: 'free', label: 'Ücretsiz (Free)', count: stats.plan_distribution?.free || 0, color: 'bg-slate-500' },
                  { key: 'premium', label: 'Premium Pro', count: stats.plan_distribution?.premium || 0, color: 'bg-blue-500' },
                  { key: 'vip', label: 'VIP Kurumsal', count: stats.plan_distribution?.vip || 0, color: 'bg-purple-500' },
                  { key: 'admin', label: 'Sistem Yöneticisi', count: stats.plan_distribution?.admin || 0, color: 'bg-amber-500' },
                ].map((item) => {
                  const pct = Math.round((item.count / Math.max(1, stats.total_users)) * 100);
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span className="font-semibold">{item.label}</span>
                        <span className="font-mono text-slate-400">
                          {item.count} üye (%{pct})
                        </span>
                      </div>
                      <div className="w-full bg-[#070B14] rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CDN & Server Health */}
            <div className="rounded-3xl bg-[#0A1020] border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-400" />
                  <span>CDN & Altyapı Durumu</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Çevrimiçi
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Cloudinary CDN Hesabı:</span>
                  <span className="font-mono text-white font-bold">{stats.cloudinary_cloud_name}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Sunucu Çalışma Süresi (Uptime):</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {systemHealth ? `${Math.floor(systemHealth.uptime / 60)} dakika` : 'Aktif'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Bekleyen Şikayet Bildirimi:</span>
                  <span
                    className={`font-bold font-mono px-2 py-0.5 rounded ${
                      pendingReportsCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'text-slate-300'
                    }`}
                  >
                    {pendingReportsCount} Adet
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="rounded-3xl bg-[#0A1020] border border-slate-800 p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Hızlı Yönetim Kısayolları</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sık kullanılan admin paneli bölümlerine tek tıkla geçiş yapın.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-3 rounded-xl bg-[#070B14] hover:bg-[#0F172A] border border-slate-800 text-left space-y-1 transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white block">Kullanıcılar</span>
                  <span className="text-[10px] text-slate-400 block">{usersList.length} Hesap</span>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="p-3 rounded-xl bg-[#070B14] hover:bg-[#0F172A] border border-slate-800 text-left space-y-1 transition-all cursor-pointer"
                >
                  <Flag className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white block">Şikayetler</span>
                  <span className="text-[10px] text-rose-300 block">{pendingReportsCount} Bekleyen</span>
                </button>
                <button
                  onClick={() => setActiveTab('plans')}
                  className="p-3 rounded-xl bg-[#070B14] hover:bg-[#0F172A] border border-slate-800 text-left space-y-1 transition-all cursor-pointer"
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white block">Plan & Limit</span>
                  <span className="text-[10px] text-slate-400 block">VIP Ayarları</span>
                </button>
                <button
                  onClick={() => setActiveTab('ads')}
                  className="p-3 rounded-xl bg-[#070B14] hover:bg-[#0F172A] border border-slate-800 text-left space-y-1 transition-all cursor-pointer"
                >
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white block">Reklamlar</span>
                  <span className="text-[10px] text-slate-400 block">Banner Kodları</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━
          SECTION 2: KULLANICI YÖNETİMİ (USER MANAGEMENT)
          ━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'users' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Filter Bar */}
          <div className="bg-[#0A1020] border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Kullanıcı adı veya e-posta ara..."
                className="w-full bg-[#070B14] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
              {/* Plan Filter */}
              <select
                value={userPlanFilter}
                onChange={(e) => setUserPlanFilter(e.target.value)}
                className="bg-[#070B14] text-slate-200 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="all">Tüm Planlar</option>
                <option value="free">Free (Ücretsiz)</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
                <option value="admin">Admin</option>
              </select>

              {/* Status Filter */}
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="bg-[#070B14] text-slate-200 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif Hesaplar</option>
                <option value="banned">Askıya Alınanlar</option>
              </select>

              <span className="text-xs text-slate-400 font-mono ml-auto">
                {filteredUsers.length} / {usersList.length} Kullanıcı
              </span>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-3xl bg-[#0A1020] border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070B14] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Kullanıcı</th>
                    <th className="p-4">E-Posta</th>
                    <th className="p-4">Plan / Yetki</th>
                    <th className="p-4">Resim / Depolama</th>
                    <th className="p-4">Durum</th>
                    <th className="p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Arama kriterlerine uygun kullanıcı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-bold text-white">
                          <button
                            onClick={() => handleOpenUserDetail(u.id)}
                            className="flex items-center gap-2.5 hover:text-sky-400 transition-colors text-left cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="block font-semibold">{u.username}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Kayıt: {new Date(u.created_at).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </button>
                        </td>

                        <td className="p-4 text-slate-400 font-mono">{u.email}</td>

                        <td className="p-4">
                          {u.role === 'admin' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              YÖNETİCİ
                            </span>
                          ) : (
                            <select
                              value={u.plan || 'free'}
                              onChange={(e) => handleUserPlanChange(u.id, e.target.value)}
                              className="bg-[#070B14] border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
                            >
                              <option value="free">Ücretsiz (Free)</option>
                              <option value="premium">Premium Pro</option>
                              <option value="vip">VIP Kurumsal</option>
                            </select>
                          )}
                        </td>

                        <td className="p-4 font-mono">
                          <span className="text-white font-bold">{u.image_count ?? u.stats?.total_images ?? 0}</span>
                          <span className="text-slate-500 text-[11px]"> resim</span>
                          <span className="text-slate-500 mx-1.5">•</span>
                          <span className="text-slate-400">{formatSize(u.storage_bytes ?? u.stats?.total_bytes ?? 0)}</span>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {u.status === 'active' ? '● Aktif' : '■ Askıda'}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenUserDetail(u.id)}
                              className="px-2.5 py-1 rounded-xl bg-[#070B14] hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
                              title="Detayları İncele"
                            >
                              Detay
                            </button>

                            {u.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleUserStatusToggle(u.id, u.status)}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                                    u.status === 'active'
                                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                                  }`}
                                >
                                  {u.status === 'active' ? 'Askıya Al' : 'Aktif Et'}
                                </button>
                                <button
                                  onClick={() => setDeleteUserModal({ open: true, user: u })}
                                  className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                                  title="Kullanıcıyı Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━
          SECTION 3: RESİM YÖNETİMİ (IMAGE MANAGEMENT)
          ━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'images' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Image Filter & Search Bar */}
          <div className="bg-[#0A1020] border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={imageSearch}
                onChange={(e) => setImageSearch(e.target.value)}
                placeholder="Dosya adı veya yükleyen kullanıcı ara..."
                className="w-full bg-[#070B14] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
              {/* Format Filter */}
              <select
                value={imageFormatFilter}
                onChange={(e) => setImageFormatFilter(e.target.value)}
                className="bg-[#070B14] text-slate-200 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="all">Tüm Formatlar</option>
                <option value="jpg">JPG / JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WEBP</option>
                <option value="gif">GIF</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-[#070B14] p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setImageViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    imageViewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Izgara Görünümü"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setImageViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    imageViewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tablo Görünümü"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {filteredImages.length} / {imagesList.length} Resim
              </span>
            </div>
          </div>

          {/* Grid View */}
          {imageViewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative bg-[#0A1020] rounded-2xl overflow-hidden border border-slate-800 p-2 flex flex-col hover:border-sky-500/40 transition-all shadow-md"
                >
                  <div className="aspect-square bg-[#070B14] rounded-xl overflow-hidden relative flex items-center justify-center">
                    {img.is_one_time_view ? (
                      <div className="flex flex-col items-center justify-center p-2 text-center text-rose-400 select-none">
                        <Flame className="w-6 h-6 animate-pulse mb-1" />
                        <span className="text-[9px] font-bold">1 Kullanımlık</span>
                      </div>
                    ) : (
                      <img
                        src={formatImageUrl(img.cloudinary_url)}
                        alt={img.original_filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}

                    <div className="absolute inset-0 bg-[#070B14]/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        onClick={() => setPreviewImage(img)}
                        className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-md transition-transform active:scale-95 cursor-pointer"
                        title="Önizle & Detay"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/i/${img.id}`)}
                        className="p-2 rounded-xl bg-[#0A1020] text-slate-200 hover:text-white border border-slate-700 shadow-md transition-transform active:scale-95 cursor-pointer"
                        title="Sayfaya Git"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 shadow-md transition-transform active:scale-95 cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 text-xs space-y-0.5">
                    <p className="font-semibold text-white truncate text-[11px]" title={img.original_filename}>
                      {img.original_filename}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{img.uploader_username || 'Misafir'}</span>
                      <span>{formatSize(img.size)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="rounded-3xl bg-[#0A1020] border border-slate-800 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070B14] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">Önizleme</th>
                      <th className="p-4">Dosya Adı</th>
                      <th className="p-4">Yükleyen</th>
                      <th className="p-4">Boyut / Çözünürlük</th>
                      <th className="p-4">İzlenme / İndirme</th>
                      <th className="p-4">Tarih</th>
                      <th className="p-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredImages.map((img) => (
                      <tr key={img.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4">
                          <div
                            onClick={() => setPreviewImage(img)}
                            className="w-12 h-12 rounded-xl bg-black overflow-hidden cursor-pointer border border-slate-800 flex items-center justify-center shrink-0"
                          >
                            {img.is_one_time_view ? (
                              <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
                            ) : (
                              <img
                                src={formatImageUrl(img.cloudinary_url)}
                                alt={img.original_filename}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-white max-w-xs truncate">{img.original_filename}</td>
                        <td className="p-4 text-slate-400">{img.uploader_username || 'Misafir'}</td>
                        <td className="p-4 font-mono text-[11px]">
                          <div>{formatSize(img.size)}</div>
                          <div className="text-slate-500">{img.width}x{img.height} ({img.format.toUpperCase()})</div>
                        </td>
                        <td className="p-4 font-mono text-[11px]">
                          <span className="text-emerald-400 font-bold">{img.views}</span> izlenme • <span className="text-sky-400 font-bold">{img.downloads}</span> indirme
                        </td>
                        <td className="p-4 text-slate-400 text-[11px]">
                          {new Date(img.created_at).toLocaleString('tr-TR')}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPreviewImage(img)}
                              className="px-2.5 py-1 rounded-xl bg-[#070B14] hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
                            >
                              Önizle
                            </button>
                            <button
                              onClick={() => navigate(`/i/${img.id}`)}
                              className="px-2.5 py-1 rounded-xl bg-[#070B14] hover:bg-slate-800 text-sky-400 text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
                            >
                              Sayfa
                            </button>
                            <button
                              onClick={() => handleDeleteImage(img.id)}
                              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━
          SECTION 4: ŞİKÂYET YÖNETİMİ (REPORTS & DMCA ABUSE)
          ━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'reports' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            {(
              [
                { id: 'all', label: 'Tüm Bildirimler' },
                { id: 'pending', label: 'Bekleyenler' },
                { id: 'investigating', label: 'İncelemede Olanlar' },
                { id: 'resolved', label: 'Çözülenler' },
                { id: 'dismissed', label: 'Reddedilenler' },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                onClick={() => setReportFilter(st.id)}
                className={`px-4 py-2 rounded-2xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  reportFilter === st.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-[#0A1020] border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-[#0A1020] border border-slate-800 text-xs text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-white text-sm">Hiç Şikayet Bulunmuyor</p>
              <p className="text-slate-400">Bu filtrelere uyan herhangi bir şikayet veya DMCA bildirimi yok.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-3xl bg-[#0A1020] border border-slate-800 p-5 sm:p-6 space-y-4 text-xs shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-sm">Şikayet Nedeni: {rep.reason}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            rep.status === 'pending'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : rep.status === 'investigating'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : rep.status === 'resolved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1 font-mono">
                        Tarih: {new Date(rep.created_at).toLocaleString('tr-TR')} • Bildiren IP: {rep.ip}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/i/${rep.image_id}`)}
                      className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Resim Sayfasını Aç ({rep.image_id})</span>
                    </button>
                  </div>

                  {/* Image Preview & Notes Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    {rep.image_url && (
                      <div className="w-24 h-24 rounded-2xl bg-black border border-slate-800 overflow-hidden shrink-0">
                        <img
                          src={formatImageUrl(rep.image_url)}
                          alt="Şikayet edilen görsel"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="md:col-span-3 space-y-2">
                      <label className="text-[11px] font-semibold text-slate-400">Moderatör İnceleme Notu</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue={rep.notes || ''}
                          onChange={(e) => setReportNotes({ ...reportNotes, [rep.id]: e.target.value })}
                          placeholder="İnceleme notu veya aksiyon açıklaması girin..."
                          className="flex-1 bg-[#070B14] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        />
                        <button
                          onClick={() => handleReportAction(rep.id, rep.status)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                        >
                          Notu Kaydet
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Button Strip */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80 flex-wrap">
                    <button
                      onClick={() => handleReportAction(rep.id, 'investigating')}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-bold text-xs border border-amber-500/20 cursor-pointer"
                    >
                      İncelemeye Al
                    </button>
                    <button
                      onClick={() => handleReportAction(rep.id, 'resolved')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs border border-emerald-500/20 cursor-pointer"
                    >
                      Çözüldü Olarak İşaretle
                    </button>
                    <button
                      onClick={() => handleReportAction(rep.id, 'dismissed')}
                      className="px-3.5 py-2 rounded-xl bg-[#070B14] text-slate-300 hover:bg-slate-800 font-bold text-xs border border-slate-800 cursor-pointer"
                    >
                      Reddet / Kapat
                    </button>
                    <button
                      onClick={() => handleDeleteReportedImage(rep.id, rep.image_id)}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                    >
                      Resmi Kalıcı Olarak Sil & Çöz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━
          SECTION 5: DUYURULAR (ANNOUNCEMENTS MANAGEMENT)
          ━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Create Announcement Form */}
          <form
            onSubmit={handleCreateAnnouncement}
            className="rounded-3xl bg-[#0A1020] border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">Yeni Sistem Duyurusu Yayınla</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Duyuru Başlığı (Örn: V6 Güncellemesi Yayında!)"
                className="sm:col-span-2 bg-[#070B14] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <select
                value={annType}
                onChange={(e) => setAnnType(e.target.value as any)}
                className="bg-[#070B14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="info">🔵 Bilgilendirme (Mavi)</option>
                <option value="warning">🟡 Uyarı / Planlı Bakım (Sarı)</option>
                <option value="success">🟢 Yeni Özellik / Müjde (Yeşil)</option>
              </select>
            </div>

            <textarea
              required
              rows={3}
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Duyuru detaylı metni..."
              className="w-full bg-[#070B14] border border-slate-800 rounded-xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />

            <button
              type="submit"
              disabled={creatingAnnouncement}
              className="min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white rounded-2xl text-xs font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {creatingAnnouncement ? 'Yayınlanıyor...' : 'Duyuruyu Canlıya Al'}
            </button>
          </form>

          {/* Published Announcements List */}
          <div className="rounded-3xl bg-[#0A1020] border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white">Yayındaki Sistem Duyuruları ({announcementsList.length})</h3>

            {announcementsList.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Şu an aktif yayınlanmış bir duyuru bulunmuyor.</p>
            ) : (
              <div className="space-y-3">
                {announcementsList.map((ann) => (
                  <div
                    key={ann.id}
                    className="flex items-start justify-between p-4 sm:p-5 rounded-2xl bg-[#070B14] border border-slate-800 text-xs gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            ann.type === 'warning'
                              ? 'bg-amber-400'
                              : ann.type === 'success'
                              ? 'bg-emerald-400'
                              : 'bg-sky-400'
                          }`}
                        />
                        <span className="font-bold text-white text-sm">{ann.title}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed max-w-3xl">{ann.content}</p>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Yayın Tarihi: {new Date(ann.created_at).toLocaleString('tr-TR')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl shrink-0 transition-colors cursor-pointer"
                      title="Duyuruyu Yayından Kaldır"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━
          SECTION 6: PREMIUM/VIP YÖNETİMİ (PLAN & LIMIT CONFIG)
          ━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'plans' && (
        <form onSubmit={handleSaveAllPlans} className="space-y-6 animate-in fade-in max-w-5xl">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Premium & VIP Paket Limit Yapılandırması</span>
            </h2>
            <p className="text-xs text-slate-400">
              Kullanıcı üyelik katmanlarının (Free, Premium, VIP) günlük yükleme, dosya boyutu ve depolama limitlerini canlı yönetin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {['free', 'premium', 'vip'].map((planKey) => {
              const plan = plans[planKey] || {
                name: planKey.toUpperCase(),
                daily_upload_limit: planKey === 'free' ? 20 : planKey === 'premium' ? 100 : 500,
                max_file_size_mb: planKey === 'free' ? 15 : planKey === 'premium' ? 30 : 50,
                storage_limit_gb: planKey === 'free' ? 2 : planKey === 'premium' ? 25 : 100,
                ads_enabled: planKey === 'free',
                features: [],
              };

              return (
                <div
                  key={planKey}
                  className="rounded-3xl bg-[#0A1020] border border-slate-800 p-6 space-y-4 shadow-xl hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-sky-400">{plan.name}</span>
                    <Crown
                      className={`w-4 h-4 ${
                        planKey === 'vip' ? 'text-purple-400' : planKey === 'premium' ? 'text-blue-400' : 'text-slate-400'
                      }`}
                    />
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-400">Paket Görünür Adı</label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => {
                          setPlans({
                            ...plans,
                            [planKey]: { ...plan, name: e.target.value },
                          });
                        }}
                        className="w-full bg-[#070B14] border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400">Maks. Dosya Boyutu (MB)</label>
                      <input
                        type="number"
                        min={1}
                        value={plan.max_file_size_mb}
                        onChange={(e) => {
                          setPlans({
                            ...plans,
                            [planKey]: { ...plan, max_file_size_mb: parseInt(e.target.value, 10) || 15 },
                          });
                        }}
                        className="w-full bg-[#070B14] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400">Günlük Yükleme Limiti (Adet)</label>
                      <input
                        type="number"
                        min={1}
                        value={plan.daily_upload_limit}
                        onChange={(e) => {
                          setPlans({
                            ...plans,
                            [planKey]: { ...plan, daily_upload_limit: parseInt(e.target.value, 10) || 20 },
                          });
                        }}
                        className="w-full bg-[#070B14] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400">Depolama Kotası (GB)</label>
                      <input
                        type="number"
                        min={1}
                        value={plan.storage_limit_gb}
                        onChange={(e) => {
                          setPlans({
                            ...plans,
                            [planKey]: { ...plan, storage_limit_gb: parseInt(e.target.value, 10) || 2 },
                          });
                        }}
                        className="w-full bg-[#070B14] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-slate-300">Reklam Gösterimi</span>
                      <input
                        type="checkbox"
                        checked={plan.ads_enabled}
                        onChange={(e) => {
                          setPlans({
                            ...plans,
                            [planKey]: { ...plan, ads_enabled: e.target.checked },
                          });
                        }}
                        className="w-4 h-4 rounded bg-[#070B14] border-slate-800 text-sky-600 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            className="min-h-[44px] px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all active:scale-95 cursor-pointer"
          >
            Tüm Plan Değişikliklerini Kaydet
          </button>
        </form>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━
          SECTION 7: SITE AYARLARI (SITE & SYSTEM SETTINGS)
          ━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'settings' && siteSettings && (
        <form
          onSubmit={handleUpdateSiteSettings}
          className="rounded-3xl bg-[#0A1020] border border-slate-800 p-6 sm:p-8 space-y-5 max-w-2xl animate-in fade-in shadow-xl"
        >
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-sky-400" />
              <span>Sistem & Site Genel Ayarları</span>
            </h3>
            <p className="text-xs text-slate-400">
              Platformun genel başlığı, yükleme limitleri ve kullanıcı erişim politikaları.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Site Başlığı</label>
            <input
              type="text"
              value={siteSettings.site_title}
              onChange={(e) => setSiteSettings({ ...siteSettings, site_title: e.target.value })}
              className="w-full bg-[#070B14] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Site Açıklaması (Meta Description)</label>
            <input
              type="text"
              value={siteSettings.site_description || ''}
              onChange={(e) => setSiteSettings({ ...siteSettings, site_description: e.target.value })}
              className="w-full bg-[#070B14] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Genel Maksimum Dosya Boyutu (MB)</label>
            <input
              type="number"
              value={siteSettings.max_file_size_mb}
              onChange={(e) => setSiteSettings({ ...siteSettings, max_file_size_mb: parseInt(e.target.value, 10) || 20 })}
              className="w-full bg-[#070B14] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#070B14] border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Misafir Yüklemesi</span>
                <span className="text-[10px] text-slate-400">Üye olmadan anonim resim yüklenmesine izin ver</span>
              </div>
              <input
                type="checkbox"
                checked={siteSettings.allow_guest_upload}
                onChange={(e) => setSiteSettings({ ...siteSettings, allow_guest_upload: e.target.checked })}
                className="w-4 h-4 rounded bg-[#070B14] border-slate-800 text-sky-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#070B14] border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Yeni Kullanıcı Kaydı</span>
                <span className="text-[10px] text-slate-400">Yeni hesap oluşturulmasına izin ver</span>
              </div>
              <input
                type="checkbox"
                checked={siteSettings.allow_user_registration}
                onChange={(e) => setSiteSettings({ ...siteSettings, allow_user_registration: e.target.checked })}
                className="w-4 h-4 rounded bg-[#070B14] border-slate-800 text-sky-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#070B14] border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Bakım Modu</span>
                <span className="text-[10px] text-slate-400">Sadece yöneticilerin siteyi kullanmasına izin verir</span>
              </div>
              <input
                type="checkbox"
                checked={siteSettings.maintenance_mode || false}
                onChange={(e) => setSiteSettings({ ...siteSettings, maintenance_mode: e.target.checked })}
                className="w-4 h-4 rounded bg-[#070B14] border-slate-800 text-sky-600 cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/20 mt-4 transition-all active:scale-95 cursor-pointer"
          >
            Site Ayarlarını Kaydet
          </button>
        </form>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━
          SECTION 8: REKLAM YÖNETİMİ (AD MANAGEMENT)
          ━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'ads' && (
        <form
          onSubmit={handleSaveAdSettings}
          className="rounded-3xl bg-[#0A1020] border border-slate-800 p-6 sm:p-8 space-y-6 max-w-4xl animate-in fade-in shadow-xl"
        >
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Reklam Yönetimi & Ad Alanları</span>
            </h3>
            <p className="text-xs text-slate-400">
              Google AdSense veya özel HTML banner kodlarınızı sayfa alanlarına yerleştirin.
            </p>
          </div>

          {/* Ad Slot 1: Header Banner */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                1. Üst Banner (Header) Reklam Kodu (728x90 / Esnek)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Tüm sayfalarda üst bölgede görünür</span>
            </div>
            <textarea
              rows={3}
              value={adSettings.header_ad_code}
              onChange={(e) => setAdSettings({ ...adSettings, header_ad_code: e.target.value })}
              placeholder="<!-- Google AdSense veya Özel HTML Banner Kodu -->"
              className="w-full bg-[#070B14] border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Ad Slot 2: Sidebar Ad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                2. Kenar Çubuğu (Sidebar) Reklam Kodu (300x250)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Galeri ve yan panellerde gösterilir</span>
            </div>
            <textarea
              rows={3}
              value={adSettings.sidebar_ad_code}
              onChange={(e) => setAdSettings({ ...adSettings, sidebar_ad_code: e.target.value })}
              placeholder="<!-- Sidebar Banner Reklam Kodu -->"
              className="w-full bg-[#070B14] border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Ad Slot 3: Image Detail Page Ad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                3. Resim Detay & İndirme Sayfası Reklam Kodu
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Görselin hemen altında gösterilir</span>
            </div>
            <textarea
              rows={3}
              value={adSettings.image_page_ad_code}
              onChange={(e) => setAdSettings({ ...adSettings, image_page_ad_code: e.target.value })}
              placeholder="<!-- Resim Sayfası İçi Banner Kodu -->"
              className="w-full bg-[#070B14] border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>
              Not: Premium ve VIP üyeler için plan ayarlarında reklamlar devre dışı bırakılmışsa bu reklamlar gösterilmez.
            </span>
          </div>

          <button
            type="submit"
            className="min-h-[44px] px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all active:scale-95 cursor-pointer"
          >
            Reklam Ayarlarını Kaydet
          </button>
        </form>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━
          SECTION 9: AUDIT LOG (DENETİM GÜNLÜĞÜ)
          ━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'audit' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Search & Filter */}
          <div className="bg-[#0A1020] border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="İşlem türü veya hedef ara..."
                className="w-full bg-[#070B14] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="bg-[#070B14] text-slate-200 border border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="all">Tüm İşlemler</option>
                <option value="USER_BANNED">USER_BANNED</option>
                <option value="USER_UNBANNED">USER_UNBANNED</option>
                <option value="USER_DELETED">USER_DELETED</option>
                <option value="IMAGE_DELETED">IMAGE_DELETED</option>
                <option value="PLAN_CHANGED">PLAN_CHANGED</option>
                <option value="SETTINGS_CHANGED">SETTINGS_CHANGED</option>
                <option value="ANNOUNCEMENT_CREATED">ANNOUNCEMENT_CREATED</option>
              </select>

              <span className="text-xs text-slate-400 font-mono">
                {filteredAuditLogs.length} Günlük Kaydı
              </span>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-3xl bg-[#0A1020] border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#070B14] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Zaman Damgası</th>
                    <th className="p-4">İşlem (Action)</th>
                    <th className="p-4">Yönetici</th>
                    <th className="p-4">Hedef</th>
                    <th className="p-4">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                        Kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-slate-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('tr-TR')}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              log.action.includes('DELETED') || log.action.includes('BANNED')
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : log.action.includes('CREATED') || log.action.includes('UNBANNED')
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-blue-500/20 text-sky-300 border border-blue-500/30'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-white font-bold">{log.actor_username || 'Admin'}</td>
                        <td className="p-4 text-slate-400">{log.target || '-'}</td>
                        <td className="p-4 font-sans text-slate-300 max-w-md truncate">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {})}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━
          MODAL: USER DETAIL MODAL
          ━━━━━━━━━━━━━━━━━━━━ */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0A1020] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  {selectedUserDetail.user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedUserDetail.user.username}</h3>
                  <p className="text-xs text-slate-400">{selectedUserDetail.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#070B14] border border-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Toplam Resim</span>
                <span className="text-lg font-bold text-white font-mono">
                  {selectedUserDetail.stats?.total_images || 0}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Depolama</span>
                <span className="text-lg font-bold text-sky-400 font-mono">
                  {formatSize(selectedUserDetail.stats?.total_bytes || 0)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#070B14] border border-slate-800 space-y-1">
                <span className="text-slate-400 block">İzlenme</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {selectedUserDetail.stats?.total_views || 0}
                </span>
              </div>
            </div>

            {/* Recent Uploads Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Son Yüklediği Resimler ({selectedUserDetail.images?.length || 0})
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {selectedUserDetail.images?.slice(0, 12).map((img) => (
                  <div
                    key={img.id}
                    onClick={() => {
                      setSelectedUserDetail(null);
                      setPreviewImage(img);
                    }}
                    className="aspect-square rounded-xl bg-black overflow-hidden border border-slate-800 cursor-pointer hover:border-sky-500 transition-colors"
                  >
                    <img
                      src={formatImageUrl(img.cloudinary_url)}
                      alt={img.original_filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-[#070B14] hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━
          MODAL: IMAGE PREVIEW MODAL
          ━━━━━━━━━━━━━━━━━━━━ */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0A1020] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white truncate max-w-md">{previewImage.original_filename}</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {formatSize(previewImage.size)} • {previewImage.width}x{previewImage.height} ({previewImage.format.toUpperCase()})
                </p>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-[#070B14] border border-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 min-h-[160px] bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-4">
              {previewImage.is_one_time_view ? (
                <div className="text-center space-y-2 text-rose-400">
                  <Flame className="w-10 h-10 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-white">1 Kullanımlık Güvenli Görsel</p>
                  <p className="text-[11px] text-slate-400 max-w-sm">
                    Bu görsel tek kullanımlık olarak ayarlandığı için yönetici panelinde önizleme akışı başlatılmaz.
                  </p>
                </div>
              ) : (
                <img
                  src={formatImageUrl(previewImage.cloudinary_url)}
                  alt={previewImage.original_filename}
                  className="max-h-80 w-auto object-contain"
                />
              )}
            </div>

            {/* Direct Link Copy Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Doğrudan CDN Bağlantısı
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={previewImage.cloudinary_url}
                  className="flex-1 bg-[#070B14] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(previewImage.cloudinary_url, 'CDN URL')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kopyala</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => navigate(`/i/${previewImage.id}`)}
                className="text-sky-400 hover:text-sky-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Tam Resim Sayfasını Aç</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteImage(previewImage.id)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Resmi Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━
          MODAL: DELETE USER CONFIRMATION
          ━━━━━━━━━━━━━━━━━━━━ */}
      {deleteUserModal.open && deleteUserModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#0A1020] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Kullanıcıyı Sil</h3>
                <p className="text-xs text-slate-400">Bu işlem geri alınamaz.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>{deleteUserModal.user.username}</strong> ({deleteUserModal.user.email}) kullanıcısını ve bu hesaba ait tüm resim ve albümleri kalıcı olarak silmek istediğinize emin misiniz?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteUserModal({ open: false, user: null })}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#070B14] border border-slate-800 cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={deletingUser}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {deletingUser ? 'Siliniyor...' : 'Evet, Kullanıcıyı Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
