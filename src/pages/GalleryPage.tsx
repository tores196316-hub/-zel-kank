import React, { useEffect, useState } from 'react';
import { Images, Search, Copy, ExternalLink, Trash2, Upload, Calendar, HardDrive, Plus, Lock } from 'lucide-react';
import { imageApi } from '../lib/api';
import { UploadResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

interface GalleryPageProps {
  navigate: (path: string) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [images, setImages] = useState<UploadResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGallery = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await imageApi.getMyImages();
      setImages(res.images);
    } catch (err: any) {
      showToast(err.message || 'Galeri yüklenemedi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Bağlantı kopyalandı!', 'success');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Bu resmi silmek istediğinize emin misiniz?')) return;

    try {
      await imageApi.deleteImage(id);
      showToast('Resim silindi.', 'success');
      setImages((prev) => prev.filter((item) => item.image.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Resim silinemedi.', 'error');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredImages = images.filter((item) =>
    item.image.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Galerinize Erişmek İçin Giriş Yapın</h2>
        <p className="text-slate-400 text-sm">
          Yüklediğiniz resimleri saklamak, yönetmek ve dilediğiniz an erişmek için bir hesabınızın olması gerekmektedir.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/giris')}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => navigate('/yukle')}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700"
          >
            Hızlı Yükleme Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Images className="w-6 h-6 text-blue-400" />
            Galerim
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Yüklediğiniz tüm resimler ({images.length} dosya)
          </p>
        </div>

        <button
          onClick={() => navigate('/yukle')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Yeni Resim Yükle
        </button>
      </div>

      {/* Search Bar */}
      {images.length > 0 && (
        <div className="max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Resim adı ile ara..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square rounded-2xl bg-slate-800/60 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filteredImages.length > 0 ? (
        /* Image Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredImages.map((item) => (
            <div
              key={item.image.id}
              onClick={() => navigate(`/i/${item.image.id}`)}
              className="group relative bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all duration-200 flex flex-col"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-slate-900 overflow-hidden relative flex items-center justify-center p-2">
                <img
                  src={item.direct_url}
                  alt={item.image.original_filename}
                  loading="lazy"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                />

                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(item.direct_url);
                    }}
                    title="URL Kopyala"
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 shadow-md transition-transform transform active:scale-95"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/i/${item.image.id}`);
                    }}
                    title="Görüntüle"
                    className="p-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(item.image.id, e)}
                    title="Sil"
                    className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500 shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Meta Footer */}
              <div className="p-3 space-y-1 bg-slate-900/40 flex-1 flex flex-col justify-between">
                <p className="text-xs font-semibold text-slate-200 truncate" title={item.image.original_filename}>
                  {item.image.original_filename}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{formatSize(item.image.size)}</span>
                  <span>{new Date(item.image.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-800/30 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Henüz bir resim yüklemedin.</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Hemen ilk resmini yükleyerek kişisel galerini oluşturabilir ve paylaşım bağlantılarını saklayabilirsin.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/yukle')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              İlk Resmini Yükle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
