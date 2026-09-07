import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Crop, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, 
  ZoomIn, ZoomOut, Check, X, Maximize2, RefreshCw, 
  Sparkles, Layers, Sliders, Image as ImageIcon, UploadCloud,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { uploadFileToServer, optimizeImageToWebP } from '../../lib/uploadHelper';

export interface CropRect {
  x: number; // percentage (0-100) or pixel in source image
  y: number;
  width: number;
  height: number;
}

export interface AspectRatioOption {
  ratioText: string;
  title: string;
  description: string;
  value: number | null; // width / height or null for free
}

export const ASPECT_RATIO_PRESETS: AspectRatioOption[] = [
  { ratioText: '16:9', title: 'اسلایدر و بنر', description: 'عریض استاندارد (اسلایدر و بنر اصلی)', value: 16 / 9 },
  { ratioText: '21:9', title: 'فوق‌عریض سینمایی', description: 'فوق‌عریض سینمایی (معرفی مرکز)', value: 21 / 9 },
  { ratioText: '4:3', title: 'اخبار و اطلاعیه', description: 'استاندارد اخبار و اطلاعیه‌ها', value: 4 / 3 },
  { ratioText: '3:2', title: 'عکاسی و نگارخانه', description: 'کلاسیک عکاسی و نگارخانه', value: 3 / 2 },
  { ratioText: '1:1', title: 'مربع', description: 'کادر مربع (پروفایل و نماد)', value: 1 / 1 },
  { ratioText: '5:4', title: 'کادر هنری', description: 'کادر هنری متوسط', value: 5 / 4 },
  { ratioText: '9:16', title: 'عمودی و استوری', description: 'عمودی استاندارد (موبایل و استوری)', value: 9 / 16 },
  { ratioText: '4:5', title: 'کارت و بنر ایستاده', description: 'عمودی کارت پستال و بنر ایستاده', value: 4 / 5 },
  { ratioText: '2:1', title: 'پانوراما و سربرگ', description: 'پانوراما و سربرگ عریض', value: 2 / 1 },
  { ratioText: 'آزاد', title: 'کادر دلخواه', description: 'کادر آزاد (بدون قفل نسبت ابعاد)', value: null }
];

export const getOptimalAspectRatioPreset = (
  initialRatio: number | null | undefined, 
  naturalDims: { width: number; height: number } | null
): AspectRatioOption => {
  if (typeof initialRatio === 'number' && initialRatio > 0) {
    const match = ASPECT_RATIO_PRESETS.find(p => p.value !== null && Math.abs(p.value - initialRatio) < 0.05);
    if (match) return match;
  }

  if (naturalDims && naturalDims.width > 0 && naturalDims.height > 0) {
    const imgRatio = naturalDims.width / naturalDims.height;
    let closest = ASPECT_RATIO_PRESETS[0];
    let minDiff = Infinity;
    
    for (const preset of ASPECT_RATIO_PRESETS) {
      if (preset.value !== null) {
        const diff = Math.abs(preset.value - imgRatio);
        if (diff < minDiff) {
          minDiff = diff;
          closest = preset;
        }
      }
    }
    return closest;
  }

  return ASPECT_RATIO_PRESETS[0];
};

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | File | null;
  onCropComplete: (croppedFile: File, previewUrl: string, uploadResult?: any) => void;
  title?: string;
  initialAspectRatio?: number | null;
  targetFolder?: string;
  autoUploadToServer?: boolean;
}

