import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, Copy, ExternalLink, Image as ImageIcon, AlertCircle, FileCheck, RefreshCw, Layers, Folder as FolderIcon, Camera, Ban, RotateCcw } from 'lucide-react';
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

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: UploadProgressFile[] = [];
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    Array.from(selectedFiles).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (!validExtensions.includes(ext)) {
        showToast(`"${file.name}" desteklenmeyen bir dosya türüdür.`, 'error');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        showToast(`"${file.name}" 20 MB sınırını aşıyor.`, 'error');
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Hızlı & Güvenli Resim Yükle</h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Resimlerinizi sürükleyip bırakın, galerinizden seçin veya kameranızla çekin. (Maksimum 20 MB)
        </p>
      </div>

      {/* Upload Setup Bar */}
      {completedResults.length === 0 && (
        <div className="space-y-6">
          {isLoggedIn && folders.length > 0 && (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                <FolderIcon className="w-4 h-4 text-blue-400" />
                <span>Yüklenecek Klasörü Seçin:</span>
              </div>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full sm:w-auto bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500"
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
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60'
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
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-inner">
                <Upload className="w-8 h-8" />
              </div>

              <div>
                <p className="text-base font-semibold text-white">
                  Resimlerinizi buraya sürükleyin ya da <span className="text-blue-400 underline">dosya seçin</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Birden fazla resmi aynı anda seçebilirsiniz
                </p>
              </div>

              {/* Action Buttons: Desktop Browse + Mobile Camera */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <ImageIcon className="w-4 h-4" />
                  Galeri'den Seç
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  Fotoğraf Çek
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {['JPG', 'PNG', 'WEBP', 'GIF'].map((ext) => (
                  <span key={ext} className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700">
                    .{ext}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Files Progress List */}
          {filesList.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Seçilen Resimler ({filesList.length})</span>
                </div>
                {!isUploading && (
                  <button
                    onClick={resetUpload}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                  >
                    <X className="w-3.5 h-3.5" />
                    Listeyi Temizle
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filesList.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-700"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-200 truncate">{item.file.name}</p>
                        <p className="text-[11px] text-slate-400">{formatSize(item.file.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      {/* Status Badges */}
                      {item.status === 'pending' && (
                        <span className="text-slate-400 font-medium">Bekliyor</span>
                      )}

                      {(item.status === 'uploading' || item.status === 'processing') && (
                        <div className="flex items-center gap-2 w-36">
                          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
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
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <Check className="w-3.5 h-3.5" /> Yüklendi
                        </span>
                      )}

                      {item.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                          <Ban className="w-3.5 h-3.5" /> İptal Edildi
                        </span>
                      )}

                      {item.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-medium" title={item.error_message}>
                          <AlertCircle className="w-3.5 h-3.5" /> {item.error_message || 'Hata'}
                        </span>
                      )}

                      {/* Cancel / Retry / Delete Actions */}
                      <div className="flex items-center gap-1">
                        {item.status === 'uploading' && (
                          <button
                            onClick={() => cancelUpload(item.id)}
                            className="p-1 rounded bg-slate-800 text-rose-400 hover:bg-rose-500/20"
                            title="Yüklemeyi İptal Et"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {(item.status === 'error' || item.status === 'cancelled') && !isUploading && (
                          <button
                            onClick={() => retrySingle(item)}
                            className="p-1.5 rounded bg-slate-800 text-blue-400 hover:bg-blue-500/20 flex items-center gap-1 text-[11px]"
                            title="Tekrar Dene"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Tekrar Dene
                          </button>
                        )}

                        {!isUploading && item.status !== 'completed' && (
                          <button
                            onClick={() => removeFile(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
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
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Yükleniyor...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Seçilen Resimleri Yükle
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
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between text-emerald-400 text-sm">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              <span className="font-semibold">{completedResults.length} resim başarıyla yüklendi!</span>
            </div>
            <button
              onClick={resetUpload}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold"
            >
              Yeni Yükleme Yap
            </button>
          </div>

          <div className="space-y-6">
            {completedResults.map((res) => (
              <div
                key={res.image.id}
                className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  {/* Image Preview Box */}
                  <div className="space-y-2 text-center md:text-left">
                    <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900/80 aspect-video md:aspect-square flex items-center justify-center">
                      <img
                        src={res.thumbnail_url || res.direct_url}
                        alt={res.image.original_filename}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{res.image.original_filename}</p>
                    <p className="text-[11px] text-slate-400">
                      {res.image.width} x {res.image.height} px • {formatSize(res.image.size)} • {res.image.format.toUpperCase()}
                    </p>
                    <div className="pt-1 flex items-center justify-center md:justify-start gap-2">
                      <button
                        onClick={() => navigate(`/i/${res.image.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Sayfada Gör
                      </button>
                    </div>
                  </div>

                  {/* Share Codes Box */}
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Paylaşım Kodları & Bağlantılar
                    </h3>

                    {/* Share Page Link */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-medium">Sayfa Bağlantısı</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={res.share_url}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(res.share_url, 'Sayfa URL')}
                          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Kopyala
                        </button>
                      </div>
                    </div>

                    {/* Direct Image Link */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-medium">Direkt Resim Bağlantısı (CDN)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={res.direct_url}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(res.direct_url, 'Direkt URL')}
                          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Kopyala
                        </button>
                      </div>
                    </div>

                    {/* HTML Code */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-medium">HTML Kodu</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={res.html_code}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(res.html_code, 'HTML Kodu')}
                          className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Kopyala
                        </button>
                      </div>
                    </div>

                    {/* Forum / BBCode */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-medium">Forum / BBCode</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={res.bbcode}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(res.bbcode, 'BBCode')}
                          className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Kopyala
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={resetUpload}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Başka Resim Yükle
            </button>
            <button
              onClick={() => navigate('/galerim')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-4 h-4 text-blue-400" />
              Galerime Git
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
