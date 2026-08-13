import React from 'react';
import { Info, ShieldCheck, Zap, Server, Globe } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Info className="w-4 h-4" />
          <span>Hızlı Yükle Platformu</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Hakkımızda</h1>
        <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
          Hızlı Yükle, kullanıcıların yüksek kalitede resimlerini saniyeler içinde yükleyip tüm dijital platformlarda paylaşabilmesi için tasarlanmış bağımsız bir resim depolama servisidir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Işık Hızında Altyapı</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Resimleriniz yükleme anında optimize edilir ve Cloudinary küresel CDN ağı üzerinden dağıtılır. Bu sayede web siteleriniz ve forum paylaşımlarınız sıfır gecikmeyle yüklenir.
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Yüksek Güvenlik & Gizlilik</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sunucularımızda zararlı içerik taraması ve otomatik MIME tip doğrulaması yapılarak dosya güvenliği sağlanır. Resimleriniz izniniz olmadan herkese açık listelenmez.
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Gelişmiş Format Desteği</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            JPG, PNG, WEBP ve GIF formatları tam desteklenmektedir. Tek dosya için 20 MB'a varan yükleme sınırı ile yüksek çözünürlüklü çalışmalarınızı rahatça paylaşabilirsiniz.
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Kesintisiz Erişilebilirlik</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Yüklediğiniz resimler için sınırsız bant genişliği ve görüntüleme garantisi sunulur. Bağlantılarınız hiçbir zaman kırılmaz veya zaman aşımına uğramaz.
          </p>
        </div>
      </div>
    </div>
  );
};
