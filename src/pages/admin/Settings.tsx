import React, { useState, useEffect, useRef } from 'react';
import { storage, SiteSettings, StatItem } from '../../lib/storage';
import { uploadFileToServer } from '../../lib/uploadHelper';
import { Settings, Save, CheckCircle2, Plus, Trash2, Link as LinkIcon, List, BarChart3,  Upload, Image as ImageIcon, Type, Eye, Library,  Menu, Phone, LayoutTemplate, Star, ChevronUp, ChevronDown, ShieldCheck, Crop, GraduationCap, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageCropperModal from '../../components/admin/ImageCropperModal';
import ServerImagePickerModal from '../../components/admin/ServerImagePickerModal';

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSettings>(storage.getSettings());
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingSysId, setUploadingSysId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'brand' | 'home' | 'navigation' | 'features' | 'footer' | 'higherEd'>('brand');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Universal Cropper Modal State
  const [cropperModal, setCropperModal] = useState<{
    isOpen: boolean;
    imageSrc: string | File | null;
    targetType: 'mainLogo' | 'higherEdLogo';
    targetHigherEdId?: string;
    initialRatio?: number | null;
  }>({
    isOpen: false,
    imageSrc: null,
    targetType: 'mainLogo',
    initialRatio: 1
  });

  // Server Image Picker State
  const [serverPickerState, setServerPickerState] = useState<{
    isOpen: boolean;
    targetType: 'mainLogo' | 'higherEdLogo';
    targetHigherEdId?: string;
  }>({
    isOpen: false,
    targetType: 'mainLogo'
  });

  const handleSettingsCropComplete = (croppedFile: File, previewUrl: string, uploadResult?: any) => {
    const finalUrl = uploadResult?.url || previewUrl;
    if (cropperModal.targetType === 'mainLogo') {
      setSettings(prev => ({ ...prev, logoUrl: finalUrl }));
    } else if (cropperModal.targetType === 'higherEdLogo' && cropperModal.targetHigherEdId) {
      updateHigherEdSystem(cropperModal.targetHigherEdId, 'logoUrl', finalUrl);
    }
  };

  useEffect(() => {
    // Only super_admin or manage_settings permission can edit settings
    const authData = localStorage.getItem('kowsar_admin_auth');
    if (authData) {
      try {
        const user = JSON.parse(authData);
        let userPerms: string[] = [];
        if (Array.isArray(user.permissions)) {
          userPerms = user.permissions;
        } else if (typeof user.permissions === 'string') {
          try { userPerms = JSON.parse(user.permissions || '[]'); } catch { userPerms = []; }
        }
        
        const hasAccess = user.role === 'super_admin' || 
          userPerms.includes('*') || 
          userPerms.includes('manage_settings');

        if (!hasAccess) {
          navigate('/admin');
          return;
        }
      } catch {
        navigate('/admin/login');
        return;
      }
    }
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e as any);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings]);

  const handleHigherEdLogoUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (!file) return;



    setUploadingSysId(id);
    try {
      const result = await uploadFileToServer(file, 'settings');
      if (result.success && result.url) {
        updateHigherEdSystem(id, "logoUrl", result.url);
      } else {
        alert(result.message || "خطا در آپلود لوگو");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setUploadingSysId(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFileToServer(file, 'settings');
      if (result.success && result.url) {
        setSettings({ ...settings, logoUrl: result.url });
      } else {
        alert(result.message || 'خطا در بارگذاری لوگو');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('خطا در ارتباط با سرور');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleLinkChange = (type: 'navLinks' | 'quickLinks', id: string, field: 'label' | 'href' | 'isActive', value: string | boolean) => {
    setSettings({
      ...settings,
      [type]: settings[type].map(link => link.id === id ? { ...link, [field]: value } : link)
    });
  };

  const addLink = (type: 'navLinks' | 'quickLinks') => {
    setSettings({
      ...settings,
      [type]: [...settings[type], { id: Date.now().toString(), label: '', href: '/', isActive: true }]
    });
  };

  const orderLink = (type: 'navLinks' | 'quickLinks', currentIndex: number, newPosition: number) => {
    const list = [...settings[type]];
    const newIndex = Math.max(0, Math.min(newPosition - 1, list.length - 1));
    if (currentIndex === newIndex) return;

    const [movedItem] = list.splice(currentIndex, 1);
    list.splice(newIndex, 0, movedItem);
    
    setSettings({ ...settings, [type]: list });
  };

  const removeLink = (type: 'navLinks' | 'quickLinks', id: string) => {
    setSettings({
      ...settings,
      [type]: settings[type].filter(link => link.id !== id)
    });
  };

  const handleStatItemChange = (id: string, field: keyof StatItem, value: any) => {
    const currentStats = settings.statsItems || [];
    setSettings({
      ...settings,
      statsItems: currentStats.map(stat => stat.id === id ? { ...stat, [field]: value } : stat)
    });
  };

  const addHigherEdSystem = () => {
    setSettings({
      ...settings,
      higherEdSystems: [...(settings.higherEdSystems || []), { id: Date.now().toString(), title: '', url: '', isActive: true, order: (settings.higherEdSystems?.length || 0) + 1 }]
    });
  };

  const updateHigherEdSystem = (id: string, field: string, value: any) => {
    setSettings({
      ...settings,
      higherEdSystems: settings.higherEdSystems?.map(sys => sys.id === id ? { ...sys, [field]: value } : sys)
    });
  };

  const removeHigherEdSystem = (id: string) => {
    setSettings({
      ...settings,
      higherEdSystems: settings.higherEdSystems?.filter(sys => sys.id !== id)
    });
  };

  const handleFeatureItemChange = (id: string, field: string, value: string) => {
    const currentFeatures = settings.featuresItems || [];
    setSettings({
      ...settings,
      featuresItems: currentFeatures.map(f => f.id === id ? { ...f, [field]: value } : f)
    });
  };

  const addFeature = () => {
    const currentFeatures = settings.featuresItems || [];
    setSettings({
      ...settings,
      featuresItems: [...currentFeatures, { id: Date.now().toString(), title: '', description: '', iconName: 'Star' }]
    });
  };

  const removeFeature = (id: string) => {
    const currentFeatures = settings.featuresItems || [];
    setSettings({
      ...settings,
      featuresItems: currentFeatures.filter(f => f.id !== id)
    });
  };

  const handleButtonChange = (id: string, field: 'label' | 'href' | 'style', value: string) => {
    setSettings(prev => ({
      ...prev,
      customButtons: prev.customButtons.map(btn => btn.id === id ? { ...btn, [field]: value } : btn)
    }));
  };

  const handleHeaderButtonChange = (id: string, field: 'label' | 'href' | 'style', value: string) => {
    setSettings(prev => ({
      ...prev,
      headerButtons: (prev.headerButtons || []).map(btn => btn.id === id ? { ...btn, [field]: value } : btn)
    }));
  };

  const handleStudyFieldChange = (id: string, field: 'name' | 'value' | 'isActive' | 'degreeType', value: any) => {
    setSettings(prev => ({
      ...prev,
      studyFields: (prev.studyFields || []).map(f => f.id === id ? { ...f, [field]: value } : f)
    }));
  };

  const addButton = () => {
    setSettings({
      ...settings,
      customButtons: [...(settings.customButtons || []), { id: Date.now().toString(), label: '', href: '/', style: 'primary' }]
    });
  };

  const removeButton = (id: string) => {
    setSettings({
      ...settings,
      customButtons: settings.customButtons.filter(btn => btn.id !== id)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div>
      {/* Sticky Header with Save Button - Fixed at top when scrolling */}
      <div className="sticky top-2 z-30 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-md mb-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-blue-600" />
            تنظیمات متون و محتوای سایت
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">ویرایش لوگو، شعار، بنرها، آمارها، پیوندها و متون عمومی دانشگاه</p>
        </div>
        <button 
          type="button" 
          onClick={handleSubmit} 
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold px-7 py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2 flex-shrink-0"
        >
          <Save className="w-5 h-5" />
          <span>ذخیره تغییرات سایت</span>
          <span className="hidden md:inline-flex bg-blue-700/60 px-2 py-0.5 rounded text-[10px] font-mono mr-1">Ctrl+S</span>
        </button>
      </div>

      {isSaved && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-6 flex items-center gap-2 font-bold border border-emerald-100 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          تغییرات با موفقیت ذخیره شد و بلافاصله در سایت اعمال گردید.
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 hide-scrollbar">
        <button type="button" onClick={() => setActiveTab('brand')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'brand' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
          <ImageIcon className="w-4 h-4" />
          لوگو و برند
        </button>
        <button type="button" onClick={() => setActiveTab('home')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
          <LayoutTemplate className="w-4 h-4" />
          صفحه اصلی
        </button>
        <button type="button" onClick={() => setActiveTab('navigation')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'navigation' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
          <Menu className="w-4 h-4" />
          منوها و دسترسی
        </button>
        <button type="button" onClick={() => setActiveTab('features')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'features' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
          <Star className="w-4 h-4" />
          مزیت‌ها (چرا کوثر)
        </button>
        <button type="button" onClick={() => setActiveTab('footer')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'footer' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
          <Phone className="w-4 h-4" />
          فوتر و صفحه تماس
        </button>
        <button type="button" onClick={() => setActiveTab('higherEd')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'higherEd' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
          <Library className="w-4 h-4" />
          سامانه‌های آموزش عالی
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        {/* Logo & Brand Settings */}
        {activeTab === 'brand' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-500" />
              تنظیمات لوگو و عنوان برند هدر
            </h2>
            <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
              نمایش در هدر و فوتر
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Image Upload Section */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">۱. تصویر نشان (لوگو)</label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  onClick={() => setServerPickerState({ isOpen: true, targetType: 'mainLogo' })}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 text-sm cursor-pointer"
                >
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  <span>مخزن سرور</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'در حال بارگذاری...' : 'آپلود فایل جدید'}
                </button>
                {settings.logoUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCropperModal({
                        isOpen: true,
                        imageSrc: settings.logoUrl || null,
                        targetType: 'mainLogo',
                        initialRatio: 1
                      })}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm border border-indigo-200 flex items-center gap-1.5 cursor-pointer"
                      title="برش و تنظیم ابعاد لوگو"
                    >
                      <Crop className="w-4 h-4" />
                      برش و کادربندی
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, logoUrl: undefined })}
                      className="text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm border border-red-100"
                    >
                      حذف تصویر
                    </button>
                  </>
                )}
              </div>
              <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 space-y-1.5 border border-slate-200/60 leading-relaxed">
                <p className="font-semibold text-slate-700">• راهنمای تصویر:</p>
                <p>• فرمت‌های مجاز: PNG, JPG, SVG, WEBP (حداکثر ۲۰ مگابایت)</p>
                <p>• ابعاد پیشنهادی: ارتفاع ۶۰ تا ۸۰ پیکسل (عرض متناسب)</p>
                <p>• برای ظاهر بهتر در حالت روشن و تاریک، از تصویر با پس‌زمینه شفاف (Transparent) استفاده نمایید.</p>
              </div>
            </div>

            {/* Brand Text Section */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                <Type className="w-4 h-4 text-blue-500" />
                ۲. ویرایش متن عنوان برند
              </label>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">سطر اول عنوان (بزرگ)</label>
                  <input
                    type="text"
                    name="logoTitle"
                    value={settings.logoTitle ?? 'علمی کاربردی'}
                    onChange={handleChange}
                    placeholder="مثال: علمی کاربردی"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">سطر دوم زیرعنوان (رنگی)</label>
                  <input
                    type="text"
                    name="logoSubtitle"
                    value={settings.logoSubtitle ?? 'کوثر کاکی'}
                    onChange={handleChange}
                    placeholder="مثال: کوثر کاکی"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.showLogoText !== false}
                      onChange={(e) => setSettings({ ...settings, showLogoText: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      نمایش متن عنوان در کنار نشان/تصویر لوگو
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1 mr-6">
                    (در صورتی که فایل لوگوی شما خود شامل متن کامل است، می‌توانید این تیک را بردارید تا فقط تصویر نشان داده شود)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">پیش‌نمایش زنده در هدر سایت:</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="پیش‌نمایش" className="h-10 w-auto object-contain" />
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-sm">
                    <Library className="w-5 h-5" />
                  </div>
                )}
                {(settings.showLogoText !== false || !settings.logoUrl) && (
                  <div className="flex flex-col justify-center">
                    <span className="font-black text-base text-slate-900 leading-tight">
                      {settings.logoTitle || 'علمی کاربردی'}
                    </span>
                    <span className="font-bold text-blue-600 text-xs leading-tight mt-0.5">
                      {settings.logoSubtitle || 'کوثر کاکی'}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                این پیش‌نمایش نحوه دیده شدن لوگو در بالای صفحات سایت را نشان می‌دهد
              </span>
            </div>
          </div>
        </div>
        )}

        {/* Hero Section Settings */}
        {activeTab === 'home' && (
          <>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            بخش بنر اصلی (Hero)
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">برچسب کوچک بالای عنوان</label>
              <input 
                type="text" required name="heroBadge" value={settings.heroBadge} onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">عنوان اصلی (بخش اول - مشکی)</label>
                <input 
                  type="text" required name="heroTitleLine1" value={settings.heroTitleLine1} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">عنوان اصلی (بخش دوم - آبی رنگ)</label>
                <input 
                  type="text" required name="heroTitleLine2" value={settings.heroTitleLine2} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">متن توضیحات بنر</label>
              <textarea 
                required name="heroSubtitle" value={settings.heroSubtitle} onChange={handleChange} rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              ></textarea>
            </div>

            {/* دکمه‌های اقدام بنر اصلی (Hero CTA Buttons) */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800">دکمه‌های اقدام و پیوندهای بنر صفحه اصلی</label>
                  <p className="text-xs text-slate-400 mt-0.5">این دکمه‌ها زیر متن بنر اصلی در صفحه نخست نمایش داده می‌شوند.</p>
                </div>
                <button
                  type="button"
                  onClick={addButton}
                  className="self-start sm:self-auto bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  افزودن دکمه جدید
                </button>
              </div>

              <div className="space-y-3">
                {(settings.customButtons || []).map((btn, index) => (
                  <div key={btn.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-black">
                          {index + 1}
                        </span>
                        تنظیمات دکمه شماره {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeButton(btn.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف دکمه
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">متن دکمه</label>
                        <input
                          type="text"
                          value={btn.label}
                          onChange={(e) => handleButtonChange(btn.id, 'label', e.target.value)}
                          placeholder="مثال: ثبت‌نام آنلاین"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">لینک یا مسیر مقصد</label>
                        <input
                          type="text"
                          value={btn.href}
                          onChange={(e) => handleButtonChange(btn.id, 'href', e.target.value)}
                          placeholder="مثال: /register یا /forms یا /"
                          dir="ltr"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">استایل ظاهری دکمه</label>
                        <select
                          value={btn.style}
                          onChange={(e) => handleButtonChange(btn.id, 'style', e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                        >
                          <option value="primary">آبی پررنگ (اصلی - Primary)</option>
                          <option value="outline">سفید با کادر آبی (Outline)</option>
                          <option value="secondary">مشکی ذغالی (Dark)</option>
                          <option value="danger">قرمز ویژه (Danger)</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-bold">انتخاب سریع:</span>
                      <button
                        type="button"
                        onClick={() => {
                          handleButtonChange(btn.id, 'label', 'صفحه اصلی');
                          handleButtonChange(btn.id, 'href', '/');
                        }}
                        className="text-[11px] bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 px-2 py-0.5 rounded-lg transition-colors font-medium"
                      >
                        صفحه اصلی (/)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleButtonChange(btn.id, 'label', 'ثبت‌نام آنلاین');
                          handleButtonChange(btn.id, 'href', '/register');
                        }}
                        className="text-[11px] bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 px-2 py-0.5 rounded-lg transition-colors font-medium"
                      >
                        ثبت‌نام دانشجو (/register)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleButtonChange(btn.id, 'label', 'فرم‌های ضروری');
                          handleButtonChange(btn.id, 'href', '/forms');
                        }}
                        className="text-[11px] bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 px-2 py-0.5 rounded-lg transition-colors font-medium"
                      >
                        فرم‌های ضروری (/forms)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleButtonChange(btn.id, 'label', 'اخبار و رویدادها');
                          handleButtonChange(btn.id, 'href', '/news');
                        }}
                        className="text-[11px] bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 px-2 py-0.5 rounded-lg transition-colors font-medium"
                      >
                        اخبار (/news)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleButtonChange(btn.id, 'label', 'نگارخانه');
                          handleButtonChange(btn.id, 'href', '/gallery');
                        }}
                        className="text-[11px] bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 px-2 py-0.5 rounded-lg transition-colors font-medium"
                      >
                        نگارخانه (/gallery)
                      </button>
                    </div>
                  </div>
                ))}

                {(!settings.customButtons || settings.customButtons.length === 0) && (
                  <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs text-slate-400 mb-2">هنوز دکمه‌ای برای بخش بنر صفحه نخست تعریف نشده است.</p>
                    <button
                      type="button"
                      onClick={addButton}
                      className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
                    >
                      + افزودن اولین دکمه بنر
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Counter Section Settings */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              بخش آمار و دستاوردهای دانشگاه (۴ شاخص صفحه اصلی)
            </h2>
          </div>

          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">برچسب بالای بخش آمار</label>
                <input 
                  type="text" name="statsBadge" value={settings.statsBadge || ''} onChange={handleChange}
                  placeholder="آمار و دستاوردها"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">عنوان اصلی بخش آمار</label>
                <input 
                  type="text" name="statsTitle" value={settings.statsTitle || ''} onChange={handleChange}
                  placeholder="روایتی از پویایی، تجربه و مهارت‌آموزی"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">متن توضیحات زیر عنوان</label>
              <textarea 
                name="statsSubtitle" value={settings.statsSubtitle || ''} onChange={handleChange} rows={2}
                placeholder="توضیحات کوتاه درباره آمار و دستاوردهای مرکز"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              ></textarea>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings.statsItems?.map((stat, idx) => (
              <div key={stat.id || idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="font-bold text-slate-800 text-sm">کارت آماری شماره {idx + 1}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full">{stat.colorScheme}</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">پیشوند (مانند +)</label>
                    <input 
                      type="text" value={stat.prefix || ''} onChange={(e) => handleStatItemChange(stat.id, 'prefix', e.target.value)}
                      placeholder="+"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">عدد هدف (انگلیسی)</label>
                    <input 
                      type="number" required value={stat.value} onChange={(e) => handleStatItemChange(stat.id, 'value', Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">پسوند (مانند ٪)</label>
                    <input 
                      type="text" value={stat.suffix || ''} onChange={(e) => handleStatItemChange(stat.id, 'suffix', e.target.value)}
                      placeholder="٪"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">عنوان شاخص</label>
                  <input 
                    type="text" required value={stat.title} onChange={(e) => handleStatItemChange(stat.id, 'title', e.target.value)}
                    placeholder="مثال: دانشجویان در حال تحصیل"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">شرح و زیرعنوان کوتاه</label>
                  <textarea 
                    value={stat.description} onChange={(e) => handleStatItemChange(stat.id, 'description', e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">آیکون</label>
                    <select 
                      value={stat.iconName} onChange={(e) => handleStatItemChange(stat.id, 'iconName', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Users">Users (دانشجویان / کاربران)</option>
                      <option value="GraduationCap">GraduationCap (کلاه فارغ‌التحصیلی)</option>
                      <option value="BookOpenCheck">BookOpenCheck (رشته‌ها / کتاب)</option>
                      <option value="TrendingUp">TrendingUp (شاخص رشد / اشتغال)</option>
                      <option value="Award">Award (مدال و افتخارات)</option>
                      <option value="Briefcase">Briefcase (بازار کار و شغل)</option>
                      <option value="Building2">Building2 (کارگاه‌ها / ساختمان)</option>
                      <option value="Sparkles">Sparkles (درخشش و دستاورد)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">رنگ تم</label>
                    <select 
                      value={stat.colorScheme} onChange={(e) => handleStatItemChange(stat.id, 'colorScheme', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="blue">آبی (Blue)</option>
                      <option value="emerald">سبز زمردی (Emerald)</option>
                      <option value="indigo">نیلی / بنفش (Indigo)</option>
                      <option value="amber">طلایی / نارنجی (Amber)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        </>
        )}

        {/* Features Settings */}
        {activeTab === 'features' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-blue-500" />
              بخش مزیت‌های رقابتی (چرا کوثر کاکی)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">نشانک بالا (Badge)</label>
                <input 
                  type="text" name="featuresBadge" value={settings.featuresBadge || ''} onChange={handleChange}
                  placeholder="مثال: مزیت‌های رقابتی"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">عنوان اصلی</label>
                <input 
                  type="text" required name="featuresTitle" value={settings.featuresTitle || ''} onChange={handleChange}
                  placeholder="مثال: چرا کوثر کاکی؟"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-bold text-slate-700 mb-2">توضیح کوتاه (زیر عنوان)</label>
                <textarea 
                  name="featuresSubtitle" value={settings.featuresSubtitle || ''} onChange={handleChange} rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">باکس‌های ویژگی</h3>
            <button type="button" onClick={addFeature} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              افزودن ویژگی
            </button>
          </div>
          
          <div className="space-y-6">
            {(settings.featuresItems || []).map((feature, index) => (
              <div key={feature.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 relative group">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-slate-700">ویژگی {index + 1}</h4>
                  <button type="button" onClick={() => removeFeature(feature.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">عنوان</label>
                    <input 
                      type="text" required value={feature.title} onChange={(e) => handleFeatureItemChange(feature.id, 'title', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">توضیحات</label>
                    <textarea 
                      required value={feature.description} onChange={(e) => handleFeatureItemChange(feature.id, 'description', e.target.value)} rows={2}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">نام آیکون (Lucide)</label>
                    <select 
                      value={feature.iconName} onChange={(e) => handleFeatureItemChange(feature.id, 'iconName', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-left" dir="ltr"
                    >
                      <option value="GraduationCap">GraduationCap (کلاه فارغ‌التحصیلی)</option>
                      <option value="MonitorPlay">MonitorPlay (مانیتور/تجهیزات)</option>
                      <option value="Briefcase">Briefcase (کیف کار/صنعت)</option>
                      <option value="Users">Users (کاربران/محیط)</option>
                      <option value="Lightbulb">Lightbulb (ایده/لامپ)</option>
                      <option value="Target">Target (هدف)</option>
                      <option value="Zap">Zap (سرعت/انرژی)</option>
                      <option value="Shield">Shield (امنیت/سپر)</option>
                      <option value="Star">Star (ستاره/ویژه)</option>
                      <option value="Rocket">Rocket (پیشرفت/موشک)</option>
                      <option value="Map">Map (نقشه)</option>
                      <option value="Heart">Heart (قلب)</option>
                      <option value="Compass">Compass (قطب‌نما)</option>
                      <option value="Cpu">Cpu (پردازنده)</option>
                      <option value="Award">Award (جایزه/افتخار)</option>
                      <option value="Globe">Globe (جهان/آنلاین)</option>
                      <option value="Book">Book (کتاب)</option>
                      <option value="Settings">Settings (تنظیمات)</option>
                      <option value="Video">Video (ویدیو)</option>
                      <option value="Building">Building (ساختمان)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Footer & Contact Settings */}
        {activeTab === 'footer' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Phone className="w-5 h-5 text-blue-500" />
            بخش اطلاعات تماس و صفحه "تماس با ما"
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="md:col-span-2">
                <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">تنظیمات متن صفحه تماس با ما</h3>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">عنوان اصلی صفحه تماس</label>
                <input 
                  type="text" required name="contactPageTitle" value={settings.contactPageTitle || ''} onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">توضیح کوتاه صفحه تماس</label>
                <textarea 
                  required name="contactPageSubtitle" value={settings.contactPageSubtitle || ''} onChange={handleChange} rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">اطلاعات ارتباطی (نمایش در فوتر و صفحه تماس)</h3>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">متن درباره ما (فوتر)</label>
                <textarea 
                  required name="footerAbout" value={settings.footerAbout} onChange={handleChange} rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">آدرس فیزیکی مرکز</label>
                <input 
                  type="text" required name="contactAddress" value={settings.contactAddress} onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">شماره تماس (تلفن)</label>
                  <input 
                    type="text" required name="contactPhone" value={settings.contactPhone} onChange={handleChange} dir="ltr"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ایمیل ارتباطی</label>
                  <input 
                    type="email" required name="contactEmail" value={settings.contactEmail} onChange={handleChange} dir="ltr"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">آی‌فریم (Iframe) نقشه گوگل</label>
                <textarea 
                  name="contactMapIframe" value={settings.contactMapIframe || ''} onChange={handleChange} rows={4} dir="ltr"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs"
                  placeholder='<iframe src="..."></iframe>'
                ></textarea>
                <p className="text-xs text-slate-500 mt-2">کد embed را از Google Maps دریافت و در اینجا کپی کنید.</p>
              </div>
            </div>

            {/* Copyright & Rights Settings */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    متن کپی‌رایت و حقوق نشر (پاورقی پایین سایت)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    این دو خط متنی در آخرین بخش انتهای سایت (نوار سرمه‌ای زیرین) در تمام صفحات سایت نمایش داده می‌شوند.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">متن کپی‌رایت فارسی (سمت راست)</label>
                  <input 
                    type="text" 
                    name="footerCopyrightPersian" 
                    value={settings.footerCopyrightPersian || ''} 
                    onChange={handleChange}
                    placeholder="تمامی حقوق این وب‌سایت متعلق به مرکز آموزش علمی کاربردی کوثر کاکی می‌باشد."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">عبارت فارسی بیانیه مالکیت و حقوق سایت</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">متن کپی‌رایت انگلیسی / لاتین (سمت چپ)</label>
                  <input 
                    type="text" 
                    name="footerCopyrightEnglish" 
                    value={settings.footerCopyrightEnglish || ''} 
                    onChange={handleChange} 
                    dir="ltr"
                    placeholder="© 2024 Kowsar Kaki UAST"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm font-medium"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">سال و عبارت کپی‌رایت انگلیسی به همراه علامت ©</p>
                </div>
              </div>

              {/* Live Footer Preview */}
              <div className="pt-2">
                <div className="text-xs font-bold text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  پیش‌نمایش ظاهر نوار کپی‌رایت در پایین سایت:
                </div>
                <div className="bg-blue-950 text-blue-100 p-4 sm:p-5 rounded-2xl border border-blue-900 shadow-inner flex flex-col md:flex-row justify-between items-center gap-3 text-xs font-light text-blue-200/80">
                  <p className="text-center md:text-right font-light">
                    {settings.footerCopyrightPersian || 'تمامی حقوق این وب‌سایت متعلق به مرکز آموزش علمی کاربردی کوثر کاکی می‌باشد.'}
                  </p>
                  <p dir="ltr" className="text-center md:text-left font-mono text-[11px] text-blue-300/70">
                    {settings.footerCopyrightEnglish || '© 2024 Kowsar Kaki UAST'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
        
        {/* Higher Ed Systems Settings */}
        {activeTab === 'higherEd' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Library className="w-5 h-5 text-blue-500" />
              سامانه‌های آموزش عالی (اسلایدر صفحه اصلی)
            </h2>
            <button type="button" onClick={addHigherEdSystem} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              افزودن سامانه
            </button>
          </div>
          
          <div className="space-y-4">
            {(settings.higherEdSystems || []).map((sys, index) => (
              <div key={sys.id} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 items-start md:items-center relative group">
                <div className="w-16 h-16 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                  {sys.logoUrl ? (
                    <img src={sys.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">عنوان سامانه</label>
                    <input 
                      type="text" required value={sys.title} onChange={(e) => updateHigherEdSystem(sys.id, 'title', e.target.value)}
                      placeholder="وزارت علوم، تحقیقات و فناوری"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">لینک سامانه (URL)</label>
                    <input 
                      type="url" required value={sys.url} onChange={(e) => updateHigherEdSystem(sys.id, 'url', e.target.value)}
                      placeholder="https://msrt.ir" dir="ltr"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      لوگوی سامانه
                      <span className="text-[10px] font-normal text-slate-400 mr-2">(سایز پیشنهادی: ۲۰۰x۲۰۰ پیکسل - مربع PNG یا WEBP)</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setServerPickerState({
                          isOpen: true,
                          targetType: 'higherEdLogo',
                          targetHigherEdId: sys.id
                        })}
                        className="shrink-0 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="انتخاب از مخزن سرور"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                        <span>مخزن سرور</span>
                      </button>
                      <input 
                        type="url" value={sys.logoUrl || ''} onChange={(e) => updateHigherEdSystem(sys.id, 'logoUrl', e.target.value)}
                        placeholder="آدرس تصویر (یا آپلود کنید)" dir="ltr"
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {sys.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setCropperModal({
                            isOpen: true,
                            imageSrc: sys.logoUrl || null,
                            targetType: 'higherEdLogo',
                            targetHigherEdId: sys.id,
                            initialRatio: 1
                          })}
                          className="shrink-0 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-indigo-200 cursor-pointer"
                          title="برش و تنظیم کادر لوگوی سامانه"
                        >
                          <Crop className="w-3.5 h-3.5" />
                          برش
                        </button>
                      )}
                      <label className={`shrink-0 cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border border-blue-200 ${uploadingSysId === sys.id ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload className="w-4 h-4" />
                        {uploadingSysId === sys.id ? 'آپلود...' : 'آپلود عکس'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleHigherEdLogoUpload(sys.id, e)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 border-l border-slate-200/50 pl-3 ml-2 md:mt-6">
                  <label className="text-[10px] text-slate-400 font-bold whitespace-nowrap">اولویت:</label>
                  <input
                    type="number" min={1} value={sys.order}
                    onChange={(e) => updateHigherEdSystem(sys.id, 'order', parseInt(e.target.value) || 1)}
                    className="w-12 text-center text-xs font-bold py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center gap-2 md:mt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={sys.isActive} 
                      onChange={(e) => updateHigherEdSystem(sys.id, 'isActive', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-500">{sys.isActive ? 'فعال' : 'غیرفعال'}</span>
                </div>
                
                <button type="button" onClick={() => removeHigherEdSystem(sys.id)} className="md:mt-5 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {(!settings.higherEdSystems || settings.higherEdSystems.length === 0) && (
              <div className="text-center py-8 text-slate-400 text-sm font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                هیچ سامانه‌ای یافت نشد. برای افزودن کلیک کنید.
              </div>
            )}
          </div>
        </div>
        )}

        {/* Dynamic Lists - Navbar Links */}
        {activeTab === 'navigation' && (
          <>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <List className="w-5 h-5 text-blue-500" />
              منوهای بالای سایت (Navbar)
            </h2>
            <button type="button" onClick={() => addLink('navLinks')} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              افزودن منو
            </button>
          </div>
          
          <div className="space-y-4">
            {settings.navLinks.map((link, index) => (
              <div key={link.id} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 items-start md:items-center relative group">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-1">عنوان منو</label>
                  <input 
                    type="text" required value={link.label} onChange={(e) => handleLinkChange('navLinks', link.id, 'label', e.target.value)}
                    placeholder="مثال: درباره ما"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-1">لینک (URL)</label>
                  <div className="relative">
                    <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" required value={link.href} onChange={(e) => handleLinkChange('navLinks', link.id, 'href', e.target.value)}
                      placeholder="/" dir="ltr"
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 pr-9 pl-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 border-l border-slate-200/50 pl-3 ml-2 md:mt-6">
                  <label className="text-[10px] text-slate-400 font-bold whitespace-nowrap">اولویت:</label>
                  <input
                    type="number"
                    min={1}
                    max={settings.navLinks.length}
                    value={index + 1}
                    onChange={(e) => orderLink('navLinks', index, parseInt(e.target.value) || 1)}
                    className="w-12 text-center text-xs font-bold py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2 md:mt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={link.isActive !== false} 
                      onChange={(e) => handleLinkChange('navLinks', link.id, 'isActive', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-500">{link.isActive !== false ? 'فعال' : 'غیرفعال'}</span>
                </div>
                <button type="button" onClick={() => removeLink('navLinks', link.id)} className="md:mt-5 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-500" />
              دسترسی سریع (فوتر)
            </h2>
            <button type="button" onClick={() => addLink('quickLinks')} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              افزودن لینک
            </button>
          </div>
          
          <div className="space-y-4">
            {settings.quickLinks.map((link, index) => (
              <div key={link.id} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 items-start md:items-center relative group">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-1">عنوان لینک</label>
                  <input 
                    type="text" required value={link.label} onChange={(e) => handleLinkChange('quickLinks', link.id, 'label', e.target.value)}
                    placeholder="مثال: پورتال دانشجویی"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-1">لینک (URL)</label>
                  <div className="relative">
                    <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" required value={link.href} onChange={(e) => handleLinkChange('quickLinks', link.id, 'href', e.target.value)}
                      placeholder="https://..." dir="ltr"
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 pr-9 pl-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 border-l border-slate-200/50 pl-3 ml-2 md:mt-6">
                  <label className="text-[10px] text-slate-400 font-bold whitespace-nowrap">اولویت:</label>
                  <input
                    type="number"
                    min={1}
                    max={settings.quickLinks.length}
                    value={index + 1}
                    onChange={(e) => orderLink('quickLinks', index, parseInt(e.target.value) || 1)}
                    className="w-12 text-center text-xs font-bold py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2 md:mt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={link.isActive !== false} 
                      onChange={(e) => handleLinkChange('quickLinks', link.id, 'isActive', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-500">{link.isActive !== false ? 'فعال' : 'غیرفعال'}</span>
                </div>
                <button type="button" onClick={() => removeLink('quickLinks', link.id)} className="md:mt-5 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-blue-500" />
              دکمه‌های سفارشی هدر
            </h2>
            <button type="button" onClick={() => {
              const currentBtns = settings.headerButtons || [];
              setSettings({
                ...settings,
                headerButtons: [...currentBtns, { id: Date.now().toString(), label: '', href: '/', style: 'primary' }]
              });
            }} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              افزودن دکمه
            </button>
          </div>
          
          <div className="space-y-4">
            {(settings.headerButtons || []).map((btn, index) => (
              <div key={btn.id} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 items-start md:items-center relative group">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-1">عنوان دکمه</label>
                  <input 
                    type="text" required value={btn.label} onChange={(e) => handleHeaderButtonChange(btn.id, 'label', e.target.value)}
                    placeholder="مثال: ورود دانشجویان"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-bold text-slate-500 mb-1">لینک یا آدرس اینترنتی (URL)</label>
                  <div className="relative">
                    <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" required value={btn.href} onChange={(e) => handleHeaderButtonChange(btn.id, 'href', e.target.value)}
                      placeholder="https://... یا /portal/login" dir="ltr"
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 pr-9 pl-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>
                <div className="flex-1 w-full md:w-36">
                  <label className="block text-xs font-bold text-slate-500 mb-1">استایل</label>
                  <select 
                    value={btn.style} onChange={(e) => handleHeaderButtonChange(btn.id, 'style', e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="primary">اصلی (آبی برجسته)</option>
                    <option value="secondary">ثانویه (روشن)</option>
                    <option value="outline">حاشیه‌دار</option>
                  </select>
                </div>
                <button type="button" onClick={() => {
                  setSettings({
                    ...settings,
                    headerButtons: (settings.headerButtons || []).filter(b => b.id !== btn.id)
                  });
                }} className="md:mt-5 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100" title="حذف دکمه">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {(settings.headerButtons?.length === 0 || !settings.headerButtons) && (
              <p className="text-sm text-slate-500 text-center py-4">دکمه‌ای اضافه نشده است.</p>
            )}
          </div>
        </div>

        {/* Study Fields Manager */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-500" />
              مدیریت رشته‌های پیش‌ثبت‌نام
            </h2>
            <button type="button" onClick={() => {
              const currentFields = settings.studyFields || [];
              setSettings({
                ...settings,
                studyFields: [...currentFields, { id: `f-${Date.now()}`, name: '', value: '', degreeType: 'both', isActive: true, order: currentFields.length + 1 }]
              });
            }} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              افزودن رشته
            </button>
          </div>
          
          <div className="space-y-4">
            {(settings.studyFields || []).map((field, index) => (
              <div key={field.id} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 items-start md:items-center relative group">
                <div className="flex-1 w-full md:w-1/3">
                  <label className="block text-xs font-bold text-slate-500 mb-1">عنوان رشته (نمایش در فرم)</label>
                  <input 
                    type="text" required value={field.name} onChange={(e) => handleStudyFieldChange(field.id, 'name', e.target.value)}
                    placeholder="مثال: مهندسی کامپیوتر"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="w-full md:w-32">
                  <label className="block text-xs font-bold text-slate-500 mb-1">مقدار سیستمی (Value - انگلیسی)</label>
                  <input 
                    type="text" required value={field.value} onChange={(e) => handleStudyFieldChange(field.id, 'value', e.target.value)}
                    placeholder="مثال: software" dir="ltr"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div className="w-full md:w-40">
                  <label className="block text-xs font-bold text-slate-500 mb-1">مقطع تحصیلی</label>
                  <select 
                    value={field.degreeType || 'both'} onChange={(e) => handleStudyFieldChange(field.id, 'degreeType', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="both">کاردانی و کارشناسی</option>
                    <option value="associate">فقط کاردانی</option>
                    <option value="bachelor">فقط کارشناسی</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 md:mt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={field.isActive !== false} 
                      onChange={(e) => handleStudyFieldChange(field.id, 'isActive', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-500">{field.isActive !== false ? 'فعال' : 'غیرفعال'}</span>
                </div>
                <button type="button" onClick={() => {
                  setSettings({
                    ...settings,
                    studyFields: (settings.studyFields || []).filter(f => f.id !== field.id)
                  });
                }} className="md:mt-5 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100" title="حذف رشته">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {(settings.studyFields?.length === 0 || !settings.studyFields) && (
              <p className="text-sm text-slate-500 text-center py-4">هیچ رشته‌ای تعریف نشده است.</p>
            )}
          </div>
        </div>

          </>
        )}
      </form>
      {/* UNIVERSAL IMAGE CROPPER MODAL */}
      <ImageCropperModal
        isOpen={cropperModal.isOpen}
        onClose={() => setCropperModal(prev => ({ ...prev, isOpen: false }))}
        imageSrc={cropperModal.imageSrc}
        initialAspectRatio={cropperModal.initialRatio ?? 1}
        title={
          cropperModal.targetType === 'mainLogo' 
            ? 'برش و تنظیم ابعاد لوگوی اصلی دانشگاه' 
            : 'برش و کادربندی لوگوی سامانه آموزش عالی'
        }
        targetFolder="settings"
        onCropComplete={handleSettingsCropComplete}
      />

      {/* SERVER IMAGE PICKER MODAL */}
      <ServerImagePickerModal
        isOpen={serverPickerState.isOpen}
        onClose={() => setServerPickerState(prev => ({ ...prev, isOpen: false }))}
        onSelect={(imgUrl) => {
          if (serverPickerState.targetType === 'mainLogo') {
            setSettings(prev => ({ ...prev, logoUrl: imgUrl }));
          } else if (serverPickerState.targetType === 'higherEdLogo' && serverPickerState.targetHigherEdId) {
            updateHigherEdSystem(serverPickerState.targetHigherEdId, 'logoUrl', imgUrl);
          }
          setServerPickerState(prev => ({ ...prev, isOpen: false }));
        }}
        initialFolder="settings"
        title={
          serverPickerState.targetType === 'mainLogo'
            ? 'انتخاب لوگوی دانشگاه از مخزن سرور'
            : 'انتخاب لوگوی سامانه آموزش عالی از مخزن سرور'
        }
      />
    </div>
  );
}
