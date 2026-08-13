import React from 'react';
import { ImagePlus, Shield, Lock, Zap } from 'lucide-react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <ImagePlus className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Hızlı<span className="text-blue-400">Yükle</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Yüksek performanslı, güvenli ve kolay resim yükleme ve paylaşım servisi. Cloudinary CDN altyapısıyla ışık hızında erişim.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Hızlı Bağlantılar</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/yukle')} className="hover:text-blue-400 transition-colors">
                  Resim Yükle
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/galerim')} className="hover:text-blue-400 transition-colors">
                  Galerim
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/hakkimizda')} className="hover:text-blue-400 transition-colors">
                  Hakkımızda
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/yardim')} className="hover:text-blue-400 transition-colors">
                  Yardım & SSS
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Kurumsal & Yasal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/sartlar')} className="hover:text-blue-400 transition-colors">
                  Kullanım Şartları
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/gizlilik')} className="hover:text-blue-400 transition-colors">
                  Gizlilik Politikası
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/iletisim')} className="hover:text-blue-400 transition-colors">
                  İletişim Formu
                </button>
              </li>
            </ul>
          </div>

          {/* Trust Badges */}
          <div className="space-y-2 text-xs">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Güvenlik & Hız</h4>
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Cloudinary Global CDN</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>SSL 256-Bit Şifreleme</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Otomatik Dosya Doğrulama</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Hızlı Yükle. Tüm hakları saklıdır.</p>
          <p className="text-[11px] text-slate-500">Işık hızında resim yükleme platformu</p>
        </div>
      </div>
    </footer>
  );
};
