import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Folder, 
  Search, 
  Upload, 
  Check, 
  HardDrive, 
  RefreshCw, 
  Image as ImageIcon,
  FolderOpen,
  Filter,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  fetchServerImages, 
  uploadFileToServer, 
  ServerImageItem,
  MAX_IMAGE_SIZE_MB 
} from '../../lib/uploadHelper';

interface ServerImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string, imageItem?: ServerImageItem) => void;
  currentValue?: string;
  defaultFolder?: string;
  initialFolder?: string;
  title?: string;
}

interface FolderOption {
  id: string;
  name: string;
  desc: string;
  color: string;
}

const FOLDERS: FolderOption[] = [
  { id: 'all', name: 'همه تصاویر سرور', desc: 'تمامی فایل‌های رسانه‌ای', color: 'from-blue-600 to-indigo-600' },
  { id: 'banners', name: 'بنرها و اسلایدر', desc: 'اسلایدر و هدر اصلی', color: 'from-amber-500 to-orange-600' },
  { id: 'news', name: 'اخبار و رویدادها', desc: 'تصاویر اطلاعیه‌ها و مقالات', color: 'from-blue-500 to-cyan-600' },
  { id: 'gallery', name: 'نگارخانه و آلبوم‌ها', desc: 'تصاویر دانشگاه و رویدادها', color: 'from-emerald-500 to-teal-600' },
  { id: 'settings', name: 'تنظیمات و آرم', desc: 'لوگو، امضا و سربرگ‌ها', color: 'from-rose-500 to-red-600' },
  { id: 'portal', name: 'پرتال دانشجویی', desc: 'تصاویر و مدارک پرتال', color: 'from-purple-500 to-pink-600' },
  { id: 'general', name: 'عمومی و سایر', desc: 'سایر تصاویر بارگذاری شده', color: 'from-slate-600 to-slate-800' }
];

