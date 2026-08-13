import React, { useState, useEffect } from 'react';
import { Crown, Check, Zap, Sparkles, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { publicApi } from '../lib/api';
import { PlanConfig } from '../types';

interface PremiumPageProps {
  navigate: (path: string) => void;
}

export const PremiumPage: React.FC<PremiumPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Record<string, PlanConfig>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.getSettings()
      .then((res) => {
        if (res.plans) {
          setPlans(res.plans);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const defaultPlans: Record<string, PlanConfig> = {
    free: {
      name: 'Ücretsiz',
      daily_upload_limit: 15,
      max_file_size_mb: 10,
      storage_limit_gb: 1,
      ads_enabled: true,
      features: ['Hızlı CDN Dağıtımı', 'Maksimum 10 MB Dosya', '1 GB Güvenli Depolama', 'Günlük 15 Yükleme', 'Standart Destek'],
    },
    premium: {
      name: 'Premium',
      daily_upload_limit: 100,
      max_file_size_mb: 30,
      storage_limit_gb: 15,
      ads_enabled: false,
      features: ['Reklamsız Deneyim', 'Maksimum 30 MB Dosya', '15 GB Genişletilmiş Alan', 'Günlük 100 Yükleme', 'Öncelikli CDN Bant Genişliği', 'Öncelikli E-Posta Desteği'],
    },
    vip: {
      name: 'VIP Pro',
      daily_upload_limit: 500,
      max_file_size_mb: 50,
      storage_limit_gb: 50,
      ads_enabled: false,
      features: ['Tamamen Sınırsız Hız', 'Maksimum 50 MB Dosya', '50 GB Devasa Depolama', 'Günlük 500 Yükleme', 'Özel VIP Rozet', '7/24 Doğrudan Destek Hattı'],
    },
  };

  const activePlans = Object.keys(plans).length > 0 ? plans : defaultPlans;

  const currentPlan = user?.plan || (user?.role === 'admin' ? 'admin' : 'free');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title section */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Paketler & Avantajlar
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          İhtiyacınıza Uygun <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Planı Seçin</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Daha yüksek dosya boyutları, genişletilmiş depolama ve reklamsız süper hızlı deneyim için hesabınızı yükseltin.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* Free Plan */}
        <div className={`relative rounded-3xl bg-[#0F172A] border ${currentPlan === 'free' ? 'border-blue-500/50' : 'border-slate-800'} p-8 flex flex-col justify-between shadow-xl`}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{activePlans.free?.name || 'Ücretsiz'}</span>
              {currentPlan === 'free' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Mevcut Planınız
                </span>
              )}
            </div>

            <div>
              <span className="text-4xl font-black text-white">₺0</span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">/ sonsuza kadar</span>
            </div>

            <p className="text-xs text-slate-400">Bireysel ve günlük hızlı paylaşımlar için mükemmel başlangıç paketi.</p>

            <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
              <div className="font-semibold text-slate-200">Paket Özellikleri:</div>
              <ul className="space-y-2.5">
                {(activePlans.free?.features || []).map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => (!user ? navigate('/kayit') : navigate('/yukle'))}
              className="w-full min-h-[44px] py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all text-center active:scale-95"
            >
              {user ? 'Kullanmaya Devam Et' : 'Ücretsiz Başla'}
            </button>
          </div>
        </div>

        {/* Premium Plan (Highlighted) */}
        <div className={`relative rounded-3xl bg-gradient-to-b from-blue-950/40 via-[#0F172A] to-[#0F172A] border-2 ${currentPlan === 'premium' ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-blue-500/40'} p-8 flex flex-col justify-between shadow-2xl shadow-blue-500/10`}>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
            En Çok Tercih Edilen
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{activePlans.premium?.name || 'Premium'}</span>
              {currentPlan === 'premium' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Mevcut Planınız
                </span>
              )}
            </div>

            <div>
              <span className="text-4xl font-black text-white">₺49</span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">/ ay</span>
            </div>

            <p className="text-xs text-slate-300">Geliştiriciler, tasarımcılar ve sık resim yükleyen içerik üreticileri için.</p>

            <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
              <div className="font-semibold text-slate-200">Paket Özellikleri:</div>
              <ul className="space-y-2.5">
                {(activePlans.premium?.features || []).map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-slate-200">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => navigate('/iletisim')}
              className="w-full min-h-[44px] py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>Yükseltme Talebi İlet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* VIP Plan */}
        <div className={`relative rounded-3xl bg-[#0F172A] border ${currentPlan === 'vip' ? 'border-purple-500/60' : 'border-slate-800'} p-8 flex flex-col justify-between shadow-xl`}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">{activePlans.vip?.name || 'VIP Pro'}</span>
              {currentPlan === 'vip' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Mevcut Planınız
                </span>
              )}
            </div>

            <div>
              <span className="text-4xl font-black text-white">₺99</span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">/ ay</span>
            </div>

            <p className="text-xs text-slate-400">Kurumsal kullanım, yüksek çözünürlüklü arşivleme ve sınırsız performans.</p>

            <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
              <div className="font-semibold text-slate-200">Paket Özellikleri:</div>
              <ul className="space-y-2.5">
                {(activePlans.vip?.features || []).map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => navigate('/iletisim')}
              className="w-full min-h-[44px] py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>VIP Yükseltme Talebi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <h3 className="text-base font-bold text-white text-center">Detaylı Limit Karşılaştırması</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Özellik</th>
                <th className="py-3 px-4">Ücretsiz</th>
                <th className="py-3 px-4 text-blue-400">Premium</th>
                <th className="py-3 px-4 text-purple-400">VIP Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-medium text-white">Maksimum Dosya Boyutu</td>
                <td className="py-3 px-4">{activePlans.free?.max_file_size_mb || 15} MB</td>
                <td className="py-3 px-4 text-blue-300 font-semibold">{activePlans.premium?.max_file_size_mb || 50} MB</td>
                <td className="py-3 px-4 text-purple-300 font-semibold">{activePlans.vip?.max_file_size_mb || 100} MB</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Günlük Yükleme Limiti</td>
                <td className="py-3 px-4">{activePlans.free?.daily_upload_limit || 20} adet / gün</td>
                <td className="py-3 px-4 text-blue-300 font-semibold">{activePlans.premium?.daily_upload_limit || 100} adet / gün</td>
                <td className="py-3 px-4 text-purple-300 font-semibold">{activePlans.vip?.daily_upload_limit || 500} adet / gün</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Depolama Alanı</td>
                <td className="py-3 px-4">{activePlans.free?.storage_limit_gb || 2} GB</td>
                <td className="py-3 px-4 text-blue-300 font-semibold">{activePlans.premium?.storage_limit_gb || 15} GB</td>
                <td className="py-3 px-4 text-purple-300 font-semibold">{activePlans.vip?.storage_limit_gb || 50} GB</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Reklamsız Arayüz</td>
                <td className="py-3 px-4 text-slate-500">Hayır</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Evet</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Evet</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-white">Destek Seviyesi</td>
                <td className="py-3 px-4">Standart</td>
                <td className="py-3 px-4 text-blue-300">Öncelikli</td>
                <td className="py-3 px-4 text-purple-300 font-semibold">7/24 Özel VIP</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
