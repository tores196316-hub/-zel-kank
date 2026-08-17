import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Check, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, 
  Crop, Sliders, Maximize2, Type, Sparkles, Download, Undo2, 
  Eye, RefreshCw, ZoomIn, ZoomOut
} from 'lucide-react';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName: string;
  onSave: (editedFile: File, previewUrl: string) => void;
}

type TabType = 'crop' | 'filters' | 'resize' | 'watermark';
type AspectRatio = 'free' | '1:1' | '16:9' | '4:3' | '3:2' | '9:16';
type WatermarkPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';

const FILTER_PRESETS = [
  { id: 'normal', name: 'Normal', brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0 },
  { id: 'vibrant', name: 'Canlı Renk', brightness: 105, contrast: 120, saturation: 145, grayscale: 0, sepia: 0, blur: 0 },
  { id: 'mono', name: 'Siyah Beyaz', brightness: 100, contrast: 125, saturation: 0, grayscale: 100, sepia: 0, blur: 0 },
  { id: 'vintage', name: 'Nostalji', brightness: 95, contrast: 90, saturation: 80, grayscale: 0, sepia: 60, blur: 0 },
  { id: 'cinematic', name: 'Sinematik', brightness: 90, contrast: 135, saturation: 110, grayscale: 0, sepia: 15, blur: 0 },
  { id: 'warm', name: 'Sıcak Günışığı', brightness: 105, contrast: 105, saturation: 120, grayscale: 0, sepia: 35, blur: 0 },
  { id: 'dramatic', name: 'Dramatik', brightness: 95, contrast: 150, saturation: 130, grayscale: 0, sepia: 0, blur: 0 },
];

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  fileName,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('crop');
  const [loading, setLoading] = useState(true);

  // Transform states
  const [rotation, setRotation] = useState(0); // degrees 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');

  // Filter states
  const [activePreset, setActivePreset] = useState<string>('normal');
  const [brightness, setBrightness] = useState(100); // 0 - 200
  const [contrast, setContrast] = useState(100); // 0 - 200
  const [saturation, setSaturation] = useState(100); // 0 - 200
  const [grayscale, setGrayscale] = useState(0); // 0 - 100
  const [sepia, setSepia] = useState(0); // 0 - 100
  const [blur, setBlur] = useState(0); // 0 - 20 px
  const [invert, setInvert] = useState(false);

  // Resize states
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);

  // Watermark states
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPos, setWatermarkPos] = useState<WatermarkPosition>('bottom-right');
  const [watermarkColor, setWatermarkColor] = useState('#ffffff');
  const [watermarkOpacity, setWatermarkOpacity] = useState(80);
  const [watermarkSize, setWatermarkSize] = useState(24);
  const [watermarkBg, setWatermarkBg] = useState(true);

  // Preview & Canvas
  const [showOriginal, setShowOriginal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Load Image
  useEffect(() => {
    if (!isOpen || !imageUrl) return;

    setLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      imageElementRef.current = img;
      setOriginalWidth(img.naturalWidth);
      setOriginalHeight(img.naturalHeight);
      setTargetWidth(img.naturalWidth);
      setTargetHeight(img.naturalHeight);
      setLoading(false);
      resetAllSettings();
    };

    img.onerror = () => {
      setLoading(false);
    };
  }, [isOpen, imageUrl]);

  const resetAllSettings = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio('free');
    setActivePreset('normal');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setGrayscale(0);
    setSepia(0);
    setBlur(0);
    setInvert(false);
    setWatermarkText('');
    setZoomLevel(1);
    if (imageElementRef.current) {
      setTargetWidth(imageElementRef.current.naturalWidth);
      setTargetHeight(imageElementRef.current.naturalHeight);
    }
  };

  // Render to canvas
  useEffect(() => {
    if (!imageElementRef.current || loading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageElementRef.current;

    // Determine dimensions based on rotation
    const isRotatedSideways = rotation === 90 || rotation === 270;
    const renderWidth = isRotatedSideways ? targetHeight || originalHeight : targetWidth || originalWidth;
    const renderHeight = isRotatedSideways ? targetWidth || originalWidth : targetHeight || originalHeight;

    canvas.width = renderWidth;
    canvas.height = renderHeight;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showOriginal) {
      // Draw pristine original
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      return;
    }

    // Apply Filter string
    const filterParts = [
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturation}%)`,
      `grayscale(${grayscale}%)`,
      `sepia(${sepia}%)`,
      `blur(${blur}px)`,
    ];
    if (invert) filterParts.push('invert(100%)');
    ctx.filter = filterParts.join(' ');

    // Transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    const drawW = isRotatedSideways ? renderHeight : renderWidth;
    const drawH = isRotatedSideways ? renderWidth : renderHeight;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Reset filter for Watermark
    ctx.filter = 'none';

    // Apply Watermark if any
    if (watermarkText.trim()) {
      ctx.save();
      const padding = 20;
      const fontSize = Math.max(14, Math.round((watermarkSize * canvas.width) / 800));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textBaseline = 'middle';

      const metrics = ctx.measureText(watermarkText);
      const textWidth = metrics.width;
      const textHeight = fontSize * 1.3;

      let x = canvas.width - textWidth - padding;
      let y = canvas.height - padding - textHeight / 2;

      if (watermarkPos === 'bottom-left') {
        x = padding;
        y = canvas.height - padding - textHeight / 2;
      } else if (watermarkPos === 'top-right') {
        x = canvas.width - textWidth - padding;
        y = padding + textHeight / 2;
      } else if (watermarkPos === 'top-left') {
        x = padding;
        y = padding + textHeight / 2;
      } else if (watermarkPos === 'center') {
        x = (canvas.width - textWidth) / 2;
        y = canvas.height / 2;
      }

      ctx.globalAlpha = watermarkOpacity / 100;

      if (watermarkBg) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        const bgPadding = 8;
        ctx.roundRect
          ? ctx.roundRect(x - bgPadding, y - textHeight / 2, textWidth + bgPadding * 2, textHeight, 6)
          : ctx.fillRect(x - bgPadding, y - textHeight / 2, textWidth + bgPadding * 2, textHeight);
        ctx.fill();
      }

      ctx.fillStyle = watermarkColor;
      ctx.fillText(watermarkText, x, y);
      ctx.restore();
    }
  }, [
    loading,
    showOriginal,
    rotation,
    flipH,
    flipV,
    brightness,
    contrast,
    saturation,
    grayscale,
    sepia,
    blur,
    invert,
    targetWidth,
    targetHeight,
    watermarkText,
    watermarkPos,
    watermarkColor,
    watermarkOpacity,
    watermarkSize,
    watermarkBg,
  ]);

  // Preset Selection
  const applyPreset = (preset: (typeof FILTER_PRESETS)[0]) => {
    setActivePreset(preset.id);
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    setGrayscale(preset.grayscale);
    setSepia(preset.sepia);
    setBlur(preset.blur);
    setInvert(false);
  };

  // Resize Handlers
  const handleWidthChange = (w: number) => {
    setTargetWidth(w);
    if (lockAspect && originalWidth > 0) {
      setTargetHeight(Math.round((w * originalHeight) / originalWidth));
    }
  };

  const handleHeightChange = (h: number) => {
    setTargetHeight(h);
    if (lockAspect && originalHeight > 0) {
      setTargetWidth(Math.round((h * originalWidth) / originalHeight));
    }
  };

  const handleScalePercent = (pct: number) => {
    if (originalWidth > 0 && originalHeight > 0) {
      setTargetWidth(Math.round((originalWidth * pct) / 100));
      setTargetHeight(Math.round((originalHeight * pct) / 100));
    }
  };

  // Save & Export
  const handleExport = (action: 'save' | 'download') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      const cleanName = fileName.replace(/\.[^/.]+$/, '') + '_duzenlendi.png';
      const editedFile = new File([blob], cleanName, { type: 'image/png' });
      const previewUrl = URL.createObjectURL(blob);

      if (action === 'save') {
        onSave(editedFile, previewUrl);
        onClose();
      } else if (action === 'download') {
        const link = document.createElement('a');
        link.href = previewUrl;
        link.download = cleanName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 'image/png');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">Dahili Resim Editörü</h3>
              <p className="text-[11px] text-slate-400 truncate">{fileName} ({originalWidth}x{originalHeight}px)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('download')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
              title="Düzenlenen resmi cihazınıza indirin"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">İndir</span>
            </button>

            <button
              onClick={() => handleExport('save')}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Kaydet & Kullan</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Main Canvas Area */}
          <div className="flex-1 bg-slate-950/80 p-4 flex flex-col items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400">Resim işleniyor...</span>
              </div>
            ) : (
              <div 
                className="relative max-w-full max-h-full flex items-center justify-center overflow-auto p-2"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
              >
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[55vh] md:max-h-[68vh] object-contain rounded-lg shadow-2xl border border-slate-800"
                />
              </div>
            )}

            {/* Canvas Floating Overlay Controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-lg backdrop-blur-md z-10 text-xs">
              <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                  showOriginal ? 'bg-amber-500 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Orijinal hali görmek için basılı tutun"
              >
                <Eye className="w-3 h-3" />
                <span>Orijinal</span>
              </button>

              <div className="w-px h-3.5 bg-slate-700" />

              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.15))}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Uzaklaştır"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-slate-400 font-mono w-9 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.15))}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Yakınlaştır"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-3.5 bg-slate-700" />

              <button
                onClick={resetAllSettings}
                className="px-2 py-1 rounded text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer flex items-center gap-1"
                title="Tüm düzenlemeleri sıfırla"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sıfırla</span>
              </button>
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="w-full md:w-80 bg-slate-900 flex flex-col h-auto md:h-full max-h-[40vh] md:max-h-full overflow-hidden">
            {/* Tab Navigation */}
            <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/40 p-1">
              {[
                { id: 'crop', label: 'Kırp/Döndür', icon: Crop },
                { id: 'filters', label: 'Filtreler', icon: Sliders },
                { id: 'resize', label: 'Boyut', icon: Maximize2 },
                { id: 'watermark', label: 'Filigran', icon: Type },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`py-2 px-1 text-[11px] font-bold rounded-lg flex flex-col items-center gap-1 transition cursor-pointer ${
                      active
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content Panel */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              
              {/* TAB 1: CROP & TRANSFORM */}
              {activeTab === 'crop' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">Döndürme & Yön</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => setRotation((r) => (r + 270) % 360)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex flex-col items-center gap-1 border border-slate-700 transition cursor-pointer"
                        title="90° Sola Döndür"
                      >
                        <RotateCcw className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px]">-90°</span>
                      </button>

                      <button
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex flex-col items-center gap-1 border border-slate-700 transition cursor-pointer"
                        title="90° Sağa Döndür"
                      >
                        <RotateCw className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px]">+90°</span>
                      </button>

                      <button
                        onClick={() => setFlipH((f) => !f)}
                        className={`p-2.5 rounded-xl text-xs font-medium flex flex-col items-center gap-1 border transition cursor-pointer ${
                          flipH
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                        title="Yatay Çevir"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                        <span className="text-[10px]">Yatay</span>
                      </button>

                      <button
                        onClick={() => setFlipV((f) => !f)}
                        className={`p-2.5 rounded-xl text-xs font-medium flex flex-col items-center gap-1 border transition cursor-pointer ${
                          flipV
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                        title="Dikey Çevir"
                      >
                        <FlipVertical className="w-4 h-4" />
                        <span className="text-[10px]">Dikey</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">En/Boy Oranı (Presets)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'free', label: 'Orijinal' },
                        { id: '1:1', label: '1:1 (Kare)' },
                        { id: '16:9', label: '16:9 (Geniş)' },
                        { id: '4:3', label: '4:3 (Klasik)' },
                        { id: '3:2', label: '3:2 (Foto)' },
                        { id: '9:16', label: '9:16 (Story)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setAspectRatio(item.id as AspectRatio);
                            if (item.id === '1:1') {
                              const minSize = Math.min(originalWidth, originalHeight);
                              setTargetWidth(minSize);
                              setTargetHeight(minSize);
                            } else if (item.id === '16:9') {
                              setTargetWidth(originalWidth);
                              setTargetHeight(Math.round((originalWidth * 9) / 16));
                            } else if (item.id === '4:3') {
                              setTargetWidth(originalWidth);
                              setTargetHeight(Math.round((originalWidth * 3) / 4));
                            } else if (item.id === 'free') {
                              setTargetWidth(originalWidth);
                              setTargetHeight(originalHeight);
                            }
                          }}
                          className={`p-2 rounded-lg text-xs font-semibold text-center border transition cursor-pointer ${
                            aspectRatio === item.id
                              ? 'bg-blue-600/20 text-blue-400 border-blue-500'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FILTERS & ADJUSTMENTS */}
              {activeTab === 'filters' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">Hazır Filtreler</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FILTER_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => applyPreset(preset)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition cursor-pointer ${
                            activePreset === preset.id
                              ? 'bg-blue-600 text-white border-blue-500 font-bold'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Parlaklık</span>
                        <span className="text-slate-300 font-mono">{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="180"
                        value={brightness}
                        onChange={(e) => {
                          setBrightness(Number(e.target.value));
                          setActivePreset('custom');
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Kontrast</span>
                        <span className="text-slate-300 font-mono">{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="180"
                        value={contrast}
                        onChange={(e) => {
                          setContrast(Number(e.target.value));
                          setActivePreset('custom');
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Doygunluk (Renk)</span>
                        <span className="text-slate-300 font-mono">{saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={saturation}
                        onChange={(e) => {
                          setSaturation(Number(e.target.value));
                          setActivePreset('custom');
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Sepya (Retro)</span>
                        <span className="text-slate-300 font-mono">{sepia}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sepia}
                        onChange={(e) => {
                          setSepia(Number(e.target.value));
                          setActivePreset('custom');
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Bulanıklık (Blur)</span>
                        <span className="text-slate-300 font-mono">{blur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={blur}
                        onChange={(e) => {
                          setBlur(Number(e.target.value));
                          setActivePreset('custom');
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={invert}
                          onChange={(e) => setInvert(e.target.checked)}
                          className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
                        />
                        <span>Renkleri Ters Çevir (Invert)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: RESIZE */}
              {activeTab === 'resize' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">Özel Çözünürlük (Piksel)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Genişlik (px)</span>
                        <input
                          type="number"
                          value={targetWidth}
                          onChange={(e) => handleWidthChange(Math.max(10, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Yükseklik (px)</span>
                        <input
                          type="number"
                          value={targetHeight}
                          onChange={(e) => handleHeightChange(Math.max(10, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lockAspect}
                      onChange={(e) => setLockAspect(e.target.checked)}
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
                    />
                    <span>En/Boy Oranını Kilitle (Önerilen)</span>
                  </label>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">Hızlı Ölçekleme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[75, 50, 25].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => handleScalePercent(pct)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                        >
                          %{pct} Boyut
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <p>Orijinal: <strong className="text-slate-300">{originalWidth} x {originalHeight} px</strong></p>
                    <p>Yeni: <strong className="text-blue-400">{targetWidth} x {targetHeight} px</strong></p>
                  </div>
                </div>
              )}

              {/* TAB 4: WATERMARK */}
              {activeTab === 'watermark' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Filigran Metni</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Örn: © IMGIVO / Ahmet"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {watermarkText.trim() && (
                    <>
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-2">Konum</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'top-left', label: 'Sol Üst' },
                            { id: 'center', label: 'Merkez' },
                            { id: 'top-right', label: 'Sağ Üst' },
                            { id: 'bottom-left', label: 'Sol Alt' },
                            { id: 'bottom-right', label: 'Sağ Alt' },
                          ].map((pos) => (
                            <button
                              key={pos.id}
                              onClick={() => setWatermarkPos(pos.id as WatermarkPosition)}
                              className={`p-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                                watermarkPos === pos.id
                                  ? 'bg-blue-600 text-white border-blue-500'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Şeffaflık</span>
                            <span className="text-slate-300 font-mono">%{watermarkOpacity}</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={watermarkOpacity}
                            onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Metin Boyutu</span>
                            <span className="text-slate-300 font-mono">{watermarkSize}px</span>
                          </div>
                          <input
                            type="range"
                            min="14"
                            max="48"
                            value={watermarkSize}
                            onChange={(e) => setWatermarkSize(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>

                        <div>
                          <span className="text-xs text-slate-400 block mb-1.5">Metin Rengi</span>
                          <div className="flex items-center gap-2">
                            {['#ffffff', '#000000', '#3b82f6', '#ef4444', '#eab308', '#22c55e'].map((c) => (
                              <button
                                key={c}
                                onClick={() => setWatermarkColor(c)}
                                className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                                  watermarkColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={watermarkBg}
                            onChange={(e) => setWatermarkBg(e.target.checked)}
                            className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
                          />
                          <span>Arka Plan Karartma Kutusu Ekle</span>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
