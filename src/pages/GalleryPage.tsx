import React, { useEffect, useState } from 'react';
import {
  Images,
  Search,
  Copy,
  ExternalLink,
  Trash2,
  Upload,
  Plus,
  Lock,
  Heart,
  Folder as FolderIcon,
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  FolderPlus,
  X,
  Archive,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
  Sliders,
  Download
} from 'lucide-react';
import { imageApi } from '../lib/api';
import { Folder, UploadResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { formatImageUrl } from '../lib/imageUrl';
import { exportImagesToZip, ZipExportProgress } from '../lib/zipExport';

interface GalleryPageProps {
  navigate: (path: string) => void;
}

export const GalleryPage: React.FC<GalleryPageProps> = ({ navigate }) => {
  const { user, refreshUser } = useAuth();
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

  // Multi-Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());

  // ZIP Export Progress
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<ZipExportProgress | null>(null);

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
      refreshUser().catch(() => {});
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

  // Multi-selection helpers
  const toggleSelectImage = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedImageIds.size === processedImages.length) {
      setSelectedImageIds(new Set());
    } else {
      setSelectedImageIds(new Set(processedImages.map((i) => i.image.id)));
    }
  };

  // ZIP Export Handler for Album / Selection
  const handleExportZip = async (specificImages?: UploadResult[], customAlbumName?: string) => {
    const listToExport = specificImages || (
      selectedImageIds.size > 0
        ? processedImages.filter((i) => selectedImageIds.has(i.image.id))
        : processedImages
    );

    if (listToExport.length === 0) {
      showToast('İndirilecek resim bulunamadı.', 'error');
      return;
    }

    try {
      setIsZipping(true);
      const itemsToZip = listToExport.map((item) => ({
        url: formatImageUrl(item.direct_url),
        filename: item.image.original_filename || `resim_${item.image.id}.${item.image.format}`,
      }));

      // Determine album name
      let albumName = customAlbumName;
      if (!albumName) {
        if (activeFolderTab === 'favorites') {
          albumName = 'IMGIVO_Favoriler';
        } else if (activeFolderTab !== 'all') {
          const currentFolder = folders.find((f) => f.id === activeFolderTab);
          albumName = currentFolder ? `IMGIVO_Album_${currentFolder.name}` : 'IMGIVO_Album';
        } else if (selectedImageIds.size > 0) {
          albumName = `IMGIVO_Secilen_${selectedImageIds.size}_Resim`;
        } else {
          albumName = 'IMGIVO_Tum_Galeri';
        }
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const finalZipName = `${albumName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${dateStr}.zip`;

      await exportImagesToZip(itemsToZip, finalZipName, (p) => {
        setZipProgress(p);
      });

      showToast(`ZIP arşivi hazırlandı: ${listToExport.length} resim indirildi!`, 'success');
      if (isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedImageIds(new Set());
      }
    } catch (err: any) {
      showToast('ZIP arşivi oluşturulurken hata meydana geldi.', 'error');
    } finally {
      setIsZipping(false);
      setZipProgress(null);
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
      refreshUser().catch(() => {});
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
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Galerinize Erişmek İçin Giriş Yapın</h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Yüklediğiniz resimleri saklamak, klasörlemek ve dilediğiniz an yönetmek için hesabınıza giriş yapın.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/giris')}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => navigate('/yukle')}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-all"
          >
            Hızlı Yükleme Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Images className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
            Galerim
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Yüklediğiniz toplam <span className="text-slate-200 font-semibold">{images.length} resim</span> • <span className="text-slate-200 font-semibold">{folders.length} klasör</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowFolderModal(true)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-blue-400" />
            <span>Yeni Klasör</span>
          </button>

          <button
            onClick={() => navigate('/yukle')}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Resim Yükle</span>
          </button>
        </div>
      </div>

      {/* Folder Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/80">
        <button
          onClick={() => setActiveFolderTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            activeFolderTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-[#0F172A] text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Tüm Resimler ({images.length})
        </button>

        <button
          onClick={() => setActiveFolderTab('favorites')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
            activeFolderTab === 'favorites'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-[#0F172A] text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
          <span>Favoriler ({images.filter((i) => i.image.is_favorite).length})</span>
        </button>

        {folders.map((f) => {
          const folderImgCount = images.filter((i) => i.image.folder_id === f.id).length;
          return (
            <div
              key={f.id}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                activeFolderTab === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#0F172A] text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <button
                onClick={() => setActiveFolderTab(f.id)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <FolderIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>{f.name}</span>
                <span className="opacity-70 text-[11px]">({folderImgCount})</span>
              </button>
              <button
                onClick={(e) => handleDeleteFolder(f.id, e)}
                className="hover:text-rose-400 p-0.5 ml-1 opacity-60 hover:opacity-100 transition-opacity"
                title="Klasörü Sil"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Folder / Album Summary & ZIP Action Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-[#0F172A] to-cyan-950/30 border border-blue-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              {activeFolderTab === 'all'
                ? 'Tüm Galeri'
                : activeFolderTab === 'favorites'
                ? 'Favoriler Albümü'
                : `Albüm: ${folders.find((f) => f.id === activeFolderTab)?.name || 'Özel Albüm'}`}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black">
              {processedImages.length} Resim
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Toplam Boyut:{' '}
            <strong className="text-slate-200">
              {formatSize(processedImages.reduce((sum, i) => sum + i.image.size, 0))}
            </strong>{' '}
            • Tek tıkla sıkıştırılmış ZIP paketi olarak indirebilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Toggle Multi-selection */}
          <button
            type="button"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedImageIds(new Set());
            }}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isSelectionMode
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-[#0B0F19] border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            <span>{isSelectionMode ? 'Seçimi Bitir' : 'Çoklu Seçim'}</span>
          </button>

          {/* Quick Album ZIP Export */}
          <button
            type="button"
            disabled={isZipping || processedImages.length === 0}
            onClick={() => handleExportZip()}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            <span>
              {isZipping
                ? `ZIP Hazırlanıyor (${zipProgress?.percent || 0}%)...`
                : selectedImageIds.size > 0
                ? `Seçilenleri ZIP İndir (${selectedImageIds.size})`
                : 'Albümü ZIP İndir'}
            </span>
          </button>
        </div>
      </div>

      {/* Selection Mode Action Bar */}
      {isSelectionMode && (
        <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold transition-colors cursor-pointer"
            >
              {selectedImageIds.size === processedImages.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
            </button>
            <span className="text-xs text-slate-300">
              <strong className="text-white font-bold">{selectedImageIds.size}</strong> / {processedImages.length} resim seçildi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedImageIds.size === 0 || isZipping}
              onClick={() => handleExportZip()}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-40 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Seçilenleri ZIP Olarak İndir ({selectedImageIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* ZIP Downloading Progress Card */}
      {isZipping && zipProgress && (
        <div className="bg-[#0F172A] border border-cyan-500/40 rounded-2xl p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Archive className="w-5 h-5 text-cyan-400 animate-bounce" />
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">
                Albüm Sıkıştırılıyor & Paketleniyor...
              </div>
              <div className="text-[11px] text-slate-400">
                {zipProgress.current} / {zipProgress.total} - {zipProgress.currentFilename}
              </div>
            </div>
          </div>
          <div className="text-xs font-black text-cyan-400">%{zipProgress.percent}</div>
        </div>
      )}

      {/* Control Toolbar (Search, Format Filter, Sorting, View Mode) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0F172A] p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dosya adına göre filtrele..."
            className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Format Selector */}
          <div className="flex items-center gap-1 bg-[#0B0F19] border border-slate-700/80 rounded-xl px-2.5 py-1">
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
          <div className="flex items-center gap-1 bg-[#0B0F19] border border-slate-700/80 rounded-xl px-2.5 py-1">
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
          <div className="flex items-center bg-[#0B0F19] border border-slate-700/80 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Izgara Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
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
            <div key={i} className="aspect-square rounded-2xl bg-[#0F172A] animate-pulse border border-slate-800" />
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
                className="group relative bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-slate-700 transition-all duration-200 flex flex-col"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-[#0B0F19] overflow-hidden relative flex items-center justify-center p-2">
                  <img
                    src={formatImageUrl(item.thumbnail_url || item.direct_url)}
                    alt={item.image.original_filename}
                    loading="lazy"
                    className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Favorite Heart Badge */}
                  <button
                    onClick={(e) => handleToggleFavorite(item.image.id, e)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-[#0B0F19]/80 text-white hover:text-rose-400 shadow transition-colors"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        item.image.is_favorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  {/* Hover overlay actions */}
                  <div className="absolute inset-0 bg-[#0B0F19]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    <button
                      onClick={(e) => copyToClipboard(item.direct_url, e)}
                      title="URL Kopyala"
                      className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-md transition-transform transform active:scale-95"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/i/${item.image.id}`);
                      }}
                      title="Görüntüle"
                      className="p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 shadow-md transition-transform transform active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.image.id, e)}
                      title="Sil"
                      className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 shadow-md transition-transform transform active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Meta Footer */}
                <div className="p-3 space-y-1.5 bg-[#0F172A] flex-1 flex flex-col justify-between">
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
                        className="w-full bg-[#0B0F19] border border-slate-800 text-slate-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none"
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
                className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={formatImageUrl(item.thumbnail_url || item.direct_url)}
                    alt={item.image.original_filename}
                    className="w-12 h-12 rounded-xl object-cover bg-[#0B0F19] shrink-0 border border-slate-800"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.image.original_filename}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatSize(item.image.size)} • {item.image.format.toUpperCase()} • {item.image.views || 0} görüntüleme
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleToggleFavorite(item.image.id, e)}
                    className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${item.image.is_favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => copyToClipboard(item.direct_url, e)}
                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(item.image.id, e)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
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
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
            <Upload className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">Resim Bulunamadı</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Seçtiğiniz filtreye uygun bir resim bulunamadı veya henüz resim yüklemediniz.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/yukle')}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 inline-flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Resim Yükle</span>
            </button>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-400" />
                <span>Yeni Klasör Oluştur</span>
              </h3>
              <button onClick={() => setShowFolderModal(false)} className="text-slate-400 hover:text-white p-1">
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
                  placeholder="Örn: Portfolyo, Sosyal Medya..."
                  className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
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

