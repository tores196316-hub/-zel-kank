import React, { useEffect, useState } from 'react';
import {
  Shield, Users, Images, Flag, Bell, Settings, Activity, Trash2, Ban, CheckCircle, RefreshCw, AlertTriangle, HardDrive, Eye, Server, Radio, Crown, FileText, BarChart3, Search, CheckCircle2, XCircle, Clock, ExternalLink, Sliders
} from 'lucide-react';
import { adminApi } from '../lib/api';
import { AdminStats, Announcement, ImageMetadata, Report, SiteSettings, User, AuditLog, PlanConfig, AnalyticsData } from '../types';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

interface AdminPageProps {
  navigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'images' | 'plans' | 'reports' | 'announcements' | 'audit' | 'analytics' | 'settings' | 'system'>('dashboard');

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

  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [imageSearch, setImageSearch] = useState('');
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed'>('all');

  // Announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState('info');

  // User delete modal state
  const [deleteUserModal, setDeleteUserModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [deletingUser, setDeletingUser] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, uRes, iRes, rRes, aRes, stRes, hRes, plansRes, auditRes, analyticsRes] = await Promise.all([
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
      if (stRes.settings) setSiteSettings(stRes.settings);
      if (hRes) setSystemHealth(hRes);
      if (plansRes.plans) setPlans(plansRes.plans);
      if (auditRes.audit_logs) setAuditLogs(auditRes.audit_logs);
      if (analyticsRes) setAnalytics(analyticsRes);
    } catch (err: any) {
      showToast('Admin verileri yüklenirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Erişim Engellendi</h2>
        <p className="text-slate-400 text-xs">Bu alana erişim için yönetici yetkiniz bulunmamaktadır.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

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

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserModal.user) return;
    setDeletingUser(true);
    try {
      await adminApi.deleteUser(deleteUserModal.user.id);
      showToast(`"${deleteUserModal.user.username}" kullanıcısı ve verileri silindi.`, 'success');
      setUsersList((prev) => prev.filter((u) => u.id !== deleteUserModal.user?.id));
      setDeleteUserModal({ open: false, user: null });
    } catch (err: any) {
      showToast(err.message || 'Kullanıcı silinemedi.', 'error');
    } finally {
      setDeletingUser(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Bu resmi kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await adminApi.deleteImage(imageId);
      showToast('Resim başarıyla silindi.', 'success');
      setImagesList((prev) => prev.filter((i) => i.id !== imageId));
    } catch (err: any) {
      showToast(err.message || 'Resim silinemedi.', 'error');
    }
  };

  const handleReportAction = async (reportId: string, status: 'pending' | 'investigating' | 'resolved' | 'dismissed', notes?: string) => {
    try {
      await adminApi.updateReportStatus(reportId, status, notes);
      showToast(`Rapor durumu güncellendi.`, 'success');
      setReportsList((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status, notes: notes || r.notes } : r))
      );
    } catch (err: any) {
      showToast(err.message || 'Rapor güncellenemedi.', 'error');
    }
  };

