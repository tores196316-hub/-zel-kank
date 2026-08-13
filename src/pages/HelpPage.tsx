import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Upload, Shield, Code, Link } from 'lucide-react';

export const HelpPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Hızlı Yükle servisini kullanmak ücretsiz mi?',
      a: 'Evet! Hızlı Yükle tüm bireysel kullanıcılar için tamamen ücretsizdir. Kayıt olarak veya üye olmadan hemen resim yükleyebilirsiniz.',
    },
    {
      q: 'Maksimum dosya boyutu ve desteklenen formatlar nelerdir?',
      a: 'Tek seferde yükleyebileceğiniz maksimum resim boyutu 20 MB\'dır. Desteklenen formatlar: JPG, JPEG, PNG, WEBP ve GIF.',
    },
    {
      q: 'Resimler ne kadar süre saklanır?',
      a: 'Resimleriniz kullanım şartlarımızı ihlal etmediği sürece süresiz olarak saklanır. Silinme riski olmadan güvenle kullanabilirsiniz.',
    },
    {
      q: 'Yüklediğim resmi nasıl silebilirim?',
      a: 'Giriş yaptıktan sonra yüklediğiniz resimleri "Galerim" sayfasından tek tıkla silebilirsiniz. Silme işlemi hem veritabanımızdan hem de Cloudinary CDN sunucularından anında gerçekleşir.',
    },
    {
      q: 'Direkt resim bağlantısı (Direct URL) nedir?',
      a: 'Direkt resim bağlantısı, `.jpg` veya `.png` gibi dosya uzantısıyla biten ve doğrudan resmin kendisine çıkan CDN bağlantısıdır. Forumlarda, Discord, HTML veya yazılımlarda bu bağlantıyı kullanabilirsiniz.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <HelpCircle className="w-4 h-4" />
          <span>Sıkça Sorulan Sorular</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Yardım & Destek Merkezi</h1>
        <p className="text-slate-400 text-sm">
          Aklınıza takılan tüm soruların cevaplarını burada bulabilirsiniz.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-white hover:text-blue-400 transition-colors"
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-blue-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-700/40 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
