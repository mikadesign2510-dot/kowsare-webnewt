import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Edit2, Trash2, Save, X, Eye, EyeOff, Layout, Type, 
  Image as ImageIcon, Sparkles, AlertCircle, ArrowUp, ArrowDown,
  Upload, UploadCloud, Crop, RefreshCw, Maximize2, Check,
  Camera, Sliders, ExternalLink, HelpCircle, Layers, Award,
  ShieldCheck, Bookmark, Compass, Box, Palette, Link2,
  ArrowLeftRight, AlignRight, AlignCenter, AlignJustify, Columns2
} from 'lucide-react';
import { 
  storage, 
  PresentationSection, 
  PresentationFrameStyle, 
  defaultPresentationSections
} from '../../lib/storage';
import { toPersianDigits } from '../../lib/utils';
import { uploadFileToServer, optimizeImageToWebP } from '../../lib/uploadHelper';
import ImageCropperModal from '../../components/admin/ImageCropperModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';

// Available Frame Designs for Presentation Section - 3 Simple Clean Styles
const PRESENTATION_FRAME_STYLES: {
  id: PresentationFrameStyle;
  title: string;
  desc: string;
  badge: string;
  gradient: string;
}[] = [
  {
    id: 'rounded-standard',
    title: 'قاب استاندارد مینیمال',
    desc: 'طراحی ساده، تمیز و بزرگ با لبه‌های ملایم و سایه استاندارد عمیق',
    badge: 'پیش‌فرض',
    gradient: 'from-slate-700 to-slate-900'
  },
  {
    id: 'glass-card',
    title: 'قاب شیشه‌ای مدرن (Glass)',
    desc: 'حاشیه بلورین شیشه‌ای مات همراه با هاله نوری ملایم در پس‌زمینه',
    badge: 'مدرن',
    gradient: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'golden-gallery',
    title: 'قاب طلایی لوکس (Gold)',
    desc: 'کادر طلایی شیک آکادمیک برای جلوه رسمی و شاخص بخش معرفی مرکز',
    badge: 'ویژه',
    gradient: 'from-amber-400 to-yellow-600'
  }
];

// Preset Color Palettes & Background Themes for Slides
const PRESENTATION_COLOR_PALETTES = [
  { id: 'primary', label: 'آبی دانشگاهی', bg: 'from-blue-900 via-indigo-950 to-slate-950', border: 'border-blue-500', hex: '#2563eb' },
  { id: 'ocean', label: 'اقیانوس لاجوردی', bg: 'from-sky-900 via-blue-950 to-slate-950', border: 'border-sky-500', hex: '#0284c7' },
  { id: 'emerald', label: 'زمرد و فیروزه', bg: 'from-emerald-950 via-teal-950 to-slate-950', border: 'border-emerald-500', hex: '#059669' },
  { id: 'royal', label: 'ارغوانی سلطنتی', bg: 'from-purple-950 via-indigo-950 to-slate-950', border: 'border-purple-500', hex: '#7c3aed' },
  { id: 'amber', label: 'کهربایی و زرین', bg: 'from-amber-950 via-stone-900 to-slate-950', border: 'border-amber-500', hex: '#d97706' },
  { id: 'ruby', label: 'یاقوت سرخ', bg: 'from-rose-950 via-red-950 to-slate-950', border: 'border-rose-500', hex: '#e11d48' },
  { id: 'midnight', label: 'شب مهتابی (مشکی عمیق)', bg: 'from-slate-950 via-black to-slate-950', border: 'border-slate-700', hex: '#0f172a' },
  { id: 'gradient', label: 'شفق نئونی سه‌بعدی', bg: 'from-fuchsia-950 via-indigo-950 to-cyan-950', border: 'border-fuchsia-500', hex: '#c026d3' },
  { id: 'dark', label: 'تاریک استاندارد', bg: 'from-slate-900 via-slate-950 to-slate-900', border: 'border-slate-600', hex: '#1e293b' },
  { id: 'light', label: 'روشن و مینیمال', bg: 'from-slate-100 via-white to-slate-200', border: 'border-slate-300', hex: '#f8fafc' },
];

// Preset sample photos suitable for university presentation / about sections
const PRESENTATION_PRESET_IMAGES = [
  {
    title: 'ساختمان مرکزی و پردیس دانشگاه',
    url: 'https://picsum.photos/seed/7742/1200/800',
    tag: 'پردیس'
  },
  {
    title: 'کتابخانه تخصصی و سالن مطالعه',
    url: 'https://picsum.photos/seed/7662/1200/800',
    tag: 'کتابخانه'
  },
  {
    title: 'آزمایشگاه‌ها و مراکز تحقیقاتی پیشرفته',
    url: 'https://picsum.photos/seed/7621/1200/800',
    tag: 'پژوهش'
  },
  {
    title: 'سالن همایش و کنفرانس‌های بین‌المللی',
    url: 'https://picsum.photos/seed/7586/1200/800',
    tag: 'همایش'
  },
  {
    title: 'فضای فناوری و مرکز رشد نوآوری',
    url: 'https://picsum.photos/seed/7557/1200/800',
    tag: 'نوآوری'
  },
  {
    title: 'محیط آموزشی و کلاس‌های تعاملی',
    url: 'https://picsum.photos/seed/7615/1200/800',
    tag: 'آموزش'
  }
];

