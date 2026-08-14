import React from 'react';
import { Info, ShieldCheck, Zap, Server, Globe } from 'lucide-react';
import { Logo } from '../components/Logo';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <Logo size="lg" variant="banner" showSlogan={true} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Hakkımızda</h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          AnlıkResim, kullanıcıların yüksek kalitede resimlerini saniyeler içinde yükleyip tüm dijital platformlarda paylaşabilmesi için tasarlanmış yeni nesil resim barındırma servisidir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Işık Hızında Altyapı</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Resimleriniz yükleme anında optimize edilir ve Cloudinary küresel CDN ağı üzerinden dağıtılır. Bu sayede web siteleriniz ve forum paylaşımlarınız sıfır gecikmeyle yüklenir.
          </p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Yüksek Güvenlik & Gizlilik</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sunucularımızda zararlı içerik taraması ve otomatik MIME tip doğrulaması yapılarak dosya güvenliği sağlanır. Resimleriniz izniniz olmadan herkese açık listelenmez.
          </p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Server className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Gelişmiş Format Desteği</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            JPG, PNG, WEBP ve GIF formatları tam desteklenmektedir. Tek dosya için 20 MB'a varan yükleme sınırı ile yüksek çözünürlüklü çalışmalarınızı rahatça paylaşabilirsiniz.
          </p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Kesintisiz Erişilebilirlik</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Yüklediğiniz resimler için sınırsız bant genişliği ve görüntüleme garantisi sunulur. Bağlantılarınız hiçbir zaman kırılmaz veya zaman aşımına uğramaz.
          </p>
        </div>
      </div>
    </div>
  );
};
