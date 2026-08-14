import React from 'react';
import { Upload, Images, Shield, Zap, Link, CheckCircle, ArrowRight, FileCheck, Copy, Sparkles, Layers, Lock, Sliders, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-16 sm:space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-14 pb-8 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-cyan-600/15 blur-[140px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 text-center space-y-6 sm:space-y-8">
          {/* Logo Showcase with Slogan */}
          <div className="flex justify-center mb-2">
            <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#0F172A]/80 to-[#070A11]/90 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl group hover:border-cyan-500/40 transition-all">
              <Logo size="lg" variant="banner" showSlogan={true} />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Resmini anında yükle. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500">
              Bağlantını saniyeler içinde al.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            Fotoğraflarınızı hızlı ve güvenli şekilde yükleyin, doğrudan bağlantınızı, HTML, BBCode ve Markdown kodlarını tek tıkla alın.
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => navigate('/yukle')}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-98"
            >
              <Upload className="w-4 h-4" />
              <span>Resim Yükle</span>
            </button>

            <button
              onClick={() => navigate(user ? '/galerim' : '/giris')}
              className="w-full sm:w-auto min-h-[48px] px-7 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Images className="w-4 h-4 text-blue-400" />
              <span>Galeriye Git</span>
            </button>
          </div>

          {/* Minimal Specs Strip */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto text-xs text-slate-300">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-semibold text-white">20 MB</span>
              <span className="text-slate-400">/ Dosya Başına</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/40 border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white">Hızlı CDN</span>
              <span className="text-slate-400">Dağıtımı</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/40 border border-slate-800">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-white">HTTPS</span>
              <span className="text-slate-400">256-Bit SSL</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/40 border border-slate-800">
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-white">Kolay Paylaşım</span>
              <span className="text-slate-400">Kodları</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Neden AnlıkResim?</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
            Hız, güvenlik ve kullanım kolaylığı için sıfırdan tasarlanmış profesyonel resim barındırma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#0F172A]/70 border border-slate-800/80 p-6 rounded-2xl hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Işık Hızında Yükleme & CDN</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Yüklediğiniz fotoğraflar optimize edilir ve küresel CDN sunucuları üzerinden sıfır bekleme süresiyle sunulur.
            </p>
          </div>

          <div className="bg-[#0F172A]/70 border border-slate-800/80 p-6 rounded-2xl hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Link className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Hazır Paylaşım Formatları</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Direkt CDN bağlantısı, HTML gömme kodu, Markdown ve Forum / BBCode formatları tek tıkla kopyalanmaya hazırdır.
            </p>
          </div>

          <div className="bg-[#0F172A]/70 border border-slate-800/80 p-6 rounded-2xl hover:border-slate-700 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Güvenli & Kontrol Sizde</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Yüklemeleriniz otomatik taranır. Kendi oluşturduğunuz klasörlerle organize edebilir, istediğiniz an galerinizden silebilirsiniz.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Formats */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-[#0F172A]/50 border border-slate-800/80 rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Desteklenen Resim Formatları</h3>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].map((fmt) => (
              <span key={fmt} className="px-3.5 py-1.5 rounded-lg bg-slate-800/80 text-slate-200 text-xs font-mono font-bold border border-slate-700/60">
                .{fmt}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400">Üyeliksiz veya kayıtlı kullanıcılar için dosya başına 20 MB'a kadar destek.</p>
        </div>
      </section>

      {/* Call To Action */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-b from-[#1E293B]/40 to-[#0F172A] border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Hemen Resim Yüklemeye Başlayın</h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Üye olmadan saniyeler içinde resim yükleyebilir veya ücretsiz hesap oluşturarak kendi medya kütüphanenizi yönetebilirsiniz.
          </p>
          <button
            onClick={() => navigate('/yukle')}
            className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/25 inline-flex items-center gap-2 transition-all active:scale-98"
          >
            <span>Yükleme Ekranına Git</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
