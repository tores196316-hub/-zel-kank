import React, { useEffect, useState } from 'react';
import { 
  Download, Copy, Share2, Trash2, Flag, Eye, Calendar, HardDrive, 
  Maximize2, Check, ArrowLeft, ExternalLink, Heart, Sparkles, X, 
  Lock, Key, Clock, Flame, Sliders, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { imageApi } from '../lib/api';
import { UploadResult } from '../types';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { formatImageUrl } from '../lib/imageUrl';
import { ImageEditorModal } from '../components/ImageEditorModal';
import { BurnViewer } from '../components/BurnViewer';

interface ImageDetailPageProps {
  imageId: string;
  navigate: (path: string) => void;
}

export const ImageDetailPage: React.FC<ImageDetailPageProps> = ({ imageId, navigate }) => {
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const [data, setData] = useState<(UploadResult & { is_owner: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password Unlock states
  const [passwordInput, setPasswordInput] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Editor Modal state
  const [editorOpen, setEditorOpen] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    imageApi
      .getImageDetail(imageId)
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Resim yüklenemedi.');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [imageId]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    setUnlocking(true);
    setUnlockError(null);

    try {
      const res = await imageApi.unlockImage(imageId, passwordInput.trim());
      setData({ ...res, is_owner: data?.is_owner || false });
      showToast('Kilit açıldı! Resim görüntülenebilir.', 'success');
    } catch (err: any) {
      setUnlockError(err.message || 'Hatalı şifre. Lütfen tekrar deneyin.');
    } finally {
      setUnlocking(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} panoya kopyalandı!`, 'success');
  };

  const handleToggleFavorite = async () => {
    if (!data || data.is_locked) return;
    try {
      const res = await imageApi.toggleFavorite(data.image.id);
      setData({
        ...data,
        image: { ...data.image, is_favorite: res.is_favorite },
      });
      showToast(res.is_favorite ? 'Favorilere eklendi.' : 'Favorilerden çıkarıldı.', 'info');
    } catch (err) {
      showToast('Favori durumu güncellenemedi.', 'error');
    }
  };

  const handleDownload = () => {
    if (!data || data.is_locked) return;
    imageApi.trackDownload(imageId).catch(() => {});

    const link = document.createElement('a');
    link.href = data.direct_url;
    link.download = data.image.original_filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('İndirme başlatıldı.', 'info');
  };

  const handleDelete = async () => {
    if (!data) return;
    if (!window.confirm('Bu resmi kalıcı olarak silmek istediğinize emin misiniz?')) return;

    try {
      await imageApi.deleteImage(imageId);
      showToast('Resim başarıyla silindi.', 'success');
      refreshUser().catch(() => {});
      navigate('/galerim');
    } catch (err: any) {
      showToast(err.message || 'Resim silinemedi.', 'error');
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setReportSubmitting(true);
    try {
      await imageApi.reportImage(imageId, reportReason);
      showToast('Şikayetiniz iletildi. Teşekkür ederiz.', 'success');
      setReportModalOpen(false);
      setReportReason('');
    } catch (err: any) {
      showToast(err.message || 'Rapor iletilemedi.', 'error');
    } finally {
      setReportSubmitting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Süresi doldu';

    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} gün ${hours % 24} saat kaldı`;
    if (hours > 0) return `${hours} saat ${mins % 60} dakika kaldı`;
    return `${mins} dakika kaldı`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-xs sm:text-sm">Resim detayları yükleniyor...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
          <Flag className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-extrabold text-white">Resim Bulunamadı veya Süresi Doldu</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
            {error || 'Aradığınız resim silinmiş, süresi dolmuş veya tek seferlik görüntüleme sonrasında otomatik imha edilmiş olabilir.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ana Sayfaya Dön</span>
        </button>
      </div>
    );
  }

  // --- PASSWORD LOCKED VIEW ---
  if (data.is_locked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg shadow-amber-500/5">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Bu Resim Şifrelidir</h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Yükleyici bu içeriği görüntülemek için bir erişim şifresi belirledi. Devam etmek için şifreyi girin.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">Erişim Şifresi</label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Şifrenizi yazın..."
                  required
                  autoFocus
                  className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {unlockError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{unlockError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={unlocking || !passwordInput.trim()}
              className="w-full min-h-[44px] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              {unlocking ? (
                <span>Doğrulanıyor...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Kilidi Aç & Görüntüle</span>
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-slate-300 font-medium inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ana Sayfaya Dön</span>
          </button>
        </div>
      </div>
    );
  }

  // --- BURN AFTER READING / ONE-TIME SECURE VIEWER ---
  if (data.image.is_one_time_view) {
    return <BurnViewer data={data} navigate={navigate} />;
  }

  const shareText = encodeURIComponent(`${data.image.original_filename} - IMGIVO resim barındırma servisi`);
  const sharePageUrl = encodeURIComponent(data.share_url);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 space-y-6">
      
      {/* Expiration & Security Banner (if applicable) */}
      {(data.is_one_time_view || data.expires_at || data.is_password_protected) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <div className="flex items-center gap-2">
            {data.is_one_time_view ? (
              <>
                <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>🔥 Tek Seferlik Görüntüleme: Bu resim görüntüleme sonrasında kalıcı olarak imha edilecektir.</span>
              </>
            ) : data.expires_at ? (
              <>
                <Clock className="w-4 h-4 text-amber-400" />
                <span>⏳ Süreli Paylaşım: {formatTimeRemaining(data.expires_at)}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>🔒 Şifre Korumalı Paylaşım (Doğrulandı)</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/galerim')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Galerime Dön</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Edit Button with Dahili Resim Editörü */}
          <button
            onClick={() => setEditorOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Resmi kırpın, filtreleyin veya filigran ekleyin"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Resmi Düzenle</span>
          </button>

          {data.is_owner && (
            <button
              onClick={handleToggleFavorite}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                data.image.is_favorite
                  ? 'bg-rose-600/20 border-rose-500/40 text-rose-400'
                  : 'bg-[#0F172A] border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${data.image.is_favorite ? 'fill-current' : ''}`} />
              <span>{data.image.is_favorite ? 'Favori' : 'Favorilere Ekle'}</span>
            </button>
          )}

          {data.is_owner && (
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sil</span>
            </button>
          )}

          <button
            onClick={() => setReportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Bildir</span>
          </button>
        </div>
      </div>

      {/* Main Centered Image Display */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-4 sm:p-8 flex flex-col items-center justify-center min-h-[350px] shadow-2xl relative">
        <div className="max-w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#0B0F19] p-2">
          <img
            src={formatImageUrl(data.direct_url)}
            alt={data.image.original_filename}
            className="max-h-[600px] w-auto object-contain rounded-xl shadow-lg"
          />
        </div>
      </div>

      {/* Action Controls & Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Resim Detayları</h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800 text-slate-300">
              <span className="text-slate-400 flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" /> Çözünürlük
              </span>
              <span className="font-mono font-medium">{data.image.width} x {data.image.height} px</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-800 text-slate-300">
              <span className="text-slate-400 flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Dosya Boyutu
              </span>
              <span className="font-mono font-medium">{formatSize(data.image.size)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-800 text-slate-300">
              <span className="text-slate-400 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-amber-400" /> Görüntülenme
              </span>
              <span className="font-mono font-medium">{data.image.views || 0} kez</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-800 text-slate-300">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Yüklenme Tarihi
              </span>
              <span className="font-mono font-medium">
                {new Date(data.image.created_at).toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleDownload}
              className="w-full min-h-[44px] py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Orijinal Resmi İndir</span>
            </button>
          </div>
        </div>

        {/* Share Codes Column */}
        <div className="md:col-span-2 bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Paylaşım & Bağlantılar</h3>

          <div className="space-y-3.5">
            {/* Direct CDN Link */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Direkt Resim Bağlantısı (CDN)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={data.direct_url}
                  className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(data.direct_url, 'Direkt Bağlantı')}
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> <span>Kopyala</span>
                </button>
              </div>
            </div>

            {/* Markdown Link */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Markdown Kodu (GitHub/Notion)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={data.markdown_code}
                  className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(data.markdown_code, 'Markdown Kodu')}
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> <span>Kopyala</span>
                </button>
              </div>
            </div>

            {/* HTML Link */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">HTML Kodu</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={data.html_code}
                  className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(data.html_code, 'HTML Kodu')}
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> <span>Kopyala</span>
                </button>
              </div>
            </div>

            {/* BBCode */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">Forum / BBCode</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={data.bbcode}
                  className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(data.bbcode, 'BBCode')}
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> <span>Kopyala</span>
                </button>
              </div>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="text-[11px] text-slate-400 font-medium block">Sosyal Medyada Paylaş</label>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://api.whatsapp.com/send?text=${shareText}%20${sharePageUrl}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/25 transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=${sharePageUrl}&text=${shareText}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-sky-600/15 text-sky-400 border border-sky-500/30 text-xs font-semibold hover:bg-sky-600/25 transition-colors"
              >
                Telegram
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${sharePageUrl}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                X (Twitter)
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Dahili Resim Editörü Modal */}
      {editorOpen && (
        <ImageEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          imageUrl={formatImageUrl(data.direct_url)}
          fileName={data.image.original_filename}
          onSave={(_file, previewUrl) => {
            showToast('Düzenleme tamamlandı. Yeni sürümü indirebilir veya kullanabilirsiniz.', 'success');
            setEditorOpen(false);
          }}
        />
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Flag className="w-4 h-4 text-rose-400" />
                <span>Resmi Şikayet Et</span>
              </h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bu resim telif hakkı ihlali, uygunsuz içerik veya kullanım şartlarına aykırı bir unsur barındırıyorsa lütfen nedenini belirtin.
            </p>

            <form onSubmit={handleReport} className="space-y-4">
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Şikayet nedeninizi detaylandırın..."
                rows={4}
                required
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting || !reportReason.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
                >
                  {reportSubmitting ? 'Gönderiliyor...' : 'Şikayeti Gönder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