export default function ServerImagePickerModal({
  isOpen,
  onClose,
  onSelect,
  currentValue = '',
  defaultFolder,
  initialFolder,
  title = 'انتخاب یا آپلود تصویر در سرور'
}: ServerImagePickerModalProps) {
  const effectiveFolder = initialFolder || defaultFolder || 'all';
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [images, setImages] = useState<ServerImageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFolder, setSelectedFolder] = useState<string>(effectiveFolder);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<ServerImageItem | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFolder, setUploadFolder] = useState<string>(effectiveFolder === 'all' ? 'banners' : effectiveFolder);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load images from server
  const loadImages = async (folderToFetch: string = selectedFolder, query: string = searchQuery) => {
    setIsLoading(true);
    try {
      const res = await fetchServerImages(folderToFetch, query);
      if (res && res.success && Array.isArray(res.data)) {
        setImages(res.data);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.error('Failed to fetch server images:', err);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // On open or when folder props change, initialize correctly
  useEffect(() => {
    if (isOpen) {
      const initFolder = initialFolder || defaultFolder || 'all';
      setSelectedFolder(initFolder);
      setUploadFolder(initFolder === 'all' ? 'banners' : initFolder);
      setSelectedImage(null);
      setUploadError(null);
      setActiveTab('gallery');
    }
  }, [isOpen, initialFolder, defaultFolder]);

  // Fetch images whenever modal is open and selectedFolder or searchQuery changes
  useEffect(() => {
    if (isOpen) {
      loadImages(selectedFolder, searchQuery);
    }
  }, [isOpen, selectedFolder, searchQuery]);

  // Filtered images list
  const filteredImages = useMemo(() => {
    return images.filter(img => {
      const matchesFolder = !selectedFolder || selectedFolder === 'all' || img.folder === selectedFolder;
      const matchesSearch = !searchQuery || 
        img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (img.originalName && img.originalName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFolder && matchesSearch;
    });
  }, [images, selectedFolder, searchQuery]);

  // Handle direct upload inside modal
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadFileToServer(file, uploadFolder);
      if (result.success && result.url) {
        // Auto select and confirm the newly uploaded server image
        onSelect(result.url);
        onClose();
      } else {
        setUploadError(result.message || 'خطا در بارگذاری فایل در سرور');
      }
    } catch (err: any) {
      setUploadError(err.message || 'خطای غیرمنتظره در آپلود');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
              <p className="text-xs text-slate-500">مخزن فایل‌ها و فضای ذخیره‌سازی اختصاصی سرور دانشگاه</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'gallery'
                    ? 'bg-white text-blue-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                تصاویر موجود روی سرور
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-white text-blue-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                آپلود فایل جدید در سرور
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'gallery' ? (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Sidebar Folders */}
            <div className="w-full md:w-56 p-3 border-b md:border-b-0 md:border-l border-slate-100 bg-slate-50/50 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto">
              <span className="text-[11px] font-bold text-slate-400 px-2 py-1 hidden md:block">
                پوشه‌های سرور
              </span>
              {FOLDERS.map(f => {
                const isSelected = selectedFolder === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFolder(f.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all whitespace-nowrap md:whitespace-normal text-right w-full ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    {isSelected ? <FolderOpen className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0 text-slate-400" />}
                    <span className="truncate">{f.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Gallery Area */}
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              {/* Search & Refresh Bar */}
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در نام تصاویر سرور..."
                    className="w-full pl-3 pr-9 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs border border-transparent focus:border-blue-500 rounded-xl outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={loadImages}
                  disabled={isLoading}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all"
                  title="تازه‌سازی لیست"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              </div>

              {/* Grid of Images */}
              <div className="flex-1 overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                    <span className="text-xs">در حال بارگذاری فایل‌های سرور...</span>
                  </div>
                ) : filteredImages.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                    <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                    <span className="text-sm font-bold text-slate-700">تصویری در این بخش یافت نشد</span>
                    <span className="text-xs text-slate-400 mt-1 max-w-sm">
                      می‌توانید تصویر جدیدی آپلود کنید یا تمامی تصاویر موجود در سرور را مشاهده نمایید.
                    </span>
                    <div className="flex items-center gap-2 mt-4">
                      {selectedFolder !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setSelectedFolder('all')}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                          مشاهده همه تصاویر سرور
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTab('upload')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        بارگذاری تصویر جدید
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredImages.map((img) => {
                      const isSelected = selectedImage?.id === img.id || currentValue === img.url;
                      return (
                        <div
                          key={img.id}
                          onClick={() => {
                            setSelectedImage(img);
                            onSelect(img.url, img);
                            onClose();
                          }}
                          className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-600 ring-4 ring-blue-500/20 shadow-lg'
                              : 'border-slate-200 hover:border-blue-500 hover:shadow-lg'
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          
                          {/* Overlay on hover/select */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2.5 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="bg-blue-600/90 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                                {img.folder}
                              </span>
                              <span className="text-[10px] text-white/90 bg-emerald-600/90 px-2 py-0.5 rounded-full font-bold">
                                کلیک جهت انتخاب
                              </span>
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-white truncate text-right">
                                {img.originalName || img.name}
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5 mb-1.5">
                                <span>{img.sizeFormatted}</span>
                                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] uppercase font-mono">
                                  {img.ext.replace('.', '')}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold shadow-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                انتخاب و درج این تصویر
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Direct Upload Tab */
          <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center justify-center">
            <div className="w-full max-w-lg">
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  انتخاب پوشه ذخیره‌سازی در سرور:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FOLDERS.filter(f => f.id !== 'all').map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUploadFolder(f.id)}
                      className={`p-2.5 rounded-xl border text-xs text-right transition-all ${
                        uploadFolder === f.id
                          ? 'border-blue-600 bg-blue-50/70 text-blue-800 font-bold shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-medium">{f.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-2xl p-8 text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 text-base mb-1">
                  کلیک کنید یا تصویر را به اینجا بکشید
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  تصویر مستقیماً در حافظه سرور ذخیره و بهینه‌سازی (WebP) خواهد شد.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  حداکثر حجم مجاز: {MAX_IMAGE_SIZE_MB} مگابایت
                </div>
              </div>

              {isUploading && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-xs font-bold text-blue-800">در حال آپلود و بهینه‌سازی تصویر در سرور...</span>
                </div>
              )}

              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
                  {uploadError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        {activeTab === 'gallery' && (
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {selectedImage ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{selectedImage.name}</span>
                  <span className="text-slate-400">({selectedImage.sizeFormatted})</span>
                </div>
              ) : (
                <span>تصویر مورد نظر را برای انتخاب کلیک نمایید.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                انصراف
              </button>
              <button
                disabled={!selectedImage}
                onClick={() => {
                  if (selectedImage) {
                    onSelect(selectedImage.url, selectedImage);
                    onClose();
                  }
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                تأیید و درج تصویر از سرور
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
