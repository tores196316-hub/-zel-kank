import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Upload, Images, Eye, Heart, HardDrive, Crown, ArrowUpRight, Plus, Folder, Calendar, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { imageApi } from '../lib/api';
import { UploadResult, Folder as FolderType } from '../types';
import { formatImageUrl } from '../lib/imageUrl';

interface DashboardPageProps {
  navigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  const { user, refreshUser } = useAuth();
  const [images, setImages] = useState<UploadResult[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [imgRes] = await Promise.all([
        imageApi.getMyImages().catch(() => ({ images: [], folders: [] })),
        refreshUser().catch(() => {}),
      ]);
      setImages(imgRes.images || []);
      setFolders(imgRes.folders || []);
    } catch (err) {
      console.error('Dashboard data load error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/giris');
      return;
    }
    loadData();
  }, [user?.id]);

  if (!user) return null;

  const isAdmin = user.role === 'admin' || user.plan === 'admin';
  const planLimits = user.plan_limits || {
    name: isAdmin ? 'Yönetici (Admin)' : 'Ücretsiz (Free)',
    daily_upload_limit: isAdmin ? 9999 : 15,
    max_file_size_mb: isAdmin ? 100 : 10,
    storage_limit_gb: isAdmin ? 500 : 1,
    ads_enabled: !isAdmin,
    features: ['15 Günlük Yükleme', '10 MB Maksimum Dosya Boyutu', '1 GB Güvenli Depolama', 'Doğrudan CDN Bağlantıları', 'Temel Klasörleme'],
  };

  // Calculate live byte storage
  const computedImagesBytes = images.reduce((acc, item) => acc + (item.image?.size || 0), 0);
  const totalBytes = user.stats?.total_bytes !== undefined ? user.stats.total_bytes : computedImagesBytes;
  
  const storageLimitGB = planLimits.storage_limit_gb || (isAdmin ? 500 : 1);
  const storageLimitBytes = storageLimitGB * 1024 * 1024 * 1024;
  const storageLimitMB = storageLimitGB * 1024;

  const formatStorage = (bytes: number) => {
    if (bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const storageUsedFormatted = formatStorage(totalBytes);
  const rawStoragePercent = storageLimitBytes > 0 ? (totalBytes / storageLimitBytes) * 100 : 0;
  
  // Storage UI percentage
  const storagePercentDisplay = totalBytes <= 0
    ? '%0'
    : rawStoragePercent < 0.1
    ? '<%0.1'
    : `%${rawStoragePercent.toFixed(1)}`;
  
  const storagePercentBarWidth = totalBytes > 0
    ? Math.min(100, Math.max(2, rawStoragePercent))
    : 0;

  // Daily Upload calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const computedTodayUploads = images.filter((img) => img.image?.created_at?.startsWith(todayStr)).length;
  const todayUploads = user.today_uploads !== undefined ? user.today_uploads : computedTodayUploads;
  const dailyUploadLimit = planLimits.daily_upload_limit || (isAdmin ? 9999 : 15);
  const isUnlimitedDaily = isAdmin || dailyUploadLimit >= 9999;
  
  const dailyPercent = isUnlimitedDaily
    ? (todayUploads > 0 ? 100 : 0)
    : Math.min(100, Math.round((todayUploads / dailyUploadLimit) * 100));

  const totalImageCount = user.stats?.total_images !== undefined ? user.stats.total_images : images.length;
  const totalViewsCount = user.stats?.total_views !== undefined ? user.stats.total_views : images.reduce((acc, img) => acc + (img.image?.views || 0), 0);
  const favoriteCount = user.stats?.favorite_count !== undefined ? user.stats.favorite_count : images.filter((img) => img.image?.is_favorite).length;

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-950/40 via-[#0F172A] to-indigo-950/30 border border-blue-900/30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Kullanıcı Paneli
            </span>
            <span className="text-xs text-slate-400">
              Kayıt: {new Date(user.created_at).toLocaleDateString('tr-TR')}
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="İstatistikleri Yenile"
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Hoş Geldin, <span className="text-blue-400">{user.username}</span> 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Resimlerini, depolama durumunu ve günlük limitlerini buradan anlık olarak takip edebilirsin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/yukle')}
            className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Hızlı Resim Yükle
          </button>
          {!isAdmin && (
            <button
              onClick={() => navigate('/premium')}
              className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B0F19] hover:bg-slate-800 text-amber-300 text-xs sm:text-sm font-bold border border-amber-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              Planını Yükselt
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Toplam Resim</span>
            <Images className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{totalImageCount}</p>
          <p className="text-xs text-slate-400">{folders.length} klasörde organize edilmiş</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Toplam Görüntülenme</span>
            <Eye className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{totalViewsCount.toLocaleString('tr-TR')}</p>
          <p className="text-xs text-slate-400">Tüm resimlerinizin toplam izlenmesi</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Favori Resimler</span>
            <Heart className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{favoriteCount}</p>
          <p className="text-xs text-slate-400">İşaretlenmiş favori görseller</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Aktif Plan</span>
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white tracking-tight capitalize">{planLimits.name}</p>
          <p className="text-xs text-slate-400">Maks. {planLimits.max_file_size_mb} MB / dosya</p>
        </div>
      </div>

      {/* Gauges & Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Storage Bar */}
        <div className="p-6 rounded-3xl bg-[#0F172A] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Depolama Alanı</h3>
            </div>
            <span className="text-xs font-bold text-blue-400">{storagePercentDisplay} Dolu</span>
          </div>

          <div className="w-full bg-[#0B0F19] rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                rawStoragePercent > 90
                  ? 'bg-rose-500'
                  : rawStoragePercent > 70
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${storagePercentBarWidth}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Kullanılan: <strong className="text-slate-200 font-semibold">{storageUsedFormatted}</strong></span>
            <span>Limit: <strong className="text-slate-200 font-semibold">{storageLimitGB} GB</strong> ({storageLimitMB.toLocaleString('tr-TR')} MB)</span>
          </div>
        </div>

        {/* Daily Upload Limit */}
        <div className="p-6 rounded-3xl bg-[#0F172A] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Günlük Yükleme Limiti</h3>
            </div>
            <span className="text-xs font-bold text-indigo-400">
              {isUnlimitedDaily ? `${todayUploads} resim (Sınırsız)` : `${todayUploads} / ${dailyUploadLimit}`}
            </span>
          </div>

          <div className="w-full bg-[#0B0F19] rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isUnlimitedDaily
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : dailyPercent >= 100
                  ? 'bg-rose-500'
                  : dailyPercent > 80
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: isUnlimitedDaily ? '100%' : `${dailyPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Bugün <strong className="text-slate-200 font-semibold">{todayUploads}</strong> resim yüklendi</span>
            <span>
              {isUnlimitedDaily ? (
                <span className="text-emerald-400 font-semibold">Sınırsız Günlük Hak</span>
              ) : (
                <>Kalan hak: <strong className="text-slate-200 font-semibold">{Math.max(0, dailyUploadLimit - todayUploads)}</strong></>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Uploads Section */}
      <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Son Yüklenen Resimler</h3>
            <p className="text-xs text-slate-400">En son yüklediğiniz görseller</p>
          </div>
          <button
            onClick={() => navigate('/galerim')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            Tüm Galeriyi Gör
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Yükleniyor...</div>
        ) : images.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Images className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">Henüz resim yüklemediniz.</p>
            <button
              onClick={() => navigate('/yukle')}
              className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              İlk Resmini Yükle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {images.slice(0, 6).map((item) => (
              <div
                key={item.image.id}
                onClick={() => navigate(`/i/${item.image.id}`)}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-[#0B0F19] border border-slate-800 cursor-pointer hover:border-blue-500/50 transition-all shadow-md"
              >
                <img
                  src={formatImageUrl(item.thumbnail_url || item.direct_url)}
                  alt={item.image.original_filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                  <p className="text-[11px] text-white font-medium truncate">{item.image.original_filename}</p>
                  <p className="text-[9px] text-slate-400">{((item.image.size || 0) / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

