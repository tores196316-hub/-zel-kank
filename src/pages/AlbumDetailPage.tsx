import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  Lock,
  Globe,
  EyeOff,
  Clock,
  LayoutGrid,
  Sparkles,
  Download,
  Share2,
  Settings,
  Plus,
  ArrowUpDown,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Play,
  Pause,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Eye,
  Calendar,
  User as UserIcon,
  Shield,
  Layers,
  Columns,
  RefreshCw,
  QrCode,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Album, AlbumImageItem } from '../types';
import { albumApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { EditAlbumModal } from '../components/EditAlbumModal';
import { AddImagesToAlbumModal } from '../components/AddImagesToAlbumModal';
import { exportImagesToZip, ZipExportProgress } from '../lib/zipExport';
import { formatImageUrl } from '../lib/imageUrl';

interface AlbumDetailPageProps {
  albumKey?: string;
  navigate?: (path: string) => void;
}

export const AlbumDetailPage: React.FC<AlbumDetailPageProps> = ({
  albumKey: propAlbumKey,
  navigate: propNavigate,
}) => {
  const getPathKey = () => {
    const path = window.location.pathname;
    if (path.startsWith('/a/')) return path.replace('/a/', '').split('/')[0];
    if (path.startsWith('/album/')) return path.replace('/album/', '').split('/')[0];
    return '';
  };

  const albumKey = propAlbumKey || getPathKey();

  const navigate = (to: string) => {
    if (propNavigate) {
      propNavigate(to);
    } else {
      window.history.pushState({}, '', to);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [albumData, setAlbumData] = useState<{
    is_locked: boolean;
    is_password_protected: boolean;
    is_owner?: boolean;
    is_admin?: boolean;
    is_expired?: boolean;
    album: Album;
  } | null>(null);

  // Password Unlock State
  const [passwordInput, setPasswordInput] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [cachedUnlockToken, setCachedUnlockToken] = useState<string | null>(() => {
    return localStorage.getItem(`album_token_${albumKey}`) || null;
  });

  // View Mode & Controls
  const [activeViewMode, setActiveViewMode] = useState<'grid' | 'masonry' | 'slideshow' | 'modern'>('grid');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddImagesOpen, setIsAddImagesOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedImages, setReorderedImages] = useState<AlbumImageItem[]>([]);

  // Slideshow State
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const slideshowTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // ZIP Export Progress
  const [zipProgress, setZipProgress] = useState<ZipExportProgress | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Share link copy feedback
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState<string | null>(null);

  useEffect(() => {
    if (albumKey) {
      fetchAlbum(cachedUnlockToken || undefined);
    }
  }, [albumKey]);

  // Handle Slideshow Autoplay
  useEffect(() => {
    if (activeViewMode === 'slideshow' && isPlaying && albumData?.album?.images?.length) {
      slideshowTimerRef.current = setInterval(() => {
        setSlideshowIndex((prev) => (prev + 1) % albumData.album.images!.length);
      }, 3500);
    } else {
      if (slideshowTimerRef.current) clearInterval(slideshowTimerRef.current);
    }
    return () => {
      if (slideshowTimerRef.current) clearInterval(slideshowTimerRef.current);
    };
  }, [activeViewMode, isPlaying, albumData?.album?.images]);

  const fetchAlbum = async (token?: string) => {
    try {
      setLoading(true);
      const res = await albumApi.getAlbum(albumKey!, token);
      setAlbumData(res);
      if (res.album?.view_mode) {
        setActiveViewMode(res.album.view_mode);
      }
      if (res.album?.images) {
        setReorderedImages(res.album.images);
      }
    } catch (err: any) {
      if (err.status === 410 || err.message?.includes('süresi sona')) {
        setAlbumData({
          is_locked: false,
          is_password_protected: false,
          is_expired: true,
          album: {
            id: albumKey!,
            share_id: albumKey!,
            title: 'Süresi Dolmuş Albüm',
            views: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            image_ids: [],
            privacy: 'public',
            view_mode: 'grid',
            user_id: '',
            creator_username: '',
          },
        });
      } else {
        showToast(err.message || 'Albüm yüklenemedi.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setUnlockError('Lütfen parolayı girin.');
      return;
    }

    try {
      setUnlocking(true);
      setUnlockError(null);
      const res = await albumApi.unlockAlbum(albumKey!, passwordInput.trim());
      if (res.unlocked && res.unlock_token) {
        localStorage.setItem(`album_token_${albumKey}`, res.unlock_token);
        setCachedUnlockToken(res.unlock_token);
        setAlbumData({
          is_locked: false,
          is_password_protected: true,
          is_owner: false,
          is_admin: user?.role === 'admin',
          album: res.album,
        });
        if (res.album.view_mode) setActiveViewMode(res.album.view_mode);
        if (res.album.images) setReorderedImages(res.album.images);
        showToast('Kilit başarıyla açıldı!', 'success');
      }
    } catch (err: any) {
      setUnlockError(err.message || 'Hatalı parola! Lütfen tekrar deneyin.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleZipDownload = async () => {
    if (!albumData?.album?.images || albumData.album.images.length === 0) {
      showToast('İndirilecek resim bulunmuyor.', 'error');
      return;
    }

    try {
      setIsZipping(true);
      const items = albumData.album.images.map((item) => ({
        url: formatImageUrl(item.direct_url),
        filename: item.image.original_filename,
      }));

      const zipName = `${albumData.album.title.replace(/[^a-zA-Z0-9_\-\u00C0-\u017F]/g, '_')}_IMGIVO.zip`;
      await exportImagesToZip(items, zipName, (progress) => {
        setZipProgress(progress);
      });
      showToast('Tüm albüm ZIP olarak başarıyla indirildi!', 'success');
    } catch (err: any) {
      showToast('ZIP indirilirken bir sorun oluştu.', 'error');
    } finally {
      setIsZipping(false);
      setZipProgress(null);
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    if (
      !window.confirm(
        'Bu görseli albümden çıkarmak istediğinize emin misiniz?\n\n(Not: Orijinal görsel galerinizden SİLİNMEZ, sadece bu albümden çıkarılır.)'
      )
    ) {
      return;
    }

    try {
      await albumApi.removeImage(albumData!.album.id, imageId);
      showToast('Görsel albümden çıkarıldı.', 'success');
      fetchAlbum(cachedUnlockToken || undefined);
    } catch (err: any) {
      showToast(err.message || 'Görsel çıkarılamadı.', 'error');
    }
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= reorderedImages.length) return;
    const updated = [...reorderedImages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setReorderedImages(updated);
  };

  const handleSaveReorder = async () => {
    try {
      const ids = reorderedImages.map((i) => i.image.id);
      await albumApi.reorderImages(albumData!.album.id, ids);
      showToast('Yeni sıralama kaydedildi!', 'success');
      setIsReorderMode(false);
      fetchAlbum(cachedUnlockToken || undefined);
    } catch (err: any) {
      showToast(err.message || 'Sıralama kaydedilemedi.', 'error');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} panoya kopyalandı!`, 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold">Albüm yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!albumData) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <Folder className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Albüm Bulunamadı</h2>
          <p className="text-xs text-slate-400">
            Aradığınız albüm mevcut değil, silinmiş veya erişim izniniz bulunmuyor olabilir.
          </p>
          <button
            onClick={() => navigate('/galerim')}
            className="inline-block px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Galerime Dön
          </button>
        </div>
      </div>
    );
  }

  // 1. EXPIRED ALBUM SCREEN
  if (albumData.is_expired) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-white">Paylaşım Süresi Sona Erdi</h2>
          <p className="text-xs text-slate-300">
            Bu albüm için tanımlanan zaman sınırlı erişim süresi dolmuştur.
          </p>
          <div className="bg-[#0B0F19] p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            Albüm sahibiyseniz, albüm ayarlarına panelinizden ulaşarak süreyi uzatabilir veya süresiz yapabilirsiniz.
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-block px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  // 2. PASSWORD LOCKED SCREEN
  if (albumData.is_locked) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg shadow-amber-500/5">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-white">{albumData.album.title}</h2>
            <p className="text-xs text-slate-400">
              Bu albüm parola ile korunmaktadır. İçeriği görüntülemek için lütfen şifreyi girin.
            </p>
          </div>

          {albumData.album.cover_image_url && (
            <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden border border-slate-800 shadow-md">
              <img
                src={formatImageUrl(albumData.album.cover_image_url)}
                alt="Albüm Kapağı"
                className="w-full h-full object-cover blur-sm scale-110 opacity-70"
              />
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Albüm Parolası</label>
              <input
                type="password"
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Parolayı buraya girin..."
                className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
              />
              {unlockError && <p className="text-[11px] text-rose-400 font-semibold">{unlockError}</p>}
            </div>

            <button
              type="submit"
              disabled={unlocking}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{unlocking ? 'Doğrulanıyor...' : 'Albümün Kilidini Aç'}</span>
            </button>
          </form>

          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-2 border-t border-slate-800/80">
            <Shield className="w-3 h-3 text-slate-400" />
            <span>IMGIVO Güvenli Koleksiyon Doğrulaması</span>
          </div>
        </div>
      </div>
    );
  }

  const { album, is_owner, is_admin } = albumData;
  const canManage = is_owner || is_admin;
  const currentImages = isReorderMode ? reorderedImages : (album.images || []);

  const shareUrl = `${window.location.origin}/a/${album.share_id}`;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 pb-20">
      {/* Background Subtle Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/galeri')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Galerime Dön</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            {album.privacy === 'public' && (
              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold flex items-center gap-1">
                <Globe className="w-3 h-3" /> Herkese Açık
              </span>
            )}
            {album.privacy === 'unlisted' && (
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> Liste Dışı
              </span>
            )}
            {album.privacy === 'private' && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Özel
              </span>
            )}
            {album.is_password_protected && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Şifreli
              </span>
            )}
          </div>
        </div>

        {/* Album Header Banner Card */}
        <div className="bg-[#0F172A]/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Title & Metadata */}
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    {album.title}
                  </h1>
                </div>
              </div>

              {album.description && (
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {album.description}
                </p>
              )}

              {/* Meta Chips */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>@{album.creator_username || 'Kullanıcı'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{currentImages.length} Görsel</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{album.views || 0} Görüntülenme</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(album.created_at).toLocaleDateString('tr-TR')}</span>
                </span>
                {album.expires_at && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Sonlanma: {new Date(album.expires_at).toLocaleString('tr-TR')}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#0B0F19] border border-slate-700/80 hover:border-blue-500 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Paylaş</span>
              </button>

              <button
                onClick={handleZipDownload}
                disabled={isZipping || currentImages.length === 0}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 active:scale-95 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isZipping ? `İndiriliyor (${zipProgress?.percent || 0}%)` : 'Toplu ZIP İndir'}</span>
              </button>

              {canManage && (
                <>
                  <button
                    onClick={() => setIsAddImagesOpen(true)}
                    className="p-2.5 rounded-xl bg-[#0B0F19] border border-slate-700/80 hover:border-cyan-500 text-cyan-400 hover:text-cyan-300 transition-all active:scale-95"
                    title="Görsel Ekle"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsReorderMode(!isReorderMode)}
                    className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                      isReorderMode
                        ? 'bg-amber-600 border-amber-500 text-white'
                        : 'bg-[#0B0F19] border-slate-700/80 hover:border-amber-500 text-amber-400'
                    }`}
                    title="Sıralamayı Değiştir"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsStatsOpen(!isStatsOpen)}
                    className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                      isStatsOpen
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-[#0B0F19] border-slate-700/80 hover:border-emerald-500 text-emerald-400'
                    }`}
                    title="İstatistikler"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-2.5 rounded-xl bg-[#0B0F19] border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white transition-all active:scale-95"
                    title="Albüm Ayarları"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Reorder Mode Banner */}
          {isReorderMode && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-amber-400" />
                <span>Görsellerin sırasını ok butonları ile düzenleyip ardından kaydedebilirsiniz.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setReorderedImages(album.images || []);
                    setIsReorderMode(false);
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveReorder}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow"
                >
                  Sıralamayı Kaydet
                </button>
              </div>
            </div>
          )}

          {/* Stats Drawer */}
          {isStatsOpen && album.stats && (
            <div className="mt-4 p-4 bg-[#0B0F19] border border-slate-800 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-[#0F172A] rounded-xl border border-slate-800/80">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Toplam İzlenme</p>
                <p className="text-lg font-black text-white mt-1">{album.stats.total_views}</p>
              </div>
              <div className="p-3 bg-[#0F172A] rounded-xl border border-slate-800/80">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Son 24 Saat</p>
                <p className="text-lg font-black text-cyan-400 mt-1">{album.stats.views_24h}</p>
              </div>
              <div className="p-3 bg-[#0F172A] rounded-xl border border-slate-800/80">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Son 7 Gün</p>
                <p className="text-lg font-black text-blue-400 mt-1">{album.stats.views_7d}</p>
              </div>
              <div className="p-3 bg-[#0F172A] rounded-xl border border-slate-800/80">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">En Çok Bakılan</p>
                <p className="text-xs font-bold text-emerald-400 mt-1.5 truncate">
                  {album.stats.top_image ? `${album.stats.top_image.views} kez` : '-'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* View Mode Switcher Toolbar */}
        <div className="flex items-center justify-between gap-4 bg-[#0F172A]/70 border border-slate-800/80 px-4 py-3 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 hidden sm:inline mr-2">Görünüm:</span>
            <button
              onClick={() => setActiveViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeViewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Izgara</span>
            </button>
            <button
              onClick={() => setActiveViewMode('masonry')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeViewMode === 'masonry'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Masonry</span>
            </button>
            <button
              onClick={() => setActiveViewMode('slideshow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeViewMode === 'slideshow'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Slayt Gösterisi</span>
            </button>
            <button
              onClick={() => setActiveViewMode('modern')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeViewMode === 'modern'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vitrin</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-semibold">
            {currentImages.length} / {currentImages.length} Görsel
          </div>
        </div>

        {/* ================= VIEW MODES RENDERING ================= */}

        {currentImages.length === 0 ? (
          <div className="bg-[#0F172A]/50 border border-slate-800/80 rounded-3xl p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto border border-slate-700/50">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">Bu albümde henüz görsel bulunmuyor</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Galerinizdeki mevcut resimlerden seçerek bu albüme anında görsel ekleyebilirsiniz.
            </p>
            {canManage && (
              <button
                onClick={() => setIsAddImagesOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 inline-flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Görsel Ekle</span>
              </button>
            )}
          </div>
        ) : activeViewMode === 'slideshow' ? (
          /* 1. SLIDESHOW / CAROUSEL VIEW */
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl">
            <div className="relative aspect-video max-h-[70vh] rounded-2xl overflow-hidden bg-black/80 flex items-center justify-center border border-slate-800">
              <img
                src={formatImageUrl(currentImages[slideshowIndex].direct_url)}
                alt={currentImages[slideshowIndex].image.original_filename}
                className="max-w-full max-h-full object-contain cursor-pointer transition-all duration-300"
                onClick={() => setLightboxIndex(slideshowIndex)}
              />

              {/* Prev / Next Nav Buttons */}
              <button
                onClick={() =>
                  setSlideshowIndex((prev) => (prev === 0 ? currentImages.length - 1 : prev - 1))
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white border border-slate-700/80 backdrop-blur shadow-lg transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() =>
                  setSlideshowIndex((prev) => (prev === currentImages.length - 1 ? 0 : prev + 1))
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white border border-slate-700/80 backdrop-blur shadow-lg transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Slide Bottom Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex items-center justify-between text-white">
                <div>
                  <p className="text-sm font-bold truncate">
                    {currentImages[slideshowIndex].image.original_filename}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {currentImages[slideshowIndex].image.width} × {currentImages[slideshowIndex].image.height} px
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Durdur' : 'Otomatik Oynat'}</span>
                  </button>

                  <button
                    onClick={() => setLightboxIndex(slideshowIndex)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white"
                    title="Tam Ekran"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex items-center gap-2 overflow-x-auto p-2 scrollbar-thin">
              {currentImages.map((item, idx) => (
                <button
                  key={item.image.id}
                  onClick={() => setSlideshowIndex(idx)}
                  className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    slideshowIndex === idx
                      ? 'border-blue-500 ring-2 ring-blue-500/40 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={formatImageUrl(item.thumbnail_url || item.direct_url)}
                    alt={item.image.original_filename}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : activeViewMode === 'modern' ? (
          /* 2. MODERN SHOWCASE VIEW */
          <div className="space-y-4">
            {/* Main Showcase Hero */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-4 sm:p-6 relative overflow-hidden">
              <div className="aspect-[16/9] max-h-[60vh] rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center border border-slate-800/80">
                <img
                  src={formatImageUrl(currentImages[slideshowIndex].direct_url)}
                  alt={currentImages[slideshowIndex].image.original_filename}
                  className="max-w-full max-h-full object-contain cursor-pointer"
                  onClick={() => setLightboxIndex(slideshowIndex)}
                />
              </div>
              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {currentImages[slideshowIndex].image.original_filename}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Görsel {slideshowIndex + 1} / {currentImages.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={formatImageUrl(currentImages[slideshowIndex].direct_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Orijinal</span>
                  </a>
                  <button
                    onClick={() => setLightboxIndex(slideshowIndex)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1 shadow"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Büyüt</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {currentImages.map((item, idx) => (
                <div
                  key={item.image.id}
                  onClick={() => setSlideshowIndex(idx)}
                  className={`group relative aspect-square rounded-2xl overflow-hidden border cursor-pointer transition-all ${
                    slideshowIndex === idx
                      ? 'border-blue-500 ring-2 ring-blue-500/40'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={formatImageUrl(item.thumbnail_url || item.direct_url)}
                    alt={item.image.original_filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                    <p className="text-[10px] text-white font-bold truncate">
                      {item.image.original_filename}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeViewMode === 'masonry' ? (
          /* 3. MASONRY (Pinterest) VIEW */
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
            {currentImages.map((item, idx) => (
              <div
                key={item.image.id}
                className="break-inside-avoid bg-[#0F172A] border border-slate-800/80 rounded-2xl overflow-hidden group hover:border-slate-700 transition-all duration-300 relative shadow-md"
              >
                <img
                  src={formatImageUrl(item.thumbnail_url || item.direct_url)}
                  alt={item.image.original_filename}
                  className="w-full object-cover cursor-pointer group-hover:scale-[1.02] transition-transform duration-300"
                  onClick={() => setLightboxIndex(idx)}
                />

                {/* Overlay Details */}
                <div className="p-3 bg-[#0F172A] border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <p className="truncate text-slate-300 font-semibold max-w-[120px]">
                    {item.image.original_filename}
                  </p>

                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setLightboxIndex(idx)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Büyüt"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                    {canManage && (
                      <button
                        onClick={() => handleRemoveImage(item.image.id)}
                        className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white"
                        title="Albümden Çıkar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 4. DEFAULT GRID VIEW (Responsive) */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentImages.map((item, idx) => (
              <div
                key={item.image.id}
                className="bg-[#0F172A] border border-slate-800/90 rounded-2xl overflow-hidden group hover:border-blue-500/50 transition-all duration-300 flex flex-col shadow-lg"
              >
                <div
                  className="relative aspect-square overflow-hidden bg-slate-950 cursor-pointer"
                  onClick={() => setLightboxIndex(idx)}
                >
                  <img
                    src={formatImageUrl(item.thumbnail_url || item.direct_url)}
                    alt={item.image.original_filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Reorder Buttons (If in Reorder Mode) */}
                  {isReorderMode && (
                    <div className="absolute inset-0 bg-slate-950/75 flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveImage(idx, idx - 1);
                        }}
                        disabled={idx === 0}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500 text-white hover:text-slate-950 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold text-amber-400">#{idx + 1}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveImage(idx, idx + 1);
                        }}
                        disabled={idx === currentImages.length - 1}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500 text-white hover:text-slate-950 disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Quick Action Hover Bar */}
                  {!isReorderMode && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxIndex(idx);
                        }}
                        className="p-1.5 rounded-xl bg-slate-900/90 text-white hover:bg-blue-600 transition-colors backdrop-blur shadow"
                        title="Büyük Görüntüle"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>

                      {canManage && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(item.image.id);
                          }}
                          className="p-1.5 rounded-xl bg-slate-900/90 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors backdrop-blur shadow"
                          title="Albümden Çıkar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Meta details */}
                <div className="p-3 flex items-center justify-between gap-2 border-t border-slate-800/80 bg-[#0B0F19]/40">
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-200 truncate">
                      {item.image.original_filename}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {item.image.width} × {item.image.height} px
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/i/${item.image.id}`)}
                    className="p-1 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"
                    title="Görsel Sayfası"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= LIGHTBOX VIEWER ================= */}
      {lightboxIndex !== null && currentImages[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-fadeIn">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                {lightboxIndex + 1} / {currentImages.length}
              </span>
              <p className="text-xs sm:text-sm font-bold truncate max-w-xs sm:max-w-md">
                {currentImages[lightboxIndex].image.original_filename}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={formatImageUrl(currentImages[lightboxIndex].direct_url)}
                download={currentImages[lightboxIndex].image.original_filename}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="İndir"
              >
                <Download className="w-4 h-4" />
              </a>

              <button
                onClick={() => navigate(`/i/${currentImages[lightboxIndex].image.id}`)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="Görsel Detayı"
              >
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Image Area */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              src={formatImageUrl(currentImages[lightboxIndex].direct_url)}
              alt={currentImages[lightboxIndex].image.original_filename}
              className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl transition-transform"
            />

            {/* Prev / Next controls */}
            <button
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev === 0 ? currentImages.length - 1 : (prev! - 1)
                )
              }
              className="absolute left-2 sm:left-4 p-3 rounded-full bg-black/60 hover:bg-blue-600 text-white backdrop-blur border border-white/10 transition-all shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev === currentImages.length - 1 ? 0 : (prev! + 1)
                )
              }
              className="absolute right-2 sm:right-4 p-3 rounded-full bg-black/60 hover:bg-blue-600 text-white backdrop-blur border border-white/10 transition-all shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Thumbnails */}
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-2 shrink-0 max-w-3xl mx-auto">
            {currentImages.map((img, idx) => (
              <button
                key={img.image.id}
                onClick={() => setLightboxIndex(idx)}
                className={`w-12 h-10 rounded-lg overflow-hidden shrink-0 border transition-all ${
                  lightboxIndex === idx
                    ? 'border-blue-500 ring-2 ring-blue-500/50 scale-110'
                    : 'border-transparent opacity-40 hover:opacity-100'
                }`}
              >
                <img
                  src={formatImageUrl(img.thumbnail_url || img.direct_url)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================= SHARE MODAL ================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-extrabold text-white">Albümü Paylaş</h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Link Copy */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Albüm Bağlantısı</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 select-all"
                />
                <button
                  onClick={() => {
                    copyToClipboard(shareUrl, 'Albüm bağlantısı');
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              </div>
            </div>

            {/* Embed Codes */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">HTML Gömme Kodu (Embed)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`<iframe src="${shareUrl}" width="100%" height="600" frameborder="0"></iframe>`}
                    className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-400 select-all font-mono"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0"></iframe>`,
                        'HTML Gömme kodu'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold shrink-0"
                  >
                    Kopyala
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">BBCode (Forumlar İçin)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`[url=${shareUrl}][b]${album.title}[/b] Albümünü Görüntüle[/url]`}
                    className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-400 select-all font-mono"
                  />
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `[url=${shareUrl}][b]${album.title}[/b] Albümünü Görüntüle[/url]`,
                        'BBCode'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold shrink-0"
                  >
                    Kopyala
                  </button>
                </div>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${album.title} - ${shareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold transition-all"
              >
                WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(album.title)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white text-xs font-bold transition-all"
              >
                Telegram
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(album.title)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
              >
                X (Twitter)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {isEditModalOpen && (
        <EditAlbumModal
          album={album}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onAlbumUpdated={(updated) => {
            setAlbumData({ ...albumData, album: { ...album, ...updated } });
            if (updated.view_mode) setActiveViewMode(updated.view_mode);
          }}
          onAlbumDeleted={() => {
            navigate('/galeri');
          }}
        />
      )}

      {/* ================= ADD IMAGES MODAL ================= */}
      {isAddImagesOpen && (
        <AddImagesToAlbumModal
          albumId={album.id}
          existingImageIds={album.image_ids || []}
          isOpen={isAddImagesOpen}
          onClose={() => setIsAddImagesOpen(false)}
          onImagesAdded={() => {
            fetchAlbum(cachedUnlockToken || undefined);
          }}
        />
      )}
    </div>
  );
};
