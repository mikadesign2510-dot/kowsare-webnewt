import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { storage, FormItem } from '../lib/storage';
import DynamicSidebar from '../components/DynamicSidebar';
import { getPamphletHighlight, FeaturedPamphletBadge, PinnedCornerRibbon } from '../components/PamphletCover';
import { 
  FileText, Download, Search, Filter, CheckCircle2, 
  HelpCircle, AlertCircle, Info, ExternalLink, ArrowLeft, 
  Calendar, Layers, Sparkles, Building2, Tag, FileCheck,
  FileType, FileSpreadsheet, Archive, Check, Eye, X, BookOpen,
  FileCode, Clock, ShieldAlert, PhoneCall, GraduationCap, User, Star
} from 'lucide-react';

export default function FormsPage() {
  const [forms, setForms] = useState<FormItem[]>(() => {
    try {
      return storage.getForms().filter(f => f.isPublished !== false);
    } catch {
      return [];
    }
  });
  const [selectedType, setSelectedType] = useState<'all' | 'form' | 'pamphlet'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('همه');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'title'>('popular');
  const [showOnlyPinned, setShowOnlyPinned] = useState<boolean>(false);
  const [selectedModalForm, setSelectedModalForm] = useState<FormItem | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [settings, setSettings] = useState(storage.getSettings());

  useEffect(() => {
    window.scrollTo(0, 0);
    loadForms();
    
    const handleSettingsUpdate = () => {
      setSettings(storage.getSettings());
    };

    const handleFormsChanged = () => {
      const localList = storage.getForms().filter(f => f.isPublished !== false);
      setForms(localList);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kowsar_forms' || e.key === null) {
        const localList = storage.getForms().filter(f => f.isPublished !== false);
        setForms(localList);
      }
    };

    window.addEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    window.addEventListener('kowsar_forms_changed', handleFormsChanged);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
      window.removeEventListener('kowsar_forms_changed', handleFormsChanged);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadForms = async () => {
    // ابتدا بلافاصله داده‌های موجود نمایش داده شوند تا تأخیری حس نشود
    const localList = storage.getForms().filter(f => f.isPublished !== false);
    if (localList.length > 0) {
      setForms(localList);
    }
    const list = await storage.syncFormsWithDB();
    const published = list.filter(f => f.isPublished !== false);
    setForms(published);
  };

  // Unique categories with counts
  const categories = useMemo(() => {
    const filteredByType = forms.filter(item => {
      if (selectedType === 'all') return true;
      if (selectedType === 'pamphlet') return item.itemType === 'pamphlet';
      return item.itemType !== 'pamphlet';
    });

    const counts: Record<string, number> = { 'همه': filteredByType.length };
    filteredByType.forEach(item => {
      const cat = item.category || (item.itemType === 'pamphlet' ? 'جزوات درسی' : 'آموزشی و تحصیلی');
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [forms, selectedType]);

  // Filter & Sort
  const filteredForms = useMemo(() => {
    return forms
      .filter(item => {
        // Type filter
        if (selectedType === 'form' && item.itemType === 'pamphlet') return false;
        if (selectedType === 'pamphlet' && item.itemType !== 'pamphlet') return false;

        // Pinned only filter
        if (showOnlyPinned && !item.isPinned) return false;

        const matchesCategory = selectedCategory === 'همه' || item.category === selectedCategory;
        const matchesFormat = selectedFormat === 'all' || item.fileFormat.toLowerCase() === selectedFormat.toLowerCase();
        const matchesSearch = 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.department && item.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.professorName && item.professorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.fieldOfStudy && item.fieldOfStudy.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
        return matchesCategory && matchesFormat && matchesSearch;
      })
      .sort((a, b) => {
        // Pinned first
        if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
        if (sortBy === 'popular') return (b.downloadCount || 0) - (a.downloadCount || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title, 'fa');
        return (b.priority || 0) - (a.priority || 0);
      });
  }, [forms, selectedType, showOnlyPinned, searchQuery, selectedCategory, selectedFormat, sortBy]);

  // Handle Download
  const handleDownload = (form: FormItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Increment download counter
    storage.incrementFormDownload(form.id);
    loadForms();

    setDownloadSuccessId(form.id);
    setTimeout(() => setDownloadSuccessId(null), 2500);

    // If direct server URL or http link exists
    if (form.fileUrl && (form.fileUrl.startsWith('/uploads/') || form.fileUrl.startsWith('http') || form.fileUrl.startsWith('data:'))) {
      const link = document.createElement('a');
      link.href = form.fileUrl;
      link.download = `${form.code || 'document'}-${form.title}.${form.fileFormat.toLowerCase()}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate standard text template file for demonstration
      const templateContent = `========================================================
مرکز آموزش علمی کاربردی کوثر کاکی
پورتال رسمی جزوات درسی و فرم‌های الکترونیکی
========================================================
عنوان: ${form.title}
کد: ${form.code}
نوع مدرک: ${form.itemType === 'pamphlet' ? 'جزوه و منبع درسی' : 'فرم و کاربرگ اداری'}
${form.professorName ? `استاد / مدرس: ${form.professorName}\n` : ''}${form.fieldOfStudy ? `رشته تحصیلی: ${form.fieldOfStudy}\n` : ''}${form.degreeLevel ? `مقطع تحصیلی: ${form.degreeLevel}\n` : ''}دپارتمان / گروه: ${form.department || 'آموزش'}
دسته‌بندی: ${form.category}
تاریخ به‌روزرسانی: ${form.updatedAt}

توضیحات:
${form.description}

--------------------------------------------------------
${form.itemType === 'pamphlet' ? 'سرفصل‌ها و مباحث کلیدی:' : 'دستورالعمل و مراحل تکمیل:'}
${form.instructions?.map((inst, idx) => `${idx + 1}. ${inst}`).join('\n') || 'مطالعه و تکمیل دقیق فیلدها.'}

--------------------------------------------------------
تلفن پشتیبانی و پیگیری: ۰۷۷-۳۵۳۲۲۴۴۱
نشانی: بوشهر، کاکی، مرکز آموزش علمی کاربردی کوثر کاکی
سامانه هم‌آوا: edu.uast.ac.ir
========================================================`;

      const blob = new Blob([templateContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${form.code || 'سند'}_${form.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const getFormatBadge = (format: string) => {
    switch (format.toUpperCase()) {
      case 'PDF':
        return { label: 'PDF', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: FileText };
      case 'DOCX':
        return { label: 'WORD', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText };
      case 'XLSX':
        return { label: 'EXCEL', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileSpreadsheet };
      case 'ZIP':
        return { label: 'ZIP', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Archive };
      case 'PPTX':
        return { label: 'PPTX', bg: 'bg-orange-50 text-orange-700 border-orange-200', icon: FileText };
      default:
        return { label: format, bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: FileText };
    }
  };

  const formsCount = forms.filter(f => f.itemType !== 'pamphlet').length;
  const pamphletsCount = forms.filter(f => f.itemType === 'pamphlet').length;

  return (
    <div className="min-h-screen pt-8 pb-24 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10"
      >
        
        {/* Page Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 md:p-14 shadow-xl shadow-blue-950/10">
          <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -right-24 -top-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-bold mb-4 border border-white/15">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>{settings.formsBadge || 'میز خدمت الکترونیک و بانک منابع درسی مرکز آموزش علمی کاربردی کوثر کاکی'}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
              {settings.formsTitle || 'جزوه و فرم‌های دانشگاهی'}
            </h1>
            
            <p className="text-blue-100/80 text-base md:text-lg leading-relaxed font-light">
              {settings.formsSubtitle || 'در این بخش می‌توانید تمامی جزوات و درسنامه‌های اساتید، کاربرگ‌های آموزشی، درخواست‌های اداری و مالی، آیین‌نامه‌ها و مدارک مورد نیاز دانشجویان را دریافت نمایید.'}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-bold text-blue-200/90">
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                <BookOpen className="w-4 h-4 text-indigo-300" />
                <span>جزوات درسی: <strong className="text-white font-black">{pamphletsCount}</strong> عنوان</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                <FileText className="w-4 h-4 text-blue-300" />
                <span>فرم‌های اداری: <strong className="text-white font-black">{formsCount}</strong> کاربرگ</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>به‌روزرسانی شده بر اساس آخرین بخشنامه‌ها و چارت دروس</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Type Switcher Tabs */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => { setSelectedType('all'); setSelectedCategory('همه'); }}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              selectedType === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>همه منابع ({forms.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedType('pamphlet'); setSelectedCategory('همه'); }}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              selectedType === 'pamphlet'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>جزوات درسی ({pamphletsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedType('form'); setSelectedCategory('همه'); }}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              selectedType === 'form'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>فرم‌های اداری ({formsCount})</span>
          </button>
        </div>

        {/* Search, Filter & View Controls */}
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-xl">
              <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={selectedType === 'pamphlet' 
                  ? "جستجو در نام درس، نام استاد، رشته تحصیلی یا کد درس..."
                  : "جستجو در عنوان، کد فرم، نام استاد، دپارتمان یا برچسب..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full px-2.5 py-0.5"
                >
                  پاک کردن
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Format Filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <FileType className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">همه فرمت‌ها</option>
                  <option value="pdf">فایل‌های PDF</option>
                  <option value="docx">فایل‌های Word</option>
                  <option value="pptx">فایل‌های PowerPoint</option>
                  <option value="xlsx">فایل‌های Excel</option>
                  <option value="zip">فایل‌های فشرده (ZIP)</option>
                </select>
              </div>

              {/* Pinned Filter Button */}
              <button
                type="button"
                onClick={() => setShowOnlyPinned(!showOnlyPinned)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  showOnlyPinned
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${showOnlyPinned ? 'text-amber-200' : 'text-amber-500'}`} />
                <span>{showOnlyPinned ? 'منتخب‌ها فعال' : 'فقط منتخب‌ها ⭐'}</span>
              </button>

              {/* Sort Filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <span className="text-slate-400">مرتب‌سازی:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="popular">پردانلودترین‌ها</option>
                  <option value="newest">جدیدترین و اولویت مرکز</option>
                  <option value="title">ترتیب الفبایی</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2 scrollbar-none border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1 pl-1">
              <Filter className="w-3.5 h-3.5" />
              دسته‌بندی:
            </span>
            {categories.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => setSelectedCategory(name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  selectedCategory === name
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedCategory === name ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid & Information Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Grid */}
          <div className="lg:col-span-8 space-y-6">
            
            {filteredForms.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-4">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">موردی با این مشخصات یافت نشد!</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  لطفاً فیلترها یا عبارت جستجو شده را بررسی و دوباره تلاش فرمایید.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('همه');
                    setSelectedFormat('all');
                    setSelectedType('all');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
                >
                  نمایش تمامی موارد
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredForms.map((item, idx) => {
                  const formatInfo = getFormatBadge(item.fileFormat);
                  const FormatIcon = formatInfo.icon;
                  const isSuccess = downloadSuccessId === item.id;
                  const isPamphlet = item.itemType === 'pamphlet';
                  const highlight = isPamphlet ? getPamphletHighlight(item.frameColor, item.fieldOfStudy) : null;
                  const isPinnedPamphlet = isPamphlet && item.isPinned;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`${
                        isPamphlet && highlight 
                          ? `${highlight.cardBg} ${
                              isPinnedPamphlet 
                                ? 'border-amber-300/90 ring-2 ring-amber-400/50 shadow-md shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20' 
                                : `${highlight.cardBorder} ${highlight.hoverBorder} shadow-xs hover:shadow-xl`
                            } ${isPinnedPamphlet ? 'border-t-[3.5px] border-t-amber-500' : highlight.topBarClass}` 
                          : 'bg-white border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-xl'
                      } rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between group relative`}
                    >
                      {/* Pinned Distinctive Ribbon */}
                      {isPinnedPamphlet && (
                        <PinnedCornerRibbon isPinned={true} />
                      )}

                      {/* Top Badges & Code */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-mono text-xs font-black px-2.5 py-1 bg-white/95 text-slate-700 rounded-xl border border-slate-200/80 shadow-2xs">
                              {item.code || (isPamphlet ? 'BOK' : 'FORM')}
                            </span>
                            {isPamphlet ? (
                              isPinnedPamphlet && (
                                <FeaturedPamphletBadge isPinned={true} />
                              )
                            ) : (
                              item.isPinned && (
                                <span className="bg-amber-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
                                  <Sparkles className="w-3 h-3" />
                                  فرم ویژه
                                </span>
                              )
                            )}
                            {isPamphlet && highlight && (
                              <span className={`${highlight.badgeBg} ${highlight.badgeText} border ${highlight.badgeBorder} px-2.5 py-1 rounded-xl text-[10px] font-black shadow-2xs`}>
                                جزوه درسی
                              </span>
                            )}
                          </div>

                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border shadow-2xs shrink-0 ${formatInfo.bg}`}>
                            <FormatIcon className="w-3.5 h-3.5" />
                            <span>{formatInfo.label}</span>
                          </div>
                        </div>

                        {/* Title & Professor/Department */}
                        <h3 className={`text-base font-black text-slate-900 mb-2.5 leading-snug transition-colors ${
                          isPamphlet ? 'group-hover:text-indigo-600' : 'group-hover:text-blue-600'
                        }`}>
                          {item.title}
                        </h3>

                        {isPamphlet ? (
                          <div className="space-y-2 mb-3.5">
                            {item.professorName && (
                              <div className={`inline-flex items-center gap-1.5 text-xs ${highlight?.teacherText || 'text-indigo-700'} font-bold bg-white/80 px-2.5 py-1 rounded-xl border border-slate-200/60 shadow-2xs`}>
                                <User className="w-3.5 h-3.5 shrink-0" />
                                <span>مدرس: {item.professorName}</span>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                              {item.fieldOfStudy && (
                                <span className="flex items-center gap-1.5 bg-white/95 text-slate-700 border border-slate-200/80 px-2.5 py-1 rounded-xl font-medium shadow-2xs">
                                  <GraduationCap className="w-3 h-3 text-slate-500" />
                                  {item.fieldOfStudy}
                                </span>
                              )}
                              {item.degreeLevel && (
                                <span className="bg-white/95 text-slate-600 border border-slate-200/80 px-2.5 py-1 rounded-xl font-medium shadow-2xs">
                                  {item.degreeLevel}
                                </span>
                              )}
                              {item.academicTerm && (
                                <span className="bg-white/95 text-slate-500 border border-slate-200/80 px-2.5 py-1 rounded-xl font-medium shadow-2xs">
                                  {item.academicTerm}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold mb-3">
                            <Building2 className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                            <span>{item.department || 'اداره آموزش'}</span>
                          </div>
                        )}

                        <p className="text-slate-500 text-xs leading-relaxed font-light line-clamp-3 mb-4">
                          {item.description}
                        </p>
                      </div>

                      {/* Bottom Info & Action Buttons */}
                      <div className="space-y-4 pt-4 border-t border-slate-100/90 mt-auto">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                          <span>حجم: <strong className="text-slate-700">{item.fileSize || '۱ MB'}</strong></span>
                          {item.pageCount && (
                            <span>تعداد صفحات: <strong className="text-slate-700">{item.pageCount}</strong></span>
                          )}
                          <span className="flex items-center gap-1">
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-slate-700 font-mono">{item.downloadCount || 0}</strong> دریافت
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedModalForm(item)}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-200/80 shadow-2xs hover:border-slate-300"
                          >
                            <Info className="w-4 h-4 text-slate-400" />
                            {isPamphlet ? 'سرفصل‌ها و جزییات' : 'راهنما و مدارک'}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDownload(item, e)}
                            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all ${
                              isSuccess
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                : isPinnedPamphlet
                                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/25 hover:shadow-lg ring-1 ring-amber-300/40'
                                  : isPamphlet
                                    ? `${highlight?.buttonClass || 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 hover:shadow-lg'}`
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-lg'
                            }`}
                          >
                            {isSuccess ? (
                              <>
                                <Check className="w-4 h-4" />
                                دریافت شد
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>دانلود مستقیم</span>
                                {isPinnedPamphlet && <Sparkles className="w-3 h-3 text-amber-100 mr-0.5" />}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Sidebar & Helpful Guidelines */}
          <div className="lg:col-span-4 space-y-6">
            <DynamicSidebar 
              widgets={settings.formsWidgets || []} 
              dynamicData={{
                higherEdSystems: settings.higherEdSystems || []
              }}
            />
          </div>

        </div>

      </motion.div>

      {/* DETAIL & INSTRUCTIONS MODAL */}
      <AnimatePresence>
        {selectedModalForm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                    selectedModalForm.itemType === 'pamphlet' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedModalForm.itemType === 'pamphlet' ? <BookOpen className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black bg-white px-2 py-0.5 rounded border border-slate-200">
                        {selectedModalForm.code}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {selectedModalForm.category}
                      </span>
                      {selectedModalForm.isPinned && selectedModalForm.itemType === 'pamphlet' && (
                        <FeaturedPamphletBadge isPinned={true} />
                      )}
                    </div>
                    <h2 className="text-lg font-black text-slate-900 mt-1">
                      {selectedModalForm.title}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedModalForm(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Pamphlet Details */}
                {selectedModalForm.itemType === 'pamphlet' && (() => {
                  const modalHighlight = getPamphletHighlight(selectedModalForm.frameColor, selectedModalForm.fieldOfStudy);
                  return (
                    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 p-4.5 ${modalHighlight.badgeBg} rounded-2xl border ${modalHighlight.badgeBorder} text-xs`}>
                      {selectedModalForm.professorName && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">استاد / مدرس:</span>
                          <strong className={`font-bold ${modalHighlight.teacherText}`}>{selectedModalForm.professorName}</strong>
                        </div>
                      )}
                      {selectedModalForm.fieldOfStudy && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">رشته تحصیلی:</span>
                          <strong className="text-slate-800 font-bold">{selectedModalForm.fieldOfStudy}</strong>
                        </div>
                      )}
                      {selectedModalForm.degreeLevel && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">مقطع:</span>
                          <strong className="text-slate-800 font-bold">{selectedModalForm.degreeLevel}</strong>
                        </div>
                      )}
                      {selectedModalForm.academicTerm && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">نیمسال:</span>
                          <strong className="text-slate-800 font-bold">{selectedModalForm.academicTerm}</strong>
                        </div>
                      )}
                      {selectedModalForm.pageCount && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">تعداد صفحات:</span>
                          <strong className="text-slate-800 font-bold">{selectedModalForm.pageCount}</strong>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 block text-[10px]">فرمت فایل:</span>
                        <strong className="text-slate-800 font-bold">{selectedModalForm.fileFormat} ({selectedModalForm.fileSize})</strong>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <h4 className="text-xs font-black text-slate-800 mb-2">توضیحات و اهداف:</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-light bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {selectedModalForm.description}
                  </p>
                </div>

                {/* Instructions / Steps */}
                {selectedModalForm.instructions && selectedModalForm.instructions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-slate-800 mb-2">
                      {selectedModalForm.itemType === 'pamphlet' ? 'سرفصل‌ها و مباحث کلیدی:' : 'دستورالعمل و مراحل تکمیل:'}
                    </h4>
                    <div className="space-y-2">
                      {selectedModalForm.instructions.map((inst, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{inst}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Documents (for forms) */}
                {selectedModalForm.requiredAttachments && selectedModalForm.requiredAttachments.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-slate-800 mb-2">مدارک و پیوست‌های مورد نیاز:</h4>
                    <div className="space-y-2">
                      {selectedModalForm.requiredAttachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{att}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button
                  onClick={() => setSelectedModalForm(null)}
                  className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  بستن
                </button>

                <button
                  onClick={() => handleDownload(selectedModalForm)}
                  className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  دانلود مستقیم فایل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
