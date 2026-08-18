import React, { useState } from 'react';
import { Wrench, Shield, RefreshCw, LogIn, Sparkles } from 'lucide-react';
import { Logo } from './Logo';
import { useSettings } from '../context/SettingsContext';

interface MaintenanceScreenProps {
  navigate: (path: string) => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ navigate }) => {
  const { refreshSettings } = useSettings();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    await refreshSettings();
    setTimeout(() => setChecking(false), 500);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full text-center space-y-8 bg-[#0A1020]/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-black/60 relative overflow-hidden">
        {/* Subtle background cyan glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex justify-center relative">
          <Logo size="md" variant="vertical" badgeText="V5" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Planlı Sistem Bakımı</span>
        </div>

        {/* Icon & Heading */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
            <Wrench className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sistemimiz Şu Anda Bakımda
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
            Sizlere daha hızlı, güvenli ve kesintisiz bir resim barındırma deneyimi sunmak amacıyla altyapı güncellemeleri yapıyoruz. Çok yakında tekrar hizmetinizde olacağız.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Kontrol Ediliyor...' : 'Durumu Kontrol Et'}</span>
          </button>

          <button
            onClick={() => navigate('/giris')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Yönetici Girişi</span>
          </button>
        </div>

        {/* Footer info note */}
        <div className="pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>IMGIVO V5 High-Performance Image Engine</span>
        </div>
      </div>
    </div>
  );
};
