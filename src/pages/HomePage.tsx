import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Images,
  Shield,
  Zap,
  Link as LinkIcon,
  Copy,
  Sparkles,
  Lock,
  ArrowRight,
  Cloud,
  FileCheck,
  CheckCircle2,
  Sliders,
  Maximize2,
  HardDrive,
  RefreshCw,
  ExternalLink,
  Flame
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { imageApi } from '../lib/api';
import { useToast } from '../components/Toast';
import { UploadResult } from '../types';
import { formatImageUrl } from '../lib/imageUrl';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isQuickUploading, setIsQuickUploading] = useState(false);
  const [quickUploadProgress, setQuickUploadProgress] = useState(0);
  const [recentUploadResult, setRecentUploadResult] = useState<UploadResult | null>(null);

  // Paste support on home page
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (recentUploadResult) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            handleQuickUpload(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [recentUploadResult]);

  const handleQuickUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast('Dosya boyutu maksimum 20 MB olabilir.', 'error');
      return;
    }

    try {
      setIsQuickUploading(true);
      setQuickUploadProgress(10);

      const res = await imageApi.uploadFile(
        file,
        (percent) => setQuickUploadProgress(percent),
        null
      );

      setRecentUploadResult(res);
      showToast('Resim başarıyla yüklendi!', 'success');
      refreshUser().catch(() => {});
    } catch (err: any) {
      showToast(err.message || 'Yükleme başarısız oldu.', 'error');
    } finally {
      setIsQuickUploading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} kopyalandı!`, 'success');
  };

  return (
    <div className="space-y-20 sm:space-y-28 pb-20 overflow-hidden">
      {/* ━━━━━━━━━━━━━━━━━━━━
          HERO SECTION (MIDNIGHT PREMIUM)
          ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative pt-8 sm:pt-16 pb-6 overflow-hidden midnight-grid">
        {/* Subtle Ambient Glow Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-gradient-to-tr from-blue-600/15 via-sky-500/10 to-cyan-400/15 blur-[140px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-10 w-[300px] h-[250px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 text-center space-y-8 sm:space-y-10">
          {/* 1. Premium Mini Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0F172A]/90 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-lg shadow-cyan-500/10 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>⚡ Hızlı • Güvenli • Kolay</span>
              <span className="text-slate-500 font-mono text-[10px]">V5</span>
            </div>
          </div>

          {/* 2. Main High-Impact Typography Headline */}
          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
              Resmini yükle.
            </h1>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 drop-shadow-[0_0_25px_rgba(56,189,248,0.35)]">
              Bağlantını saniyeler içinde al.
            </h2>
          </div>

          {/* 3. Short, Clean Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            Fotoğraflarını saniyeler içinde yükle, doğrudan bağlantını ve paylaşım kodlarını hemen al.
          </p>

          {/* 4. Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <button
              onClick={() => navigate('/yukle')}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-95 cursor-pointer hover:shadow-cyan-500/40"
            >
              <Upload className="w-4 h-4" />
              <span>Resim Yükle</span>
            </button>

            <button
              onClick={() => navigate(user ? '/galerim' : '/giris')}
              className="w-full sm:w-auto min-h-[48px] px-7 py-3.5 rounded-2xl bg-[#0F172A] hover:bg-[#131D2F] text-slate-200 font-semibold text-sm border border-slate-800 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Images className="w-4 h-4 text-sky-400" />
              <span>Galeriyi Keşfet</span>
            </button>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━
              7. QUICK INTERACTIVE UPLOAD EXPERIENCE
              ━━━━━━━━━━━━━━━━━━━━ */}
          <div className="pt-4 max-w-2xl mx-auto">
            {!recentUploadResult ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleQuickUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-500/10 shadow-2xl shadow-cyan-500/20'
                    : 'border-slate-800 bg-[#0A1020]/90 hover:border-slate-700 hover:bg-[#0F172A]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleQuickUpload(e.target.files[0]);
                    }
                  }}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />

                {isQuickUploading ? (
                  <div className="space-y-4 py-4">
                    <RefreshCw className="w-10 h-10 text-sky-400 animate-spin mx-auto" />
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-white">Resim Yükleniyor ve Optimize Ediliyor...</p>
                      <div className="w-48 bg-slate-800 rounded-full h-2 mx-auto overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
                          style={{ width: `${quickUploadProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-sky-400 font-mono font-bold">%{quickUploadProgress}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 flex items-center justify-center mx-auto shadow-inner">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        Resmini buraya bırak veya <span className="text-sky-400 underline">dosya seç</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Panodan doğrudan <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Ctrl + V</kbd> ile yapıştırabilirsiniz
                      </p>
                    </div>
                    <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                      <span>JPG • PNG • GIF • WEBP</span>
                      <span>•</span>
                      <span>Maks. 20 MB</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Quick Upload Success Card */
              <div className="bg-[#0A1020] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 text-left space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Yükleme Tamamlandı!</span>
                  </div>
                  <button
                    onClick={() => setRecentUploadResult(null)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer font-medium"
                  >
                    Yeni Yükle
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-black border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {recentUploadResult.is_one_time_view ? (
                      <div className="flex flex-col items-center justify-center p-2 text-center text-rose-400">
                        <Flame className="w-7 h-7 animate-pulse" />
                        <span className="text-[9px] font-bold mt-1">1 Görüntüleme</span>
                      </div>
                    ) : (
                      <img
                        src={formatImageUrl(recentUploadResult.thumbnail_url || recentUploadResult.direct_url)}
                        alt="Yüklenen resim"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {recentUploadResult.is_one_time_view ? 'Güvenli Paylaşım Bağlantısı (Tek Kullanımlık)' : 'Direkt Resim Bağlantısı (CDN)'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={recentUploadResult.is_one_time_view ? recentUploadResult.share_url : recentUploadResult.direct_url}
                        className="flex-1 bg-[#070B14] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(recentUploadResult.is_one_time_view ? recentUploadResult.share_url : recentUploadResult.direct_url, recentUploadResult.is_one_time_view ? 'Güvenli Paylaşım Linki' : 'Direkt URL')}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopyala</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => navigate(`/i/${recentUploadResult.image.id}`)}
                    className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Tüm Paylaşım Kodlarını Gör</span>
                  </button>
                  <button
                    onClick={() => navigate('/yukle')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    Gelişmiş Yükleme Paneli →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━
          5. MODERN FEATURE STRIP CARDS
          ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: 20 MB */}
          <div className="bg-[#0A1020] border border-slate-800/90 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all space-y-1.5 group">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-sky-400 border border-blue-500/20 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-lg font-black text-white tracking-tight">20 MB</div>
            <div className="text-xs text-slate-400">Dosya Başına Kapasite</div>
          </div>

          {/* Card 2: CDN */}
          <div className="bg-[#0A1020] border border-slate-800/90 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all space-y-1.5 group">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-lg font-black text-white tracking-tight">Global CDN</div>
            <div className="text-xs text-slate-400">Hızlı & Kesintisiz Dağıtım</div>
          </div>

          {/* Card 3: HTTPS */}
          <div className="bg-[#0A1020] border border-slate-800/90 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all space-y-1.5 group">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-lg font-black text-white tracking-tight">HTTPS</div>
            <div className="text-xs text-slate-400">Güvenli 256-Bit Bağlantı</div>
          </div>

          {/* Card 4: Kolay Paylaşım */}
          <div className="bg-[#0A1020] border border-slate-800/90 rounded-2xl p-4 sm:p-5 hover:border-slate-700 transition-all space-y-1.5 group">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Copy className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-lg font-black text-white tracking-tight">Kolay Paylaşım</div>
            <div className="text-xs text-slate-400">BBCode • HTML • Markdown</div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━
          6. "NEDEN IMGIVO?" SECTION
          ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Neden IMGIVO?</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
            Hızlı yükleme. Kolay paylaşım. Gereksiz karmaşa yok.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Advantage 1 */}
          <div className="bg-[#0A1020] border border-slate-800/90 rounded-3xl p-6 hover:border-sky-500/40 transition-all duration-300 space-y-3 group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Saniyeler İçinde Yükle</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Üye olmadan tek tıkla dosyanızı yükleyin veya panodan yapıştırarak ışık hızında hazır hale getirin.
            </p>
          </div>

          {/* Advantage 2 */}
          <div className="bg-[#0A1020] border border-slate-800/90 rounded-3xl p-6 hover:border-cyan-500/40 transition-all duration-300 space-y-3 group">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Cloud className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Güvenilir CDN Altyapısı</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Resimleriniz tüm dünyada en yakın kenar sunuculardan gecikmesiz ve yüksek bant genişliğiyle sunulur.
            </p>
          </div>

          {/* Advantage 3 */}
          <div className="bg-[#0A1020] border border-slate-800/90 rounded-3xl p-6 hover:border-blue-500/40 transition-all duration-300 space-y-3 group">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-sky-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <LinkIcon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Tek Tıkla Paylaş</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Forumlar, web siteleri, bloglar ve sosyal platformlar için tam uyumlu hazır kodları anında kopyalayın.
            </p>
          </div>

          {/* Advantage 4 */}
          <div className="bg-[#0A1020] border border-slate-800/90 rounded-3xl p-6 hover:border-emerald-500/40 transition-all duration-300 space-y-3 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Güvenli Bağlantı</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              İsteğe bağlı şifreli koruma ve süreli imha (Burn after reading) seçenekleriyle tam veri gizliliği.
            </p>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━
          SPOTLIGHT: WEBP & AVIF CONVERTER TOOL
          ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-blue-950/40 via-[#0A1020] to-cyan-950/40 border border-cyan-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>Yeni Nesil Web Optimizasyonu</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              WebP & AVIF Format Dönüştürücü
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Resimlerinizi modern formatlara dönüştürerek kaliteden ödün vermeden <strong>%70-%90</strong> daha küçük boyutlara getirin. Toplu ZIP indirme veya tek tıkla galerinize kaydetme özelliğiyle hazır.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => navigate('/donusturucu')}
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4" />
              <span>Dönüştürücüye Git</span>
            </button>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━
          SUPPORTED FORMATS STRIP
          ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Desteklenen Formatlar
        </h4>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'AVIF'].map((fmt) => (
            <span
              key={fmt}
              className="px-3 py-1.5 rounded-xl bg-[#0A1020] text-slate-300 text-xs font-mono font-bold border border-slate-800"
            >
              .{fmt}
            </span>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━
          CALL TO ACTION / REGISTRATION STRIP
          ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-b from-[#0F172A] to-[#070B14] border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Hemen Resim Yüklemeye Başlayın
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Üye olmadan hemen dosya yükleyebilir veya ücretsiz üyelik açarak kendi özel albüm kütüphanenizi yönetebilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/yukle')}
              className="w-full sm:w-auto min-h-[44px] px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Resim Yükle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {!user && (
              <button
                onClick={() => navigate('/kayit')}
                className="w-full sm:w-auto min-h-[44px] px-7 py-3.5 rounded-2xl bg-[#0A1020] hover:bg-[#131D2F] text-slate-200 font-semibold text-xs sm:text-sm border border-slate-800 transition-all cursor-pointer"
              >
                <span>Ücretsiz Hesap Oluştur</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
