import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
          Gizlilik Politikası
        </h1>
        <p className="text-slate-400 text-xs">Son güncelleme: 13 Ağustos 2026</p>
      </div>

      <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white">1. Toplanan Veriler</h2>
          <p>
            Hızlı Yükle, hizmet kalitesini artırmak ve güvenliği sağlamak amacıyla sınırlı bilgi toplar:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
            <li>Kayıtlı kullanıcılar için e-posta adresi ve kullanıcı adı</li>
            <li>Yüklenen resimlerin teknik meta verileri (boyut, format, boyut px)</li>
            <li>Güvenlik ve kötüye kullanımı önleme amaçlı sistem logları</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-white">2. Verilerin Kullanımı & Saklanması</h2>
          <p>
            Kişisel verileriniz kesinlikle üçüncü taraflarla paylaşılmaz veya satılmaz. Resimleriniz yalnızca güvenli CDN altyapısında barındırılır.
          </p>
        </section>
      </div>
    </div>
  );
};