  const handleSavePlans = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.updatePlans(plans);
      showToast(res.message || 'Plan yapılandırmaları kaydedildi.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Planlar kaydedilemedi.', 'error');
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    try {
      const res = await adminApi.createAnnouncement(annTitle, annContent, annType);
      showToast(res.message, 'success');
      setAnnouncementsList((prev) => [res.announcement, ...prev]);
      setAnnTitle('');
      setAnnContent('');
    } catch (err: any) {
      showToast(err.message || 'Duyuru oluşturulamadı.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await adminApi.deleteAnnouncement(id);
      showToast('Duyuru kaldırıldı.', 'success');
      setAnnouncementsList((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      showToast('Duyuru silinemedi.', 'error');
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;

    try {
      const res = await adminApi.updateSettings(siteSettings);
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast('Site ayarları güncellenemedi.', 'error');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const filteredUsers = usersList.filter((u) =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredImages = imagesList.filter((img) =>
    img.original_filename.toLowerCase().includes(imageSearch.toLowerCase()) ||
    (img.uploader_username && img.uploader_username.toLowerCase().includes(imageSearch.toLowerCase()))
  );

  const filteredReports = reportsList.filter((rep) => {
    if (reportFilter === 'all') return true;
    return rep.status === reportFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/5">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Admin Kontrol Paneli</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">V4 PRO</span>
            </div>
            <p className="text-xs text-slate-400">Tüm sistem metrikleri, planlar, kullanıcılar ve moderasyon merkezi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-all active:scale-95"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Modern Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs scrollbar-none">
        {[
          { id: 'dashboard', label: 'Genel Bakış', icon: Activity },
          { id: 'users', label: 'Kullanıcılar', icon: Users, badge: usersList.length },
          { id: 'images', label: 'Resimler', icon: Images, badge: imagesList.length },
          { id: 'plans', label: 'Plan & Limitler', icon: Crown },
          { id: 'reports', label: 'Moderasyon', icon: Flag, badge: reportsList.filter(r => r.status === 'pending').length },
          { id: 'announcements', label: 'Duyurular', icon: Bell, badge: announcementsList.length },
          { id: 'audit', label: 'Denetim Günlüğü', icon: FileText },
          { id: 'analytics', label: 'Analitik', icon: BarChart3 },
          { id: 'settings', label: 'Site Ayarları', icon: Settings },
          { id: 'system', label: 'Sistem Durumu', icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 min-h-[38px] px-3.5 py-2 rounded-xl font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-[#0F172A] text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Dashboard */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6 animate-in fade-in">
          {/* Cloudinary Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold ${
              stats.cloudinary_connected
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Cloudinary CDN Servisi: <strong className="text-white font-mono">{stats.cloudinary_cloud_name}</strong></span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[11px]">
              {stats.cloudinary_connected ? '● Bağlı & Aktif (CDN Hızlandırması)' : 'Yerel Depolama Modu'}
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-1">
              <span className="text-2xl font-black text-white block">{stats.total_users}</span>
              <span className="text-xs text-slate-400">Toplam Kullanıcı</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-1">
              <span className="text-2xl font-black text-blue-400 block">{stats.total_images}</span>
              <span className="text-xs text-slate-400">Toplam Resim</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-1">
              <span className="text-2xl font-black text-emerald-400 block">{stats.today_images ?? 0}</span>
              <span className="text-xs text-slate-400">Bugün Yüklenen</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-1">
              <span className="text-2xl font-black text-indigo-400 block">{stats.today_users ?? 0}</span>
              <span className="text-xs text-slate-400">Bugün Kayıt Olan</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-1">
              <span className="text-2xl font-black text-purple-400 block">{formatSize(stats.total_storage_bytes)}</span>
              <span className="text-xs text-slate-400">Toplam Depolama</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-1">
              <span className="text-2xl font-black text-amber-400 block">{(stats.total_views || 0).toLocaleString()}</span>
              <span className="text-xs text-slate-400">Toplam İzlenme</span>
            </div>
          </div>

          {/* Quick Actions / Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setActiveTab('users')}
              className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-blue-400">
                <Users className="w-5 h-5" />
                <span className="text-xs font-semibold">Yönet →</span>
              </div>
              <h3 className="text-sm font-bold text-white">Kullanıcı Yönetimi</h3>
              <p className="text-xs text-slate-400">Kullanıcı arama, plan güncelleme, durum askıya alma ve güvenli silme.</p>
            </div>

            <div
              onClick={() => setActiveTab('plans')}
              className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-amber-400">
                <Crown className="w-5 h-5" />
                <span className="text-xs font-semibold">Yapılandır →</span>
              </div>
              <h3 className="text-sm font-bold text-white">Plan & Limit Kontrolü</h3>
              <p className="text-xs text-slate-400">Free, Premium ve VIP paketlerin günlük yükleme ve depolama limitlerini düzenleyin.</p>
            </div>

            <div
              onClick={() => setActiveTab('reports')}
              className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-rose-400">
                <Flag className="w-5 h-5" />
                <span className="text-xs font-semibold">İncele →</span>
              </div>
              <h3 className="text-sm font-bold text-white">Şikayet Moderasyonu</h3>
              <p className="text-xs text-slate-400">Bildirilen görselleri inceleyin, not ekleyin veya yayından kaldırın.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Kullanıcı adı veya e-posta ara..."
                className="w-full bg-[#0F172A] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400 self-end sm:self-center">Toplam {filteredUsers.length} kullanıcı listeleniyor</span>
          </div>

          <div className="rounded-2xl bg-[#0F172A] border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0F19] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Kullanıcı</th>
                    <th className="p-4">E-Posta</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Resimler</th>
                    <th className="p-4">Depolama</th>
                    <th className="p-4">Durum</th>
                    <th className="p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                            {u.username.charAt(0).toUpperCase()}
                          </span>
                          <span>{u.username}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{u.email}</td>
                      <td className="p-4">
                        {u.role === 'admin' ? (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ADMIN
                          </span>
                        ) : (
                          <select
                            value={u.plan || 'free'}
                            onChange={(e) => handleUserPlanChange(u.id, e.target.value)}
                            className="bg-[#0B0F19] border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="free">Ücretsiz (Free)</option>
                            <option value="premium">Premium</option>
                            <option value="vip">VIP Pro</option>
                          </select>
                        )}
                      </td>
                      <td className="p-4 font-mono">{u.stats?.total_images || u.image_count || 0}</td>
                      <td className="p-4 font-mono text-slate-400">
                        {formatSize(u.stats?.total_bytes || 0)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {u.status === 'active' ? 'Aktif' : 'Askıda'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {u.role !== 'admin' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUserStatusToggle(u.id, u.status)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                u.status === 'active'
                                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              }`}
                            >
                              {u.status === 'active' ? 'Askıya Al' : 'Aktif Et'}
                            </button>
                            <button
                              onClick={() => setDeleteUserModal({ open: true, user: u })}
                              className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                              title="Kullanıcıyı Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Images */}
      {activeTab === 'images' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={imageSearch}
                onChange={(e) => setImageSearch(e.target.value)}
                placeholder="Dosya adı veya yükleyen kişi ara..."
                className="w-full bg-[#0F172A] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400">Toplam {filteredImages.length} resim listeleniyor</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {filteredImages.map((img) => (
              <div key={img.id} className="group relative bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-800 p-1.5 flex flex-col hover:border-slate-700 transition-all">
                <div className="aspect-square bg-[#0B0F19] rounded-xl overflow-hidden relative flex items-center justify-center">
                  <img
                    src={img.cloudinary_url}
                    alt={img.original_filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-[#0B0F19]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => navigate(`/i/${img.id}`)}
                      className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-md"
                      title="Görüntüle"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 shadow-md"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-2 text-xs space-y-0.5">
                  <p className="font-semibold text-white truncate text-[11px]">{img.original_filename}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {img.uploader_username || 'Misafir'} • {formatSize(img.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Plans & Limits Config */}
      {activeTab === 'plans' && (
        <form onSubmit={handleSavePlans} className="space-y-6 animate-in fade-in max-w-4xl">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Paket ve Limit Yapılandırması</h2>
            <p className="text-xs text-slate-400">Üyelik paketlerinin limitlerini anlık olarak yönetebilirsiniz.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {['free', 'premium', 'vip'].map((planKey) => {
              const plan = plans[planKey] || {
                name: planKey.toUpperCase(),
                daily_upload_limit: 20,
                max_file_size_mb: 15,
                storage_limit_gb: 2,
                ads_enabled: true,
                features: [],
              };

              return (
                <div key={planKey} className="rounded-3xl bg-[#0F172A] border border-slate-800 p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{plan.name}</span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-400">Plan Adı</label>
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => {
                          setPlans({
                            ...plans,
                            [planKey]: { ...plan, name: e.target.value },
                          });
                        }}
                        className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-white"
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
                        className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400">Günlük Yükleme Limiti</label>
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
                        className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400">Depolama Alanı (GB)</label>
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
                        className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-slate-400">Reklamlar Aktif</span>
                      <input
                        type="checkbox"
                        checked={plan.ads_enabled}
                        onChange={(e) => {
                          setPlans({
                            ...plans,
                            [planKey]: { ...plan, ads_enabled: e.target.checked },
                          });
                        }}
                        className="w-4 h-4 rounded bg-[#0B0F19] border-slate-800 text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            Plan Değişikliklerini Kaydet
          </button>
        </form>
      )}

      {/* Tab 5: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
            {(['all', 'pending', 'investigating', 'resolved', 'dismissed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setReportFilter(st)}
                className={`px-3 py-1.5 rounded-xl capitalize font-medium transition-all ${
                  reportFilter === st ? 'bg-blue-600 text-white' : 'bg-[#0F172A] border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'Tümü' : st === 'pending' ? 'Bekleyen' : st === 'investigating' ? 'İncelemede' : st === 'resolved' ? 'Çözüldü' : 'Kapatıldı'}
              </button>
            ))}
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0F172A] border border-slate-800 text-xs text-slate-400">
              Bu filtreye uygun şikayet bildirimi bulunmamaktadır.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((rep) => (
                <div key={rep.id} className="rounded-3xl bg-[#0F172A] border border-slate-800 p-5 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="font-bold text-white text-sm">Şikayet Nedeni: {rep.reason}</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Tarih: {new Date(rep.created_at).toLocaleString('tr-TR')} • IP: {rep.ip}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase self-start sm:self-auto ${
                      rep.status === 'pending' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      rep.status === 'investigating' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      rep.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {rep.status}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                    <button
                      onClick={() => navigate(`/i/${rep.image_id}`)}
                      className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 text-xs"
                    >
                      Resmi Görüntüle ({rep.image_id})
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleReportAction(rep.id, 'investigating')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-medium text-xs border border-amber-500/20"
                      >
                        İncelemeye Al
                      </button>
                      <button
                        onClick={() => handleReportAction(rep.id, 'resolved')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium text-xs border border-emerald-500/20"
                      >
                        Çözüldü Olarak İşaretle
                      </button>
                      <button
                        onClick={() => handleReportAction(rep.id, 'dismissed')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs"
                      >
                        Reddet / Kapat
                      </button>
                      <button
                        onClick={() => handleDeleteImage(rep.image_id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 font-bold text-xs border border-rose-500/30"
                      >
                        Resmi Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in">
          <form onSubmit={handleCreateAnnouncement} className="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white">Yeni Sistem Duyurusu Oluştur</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Duyuru Başlığı"
                className="bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <select
                value={annType}
                onChange={(e) => setAnnType(e.target.value)}
                className="bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="info">Bilgilendirme (Mavi)</option>
                <option value="warning">Uyarı / Bakım (Sarı)</option>
                <option value="success">Yeni Özellik (Yeşil)</option>
              </select>
              <button
                type="submit"
                className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Duyuruyu Yayınla
              </button>
            </div>
            <textarea
              required
              rows={3}
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Duyuru Metni..."
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </form>

          <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-white">Yayındaki Duyurular ({announcementsList.length})</h3>
            {announcementsList.map((ann) => (
              <div key={ann.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#0B0F19] border border-slate-800 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-white block text-sm">{ann.title}</span>
                  <p className="text-slate-300 leading-relaxed">{ann.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl shrink-0 ml-4 transition-colors"
                  title="Duyuruyu Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="rounded-3xl bg-[#0F172A] border border-slate-800 overflow-hidden animate-in fade-in shadow-xl">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Denetim Günlüğü (Audit Logs)</h3>
            <span className="text-xs text-slate-400">Son {auditLogs.length} admin hareketi</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0F19] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Tarih / Saat</th>
                  <th className="p-3.5">İşlem</th>
                  <th className="p-3.5">Yönetici</th>
                  <th className="p-3.5">Hedef</th>
                  <th className="p-3.5">Detay</th>
                  <th className="p-3.5">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 text-slate-400">{new Date(log.created_at).toLocaleString('tr-TR')}</td>
                    <td className="p-3.5 font-bold text-blue-400">{log.action}</td>
                    <td className="p-3.5 text-white">{log.actor_username}</td>
                    <td className="p-3.5 text-slate-400">{log.target_id || '-'}</td>
                    <td className="p-3.5 font-sans text-slate-300">{JSON.stringify(log.details || {})}</td>
                    <td className="p-3.5 text-slate-500">{log.ip || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 8: Analytics */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plan Distribution */}
            <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white">Kullanıcı Paket Dağılımı</h3>
              <div className="space-y-3">
                {Object.entries(analytics.plan_distribution || {}).map(([pName, count]) => (
                  <div key={pName} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-300 capitalize">{pName}</span>
                      <span className="text-white font-mono">{count} üye</span>
                    </div>
                    <div className="w-full bg-[#0B0F19] rounded-full h-2">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${Math.min(100, Math.round(((count as number) / (stats?.total_users || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage Distribution */}
            <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white">Depolama & Kullanım Özeti</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Toplam Yüklenen Resim</span>
                  <span className="font-bold text-white">{stats?.total_images}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Toplam Kaplanan Alan</span>
                  <span className="font-bold text-blue-400">{formatSize(stats?.total_storage_bytes || 0)}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Toplam Görüntülenme</span>
                  <span className="font-bold text-emerald-400">{stats?.total_views}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: Settings */}
      {activeTab === 'settings' && siteSettings && (
        <form onSubmit={handleUpdateSettings} className="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 space-y-5 max-w-2xl animate-in fade-in shadow-xl">
          <h3 className="text-sm font-bold text-white">Sistem & Site Ayarları</h3>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Site Başlığı</label>
            <input
              type="text"
              value={siteSettings.site_title}
              onChange={(e) => setSiteSettings({ ...siteSettings, site_title: e.target.value })}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Maksimum Dosya Boyutu (MB)</label>
            <input
              type="number"
              value={siteSettings.max_file_size_mb}
              onChange={(e) => setSiteSettings({ ...siteSettings, max_file_size_mb: parseInt(e.target.value, 10) || 20 })}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Misafir Yüklemesi</span>
              <span className="text-[10px] text-slate-400">Üye olmadan anonim resim yüklenmesine izin ver</span>
            </div>
            <input
              type="checkbox"
              checked={siteSettings.allow_guest_upload}
              onChange={(e) => setSiteSettings({ ...siteSettings, allow_guest_upload: e.target.checked })}
              className="w-4 h-4 rounded bg-[#0B0F19] border-slate-800 text-blue-600"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Yeni Kullanıcı Kaydı</span>
              <span className="text-[10px] text-slate-400">Yeni hesap oluşturulmasına izin ver</span>
            </div>
            <input
              type="checkbox"
              checked={siteSettings.allow_user_registration}
              onChange={(e) => setSiteSettings({ ...siteSettings, allow_user_registration: e.target.checked })}
              className="w-4 h-4 rounded bg-[#0B0F19] border-slate-800 text-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 mt-4 transition-all active:scale-95"
          >
            Ayarları Kaydet
          </button>
        </form>
      )}

      {/* Tab 10: System Health */}
      {activeTab === 'system' && systemHealth && (
        <div className="space-y-6 animate-in fade-in">
          <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 space-y-3 text-xs shadow-xl">
            <h3 className="text-sm font-bold text-white">Sunucu Çalışma Bilgileri</h3>
            <p className="text-slate-300">Uptime: {Math.floor(systemHealth.uptime)} saniye</p>
            <p className="text-slate-300">Cloudinary Durumu: {systemHealth.cloudinary?.message}</p>
          </div>

          <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 space-y-3 text-xs shadow-xl">
            <h3 className="text-sm font-bold text-white">Son Sistem Logları</h3>
            <div className="font-mono text-[11px] bg-[#0B0F19] p-4 rounded-2xl max-h-60 overflow-y-auto space-y-1.5 text-slate-300 border border-slate-800">
              {systemHealth.recent_logs?.map((log: any) => (
                <div key={log.id} className="flex items-center gap-2">
                  <span className="text-slate-500">[{log.timestamp.substring(11, 19)}]</span>
                  <span className={log.level === 'error' ? 'text-rose-400 font-bold' : log.level === 'warn' ? 'text-amber-400' : 'text-blue-400'}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteUserModal.open && deleteUserModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
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
              <strong>{deleteUserModal.user.username}</strong> ({deleteUserModal.user.email}) kullanıcısını ve tüm ilişkili verilerini silmek istediğinize emin misiniz?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteUserModal({ open: false, user: null })}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={deletingUser}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all active:scale-95"
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
