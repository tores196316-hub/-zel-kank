import React, { useEffect, useState } from 'react';
import {
  Shield, Users, Images, Flag, Bell, Settings, Activity, Trash2, Ban, CheckCircle, RefreshCw, AlertTriangle, HardDrive, Eye, Server, Radio
} from 'lucide-react';
import { adminApi } from '../lib/api';
import { AdminStats, Announcement, ImageMetadata, Report, SiteSettings, User } from '../types';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

interface AdminPageProps {
  navigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'images' | 'reports' | 'announcements' | 'settings' | 'system'>('dashboard');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [imagesList, setImagesList] = useState<ImageMetadata[]>([]);
  const [reportsList, setReportsList] = useState<Report[]>([]);
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  // New announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState('info');

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, uRes, iRes, rRes, aRes, stRes, hRes] = await Promise.all([
        adminApi.getStats().catch(() => null),
        adminApi.getUsers().catch(() => ({ users: [] })),
        adminApi.getImages().catch(() => ({ images: [] })),
        adminApi.getReports().catch(() => ({ reports: [] })),
        adminApi.getAnnouncements().catch(() => ({ announcements: [] })),
        adminApi.getSettings().catch(() => ({ settings: null })),
        adminApi.getHealth().catch(() => null),
      ]);

      if (sRes) setStats(sRes);
      setUsersList(uRes.users);
      setImagesList(iRes.images);
      setReportsList(rRes.reports);
      setAnnouncementsList(aRes.announcements);
      if (stRes.settings) setSiteSettings(stRes.settings);
      if (hRes) setSystemHealth(hRes);
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
        <p className="text-slate-400 text-xs">Bu alana erişim için yetkiniz bulunmamaktadır.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs"
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

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Bu resmi kaldırmak istediğinize emin misiniz?')) return;
    try {
      await adminApi.deleteImage(imageId);
      showToast('Resim silindi.', 'success');
      setImagesList((prev) => prev.filter((i) => i.id !== imageId));
    } catch (err: any) {
      showToast(err.message || 'Resim silinemedi.', 'error');
    }
  };

  const handleReportAction = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    try {
      await adminApi.updateReportStatus(reportId, status);
      showToast(`Rapor "${status === 'reviewed' ? 'İncelendi' : 'Kapatıldı'}" olarak işaretlendi.`, 'success');
      setReportsList((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
    } catch (err: any) {
      showToast(err.message || 'Rapor güncellenemedi.', 'error');
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
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Yönetim Paneli</h1>
            <p className="text-xs text-slate-400">Sistem istatistikleri, kullanıcılar, resimler ve site yapılandırması</p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Verileri Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'users', label: 'Kullanıcılar', icon: Users },
          { id: 'images', label: 'Resimler', icon: Images },
          { id: 'reports', label: 'Raporlar', icon: Flag },
          { id: 'announcements', label: 'Duyurular', icon: Bell },
          { id: 'settings', label: 'Site Ayarları', icon: Settings },
          { id: 'system', label: 'Sistem Durumu', icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Dashboard */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6 animate-in fade-in">
          {/* Cloudinary Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
              stats.cloudinary_connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Cloudinary Durumu: {stats.cloudinary_cloud_name}</span>
            </div>
            <span>{stats.cloudinary_connected ? '● Bağlı & Aktif' : ' Yerel Yerel Depolama Modu'}</span>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl space-y-1">
              <span className="text-xl font-extrabold text-white block">{stats.total_users}</span>
              <span className="text-[11px] text-slate-400 font-medium">Toplam Kullanıcı</span>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl space-y-1">
              <span className="text-xl font-extrabold text-blue-400 block">{stats.total_images}</span>
              <span className="text-[11px] text-slate-400 font-medium">Toplam Resim</span>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl space-y-1">
              <span className="text-xl font-extrabold text-emerald-400 block">{stats.today_images ?? 0}</span>
              <span className="text-[11px] text-slate-400 font-medium">Bugün Yüklenen</span>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl space-y-1">
              <span className="text-xl font-extrabold text-indigo-400 block">{stats.today_users ?? 0}</span>
              <span className="text-[11px] text-slate-400 font-medium">Bugün Kaydolan</span>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl space-y-1">
              <span className="text-xl font-extrabold text-purple-400 block">{formatSize(stats.total_storage_bytes)}</span>
              <span className="text-[11px] text-slate-400 font-medium">Depolama Alanı</span>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl space-y-1">
              <span className="text-xl font-extrabold text-amber-400 block">{stats.total_views}</span>
              <span className="text-[11px] text-slate-400 font-medium">Görüntüleme</span>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl space-y-1">
              <span className="text-xl font-extrabold text-rose-400 block">{stats.total_reports}</span>
              <span className="text-[11px] text-slate-400 font-medium">Bekleyen Rapor</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Users */}
      {activeTab === 'users' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700/60">
                <tr>
                  <th className="p-4">Kullanıcı</th>
                  <th className="p-4">E-Posta</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">Resim Sayısı</th>
                  <th className="p-4">Kayıt Tarihi</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-semibold text-white">{u.username}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 font-mono">{u.image_count || 0}</td>
                    <td className="p-4 font-mono">{new Date(u.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {u.status === 'active' ? 'Aktif' : 'Askıda'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleUserStatusToggle(u.id, u.status)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                            u.status === 'active'
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {u.status === 'active' ? 'Engelle' : 'Engel Kaldır'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Images */}
      {activeTab === 'images' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-white">Tüm Resimler ({imagesList.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {imagesList.map((img) => (
              <div key={img.id} className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700/60 p-1 flex flex-col">
                <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden relative flex items-center justify-center">
                  <img src={img.cloudinary_url} alt={img.original_filename} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => navigate(`/i/${img.id}`)}
                      className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-500"
                      title="Görüntüle"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="p-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-500"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-2 text-[10px] space-y-0.5">
                  <p className="font-semibold text-slate-200 truncate">{img.original_filename}</p>
                  <p className="text-slate-400">{img.uploader_username || 'Misafir'} • {formatSize(img.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Reports */}
      {activeTab === 'reports' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4 animate-in fade-in">
          <h3 className="text-sm font-bold text-white">Gelen Şikayet Raporları</h3>
          {reportsList.length === 0 ? (
            <p className="text-xs text-slate-400">Henüz bildirilmiş bir şikayet bulunmuyor.</p>
          ) : (
            <div className="space-y-3">
              {reportsList.map((rep) => (
                <div key={rep.id} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">Neden: {rep.reason}</p>
                    <p className="text-slate-400 text-[11px]">Resim ID: {rep.image_id} • IP: {rep.ip} • Tarih: {new Date(rep.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/i/${rep.image_id}`)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-semibold"
                    >
                      Resmi Gör
                    </button>
                    {rep.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReportAction(rep.id, 'reviewed')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-semibold"
                        >
                          İnceledim
                        </button>
                        <button
                          onClick={() => handleReportAction(rep.id, 'dismissed')}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          Kapat
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-6 animate-in fade-in">
          {/* New Announcement Form */}
          <form onSubmit={handleCreateAnnouncement} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Yeni Duyuru Ekle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                required
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Duyuru Başlığı"
                className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
              />
              <select
                value={annType}
                onChange={(e) => setAnnType(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
              >
                <option value="info">Bilgi (Info)</option>
                <option value="warning">Uyarı (Warning)</option>
                <option value="success">Başarı (Success)</option>
              </select>
              <button
                type="submit"
                className="py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
              >
                Yayınla
              </button>
            </div>
            <textarea
              required
              rows={2}
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Duyuru Metni..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </form>

          {/* List of Announcements */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white">Yayındaki Duyurular</h3>
            {announcementsList.map((ann) => (
              <div key={ann.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-xs">
                <div>
                  <span className="font-bold text-white block">{ann.title}</span>
                  <span className="text-slate-300">{ann.content}</span>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Settings */}
      {activeTab === 'settings' && siteSettings && (
        <form onSubmit={handleUpdateSettings} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4 max-w-xl animate-in fade-in">
          <h3 className="text-sm font-bold text-white">Genel Site Ayarları</h3>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Site Başlığı</label>
            <input
              type="text"
              value={siteSettings.site_title}
              onChange={(e) => setSiteSettings({ ...siteSettings, site_title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Maksimum Dosya Boyutu (MB)</label>
            <input
              type="number"
              value={siteSettings.max_file_size_mb}
              onChange={(e) => setSiteSettings({ ...siteSettings, max_file_size_mb: parseInt(e.target.value, 10) || 20 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-slate-300">Misafir Resim Yüklemesi</span>
            <input
              type="checkbox"
              checked={siteSettings.allow_guest_upload}
              onChange={(e) => setSiteSettings({ ...siteSettings, allow_guest_upload: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-slate-300">Yeni Kullanıcı Kaydı</span>
            <input
              type="checkbox"
              checked={siteSettings.allow_user_registration}
              onChange={(e) => setSiteSettings({ ...siteSettings, allow_user_registration: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md mt-4"
          >
            Ayarları Kaydet
          </button>
        </form>
      )}

      {/* Tab 7: System */}
      {activeTab === 'system' && systemHealth && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white">Sunucu Çalışma Bilgileri</h3>
            <p className="text-slate-300">Çalışma Süresi (Uptime): {Math.floor(systemHealth.uptime)} saniye</p>
            <p className="text-slate-300">Cloudinary Mesajı: {systemHealth.cloudinary?.message}</p>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white">Son Sistem Logları</h3>
            <div className="font-mono text-[11px] bg-slate-950 p-4 rounded-xl max-h-60 overflow-y-auto space-y-1 text-slate-300">
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
    </div>
  );
};