export default function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  title = 'برش و تنظیم کادر استاندارد تصویر',
  initialAspectRatio = 16 / 9,
  targetFolder = 'general',
  autoUploadToServer = true
}: ImageCropperModalProps) {
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('image.webp');
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);
  
  // Calculate recommended preset based on target frame or uploaded image dimensions
  const optimalPreset = useMemo(() => {
    return getOptimalAspectRatioPreset(initialAspectRatio, naturalDimensions);
  }, [initialAspectRatio, naturalDimensions]);

  // Generate ordered presets: Optimal preset is ALWAYS first in the list
  const orderedRatioPresets = useMemo(() => {
    const others = ASPECT_RATIO_PRESETS.filter(p => p.ratioText !== optimalPreset.ratioText);
    return [
      { ...optimalPreset, isSuggested: true },
      ...others.map(p => ({ ...p, isSuggested: false }))
    ];
  }, [optimalPreset]);

  // Crop state
  const [selectedRatio, setSelectedRatio] = useState<number | null>(() => {
    return initialAspectRatio !== undefined ? initialAspectRatio : 16 / 9;
  });
  const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 100, height: 100 });
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [quality, setQuality] = useState<number>(0.85);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string | null>(null);

  // Dragging / Resizing interaction state
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initialCrop: { x: number; y: number; width: number; height: number } }>({
    startX: 0,
    startY: 0,
    initialCrop: { x: 0, y: 0, width: 100, height: 100 }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ratioScrollRef = useRef<HTMLDivElement>(null);
  const [showRatioDropdown, setShowRatioDropdown] = useState(false);

  // Update selected ratio when optimal preset changes upon modal open or image load
  useEffect(() => {
    if (isOpen) {
      setSelectedRatio(optimalPreset.value);
    }
  }, [isOpen, optimalPreset]);

  const handleScrollRatio = (direction: 'next' | 'prev') => {
    if (ratioScrollRef.current) {
      const isRtl = document.dir === 'rtl' || document.documentElement.dir === 'rtl';
      const amount = 240;
      // In RTL, moving forward in the list means scrolling left (negative)
      const delta = direction === 'next' 
        ? (isRtl ? -amount : amount) 
        : (isRtl ? amount : -amount);
      ratioScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  // Load image when imageSrc changes
  useEffect(() => {
    if (!isOpen) return;

    if (imageSrc instanceof File) {
      setImageName(imageSrc.name.replace(/\.[^/.]+$/, "") + '.webp');
      const reader = new FileReader();
      reader.onload = (e) => {
        setSourceDataUrl(e.target?.result as string);
      };
      reader.readAsDataURL(imageSrc);
    } else if (typeof imageSrc === 'string' && imageSrc) {
      setSourceDataUrl(imageSrc);
      const urlParts = imageSrc.split('/');
      const last = urlParts[urlParts.length - 1] || 'image.webp';
      setImageName(last.split('?')[0]);
    } else {
      setSourceDataUrl(null);
    }

    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  }, [imageSrc, isOpen]);

  // When image is loaded, calculate initial crop based on optimal / suggested aspect ratio
  const onImageLoaded = (img: HTMLImageElement) => {
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    setNaturalDimensions({ width: natW, height: natH });
    const recommended = getOptimalAspectRatioPreset(initialAspectRatio, { width: natW, height: natH });
    setSelectedRatio(recommended.value);
    applyAspectRatio(recommended.value, natW, natH);
  };

  const applyAspectRatio = (ratio: number | null, natW?: number, natH?: number) => {
    const width = natW || naturalDimensions?.width || 100;
    const height = natH || naturalDimensions?.height || 100;

    if (!ratio) {
      // Full view
      setCrop({ x: 5, y: 5, width: 90, height: 90 });
      return;
    }

    const imgRatio = width / height;
    let cropW = 90;
    let cropH = 90;

    if (imgRatio > ratio) {
      // Image is wider than desired ratio
      cropH = 88;
      const targetWidthPx = height * (cropH / 100) * ratio;
      cropW = Math.min(95, (targetWidthPx / width) * 100);
    } else {
      // Image is taller than desired ratio
      cropW = 88;
      const targetHeightPx = (width * (cropW / 100)) / ratio;
      cropH = Math.min(95, (targetHeightPx / height) * 100);
    }

    const cropX = (100 - cropW) / 2;
    const cropY = (100 - cropH) / 2;

    setCrop({
      x: Math.max(0, cropX),
      y: Math.max(0, cropY),
      width: cropW,
      height: cropH
    });
  };

  const handleRatioChange = (ratio: number | null) => {
    setSelectedRatio(ratio);
    applyAspectRatio(ratio);
  };

  // Handle Drag / Resize of Crop Box
  const handlePointerDown = (e: React.PointerEvent, mode: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w') => {
    e.preventDefault();
    e.stopPropagation();
    setDragMode(mode);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop }
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragMode || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - dragStartRef.current.startX) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStartRef.current.startY) / rect.height) * 100;
    const { initialCrop } = dragStartRef.current;

    let newCrop = { ...initialCrop };

    if (dragMode === 'move') {
      newCrop.x = Math.max(0, Math.min(100 - initialCrop.width, initialCrop.x + deltaXPercent));
      newCrop.y = Math.max(0, Math.min(100 - initialCrop.height, initialCrop.y + deltaYPercent));
    } else {
      // Resizing handles
      if (dragMode.includes('e')) {
        newCrop.width = Math.max(10, Math.min(100 - initialCrop.x, initialCrop.width + deltaXPercent));
      }
      if (dragMode.includes('s')) {
        newCrop.height = Math.max(10, Math.min(100 - initialCrop.y, initialCrop.height + deltaYPercent));
      }
      if (dragMode.includes('w')) {
        const potentialWidth = initialCrop.width - deltaXPercent;
        if (potentialWidth >= 10 && initialCrop.x + deltaXPercent >= 0) {
          newCrop.x = initialCrop.x + deltaXPercent;
          newCrop.width = potentialWidth;
        }
      }
      if (dragMode.includes('n')) {
        const potentialHeight = initialCrop.height - deltaYPercent;
        if (potentialHeight >= 10 && initialCrop.y + deltaYPercent >= 0) {
          newCrop.y = initialCrop.y + deltaYPercent;
          newCrop.height = potentialHeight;
        }
      }

      // If aspect ratio is locked, constrain height to match ratio
      if (selectedRatio && naturalDimensions) {
        const pixelW = (newCrop.width / 100) * naturalDimensions.width;
        const requiredPixelH = pixelW / selectedRatio;
        const requiredHeightPercent = (requiredPixelH / naturalDimensions.height) * 100;

        if (newCrop.y + requiredHeightPercent <= 100) {
          newCrop.height = requiredHeightPercent;
        } else {
          newCrop.height = 100 - newCrop.y;
          const adjustedPixelW = (newCrop.height / 100) * naturalDimensions.height * selectedRatio;
          newCrop.width = Math.min(100 - newCrop.x, (adjustedPixelW / naturalDimensions.width) * 100);
        }
      }
    }

    setCrop(newCrop);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragMode) {
      setDragMode(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Perform Final High-Quality Crop & WebP Generation
  const handleCropAndSave = async () => {
    if (!sourceDataUrl) return;

    setIsProcessing(true);
    setProcessStatus('در حال محاسبه کادربندی و تولید تصویر باکیفیت WebP...');

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = sourceDataUrl;

      await new Promise((resolve, reject) => {
        if (img.complete) resolve(true);
        img.onload = () => resolve(true);
        img.onerror = (e) => reject(e);
      });

      const natW = img.naturalWidth;
      const natH = img.naturalHeight;

      // Source rectangle in original image pixels
      const srcX = Math.round((crop.x / 100) * natW);
      const srcY = Math.round((crop.y / 100) * natH);
      const srcW = Math.round((crop.width / 100) * natW);
      const srcH = Math.round((crop.height / 100) * natH);

      // Create high-res canvas
      const canvas = document.createElement('canvas');
      canvas.width = srcW;
      canvas.height = srcH;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Cannot create 2D canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Handle Rotation and Flip if needed
      ctx.save();
      if (rotation !== 0 || flipH || flipV) {
        ctx.translate(srcW / 2, srcH / 2);
        if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        ctx.translate(-srcW / 2, -srcH / 2);
      }

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
      ctx.restore();

      // Convert to WebP Blob & File
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/webp', quality);
      });

      if (!blob) throw new Error('Blob generation failed');

      const cleanFileName = (imageName || 'image')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_') + '.webp';

      const croppedFile = new File([blob], cleanFileName, {
        type: 'image/webp',
        lastModified: Date.now()
      });

      const previewUrl = URL.createObjectURL(blob);

      if (autoUploadToServer) {
        setProcessStatus('در حال آپلود و ذخیره‌سازی در پوشه سرور...');
        const uploadRes = await uploadFileToServer(croppedFile, targetFolder);
        setIsProcessing(false);
        setProcessStatus(null);
        onCropComplete(croppedFile, uploadRes.url || previewUrl, uploadRes);
      } else {
        setIsProcessing(false);
        setProcessStatus(null);
        onCropComplete(croppedFile, previewUrl);
      }

      onClose();
    } catch (err: any) {
      console.error('Cropping error:', err);
      alert('خطا در برش تصویر: ' + (err.message || ''));
      setIsProcessing(false);
      setProcessStatus(null);
    }
  };

  const handleSelectNewFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageName(file.name.replace(/\.[^/.]+$/, "") + '.webp');
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSourceDataUrl(ev.target?.result as string);
        setZoom(1);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  // Calculate live output resolution
  const estimatedWidth = naturalDimensions ? Math.round((crop.width / 100) * naturalDimensions.width) : 0;
  const estimatedHeight = naturalDimensions ? Math.round((crop.height / 100) * naturalDimensions.height) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-y-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                {title}
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  فرمت مدرن WebP
                </span>
              </h3>
              <p className="text-xs text-slate-400">کادر دلخواه را انتخاب یا جابجا کنید؛ کادربندی برای نمایش زیبا و استاندارد در سایت ذخیره می‌شود.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleSelectNewFile}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors border border-slate-700 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>انتخاب تصویر دیگر</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Aspect Ratio Toolbar */}
        <div className="relative px-3 sm:px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-slate-800 ml-1">
            <span className="text-xs font-bold text-slate-300">نسبت کادر:</span>
          </div>

          {/* Previous / Right Arrow (moves towards beginning) */}
          <button
            type="button"
            onClick={() => handleScrollRatio('prev')}
            className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer border border-slate-700/60"
            title="کادرهای ابتدایی"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Scrollable Container with custom styled scrollbar and mouse-wheel support */}
          <div 
            ref={ratioScrollRef}
            onWheel={(e) => {
              if (ratioScrollRef.current) {
                ratioScrollRef.current.scrollLeft += e.deltaY;
              }
            }}
            className="flex-1 flex items-center gap-2 overflow-x-auto py-1 px-1 scroll-smooth"
            style={{ 
              scrollbarWidth: 'thin', 
              scrollbarColor: '#6366f1 #1e293b' 
            }}
          >
            {orderedRatioPresets.map((preset, idx) => {
              const isSelected = selectedRatio === preset.value || (selectedRatio !== null && preset.value !== null && Math.abs(selectedRatio - preset.value) < 0.01);
              return (
                <button
                  key={preset.ratioText}
                  type="button"
                  onClick={() => handleRatioChange(preset.value)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400/50 scale-[1.02]'
                      : preset.isSuggested
                        ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border border-amber-500/50 hover:text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 hover:text-white'
                  }`}
                  title={preset.description}
                >
                  <span dir="ltr" className={`font-bold font-sans text-xs px-1.5 py-0.5 rounded-md ${
                    isSelected 
                      ? 'bg-black/25 text-white' 
                      : preset.isSuggested 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                        : 'bg-slate-900/80 text-indigo-300'
                  }`}>
                    {preset.ratioText}
                  </span>
                  <span className="font-semibold">{preset.title}</span>
                  {preset.isSuggested && (
                    <span className="flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs">
                      <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                      <span>پیشنهادی</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Next / Left Arrow (moves towards end) */}
          <button
            type="button"
            onClick={() => handleScrollRatio('next')}
            className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 cursor-pointer border border-slate-700/60"
            title="کادرهای انتهایی"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* All Presets Menu Toggle */}
          <div className="relative shrink-0 pr-1 border-r border-slate-800 mr-1">
            <button
              type="button"
              onClick={() => setShowRatioDropdown(!showRatioDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                showRatioDropdown 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' 
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:bg-slate-700'
              }`}
              title="نمایش فهرست کامل همه نسبت‌های کادر"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">همه نسبت‌ها</span>
            </button>

            {/* Dropdown Menu of All Presets */}
            {showRatioDropdown && (
              <div 
                className="absolute left-0 sm:right-auto sm:left-0 top-full mt-2 w-72 sm:w-84 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 border-b border-slate-800 flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">فهرست کامل کادرهای استاندارد</span>
                  <button 
                    onClick={() => setShowRatioDropdown(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 p-1" style={{ scrollbarWidth: 'thin' }}>
                  {orderedRatioPresets.map((preset, idx) => {
                    const isSelected = selectedRatio === preset.value || (selectedRatio !== null && preset.value !== null && Math.abs(selectedRatio - preset.value) < 0.01);
                    return (
                      <button
                        key={preset.ratioText}
                        type="button"
                        onClick={() => {
                          handleRatioChange(preset.value);
                          setShowRatioDropdown(false);
                        }}
                        className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-bold'
                            : preset.isSuggested
                              ? 'bg-amber-950/30 hover:bg-amber-900/50 text-amber-200 border border-amber-500/30 font-medium'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span dir="ltr" className={`font-bold font-sans text-xs px-1.5 py-0.5 rounded-md ${
                            preset.isSuggested 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {preset.ratioText}
                          </span>
                          <span className="text-xs font-bold text-white">{preset.title}</span>
                          {preset.isSuggested && (
                            <span className="flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                              <Sparkles className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                              <span>پیشنهادی</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 hidden sm:inline">({preset.description})</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Interactive Cropper Stage */}
        <div className="flex-1 min-h-[200px] sm:min-h-[340px] max-h-[58vh] bg-slate-950 p-4 sm:p-6 flex items-center justify-center overflow-hidden relative select-none">
          {sourceDataUrl ? (
            <div 
              ref={containerRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative max-w-full max-h-full flex items-center justify-center touch-none"
            >
              {/* Target Image */}
              <img
                ref={imgRef}
                src={sourceDataUrl}
                alt="برش تصویر"
                onLoad={(e) => onImageLoaded(e.currentTarget)}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  maxHeight: '52vh',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
                className="pointer-events-none rounded-lg shadow-xl"
              />

              {/* Dark Overlay Outside Crop Box */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.65)`
                }}
              />

              {/* Interactive Crop Bounding Box */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'move')}
                style={{
                  position: 'absolute',
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.width}%`,
                  height: `${crop.height}%`,
                  cursor: dragMode === 'move' ? 'grabbing' : 'grab'
                }}
                className="border-2 border-indigo-400 ring-2 ring-white/40 shadow-2xl transition-[box-shadow]"
              >
                {/* 3x3 Rule of Thirds Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-b border-white/60"></div>
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-r border-b border-white/60"></div>
                  <div className="border-b border-white/60"></div>
                  <div className="border-r border-white/60"></div>
                  <div className="border-r border-white/60"></div>
                  <div></div>
                </div>

                {/* Center Badge with Dimensions */}
                <div dir="ltr" className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur-md text-indigo-200 text-xs font-bold font-sans px-2.5 py-1 rounded-lg border border-indigo-500/40 shadow-lg pointer-events-none select-none flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{estimatedWidth} × {estimatedHeight} px</span>
                </div>

                {/* Corner Resize Handles */}
                <div 
                  onPointerDown={(e) => handlePointerDown(e, 'nw')}
                  className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md" 
                />
                <div 
                  onPointerDown={(e) => handlePointerDown(e, 'ne')}
                  className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md" 
                />
                <div 
                  onPointerDown={(e) => handlePointerDown(e, 'sw')}
                  className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md" 
                />
                <div 
                  onPointerDown={(e) => handlePointerDown(e, 'se')}
                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md" 
                />

                {/* Edge Handles */}
                <div 
                  onPointerDown={(e) => handlePointerDown(e, 'n')}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border border-indigo-600 rounded-sm cursor-ns-resize" 
                />
                <div 
                  onPointerDown={(e) => handlePointerDown(e, 's')}
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 bg-white border border-indigo-600 rounded-sm cursor-ns-resize" 
                />
                <div 
                  onPointerDown={(e) => handlePointerDown(e, 'w')}
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 bg-white border border-indigo-600 rounded-sm cursor-ew-resize" 
                />
                <div 
                  onPointerDown={(e) => handlePointerDown(e, 'e')}
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 bg-white border border-indigo-600 rounded-sm cursor-ew-resize" 
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 gap-3 py-12">
              <ImageIcon className="w-12 h-12 text-slate-600" />
              <p className="text-sm font-bold text-slate-400">تصویری انتخاب نشده است</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md"
              >
                انتخاب تصویر از کامپیوتر
              </button>
            </div>
          )}
        </div>

        {/* Adjustments & Transformation Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          {/* Transform tools: Rotate, Flip, Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="چرخش ۹۰ درجه پادساعتگرد"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="چرخش ۹۰ درجه ساعتگرد"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setFlipH(!flipH)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                flipH ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="آینه‌ای افقی (Flip Horizontal)"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setFlipV(!flipV)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                flipV ? 'bg-indigo-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="آینه‌ای عمودی (Flip Vertical)"
            >
              <FlipVertical className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setRotation(0);
                setFlipH(false);
                setFlipV(false);
                applyAspectRatio(selectedRatio);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
              title="بازنشانی تغییرات"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بازنشانی</span>
            </button>
          </div>

          {/* Quality selection */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span>کیفیت خروجی WebP:</span>
            <select
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold"
            >
              <option value="0.92">بسیار عالی (۹۲٪)</option>
              <option value="0.85">بهینه و استاندارد (۸۵٪)</option>
              <option value="0.75">فوق فشرده و کم‌حجم (۷۵٪)</option>
            </select>
          </div>

          {/* Actions: Cancel & Save */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={isProcessing || !sourceDataUrl}
              onClick={handleCropAndSave}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{processStatus || 'در حال پردازش...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>اعمال برش و ذخیره WebP</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
