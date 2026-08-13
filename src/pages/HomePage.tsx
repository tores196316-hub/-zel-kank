import React from 'react';
import { Upload, Images, Shield, Zap, Link, CheckCircle, ArrowRight, FileCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-slate-900 to-slate-900 -z-10 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5" />
            <span>Işık Hızında CDN Resim Servisi</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Resmini yükle. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Linkini hemen al.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Saniyeler içinde resimlerinizi yüksek kalitede yükleyin. Forumlar, web siteleri ve sosyal medya için doğrudan resim bağlantılarınızı anında kopyalayın.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/yukle')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Upload className="w-5 h-5" />
              Resim Yükle
            </button>

            <button
              onClick={() => navigate(user ? '/galerim' : '/giris')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base border border-slate-700 flex items-center justify-center gap-2 transition-all"
            >
              <Images className="w-5 h-5 text-blue-400" />
              Galerime Git
            </button>
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
              <span className="text-xl font-bold text-white block">20 MB</span>
              <span className="text-xs text-slate-400">Maks. Dosya Boyutu</span>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
              <span className="text-xl font-bold text-white block">Sınırsız</span>
              <span className="text-xs text-slate-400">Görüntüleme Sayısı</span>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
              <span className="text-xl font-bold text-white block">Cloudinary</span>
              <span className="text-xs text-slate-400">CDN Depolama Altyapısı</span>
            </div>
            <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl">
              <span className="text-xl font-bold text-white block">HTTPS</span>
              <span className="text-xs text-slate-400">256-Bit SSL Güvenliği</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Neden Hızlı Yükle?</h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Gelişmiş resim optimizasyon teknolojisi ve sade arayüz ile resim yükleme deneyimi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-2xl hover:border-blue-500/40 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Anında Yükleme & CDN</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Yüklediğiniz tüm resimler dünya genelinde yüksek hızlı Cloudinary CDN sunucularında saklanır ve ışık hızında sunulur.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-2xl hover:border-blue-500/40 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
              <Link className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Çeşitli Paylaşım Kodları</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Direkt resim URL'si, HTML gömme kodu, Markdown formatı ve Forum / BBCode hazır formatlarıyla kopyalamaya hazır.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-2xl hover:border-blue-500/40 transition-colors space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Güvenli & Gizli</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Resimleriniz sadece bağlantıya sahip kişiler tarafından erişilebilir. Dilediğiniz an kendi galerinizden silebilirsiniz.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Formats Banner */}
      <section className="max-w-4xl mx-auto px-4 bg-slate-800/30 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <h3 className="text-lg font-semibold text-white">Desteklenen Resim Formatları</h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].map((fmt) => (
            <span key={fmt} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">
              {fmt}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-400">Tek dosya için maksimum yükleme boyutu: 20 MB</p>
      </section>

      {/* Call To Action */}
      <section className="max-w-5xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 rounded-3xl p-8 sm:p-12 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Hemen Resim Yüklemeye Başla</h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Üye olmadan hızlıca resim yükleyebilir, veya hesap oluşturarak resimlerinizi kişisel galerinizde düzenleyebilirsiniz.
          </p>
          <button
            onClick={() => navigate('/yukle')}
            className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md inline-flex items-center gap-2 transition-all"
          >
            <span>Başlamak İçin Tıkla</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