export default function PresentationManager() {
  const [sections, setSections] = useState<PresentationSection[]>(() => {
    const data = storage.getPresentationSections();
    return data.length > 0 ? data.sort((a, b) => a.order - b.order) : defaultPresentationSections;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<PresentationSection | null>(null);

  // Saving state & notifications
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);

  // Upload & Image selection state
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'presets' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');

  // Universal Cropper Modal State
  const [cropperModal, setCropperModal] = useState<{
    isOpen: boolean;
    imageSrc: string | File | null;
    initialRatio?: number | null;
    title?: string;
  }>({
    isOpen: false,
    imageSrc: null,
    initialRatio: 21 / 9,
    title: 'برش و تنظیم کادر استاندارد تصویر معرفی مرکز'
  });

  // Fullscreen Preview Modal
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Delete Confirmation Modal state
  const [sectionToDelete, setSectionToDelete] = useState<PresentationSection | null>(null);

  useEffect(() => {
    loadSections();
    // Load from database on startup to ensure synchronization
    storage.syncPresentationWithDB().then(dbSections => {
      if (dbSections && dbSections.length > 0) {
        setSections(dbSections.sort((a, b) => a.order - b.order));
      }
    });
  }, []);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!isEditing) {
          handleSaveAllChanges();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sections, isEditing]);

  const loadSections = () => {
    const data = storage.getPresentationSections();
    // Sort by order
    setSections(data.sort((a, b) => a.order - b.order));
  };

  const handleSaveAllChanges = async (customSections?: PresentationSection[]) => {
    const targetSections = customSections || sections;
    setIsSavingAll(true);
    setSaveStatus('saving');
    setSaveStatusMessage('در حال ذخیره‌سازی و همگام‌سازی در پایگاه داده...');

    try {
      storage.savePresentationSections(targetSections);
      const res = await storage.savePresentationSectionsToDB(targetSections);
      
      setSaveStatus('saved');
      setSaveStatusMessage(res?.message || 'تغییرات صفحه معرفی مرکز با موفقیت در پایگاه داده ذخیره و در سایت منتشر شد.');

      storage.addSecurityLog({
        eventType: 'data_modified',
        severity: 'low',
        message: 'ذخیره سراسری بخش‌های معرفی مرکز',
        details: `تعداد کل بخش‌ها: ${targetSections.length}`
      });

      setTimeout(() => {
        setSaveStatus('idle');
        setSaveStatusMessage(null);
      }, 4000);
    } catch (err: any) {
      console.error('Error saving presentation:', err);
      setSaveStatus('error');
      setSaveStatusMessage('خطا در همگام‌سازی با سرور. تغییرات در حافظه مرورگر ذخیره شد.');
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveStatusMessage(null);
      }, 5000);
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleAddNew = () => {
    setEditingSection({
      id: `section-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      order: sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 1,
      title: '',
      subtitle: '',
      content: '',
      image: '',
      imagePosition: 'left',
      textAlignment: 'right',
      contentRatio: 'balanced',
      verticalAlign: 'center',
      animationStyle: 'fade',
      imageAnimationStyle: 'rotate-3d',
      frameStyle: 'floating-isometric',
      frameBadgeText: '',
      showOverlayText: true,
      overlaySubtitle: '',
      overlayPosition: 'top-right',
      overlayStyle: 'badge',
      theme: 'light',
      animationDuration: 0.8,
      animationEasing: 'easeOut',
      isVisible: true
    });
    setUrlInput('');
    setIsEditing(true);
  };

  const handleEdit = (section: PresentationSection) => {
    setEditingSection({ 
      ...section,
      imagePosition: section.imagePosition || 'left',
      textAlignment: section.textAlignment || 'right',
      contentRatio: section.contentRatio || 'balanced',
      verticalAlign: section.verticalAlign || 'center',
      showOverlayText: section.showOverlayText !== false,
      overlaySubtitle: section.overlaySubtitle || '',
      overlayPosition: section.overlayPosition || 'top-right',
      overlayStyle: section.overlayStyle || 'badge'
    });
    setUrlInput(section.image || '');
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    const section = sections.find(s => s.id === id);
    if (section) {
      setSectionToDelete(section);
    }
  };

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return;
    const id = sectionToDelete.id;
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    storage.savePresentationSections(updated);
    await storage.savePresentationSectionsToDB(updated);
    
    setSaveStatus('saved');
    setSaveStatusMessage('بخش مورد نظر با موفقیت حذف و تغییرات ذخیره شد.');
    setTimeout(() => setSaveStatus('idle'), 3000);

    storage.addSecurityLog({
      eventType: 'data_modified',
      severity: 'medium',
      message: `حذف بخش «${sectionToDelete.title}» از صفحه معرفی مرکز`
    });

    setSectionToDelete(null);
  };

  const handleToggleVisibility = async (section: PresentationSection) => {
    const updated = sections.map(s => s.id === section.id ? { ...s, isVisible: !s.isVisible } : s);
    setSections(updated);
    storage.savePresentationSections(updated);
    await storage.savePresentationSectionsToDB(updated);

    setSaveStatus('saved');
    setSaveStatusMessage(`وضعیت نمایش بخش «${section.title}» به‌روزرسانی و ذخیره شد.`);
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleToggleImagePosition = async (section: PresentationSection) => {
    const nextPos: 'left' | 'right' | 'top' = 
      section.imagePosition === 'left' ? 'right' : 
      section.imagePosition === 'right' ? 'top' : 'left';
      
    const updated = sections.map(s => s.id === section.id ? { ...s, imagePosition: nextPos } : s);
    setSections(updated);
    storage.savePresentationSections(updated);
    
    try {
      await storage.savePresentationSectionsToDB(updated);
      setSaveStatus('saved');
      setSaveStatusMessage(`چیدمان «${section.title}» به «${
        nextPos === 'right' ? 'تصویر در راست | متن در چپ' : nextPos === 'top' ? 'تصویر در بالا | متن در پایین' : 'تصویر در چپ | متن در راست'
      }» تغییر یافت و ذخیره شد.`);
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveStatusMessage(null);
      }, 3500);
    } catch (e) {
      console.warn('DB sync error in quick toggle:', e);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap orders
    const tempOrder = newSections[index].order;
    newSections[index].order = newSections[targetIndex].order;
    newSections[targetIndex].order = tempOrder;
    
    const sorted = newSections.sort((a, b) => a.order - b.order);
    setSections(sorted);
    storage.savePresentationSections(sorted);
    await storage.savePresentationSectionsToDB(sorted);

    setSaveStatus('saved');
    setSaveStatusMessage('ترتیب بخش‌های معرفی مرکز جابجا و ذخیره شد.');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  // Direct File Upload with Auto-WebP Compression and Server Storage
  const handleFileUpload = async (file: File) => {
    if (!file || !editingSection) return;

    try {
      setIsUploading(true);
      setUploadStatusMsg('در حال تبدیل به WebP و فشرده‌سازی با حفظ کیفیت...');
      
      const res = await uploadFileToServer(file, 'presentation', 1920, 0.85);
      
      if (res.success && res.url) {
        setEditingSection(prev => prev ? ({ ...prev, image: res.url }) : null);
        setUrlInput(res.url);
        setUploadStatusMsg(null);
      } else {
        alert('خطا در بارگذاری تصویر: ' + (res.message || ''));
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('خطا در آپلود: ' + (err.message || ''));
    } finally {
      setIsUploading(false);
      setUploadStatusMsg(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    }
  };

  const handleOpenCropperForCurrent = () => {
    if (!editingSection?.image) return;
    setCropperModal({
      isOpen: true,
      imageSrc: editingSection.image,
      initialRatio: 21 / 9,
      title: 'برش و تنظیم کادر تصویر معرفی مرکز'
    });
  };

  const handleCropComplete = (croppedFile: File, previewUrl: string, uploadResult?: any) => {
    const finalUrl = uploadResult?.url || previewUrl;
    setEditingSection(prev => prev ? ({ ...prev, image: finalUrl }) : null);
    setUrlInput(finalUrl);
  };

  const handleSelectPreset = async (presetUrl: string) => {
    if (!editingSection) return;
    setEditingSection(prev => prev ? ({ ...prev, image: presetUrl }) : null);
    setUrlInput(presetUrl);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    const existingIndex = sections.findIndex(s => s.id === editingSection.id);
    let newSections = [...sections];
    
    if (existingIndex !== -1) {
      newSections[existingIndex] = editingSection;
    } else {
      newSections.push(editingSection);
    }

    // مرتب‌سازی بر اساس ترتیب
    newSections.sort((a, b) => a.order - b.order);
    setSections(newSections);

    // ذخیره در حافظه و پایگاه داده
    storage.savePresentationSections(newSections);
    setIsSavingAll(true);
    setSaveStatus('saving');
    
    try {
      await storage.savePresentationSectionsToDB(newSections);
      setSaveStatus('saved');
      setSaveStatusMessage(`بخش «${editingSection.title}» با موفقیت ذخیره و در پایگاه داده ثبت شد.`);
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveStatusMessage(null);
      }, 4000);
    } catch (err) {
      console.warn('DB sync error in modal save:', err);
    } finally {
      setIsSavingAll(false);
    }

    storage.addSecurityLog({
      eventType: 'data_modified',
      severity: 'low',
      message: existingIndex !== -1 ? 'ویرایش بخش معرفی مرکز' : 'ایجاد بخش جدید معرفی مرکز',
      details: `عنوان: ${editingSection.title}`
    });

    setIsEditing(false);
    setEditingSection(null);
  };

  const filteredSections = sections.filter(s => 
    s.title.includes(searchQuery) || 
    s.content.includes(searchQuery) ||
    (s.subtitle && s.subtitle.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* Sticky Header with Prominent Save Button */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md py-3 border-b border-slate-200/80 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                <Layout className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  مدیریت و تنظیمات بخش معرفی مرکز
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {toPersianDigits(sections.length)} بخش فعال
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  ویرایش محتوا، تصاویر بهینه‌شده، کادربندی‌های اختصاصی و انیمیشن‌های سه‌بعدی
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Live Preview Button */}
            <a
              href="/presentation"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-xs hover:border-slate-300"
              title="مشاهده ظاهر نهایی معرفی مرکز در سایت"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              مشاهده زنده در سایت
            </a>

            {/* Add New Section Button */}
            <button
              type="button"
              onClick={handleAddNew}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              افزودن بخش جدید
            </button>

            {/* Primary Save All Changes Button */}
            <button
              type="button"
              onClick={() => handleSaveAllChanges()}
              disabled={isSavingAll}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-xs text-white transition-all shadow-lg cursor-pointer disabled:opacity-50 ${
                saveStatus === 'saved'
                  ? 'bg-emerald-600 shadow-emerald-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 hover:shadow-emerald-300'
              }`}
            >
              {isSavingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  در حال ذخیره‌سازی...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  تغییرات ذخیره شد
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  ذخیره تغییرات معرفی مرکز
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Status Notification Banner */}
        {saveStatusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-3 p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 shadow-xs ${
              saveStatus === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {saveStatus === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{saveStatusMessage}</span>
            </div>
            <button 
              onClick={() => setSaveStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Info / Hint Box */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/80 p-4 rounded-3xl border border-indigo-100/70 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">ذخیره‌سازی هوشمند و پایدار در پایگاه داده</h4>
            <p className="text-[11px] text-slate-500">
              هر تغییری در ترتیب، ویرایش متن، تصاویر و طرح‌های قاب سه‌بعدی مستقیماً در دیتابیس ثبت شده و در تمامی دستگاه‌ها نمایش داده می‌شود. با فشردن <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-mono">Ctrl+S</kbd> نیز می‌توانید سریعاً تغییرات را ذخیره کنید.
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجو در عناوین، زیرعنوان‌ها یا متن بخش‌های معرفی مرکز..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pr-12 pl-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Sections List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredSections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-3xl border p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-md ${
              section.isVisible ? 'border-slate-200 shadow-xs' : 'border-slate-200/50 opacity-60 bg-slate-50/50'
            }`}
          >
            <div className="flex items-start md:items-center gap-4 w-full md:w-auto flex-1">
              {/* Order Controls */}
              <div className="flex flex-col gap-1 items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 shrink-0">
                <button 
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  title="انتقال به بالا"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-slate-700">{toPersianDigits(section.order)}</span>
                <button 
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === sections.length - 1}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  title="انتقال به پایین"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              {/* Section Image Preview */}
              {section.image ? (
                <div 
                  onClick={() => setPreviewImageModal(section.image || null)}
                  className="relative w-24 h-20 sm:w-28 sm:h-20 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-xs cursor-pointer group bg-slate-100"
                  title="کلیک برای بزرگنمایی تصویر"
                >
                  <img src={section.image} alt={section.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono px-1 rounded">
                    WebP
                  </span>
                </div>
              ) : (
                <div className="w-24 h-20 sm:w-28 sm:h-20 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col items-center justify-center shrink-0 text-indigo-400 gap-1">
                  <ImageIcon className="w-7 h-7" />
                  <span className="text-[10px] font-bold">بدون تصویر</span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate cursor-pointer hover:text-indigo-600" onClick={() => handleEdit(section)}>
                    {section.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    section.isVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {section.isVisible ? 'فعال در سایت' : 'مخفی'}
                  </span>
                  {section.image && (
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      تصویر پیوست
                    </span>
                  )}
                </div>
                {section.subtitle && <p className="text-xs font-medium text-slate-500 mb-2 truncate">{section.subtitle}</p>}
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    انیمیشن متن: {section.animationStyle}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleImagePosition(section)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shadow-xs ${
                      section.imagePosition === 'right' 
                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 hover:border-amber-400' 
                        : section.imagePosition === 'top'
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100 hover:border-indigo-400'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                    }`}
                    title="کلیک برای جابجایی سریع جایگاه تصویر و متن"
                  >
                    <ArrowLeftRight className="w-3 h-3 text-slate-600" />
                    <span>
                      {section.imagePosition === 'right' 
                        ? 'تصویر در راست | متن در چپ' 
                        : section.imagePosition === 'top'
                        ? 'تصویر در بالا | متن در پایین'
                        : 'تصویر در چپ | متن در راست'}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 bg-black/10 rounded font-normal">تغییر</span>
                  </button>
                  {section.image && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100">
                      <Box className="w-3 h-3" />
                      طرح قاب: {
                        PRESENTATION_FRAME_STYLES.find(f => f.id === (section.frameStyle || 'rounded-standard'))?.title || 'استاندارد'
                      }
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                    <Layout className="w-3 h-3" />
                    تم: {section.theme === 'light' ? 'روشن' : section.theme === 'dark' ? 'تاریک' : section.theme === 'primary' ? 'آبی' : 'گرادیانت'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
              <button
                onClick={() => handleToggleImagePosition(section)}
                className="p-2.5 rounded-2xl border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                title="جابجایی سریع جایگاه تصویر و متن"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleToggleVisibility(section)}
                className={`p-2.5 rounded-2xl border transition-colors cursor-pointer ${
                  section.isVisible 
                    ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100' 
                    : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }`}
                title={section.isVisible ? 'غیرفعال کردن' : 'فعال کردن'}
              >
                {section.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleEdit(section)}
                className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer"
                title="ویرایش بخش"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(section.id)}
                className="p-2.5 rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                title="حذف بخش"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}

        {filteredSections.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <Layout className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold text-sm">هیچ بخشی در صفحه معرفی مرکز یافت نشد</p>
          </div>
        )}
      </div>

      {/* EDIT / CREATE SECTION MODAL */}
      <AnimatePresence>
        {isEditing && editingSection && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-100 p-4 sm:p-6 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-800">
                      {sections.some(s => s.id === editingSection.id) ? 'ویرایش بخش معرفی مرکز' : 'افزودن بخش جدید به معرفی مرکز'}
                    </h3>
                    <p className="text-xs text-slate-500">تنظیم محتوا، تصویر کاور WebP، انیمیشن سه‌بعدی و نسبت کادر تصویر</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    form="presentation-section-form"
                    disabled={isSavingAll}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-200 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    ذخیره و اعمال
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form id="presentation-section-form" onSubmit={handleSave} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2">عنوان اصلی بخش *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: معرفی پردیس اصلی دانشگاه کوثر"
                      value={editingSection.title}
                      onChange={e => setEditingSection({...editingSection, title: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-bold text-slate-800"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2">زیرعنوان یا برچسب بالایی (اختیاری)</label>
                    <input
                      type="text"
                      placeholder="مثال: چشم‌انداز، رسالت و هویت دانشگاه"
                      value={editingSection.subtitle || ''}
                      onChange={e => setEditingSection({...editingSection, subtitle: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-700"
                    />
                  </div>

                  {/* Content */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2">متن توضیحات و معرفی *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="توضیحات کامل بخش معرفی مرکز را اینجا بنویسید..."
                      value={editingSection.content}
                      onChange={e => setEditingSection({...editingSection, content: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all leading-loose resize-none text-slate-800"
                    />
                  </div>

                  {/* DEDICATED IMAGE UPLOADER & CROPPER SECTION */}
                  <div className="md:col-span-2 bg-gradient-to-br from-slate-50 to-indigo-50/40 p-5 rounded-3xl border border-indigo-100/80 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            تصویر پس‌زمینه و قاب سه‌بعدی معرفی مرکز
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              فرمت بهینه WebP
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            آپلود مستقیم فایل، انتخاب از آرشیو تصاویر دانشگاه، یا وارد کردن پیوند تصویر
                          </p>
                        </div>
                      </div>

                      {/* Mode selection tabs */}
                      <div className="flex items-center bg-white p-1 rounded-2xl border border-indigo-100 shadow-xs">
                        <button
                          type="button"
                          onClick={() => setImageInputMode('upload')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            imageInputMode === 'upload'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-indigo-600'
                          }`}
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>آپلود فایل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageInputMode('presets')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            imageInputMode === 'presets'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-indigo-600'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>تصاویر پیش‌فرض</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageInputMode('url')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            imageInputMode === 'url'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-indigo-600'
                          }`}
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>لینک مستقیم</span>
                        </button>
                      </div>
                    </div>

                    {/* CURRENT ACTIVE IMAGE PREVIEW CARD (Visible if image exists) */}
                    {editingSection.image ? (
                      <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 w-full sm:w-auto min-w-0">
                          <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-indigo-200 shrink-0 bg-slate-100 group shadow-xs">
                            <img src={editingSection.image} alt="تصویر بخش" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                              <button
                                type="button"
                                onClick={() => setPreviewImageModal(editingSection.image || null)}
                                className="p-1.5 bg-black/50 hover:bg-black/80 rounded-lg text-white transition-colors cursor-pointer"
                                title="بزرگنمایی تصویر"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSection(prev => prev ? ({ ...prev, image: '' }) : null);
                                  setUrlInput('');
                                }}
                                className="p-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg text-white transition-colors cursor-pointer"
                                title="حذف تصویر"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">تصویر اختصاص‌یافته به این بخش</span>
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                فعال
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 truncate max-w-xs">
                              آماده نمایش در اسلایدر و بخش معرفی مرکز
                            </p>
                          </div>
                        </div>

                        {/* Actions for current image */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-indigo-100">
                          <button
                            type="button"
                            onClick={handleOpenCropperForCurrent}
                            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                            title="برش و تنظیم کادر استاندارد"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>برش و کادر (Crop)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSection(prev => prev ? ({ ...prev, image: '' }) : null);
                              setUrlInput('');
                            }}
                            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                            title="حذف تصویر فعلی"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>حذف تصویر</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex items-center gap-2.5 text-amber-800 text-xs">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>هنوز تصویری برای این بخش تنظیم نشده است. از گزینه‌های زیر یک تصویر آپلود یا انتخاب کنید.</span>
                      </div>
                    )}

                    {/* TAB CONTENT BASED ON SELECTED MODE */}
                    {imageInputMode === 'upload' && (
                      <div className="space-y-3">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                            isDragging 
                              ? 'border-indigo-500 bg-indigo-100/50' 
                              : 'border-slate-300 hover:border-indigo-400 bg-white/70 hover:bg-white'
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              {isUploading ? (
                                <RefreshCw className="w-6 h-6 animate-spin" />
                              ) : (
                                <UploadCloud className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">
                                {isUploading ? (uploadStatusMsg || 'در حال آپلود...') : 'برای انتخاب و آپلود فایل کلیک کنید یا تصویر را اینجا بکشید'}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                فرمت‌های مجاز: JPG, PNG, WebP (کاهش حجم و بهینه‌سازی خودکار انجام می‌شود)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {imageInputMode === 'presets' && (
                      <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-indigo-100">
                        <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            آرشیو تصاویر پیش‌فرض مرکز و دانشگاه:
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">برای انتخاب روی تصویر کلیک فرمایید</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
                          {PRESENTATION_PRESET_IMAGES.map((preset, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                handleSelectPreset(preset.url);
                              }}
                              className={`group relative aspect-video rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                                editingSection.image === preset.url 
                                  ? 'border-indigo-600 ring-2 ring-indigo-400 shadow-md scale-102' 
                                  : 'border-slate-200 hover:border-indigo-400 hover:shadow-xs'
                              }`}
                              title={preset.title}
                            >
                              <img src={preset.url} alt={preset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end p-1.5">
                                <span className="text-[9px] text-white font-bold truncate">{preset.tag}</span>
                              </div>
                              {editingSection.image === preset.url && (
                                <div className="absolute top-1.5 right-1.5 bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {imageInputMode === 'url' && (
                      <div className="bg-white p-4 rounded-2xl border border-indigo-100 space-y-2">
                        <label className="block text-xs font-bold text-slate-700">پیوند مستقیم تصویر (URL):</label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            dir="ltr"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (urlInput.trim()) {
                                setEditingSection(prev => prev ? ({ ...prev, image: urlInput.trim() }) : null);
                              }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shrink-0 cursor-pointer shadow-xs"
                          >
                            ثبت تصویر
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DEDICATED LAYOUT & POSITIONING CUSTOMIZATION */}
                  <div className="md:col-span-2 bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 p-5 rounded-3xl border border-blue-200/80 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-blue-200/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                          <ArrowLeftRight className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                            محل قرارگیری تصویر و متن (شخصی‌سازی چیدمان اسلاید)
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              شخصی‌سازی کامل
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            مشخص کنید تصویر در سمت راست، چپ یا بالا قرار گیرد و تناسب ستون‌ها و تراز متن را تعیین کنید
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 1: Image Position Choices (3 Grid Options) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        موقعیت قرارگیری تصویر نسبت به متن:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Option 1: Image Left, Text Right (Default RTL) */}
                        <div
                          onClick={() => setEditingSection({ ...editingSection, imagePosition: 'left' })}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2.5 relative group ${
                            (editingSection.imagePosition || 'left') === 'left'
                              ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-200'
                              : 'border-slate-200 bg-white/80 hover:bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">تصویر در چپ | متن در راست</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              (editingSection.imagePosition || 'left') === 'left' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              پیش‌فرض فارسی
                            </span>
                          </div>

                          {/* Mini visual diagram */}
                          <div className="bg-slate-100/90 p-2 rounded-xl border border-slate-200 flex items-center gap-2">
                            <div className="flex-1 space-y-1 text-right">
                              <div className="h-1.5 w-3/4 bg-blue-600/80 rounded-full" />
                              <div className="h-1 w-full bg-slate-300 rounded-full" />
                              <div className="h-1 w-5/6 bg-slate-300 rounded-full" />
                            </div>
                            <div className="w-12 h-9 rounded-lg bg-blue-100 border border-blue-300 flex flex-col items-center justify-center shrink-0 text-blue-600">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span className="text-[7px] font-bold">تصویر چپ</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-bold">
                            {(editingSection.imagePosition || 'left') === 'left' ? (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Check className="w-3 h-3 stroke-[3]" />
                                فعال
                              </span>
                            ) : (
                              <span className="text-slate-400 group-hover:text-slate-600">انتخاب</span>
                            )}
                          </div>
                        </div>

                        {/* Option 2: Image Right, Text Left */}
                        <div
                          onClick={() => setEditingSection({ ...editingSection, imagePosition: 'right' })}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2.5 relative group ${
                            editingSection.imagePosition === 'right'
                              ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-200'
                              : 'border-slate-200 bg-white/80 hover:bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">تصویر در راست | متن در چپ</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              editingSection.imagePosition === 'right' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              تمرکز بر تصویر
                            </span>
                          </div>

                          {/* Mini visual diagram */}
                          <div className="bg-slate-100/90 p-2 rounded-xl border border-slate-200 flex items-center gap-2">
                            <div className="w-12 h-9 rounded-lg bg-amber-100 border border-amber-300 flex flex-col items-center justify-center shrink-0 text-amber-700">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span className="text-[7px] font-bold">تصویر راست</span>
                            </div>
                            <div className="flex-1 space-y-1 text-right">
                              <div className="h-1.5 w-3/4 bg-blue-600/80 rounded-full" />
                              <div className="h-1 w-full bg-slate-300 rounded-full" />
                              <div className="h-1 w-5/6 bg-slate-300 rounded-full" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-bold">
                            {editingSection.imagePosition === 'right' ? (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Check className="w-3 h-3 stroke-[3]" />
                                فعال
                              </span>
                            ) : (
                              <span className="text-slate-400 group-hover:text-slate-600">انتخاب</span>
                            )}
                          </div>
                        </div>

                        {/* Option 3: Image Top, Text Bottom */}
                        <div
                          onClick={() => setEditingSection({ ...editingSection, imagePosition: 'top' })}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-2.5 relative group ${
                            editingSection.imagePosition === 'top'
                              ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-200'
                              : 'border-slate-200 bg-white/80 hover:bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">تصویر در بالا | متن در پایین</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              editingSection.imagePosition === 'top' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              چیدمان پشته‌ای
                            </span>
                          </div>

                          {/* Mini visual diagram */}
                          <div className="bg-slate-100/90 p-2 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                            <div className="w-full h-6 rounded bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-700">
                              <ImageIcon className="w-3 h-3 ml-1" />
                              <span className="text-[7px] font-bold">تصویر عریض بالا</span>
                            </div>
                            <div className="space-y-1 text-right">
                              <div className="h-1 w-2/3 bg-blue-600/80 rounded-full" />
                              <div className="h-1 w-full bg-slate-300 rounded-full" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-bold">
                            {editingSection.imagePosition === 'top' ? (
                              <span className="flex items-center gap-1 text-indigo-600">
                                <Check className="w-3 h-3 stroke-[3]" />
                                فعال
                              </span>
                            ) : (
                              <span className="text-slate-400 group-hover:text-slate-600">انتخاب</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Ratio & Vertical Alignment Settings (Only when not 'top') */}
                    {editingSection.imagePosition !== 'top' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Content Ratio: Balanced / Text-heavy / Image-heavy */}
                        <div className="bg-white/90 p-3.5 rounded-2xl border border-slate-200/90 space-y-2">
                          <label className="block text-xs font-bold text-slate-700">
                            تقسیم و نسبت عرض ستون‌ها:
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'balanced', label: 'متعادل (۵۰/۵۰)', desc: 'تساوی متن و تصویر' },
                              { id: 'text-heavy', label: 'متن‌محور (۶۰/۴۰)', desc: 'فضای بیشتر متن' },
                              { id: 'image-heavy', label: 'تصویرمحور (۴۰/۶۰)', desc: 'تصویر بزرگتر' }
                            ].map(ratio => {
                              const isSelected = (editingSection.contentRatio || 'balanced') === ratio.id;
                              return (
                                <button
                                  key={ratio.id}
                                  type="button"
                                  onClick={() => setEditingSection({ ...editingSection, contentRatio: ratio.id as any })}
                                  className={`p-2 rounded-xl text-center transition-all cursor-pointer border ${
                                    isSelected 
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  <div className="text-[11px] font-bold leading-snug">{ratio.label}</div>
                                  <div className={`text-[9px] mt-0.5 truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {ratio.desc}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Vertical Align: Center vs Start */}
                        <div className="bg-white/90 p-3.5 rounded-2xl border border-slate-200/90 space-y-2">
                          <label className="block text-xs font-bold text-slate-700">
                            تراز عمودی محتوا و تصویر:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: 'center', label: 'وسط‌چین عمودی', desc: 'متن و تصویر در مرکز ارتفاع' },
                              { id: 'start', label: 'تراز از بالای کادر', desc: 'شروع از لبه بالایی' }
                            ].map(vAlign => {
                              const isSelected = (editingSection.verticalAlign || 'center') === vAlign.id;
                              return (
                                <button
                                  key={vAlign.id}
                                  type="button"
                                  onClick={() => setEditingSection({ ...editingSection, verticalAlign: vAlign.id as any })}
                                  className={`p-2 rounded-xl text-center transition-all cursor-pointer border ${
                                    isSelected 
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  <div className="text-[11px] font-bold">{vAlign.label}</div>
                                  <div className={`text-[9px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                    {vAlign.desc}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 3: Text Alignment */}
                    <div className="bg-white/90 p-3.5 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-700">جهت تراز متن توضیحات:</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {[
                          { id: 'right', label: 'راست‌چین', icon: AlignRight },
                          { id: 'center', label: 'وسط‌چین', icon: AlignCenter },
                          { id: 'justify', label: 'هم‌تراز (Justify)', icon: AlignJustify }
                        ].map(align => {
                          const isSelected = (editingSection.textAlignment || 'right') === align.id;
                          const IconComponent = align.icon;
                          return (
                            <button
                              key={align.id}
                              type="button"
                              onClick={() => setEditingSection({ ...editingSection, textAlignment: align.id as any })}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-blue-600 text-white shadow-xs' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <IconComponent className="w-3.5 h-3.5" />
                              <span>{align.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live Mini Dynamic Preview Bar */}
                    <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                        <span>پیش‌نمایش زنده چیدمان انتخاب‌شده:</span>
                        <span className="text-blue-400">
                          {editingSection.imagePosition === 'right' ? 'تصویر در راست' : editingSection.imagePosition === 'top' ? 'تصویر در بالا' : 'تصویر در چپ'} | {editingSection.textAlignment === 'center' ? 'متن وسط‌چین' : editingSection.textAlignment === 'justify' ? 'متن هم‌تراز' : 'متن راست‌چین'}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                        {editingSection.imagePosition === 'top' ? (
                          <div className="space-y-2.5">
                            {/* Image on top */}
                            <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-700 border border-slate-600 flex items-center justify-center">
                              {editingSection.image ? (
                                <img src={editingSection.image} alt="preview" className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center gap-1 text-slate-400 text-xs">
                                  <ImageIcon className="w-4 h-4" />
                                  <span>تصویر شاخص در بالای متن</span>
                                </div>
                              )}
                            </div>
                            {/* Text below */}
                            <div className={`${
                              editingSection.textAlignment === 'center' ? 'text-center' : 'text-right'
                            }`}>
                              <div className="text-xs font-bold text-white">
                                {editingSection.title || 'عنوان اسلاید'}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                {editingSection.subtitle || 'متن زیرعنوان و توضیحات معرفی مرکز'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {editingSection.imagePosition === 'right' ? (
                              <>
                                {/* Right side: Image */}
                                <div className={`h-14 rounded-lg overflow-hidden shrink-0 bg-slate-700 border border-slate-600 flex items-center justify-center ${
                                  editingSection.contentRatio === 'image-heavy' ? 'w-24' : editingSection.contentRatio === 'text-heavy' ? 'w-14' : 'w-18'
                                }`}>
                                  {editingSection.image ? (
                                    <img src={editingSection.image} alt="preview" className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageIcon className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                                {/* Left side: Text */}
                                <div className={`flex-1 min-w-0 ${
                                  editingSection.textAlignment === 'center' ? 'text-center' : 'text-right'
                                }`}>
                                  <div className="text-xs font-bold truncate text-white">
                                    {editingSection.title || 'عنوان اسلاید'}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                    {editingSection.subtitle || 'متن زیرعنوان اسلاید'}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* Right side: Text */}
                                <div className={`flex-1 min-w-0 ${
                                  editingSection.textAlignment === 'center' ? 'text-center' : 'text-right'
                                }`}>
                                  <div className="text-xs font-bold truncate text-white">
                                    {editingSection.title || 'عنوان اسلاید'}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                    {editingSection.subtitle || 'متن زیرعنوان اسلاید'}
                                  </div>
                                </div>
                                {/* Left side: Image */}
                                <div className={`h-14 rounded-lg overflow-hidden shrink-0 bg-slate-700 border border-slate-600 flex items-center justify-center ${
                                  editingSection.contentRatio === 'image-heavy' ? 'w-24' : editingSection.contentRatio === 'text-heavy' ? 'w-14' : 'w-18'
                                }`}>
                                  {editingSection.image ? (
                                    <img src={editingSection.image} alt="preview" className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageIcon className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DEDICATED FRAME DESIGN - 3 SIMPLE STYLES */}
                  <div className="md:col-span-2 bg-gradient-to-br from-indigo-50/40 via-purple-50/30 to-slate-50 p-5 rounded-3xl border border-indigo-100 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-indigo-100/70 pb-3">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                        <Box className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          طرح قاب تصویر معرفی مرکز
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            ۳ طرح ساده و بهینه
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          یکی از ۳ حالت نمایش ساده و بزرگ را برای نمایش باکیفیت تصویر انتخاب کنید
                        </p>
                      </div>
                    </div>

                    {/* Simple Frame Selector Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {PRESENTATION_FRAME_STYLES.map((frame) => {
                        const isSelected = (editingSection.frameStyle || 'rounded-standard') === frame.id;
                        return (
                          <div
                            key={frame.id}
                            onClick={() => setEditingSection({ ...editingSection, frameStyle: frame.id })}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 relative group ${
                              isSelected
                                ? 'border-indigo-600 bg-white shadow-md ring-2 ring-indigo-200'
                                : 'border-slate-200 bg-white/80 hover:bg-white hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-lg bg-gradient-to-br ${frame.gradient} shadow-xs`} />
                                <span className="text-xs font-bold text-slate-800">{frame.title}</span>
                              </div>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {frame.badge}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              {frame.desc}
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-bold">
                              {isSelected ? (
                                <span className="flex items-center gap-1 text-indigo-600">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  انتخاب شده
                                </span>
                              ) : (
                                <span className="text-slate-400 group-hover:text-slate-600">
                                  کلیک برای انتخاب
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">سبک انیمیشن متن</label>
                    <select
                      value={editingSection.animationStyle}
                      onChange={e => setEditingSection({...editingSection, animationStyle: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    >
                      <option value="fade">نمایان شدن ساده (Fade)</option>
                      <option value="slide-up">پرش از پایین (Slide Up)</option>
                      <option value="slide-right">ورود از راست (Slide Right)</option>
                      <option value="slide-left">ورود از چپ (Slide Left)</option>
                      <option value="zoom">بزرگ‌نمایی (Zoom In)</option>
                      <option value="flip-3d">چرخش سه‌بعدی (3D Flip)</option>
                      <option value="rotate-3d">دوران سه‌بعدی (3D Rotate)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">سبک انیمیشن تصویر/قاب سه‌بعدی</label>
                    <select
                      value={editingSection.imageAnimationStyle || 'rotate-3d'}
                      onChange={e => setEditingSection({...editingSection, imageAnimationStyle: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    >
                      <option value="fade">نمایان شدن ساده (Fade)</option>
                      <option value="slide-up">پرش از پایین (Slide Up)</option>
                      <option value="slide-right">ورود از راست (Slide Right)</option>
                      <option value="slide-left">ورود از چپ (Slide Left)</option>
                      <option value="zoom">بزرگ‌نمایی (Zoom In)</option>
                      <option value="flip-3d">چرخش سه‌بعدی (3D Flip)</option>
                      <option value="rotate-3d">دوران سه‌بعدی (3D Rotate)</option>
                    </select>
                  </div>

                  {/* DEDICATED COLOR THEME & FRAME ACCENT PALETTE */}
                  <div className="md:col-span-2 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-slate-50 p-5 rounded-3xl border border-indigo-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-indigo-200/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                          <Palette className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">
                            انتخاب تم رنگی اسلاید و نورپردازی قاب (Color Theme & Lighting)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            پالت‌های رنگی متنوع برای پس‌زمینه اسلاید و هاله نوری قاب سه‌بعدی
                          </p>
                        </div>
                      </div>

                      {/* Custom Accent Color Input */}
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-[11px] font-bold text-slate-600">رنگ نور قاب:</span>
                        <input
                          type="color"
                          value={editingSection.frameAccentColor || '#2563eb'}
                          onChange={e => setEditingSection({ ...editingSection, frameAccentColor: e.target.value })}
                          className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                          title="انتخاب رنگ دلخواه"
                        />
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                          {editingSection.frameAccentColor || '#2563eb'}
                        </span>
                      </div>
                    </div>

                    {/* Color Swatch Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                      {PRESENTATION_COLOR_PALETTES.map((palette) => {
                        const isSelected = editingSection.theme === palette.id;
                        return (
                          <button
                            key={palette.id}
                            type="button"
                            onClick={() => setEditingSection({ 
                              ...editingSection, 
                              theme: palette.id as any,
                              frameAccentColor: palette.hex
                            })}
                            className={`p-2.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'border-indigo-600 bg-white shadow-md ring-2 ring-indigo-200'
                                : 'border-slate-200 bg-white/70 hover:bg-white hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className={`w-full h-7 rounded-xl bg-gradient-to-r ${palette.bg} border ${palette.border} flex items-center justify-end px-2 shadow-xs`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-[11px] font-bold text-slate-800 truncate">{palette.label}</span>
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: palette.hex }} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">مدت زمان انیمیشن (ثانیه)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={editingSection.animationDuration || 0.8}
                      onChange={e => setEditingSection({...editingSection, animationDuration: parseFloat(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                      dir="ltr"
                    />
                  </div>

                  {/* Visibility Toggle */}
                  <div className="md:col-span-2 bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isVisible"
                      checked={editingSection.isVisible}
                      onChange={e => setEditingSection({...editingSection, isVisible: e.target.checked})}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="isVisible" className="text-xs font-bold text-indigo-900 cursor-pointer">
                      این بخش در صفحه معرفی مرکز سایت نمایش داده شود
                    </label>
                  </div>
                </div>

                {/* Form Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 rounded-2xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    ذخیره بخش معرفی مرکز
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UNIVERSAL IMAGE CROPPER MODAL */}
      <ImageCropperModal
        isOpen={cropperModal.isOpen}
        onClose={() => setCropperModal(prev => ({ ...prev, isOpen: false }))}
        imageSrc={cropperModal.imageSrc}
        initialAspectRatio={cropperModal.initialRatio ?? (21 / 9)}
        title={cropperModal.title}
        targetFolder="presentation"
        onCropComplete={handleCropComplete}
      />

      {/* FULLSCREEN IMAGE PREVIEW MODAL */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute -top-10 left-0 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImageModal} 
              alt="نمایش تصویر" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sectionToDelete && (
        <DeleteConfirmModal
          isOpen={!!sectionToDelete}
          onClose={() => setSectionToDelete(null)}
          onConfirm={confirmDeleteSection}
          title="حذف بخش از صفحه معرفی مرکز"
          itemName={sectionToDelete.title}
          message="آیا از حذف این بخش از صفحه معرفی مرکز اطمینان دارید؟ این عملیات بلافاصله در پایگاه داده اعمال می‌گردد."
          details={[
            { label: 'زیرعنوان', value: sectionToDelete.subtitle || 'ندارد' },
            { label: 'شماره ترتیب', value: toPersianDigits(sectionToDelete.order) },
            { label: 'وضعیت نمایش', value: sectionToDelete.isVisible ? 'نمایش در سایت' : 'مخفی' }
          ]}
          confirmText="بله، حذف شود"
        />
      )}
    </div>
  );
}
