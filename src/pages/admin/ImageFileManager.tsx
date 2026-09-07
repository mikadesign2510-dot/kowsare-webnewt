import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FolderKanban, 
  Upload, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Image as ImageIcon, 
  HardDrive, 
  Folder, 
  FolderOpen, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Maximize2,
  FileText,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { 
  fetchServerImages, 
  deleteServerImage, 
  deleteBatchServerImages, 
  uploadFileToServer, 
  optimizeImageToWebP, 
  MAX_IMAGE_SIZE_MB, 
  MAX_IMAGE_SIZE_BYTES,
  ServerImageItem 
} from '../../lib/uploadHelper';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';

interface FolderDef {
  id: string;
  name: string;
  desc: string;
  color: string;
}

const FOLDERS: FolderDef[] = [
  { id: 'all', name: 'همه تصاویر', desc: 'تمامی رسانه‌های سرور', color: 'from-blue-600 to-indigo-600' },
  { id: 'banners', name: 'بنرها و اسلایدر', desc: 'تصاویر اسلایدر اصلی صفحه اول', color: 'from-amber-500 to-orange-600' },
  { id: 'gallery', name: 'نگارخانه (گالری)', desc: 'آلبوم‌های تصویری و دستاوردها', color: 'from-emerald-500 to-teal-600' },
  { id: 'news', name: 'اخبار و اطلاعیه‌ها', desc: 'تصاویر پیوست خبرها و مقالات', color: 'from-blue-500 to-cyan-600' },
  { id: 'portal', name: 'پرتال دانشجویی', desc: 'مدارک و پرونده‌های دانشجویی', color: 'from-purple-500 to-pink-600' },
  { id: 'settings', name: 'تنظیمات و آرم', desc: 'لوگو، سربرگ و آرم دانشگاه', color: 'from-rose-500 to-red-600' },
  { id: 'general', name: 'عمومی و سایر', desc: 'تصاویر عمومی و بارگذاری‌شده', color: 'from-slate-600 to-slate-800' },
];

