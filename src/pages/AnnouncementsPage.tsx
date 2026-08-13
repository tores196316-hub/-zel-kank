import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Tag, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { publicApi } from '../lib/api';
import { Announcement } from '../types';

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.getAnnouncements()
      .then((res) => {
        setAnnouncements(res.announcements || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getTypeIcon = (type: string) => {
    if (type === 'warning') return <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />;
    if (type === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
    return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
  };

  const getTypeBadge = (type: string) => {
    if (type === 'warning') return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Uyarı / Bakım</span>;
    if (type === 'success') return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Yeni Özellik</span>;
    return <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">Bilgilendirme</span>;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left border-b border-slate-800 pb-6">
        <div className="flex items-center justify-center sm:justify-start gap-2.5">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Megaphone className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Sistem Duyuruları</h1>
        </div>
        <p className="text-xs text-slate-400">
          AnlıkResim platformundaki güncellemeler, yeni özellikler ve sistem bakım duyuruları.
        </p>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Duyurular yükleniyor...</div>
      ) : announcements.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-[#0F172A] border border-slate-800 space-y-3 shadow-xl">
          <Megaphone className="w-10 h-10 text-slate-700 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">Şu anda aktif bir duyuru bulunmuyor.</p>
          <p className="text-xs text-slate-500">Tüm sistemler normal ve kesintisiz şekilde çalışmaktadır.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-[#0F172A] border border-slate-800 p-6 sm:p-7 space-y-4 shadow-xl hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  {getTypeIcon(item.type)}
                  <h2 className="text-base font-bold text-white tracking-tight">{item.title}</h2>
                </div>
                <div className="flex items-center gap-2.5">
                  {getTypeBadge(item.type)}
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString('tr-TR', { dateStyle: 'medium' })}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line pl-0 sm:pl-8">
                {item.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
