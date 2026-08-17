import React from 'react';
import { Shield, Lock, Zap, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-[#05080F] text-slate-400 border-t border-slate-800/80 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <button
              onClick={() => navigate('/')}
              className="text-left focus:outline-none cursor-pointer"
            >
              <Logo size="sm" variant="horizontal" showSlogan={true} badgeText="V5" />
            </button>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-400 max-w-sm">
              Işık hızında, güvenli ve modern resim barındırma platformu. Küresel CDN altyapısıyla kesintisiz doğrudan bağlantı, otomatik WebP sıkıştırma ve şifreli paylaşım.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>Midnight Premium V5</span>
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3.5">Ürün</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button onClick={() => navigate('/yukle')} className="hover:text-sky-400 transition-colors cursor-pointer">
                  Resim Yükle
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/galerim')} className="hover:text-sky-400 transition-colors cursor-pointer">
                  Galeri & Albümler
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/donusturucu')} className="hover:text-sky-400 transition-colors cursor-pointer flex items-center gap-1.5">
                  <span>Sıkıştır & Dönüştür</span>
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 py-0.2 rounded font-bold">Yeni</span>
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/premium')} className="hover:text-sky-400 transition-colors cursor-pointer">
                  Planlar & Premium
                </button>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3.5">Destek</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button onClick={() => navigate('/yardim')} className="hover:text-sky-400 transition-colors cursor-pointer">
                  Yardım & SSS
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/iletisim')} className="hover:text-sky-400 transition-colors cursor-pointer">
                  İletişim
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/iletisim')} className="hover:text-rose-400 transition-colors cursor-pointer">
                  Şikayet Bildir (DMCA)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/duyurular')} className="hover:text-sky-400 transition-colors cursor-pointer">
                  Duyurular
                </button>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3.5">Yasal</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button onClick={() => navigate('/gizlilik')} className="hover:text-sky-400 transition-colors cursor-pointer">
                  Gizlilik Politikası
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/sartlar')} className="hover:text-sky-400 transition-colors cursor-pointer">
                  Kullanım Şartları
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/hakkimizda')} className="hover:text-sky-400 transition-colors cursor-pointer">
                  Hakkımızda
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Trust & Copyright Row */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 IMGIVO. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>Yüksek Hızlı CDN</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-Bit SSL</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Güvenli Depolama</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
