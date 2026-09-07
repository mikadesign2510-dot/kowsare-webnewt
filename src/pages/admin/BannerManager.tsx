import React, { useState, useEffect } from 'react';
import { storage, BannerItem, NewsItem, GalleryAlbum } from '../../lib/storage';
import { uploadFileToServer } from '../../lib/uploadHelper';
import { 
  Images, Plus, Trash2, Edit3, ArrowUp, ArrowDown, 
  CheckCircle2, XCircle, Eye, EyeOff, Upload, Link as LinkIcon, 
  Sparkles, Clock, ExternalLink, RotateCcw, AlertTriangle, X,
  RefreshCw, Info, Crop, ChevronRight, ChevronLeft, ArrowLeft,
  Monitor, LayoutTemplate, Play, Pause, GraduationCap, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImageCropperModal from '../../components/admin/ImageCropperModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import ServerImagePickerModal from '../../components/admin/ServerImagePickerModal';

// Curated academic presets for quick selection
const PRESET_IMAGES = [
  {
    url: 'https://picsum.photos/seed/7605/1200/800',
    title: 'دانشجویان در محیط دانشگاهی',
    tag: 'محیط آموزشی'
  },
  {
    url: 'https://picsum.photos/seed/7732/1200/800',
    title: 'فارغ‌التحصیلی و موفقیت',
    tag: 'فارغ‌التحصیلی'
  },
  {
    url: 'https://picsum.photos/seed/7282/1200/800',
    title: 'ساختمان و محوطه دانشگاه',
    tag: 'پردیس دانشگاه'
  },
  {
    url: 'https://picsum.photos/seed/7631/1200/800',
    title: 'کارگاه‌های گروهی و مهارت‌آموزی',
    tag: 'کارگاه تخصصی'
  },
  {
    url: 'https://picsum.photos/seed/7607/1200/800',
    title: 'کلاس درس مدرن و هوشمند',
    tag: 'کلاس درس'
  },
  {
    url: 'https://picsum.photos/seed/7635/1200/800',
    title: 'کتابخانه و فضای پژوهش',
    tag: 'کتابخانه'
  },
  {
    url: 'https://picsum.photos/seed/7640/1200/800',
    title: 'آزمایشگاه تخصصی و پژوهشی',
    tag: 'آزمایشگاه'
  },
  {
    url: 'https://picsum.photos/seed/7655/1200/800',
    title: 'سایت کامپیوتر و فناوری اطلاعات',
    tag: 'فناوری و شبکه'
  },
  {
    url: 'https://picsum.photos/seed/7670/1200/800',
    title: 'سمینارها و رویدادهای علمی دانشگاه',
    tag: 'رویداد و همایش'
  },
  {
    url: 'https://picsum.photos/seed/7685/1200/800',
    title: 'پذیرش دانشجو و ثبت‌نام مقاطع تحصیلی',
    tag: 'پذیرش دانشجو'
  },
  {
    url: 'https://picsum.photos/seed/7692/1200/800',
    title: 'ورزش و تربیت بدنی دانشجویی',
    tag: 'ورزش و نشاط'
  },
  {
    url: 'https://picsum.photos/seed/7710/1200/800',
    title: 'جلسات هیات علمی و آموزشی',
    tag: 'آموزش عالی'
  }
];

export default function BannerManager() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [galleryAlbums, setGalleryAlbums] = useState<GalleryAlbum[]>([]);
  const [sourceType, setSourceType] = useState<'custom' | 'news' | 'gallery'>('custom');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewMode, setPreviewMode] = useState<'slider' | 'hero'>('slider');
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [deleteConfirmBanner, setDeleteConfirmBanner] = useState<BannerItem | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'server' | 'url' | 'presets'>('upload');
  const [isServerPickerOpen, setIsServerPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [cropperModal, setCropperModal] = useState<{
    isOpen: boolean;
    imageSrc: string | File | null;
  }>({
    isOpen: false,
    imageSrc: null
  });

  // Form State
  const [formData, setFormData] = useState({
    imageUrl: '',
    title: '',
    subtitle: '',
    link: '',
    showButton: true,
    buttonText: 'مشاهده جزئیات',
    order: 1,
    isActive: true,
    duration: 5
  });

  const loadBanners = async () => {
    const list = await storage.syncBannersWithDB();
    setBanners(list);
    setNewsList(await storage.getNews());
    setGalleryAlbums(await storage.getAlbums());
  };

  useEffect(() => {
    loadBanners();

    // به‌روزرسانی خودکار و بلادرنگ بدون نیاز به رفرش صفحه
    const handleBannersChanged = (e: any) => {
      const updated = e.detail || storage.getBanners();
      setBanners(updated);
    };

    window.addEventListener('kowsar_banners_changed', handleBannersChanged);
    window.addEventListener('storage', handleBannersChanged);

    return () => {
      window.removeEventListener('kowsar_banners_changed', handleBannersChanged);
      window.removeEventListener('storage', handleBannersChanged);
    };
  }, []);

  // پاک کردن خودکار پیام موفقیت پس از ۴ ثانیه
  useEffect(() => {
    if (saveSuccessMessage) {
      const timer = setTimeout(() => setSaveSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccessMessage]);

  // Open modal for new banner
  const handleOpenNew = () => {
    setEditingBanner(null);
    setFormData({
      imageUrl: '',
      title: '',
      subtitle: '',
      link: '',
      showButton: true,
      buttonText: 'مشاهده جزئیات',
      order: banners.length + 1,
      isActive: true,
      duration: 5
    });
    setImageInputMode('upload');
    setSourceType('custom');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (banner: BannerItem) => {
    setEditingBanner(banner);
    setFormData({
      imageUrl: banner.imageUrl,
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      link: banner.link || '',
      showButton: banner.showButton !== false,
      buttonText: banner.buttonText || 'مشاهده جزئیات',
      order: banner.order,
      isActive: banner.isActive,
      duration: banner.duration || 5
    });
    // Set appropriate tab based on existing image URL
    if (banner.imageUrl && (banner.imageUrl.startsWith('/uploads/') || banner.imageUrl.startsWith('data:'))) {
      setImageInputMode('upload');
    } else if (PRESET_IMAGES.some(p => p.url === banner.imageUrl)) {
      setImageInputMode('presets');
    } else {
      setImageInputMode('url');
    }
    setIsModalOpen(true);
  };

  // Handle crop complete
  const handleBannerCropComplete = (croppedFile: File, previewUrl: string, uploadResult?: any) => {
    const finalUrl = uploadResult?.url || previewUrl;
    setFormData((prev) => ({ ...prev, imageUrl: finalUrl }));
  };

  // Handle local file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert(`حجم تصویر انتخابی (${(file.size / (1024 * 1024)).toFixed(2)} مگابایت) بیشتر از سقف مجاز ۲۰ مگابایت است.`);
        return;
      }
      setIsUploading(true);
      try {
        const result = await uploadFileToServer(file, 'banners');
        if (result.success && result.url) {
          setFormData((prev) => ({ ...prev, imageUrl: result.url }));
        } else {
          alert('خطا در بارگذاری تصویر بنر: ' + (result.message || ''));
        }
      } catch (err: any) {
        alert('خطا در ارتباط با سرور: ' + (err.message || ''));
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Save Banner (Add or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl || !formData.imageUrl.trim()) {
      alert('لطفاً ابتدا یک تصویر برای اسلاید بنر انتخاب یا بارگذاری فرمایید.');
      return;
    }

    try {
      let updatedBanners: BannerItem[] = [];
      if (editingBanner) {
        storage.updateBanner({
          ...editingBanner,
          ...formData
        });
        updatedBanners = storage.getBanners();
        setSaveSuccessMessage('اسلاید بنر با موفقیت ویرایش و ذخیره شد.');
      } else {
        storage.addBanner(formData);
        updatedBanners = storage.getBanners();
        setSaveSuccessMessage(`اسلاید جدید (اسلاید شماره ${updatedBanners.length}) با موفقیت اضافه شد.`);
      }

      // Optimistic & Immediate UI update
      setBanners(updatedBanners);
      setIsModalOpen(false);
      setEditingBanner(null);

      // Reset formData
      setFormData({
        imageUrl: '',
        title: '',
        subtitle: '',
        link: '',
        showButton: true,
        buttonText: 'مشاهده جزئیات',
        order: updatedBanners.length + 1,
        isActive: true,
        duration: 5
      });
    } catch (err: any) {
      console.error('Error saving banner:', err);
      alert('خطا در ذخیره اسلاید بنر: ' + (err?.message || 'خطای ناشناخته'));
    }
  };

  // Delete Banner
  const executeDeleteBanner = async () => {
    if (!deleteConfirmBanner) return;
    const bannerId = deleteConfirmBanner.id;
    setDeleteConfirmBanner(null);
    storage.deleteBanner(bannerId);
    const updated = storage.getBanners();
    setBanners(updated);
    setSaveSuccessMessage('اسلاید با موفقیت حذف شد.');
    try {
      await storage.saveBannersToDB(updated);
    } catch (err) {
      console.warn('DB sync banners error:', err);
    }
  };

  // Move Order
  const handleMoveOrder = async (id: string, direction: 'up' | 'down') => {
    storage.moveBannerOrder(id, direction);
    const updated = storage.getBanners();
    setBanners(updated);
    setSaveSuccessMessage('اولویت نمایش اسلایدها با موفقیت تغییر یافت.');
    try {
      await storage.saveBannersToDB(updated);
    } catch (err) {
      console.warn('DB sync banners error:', err);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (id: string) => {
    storage.toggleBannerStatus(id);
    const updated = storage.getBanners();
    setBanners(updated);
    setSaveSuccessMessage('وضعیت نمایش اسلاید با موفقیت تغییر کرد.');
    try {
      await storage.saveBannersToDB(updated);
    } catch (err) {
      console.warn('DB sync banners error:', err);
    }
  };

  // Toggle Action Button (Show/Hide Details Button)
  const handleToggleActionButton = async (banner: BannerItem) => {
    const nextShowButton = banner.showButton === false ? true : false;
    const updatedBanner = { ...banner, showButton: nextShowButton };
    storage.updateBanner(updatedBanner);
    const updated = storage.getBanners();
    setBanners(updated);
    setSaveSuccessMessage(nextShowButton ? 'دکمه اقدام اسلاید فعال شد.' : 'دکمه اقدام اسلاید غیرفعال شد.');
    try {
      await storage.saveBannersToDB(updated);
    } catch (err) {
      console.warn('DB sync banners error:', err);
    }
  };

  // Reset to Defaults
  const executeResetToDefaults = async () => {
    setResetConfirmOpen(false);
    storage.resetBannersToDefault();
    const updated = storage.getBanners();
    setBanners(updated);
    setSaveSuccessMessage('تصاویر اسلایدر به حالت پیش‌فرض بازنشانی شد.');
    try {
      await storage.saveBannersToDB(updated);
    } catch (err) {
      console.warn('DB sync banners error:', err);
    }
  };

  const activeBanners = banners.filter(b => b.isActive);
  const safePreviewIndex = previewIndex >= activeBanners.length ? 0 : previewIndex;

  // Auto cycle preview
  useEffect(() => {
    if (!isAutoPlay || activeBanners.length <= 1) return;
    const currentDuration = (activeBanners[safePreviewIndex]?.duration || 5) * 1000;
    const timer = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % activeBanners.length);
    }, currentDuration);
    return () => clearInterval(timer);
  }, [activeBanners.length, safePreviewIndex, activeBanners, isAutoPlay]);

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Alert Message */}
      <AnimatePresence>
        {saveSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-2.5 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button
              onClick={() => setSaveSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Images className="w-6 h-6" />
            </div>
            مدیریت تصاویر و بنر اسلایدر اصلی
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            تصاویر بنر صفحه اول سایت را ویرایش، اولویت‌بندی، فعال/غیرفعال یا جایگزین کنید. (ظرفیت اسلایدها نامحدود است)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-sm transition-all"
            title="بازنشانی به تصاویر پیش‌فرض"
          >
            <RotateCcw className="w-4 h-4" />
            تصاویر پیش‌فرض
          </button>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            افزودن تصویر بنر جدید
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 mb-1">تعداد کل اسلایدها</div>
            <div className="text-2xl font-black text-slate-800">{banners.length} <span className="text-sm font-normal text-slate-400">تصویر</span></div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Images className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 mb-1">اسلایدهای فعال (در حال نمایش)</div>
            <div className="text-2xl font-black text-emerald-600">{activeBanners.length} <span className="text-sm font-normal text-slate-400">اسلاید</span></div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 mb-1">غیرفعال (مخفی)</div>
            <div className="text-2xl font-black text-amber-600">{banners.length - activeBanners.length} <span className="text-sm font-normal text-slate-400">اسلاید</span></div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <EyeOff className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 mb-1">ظرفیت اسلایدها</div>
            <div className="text-xl font-black text-indigo-600">نامحدود <span className="text-xs font-normal text-slate-400">بدون سقف</span></div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Live Preview Toggle & Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">پیش‌نمایش زنده و واقعی اسلایدر در صفحه اصلی</h2>
                <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                  تطابق کامل با سایت
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ابعاد، زیرنویس، دکمه و قاب دقیقاً همانگونه که در صفحه اول سایت به کاربران نمایش داده می‌شود.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPreviewMode('slider')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  previewMode === 'slider'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>قاب اسلایدر</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('hero')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  previewMode === 'hero'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>نمای کامل هدر صفحه اول</span>
              </button>
            </div>

            {/* Play/Pause Autoplay */}
            <button
              type="button"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                isAutoPlay
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title={isAutoPlay ? 'توقف ورق خوردن خودکار' : 'فعال‌سازی ورق خوردن خودکار'}
            >
              {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Toggle Preview visibility */}
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
            >
              {showLivePreview ? 'بستن پیش‌نمایش' : 'نمایش پیش‌نمایش'}
            </button>
          </div>
        </div>

        {showLivePreview && (
          <div className="space-y-4">
            {activeBanners.length > 0 ? (
              <div>
                {/* Mode 1: Pure Slider Frame Preview (Matches Hero Slider exactly) */}
                {previewMode === 'slider' ? (
                  <div className="max-w-4xl mx-auto">
                    <div className="relative rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(37,99,235,0.15)] aspect-[16/11] sm:aspect-[4/3] md:aspect-[16/11] bg-slate-900 group">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeBanners[safePreviewIndex]?.id || safePreviewIndex}
                          initial={{ opacity: 0, scale: 1.02 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.4 }}
                          className="absolute inset-0 w-full h-full"
                        >
                          <img
                            src={activeBanners[safePreviewIndex]?.imageUrl}
                            alt={activeBanners[safePreviewIndex]?.title || 'بنر اسلایدر'}
                            className="w-full h-full object-cover"
                          />

                          {/* Real Hero-matching Glass Caption Box */}
                          {(activeBanners[safePreviewIndex]?.title || activeBanners[safePreviewIndex]?.subtitle) && (
                            <div className="absolute left-3 right-3 sm:left-6 sm:right-6 bottom-3 sm:bottom-6 z-10 flex justify-center pointer-events-none">
                              <div className="bg-black/50 backdrop-blur-md rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-4 max-w-full border border-white/15 shadow-xl pointer-events-auto transition-all">
                                <div className="min-w-0 flex-1 text-right">
                                  {activeBanners[safePreviewIndex]?.title && (
                                    <h3 className="font-bold text-xs sm:text-sm md:text-base text-white truncate drop-shadow-sm">
                                      {activeBanners[safePreviewIndex]?.title}
                                    </h3>
                                  )}
                                  {activeBanners[safePreviewIndex]?.subtitle && (
                                    <p className="text-[10px] sm:text-xs text-slate-200/90 truncate font-light mt-0.5 drop-shadow-sm">
                                      {activeBanners[safePreviewIndex]?.subtitle}
                                    </p>
                                  )}
                                </div>
                                {activeBanners[safePreviewIndex]?.link && activeBanners[safePreviewIndex]?.showButton !== false && (
                                  <div className="shrink-0 text-[10px] sm:text-[11px] text-white font-bold inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-xl transition-colors cursor-pointer">
                                    <span>{activeBanners[safePreviewIndex]?.buttonText || 'مشاهده جزئیات'}</span>
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>

                      {/* Slider Navigation Arrows */}
                      {activeBanners.length > 1 && (
                        <div className="absolute inset-0 z-20 flex items-center justify-between p-3 sm:p-4 pointer-events-none">
                          <button
                            type="button"
                            onClick={() => setPreviewIndex((safePreviewIndex - 1 + activeBanners.length) % activeBanners.length)}
                            aria-label="اسلاید قبلی"
                            className="pointer-events-auto bg-white/30 hover:bg-white/50 backdrop-blur-md text-white p-2 sm:p-2.5 rounded-full transition-all hover:scale-110 shadow-lg"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewIndex((safePreviewIndex + 1) % activeBanners.length)}
                            aria-label="اسلاید بعدی"
                            className="pointer-events-auto bg-white/30 hover:bg-white/50 backdrop-blur-md text-white p-2 sm:p-2.5 rounded-full transition-all hover:scale-110 shadow-lg"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      {/* Slider Pagination Dots */}
                      {activeBanners.length > 1 && (
                        <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-auto">
                          {activeBanners.map((b, idx) => (
                            <button
                              key={b.id}
                              onClick={() => setPreviewIndex(idx)}
                              aria-label={`رفتن به اسلاید ${idx + 1}`}
                              className={`h-1.5 rounded-full transition-all ${
                                idx === safePreviewIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Mode 2: Full Hero Section Preview (Exact Home Page layout) */
                  <div className="rounded-3xl bg-slate-50 p-4 sm:p-6 lg:p-8 border border-slate-200/80 shadow-inner">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center max-w-6xl mx-auto">
                      {/* Right column of Hero */}
                      <div className="lg:col-span-5 text-right space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-800 text-xs font-bold">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                          <span>مرکز آموزش علمی کاربردی کوثر کاکی</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-800 leading-snug">
                          دانشگاه جامع علمی کاربردی مرکز کوثر کاکی
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          پیشگام در آموزش‌های مهارتی، کارآفرینی و مهارت‌محور استان بوشهر با امکانات آموزشی و رفاهی استاندارد.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <span className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20">
                            ثبت‌نام آنلاین
                          </span>
                          <span className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                            فرم‌های ضروری
                          </span>
                        </div>
                      </div>

                      {/* Left column: the slider */}
                      <div className="lg:col-span-7">
                        <div className="relative rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(37,99,235,0.15)] aspect-[16/11] sm:aspect-[4/3] md:aspect-[16/11] bg-slate-900 group">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeBanners[safePreviewIndex]?.id || safePreviewIndex}
                              initial={{ opacity: 0, scale: 1.02 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.4 }}
                              className="absolute inset-0 w-full h-full"
                            >
                              <img
                                src={activeBanners[safePreviewIndex]?.imageUrl}
                                alt={activeBanners[safePreviewIndex]?.title || 'بنر اسلایدر'}
                                className="w-full h-full object-cover"
                              />

                              {/* Real Hero-matching Glass Caption Box */}
                              {(activeBanners[safePreviewIndex]?.title || activeBanners[safePreviewIndex]?.subtitle) && (
                                <div className="absolute left-3 right-3 sm:left-6 sm:right-6 bottom-3 sm:bottom-6 z-10 flex justify-center pointer-events-none">
                                  <div className="bg-black/50 backdrop-blur-md rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-4 max-w-full border border-white/15 shadow-xl pointer-events-auto transition-all">
                                    <div className="min-w-0 flex-1 text-right">
                                      {activeBanners[safePreviewIndex]?.title && (
                                        <h3 className="font-bold text-xs sm:text-sm md:text-base text-white truncate drop-shadow-sm">
                                          {activeBanners[safePreviewIndex]?.title}
                                        </h3>
                                      )}
                                      {activeBanners[safePreviewIndex]?.subtitle && (
                                        <p className="text-[10px] sm:text-xs text-slate-200/90 truncate font-light mt-0.5 drop-shadow-sm">
                                          {activeBanners[safePreviewIndex]?.subtitle}
                                        </p>
                                      )}
                                    </div>
                                    {activeBanners[safePreviewIndex]?.link && activeBanners[safePreviewIndex]?.showButton !== false && (
                                      <div className="shrink-0 text-[10px] sm:text-[11px] text-white font-bold inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-xl transition-colors">
                                        <span>{activeBanners[safePreviewIndex]?.buttonText || 'مشاهده جزئیات'}</span>
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          </AnimatePresence>

                          {/* Navigation */}
                          {activeBanners.length > 1 && (
                            <div className="absolute inset-0 z-20 flex items-center justify-between p-3 sm:p-4 pointer-events-none">
                              <button
                                type="button"
                                onClick={() => setPreviewIndex((safePreviewIndex - 1 + activeBanners.length) % activeBanners.length)}
                                className="pointer-events-auto bg-white/30 hover:bg-white/50 backdrop-blur-md text-white p-2 rounded-full transition-all shadow-lg"
                              >
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreviewIndex((safePreviewIndex + 1) % activeBanners.length)}
                                className="pointer-events-auto bg-white/30 hover:bg-white/50 backdrop-blur-md text-white p-2 rounded-full transition-all shadow-lg"
                              >
                                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            </div>
                          )}

                          {/* Dots */}
                          {activeBanners.length > 1 && (
                            <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full pointer-events-auto">
                              {activeBanners.map((b, idx) => (
                                <button
                                  key={b.id}
                                  onClick={() => setPreviewIndex(idx)}
                                  className={`h-1.5 rounded-full transition-all ${
                                    idx === safePreviewIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Banner Status bar below preview */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-2xl text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-slate-700">
                      اسلاید در حال نمایش: <span className="text-blue-600 font-black">{safePreviewIndex + 1}</span> از <span className="font-bold">{activeBanners.length}</span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      مدت مکث: <strong className="text-slate-800">{activeBanners[safePreviewIndex]?.duration || 5} ثانیه</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600">
                      اولویت نمایش: <strong className="text-slate-800">#{activeBanners[safePreviewIndex]?.order}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(activeBanners[safePreviewIndex])}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ویرایش این اسلاید</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm font-bold flex flex-col items-center justify-center p-8 bg-amber-50/60 rounded-2xl border border-amber-200/70 gap-2">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <p>هیچ اسلاید فعالی در حال حاضر وجود ندارد. لطفاً حداقل یک بنر را فعال کنید تا در صفحه اول نمایش داده شود.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Banners List & Priority Order */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">لیست بنرها و ترتیب اولویت</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              برای تغییر ترتیب و اولویت نمایش در سایت، از دکمه‌های بالا و پایین یا اولویت عددی استفاده کنید.
            </p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
            مرتب‌سازی خودکار بر اساس اولویت (از چپ به راست)
          </span>
        </div>

        {banners.length === 0 ? (
          <div className="text-center py-16">
            <Images className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold text-lg mb-2">هنوز هیچ تصویری برای بنر تعریف نشده است.</p>
            <p className="text-slate-400 text-sm mb-6">با کلیک بر روی دکمه زیر اولین تصویر بنر را اضافه کنید.</p>
            <button
              onClick={handleOpenNew}
              className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
            >
              افزودن اولین تصویر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  banner.isActive 
                    ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md' 
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                {/* Left Side: Thumbnail & Details */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {/* Order Rank Badge */}
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black text-sm shrink-0 border border-blue-100">
                    <span className="text-[10px] text-blue-400 font-medium">رتبه</span>
                    #{banner.order}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative group">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'بنر'}
                      className="w-full h-full object-cover"
                    />
                    {!banner.isActive && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[10px] font-bold">
                        غیرفعال
                      </div>
                    )}
                  </div>

                  {/* Title & Info */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-base truncate">
                        {banner.title || 'بدون عنوان (تنها تصویر)'}
                      </h3>
                      {banner.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" /> فعال
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3 h-3" /> غیرفعال
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3" /> {banner.duration || 5} ثانیه
                      </span>
                    </div>

                    {banner.subtitle && (
                      <p className="text-xs text-slate-500 line-clamp-1 font-light">
                        {banner.subtitle}
                      </p>
                    )}

                    {banner.link && (
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="text-blue-600 font-medium flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" /> {banner.link}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActionButton(banner);
                          }}
                          className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[10px] transition-all ${
                            banner.showButton !== false
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 line-through'
                          }`}
                          title={banner.showButton !== false ? 'کلیک کنید تا دکمه جزئیات غیرفعال شود' : 'کلیک کنید تا دکمه جزئیات فعال شود'}
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          {banner.showButton !== false ? `دکمه: «${banner.buttonText || 'مشاهده جزئیات'}» (فعال)` : 'دکمه جزئیات (غیرفعال)'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Reordering & Actions */}
                <div className="flex items-center gap-2 self-end md:self-center w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  {/* Quick Toggle Details Button (Show / Hide) */}
                  {banner.link && (
                    <button
                      onClick={() => handleToggleActionButton(banner)}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                        banner.showButton !== false
                          ? 'text-blue-600 bg-blue-50/70 hover:bg-blue-100'
                          : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                      }`}
                      title={banner.showButton !== false ? 'غیرفعال کردن دکمه جزئیات روی بنر' : 'فعال کردن دکمه جزئیات روی بنر'}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-[11px] hidden sm:inline">{banner.showButton !== false ? 'دکمه فعال' : 'دکمه غیرفعال'}</span>
                    </button>
                  )}
                  {/* Move Up / Down */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                    <button
                      onClick={() => handleMoveOrder(banner.id, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      title="افزایش اولویت (حرکت به بالا)"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(banner.id, 'down')}
                      disabled={index === banners.length - 1}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                      title="کاهش اولویت (حرکت به پایین)"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Toggle Status */}
                  <button
                    onClick={() => handleToggleStatus(banner.id)}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                      banner.isActive 
                        ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' 
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={banner.isActive ? 'مخفی کردن اسلاید' : 'فعال‌سازی اسلاید'}
                  >
                    {banner.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(banner)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="ویرایش اسلاید"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmBanner(banner)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="حذف اسلاید"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Images className="w-5 h-5 text-blue-600" />
                {editingBanner ? 'ویرایش تصویر بنر' : 'افزودن تصویر بنر جدید'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} noValidate className="p-6 space-y-6">
              {/* Image Input Source Tabs */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">انتخاب یا آپلود تصویر بنر</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      imageInputMode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    آپلود از دستگاه
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageInputMode('server');
                      setIsServerPickerOpen(true);
                    }}
                    className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      imageInputMode === 'server' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'
                    }`}
                  >
                    <HardDrive className="w-3.5 h-3.5 text-blue-500" />
                    مخزن سرور (پارس‌پک)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      imageInputMode === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    لینک مستقیم (URL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('presets')}
                    className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      imageInputMode === 'presets' ? 'bg-white text-blue-600 shadow-sm' : 'hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    تصاویر آماده
                  </button>
                </div>

                {/* Server Storage Mode */}
                {imageInputMode === 'server' && (
                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                          <HardDrive className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">مخزن و فضای ذخیره‌سازی سرور</h4>
                          <p className="text-[11px] text-slate-500">انتخاب از میان تصاویر موجود روی سرور یا آپلود مستقیم در پوشه بنرها</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsServerPickerOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        باز کردن مخزن تصاویر سرور
                      </button>
                    </div>

                    {formData.imageUrl && (
                      <div className="mt-2 p-3 bg-white rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-slate-700 truncate font-mono text-[11px]" dir="ltr">{formData.imageUrl}</span>
                        </div>
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md shrink-0">تصویر انتخاب شده</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Mode */}
                {imageInputMode === 'upload' && (
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      id="banner-file"
                      disabled={isUploading}
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {formData.imageUrl ? (
                      <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                          <div className="relative w-20 h-16 rounded-xl overflow-hidden border border-emerald-300 shadow-xs flex-shrink-0 bg-white group">
                            <img 
                              src={formData.imageUrl} 
                              alt="تصویر فعلی" 
                              className="w-full h-full object-cover" 
                            />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, imageUrl: '' })}
                              className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-600 text-white p-1 rounded-md opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                              title="حذف تصویر"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                              تصویر آپلود شده و آماده است
                            </div>
                            <p className="text-[11px] text-emerald-700/80 mt-0.5 truncate max-w-xs font-mono" dir="ltr">
                              {formData.imageUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-emerald-200/60">
                          <button
                            type="button"
                            onClick={() => setCropperModal({
                              isOpen: true,
                              imageSrc: formData.imageUrl
                            })}
                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            title="برش و کادربندی استاندارد (Crop)"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>برش و کادربندی</span>
                          </button>
                          <label
                            htmlFor="banner-file"
                            className={`cursor-pointer px-3.5 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                              isUploading ? 'opacity-60 pointer-events-none' : ''
                            }`}
                          >
                            {isUploading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>{isUploading ? 'در حال آپلود...' : 'تغییر تصویر'}</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                            title="حذف این تصویر"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>حذف تصویر</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-6 text-center transition-colors bg-slate-50">
                        <label htmlFor="banner-file" className={`cursor-pointer flex flex-col items-center justify-center ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                            {isUploading ? (
                              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                            ) : (
                              <Upload className="w-6 h-6" />
                            )}
                          </div>
                          <span className="font-bold text-sm text-slate-700 mb-1">
                            {isUploading ? 'در حال ارسال و ذخیره‌سازی تصویر روی سرور...' : 'برای انتخاب تصویر کلیک کنید یا فایل را اینجا رها کنید'}
                          </span>
                          <span className="text-xs text-slate-400">ذخیره مستقیم در هاست دانشگاه • تبدیل خودکار به WebP</span>
                        </label>
                      </div>
                    )}

                    {/* Upload Guidelines Box */}
                    <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-100 text-slate-600 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        <span>راهنمای آپلود تصویر بنر:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>• <strong>حجم مجاز:</strong> تا ۲۰ مگابایت با فشرده‌سازی خودکار در مرورگر</div>
                        <div>• <strong>فرمت‌های مجاز:</strong> JPG, PNG, WebP, GIF, SVG</div>
                        <div>• <strong>نسبت استاندارد بنر:</strong> ۱۶:۹ یا عریض (حداقل ۱۹۲۰×۱۰۸۰ پیکسل)</div>
                        <div>• <strong>سرعت بهینه:</strong> تصاویر به فرمت پرسرعت WebP تبدیل خواهند شد</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct URL Mode */}
                {imageInputMode === 'url' && (
                  <div>
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg یا /uploads/banner.jpg"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      dir="ltr"
                    />
                  </div>
                )}

                {/* Preset Gallery Mode */}
                {imageInputMode === 'presets' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-1">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <div
                        key={idx}
                        onClick={() => setFormData({ 
                          ...formData, 
                          imageUrl: preset.url,
                          title: formData.title || preset.title 
                        })}
                        className={`cursor-pointer rounded-xl overflow-hidden border-2 relative group transition-all ${
                          formData.imageUrl === preset.url ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent hover:border-slate-300'
                        }`}
                      >
                        <img src={preset.url} alt={preset.title} className="w-full h-20 object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 p-1.5 flex flex-col justify-end text-white text-[10px] font-bold">
                          {preset.tag}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Live Selected Image Preview */}
                {formData.imageUrl && (
                  <div className="mt-4 relative rounded-2xl overflow-hidden border border-slate-200 aspect-[16/8] max-h-44 bg-slate-100 shadow-inner group">
                    <img src={formData.imageUrl} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-lg font-bold">
                      پیش‌نمایش تصویر بنر
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute top-2 left-2 bg-red-600/90 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer"
                      title="حذف تصویر"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف تصویر</span>
                    </button>
                  </div>
                )}
              </div>

              
              {/* Quick Content Filler */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <label className="text-sm font-bold text-slate-700">اتصال سریع به محتوای سایت (پر کردن خودکار)</label>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold text-slate-600 mb-3">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
                    <input type="radio" checked={sourceType === 'custom'} onChange={() => setSourceType('custom')} className="text-blue-600" /> سفارشی (دستی)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
                    <input type="radio" checked={sourceType === 'news'} onChange={() => setSourceType('news')} className="text-blue-600" /> از اخبار سایت
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600">
                    <input type="radio" checked={sourceType === 'gallery'} onChange={() => setSourceType('gallery')} className="text-blue-600" /> از نگارخانه
                  </label>
                </div>

                {sourceType === 'news' && (
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onChange={(e) => {
                      const newsId = e.target.value;
                      const selectedNews = newsList.find(n => n.id === parseInt(newsId));
                      if (selectedNews) {
                        setFormData({
                          ...formData,
                          title: selectedNews.title,
                          subtitle: selectedNews.summary || selectedNews.subtitle || '',
                          imageUrl: selectedNews.image || formData.imageUrl,
                          link: `/news/${selectedNews.id}`
                        });
                        setImageInputMode('url');
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>یک خبر را جهت نمایش در بنر انتخاب کنید...</option>
                    {newsList.map(n => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                )}

                {sourceType === 'gallery' && (
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onChange={(e) => {
                      const albumId = e.target.value;
                      const album = galleryAlbums.find(a => a.id === albumId);
                      if (album) {
                        setFormData({
                          ...formData,
                          title: album.title,
                          subtitle: album.description || '',
                          imageUrl: album.coverImage || formData.imageUrl,
                          link: `/gallery/${album.id}`
                        });
                        setImageInputMode('url');
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>یک آلبوم نگارخانه را جهت نمایش در بنر انتخاب کنید...</option>
                    {galleryAlbums.map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Title & Subtitle */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    عنوان بنر (اختیاری)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: آغاز ثبت‌نام کاردانی و کارشناسی"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    زیرعنوان یا توضیحات کوتاه (اختیاری)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: بدون کنکور با تخفیف ویژه شهریه"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Link, Button Settings, Priority and Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    آدرس لینک مقصد (URL)
                  </label>
                  <input
                    type="text"
                    placeholder="/register یا https://..."
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    اولویت ترتیب نمایش (عدد)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    مدت مکث اسلاید (ثانیه)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 5 })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center font-bold"
                  />
                </div>
              </div>

              {/* Action Button Toggle & Custom Label */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="banner-show-button"
                      checked={formData.showButton}
                      onChange={(e) => setFormData({ ...formData, showButton: e.target.checked })}
                      className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <label htmlFor="banner-show-button" className="cursor-pointer select-none">
                      <div className="font-bold text-sm text-slate-800">فعال بودن دکمه جزئیات / اقدام روی بنر</div>
                      <div className="text-xs text-slate-500">با غیرفعال کردن این گزینه، دکمه روی بنر حذف شده و فقط تصویر/متن نمایش می‌یابد.</div>
                    </label>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${formData.showButton ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                    {formData.showButton ? 'دکمه فعال' : 'دکمه غیرفعال'}
                  </span>
                </div>

                {formData.showButton && (
                  <div className="pt-2 border-t border-blue-100">
                    <label className="block text-xs font-bold text-slate-700 mb-1">متن روی دکمه (پیش‌فرض: مشاهده جزئیات)</label>
                    <input
                      type="text"
                      placeholder="مشاهده جزئیات / ثبت‌نام آنلاین / اطلاعات بیشتر..."
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input
                  type="checkbox"
                  id="banner-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="banner-active" className="cursor-pointer select-none">
                  <div className="font-bold text-sm text-slate-800">فعال بودن این اسلاید در سایت</div>
                  <div className="text-xs text-slate-500">اگر غیرفعال باشد، اسلاید در صفحه اصلی نمایش داده نخواهد شد.</div>
                </label>
              </div>

              {/* Live Preview Inside Modal */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <Sparkles className="w-3.5 h-3.5" />
                    پیش‌نمایش زنده این اسلاید (همانگونه که در صفحه اول نمایش داده می‌شود)
                  </span>
                  <span className="text-slate-400 font-normal">کادربندی ۱۶:۱۱</span>
                </div>
                <div className="relative rounded-2xl overflow-hidden aspect-[16/11] bg-slate-900 shadow-md border border-slate-200">
                  <img
                    src={formData.imageUrl || 'https://picsum.photos/seed/7605/1200/800'}
                    alt={formData.title || 'پیش‌نمایش اسلاید'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/7605/1200/800';
                    }}
                  />
                  {(formData.title || formData.subtitle) && (
                    <div className="absolute left-3 right-3 bottom-3 z-10 flex justify-center pointer-events-none">
                      <div className="bg-black/50 backdrop-blur-md rounded-xl px-3.5 py-2 flex items-center justify-between gap-3 max-w-full border border-white/15 shadow-lg w-full">
                        <div className="min-w-0 flex-1 text-right">
                          {formData.title && (
                            <h4 className="font-bold text-xs text-white truncate drop-shadow-sm">
                              {formData.title}
                            </h4>
                          )}
                          {formData.subtitle && (
                            <p className="text-[10px] text-slate-200/90 truncate font-light mt-0.5 drop-shadow-sm">
                              {formData.subtitle}
                            </p>
                          )}
                        </div>
                        {formData.showButton && (
                          <div className="shrink-0 text-[10px] text-white font-bold inline-flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg">
                            <span>{formData.buttonText || 'مشاهده جزئیات'}</span>
                            <ArrowLeft className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-sm transition-all"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
                >
                  {editingBanner ? 'ذخیره تغییرات' : 'افزودن اسلاید'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteConfirmBanner)}
        onClose={() => setDeleteConfirmBanner(null)}
        onConfirm={executeDeleteBanner}
        title="حذف اسلاید بنر"
        itemName={deleteConfirmBanner?.title || 'این تصویر اسلایدر'}
        details={deleteConfirmBanner ? [
          { label: 'اولویت اسلاید', value: `#${deleteConfirmBanner.order}` },
          { label: 'مدت نمایش', value: `${deleteConfirmBanner.duration || 5} ثانیه` }
        ] : undefined}
      />

      {/* Reset Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={executeResetToDefaults}
        variant="warning"
        title="بازنشانی بنرها به حالت پیش‌فرض"
        message="آیا از بازنشانی تمامی تصاویر و تنظیمات اسلایدر صفحه اصلی به مقادیر اولیه دانشگاه اطمینان دارید؟"
        confirmText="بله، بازنشانی شود"
        icon={RotateCcw}
      />

      {/* UNIVERSAL IMAGE CROPPER MODAL */}
      <ImageCropperModal
        isOpen={cropperModal.isOpen}
        onClose={() => setCropperModal(prev => ({ ...prev, isOpen: false }))}
        imageSrc={cropperModal.imageSrc}
        initialAspectRatio={16 / 9}
        title="برش و کادربندی استاندارد تصویر اسلایدر اصلی"
        targetFolder="banners"
        onCropComplete={handleBannerCropComplete}
      />

      {/* SERVER IMAGE PICKER MODAL */}
      <ServerImagePickerModal
        isOpen={isServerPickerOpen}
        onClose={() => setIsServerPickerOpen(false)}
        onSelect={(imgUrl) => {
          setFormData(prev => ({ ...prev, imageUrl: imgUrl }));
          setIsServerPickerOpen(false);
        }}
        initialFolder="banners"
        title="انتخاب تصویر بنر اسلایدر از سرور"
      />
    </div>
  );
}
