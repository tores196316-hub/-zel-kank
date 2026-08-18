import React, { useState } from 'react';
import {
  X,
  Lock,
  Globe,
  EyeOff,
  Clock,
  Sparkles,
  Save,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Album, AlbumUpdateInput } from '../types';
import { albumApi } from '../lib/api';
import { useToast } from './Toast';

interface EditAlbumModalProps {
  album: Album;
  isOpen: boolean;
  onClose: () => void;
  onAlbumUpdated: (updated: Album) => void;
  onAlbumDeleted?: () => void;
}

export const EditAlbumModal: React.FC<EditAlbumModalProps> = ({
  album,
  isOpen,
  onClose,
  onAlbumUpdated,
  onAlbumDeleted,
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState(album.title || '');
  const [description, setDescription] = useState(album.description || '');
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>(album.privacy || 'public');
  const [viewMode, setViewMode] = useState<'grid' | 'masonry' | 'slideshow' | 'modern'>(album.view_mode || 'grid');
  const [enablePassword, setEnablePassword] = useState(!!album.is_password_protected);
  const [password, setPassword] = useState('');
  const [expiration, setExpiration] = useState<string>('none');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Albüm başlığı boş bırakılamaz.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload: AlbumUpdateInput = {
        title: title.trim(),
        description: description.trim(),
        privacy,
        view_mode: viewMode,
      };

      if (expiration !== 'none') {
        payload.expiration = expiration;
      }

      if (album.is_password_protected && !enablePassword) {
        payload.remove_password = true;
      } else if (enablePassword && password.trim()) {
        payload.password = password.trim();
      }

      const res = await albumApi.updateAlbum(album.id, payload);
      showToast('Albüm ayarları güncellendi.', 'success');
      onAlbumUpdated({ ...album, ...res.album });
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Güncelleme başarısız.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (
      !window.confirm(
        `"${album.title}" albümünü silmek istediğinize emin misiniz?\n\nÖNEMLİ: Albüm içindeki resimler galerinizden SİLİNMEZ, güvende kalır.`
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      await albumApi.deleteAlbum(album.id);
      showToast('Albüm silindi. Görselleriniz galerinizde korunmaktadır.', 'success');
      onClose();
      if (onAlbumDeleted) onAlbumDeleted();
    } catch (err: any) {
      showToast(err.message || 'Albüm silinemedi.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-[#0B0F19]/60">
          <h2 className="text-sm sm:text-base font-extrabold text-white">Albüm Ayarlarını Düzenle</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Title & Description */}
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">Albüm Başlığı</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Açıklama</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Albüm açıklaması..."
                className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Privacy & View Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Gizlilik</label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as any)}
                className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="public">🌐 Herkese Açık</option>
                <option value="unlisted">🔗 Liste Dışı (Bağlantı ile)</option>
                <option value="private">🔒 Özel (Yalnızca Ben)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Görünüm Düzeni</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="grid">Izgara (Grid)</option>
                <option value="masonry">Pinterest (Masonry)</option>
                <option value="slideshow">Slayt Gösterisi</option>
                <option value="modern">Modern Vitrin</option>
              </select>
            </div>
          </div>

          {/* Password Protection */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Parola Koruması</span>
              </label>
              <input
                type="checkbox"
                checked={enablePassword}
                onChange={(e) => setEnablePassword(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
            </div>

            {enablePassword && (
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={album.is_password_protected ? 'Yeni parola (değiştirmek için)' : 'Parola belirleyin...'}
                className="w-full bg-[#0F172A] border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            )}
          </div>

          {/* Danger Zone: Delete Album */}
          <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-rose-400">Albümü Sil</p>
              <p className="text-[10px] text-slate-400">
                Albüm silinir; ancak içindeki resimler galerinizde korunur.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeleteAlbum}
              disabled={deleting}
              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              {deleting ? 'Siliniyor...' : 'Albümü Sil'}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
