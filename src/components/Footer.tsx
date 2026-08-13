import React from 'react';
import { ImagePlus, Shield, Lock, Zap } from 'lucide-react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="bg-[#070A11] text-slate-400 border-t border-[#1E293B] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
                <ImagePlus className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white tracking-tight">
                  Anlık<span className="text-blue-400">Resim</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  V4
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Işık hızında, güvenli ve kolay resim yükleme ve paylaşım servisi. Küresel CDN altyapısıyla kesintisiz doğrudan bağlantı.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Hızlı Bağlantılar</h4>
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
                <button onClick={() => navigate('/premium')} className="hover:text-blue-400 transition-colors">
                  Planlar & Paketler
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/duyurular')} className="hover:text-blue-400 transition-colors">
                  Duyurular
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Kurumsal & Yasal</h4>
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
                  İletişim & İhbar
                </button>
              </li>
            </ul>
          </div>

          {/* Trust Badges */}
          <div className="space-y-2.5 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Güvenlik & Hız</h4>
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Yüksek Hızlı Küresel CDN</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>256-Bit SSL Şifreleme</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Güvenli Dosya Depolama</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AnlıkResim. Tüm hakları saklıdır.</p>
          <p className="text-[11px] text-slate-500 font-mono">Modern & Güvenli Medya Servisi</p>
        </div>
      </div>
    </footer>
  );
};

