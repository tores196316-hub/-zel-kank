import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Check,
  Image as ImageIcon,
  CheckSquare,
  Square,
} from 'lucide-react';
import { UploadResult } from '../types';
import { albumApi, imageApi } from '../lib/api';
import { useToast } from './Toast';
import { formatImageUrl } from '../lib/imageUrl';

interface AddImagesToAlbumModalProps {
  albumId: string;
  existingImageIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onImagesAdded: (updatedAlbum: any) => void;
}

export const AddImagesToAlbumModal: React.FC<AddImagesToAlbumModalProps> = ({
  albumId,
  existingImageIds,
  isOpen,
  onClose,
  onImagesAdded,
}) => {
  const { showToast } = useToast();

  const [galleryImages, setGalleryImages] = useState<UploadResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const existingSet = new Set(existingImageIds);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
      fetchGallery();
    }
  }, [isOpen]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await imageApi.getMyImages();
      // Filter out images already in this album
      const available = (res.images || []).filter((i) => !existingSet.has(i.image.id));
      setGalleryImages(available);
    } catch (err) {
      showToast('Galeri yüklenemedi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredImages = galleryImages.filter((img) =>
    img.image.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = () => {
    if (filteredImages.every((i) => selectedIds.has(i.image.id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredImages.forEach((i) => next.delete(i.image.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredImages.forEach((i) => next.add(i.image.id));
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      showToast('Lütfen en az bir resim seçin.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await albumApi.addImages(albumId, Array.from(selectedIds));
      showToast(`${selectedIds.size} görsel albüme eklendi!`, 'success');
      onImagesAdded(res.album);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Görseller eklenemedi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-[#0B0F19]/60">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white">Albüme Görsel Ekle</h2>
            <p className="text-[11px] text-slate-400">Galerinizdeki mevcut resimlerden seçin</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Search and Select All Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Galeride ara..."
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {filteredImages.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                {filteredImages.every((i) => selectedIds.has(i.image.id))
                  ? 'Seçimi Kaldır'
                  : 'Tümünü Seç'}
              </button>
            )}
          </div>

          {/* Grid */}
          <div className="min-h-[200px] max-h-[360px] overflow-y-auto bg-[#0B0F19] p-3 rounded-2xl border border-slate-800/80 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {loading ? (
              <div className="col-span-full py-12 text-center text-xs text-slate-400">
                Galeriniz yükleniyor...
              </div>
            ) : filteredImages.length > 0 ? (
              filteredImages.map((item) => {
                const isSelected = selectedIds.has(item.image.id);
                return (
                  <div
                    key={item.image.id}
                    onClick={() => toggleSelect(item.image.id)}
                    className={`group relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/40'
                        : 'border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={formatImageUrl(item.thumbnail_url || item.direct_url)}
                      alt={item.image.original_filename}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-[#0B0F19]/80 p-1 truncate text-[9px] text-slate-300">
                      {item.image.original_filename}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-xs text-slate-500 space-y-1">
                <ImageIcon className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                <p>Eklenebilecek yeni görsel bulunamadı.</p>
                <p className="text-[10px] text-slate-600">
                  Galerinizdeki tüm resimler zaten bu albümde bulunuyor olabilir.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              <strong className="text-white font-bold">{selectedIds.size}</strong> görsel seçildi
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={submitting || selectedIds.size === 0}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{submitting ? 'Ekleniyor...' : 'Seçilenleri Ekle'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
