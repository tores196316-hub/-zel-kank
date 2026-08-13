import React, { useEffect, useState } from 'react';
import { Images, Search, Copy, ExternalLink, Trash2, Upload, Plus, Lock, Heart, Folder as FolderIcon, LayoutGrid, List, ArrowUpDown, Filter, FolderPlus, X } from 'lucide-react';
import { imageApi } from '../lib/api';
import { Folder, UploadResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

interface GalleryPageProps {
  navigate: (path: string) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [images, setImages] = useState<UploadResult[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolderTab, setActiveFolderTab] = useState<string>('all'); // 'all' | 'favorites' | folder_id
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'largest' | 'most_viewed'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Create Folder Modal State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const fetchGallery = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await imageApi.getMyImages();
      setImages(res.images || []);
      setFolders(res.folders || []);
    } catch (err: any) {
      showToast(err.message || 'Galeri yüklenemedi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [user]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await imageApi.createFolder(newFolderName.trim());
      setFolders((prev) => [...prev, res.folder]);
      showToast('Klasör oluşturuldu.', 'success');
      setNewFolderName('');
      setShowFolderModal(false);
    } catch (err: any) {
      showToast(err.message || 'Klasör oluşturulamadı.', 'error');
    }
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Klasörü silmek istediğinize emin misiniz? Resimleriniz silinmeyecek.')) return;

    try {
      await imageApi.deleteFolder(folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      if (activeFolderTab === folderId) setActiveFolderTab('all');
      showToast('Klasör silindi.', 'success');
    } catch (err: any) {
      showToast('Klasör silinemedi.', 'error');
    }
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await imageApi.toggleFavorite(id);
      setImages((prev) =>
        prev.map((item) =>
          item.image.id === id ? { ...item, image: { ...item.image, is_favorite: res.is_favorite } } : item
        )
      );
      showToast(res.is_favorite ? 'Favorilere eklendi.' : 'Favorilerden çıkarıldı.', 'info');
    } catch (err) {
      showToast('İşlem başarısız.', 'error');
    }
  };

  const handleSetFolder = async (imageId: string, folderId: string | null) => {
    try {
      await imageApi.setImageFolder(imageId, folderId);
      setImages((prev) =>
        prev.map((item) =>
          item.image.id === imageId ? { ...item, image: { ...item.image, folder_id: folderId } } : item
        )
      );
      showToast('Resim klasörü güncellendi.', 'success');
    } catch (err) {
      showToast('Klasör güncellenemedi.', 'error');
    }
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Filter & Sort Pipeline
  let processedImages = images.filter((item) => {
    // Search query
    const matchSearch = item.image.original_filename.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    // Folder tab
    if (activeFolderTab === 'favorites') {
      if (!item.image.is_favorite) return false;
    } else if (activeFolderTab !== 'all') {
      if (item.image.folder_id !== activeFolderTab) return false;
    }

    // Format filter
    if (formatFilter !== 'all') {
      if (item.image.format.toLowerCase() !== formatFilter.toLowerCase()) return false;
    }

    return true;
  });

  // Sorting
  processedImages.sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.image.created_at).getTime() - new Date(a.image.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.image.created_at).getTime() - new Date(b.image.created_at).getTime();
    if (sortBy === 'largest') return b.image.size - a.image.size;
    if (sortBy === 'most_viewed') return (b.image.views || 0) - (a.image.views || 0);
    return 0;
  });

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Galerinize Erişmek İçin Giriş Yapın</h2>
        <p className="text-slate-400 text-sm">
          Yüklediğiniz resimleri saklamak, klasörlemek ve dilediğiniz an yönetmek için hesabınıza giriş yapın.
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Images className="w-6 h-6 text-blue-400" />
            Galerim
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Yüklediğiniz toplam {images.length} resim • {folders.length} klasör
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFolderModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs shadow-sm flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4 text-blue-400" />
            Yeni Klasör
          </button>

          <button
            onClick={() => navigate('/yukle')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Yeni Resim Yükle
          </button>
        </div>
      </div>

      {/* Folder Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/80">
        <button
          onClick={() => setActiveFolderTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            activeFolderTab === 'all'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          Tüm Resimler ({images.length})
        </button>

        <button
          onClick={() => setActiveFolderTab('favorites')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
            activeFolderTab === 'favorites'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
          Favoriler ({images.filter((i) => i.image.is_favorite).length})
        </button>

        {folders.map((f) => {
          const folderImgCount = images.filter((i) => i.image.folder_id === f.id).length;
          return (
            <div
              key={f.id}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                activeFolderTab === f.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <button
                onClick={() => setActiveFolderTab(f.id)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <FolderIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>{f.name}</span>
                <span className="opacity-70">({folderImgCount})</span>
              </button>
              <button
                onClick={(e) => handleDeleteFolder(f.id, e)}
                className="hover:text-rose-400 p-0.5 ml-1 opacity-60 hover:opacity-100"
                title="Klasörü Sil"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Control Toolbar (Search, Format Filter, Sorting, View Mode) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dosya adı ile ara..."
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Format Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">Tüm Formatlar</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WEBP</option>
              <option value="gif">GIF</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="largest">En Büyük Dosya</option>
              <option value="most_viewed">En Çok İzlenen</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Izgara Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Liste Görünümü"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square rounded-2xl bg-slate-800/60 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : processedImages.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {processedImages.map((item) => (
              <div
                key={item.image.id}
                onClick={() => navigate(`/i/${item.image.id}`)}
                className="group relative bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all duration-200 flex flex-col"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-slate-900 overflow-hidden relative flex items-center justify-center p-2">
                  <img
                    src={item.thumbnail_url || item.direct_url}
                    alt={item.image.original_filename}
                    loading="lazy"
                    className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Favorite Heart Badge */}
                  <button
                    onClick={(e) => handleToggleFavorite(item.image.id, e)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:text-rose-400 shadow transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        item.image.is_favorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  {/* Hover overlay actions */}
                  <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      onClick={(e) => copyToClipboard(item.direct_url, e)}
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
                <div className="p-3 space-y-1.5 bg-slate-900/40 flex-1 flex flex-col justify-between">
                  <p className="text-xs font-semibold text-slate-200 truncate" title={item.image.original_filename}>
                    {item.image.original_filename}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{formatSize(item.image.size)}</span>
                    <span>{new Date(item.image.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>

                  {/* Folder Switcher dropdown */}
                  {folders.length > 0 && (
                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.image.folder_id || ''}
                        onChange={(e) => handleSetFolder(item.image.id, e.target.value || null)}
                        className="w-full bg-slate-900/80 border border-slate-700/80 text-slate-300 rounded px-1.5 py-0.5 text-[10px]"
                      >
                        <option value="">📁 Klasör Yok</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            📁 {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {processedImages.map((item) => (
              <div
                key={item.image.id}
                onClick={() => navigate(`/i/${item.image.id}`)}
                className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-blue-500/50 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.thumbnail_url || item.direct_url}
                    alt={item.image.original_filename}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-900 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.image.original_filename}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatSize(item.image.size)} • {item.image.format.toUpperCase()} • {item.image.views || 0} görüntüleme
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleToggleFavorite(item.image.id, e)}
                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-rose-400"
                  >
                    <Heart className={`w-4 h-4 ${item.image.is_favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => copyToClipboard(item.direct_url, e)}
                    className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(item.image.id, e)}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-rose-600 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-slate-800/30 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Resim Bulunamadı</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Seçtiğiniz filtreye uygun bir resim bulunamadı veya henüz resim yüklemediniz.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/yukle')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Resim Yükle
            </button>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-400" />
                Yeni Klasör Oluştur
              </h3>
              <button onClick={() => setShowFolderModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Klasör Adı</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Örn: Projeler, Sosyal Medya..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
