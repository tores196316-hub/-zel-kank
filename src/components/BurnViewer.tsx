import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Flame, ShieldAlert, ArrowLeft, Clock, ShieldCheck, Eye } from 'lucide-react';
import { UploadResult } from '../types';
import { imageApi } from '../lib/api';
import { formatImageUrl } from '../lib/imageUrl';

interface BurnViewerProps {
  data: UploadResult & { is_owner: boolean };
  navigate: (path: string) => void;
}

export const BurnViewer: React.FC<BurnViewerProps> = ({ data, navigate }) => {
  const imageId = data.image.id;
  const sessionId = data.session_id || '';
  
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    data.expires_in_seconds && data.expires_in_seconds > 0 ? data.expires_in_seconds : 300
  );
  const [burned, setBurned] = useState(false);
  const [burning, setBurning] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasTriggeredBurnRef = useRef(false);

  // Trigger burn action
  const executeBurn = useCallback(async (redirectHome = false) => {
    if (hasTriggeredBurnRef.current) return;
    hasTriggeredBurnRef.current = true;
    setBurning(true);

    try {
      await imageApi.completeBurnSession(imageId, sessionId);
    } catch (e) {
      // Ignored
    } finally {
      setBurning(false);
      setBurned(true);
      if (redirectHome) {
        navigate('/');
      }
    }
  }, [imageId, sessionId, navigate]);

  // Periodic heartbeat & leave listeners
  useEffect(() => {
    if (burned) return;

    // 1. Heartbeat interval every 4 seconds
    const heartbeatInterval = setInterval(() => {
      if (sessionId && !hasTriggeredBurnRef.current) {
        imageApi.sendBurnHeartbeat(imageId, sessionId).catch(() => {
          // If heartbeat fails because session expired
          setBurned(true);
        });
      }
    }, 4000);

    // 2. Countdown timer every 1 second
    const countdownInterval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          executeBurn(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 3. Browser leave event handlers (pagehide, beforeunload, visibilitychange)
    const handleLeave = () => {
      if (!hasTriggeredBurnRef.current) {
        hasTriggeredBurnRef.current = true;
        imageApi.completeBurnSession(imageId, sessionId);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !hasTriggeredBurnRef.current) {
        // When tab is hidden/switched or browser minimized
        hasTriggeredBurnRef.current = true;
        imageApi.completeBurnSession(imageId, sessionId);
        setBurned(true);
      }
    };

    window.addEventListener('pagehide', handleLeave);
    window.addEventListener('beforeunload', handleLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(countdownInterval);
      window.removeEventListener('pagehide', handleLeave);
      window.removeEventListener('beforeunload', handleLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // On unmount
      if (!hasTriggeredBurnRef.current) {
        hasTriggeredBurnRef.current = true;
        imageApi.completeBurnSession(imageId, sessionId);
      }
    };
  }, [imageId, sessionId, burned, executeBurn]);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (burned) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20 shadow-xl shadow-rose-500/10">
          <Flame className="w-10 h-10 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Görsel Kalıcı Olarak İmha Edildi</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Tek kullanımlık görüntüleme oturumu tamamlandı. Bu görsel sunuculardan, yerel depolamadan ve veritabanından kalıcı olarak silindi. Tekrar erişilemez.
          </p>
        </div>
        <div className="pt-4">
          <button
            onClick={() => navigate('/')}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfaya Dön</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6 animate-in fade-in select-none">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">Güvenli Tek Görüntüleme Oturumu</h1>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-extrabold tracking-wide uppercase border border-rose-500/30">
                1 Kullanımlık
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Bu pencere kapatıldığında görsel kalıcı olarak silinir.
            </p>
          </div>
        </div>

        {/* Countdown & Action */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-amber-300 text-xs font-mono font-bold shadow-inner">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => executeBurn(true)}
            disabled={burning}
            className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Görseli anında sil ve çık"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{burning ? 'İmha Ediliyor...' : 'İmha Et & Çık'}</span>
          </button>
        </div>
      </div>

      {/* Main Image Protected Viewer Box */}
      <div 
        className="relative rounded-3xl bg-[#090D16] border border-slate-800/90 p-4 sm:p-8 flex flex-col items-center justify-center min-h-[380px] sm:min-h-[500px] shadow-2xl overflow-hidden"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Invisible Overlay Shield to completely block right click, drag, and mobile long-press */}
        <div
          className="absolute inset-0 z-20 select-none bg-transparent cursor-default"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />

        {/* Loading Spinner */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#090D16] z-10">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Görsel güvenli akışla yükleniyor...</span>
          </div>
        )}

        {/* Image Error Fallback */}
        {imageError && (
          <div className="text-center space-y-3 py-12 z-10">
            <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
            <p className="text-sm font-bold text-white">Görsel yüklenemedi veya daha önce imha edilmiş.</p>
            <button
              onClick={() => navigate('/')}
              className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ana Sayfaya Dön</span>
            </button>
          </div>
        )}

        {/* Protected Image */}
        {!imageError && (
          <div className="relative max-w-full flex items-center justify-center">
            <img
              src={formatImageUrl(data.direct_url)}
              alt="IMGIVO Güvenli Tek Görüntüleme Görseli"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className="max-h-[600px] w-auto max-w-full object-contain rounded-2xl select-none pointer-events-none transition-opacity duration-300"
              style={{
                WebkitTouchCallout: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                pointerEvents: 'none',
              }}
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Security Warning & Guidance Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs sm:text-sm font-medium flex items-start gap-3 shadow-md">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-200">
            ⚠️ Bu görsel yalnızca bir kez görüntülenebilir.
          </p>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            Görseli inceledikten sonra sayfayı kapattığınızda, yenilediğinizde veya geri gittiğinizde görsel sunuculardan kalıcı olarak imha edilecektir. Doğrudan indirme ve kopyalama bağlantıları güvenlik nedeniyle devre dışı bırakılmıştır.
          </p>
        </div>
      </div>

      {/* Footer Manual Finish Action */}
      <div className="text-center pt-2">
        <button
          onClick={() => executeBurn(true)}
          disabled={burning}
          className="min-h-[44px] px-8 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-rose-600/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Flame className="w-4 h-4" />
          <span>Görseli İnceledim, Hemen İmha Et</span>
        </button>
      </div>
    </div>
  );
};
