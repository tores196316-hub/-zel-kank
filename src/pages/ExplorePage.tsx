import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  TrendingUp,
  Flame,
  Sparkles,
  Search,
  Heart,
  Eye,
  Download,
  Filter,
  User as UserIcon,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Share2,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { imageApi } from '../lib/api';
import { ImageMetadata } from '../types';
import { useAuth } from '../context/AuthContext';

interface ExplorePageProps {
  navigate: (path: string) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<'popular' | 'trending' | 'newest'>('trending');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [likingIds, setLikingIds] = useState<Record<string, boolean>>({});

  const fetchExplore = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await imageApi.getExplore({
        sort,
        format: selectedFormat !== 'all' ? selectedFormat : undefined,
        query: searchQuery.trim() || undefined,
        limit: 48,
      });
      setImages(res.images || []);
    } catch (err: any) {
      setError(err.message || 'Keşfet akışı yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplore();
  }, [sort, selectedFormat]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExplore();
  };

  const handleToggleLike = async (e: React.MouseEvent, image: ImageMetadata) => {
    e.stopPropagation();
    if (likingIds[image.id]) return;

    setLikingIds((prev) => ({ ...prev, [image.id]: true }));
    try {
      const res = await imageApi.toggleLike(image.id);
      setImages((prev) =>
        prev.map((img) => {
          if (img.id === image.id) {
            return {
              ...img,
              likes: res.likes_count,
              is_liked: res.liked,
            };
          }
          return img;
        })
      );
    } catch (err) {
      // ignore
    } finally {
      setLikingIds((prev) => ({ ...prev, [image.id]: false }));
    }
  };

  const formats = ['all', 'jpg', 'png', 'webp', 'gif'];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/20 border border-cyan-500/20 p-6 sm:p-8 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-32 -bottom-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide">
                <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
                <span>TOPLULUK & KEŞFET DUVARI</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                İlham Veren <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Görselleri Keşfedin</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
                Kullanıcılarımızın paylaştığı trend fotoğrafları inceleyin, beğenin, yaratıcı profillerini ziyaret edin veya kendi görsellerinizi paylaşın.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/yukle')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 transition-all duration-200 active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Görsel Paylaş</span>
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Sort Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
              <button
                onClick={() => setSort('trending')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sort === 'trending'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Trendler</span>
              </button>
              <button
                onClick={() => setSort('popular')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sort === 'popular'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>En Popüler</span>
              </button>
              <button
                onClick={() => setSort('newest')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sort === 'newest'
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>En Yeniler</span>
              </button>
            </div>

            {/* Format Filter Chips & Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Formats */}
              <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
                {formats.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`px-2.5 py-1 rounded-lg text-xs uppercase font-medium transition-all ${
                      selectedFormat === fmt
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {fmt === 'all' ? 'Tümü' : fmt}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Görsel veya yazar ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setTimeout(() => fetchExplore(), 0);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    ×
                  </button>
                )}
              </form>

              <button
                onClick={fetchExplore}
                title="Yenile"
                className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="inline-block p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 animate-pulse">
              <Compass className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
            <p className="text-slate-400 text-sm">Görseller yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-4 max-w-md mx-auto bg-red-950/20 border border-red-500/20 rounded-2xl p-8">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchExplore}
              className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition-all"
            >
              Tekrar Dene
            </button>
          </div>
        ) : images.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">Henüz Görsel Bulunamadı</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Arama kriterlerinize uygun herkese açık görsel bulunamadı veya henüz hiç paylaşım yapılmadı.
            </p>
            <button
              onClick={() => navigate('/yukle')}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs transition-all hover:bg-cyan-400"
            >
              İlk Görseli Sen Paylaş
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {images.map((img) => {
              const likesCount = img.likes || 0;
              const viewsCount = img.views || 0;
              const uploader = img.uploader_username || 'Anonim';

              return (
                <div
                  key={img.id}
                  onClick={() => navigate(`/i/${img.id}`)}
                  className="group relative rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 overflow-hidden shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Thumbnail Image */}
                  <div className="relative w-full aspect-[4/3] bg-slate-950 overflow-hidden">
                    <img
                      src={img.cloudinary_url}
                      alt={img.original_filename}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Format Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                      {img.format}
                    </div>

                    {/* Right-Click Protection Badge */}
                    {img.protect_copy && (
                      <div className="absolute top-2.5 right-2.5 p-1 rounded-md bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-400" title="Telif Korumalı Görsel">
                        <Shield className="w-3 h-3" />
                      </div>
                    )}

                    {/* Hover Overlay with Quick Stats & Actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between">
                      <div className="flex justify-end">
                        {/* Direct Like Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleLike(e, img)}
                          className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                            img.is_liked
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                              : 'bg-black/60 border-white/10 text-white hover:text-rose-400 hover:border-rose-500/40'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${img.is_liked ? 'fill-rose-500' : ''}`} />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-white truncate drop-shadow">
                          {img.original_filename}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            {viewsCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-rose-400" />
                            {likesCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Uploader info */}
                  <div className="p-3 bg-slate-900/90 flex items-center justify-between border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (img.uploader_username) {
                          navigate(`/profil/${encodeURIComponent(img.uploader_username)}`);
                        }
                      }}
                      className="flex items-center gap-2 group/author hover:text-cyan-400 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                        {uploader.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-300 group-hover/author:text-cyan-400 font-medium truncate max-w-[120px]">
                        @{uploader}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Heart className="w-3 h-3 text-slate-500" />
                      <span>{likesCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
