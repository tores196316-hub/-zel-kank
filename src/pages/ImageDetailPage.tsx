import React, { useEffect, useState } from 'react';
import { Download, Copy, Share2, Trash2, Flag, Eye, Calendar, HardDrive, Maximize2, Check, ArrowLeft, ExternalLink, Heart, Sparkles, X } from 'lucide-react';
import { imageApi } from '../lib/api';
import { UploadResult } from '../types';
import { useToast } from '../components/Toast';

interface ImageDetailPageProps {
  imageId: string;
  navigate: (path: string) => void;
}

export const ImageDetailPage: React.FC<ImageDetailPageProps> = ({ imageId, navigate }) => {
  const { showToast } = useToast();
  const [data, setData] = useState<(UploadResult & { is_owner: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} panoya kopyalandı!`, 'success');
  };

  const handleToggleFavorite = async () => {
    if (!data) return;
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
    if (!data) return;
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
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
          <h2 className="text-2xl font-extrabold text-white">Resim Bulunamadı</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
            {error || 'Aradığınız resim silinmiş, kalıcı olarak kaldırılmış veya hiç var olmamış olabilir.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ana Sayfaya Dön</span>
        </button>
      </div>
    );
  }

  const shareText = encodeURIComponent(`${data.image.original_filename} - AnlıkResim resim barındırma servisi`);
  const sharePageUrl = encodeURIComponent(data.share_url);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/galerim')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Galerime Dön</span>
        </button>

        <div className="flex items-center gap-2">
          {data.is_owner && (
            <button
              onClick={handleToggleFavorite}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
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
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sil</span>
            </button>
          )}

          <button
            onClick={() => setReportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
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
            src={data.direct_url}
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
              className="w-full min-h-[44px] py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-95"
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
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
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
                  value={data.markdown}
                  className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(data.markdown, 'Markdown Kodu')}
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
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
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
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
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
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
                className="text-slate-400 hover:text-white p-1"
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
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting || !reportReason.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all active:scale-95"
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

