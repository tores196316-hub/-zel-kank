import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, X, Check, Copy, ExternalLink, Image as ImageIcon, AlertCircle, 
  FileCheck, RefreshCw, Layers, Folder as FolderIcon, Camera, Ban, 
  RotateCcw, Sparkles, Sliders, Lock, Clock, Flame, Shield, Key,
  Globe, Compass, EyeOff
} from 'lucide-react';
import { imageApi, getStoredToken } from '../lib/api';
import { Folder, UploadProgressFile, UploadResult } from '../types';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { formatImageUrl } from '../lib/imageUrl';
import { ImageEditorModal } from '../components/ImageEditorModal';

interface UploadPageProps {
  navigate: (path: string) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [filesList, setFilesList] = useState<UploadProgressFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [completedResults, setCompletedResults] = useState<UploadResult[]>([]);

  // Security & Expiration settings
  const [uploadPassword, setUploadPassword] = useState<string>('');
  const [uploadExpiration, setUploadExpiration] = useState<string>('none');
  const [isPasswordOpen, setIsPasswordOpen] = useState<boolean>(false);
  const [showInExplore, setShowInExplore] = useState<boolean>(true);

  // Editor Modal state
  const [editingFile, setEditingFile] = useState<UploadProgressFile | null>(null);

  const isLoggedIn = !!getStoredToken();
  const isGuestUploadAllowed = settings ? settings.allow_guest_upload !== false : true;

  useEffect(() => {
    if (isLoggedIn) {
      imageApi
        .getFolders()
        .then((data) => setFolders(data.folders || []))
        .catch(() => {});
    }
  }, [isLoggedIn]);

  // Paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (completedResults.length > 0) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) pastedFiles.push(blob);
        }
      }

      if (pastedFiles.length > 0) {
        showToast('Panodan resim eklendi.', 'info');
        handleFileSelect(pastedFiles as unknown as FileList);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [completedResults.length]);

  const handleFileSelect = (selectedFiles: FileList | File[] | null) => {
    if (!selectedFiles || (selectedFiles as any).length === 0) return;

    if (!isLoggedIn && !isGuestUploadAllowed) {
      showToast('Anonim yükleme şu anda devre dışı. Resim yüklemek için lütfen giriş yapın.', 'error');
      return;
    }

    const newFiles: UploadProgressFile[] = [];
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    Array.from(selectedFiles as any).forEach((file: any) => {
      const ext = file.name ? file.name.split('.').pop()?.toLowerCase() || '' : 'png';

      if (!validExtensions.includes(ext) && file.type && !file.type.startsWith('image/')) {
        showToast(`"${file.name || 'Resim'}" desteklenmeyen bir dosya türüdür.`, 'error');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        showToast(`"${file.name || 'Resim'}" 20 MB sınırını aşıyor.`, 'error');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newFiles.push({
        file,
        id: Math.random().toString(36).substring(2, 9),
        progress: 0,
        status: 'pending',
        previewUrl,
      });
    });

    setFilesList((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFilesList((prev) => prev.filter((f) => f.id !== id));
  };

  const cancelUpload = (id: string) => {
    setFilesList((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          if (f.abortController) f.abortController.abort();
          return { ...f, status: 'cancelled', error_message: 'Yükleme iptal edildi.' };
        }
        return f;
      })
    );
    showToast('Yükleme iptal edildi.', 'info');
  };

  const handleEditorSave = (editedFile: File, newPreviewUrl: string) => {
    if (!editingFile) return;

    setFilesList((prev) =>
      prev.map((item) => {
        if (item.id === editingFile.id) {
          return {
            ...item,
            file: editedFile,
            previewUrl: newPreviewUrl,
          };
        }
        return item;
      })
    );

    showToast('Resim düzenlemesi uygulandı.', 'success');
    setEditingFile(null);
  };

  const uploadSingleFile = async (item: UploadProgressFile, targetFolder: string | null): Promise<UploadResult> => {
    const xhrRef: { current: XMLHttpRequest | null } = { current: null };

    setFilesList((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 5 } : f))
    );

    try {
      const uploadRes = await imageApi.uploadFile(
        item.file,
        (percent) => {
          setFilesList((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, progress: percent, status: percent >= 95 ? 'processing' : 'uploading' }
                : f
            )
          );
        },
        targetFolder,
        xhrRef,
        {
          password: uploadPassword.trim() || undefined,
          expiration: uploadExpiration,
          is_public: showInExplore,
        }
      );

      setFilesList((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: 'completed', progress: 100, result: uploadRes } : f
        )
      );

      return uploadRes;
    } catch (err: any) {
      setFilesList((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'error', error_message: err.message || 'Yükleme başarısız' }
            : f
        )
      );
      throw err;
    }
  };

  const startBatchUpload = async () => {
    if (filesList.length === 0) return;

    setIsUploading(true);
    const results: UploadResult[] = [];
    const targetFolder = selectedFolderId || null;

    for (const item of filesList) {
      if (item.status === 'completed' && item.result) {
        results.push(item.result);
        continue;
      }
      if (item.status === 'cancelled') continue;

      try {
        const res = await uploadSingleFile(item, targetFolder);
        results.push(res);
      } catch (err) {
        // Continue next file
      }
    }

    setIsUploading(false);
    setCompletedResults(results);

    if (results.length > 0) {
      showToast(`${results.length} resim başarıyla yüklendi!`, 'success');
      refreshUser().catch(() => {});
    }
  };

  const retrySingle = async (item: UploadProgressFile) => {
    try {
      const res = await uploadSingleFile(item, selectedFolderId || null);
      setCompletedResults((prev) => [...prev, res]);
      showToast(`"${item.file.name}" yüklendi!`, 'success');
      refreshUser().catch(() => {});
    } catch (err) {}
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} panoya kopyalandı!`, 'success');
  };

  const resetUpload = () => {
    setFilesList([]);
    setCompletedResults([]);
    setUploadPassword('');
    setUploadExpiration('none');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Işık Hızında & Güvenli Medya Yükleme</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Hızlı Resim Yükleme</h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Dosyalarınızı sürükleyin, panodan yapıştırın (Ctrl+V) veya galerinizden seçin. Yüklemeden önce dilediğiniz gibi düzenleyebilirsiniz!
        </p>
      </div>

      {/* Upload Setup Bar */}
      {completedResults.length === 0 && (
        <div className="space-y-6">
          
          {/* Guest Upload Disabled Notice */}
          {!isLoggedIn && !isGuestUploadAllowed && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-white text-xs sm:text-sm block">Misafir Yüklemesi Devre Dışı</span>
                  <span className="text-[11px] sm:text-xs text-amber-200/80 leading-relaxed block">
                    Anonim resim yükleme şu anda kapalıdır. Resim yüklemek için lütfen giriş yapın veya ücretsiz hesap oluşturun.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/giris')}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/kayit')}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
                >
                  Kayıt Ol
                </button>
              </div>
            </div>
          )}

          {/* Target Folder Selection (if logged in and user has folders) */}
          {isLoggedIn && folders.length > 0 && (
            <div className="bg-[#0A1020] border border-slate-800 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <FolderIcon className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Hedef Klasör:</span>
              </div>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="bg-[#070B14] text-slate-200 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
              >
                <option value="">Klasörsüz (Genel Galeri)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-500/10 shadow-2xl shadow-cyan-500/20'
                : 'border-slate-800 bg-[#0A1020]/90 hover:border-slate-700 hover:bg-[#0F172A]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files)}
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={(e) => handleFileSelect(e.target.files)}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/25 shadow-sm">
                <Upload className="w-8 h-8" />
              </div>

              <div>
                <p className="text-sm sm:text-base font-bold text-white">
                  Resimleri buraya sürükleyin veya <span className="text-sky-400 underline">göz atın</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Birden fazla dosya seçebilir veya panodan doğrudan yapıştırabilirsiniz (Ctrl+V)
                </p>
              </div>

              {/* Action Buttons: Desktop Browse + Mobile Camera */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[48px] px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Fotoğraf Seç</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="min-h-[48px] px-6 py-3 rounded-2xl bg-[#0F172A] hover:bg-[#131D2F] text-slate-200 border border-slate-800 font-semibold text-xs shadow-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Kamera ile Çek</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                {['JPG', 'PNG', 'WEBP', 'GIF'].map((ext) => (
                  <span key={ext} className="px-2.5 py-1 rounded-md bg-[#070B14] text-[10px] font-mono text-slate-400 border border-slate-800">
                    .{ext}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Paylaşım Ayarları (V5 Midnight Redesign) */}
          <div className="bg-[#0A1020] border border-slate-800/80 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Paylaşım Ayarları</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Resmin bağlantısını ne kadar süreyle ve nasıl paylaşmak istediğini seç.
              </p>
            </div>

            {/* 4 Modern Selectable Cards (2 columns on mobile, 4 on desktop) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              {/* 1. Normal Paylaşım */}
              <button
                type="button"
                onClick={() => {
                  setUploadExpiration('none');
                  setUploadPassword('');
                  setIsPasswordOpen(false);
                }}
                className={`p-3 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer min-h-[110px] sm:min-h-[120px] ${
                  uploadExpiration === 'none' && !uploadPassword && !isPasswordOpen
                    ? 'bg-cyan-950/20 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'bg-[#070B14] border-slate-800 hover:border-slate-700 hover:bg-[#0C1222]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    uploadExpiration === 'none' && !uploadPassword && !isPasswordOpen
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-slate-800/60 text-slate-400'
                  }`}>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  {uploadExpiration === 'none' && !uploadPassword && !isPasswordOpen && (
                    <div className="w-4 h-4 rounded-full bg-cyan-500 text-black flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className={`text-xs font-bold ${
                    uploadExpiration === 'none' && !uploadPassword && !isPasswordOpen ? 'text-cyan-300' : 'text-white'
                  }`}>
                    Normal Paylaşım
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 leading-tight">
                    Resmin bağlantısı normal şekilde kullanılabilir.
                  </p>
                </div>
              </button>

              {/* 2. 1 Görüntüleme Sonrası İmha */}
              <button
                type="button"
                onClick={() => {
                  setUploadExpiration('1view');
                }}
                className={`p-3 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer min-h-[110px] sm:min-h-[120px] ${
                  uploadExpiration === '1view'
                    ? 'bg-rose-950/25 border-rose-500/60 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/30'
                    : 'bg-[#070B14] border-slate-800 hover:border-slate-700 hover:bg-[#0C1222]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    uploadExpiration === '1view'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-slate-800/60 text-slate-400'
                  }`}>
                    <Flame className={`w-4 h-4 ${uploadExpiration === '1view' ? 'animate-pulse' : ''}`} />
                  </div>
                  {uploadExpiration === '1view' ? (
                    <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      TEK
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <p className={`text-xs font-bold ${
                      uploadExpiration === '1view' ? 'text-rose-300' : 'text-white'
                    }`}>
                      1 Görüntüleme
                    </p>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 leading-tight">
                    Resim bir kez görüntülendikten sonra kalıcı olarak silinir.
                  </p>
                </div>
              </button>

              {/* 3. Süreli Paylaşım */}
              <button
                type="button"
                onClick={() => {
                  if (uploadExpiration === 'none' || uploadExpiration === '1view') {
                    setUploadExpiration('24h');
                  }
                }}
                className={`p-3 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer min-h-[110px] sm:min-h-[120px] ${
                  ['10m', '1h', '24h', '7d', '30d'].includes(uploadExpiration)
                    ? 'bg-sky-950/20 border-sky-500/60 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30'
                    : 'bg-[#070B14] border-slate-800 hover:border-slate-700 hover:bg-[#0C1222]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    ['10m', '1h', '24h', '7d', '30d'].includes(uploadExpiration)
                      ? 'bg-sky-500/20 text-sky-400'
                      : 'bg-slate-800/60 text-slate-400'
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  {['10m', '1h', '24h', '7d', '30d'].includes(uploadExpiration) && (
                    <div className="w-4 h-4 rounded-full bg-sky-500 text-black flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className={`text-xs font-bold ${
                    ['10m', '1h', '24h', '7d', '30d'].includes(uploadExpiration) ? 'text-sky-300' : 'text-white'
                  }`}>
                    Süreli Paylaşım
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 leading-tight">
                    Resim belirlediğin sürenin sonunda otomatik olarak silinir.
                  </p>
                </div>
              </button>

              {/* 4. Şifreli Paylaşım */}
              <button
                type="button"
                onClick={() => {
                  setIsPasswordOpen((prev) => !prev);
                }}
                className={`p-3 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer min-h-[110px] sm:min-h-[120px] ${
                  uploadPassword || isPasswordOpen
                    ? 'bg-amber-950/20 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : 'bg-[#070B14] border-slate-800 hover:border-slate-700 hover:bg-[#0C1222]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    uploadPassword || isPasswordOpen
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800/60 text-slate-400'
                  }`}>
                    <Key className="w-4 h-4" />
                  </div>
                  {uploadPassword ? (
                    <div className="w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : isPasswordOpen ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      AÇIK
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className={`text-xs font-bold ${
                    uploadPassword || isPasswordOpen ? 'text-amber-300' : 'text-white'
                  }`}>
                    Şifre Koy
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-2 leading-tight">
                    Resmi görüntülemek için şifre gerektir.
                  </p>
                </div>
              </button>
            </div>

            {/* Contextual Info & Control Panels */}
            
            {/* A) Burn After Reading Notice Banner */}
            {uploadExpiration === '1view' && (
              <div className="p-3.5 rounded-2xl bg-rose-950/25 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-in fade-in duration-200">
                <Flame className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <p className="font-bold text-rose-200">🔥 Tek kullanımlık bağlantı</p>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">
                    Bu resim yalnızca bir kez görüntülenebilir. Görüntüleme oturumu sona erdiğinde resim kalıcı olarak imha edilir.
                  </p>
                </div>
              </div>
            )}

            {/* B) Timed Expiration Selector Pills */}
            {['10m', '1h', '24h', '7d', '30d'].includes(uploadExpiration) && (
              <div className="p-3.5 rounded-2xl bg-[#070B14] border border-sky-500/30 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Otomatik Silinme Süresi:</span>
                  </span>
                  <span className="text-[11px] font-mono text-sky-400 font-bold">
                    {uploadExpiration === '10m' && '10 Dakika'}
                    {uploadExpiration === '1h' && '1 Saat'}
                    {uploadExpiration === '24h' && '24 Saat'}
                    {uploadExpiration === '7d' && '7 Gün'}
                    {uploadExpiration === '30d' && '30 Gün'}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { id: '10m', label: '10 dk' },
                    { id: '1h', label: '1 saat' },
                    { id: '24h', label: '24 saat' },
                    { id: '7d', label: '7 gün' },
                    { id: '30d', label: '30 gün' },
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setUploadExpiration(dur.id)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        uploadExpiration === dur.id
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-1 ring-sky-400'
                          : 'bg-[#0B0F19] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* C) Password Input Field */}
            {(isPasswordOpen || uploadPassword) && (
              <div className="p-3.5 rounded-2xl bg-[#070B14] border border-amber-500/30 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Görsel Erişim Şifresi</span>
                  </label>
                  {uploadPassword && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadPassword('');
                        setIsPasswordOpen(false);
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
                    >
                      Şifreyi İptal Et
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={uploadPassword}
                  onChange={(e) => setUploadPassword(e.target.value)}
                  placeholder="Görseli açmak için gereken şifreyi girin..."
                  className="w-full bg-[#0A1020] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 focus:outline-none"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400">
                  Resim linkini açan kişilerden bu şifreyi girmeleri istenecektir.
                </p>
              </div>
            )}

            {/* D) Keşfet & Topluluk Görünürlüğü Toggle Switch */}
            <div className={`p-4 rounded-2xl border transition-all duration-200 ${
              showInExplore
                ? 'bg-gradient-to-r from-blue-950/30 via-[#0C1222] to-cyan-950/20 border-cyan-500/40 ring-1 ring-cyan-500/20'
                : 'bg-[#070B14] border-slate-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    showInExplore
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {showInExplore ? <Compass className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white">
                        Keşfet Duvarında Göster
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        showInExplore
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {showInExplore ? 'HERKESE AÇIK' : 'ÖZEL / GİZLİ'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-xl leading-relaxed">
                      {showInExplore
                        ? 'Resminiz topluluk Keşfet akışında ve genel aramalarda yayınlanır. Herkes görebilir ve beğenebilir.'
                        : '🔒 Gizli Tut: Resminiz Keşfet sayfasına ve arama sonuçlarına KESİNLİKLE düşmez. Yalnızca doğrudan bağlantıyı paylaştığınız kişiler açabilir.'}
                    </p>
                  </div>
                </div>

                {/* Modern Switch Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowInExplore((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-end sm:self-center ${
                    showInExplore ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={showInExplore}
                  title="Keşfet görünürlüğünü aç/kapat"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showInExplore ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Selected Files Progress List */}
          {filesList.length > 0 && (
            <div className="bg-[#0A1020] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Seçilen Resimler ({filesList.length})</span>
                </div>
                {!isUploading && (
                  <button
                    onClick={resetUpload}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Listeyi Temizle
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {filesList.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0B0F19] border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-200 truncate">{item.file.name}</p>
                        <p className="text-[11px] text-slate-400">{formatSize(item.file.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Status Badges */}
                      {item.status === 'pending' && (
                        <span className="text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800/80">Bekliyor</span>
                      )}

                      {(item.status === 'uploading' || item.status === 'processing') && (
                        <div className="flex items-center gap-2 w-36">
                          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
                            <div
                              className="bg-blue-500 h-full transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="text-blue-400 font-mono text-[11px] font-bold">
                            {item.status === 'processing' ? 'İşleniyor' : `%${item.progress}`}
                          </span>
                        </div>
                      )}

                      {item.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          <Check className="w-3.5 h-3.5" /> Yüklendi
                        </span>
                      )}

                      {item.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          <Ban className="w-3.5 h-3.5" /> İptal
                        </span>
                      )}

                      {item.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20" title={item.error_message}>
                          <AlertCircle className="w-3.5 h-3.5" /> {item.error_message || 'Hata'}
                        </span>
                      )}

                      {/* Actions: Edit / Cancel / Delete */}
                      <div className="flex items-center gap-1.5">
                        {!isUploading && item.status === 'pending' && (
                          <button
                            onClick={() => setEditingFile(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer border border-blue-500/30"
                            title="Resmi Kırp, Filtrele veya Boyutlandır"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Düzenle</span>
                          </button>
                        )}

                        {item.status === 'uploading' && (
                          <button
                            onClick={() => cancelUpload(item.id)}
                            className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                            title="Yüklemeyi İptal Et"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {(item.status === 'error' || item.status === 'cancelled') && !isUploading && (
                          <button
                            onClick={() => retrySingle(item)}
                            className="p-1.5 rounded-lg bg-slate-800 text-blue-400 hover:bg-blue-500/20 flex items-center gap-1 text-[11px] cursor-pointer"
                            title="Tekrar Dene"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Tekrar
                          </button>
                        )}

                        {!isUploading && item.status !== 'completed' && (
                          <button
                            onClick={() => removeFile(item.id)}
                            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                            title="Listeden Kaldır"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={startBatchUpload}
                  disabled={isUploading || filesList.length === 0}
                  className="w-full min-h-[48px] py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:from-slate-800 disabled:to-slate-850 text-white font-bold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Yükleniyor ve İşleniyor...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Seçilen Resimleri Yükle</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete Results View with Share Links */}
      {completedResults.length > 0 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between text-emerald-400 text-sm">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              <span className="font-bold">{completedResults.length} resim başarıyla yüklendi!</span>
            </div>
            <button
              onClick={resetUpload}
              className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold cursor-pointer"
            >
              Yeni Yükleme Yap
            </button>
          </div>

          <div className="space-y-6">
            {completedResults.map((res) => (
              <div
                key={res.image.id}
                className="bg-[#0A1020] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  {/* Image Preview Box */}
                  <div className="space-y-3 text-center md:text-left">
                    <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-[#070B14] aspect-video md:aspect-square flex items-center justify-center">
                      {res.is_one_time_view ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 text-rose-400">
                          <Flame className="w-10 h-10 animate-pulse" />
                          <span className="text-xs font-bold">Tek Kullanımlık Görsel</span>
                          <span className="text-[10px] text-slate-400">Alıcı linki açtığında görüntülenecek</span>
                        </div>
                      ) : (
                        <img
                          src={formatImageUrl(res.thumbnail_url || res.direct_url)}
                          alt={res.image.original_filename}
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate">{res.image.original_filename}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {res.image.width} x {res.image.height} px • {formatSize(res.image.size)} • {res.image.format.toUpperCase()}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {res.image.is_public ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                            <Globe className="w-3 h-3 text-cyan-400" />
                            <span>Keşfet'te Yayında</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            <EyeOff className="w-3 h-3 text-amber-400" />
                            <span>Gizli Paylaşım</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-1 flex items-center justify-center md:justify-start gap-2">
                      <button
                        onClick={() => navigate(`/i/${res.image.id}`)}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#131D2F] border border-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                        <span>Görsel Sayfası</span>
                      </button>
                    </div>
                  </div>

                  {/* Share Codes Box */}
                  <div className="md:col-span-2 space-y-3.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {res.is_one_time_view ? 'Güvenli Paylaşım Bağlantısı' : 'Paylaşım Kodları & Bağlantılar'}
                    </h3>

                    {res.is_one_time_view ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 font-medium">Tek Görüntüleme Bağlantısı (1 Kullanımlık)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={res.share_url}
                              className="flex-1 bg-[#070B14] border border-rose-500/30 rounded-xl px-3.5 py-2 text-xs text-rose-300 font-mono focus:outline-none"
                            />
                            <button
                              onClick={() => copyToClipboard(res.share_url, 'Güvenli Paylaşım URL')}
                              className="min-h-[38px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer active:scale-95"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Kopyala</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
                          🔥 <strong>Önemli Güvenlik Notu:</strong> Bu bağlantı alıcı tarafından bir kez açılıp kapatıldığında görsel kalıcı olarak imha edilecektir. Doğrudan CDN bağlantıları ve HTML gömme kodları güvenlik nedeniyle bu modda üretilmez.
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Direct Image Link */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 font-medium">Direkt Resim Bağlantısı (CDN)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={res.direct_url}
                              className="flex-1 bg-[#070B14] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                            />
                            <button
                              onClick={() => copyToClipboard(res.direct_url, 'Direkt URL')}
                              className="min-h-[38px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer active:scale-95"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Kopyala</span>
                            </button>
                          </div>
                        </div>

                        {/* Share Page Link */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 font-medium">Sayfa Bağlantısı</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={res.share_url}
                              className="flex-1 bg-[#070B14] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                            />
                            <button
                              onClick={() => copyToClipboard(res.share_url, 'Sayfa URL')}
                              className="min-h-[38px] px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#131D2F] border border-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer active:scale-95"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Kopyala</span>
                            </button>
                          </div>
                        </div>

                        {/* HTML Code */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 font-medium">HTML Gömme Kodu</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={res.html_code}
                              className="flex-1 bg-[#070B14] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                            />
                            <button
                              onClick={() => copyToClipboard(res.html_code, 'HTML Kodu')}
                              className="min-h-[38px] px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#131D2F] border border-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer active:scale-95"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Kopyala</span>
                            </button>
                          </div>
                        </div>

                        {/* Forum / BBCode */}
                        <div className="space-y-1">
                          <label className="text-[11px] text-slate-400 font-medium">Forum / BBCode (Tam Boyut)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={res.bbcode}
                              className="flex-1 bg-[#070B14] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                            />
                            <button
                              onClick={() => copyToClipboard(res.bbcode, 'BBCode')}
                              className="min-h-[38px] px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#131D2F] border border-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer active:scale-95"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Kopyala</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              onClick={resetUpload}
              className="w-full sm:w-auto min-h-[44px] px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Yeni Resim Yükle</span>
            </button>
            <button
              onClick={() => navigate('/galerim')}
              className="w-full sm:w-auto min-h-[44px] px-7 py-3 rounded-2xl bg-[#0A1020] hover:bg-[#131D2F] text-slate-200 font-semibold text-xs sm:text-sm border border-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <span>Galerime Git</span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded Image Editor Modal */}
      {editingFile && (
        <ImageEditorModal
          isOpen={!!editingFile}
          onClose={() => setEditingFile(null)}
          imageUrl={editingFile.previewUrl || ''}
          fileName={editingFile.file.name}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
};


