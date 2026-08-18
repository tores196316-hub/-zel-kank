import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Crown,
  Sparkles,
  Heart,
  Eye,
  ExternalLink,
  Calendar,
  Share2,
  QrCode,
  ArrowLeft,
  Shield,
  Layers,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import { publicApi, imageApi } from '../lib/api';
import { PublicCreatorProfile, ImageMetadata } from '../types';
import { useAuth } from '../context/AuthContext';

interface CreatorProfilePageProps {
  username: string;
  navigate: (path: string) => void;
}

export const CreatorProfilePage: React.FC<CreatorProfilePageProps> = ({ username, navigate }) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicCreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    publicApi
      .getCreatorProfile(username)
      .then((data) => {
        if (isMounted) {
          setProfile(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Yaratıcı profili bulunamadı.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [username]);

  const handleShareProfile = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const isOwnProfile = currentUser && profile && currentUser.username.toLowerCase() === profile.user.username.toLowerCase();

  const filteredImages = profile?.images.filter((img) => {
    if (selectedFormat === 'all') return true;
    return img.format.toLowerCase() === selectedFormat.toLowerCase();
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
          <p className="text-slate-400 text-sm">Yaratıcı profili yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-5">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <UserIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Profil Bulunamadı</h2>
          <p className="text-sm text-slate-400">{error || 'İstenen kullanıcı bulunamadı veya hesabı kapatılmış.'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/kesfet')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              Keşfet'e Dön
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-all"
            >
              Ana Sayfa
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { user, stats, images } = profile;
  const isVip = user.plan === 'vip' || user.plan === 'admin';
  const isPremium = user.plan === 'premium' || isVip;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate('/kesfet')}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Keşfet'e Geri Dön</span>
        </button>
      </div>

      {/* Profile Header Hero Card */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-slate-800/80 p-6 sm:p-10 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Avatar & Main Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 border-2 border-cyan-400/40 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-cyan-500/10">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* VIP / Pro Badge on Avatar */}
                {isVip && (
                  <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-lg border border-amber-300">
                    <Crown className="w-3 h-3" />
                    <span>VIP</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    @{user.username}
                  </h1>

                  {user.role === 'admin' ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold">
                      Yönetici
                    </span>
                  ) : isVip ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" /> VIP İçerik Üretici
                    </span>
                  ) : isPremium ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold">
                      Pro Üye
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-xs">
                      Üye
                    </span>
                  )}
                </div>

                {user.bio ? (
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {user.bio}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Bu yaratıcı henüz bir biyografi eklemedi.
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Katılım: {new Date(user.created_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Share & QR Code */}
            <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
              {/* Share & QR Code */}
              <button
                onClick={handleShareProfile}
                className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Kopyalandı!' : 'Profili Paylaş'}</span>
              </button>

              <button
                onClick={() => setShowQrModal(true)}
                title="Mobil QR Kod"
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
              >
                <QrCode className="w-4 h-4" />
              </button>

              {isOwnProfile && (
                <button
                  onClick={() => navigate('/ayarlar')}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all"
                >
                  Profili Düzenle
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <div className="text-xl sm:text-2xl font-black text-white">{stats.total_public_images}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Herkese Açık Resim</div>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <div className="text-xl sm:text-2xl font-black text-cyan-400">{stats.total_views}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Toplam Görüntülenme</div>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <div className="text-xl sm:text-2xl font-black text-rose-400">{stats.total_likes}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Toplam Beğeni</div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Gallery Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Herkese Açık Portfolyo</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {filteredImages.length}
            </span>
          </div>

          {/* Format Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 self-start">
            {['all', 'jpg', 'png', 'webp', 'gif'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1 rounded-lg text-xs uppercase font-medium transition-all ${
                  selectedFormat === fmt
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {fmt === 'all' ? 'Tümü' : fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredImages.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 max-w-md mx-auto space-y-3">
            <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">Henüz Açık Resim Yok</h3>
            <p className="text-xs text-slate-500">
              Bu kullanıcı henüz herkese açık bir portfolyo resmi paylaşmadı.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredImages.map((img) => (
              <div
                key={img.id}
                onClick={() => navigate(`/i/${img.id}`)}
                className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 overflow-hidden shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="relative w-full aspect-[4/3] bg-slate-950 overflow-hidden">
                  <img
                    src={img.cloudinary_url}
                    alt={img.original_filename}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] uppercase font-bold text-slate-300 border border-white/10">
                    {img.format}
                  </div>

                  {img.protect_copy && (
                    <div className="absolute top-2.5 right-2.5 p-1 rounded-md bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-400">
                      <Shield className="w-3 h-3" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3.5 flex flex-col justify-end">
                    <p className="text-xs font-semibold text-white truncate drop-shadow">
                      {img.original_filename}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        {img.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        {img.likes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-400" />
                @{user.username} Portfolyo QR Kodu
              </span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  window.location.href
                )}&color=070b14`}
                alt="Profile QR Code"
                className="w-44 h-44"
              />
            </div>

            <p className="text-xs text-slate-400">
              Telefon kameranızla okutarak bu portfolyoya doğrudan erişebilirsiniz.
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
