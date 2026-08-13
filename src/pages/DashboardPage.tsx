import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Upload, Images, Eye, Heart, HardDrive, Crown, ArrowUpRight, Plus, Folder, Calendar, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { imageApi, authApi } from '../lib/api';
import { UploadResult, Folder as FolderType } from '../types';

interface DashboardPageProps {
  navigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [images, setImages] = useState<UploadResult[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/giris');
      return;
    }

    imageApi.getMyImages()
      .then((res) => {
        setImages(res.images || []);
        setFolders(res.folders || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const planName = user.plan || (user.role === 'admin' ? 'admin' : 'free');
  const planLimits = user.plan_limits || {
    name: 'Ücretsiz (Free)',
    daily_upload_limit: 15,
    max_file_size_mb: 10,
    storage_limit_gb: 1,
    ads_enabled: true,
    features: ['15 Günlük Yükleme', '10 MB Maksimum Dosya Boyutu', '1 GB Güvenli Depolama', 'Doğrudan CDN Bağlantıları', 'Temel Klasörleme'],
  };

  const totalBytes = user.stats?.total_bytes ?? user.storage_bytes ?? 0;
  const storageUsedMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const storageLimitMB = (planLimits.storage_limit_gb || 1) * 1024;
  const storagePercent = Math.min(100, Math.round((totalBytes / ((planLimits.storage_limit_gb || 1) * 1024 * 1024 * 1024)) * 100));

  const todayUploads = user.today_uploads || 0;
  const dailyUploadLimit = planLimits.daily_upload_limit || 15;
  const dailyPercent = Math.min(100, Math.round((todayUploads / dailyUploadLimit) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/40 border border-blue-900/40 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Kullanıcı Paneli
            </span>
            <span className="text-xs text-slate-400">
              Kayıt: {new Date(user.created_at).toLocaleDateString('tr-TR')}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Hoş Geldin, <span className="text-blue-400">{user.username}</span> 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Resimlerini, depolama durumunu ve günlük limitlerini buradan kolayca yönetebilirsin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/yukle')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Hızlı Resim Yükle
          </button>
          <button
            onClick={() => navigate('/premium')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-sm font-medium border border-amber-500/20 transition-all"
          >
            <Crown className="w-4 h-4 text-amber-400" />
            Planını Yükselt
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Toplam Resim</span>
            <Images className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{user.stats?.total_images || images.length}</p>
          <p className="text-xs text-slate-500">{folders.length} klasörde organize edilmiş</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Toplam Görüntülenme</span>
            <Eye className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{(user.stats?.total_views || 0).toLocaleString()}</p>
          <p className="text-xs text-slate-500">Tüm resimlerinizin toplam izlenmesi</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Favori Resimler</span>
            <Heart className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{user.stats?.favorite_count || 0}</p>
          <p className="text-xs text-slate-500">İşaretlenmiş favori görseller</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Aktif Plan</span>
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight capitalize">{planLimits.name}</p>
          <p className="text-xs text-slate-500">Maks. {planLimits.max_file_size_mb} MB / dosya</p>
        </div>
      </div>

      {/* Gauges & Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Storage Bar */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Depolama Alanı</h3>
            </div>
            <span className="text-xs font-bold text-blue-400">%{storagePercent} Dolu</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                storagePercent > 90
                  ? 'bg-rose-500'
                  : storagePercent > 70
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-400">
            <span>Kullanılan: {storageUsedMB} MB</span>
            <span>Limit: {planLimits.storage_limit_gb} GB ({storageLimitMB} MB)</span>
          </div>
        </div>

        {/* Daily Upload Limit */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Günlük Yükleme Limiti</h3>
            </div>
            <span className="text-xs font-bold text-indigo-400">{todayUploads} / {dailyUploadLimit}</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${dailyPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-400">
            <span>Bugün {todayUploads} resim yüklendi</span>
            <span>Kalan hak: {Math.max(0, dailyUploadLimit - todayUploads)}</span>
          </div>
        </div>
      </div>

      {/* Recent Uploads Section */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Son Yüklenen Resimler</h3>
            <p className="text-xs text-slate-400">En son yüklediğiniz görseller</p>
          </div>
          <button
            onClick={() => navigate('/galerim')}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
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
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              İlk Resmini Yükle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {images.slice(0, 6).map((item) => (
              <div
                key={item.image.id}
                onClick={() => navigate(`/i/${item.image.id}`)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer hover:border-blue-500/50 transition-all"
              >
                <img
                  src={item.thumbnail_url || item.direct_url}
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
