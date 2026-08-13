import React from 'react';
import { User as UserIcon, Shield, Images, Calendar, Mail, HardDrive, Eye, Heart, Crown, Settings, LayoutDashboard, Sparkles, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfilePageProps {
  navigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ navigate }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-slate-400 text-sm">Profilinizi görüntülemek için lütfen giriş yapın.</p>
        <button
          onClick={() => navigate('/giris')}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md"
        >
          Giriş Yap
        </button>
      </div>
    );
  }

  const plan = user.plan || (user.role === 'admin' ? 'admin' : 'free');
  const planLimits = user.plan_limits || {
    name: 'Ücretsiz (Free)',
    daily_upload_limit: 15,
    max_file_size_mb: 10,
    storage_limit_gb: 1,
    ads_enabled: true,
    features: ['15 Günlük Yükleme', '10 MB Maksimum Dosya Boyutu', '1 GB Güvenli Depolama', 'Doğrudan CDN Bağlantıları', 'Temel Klasörleme'],
  };

  const totalBytes = user.stats?.total_bytes ?? user.storage_bytes ?? 0;
  const storageMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const storageGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
  const storageLimitMB = (planLimits.storage_limit_gb || 1) * 1024;
  const storagePercent = Math.min(100, Math.round((totalBytes / ((planLimits.storage_limit_gb || 1) * 1024 * 1024 * 1024)) * 100));
  const todayUploads = user.today_uploads || 0;
  const dailyUploadLimit = planLimits.daily_upload_limit || 15;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-blue-600/20 shrink-0">
            {user.username.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">{user.username}</h1>
              {user.role === 'admin' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold uppercase">
                  Yönetici (Admin)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-bold uppercase">
                  {plan.toUpperCase()} Üye
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" /> {user.email}
            </p>

            <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Üyelik Tarihi:{' '}
              {new Date(user.created_at).toLocaleDateString('tr-TR', { dateStyle: 'long' })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/ayarlar')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Hesap Ayarları
          </button>
          <button
            onClick={() => navigate('/panel')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            Kullanıcı Paneli
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
          <span className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5">
            <Images className="w-4 h-4 text-blue-400" /> Resim Sayısı
          </span>
          <p className="text-2xl font-bold text-white">{user.stats?.total_images || user.image_count || 0}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
          <span className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5">
            <HardDrive className="w-4 h-4 text-indigo-400" /> Kullanılan Alan
          </span>
          <p className="text-2xl font-bold text-white">{storageMB} MB</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
          <span className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5">
            <Eye className="w-4 h-4 text-emerald-400" /> Görüntülenme
          </span>
          <p className="text-2xl font-bold text-white">{(user.stats?.total_views || 0).toLocaleString()}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
          <span className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-400" /> Favoriler
          </span>
          <p className="text-2xl font-bold text-white">{user.stats?.favorite_count || 0}</p>
        </div>
      </div>

      {/* Plan Details & Limits Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{planLimits.name} Detayları</h3>
              <p className="text-xs text-slate-400">Mevcut planınızın sunduğu limitler ve ayrıcalıklar</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/premium')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            Tüm Paketleri İncele
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
            <span className="text-slate-400">Maksimum Dosya Boyutu</span>
            <p className="text-base font-bold text-white">{planLimits.max_file_size_mb} MB / dosya</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-slate-400">
              <span>Günlük Yükleme Limiti</span>
              <span className="text-blue-400 font-bold">{todayUploads} / {dailyUploadLimit}</span>
            </div>
            <p className="text-base font-bold text-white">{planLimits.daily_upload_limit} adet / gün</p>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden mt-1">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(100, Math.round((todayUploads / dailyUploadLimit) * 100))}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-slate-400">
              <span>Toplam Depolama</span>
              <span className="text-indigo-400 font-bold">%{storagePercent}</span>
            </div>
            <p className="text-base font-bold text-white">{storageMB} MB / {planLimits.storage_limit_gb} GB</p>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden mt-1">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-semibold text-slate-300">Plan Özellikleri:</h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
            {planLimits.features.map((feat, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {feat}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
