import React, { useState, useEffect } from 'react';
import {
  X,
  FolderPlus,
  Lock,
  Globe,
  EyeOff,
  Clock,
  LayoutGrid,
  Sparkles,
  Check,
  Search,
  Image as ImageIcon,
  CheckSquare,
  Square,
} from 'lucide-react';
import { AlbumCreateInput, UploadResult } from '../types';
import { albumApi, imageApi } from '../lib/api';
import { useToast } from './Toast';
import { formatImageUrl } from '../lib/imageUrl';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAlbumCreated: (album: any) => void;
  preSelectedImageIds?: string[];
}

export const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({
  isOpen,
  onClose,
  onAlbumCreated,
  preSelectedImageIds = [],
}) => {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public');
  const [viewMode, setViewMode] = useState<'grid' | 'masonry' | 'slideshow' | 'modern'>('grid');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiration, setExpiration] = useState<string>('none');
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set(preSelectedImageIds));
  const [coverImageId, setCoverImageId] = useState<string | null>(null);

  // Gallery picker
  const [galleryImages, setGalleryImages] = useState<UploadResult[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedImageIds(new Set(preSelectedImageIds));
      fetchGallery();
    }
  }, [isOpen, preSelectedImageIds]);

  const fetchGallery = async () => {
    try {
      setLoadingGallery(true);
      const res = await imageApi.getMyImages();
      setGalleryImages(res.images || []);
    } catch (err) {
      // Ignored
    } finally {
      setLoadingGallery(false);
    }
  };

  if (!isOpen) return null;

  const toggleSelectImage = (id: string) => {
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (coverImageId === id) setCoverImageId(null);
      } else {
        next.add(id);
        if (!coverImageId) setCoverImageId(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const filtered = filteredGalleryImages;
    if (filtered.every((i) => selectedImageIds.has(i.image.id))) {
      // Unselect all filtered
      setSelectedImageIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((i) => next.delete(i.image.id));
        return next;
      });
    } else {
      // Select all filtered
      setSelectedImageIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((i) => next.add(i.image.id));
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Lütfen albüm için bir başlık girin.', 'error');
      return;
    }

    if (enablePassword && (!password || password.trim().length < 3)) {
      showToast('Parola en az 3 karakter olmalıdır.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload: AlbumCreateInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        privacy,
        view_mode: viewMode,
        password: enablePassword ? password.trim() : undefined,
        expiration,
        cover_image_id: coverImageId || (selectedImageIds.size > 0 ? Array.from(selectedImageIds)[0] : null),
        image_ids: Array.from(selectedImageIds),
      };

      const res = await albumApi.createAlbum(payload);
      showToast('Albüm başarıyla oluşturuldu!', 'success');
      onAlbumCreated(res.album);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Albüm oluşturulamadı.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGalleryImages = galleryImages.filter((img) =>
    img.image.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-[#0B0F19]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">Yeni Albüm Oluştur</h2>
              <p className="text-[11px] text-slate-400">Özel koleksiyonunuzu yapılandırın ve paylaşın</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Title & Description */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Albüm Başlığı <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Yaz Tatili 2026, Mimari Çekimler, Ürün Portfolyosu..."
                className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Açıklama (İsteğe Bağlı)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Albüm hakkında kısa bir bilgi veya hikaye ekleyin..."
                className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Privacy & View Mode Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Privacy */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Gizlilik Düzeyi</label>
              <div className="grid grid-cols-3 gap-1.5 bg-[#0B0F19] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPrivacy('public')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    privacy === 'public'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Herkese Açık</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacy('unlisted')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    privacy === 'unlisted'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Liste Dışı</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrivacy('private')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                    privacy === 'private'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Özel</span>
                </button>
              </div>
            </div>

            {/* View Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Görünüm Düzeni</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="grid">Izgara (Grid) Düzeni</option>
                <option value="masonry">Pinterest / Masonry Düzeni</option>
                <option value="slideshow">Slayt Gösterisi / Carousel</option>
                <option value="modern">Modern Vitrin (Showcase)</option>
              </select>
            </div>
          </div>

          {/* Password Protection & Expiration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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
                  placeholder="Albüm erişim parolası..."
                  className="w-full bg-[#0F172A] border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              )}
            </div>

            {/* Expiration (Time limited access) */}
            <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Zaman Sınırlı Paylaşım</span>
                </label>
              </div>
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="none">Süresiz (Kalıcı Albüm)</option>
                <option value="10m">10 Dakika Sonra Kapat</option>
                <option value="1h">1 Saat Sonra Kapat</option>
                <option value="24h">24 Saat (1 Gün) Sonra Kapat</option>
                <option value="7d">7 Gün Sonra Kapat</option>
                <option value="30d">30 Gün Sonra Kapat</option>
              </select>
            </div>
          </div>

          {/* Select Images from Gallery */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Galeriden Görsel Ekle</span>
                  <span className="text-[11px] text-cyan-400 font-semibold">
                    ({selectedImageIds.size} seçildi)
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  İleride albümünüze dilediğiniz zaman yeni görsel ekleyebilir veya çıkarabilirsiniz.
                </p>
              </div>

              {filteredGalleryImages.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {filteredGalleryImages.every((i) => selectedImageIds.has(i.image.id))
                    ? 'Seçimi Bırak'
                    : 'Tümünü Seç'}
                </button>
              )}
            </div>

            {/* Search Filter for Gallery */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Galerinizdeki resimlerde ara..."
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Gallery Image Grid */}
            <div className="max-h-48 overflow-y-auto bg-[#0B0F19] p-2.5 rounded-2xl border border-slate-800/80 grid grid-cols-4 sm:grid-cols-6 gap-2">
              {loadingGallery ? (
                <div className="col-span-full py-8 text-center text-xs text-slate-400">
                  Galeriniz taranıyor...
                </div>
              ) : filteredGalleryImages.length > 0 ? (
                filteredGalleryImages.map((item) => {
                  const isSelected = selectedImageIds.has(item.image.id);
                  const isCover = coverImageId === item.image.id;
                  return (
                    <div
                      key={item.image.id}
                      onClick={() => toggleSelectImage(item.image.id)}
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
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      {isCover && (
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-blue-600/90 text-white text-[9px] font-black tracking-wider uppercase">
                          Kapak
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-6 text-center text-xs text-slate-500">
                  Galerinizde eklenecek görsel bulunamadı.
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
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
              <FolderPlus className="w-4 h-4" />
              <span>{submitting ? 'Oluşturuluyor...' : 'Albümü Oluştur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