export default function ImageFileManager() {
  const [images, setImages] = useState<ServerImageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalSizeFormatted, setTotalSizeFormatted] = useState<string>('۰ کیلوبایت');
  const [folderStats, setFolderStats] = useState<Record<string, { count: number; size: number; sizeFormatted: string }>>({});

  // Filter & Search
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'size-desc' | 'size-asc' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Multi-selection
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());

  // Lightbox / Preview modal
  const [previewImage, setPreviewImage] = useState<ServerImageItem | null>(null);

  // Delete modal state
  const [deleteModalItem, setDeleteModalItem] = useState<ServerImageItem | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toast / feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Upload modal / zone
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [targetUploadFolder, setTargetUploadFolder] = useState<string>('general');
  const [uploadQueue, setUploadQueue] = useState<{
    id: string;
    file: File;
    name: string;
    sizeFormatted: string;
    status: 'pending' | 'processing' | 'uploading' | 'completed' | 'error';
    progress: number;
    errorMsg?: string;
    uploadedUrl?: string;
  }[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Notification helper
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load server images
  const loadImages = async (folder: string = selectedFolder, search: string = searchQuery) => {
    setIsLoading(true);
    try {
      const res = await fetchServerImages(folder, search);
      setImages(res.data || []);
      setTotalSizeFormatted(res.totalSizeFormatted || '۰ کیلوبایت');
      setFolderStats(res.folderStats || {});
    } catch (err) {
      console.error('Error loading images:', err);
      showToast('خطا در دریافت تصاویر از سرور', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImages(selectedFolder, searchQuery);
  }, [selectedFolder]);

  // Copy link
  const handleCopyLink = async (url: string) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(url);
      showToast('آدرس تصویر با موفقیت در کلیپ‌بورد کپی شد');
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      showToast('خطا در کپی آدرس تصویر', 'error');
    }
  };

  // Single delete
  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;
    setIsDeleting(true);
    try {
      const res = await deleteServerImage(deleteModalItem.folder, deleteModalItem.name);
      if (res.success) {
        showToast('تصویر با موفقیت از سرور حذف شد');
        setImages(prev => prev.filter(img => img.id !== deleteModalItem.id));
        setSelectedImageIds(prev => {
          const next = new Set(prev);
          next.delete(deleteModalItem.id);
          return next;
        });
        if (previewImage?.id === deleteModalItem.id) {
          setPreviewImage(null);
        }
      } else {
        showToast(res.message || 'خطا در حذف تصویر', 'error');
      }
    } catch {
      showToast('خطا در حذف تصویر از سرور', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteModalItem(null);
    }
  };

  // Batch delete
  const handleConfirmBatchDelete = async () => {
    if (selectedImageIds.size === 0) return;
    setIsDeleting(true);
    try {
      const itemsToDelete = images
        .filter(img => selectedImageIds.has(img.id))
        .map(img => ({ folder: img.folder, filename: img.name }));

      const res = await deleteBatchServerImages(itemsToDelete);
      if (res.success) {
        showToast(res.message || `${itemsToDelete.length} تصویر با موفقیت حذف شدند`);
        setImages(prev => prev.filter(img => !selectedImageIds.has(img.id)));
        setSelectedImageIds(new Set());
      } else {
        showToast(res.message || 'خطا در حذف دسته‌ای', 'error');
      }
    } catch {
      showToast('خطا در حذف گروهی تصاویر', 'error');
    } finally {
      setIsDeleting(false);
      setIsBatchDeleteModalOpen(false);
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedImageIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedImageIds.size === filteredImages.length) {
      setSelectedImageIds(new Set());
    } else {
      setSelectedImageIds(new Set(filteredImages.map(img => img.id)));
    }
  };

  // Handle files selected for upload
  const handleFilesChosen = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newQueueItems: typeof uploadQueue = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const isOverSize = file.size > MAX_IMAGE_SIZE_BYTES;

      newQueueItems.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        name: file.name,
        sizeFormatted: `${sizeMB} مگابایت`,
        status: isOverSize ? 'error' : 'pending',
        progress: 0,
        errorMsg: isOverSize 
          ? `حجم فایل (${sizeMB}MB) بیش از سقف ۲۰ مگابایت است.`
          : undefined
      });
    }

    setUploadQueue(prev => [...prev, ...newQueueItems]);
    setIsUploadModalOpen(true);
  };

  // Run upload queue
  const processUploadQueue = async () => {
    if (isUploading) return;
    setIsUploading(true);

    const queue = [...uploadQueue];
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'completed' || item.status === 'error') continue;

      // Update state to processing
      setUploadQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'processing', progress: 30 } : q));

      try {
        const result = await uploadFileToServer(item.file, targetUploadFolder, 2560, 0.85);
        if (result.success) {
          setUploadQueue(prev => prev.map((q, idx) => idx === i ? {
            ...q,
            status: 'completed',
            progress: 100,
            uploadedUrl: result.url
          } : q));
        } else {
          setUploadQueue(prev => prev.map((q, idx) => idx === i ? {
            ...q,
            status: 'error',
            errorMsg: result.message || 'خطا در بارگذاری'
          } : q));
        }
      } catch (err: any) {
        setUploadQueue(prev => prev.map((q, idx) => idx === i ? {
          ...q,
          status: 'error',
          errorMsg: err.message || 'خطای شبکه'
        } : q));
      }
    }

    setIsUploading(false);
    // Reload image list to reflect new files
    loadImages();
    showToast('فرآیند بارگذاری تصاویر به پایان رسید');
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesChosen(e.dataTransfer.files);
    }
  };

  // Filtered & Sorted Images
  const filteredImages = useMemo(() => {
    let list = [...images];

    // Filter by folder if not 'all'
    if (selectedFolder !== 'all') {
      list = list.filter(img => img.folder === selectedFolder);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(img => 
        img.name.toLowerCase().includes(q) || 
        (img.originalName && img.originalName.toLowerCase().includes(q)) ||
        img.folder.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'size-desc') {
        return (b.size || 0) - (a.size || 0);
      }
      if (sortBy === 'size-asc') {
        return (a.size || 0) - (b.size || 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'fa');
      }
      return 0;
    });

    return list;
  }, [images, selectedFolder, searchQuery, sortBy]);

  const activeFolderName = FOLDERS.find(f => f.id === selectedFolder)?.name || 'همه تصاویر';

  return (
    <div className="space-y-6 pb-16 font-sans" dir="rtl">
      {/* Toast message */}
      {toastMessage && (
        <div 
          className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold animate-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-600 text-white border-emerald-500' 
              : 'bg-red-600 text-white border-red-500'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Page Title */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <FolderKanban className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                  مدیریت فایل و تصاویر سرور
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  سقف مجاز بارگذاری: {MAX_IMAGE_SIZE_MB} مگابایت
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">
                سامانه متمرکز مشاهده، سازماندهی، فشرده‌سازی خودکار و مدیریت رسانه‌ها و تصاویر ذخیره‌شده در سرور و دیتابیس
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => loadImages()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              <span>بروزرسانی</span>
            </button>

            <button
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-blue-600/20 cursor-pointer active:scale-98"
            >
              <Upload className="w-4 h-4" />
              <span>آپلود تصویر جدید (تا {MAX_IMAGE_SIZE_MB}MB)</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFilesChosen(e.target.files)}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Quick Storage Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span>کل تصاویر سرور</span>
              <ImageIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-slate-800">
              {images.length.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-400">تصویر</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span>فضای کل اشغال‌شده</span>
              <HardDrive className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-800">
              {totalSizeFormatted}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span>سقف حجم هر فایل</span>
              <Info className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-slate-800">
              {MAX_IMAGE_SIZE_MB} <span className="text-xs font-normal text-slate-400">مگابایت</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
              <span>فشرده‌سازی خودکار</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-700">
              WebP هوشمند
            </div>
          </div>
        </div>
      </div>

      {/* Upload Drag & Drop Banner (Quick Access) */}
      <div 
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="bg-white hover:bg-blue-50/40 border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer group shadow-2xs"
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 flex items-center justify-center mx-auto mb-3 transition-transform">
          <Upload className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-slate-800 group-hover:text-blue-600 transition-colors">
          تصاویر خود را اینجا بکشید و رها کنید یا برای انتخاب کلیک کنید
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed font-medium">
          پشتیبانی از انواع فرمت‌های JPG, PNG, WEBP, GIF, SVG تا سقف مجاز <strong className="text-blue-700 font-bold">۲۰ مگابایت</strong> برای هر تصویر به همراه تبدیل خودکار به بهینه‌ترین فرمت WebP
        </p>
      </div>

      {/* Directory Folders Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-700">
            <Folder className="w-4 h-4 text-blue-600" />
            <span>پوشه‌ها و دایرکتوری‌های تفکیک‌شده سرور:</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            نمایش پوشه: {activeFolderName}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FOLDERS.map((folder) => {
            const isSelected = selectedFolder === folder.id;
            const count = folder.id === 'all' 
              ? images.length 
              : folderStats[folder.id]?.count || 0;
            const size = folder.id === 'all'
              ? totalSizeFormatted
              : folderStats[folder.id]?.sizeFormatted || '۰ کیلوبایت';

            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                }`}
              >
                {isSelected ? <FolderOpen className="w-4 h-4 text-white" /> : <Folder className="w-4 h-4 text-slate-400" />}
                <span>{folder.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-blue-800/60 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters, Search & Action Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام فایل، پوشه یا فرمت..."
              className="w-full pl-9 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort & View Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>مرتب‌سازی:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-blue-700 font-bold cursor-pointer"
              >
                <option value="newest">جدیدترین بارگذاری</option>
                <option value="oldest">قدیمی‌ترین بارگذاری</option>
                <option value="size-desc">بیشترین حجم فایل</option>
                <option value="size-asc">کمترین حجم فایل</option>
                <option value="name">نام فایل (الفبا)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                title="نمای شبکه‌ای (کاشی)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                title="نمای لیستی (جدولی)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Batch selection bar */}
        {selectedImageIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-blue-900">
              <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                {selectedImageIds.size}
              </span>
              <span>تصویر برای عملیات گروهی انتخاب شده است</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedImageIds(new Set())}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
              >
                لغو انتخاب
              </button>

              <button
                onClick={() => setIsBatchDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm shadow-red-600/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف ({selectedImageIds.size}) تصویر</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Images Display (Grid or List) */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-600">در حال دریافت و سازماندهی تصاویر از سرور...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-slate-200/80 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-700">هیچ تصویری در این بخش یافت نشد</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
            {searchQuery 
              ? 'نتیجه‌ای متناسب با عبارت جستجوشده یافت نشد.' 
              : 'هنوز تصویری در این پوشه بارگذاری نشده است. می‌توانید با دکمه آپلود اولین تصویر را اضافه کنید.'}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>بارگذاری تصویر جدید</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredImages.map((image) => {
            const isSelected = selectedImageIds.has(image.id);
            const isCopied = copiedUrl === image.url;

            return (
              <div
                key={image.id}
                className={`group bg-white rounded-3xl border transition-all overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md relative ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Top Image Preview */}
                <div className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center">
                  <img
                    src={image.url}
                    alt={image.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onClick={() => setPreviewImage(image)}
                  />

                  {/* Top overlay badges */}
                  <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(image.id);
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center pointer-events-auto transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-white/80 backdrop-blur-xs text-slate-400 hover:bg-white border border-slate-200'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <div className="w-2.5 h-2.5 rounded-xs border border-slate-400" />}
                    </button>

                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-black/60 backdrop-blur-xs text-white uppercase tracking-wider">
                      {image.ext.replace('.', '') || 'IMG'}
                    </span>
                  </div>

                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none p-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(image);
                      }}
                      className="w-8 h-8 rounded-xl bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center pointer-events-auto shadow-sm transition-transform active:scale-95 cursor-pointer"
                      title="مشاهده بزرگنمایی"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(image.url);
                      }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center pointer-events-auto shadow-sm transition-transform active:scale-95 cursor-pointer ${
                        isCopied ? 'bg-emerald-600 text-white' : 'bg-white/90 hover:bg-white text-slate-700'
                      }`}
                      title="کپی لینک تصویر"
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Card Meta & Bottom Controls */}
                <div className="p-3 space-y-2">
                  <div className="space-y-0.5">
                    <h4 
                      className="text-xs font-black text-slate-800 truncate" 
                      title={image.name}
                      dir="ltr"
                    >
                      {image.name}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span className="text-slate-500 font-bold">{image.sizeFormatted}</span>
                      <span className="px-1.5 py-0.2 bg-slate-100 rounded-md text-[10px] text-slate-600">
                        {image.folder}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1">
                    <button
                      onClick={() => handleCopyLink(image.url)}
                      className={`flex-1 py-1 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        isCopied ? 'bg-emerald-50 text-emerald-700' : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'کپی شد' : 'کپی لینک'}</span>
                    </button>

                    <button
                      onClick={() => setDeleteModalItem(image)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="حذف تصویر"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST / TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black">
                <tr>
                  <th className="p-3 text-center w-12">
                    <button
                      onClick={selectAll}
                      className="w-5 h-5 rounded-lg border border-slate-300 flex items-center justify-center mx-auto"
                    >
                      {selectedImageIds.size === filteredImages.length && filteredImages.length > 0 && (
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">پیش‌نمایش</th>
                  <th className="p-3">نام تصویر</th>
                  <th className="p-3">پوشه ذخیره</th>
                  <th className="p-3">حجم فایل</th>
                  <th className="p-3">فرمت</th>
                  <th className="p-3">تاریخ ایجاد</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredImages.map((image) => {
                  const isSelected = selectedImageIds.has(image.id);
                  const isCopied = copiedUrl === image.url;

                  return (
                    <tr 
                      key={image.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleSelect(image.id)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center mx-auto transition-all ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      </td>
                      <td className="p-3">
                        <div 
                          className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden cursor-pointer border border-slate-200 shrink-0"
                          onClick={() => setPreviewImage(image)}
                        >
                          <img 
                            src={image.url} 
                            alt={image.name} 
                            className="w-full h-full object-cover"
                            loading="lazy" 
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 text-xs truncate max-w-xs" dir="ltr">
                          {image.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs" dir="ltr">
                          {image.url}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {image.folder}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700">{image.sizeFormatted}</td>
                      <td className="p-3 uppercase font-mono text-[11px] text-slate-500">{image.ext.replace('.', '')}</td>
                      <td className="p-3 text-slate-400 font-medium text-[11px]">
                        {new Date(image.createdAt).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleCopyLink(image.url)}
                            className={`p-1.5 rounded-xl transition-colors ${
                              isCopied ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-100'
                            }`}
                            title="کپی لینک"
                          >
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => setPreviewImage(image)}
                            className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="پیش‌نمایش بزرگ"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>

                          <a
                            href={image.url}
                            download={image.name}
                            className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                            title="دانلود تصویر"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => setDeleteModalItem(image)}
                            className="p-1.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="حذف فایل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL & QUEUE */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-black text-slate-800 text-base">
                <Upload className="w-5 h-5 text-blue-600" />
                <span>بارگذاری تصاویر به سرور (سقف ۲۰ مگابایت)</span>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isUploading}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Select Target Folder */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                پوشه مقصد در سرور:
              </label>
              <select
                value={targetUploadFolder}
                onChange={(e) => setTargetUploadFolder(e.target.value)}
                disabled={isUploading}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {FOLDERS.filter(f => f.id !== 'all').map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} (/uploads/{f.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Queue items list */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {uploadQueue.map((item, idx) => (
                <div 
                  key={item.id} 
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                    item.status === 'error' 
                      ? 'bg-red-50 border-red-200 text-red-700' 
                      : item.status === 'completed'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold truncate" dir="ltr">{item.name}</div>
                      <div className="text-[10px] opacity-70">
                        حجم: {item.sizeFormatted} {item.errorMsg && `• ${item.errorMsg}`}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {item.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {item.status === 'processing' && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                    {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                    {item.status === 'pending' && <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full font-bold">آماده</span>}
                    
                    {!isUploading && (
                      <button
                        onClick={() => setUploadQueue(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                + افزودن فایل‌های بیشتر
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  بستن
                </button>

                <button
                  type="button"
                  onClick={processUploadQueue}
                  disabled={isUploading || uploadQueue.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>در حال آپلود و فشرده‌سازی...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>شروع آپلود ({uploadQueue.filter(q => q.status !== 'completed').length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX / IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <h3 className="text-sm font-black text-slate-800 truncate" dir="ltr">
                  {previewImage.name}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  پوشه: {previewImage.folder} • حجم: {previewImage.sizeFormatted}
                </span>
              </div>

              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Big Image View */}
            <div className="flex-1 bg-slate-900/90 flex items-center justify-center p-4 overflow-hidden min-h-[300px] max-h-[55vh]">
              <img 
                src={previewImage.url} 
                alt={previewImage.name} 
                className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            {/* URL & Action Bar */}
            <div className="p-4 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-400 shrink-0 px-2">آدرس مستقیم:</span>
                <input
                  type="text"
                  readOnly
                  value={previewImage.url.startsWith('http') ? previewImage.url : `${window.location.origin}${previewImage.url}`}
                  className="flex-1 bg-transparent text-xs text-slate-700 font-mono focus:outline-none"
                  dir="ltr"
                />
                <button
                  onClick={() => handleCopyLink(previewImage.url)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedUrl === previewImage.url ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl === previewImage.url ? 'کپی شد' : 'کپی آدرس'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  onClick={() => {
                    setDeleteModalItem(previewImage);
                    setPreviewImage(null);
                  }}
                  className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف تصویر</span>
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={previewImage.url}
                    download={previewImage.name}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>دانلود فایل</span>
                  </a>

                  <a
                    href={previewImage.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>باز کردن در تب جدید</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE DELETE CONFIRM MODAL */}
      <DeleteConfirmModal
        isOpen={!!deleteModalItem}
        onClose={() => setDeleteModalItem(null)}
        onConfirm={handleConfirmDelete}
        title="تأیید حذف تصویر"
        itemName={deleteModalItem?.name}
        isLoading={isDeleting}
        confirmText="بله، حذف شود"
        cancelText="انصراف"
        message="آیا از حذف این تصویر از سرور و پایگاه‌داده اطمینان دارید؟ لینک‌های متصل به این تصویر در سایت پس از حذف با خطا مواجه خواهند شد."
      />

      {/* BATCH DELETE CONFIRM MODAL */}
      <DeleteConfirmModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        onConfirm={handleConfirmBatchDelete}
        title="تأیید حذف دسته‌ای تصاویر"
        itemCount={selectedImageIds.size}
        isLoading={isDeleting}
        confirmText="بله، تمام موارد حذف شوند"
        cancelText="انصراف"
        message={`آیا از حذف دائم ${selectedImageIds.size} تصویر انتخاب‌شده از سرور و پایگاه‌داده اطمینان دارید؟`}
      />
    </div>
  );
}
