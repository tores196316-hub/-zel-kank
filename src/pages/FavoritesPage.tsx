import React, { useState, useEffect } from 'react';
import { Heart, Eye, ArrowLeft, Image as ImageIcon, Sparkles, Shield } from 'lucide-react';
import { imageApi } from '../lib/api';
import { ImageMetadata } from '../types';
import { useAuth } from '../context/AuthContext';

interface FavoritesPageProps {
  navigate: (path: string) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await imageApi.getFavorites();
      setImages(res.images || []);
    } catch (err: any) {
      setError(err.message || 'Favoriler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
              <span>BEĞENDİĞİM GÖRSELLER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Favori <span className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">Koleksiyonum</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Beğendiğiniz veya ilham almak için kaydettiğiniz tüm görseller burada toplanır.
            </p>
          </div>

          <button
            onClick={() => navigate('/kesfet')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-2 self-start"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Daha Fazla Görsel Keşfet</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-xs">Favoriler yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center bg-rose-950/20 border border-rose-500/20 rounded-2xl p-8 max-w-md mx-auto space-y-3">
            <p className="text-rose-400 text-xs">{error}</p>
            <button
              onClick={fetchFavorites}
              className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-semibold"
            >
              Tekrar Dene
            </button>
          </div>
        ) : images.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8 max-w-md mx-auto space-y-3">
            <Heart className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">Henüz Favori Görseliniz Yok</h3>
            <p className="text-xs text-slate-500">
              Keşfet akışındaki veya galerinizdeki görselleri beğenerek bu alanda toplayabilirsiniz.
            </p>
            <button
              onClick={() => navigate('/kesfet')}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
            >
              Keşfet'e Göz At
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => navigate(`/i/${img.id}`)}
                className="group relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 overflow-hidden shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="relative w-full aspect-[4/3] bg-slate-950 overflow-hidden">
                  <img
                    src={img.cloudinary_url}
                    alt={img.original_filename}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] uppercase font-bold text-slate-300 border border-white/10">
                    {img.format}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3.5 flex flex-col justify-end">
                    <p className="text-xs font-semibold text-white truncate drop-shadow">
                      {img.original_filename}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        {img.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500" />
                        {img.likes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
