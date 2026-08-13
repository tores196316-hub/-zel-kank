import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, Copy, ExternalLink, Image as ImageIcon, AlertCircle, FileCheck, RefreshCw, Layers, Folder as FolderIcon, Camera, Ban, RotateCcw, Sparkles } from 'lucide-react';
import { imageApi, getStoredToken } from '../lib/api';
import { Folder, UploadProgressFile, UploadResult } from '../types';
import { useToast } from '../components/Toast';

interface UploadPageProps {
  navigate: (path: string) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ navigate }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [filesList, setFilesList] = useState<UploadProgressFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [completedResults, setCompletedResults] = useState<UploadResult[]>([]);

  const isLoggedIn = !!getStoredToken();

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
        xhrRef
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
    }
  };

  const retrySingle = async (item: UploadProgressFile) => {
    try {
      const res = await uploadSingleFile(item, selectedFolderId || null);
      setCompletedResults((prev) => [...prev, res]);
      showToast(`"${item.file.name}" yüklendi!`, 'success');
    } catch (err) {}
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} panoya kopyalandı!`, 'success');
  };

  const resetUpload = () => {
    setFilesList([]);
    setCompletedResults([]);
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Hızlı Resim Yükleme</h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
          Dosyalarınızı sürükleyin, panodan yapıştırın (Ctrl+V) veya galerinizden seçin. (Tek dosya maks. 20 MB)
        </p>
      </div>

      {/* Upload Setup Bar */}
      {completedResults.length === 0 && (
        <div className="space-y-6">
          {isLoggedIn && folders.length > 0 && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <FolderIcon className="w-4 h-4 text-blue-400" />
                <span>Yüklenecek Klasör:</span>
              </div>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full sm:w-auto bg-[#0B0F19] text-slate-200 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Klasörsüz (Tüm Resimler)</option>
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
            className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700/80 bg-[#0F172A]/70 hover:border-slate-600 hover:bg-[#0F172A]'
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
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-sm">
                <Upload className="w-8 h-8" />
              </div>

              <div>
                <p className="text-sm sm:text-base font-bold text-white">
                  Resimleri buraya sürükleyin veya <span className="text-blue-400 underline">göz atın</span>
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
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all active:scale-95"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Fotoğraf Seç</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs shadow-sm flex items-center gap-2 transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Kamera ile Çek</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                {['JPG', 'PNG', 'WEBP', 'GIF'].map((ext) => (
                  <span key={ext} className="px-2.5 py-1 rounded-md bg-[#0B0F19] text-[10px] font-mono text-slate-400 border border-slate-800">
                    .{ext}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Files Progress List */}
          {filesList.length > 0 && (
            <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Seçilen Resimler ({filesList.length})</span>
                </div>
                {!isUploading && (
                  <button
                    onClick={resetUpload}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
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

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
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

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {item.status === 'uploading' && (
                          <button
                            onClick={() => cancelUpload(item.id)}
                            className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20"
                            title="Yüklemeyi İptal Et"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {(item.status === 'error' || item.status === 'cancelled') && !isUploading && (
                          <button
                            onClick={() => retrySingle(item)}
                            className="p-1.5 rounded-lg bg-slate-800 text-blue-400 hover:bg-blue-500/20 flex items-center gap-1 text-[11px]"
                            title="Tekrar Dene"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Tekrar
                          </button>
                        )}

                        {!isUploading && item.status !== 'completed' && (
                          <button
                            onClick={() => removeFile(item.id)}
                            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800"
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
                  className="w-full min-h-[48px] py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-sm shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Yükleniyor...</span>
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
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold"
            >
              Yeni Yükleme Yap
            </button>
          </div>

          <div className="space-y-6">
            {completedResults.map((res) => (
              <div
                key={res.image.id}
                className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  {/* Image Preview Box */}
                  <div className="space-y-3 text-center md:text-left">
                    <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-[#0B0F19] aspect-video md:aspect-square flex items-center justify-center">
                      <img
                        src={res.thumbnail_url || res.direct_url}
                        alt={res.image.original_filename}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate">{res.image.original_filename}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {res.image.width} x {res.image.height} px • {formatSize(res.image.size)} • {res.image.format.toUpperCase()}
                      </p>
                    </div>
                    <div className="pt-1 flex items-center justify-center md:justify-start gap-2">
                      <button
                        onClick={() => navigate(`/i/${res.image.id}`)}
                        className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Detay Sayfası</span>
                      </button>
                    </div>
                  </div>

                  {/* Share Codes Box */}
                  <div className="md:col-span-2 space-y-3.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Paylaşım Kodları & Bağlantılar
                    </h3>

                    {/* Direct Image Link */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-medium">Direkt Resim Bağlantısı (CDN)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={res.direct_url}
                          className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(res.direct_url, 'Direkt URL')}
                          className="min-h-[38px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
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
                          className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(res.share_url, 'Sayfa URL')}
                          className="min-h-[38px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
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
                          className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(res.html_code, 'HTML Kodu')}
                          className="min-h-[38px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
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
                          className="flex-1 bg-[#0B0F19] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(res.bbcode, 'BBCode')}
                          className="min-h-[38px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Kopyala</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              onClick={resetUpload}
              className="w-full sm:w-auto min-h-[44px] px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Yeni Resim Yükle</span>
            </button>
            <button
              onClick={() => navigate('/galerim')}
              className="w-full sm:w-auto min-h-[44px] px-7 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span>Galerime Git</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

