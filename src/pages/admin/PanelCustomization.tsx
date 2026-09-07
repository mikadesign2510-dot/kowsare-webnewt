import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Layout, 
  AlignRight, 
  AlignLeft, 
  ArrowUp, 
  Sun, 
  Moon, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Save, 
  CheckCircle, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  Maximize2, 
  Minimize2,
  Type,
  Edit3,
  GraduationCap,
  MessageSquare,
  Receipt,
  Users,
  Newspaper,
  Images,
  FileText,
  Settings,
  UserCog,
  Server,
  Activity,
  ShieldAlert,
  Search,
  Undo2,
  ChevronUp,
  ChevronDown,
  Clock
} from 'lucide-react';
import { storage, AdminPanelConfig, defaultPanelConfig } from '../../lib/storage';

export default function AdminPanelCustomization() {
  const [config, setConfig] = useState<AdminPanelConfig>(defaultPanelConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');

  useEffect(() => {
    setConfig(storage.getAdminPanelConfig());
  }, []);

  const handleUpdate = (updates: Partial<AdminPanelConfig>) => {
    const updated = { ...config, ...updates };
    setConfig(updated);
    storage.updateAdminPanelConfig(updated);
  };

  const handleSave = () => {
    storage.updateAdminPanelConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleReset = () => {
    setConfig(defaultPanelConfig);
    storage.updateAdminPanelConfig(defaultPanelConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleMenuTitleChange = (path: string, newTitle: string) => {
    const currentTitles = { ...(config.customMenuTitles || {}) };
    if (!newTitle.trim()) {
      delete currentTitles[path];
    } else {
      currentTitles[path] = newTitle;
    }
    handleUpdate({ customMenuTitles: currentTitles });
  };

  const handleResetSingleMenuTitle = (path: string) => {
    const currentTitles = { ...(config.customMenuTitles || {}) };
    delete currentTitles[path];
    handleUpdate({ customMenuTitles: currentTitles });
  };

  const handleResetAllMenuTitles = () => {
    handleUpdate({ customMenuTitles: {} });
  };

  const handleOrderChange = (path: string, newPosition: number) => {
    const currentOrder = config.customMenuOrder?.length ? config.customMenuOrder : menuItemsDefinition.map(m => m.path);
    const currentIndex = currentOrder.indexOf(path);
    if (currentIndex === -1) return;
    
    const newIndex = Math.max(0, Math.min(newPosition - 1, currentOrder.length - 1));
    if (currentIndex === newIndex) return;

    const newOrder = [...currentOrder];
    const [movedItem] = newOrder.splice(currentIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);

    handleUpdate({ customMenuOrder: newOrder });
  };

  const positions = [
    {
      id: 'right' as const,
      title: 'سمت راست (استاندارد فارسی)',
      desc: 'منوی عمودی در سمت راست صفحه با چیدمان راست‌چین استاندارد',
      icon: AlignRight
    },
    {
      id: 'left' as const,
      title: 'سمت چپ (مدرن جهانی)',
      desc: 'منوی عمودی در سمت چپ با فضای دید گسترده‌تر در سمت راست',
      icon: AlignLeft
    },
    {
      id: 'top' as const,
      title: 'بالای صفحه (افقی / سربرگ)',
      desc: 'منوی نواری در بالای پنل مدیریت، مناسب مانیتورهای عریض و حداکثر فضای کار',
      icon: ArrowUp
    }
  ];

  const themes = [
    {
      id: 'light' as const,
      title: 'روشن و مینیمال (Light)',
      desc: 'پس‌زمینه سفید و لایت برای کل پنل، کنتراست شفاف و خوانایی بالا',
      icon: Sun,
      bgClass: 'bg-white border-slate-200 text-slate-800',
      badgeClass: 'bg-slate-100 text-slate-700'
    },
    {
      id: 'dark' as const,
      title: 'تاریک مدرن (Dark Slate)',
      desc: 'تم دارک سرتاسری برای کل پنل، فرم‌ها، جداول و کارت‌ها جهت کاهش خستگی چشم',
      icon: Moon,
      bgClass: 'bg-slate-900 border-slate-800 text-slate-100',
      badgeClass: 'bg-slate-800 text-slate-300'
    },
    {
      id: 'navy' as const,
      title: 'سرمه‌ای دانشگاهی (Royal Navy)',
      desc: 'استایل آکادمیک و سلطنتی تیره با تم سرمه‌ای عمیق روی کل صفحات پنل',
      icon: Sparkles,
      bgClass: 'bg-[#0f172a] border-blue-950 text-blue-100',
      badgeClass: 'bg-blue-950/80 text-blue-300'
    },
    {
      id: 'emerald' as const,
      title: 'سبز کله‌غازی (Deep Emerald)',
      desc: 'تم طبیعی و شاداب مدیریتی تیره با پالت سبز جنگلی در سراسر پنل',
      icon: Layers,
      bgClass: 'bg-[#062c24] border-emerald-950 text-emerald-100',
      badgeClass: 'bg-emerald-950/80 text-emerald-300'
    }
  ];

  const accentColors = [
    { id: 'blue' as const, name: 'آبی لاجوردی', class: 'bg-blue-600 ring-blue-400' },
    { id: 'emerald' as const, name: 'سبز زمردی', class: 'bg-emerald-600 ring-emerald-400' },
    { id: 'violet' as const, name: 'بنفش سلطنتی', class: 'bg-violet-600 ring-violet-400' },
    { id: 'rose' as const, name: 'یاقوتی رز', class: 'bg-rose-600 ring-rose-400' },
    { id: 'amber' as const, name: 'طلایی کهربایی', class: 'bg-amber-500 ring-amber-300' }
  ];

  const menuItemsDefinition = [
    { path: '/admin', defaultName: 'داشبورد', icon: Layout, category: 'عمومی' },
    { path: '/admin/students', defaultName: 'مدیریت دانشجویان', icon: GraduationCap, category: 'آموزش' },
    { path: '/admin/tickets', defaultName: 'درخواست‌ها و تیکت‌ها', icon: MessageSquare, category: 'پشتیبانی' },
    { path: '/admin/financial', defaultName: 'امور مالی (رسیدها)', icon: Receipt, category: 'مالی' },
    { path: '/admin/panel-settings', defaultName: 'تنظیمات ظاهر پنل', icon: Palette, category: 'تنظیمات' },
    { path: '/admin/registrations', defaultName: 'ثبت‌نام‌ها', icon: Users, category: 'آموزش' },
    { path: '/admin/news', defaultName: 'مدیریت اخبار و اطلاعیه‌ها', icon: Newspaper, category: 'محتوا' },
    { path: '/admin/banners', defaultName: 'مدیریت بنر و اسلایدر', icon: Images, category: 'محتوا' },
    { path: '/admin/gallery', defaultName: 'نگارخانه (گالری)', icon: Images, category: 'محتوا' },
    { path: '/admin/forms', defaultName: 'مدیریت جزوه و فرم‌ها', icon: FileText, category: 'آموزش' },
    { path: '/admin/settings', defaultName: 'تنظیمات متون سایت', icon: Settings, category: 'تنظیمات' },
    { path: '/admin/users', defaultName: 'مدیریت کارشناسان', icon: UserCog, category: 'کاربران' },
    { path: '/admin/server-monitoring', defaultName: 'پایش سرور و دیتابیس', icon: Server, category: 'فنی' },
    { path: '/admin/logs', defaultName: 'لاگ‌ها و خطایابی', icon: Activity, category: 'فنی' },
    { path: '/admin/security-logs', defaultName: 'گزارشگیری امنیتی (Audit)', icon: ShieldAlert, category: 'امنیت' },
  ];

  const orderedMenuItems = [...menuItemsDefinition];
  if (config.customMenuOrder && config.customMenuOrder.length > 0) {
    orderedMenuItems.sort((a, b) => {
      const idxA = config.customMenuOrder!.indexOf(a.path);
      const idxB = config.customMenuOrder!.indexOf(b.path);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }

  const filteredMenuItems = orderedMenuItems.filter(item => {
    const customTitle = config.customMenuTitles?.[item.path] || '';
    return item.defaultName.includes(menuSearch) || 
           customTitle.includes(menuSearch) || 
           item.category.includes(menuSearch);
  });

  const customCount = Object.keys(config.customMenuTitles || {}).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Palette className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
              شخصی‌سازی و تنظیمات پنل مدیریت
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              انتخاب موقعیت منوها، تم‌های رنگی سرتاسری (روشن/تیره/سرمه‌ای)، رنگ شاخص و تغییر نام منوها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleReset}
            className="px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm"
            title="بازگشت به تنظیمات اولیه"
          >
            <RotateCcw className="w-4 h-4" />
            پیش‌فرض
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            ذخیره تغییرات
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold text-sm">تنظیمات و چیدمان پنل مدیریت با موفقیت ذخیره و در کل سامانه اعمال شد.</span>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg">ذخیره شد</span>
        </div>
      )}

      {/* Section 1: Menu Position */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">موقعیت و جهت قرارگیری منوها</h2>
              <p className="text-xs text-slate-500 font-medium">انتخاب محل قرارگیری نوار ناوبری پنل مدیریت</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl">
            موقعیت فعلی: {positions.find(p => p.id === config.sidebarPosition)?.title}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {positions.map((pos) => {
            const isSelected = config.sidebarPosition === pos.id;
            const Icon = pos.icon;
            return (
              <div
                key={pos.id}
                onClick={() => handleUpdate({ sidebarPosition: pos.id })}
                className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 flex flex-col justify-between ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-600/20' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {isSelected && (
                      <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-800 text-base mb-1">{pos.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{pos.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Global Dark / Light / Navy / Emerald Theme */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">طرح و تم رنگی سراسری پنل (Dark / Navy / Emerald / Light)</h2>
              <p className="text-xs text-slate-500 font-medium">
                اعمال تم رنگی بر روی کل پنل مدیریت شامل کارت‌ها، جداول، فرم‌ها، منوها و پس‌زمینه‌ها
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl">
            تم انتخابی: {themes.find(t => t.id === config.sidebarTheme)?.title}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {themes.map((theme) => {
            const isSelected = config.sidebarTheme === theme.id;
            const Icon = theme.icon;
            return (
              <div
                key={theme.id}
                onClick={() => handleUpdate({ sidebarTheme: theme.id })}
                className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                  isSelected 
                    ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md scale-[1.01]' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Mini Preview Box */}
                <div className={`w-full p-4 rounded-xl mb-4 border ${theme.bgClass} flex flex-col gap-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        ک
                      </div>
                      <span className="text-xs font-black">پنل کوثر</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${theme.badgeClass}`}>
                      {theme.id}
                    </span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold">
                      داشبورد اصلی
                    </div>
                    <div className="px-2 py-1 rounded opacity-70 text-[10px] font-medium">
                      مدیریت دانشجویان
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Icon className="w-4 h-4 text-blue-600" />
                      {theme.title}
                    </h3>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{theme.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Menu Item Names Customization (New Feature) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span>شخصی‌سازی عناوین و متن منوهای پنل</span>
                {customCount > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                    {customCount} عنوان تغییر یافته
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                می‌توانید عنوان نمایشی هر کدام از گزینه‌های منوی مدیریت را به دلخواه خود تغییر دهید.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {customCount > 0 && (
              <button
                onClick={handleResetAllMenuTitles}
                className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all flex items-center gap-1.5"
                title="بازنشانی تمامی عنوان‌ها به نام‌های پیش‌فرض"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>بازنشانی همه عناوین</span>
              </button>
            )}

            {/* Quick Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="جستجوی منو..."
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-500 w-44"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Menu Items Table / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const currentCustomName = config.customMenuTitles?.[item.path] || '';
            const isCustomized = Boolean(currentCustomName.trim() && currentCustomName !== item.defaultName);

            return (
              <div 
                key={item.path}
                className={`p-4 rounded-2xl border transition-all ${
                  isCustomized 
                    ? 'border-purple-300 bg-purple-50/30 shadow-sm' 
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      پیش‌فرض: {item.defaultName}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600">
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 border-l border-slate-200/50 pl-3 ml-2">
                    <label className="text-[10px] text-slate-400 font-bold whitespace-nowrap">اولویت:</label>
                    <input
                      type="number"
                      min={1}
                      max={orderedMenuItems.length}
                      value={orderedMenuItems.findIndex(m => m.path === item.path) + 1}
                      onChange={(e) => handleOrderChange(item.path, parseInt(e.target.value) || 1)}
                      className="w-12 text-center text-xs font-bold py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={item.defaultName}
                      value={currentCustomName}
                      onChange={(e) => handleMenuTitleChange(item.path, e.target.value)}
                      className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-800"
                    />
                    <Edit3 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {isCustomized && (
                    <button
                      onClick={() => handleResetSingleMenuTitle(item.path)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="بازگشت به نام پیش‌فرض"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Accent Color & Extra Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Accent Color */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">رنگ شاخص و هایلایت (Accent)</h2>
              <p className="text-xs text-slate-500 font-medium">رنگ دکمه‌های فعال و نشانگرهای منو</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            {accentColors.map((color) => {
              const isSelected = config.accentColor === color.id;
              return (
                <button
                  key={color.id}
                  onClick={() => handleUpdate({ accentColor: color.id })}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${
                    isSelected 
                      ? 'border-slate-800 bg-slate-50 shadow-sm scale-105 font-bold' 
                      : 'border-slate-200 hover:border-slate-300 font-medium text-slate-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full ${color.class} flex items-center justify-center text-white shadow-sm`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                  <span className="text-xs text-slate-800">{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact Mode & Display Preferences */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">تنظیمات نمایش و فشرده‌سازی</h2>
              <p className="text-xs text-slate-500 font-medium">بهینه‌سازی فضای کاری و جزئیات</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Compact Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                {config.compactMode ? <Minimize2 className="w-5 h-5 text-blue-600" /> : <Maximize2 className="w-5 h-5 text-slate-600" />}
                <div>
                  <div className="font-bold text-sm text-slate-800">حالت منوی فشرده (Compact Sidebar)</div>
                  <div className="text-xs text-slate-500">کاهش عرض سایدبار برای افزایش فضای محتوای جداول</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate({ compactMode: !config.compactMode })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  config.compactMode ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>

            {/* Badges Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold text-sm text-slate-800">نمایش نشانگرهای هشدار و لاگ‌ها</div>
                  <div className="text-xs text-slate-500">نمایش شمارنده خطاها و رویدادهای باز در منو</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate({ showBadges: !config.showBadges })}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  config.showBadges ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>

            {/* Inactivity Session Timeout */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="font-bold text-sm text-slate-800">مدت زمان خروج خودکار (عدم فعالیت)</div>
                    <div className="text-xs text-slate-500">اگر در این مدت تعاملی نداشته باشید، برای حفظ امنیت به صفحه ورود هدایت می‌شوید</div>
                  </div>
                </div>
                <span className="text-xs font-black bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
                  {config.sessionTimeoutMinutes || 10} دقیقه
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[5, 10, 15, 30].map(mins => {
                  const isSelected = (config.sessionTimeoutMinutes || 10) === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleUpdate({ sessionTimeoutMinutes: mins })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mins} دقیقه
                      {mins === 10 && <span className="block text-[10px] opacity-80">(استاندارد)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
