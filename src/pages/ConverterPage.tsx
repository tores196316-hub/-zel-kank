import React, { useState, useRef, useEffect } from 'react';
import {
  FileCode2,
  Upload,
  Download,
  Sparkles,
  Zap,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Archive,
  ArrowRight,
  Sliders,
  Eye,
  X,
  FileCheck,
  AlertCircle,
  FolderUp,
  Image as ImageIcon
} from 'lucide-react';
import {
  compressAndConvertImage,
  CompressedImageResult,
  CompressionOptions,
  isAvifEncodingSupported,
} from '../lib/imageCompressor';
import { exportImagesToZip, ZipExportProgress } from '../lib/zipExport';
import { useToast } from '../components/Toast';
import { imageApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';

interface ConverterPageProps {
  navigate: (path: string) => void;
}

export const ConverterPage: React.FC<ConverterPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compression Configuration
  const [targetFormat, setTargetFormat] = useState<'image/webp' | 'image/avif' | 'image/jpeg' | 'image/png'>('image/webp');
  const [quality, setQuality] = useState<number>(0.8);
  const [resizePreset, setResizePreset] = useState<string>('original');
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');

  // Queue and Results
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [results, setResults] = useState<CompressedImageResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // ZIP Progress
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<ZipExportProgress | null>(null);

  // Direct Upload Progress
  const [isUploadingToGallery, setIsUploadingToGallery] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // Comparison Preview Modal
  const [previewItem, setPreviewItem] = useState<CompressedImageResult | null>(null);

  const avifSupported = isAvifEncodingSupported();

  // Helper for size display
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Run conversion pipeline when files or settings change
  const processFiles = async (filesToProcess: File[]) => {
    if (filesToProcess.length === 0) return;

    setIsProcessing(true);
    setProcessProgress({ current: 0, total: filesToProcess.length });

    let maxWidth: number | undefined;
    let maxHeight: number | undefined;

    if (resizePreset === '4k') maxWidth = 3840;
    else if (resizePreset === '2k') maxWidth = 2560;
    else if (resizePreset === 'fhd') maxWidth = 1920;
    else if (resizePreset === 'hd') maxWidth = 1280;
    else if (resizePreset === 'web') maxWidth = 800;
    else if (resizePreset === 'custom') {
      if (customWidth) maxWidth = parseInt(customWidth, 10);
      if (customHeight) maxHeight = parseInt(customHeight, 10);
    }

    const options: CompressionOptions = {
      format: targetFormat,
      quality,
      maxWidth,
      maxHeight,
    };

    const newResults: CompressedImageResult[] = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      setProcessProgress({ current: i + 1, total: filesToProcess.length });
      const file = filesToProcess[i];
      const result = await compressAndConvertImage(file, options);
      newResults.push(result);
    }

    setResults(newResults);
    setIsProcessing(false);
    showToast(`${newResults.length} resim başarıyla dönüştürüldü ve optimize edildi!`, 'success');
  };

  // File addition handler
  const handleAddFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|bmp|gif|svg)$/i.test(file.name)) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      showToast('Lütfen geçerli resim dosyaları seçin (PNG, JPG, WebP, AVIF vs.)', 'error');
      return;
    }

    const combined = [...rawFiles, ...validFiles];
    setRawFiles(combined);
    processFiles(combined);
  };

  // Paste from clipboard support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        handleAddFiles(e.clipboardData.files);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [rawFiles, targetFormat, quality, resizePreset]);

  // Re-run with new settings
  const handleReapplySettings = () => {
    if (rawFiles.length > 0) {
      processFiles(rawFiles);
    }
  };

  // Download single compressed file
  const handleDownloadSingle = (item: CompressedImageResult) => {
    const link = document.createElement('a');
    link.href = item.compressedUrl;
    link.download = item.compressedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${item.compressedName} indirildi.`, 'success');
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    if (results.length === 0) return;

    try {
      setIsZipping(true);
      const itemsToZip = results
        .filter((r) => r.status === 'success')
        .map((r) => ({
          url: r.compressedUrl,
          filename: r.compressedName,
        }));

      const timestamp = new Date().toISOString().slice(0, 10);
      const formatLabel = targetFormat.replace('image/', '').toUpperCase();
      await exportImagesToZip(itemsToZip, `AnlikResim_${formatLabel}_Sikistirilmis_${timestamp}.zip`, (p) => {
        setZipProgress(p);
      });

      showToast('Toplu sıkıştırılmış ZIP arşivi hazırlandı ve indirildi!', 'success');
    } catch (err: any) {
      showToast('ZIP arşivi oluşturulamadı.', 'error');
    } finally {
      setIsZipping(false);
      setZipProgress(null);
    }
  };

  // Upload compressed files directly to AnlıkResim gallery
  const handleUploadAllToGallery = async () => {
    if (!user) {
      showToast('Resimleri galerinize yüklemek için lütfen giriş yapın.', 'info');
      navigate('/giris');
      return;
    }

    if (results.length === 0) return;

    try {
      setIsUploadingToGallery(true);
      const validResults = results.filter((r) => r.status === 'success');
      setUploadProgress({ current: 0, total: validResults.length });

      let successCount = 0;
      for (let i = 0; i < validResults.length; i++) {
        const item = validResults[i];
        setUploadProgress({ current: i + 1, total: validResults.length });

        const convertedFile = new File([item.compressedBlob], item.compressedName, {
          type: item.targetFormat,
        });

        await imageApi.uploadFile(convertedFile);
        successCount++;
      }

      showToast(`${successCount} optimize resim galerinize yüklendi!`, 'success');
      navigate('/galerim');
    } catch (err: any) {
      showToast(err.message || 'Galeriye yükleme sırasında bir hata oluştu.', 'error');
    } finally {
      setIsUploadingToGallery(false);
    }
  };

  // Clear all
  const handleClear = () => {
    results.forEach((r) => {
      if (r.compressedUrl) URL.revokeObjectURL(r.compressedUrl);
    });
    setRawFiles([]);
    setResults([]);
  };

  // Calculate totals
  const totalOriginalBytes = results.reduce((acc, r) => acc + r.originalSize, 0);
  const totalCompressedBytes = results.reduce((acc, r) => acc + r.compressedSize, 0);
  const totalSavedBytes = Math.max(0, totalOriginalBytes - totalCompressedBytes);
  const overallSavedPercent =
    totalOriginalBytes > 0 ? Math.round((totalSavedBytes / totalOriginalBytes) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kayıpsız & Ultra Hızlı Web Format Dönüştürücü</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          WebP & AVIF <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500">Otomatik Sıkıştırma</span>
        </h1>

        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Resimlerinizi modern <strong>WebP</strong> ve <strong>AVIF</strong> formatlarına dönüştürerek kaliteden ödün vermeden <strong>%70-%90</strong> daha küçük boyutlara getirin. İster tek tek, ister tek tıkla toplu ZIP olarak indirin veya doğrudan galerinize yükleyin.
        </p>
      </div>

      {/* Control Panel: Format, Quality, and Resizing */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Optimizasyon & Format Ayarları</span>
          </div>
          {rawFiles.length > 0 && (
            <button
              onClick={handleReapplySettings}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Ayarları Yeniden Uygula</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Target Format */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Hedef Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetFormat('image/webp')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer ${
                  targetFormat === 'image/webp'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>WebP</span>
                  <span className="text-[9px] bg-blue-500/30 text-blue-300 px-1 rounded">Önerilen</span>
                </div>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">%75 Küçülme • Evrensel</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetFormat('image/avif')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer ${
                  targetFormat === 'image/avif'
                    ? 'bg-cyan-600/20 border-cyan-400 text-white shadow-sm shadow-cyan-500/20'
                    : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>AVIF</span>
                  <span className="text-[9px] bg-cyan-500/30 text-cyan-300 px-1 rounded">Ultra</span>
                </div>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">%85+ Küçülme • Yeni Nesil</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetFormat('image/jpeg')}
                className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer ${
                  targetFormat === 'image/jpeg'
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>JPEG</div>
                <div className="text-[10px] text-slate-400 font-normal">Geleneksel web</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetFormat('image/png')}
                className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer ${
                  targetFormat === 'image/png'
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>PNG</div>
                <div className="text-[10px] text-slate-400 font-normal">Şeffaf katmanlar</div>
              </button>
            </div>
          </div>

          {/* 2. Quality Tuning */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Kalite & Sıkıştırma Seviyesi
              </label>
              <span className="text-xs font-black text-cyan-400">%{Math.round(quality * 100)}</span>
            </div>

            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            {/* Quality Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setQuality(0.6)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  quality === 0.6
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Eko (%60)
              </button>
              <button
                type="button"
                onClick={() => setQuality(0.8)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  quality === 0.8
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Dengeli (%80)
              </button>
              <button
                type="button"
                onClick={() => setQuality(0.92)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  quality === 0.92
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Pro (%92)
              </button>
            </div>
          </div>

          {/* 3. Dimension Resizing */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              3. Boyutlandırma (Opsiyonel)
            </label>
            <select
              value={resizePreset}
              onChange={(e) => setResizePreset(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="original">Orijinal Çözünürlüğü Koru</option>
              <option value="4k">Maks. 4K UHD (3840 px)</option>
              <option value="2k">Maks. 2K QHD (2560 px)</option>
              <option value="fhd">Maks. Full HD (1920 px) - Önerilen</option>
              <option value="hd">Maks. HD (1280 px)</option>
              <option value="web">Maks. Web Boyutu (800 px)</option>
              <option value="custom">Özel Genişlik & Yükseklik...</option>
            </select>

            {resizePreset === 'custom' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  placeholder="Genişlik (px)"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="w-1/2 bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-slate-500 text-xs">×</span>
                <input
                  type="number"
                  placeholder="Yükseklik (px)"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className="w-1/2 bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) handleAddFiles(e.dataTransfer.files);
        }}
        className="group relative border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 bg-gradient-to-b from-[#0F172A]/80 to-[#070A11]/90 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10"
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*,.webp,.avif,.png,.jpg,.jpeg,.bmp,.gif"
          onChange={(e) => {
            if (e.target.files) handleAddFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />

        <div className="space-y-4 max-w-md mx-auto pointer-events-none">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Resimleri buraya sürükleyin veya seçin
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Toplu resim yükleme desteklenir. Panodan doğrudan <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">Ctrl + V</kbd> ile de yapıştırabilirsiniz.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-[11px] font-semibold">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Tüm işlemler tarayıcınızda ışık hızında ve güvenle işlenir</span>
          </div>
        </div>
      </div>

      {/* Progress or Processing Indicator */}
      {isProcessing && (
        <div className="bg-[#0F172A] border border-cyan-500/40 rounded-2xl p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
            <div>
              <div className="text-sm font-bold text-white">Resimler Optimize Ediliyor...</div>
              <div className="text-xs text-slate-400">
                {processProgress.current} / {processProgress.total} resim işlendi
              </div>
            </div>
          </div>
          <div className="text-xs font-bold text-cyan-400">
            %{Math.round((processProgress.current / processProgress.total) * 100)}
          </div>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-6">
          {/* Summary Dashboard Card */}
          <div className="bg-gradient-to-r from-blue-950/40 via-[#0F172A] to-cyan-950/30 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Optimizasyon Özeti</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black">
                  %{overallSavedPercent} Tasarruf
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {formatSize(totalOriginalBytes)}{' '}
                <span className="text-slate-400 font-normal text-lg">➔</span>{' '}
                <span className="text-cyan-400">{formatSize(totalCompressedBytes)}</span>
              </div>
              <p className="text-xs text-slate-400">
                Toplam <strong className="text-slate-200">{results.length} resimde</strong> {formatSize(totalSavedBytes)} boyut tasarrufu sağlandı.
              </p>
            </div>

            {/* Batch Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* ZIP Download All */}
              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isZipping}
                className="min-h-[44px] flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Archive className="w-4 h-4" />
                <span>{isZipping ? `ZIP Hazırlanıyor (${zipProgress?.percent || 0}%)...` : 'Tümünü ZIP Olarak İndir'}</span>
              </button>

              {/* Direct Upload to AnlıkResim */}
              <button
                type="button"
                onClick={handleUploadAllToGallery}
                disabled={isUploadingToGallery}
                className="min-h-[44px] flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FolderUp className="w-4 h-4 text-cyan-400" />
                <span>{isUploadingToGallery ? `Yükleniyor (${uploadProgress.current}/${uploadProgress.total})...` : "Galeriye Yükle"}</span>
              </button>

              {/* Clear List */}
              <button
                type="button"
                onClick={handleClear}
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors cursor-pointer"
                title="Tümünü Temizle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image Items Grid / List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((item) => (
              <div
                key={item.id}
                className="bg-[#0F172A] border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-4 transition-all duration-200 flex items-center justify-between gap-4 group"
              >
                {/* Thumbnail & Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    onClick={() => setPreviewItem(item)}
                    className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 cursor-pointer group/thumb"
                  >
                    <img
                      src={item.compressedUrl}
                      alt={item.compressedName}
                      className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs sm:text-sm font-bold text-white truncate" title={item.compressedName}>
                      {item.compressedName}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                      <span className="line-through text-slate-500">{formatSize(item.originalSize)}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500 inline" />
                      <span className="font-bold text-cyan-400">{formatSize(item.compressedSize)}</span>

                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-black">
                        -%{item.savedPercent}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500">
                      {item.compressedWidth} × {item.compressedHeight} px • {item.processingTimeMs} ms
                    </div>
                  </div>
                </div>

                {/* Individual Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="Önizle ve Karşılaştır"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(item)}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-blue-600/25 transition-all cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">İndir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white">{previewItem.compressedName}</h3>
                <p className="text-xs text-slate-400">Orijinal ve sıkıştırılmış görsel karşılaştırması</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side by side preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto p-1">
              {/* Original */}
              <div className="space-y-2 bg-[#0B0F19] p-3.5 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">Orijinal Dosya</span>
                  <span className="text-slate-400">{formatSize(previewItem.originalSize)}</span>
                </div>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src={URL.createObjectURL(previewItem.originalFile)}
                    alt="Orijinal"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[11px] text-slate-500 text-center">
                  {previewItem.originalWidth} × {previewItem.originalHeight} px • {previewItem.originalFormat}
                </div>
              </div>

              {/* Compressed */}
              <div className="space-y-2 bg-gradient-to-b from-cyan-950/20 to-[#0B0F19] p-3.5 rounded-2xl border border-cyan-500/30">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-cyan-400">Optimize ({previewItem.targetFormat.replace('image/', '').toUpperCase()})</span>
                  <span className="text-emerald-400">
                    {formatSize(previewItem.compressedSize)} (-%{previewItem.savedPercent})
                  </span>
                </div>
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src={previewItem.compressedUrl}
                    alt="Sıkıştırılmış"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[11px] text-slate-500 text-center">
                  {previewItem.compressedWidth} × {previewItem.compressedHeight} px • Kalite %{Math.round(quality * 100)}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadSingle(previewItem);
                  setPreviewItem(null);
                }}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>İndir ({previewItem.compressedName})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
