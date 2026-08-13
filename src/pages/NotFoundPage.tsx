import React from 'react';
import { ArrowLeft, ImageOff } from 'lucide-react';

interface NotFoundPageProps {
  navigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-[#0F172A] border border-slate-800 flex items-center justify-center text-blue-400 mx-auto shadow-2xl">
        <ImageOff className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-4xl font-black text-blue-500 block">404</span>
        <h1 className="text-2xl font-black text-white tracking-tight">Aradığın Sayfayı Bulamadık</h1>
        <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
          Ulaşmaya çalıştığınız sayfa silinmiş, adresi değiştirilmiş veya geçici olarak erişilemiyor olabilir.
        </p>
      </div>

      <button
        onClick={() => navigate('/')}
        className="min-h-[44px] px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 inline-flex items-center gap-2 transition-all active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        Anasayfaya Dön
      </button>
    </div>
  );
};
