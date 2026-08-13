import React from 'react';
import { FileText, ShieldAlert } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <h1 className="text-3xl font-black text-white flex items-center gap-2.5 tracking-tight">
          <FileText className="w-8 h-8 text-blue-400" />
          Kullanım Şartları
        </h1>
        <p className="text-slate-400 text-xs">Son güncelleme: 13 Ağustos 2026</p>
      </div>

      <div className="space-y-6 text-xs text-slate-300 leading-relaxed bg-[#0F172A] border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white">1. Hizmet Şartlarının Kabulü</h2>
          <p className="text-slate-400">
            AnlıkResim web sitesini ve servislerini kullanarak aşağıdaki kullanım şartlarını kabul etmiş sayılırsınız. Şartları kabul etmiyorsanız lütfen servisi kullanmayınız.
          </p>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-800">
          <h2 className="text-sm font-bold text-white">2. Yasaklanmış İçerikler</h2>
          <p className="text-slate-400">Aşağıdaki türde içeriklerin yüklenmesi kesinlikle yasaktır ve tespiti halinde derhal silinir:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
            <li>Yasadışı, telif hakkını ihlal eden materyaller</li>
            <li>Zararlı yazılım, virüs veya aldatıcı içerikler</li>
            <li>Kişisel gizliliği ihlal eden izinsiz fotoğraflar</li>
            <li>Nefret söylemi, taciz veya şiddet unsuru içeren görseller</li>
          </ul>
        </section>

        <section className="space-y-2 pt-4 border-t border-slate-800">
          <h2 className="text-sm font-bold text-white">3. Sorumluluk Reddi</h2>
          <p className="text-slate-400">
            AnlıkResim, kullanıcılar tarafından yüklenen resimlerin içeriğinden sorumlu tutulamaz. Telif veya hak ihlali bildirimleri için bildirim modülünü kullanabilirsiniz.
          </p>
        </section>
      </div>
    </div>
  );
};
