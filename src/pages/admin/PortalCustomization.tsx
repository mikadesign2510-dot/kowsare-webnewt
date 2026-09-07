import React, { useState, useEffect } from 'react';
import { 
  storage, 
  PortalSettings, 
  PortalAnnouncement, 
  PortalFAQ, 
  PortalDepartmentConfig,
  defaultPortalSettings 
} from '../../lib/storage';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import { 
  Sliders, 
  Save, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Layout, 
  LogIn, 
  Bell, 
  MessageSquare, 
  CreditCard, 
  PhoneCall, 
  HelpCircle,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldAlert,
  Info,
  Check,
  X,
  KeyRound,
  Smartphone,
  Send,
  UserCheck,
  Clock,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export default function PortalCustomization() {
  const [settings, setSettings] = useState<PortalSettings>(defaultPortalSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'login' | 'recovery' | 'announcements' | 'tickets' | 'financial' | 'support' | 'faq'>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [newInstructionText, setNewInstructionText] = useState('');

  // Modals for items
  const [editingAnnouncement, setEditingAnnouncement] = useState<PortalAnnouncement | null>(null);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);

  const [editingFaq, setEditingFaq] = useState<PortalFAQ | null>(null);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

  // Unified Delete / Reset Confirmation state
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    itemName?: string;
    message?: string;
    details?: { label: string; value: string }[];
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
    confirmText?: string;
  } | null>(null);

  useEffect(() => {
    const current = storage.getPortalSettings();
    setSettings(current);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;
    const value = target.value;
    const type = target.type;
    
    setSettings(prev => {
      const next = { ...prev };
      if (type === 'checkbox') {
        (next as any)[name] = (target as HTMLInputElement).checked;
      } else {
        (next as any)[name] = value;
      }
      return next;
    });
  };

  const handleRecoveryPlanChange = (plan: 'sms_otp' | 'support_contact') => {
    setSettings(prev => ({
      ...prev,
      passwordRecovery: {
        ...prev.passwordRecovery,
        activePlan: plan
      }
    }));
  };

  const handleRecoveryFieldChange = (field: string, value: any) => {
    setSettings(prev => {
      const next = { ...prev };
      next.passwordRecovery = { ...next.passwordRecovery, [field]: value };
      return next;
    });
  };

  const handleAddInstruction = () => {
    if (!newInstructionText.trim()) return;
    setSettings(prev => ({
      ...prev,
      passwordRecovery: {
        ...prev.passwordRecovery,
        supportInstructions: [
          ...(prev.passwordRecovery?.supportInstructions || []),
          newInstructionText.trim()
        ]
      }
    }));
    setNewInstructionText('');
  };

  const handleRemoveInstruction = (index: number) => {
    const itemText = settings.passwordRecovery?.supportInstructions?.[index];
    setDeleteConfirmState({
      isOpen: true,
      title: 'حذف مرحله راهنمای پشتیبانی',
      itemName: itemText ? `مرحله ${index + 1}: ${itemText}` : `مرحله ${index + 1}`,
      onConfirm: () => {
        setSettings(prev => ({
          ...prev,
          passwordRecovery: {
            ...prev.passwordRecovery,
            supportInstructions: (prev.passwordRecovery?.supportInstructions || []).filter((_, i) => i !== index)
          }
        }));
        setDeleteConfirmState(null);
      }
    });
  };

  const handleEditInstruction = (index: number, val: string) => {
    setSettings(prev => ({
      ...prev,
      passwordRecovery: {
        ...prev.passwordRecovery,
        supportInstructions: (prev.passwordRecovery?.supportInstructions || []).map((item, i) => i === index ? val : item)
      }
    }));
  };

  const handleSave = () => {
    storage.updatePortalSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    setDeleteConfirmState({
      isOpen: true,
      title: 'بازنشانی تنظیمات میز خدمت به حالت اولیه',
      message: 'آیا از بازنشانی کلیه تنظیمات، اطلاعیه‌ها، راهنماها و شماره حساب‌های میز خدمت به مقادیر پیش‌فرض اطمینان دارید؟',
      variant: 'warning',
      confirmText: 'بله، بازنشانی شود',
      onConfirm: () => {
        const resetVal = storage.resetPortalSettings();
        setSettings(resetVal);
        setDeleteConfirmState(null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    });
  };

  // --- Announcements Actions ---
  const handleOpenNewAnn = () => {
    setEditingAnnouncement({
      id: `ann-${Date.now()}`,
      title: '',
      content: '',
      type: 'info',
      isActive: true,
      order: settings.announcements.length + 1
    });
    setIsAnnModalOpen(true);
  };

  const handleSaveAnnouncement = (ann: PortalAnnouncement) => {
    if (!ann.title.trim()) return;
    const exists = settings.announcements.some(a => a.id === ann.id);
    let updated: PortalAnnouncement[];
    if (exists) {
      updated = settings.announcements.map(a => a.id === ann.id ? ann : a);
    } else {
      updated = [...settings.announcements, ann];
    }
    setSettings(prev => ({ ...prev, announcements: updated }));
    setIsAnnModalOpen(false);
    setEditingAnnouncement(null);
  };

  const handleDeleteAnnouncement = (id: string) => {
    const targetAnn = settings.announcements.find(a => a.id === id);
    setDeleteConfirmState({
      isOpen: true,
      title: 'حذف اطلاعیه پرتال دانشجویی',
      itemName: targetAnn?.title,
      details: targetAnn ? [
        { label: 'نوع پیام', value: targetAnn.type },
        { label: 'وضعیت نمایش', value: targetAnn.isActive ? 'فعال' : 'غیرفعال' }
      ] : undefined,
      onConfirm: () => {
        const updated = settings.announcements.filter(a => a.id !== id);
        setSettings(prev => ({ ...prev, announcements: updated }));
        setDeleteConfirmState(null);
      }
    });
  };

  const handleMoveAnnouncementUp = (index: number) => {
    if (index === 0) return;
    const updated = [...settings.announcements];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setSettings(prev => ({ ...prev, announcements: updated }));
  };

  const handleMoveAnnouncementDown = (index: number) => {
    if (index === settings.announcements.length - 1) return;
    const updated = [...settings.announcements];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setSettings(prev => ({ ...prev, announcements: updated }));
  };

  const handleToggleAnnStatus = (id: string) => {
    const updated = settings.announcements.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a);
    setSettings(prev => ({ ...prev, announcements: updated }));
  };

  // --- Department Toggle & Edit ---
  const handleDepartmentChange = (id: string, field: 'name' | 'description' | 'isActive', value: any) => {
    const updated = settings.departments.map(d => {
      if (d.id === id) {
        return { ...d, [field]: value };
      }
      return d;
    });
    setSettings(prev => ({ ...prev, departments: updated }));
  };

  // --- FAQs Actions ---
  const handleOpenNewFaq = () => {
    setEditingFaq({
      id: `faq-${Date.now()}`,
      question: '',
      answer: '',
      category: 'عمومی',
      order: settings.faqs.length + 1,
      isActive: true
    });
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = (faq: PortalFAQ) => {
    if (!faq.question.trim() || !faq.answer.trim()) return;
    const exists = settings.faqs.some(f => f.id === faq.id);
    let updated: PortalFAQ[];
    if (exists) {
      updated = settings.faqs.map(f => f.id === faq.id ? faq : f);
    } else {
      updated = [...settings.faqs, faq];
    }
    setSettings(prev => ({ ...prev, faqs: updated }));
    setIsFaqModalOpen(false);
    setEditingFaq(null);
  };

  const handleDeleteFaq = (id: string) => {
    const targetFaq = settings.faqs.find(f => f.id === id);
    setDeleteConfirmState({
      isOpen: true,
      title: 'حذف پرسش و پاسخ متداول',
      itemName: targetFaq?.question,
      details: targetFaq ? [
        { label: 'دسته‌بندی', value: targetFaq.category }
      ] : undefined,
      onConfirm: () => {
        const updated = settings.faqs.filter(f => f.id !== id);
        setSettings(prev => ({ ...prev, faqs: updated }));
        setDeleteConfirmState(null);
      }
    });
  };

  const handleToggleFaqStatus = (id: string) => {
    const updated = settings.faqs.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f);
    setSettings(prev => ({ ...prev, faqs: updated }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2.5">
              شخصی‌سازی و مدیریت میز خدمت
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              تنظیمات جامع، ویرایش کلیه متون، اطلاعیه‌ها، راهنماها و اطلاعات پورتال دانشجویان
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.open('/portal', '_blank')}
            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Eye className="w-4 h-4" />
            مشاهده پرتال دانشجو
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            بازنشانی پیش‌فرض
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            ذخیره کلیه تنظیمات
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-2xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">
            تنظیمات میز خدمت با موفقیت ذخیره شد و در تمامی بخش‌های پرتال دانشجویان اعمال گردید.
          </span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max p-1">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'general'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layout className="w-4 h-4" />
            عمومی و سربرگ میز خدمت
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'login'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LogIn className="w-4 h-4" />
            صفحه ورود دانشجویان
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recovery')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'recovery'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            پلن‌های بازیابی رمز عبور
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              settings.passwordRecovery?.activePlan === 'sms_otp' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-indigo-100 text-indigo-800'
            }`}>
              {settings.passwordRecovery?.activePlan === 'sms_otp' ? 'سامانه پیامکی' : 'تماس با کارشناس'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'announcements'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            اطلاعیه‌ها و هشدارهای پرتال
            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {settings.announcements.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'tickets'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            تیکت‌ها و دپارتمان‌ها
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'financial'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            امور مالی و شماره حساب‌ها
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'support'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            میز پشتیبانی و تماس
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all ${
              activeTab === 'faq'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            سوالات متداول (FAQ)
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {settings.faqs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        
        {/* TAB 1: General & Header */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">مشخصات عمومی و هویت میز خدمت</h3>
                <p className="text-xs text-slate-500 mt-0.5">عناوین اصلی، پیام خوش‌آمدگویی و دسترسی سراسری</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">عنوان اصلی میز خدمت</label>
                <input
                  type="text"
                  name="portalTitle"
                  value={settings.portalTitle}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="میز خدمت الکترونیک دانشجویان"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">زیرعنوان / مرکز آموزشی</label>
                <input
                  type="text"
                  name="portalSubtitle"
                  value={settings.portalSubtitle}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="مرکز آموزش علمی کاربردی کوثر کاکی"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">پیام خوش‌آمدگویی و معرفی بالای داشبورد</label>
                <input
                  type="text"
                  name="welcomeMessage"
                  value={settings.welcomeMessage}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="به سامانه یکپارچه خدمات آموزشی مرکز آموزش عالی کوثر کاکی خوش آمدید."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">نوار اطلاعیه فوری و سراسری بالای صفحات پرتال (اختیاری)</label>
                <input
                  type="text"
                  name="portalNotice"
                  value={settings.portalNotice || ''}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="مثال: دسترسی کامل به تمامی بخش‌های آموزشی و رسیدهای مالی برقرار است."
                />
              </div>
            </div>

            {/* Portal Availability & Maintenance */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3.5">
                  <div className={`w-4 h-4 rounded-full shrink-0 ${settings.isPortalEnabled ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse' : 'bg-rose-500 shadow-md shadow-rose-500/50'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs md:text-sm font-black text-slate-800">وضعیت دسترسی عمومی به میز خدمت</p>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        settings.isPortalEnabled 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {settings.isPortalEnabled ? 'فعال (دسترسی آزاد دانشجویان)' : 'غیرفعال (حالت تعمیرات و تعلیق)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">
                      {settings.isPortalEnabled 
                        ? 'میز خدمت برای کلیه دانشجویان و اساتید با نشانی portal/ فعال و قابل استفاده است.' 
                        : 'میز خدمت موقتاً مسدود است و دانشجویان در صفحه اصلی با پیام حالت تعمیرات مواجه می‌شوند.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, isPortalEnabled: !prev.isPortalEnabled }))}
                    className={`relative flex items-center justify-between gap-3 px-4 py-2 rounded-2xl font-black text-xs transition-all shadow-sm border ${
                      settings.isPortalEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/20'
                        : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-rose-600/20'
                    }`}
                  >
                    <span>{settings.isPortalEnabled ? 'تغییر به حالت تعلیق' : 'فعال‌سازی دسترسی'}</span>
                    <div className={`w-5 h-5 rounded-full bg-white flex items-center justify-center transition-transform ${settings.isPortalEnabled ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {settings.isPortalEnabled ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                </div>
              </div>

              {!settings.isPortalEnabled && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl animate-in fade-in">
                  <label className="block text-xs font-bold text-rose-900 mb-2">متن پیام حالت تعمیرات و عدم دسترسی</label>
                  <textarea
                    name="maintenanceMessage"
                    rows={3}
                    value={settings.maintenanceMessage || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-rose-300 rounded-xl p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    placeholder="میز خدمت دانشجویان موقتاً جهت بروزرسانی تا اطلاع ثانوی در دسترس نمی‌باشد."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Login Page Customization */}
        {activeTab === 'login' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">شخصی‌سازی صفحه ورود دانشجویان (/portal/login)</h3>
                <p className="text-xs text-slate-500 mt-0.5">تنظیم عناوین، راهنمای رمز عبور و پیام‌های کارت لاگین</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">عنوان کارت لاگین</label>
                <input
                  type="text"
                  name="loginTitle"
                  value={settings.loginTitle}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="میز خدمت الکترونیک"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">زیرعنوان صفحه ورود</label>
                <input
                  type="text"
                  name="loginSubtitle"
                  value={settings.loginSubtitle}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="پورتال دانشجویان و اساتید مرکز کوثر کاکی"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">متن راهنمای نام کاربری و رمز عبور پیش‌فرض</label>
                <input
                  type="text"
                  name="loginHelperText"
                  value={settings.loginHelperText}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="نام کاربری شماره دانشجویی یا کد ملی و رمز عبور پیش‌فرض کد ملی شما می‌باشد."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">هشدار یا اطلاعیه فوری بالای فرم لاگین (اختیاری)</label>
                <input
                  type="text"
                  name="loginAlertBanner"
                  value={settings.loginAlertBanner || ''}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="مثال: دانشجویان ورودی جدید جهت دریافت رمز اولیه با شماره ۳۵۳۲۰۰۰۰-۰۷۷ تماس بگیرند."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">متن راهنمای فراموشی رمز عبور و پشتیبانی</label>
                <textarea
                  name="forgotPasswordHelp"
                  rows={3}
                  value={settings.forgotPasswordHelp}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="در صورت فراموشی کلمه عبور، با اداره آموزش مرکز آموزش عالی کوثر کاکی تماس حاصل فرمایید."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: Password Recovery Plans & Customization */}
        {activeTab === 'recovery' && (
          <div className="space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  مدیریت و فعال‌سازی پلن‌های بازیابی رمز عبور
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  می‌توانید بین احراز هویت پیامکی (ارسال خودکار کد OTP) یا باکس راهنمای تماس مستقیم با کارشناس فنی سوئیچ کنید و تمام متن‌ها و تنظیمات را شخصی‌سازی نمایید.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 self-start">
                <span className="text-xs font-bold text-slate-600">پلن فعال فعلی:</span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                  settings.passwordRecovery?.activePlan === 'sms_otp'
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                }`}>
                  {settings.passwordRecovery?.activePlan === 'sms_otp' ? '۱. احراز هویت پیامکی' : '۲. تماس با کارشناس فنی'}
                </span>
              </div>
            </div>

            {/* Section 1: Plan Selector Cards */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-slate-800">
                انتخاب روش فعال بازیابی رمز عبور در پرتال:
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plan 1 Card */}
                <div 
                  onClick={() => handleRecoveryPlanChange('sms_otp')}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    settings.passwordRecovery?.activePlan === 'sms_otp'
                      ? 'border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/5'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          settings.passwordRecovery?.activePlan === 'sms_otp'
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-slate-900">پلن ۱: احراز هویت پیامکی (SMS OTP)</h4>
                          <span className="text-[10px] font-bold text-emerald-700">ارسال خودکار کد تایید پیامکی و تغییر رمز عبور</span>
                        </div>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        settings.passwordRecovery?.activePlan === 'sms_otp'
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300'
                      }`}>
                        {settings.passwordRecovery?.activePlan === 'sms_otp' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      دانشجو با وارد کردن کد ملی و شماره همراه، پیامک حاوی کد تایید دریافت می‌کند و پس از تایید هویت، رمز عبور دلخواه جدید خود را تعیین می‌کند.
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">
                        ⚡ کاملاً خودکار و آنی
                      </span>
                      <span className="text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">
                        🔒 تایمر اعتبار و امنیت بالا
                      </span>
                      <span className="text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">
                        📱 شبیه‌ساز هوشمند پیامک
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">وضعیت این پلن:</span>
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl ${
                      settings.passwordRecovery?.activePlan === 'sms_otp'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {settings.passwordRecovery?.activePlan === 'sms_otp' ? 'فعال و عملیاتی' : 'غیرفعال (جهت فعالسازی کلیک کنید)'}
                    </span>
                  </div>
                </div>

                {/* Plan 2 Card */}
                <div 
                  onClick={() => handleRecoveryPlanChange('support_contact')}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    settings.passwordRecovery?.activePlan === 'support_contact'
                      ? 'border-indigo-500 bg-indigo-50/40 ring-4 ring-indigo-500/10 shadow-lg shadow-indigo-500/5'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          settings.passwordRecovery?.activePlan === 'support_contact'
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-slate-900">پلن ۲: باکس راهنما و تماس با کارشناس فنی</h4>
                          <span className="text-[10px] font-bold text-indigo-700">هماهنگی تلفنی و پیام‌رسانی با پشتیبانی مرکز</span>
                        </div>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        settings.passwordRecovery?.activePlan === 'support_contact'
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-slate-300'
                      }`}>
                        {settings.passwordRecovery?.activePlan === 'support_contact' && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      با زدن روی فراموشی رمز، یک باکس راهنمای شکیل شامل نام کارشناس، شماره تماس داخلی، شماره موبایل، کانال ایتا و مراحل احراز هویت نمایش داده می‌شود.
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">
                        📞 شماره تماس مستقیم و داخلی
                      </span>
                      <span className="text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">
                        💬 کانال پیام‌رسان کارشناس
                      </span>
                      <span className="text-[10px] font-bold bg-white/80 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">
                        📋 راهنمای گام‌به‌گام
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">وضعیت این پلن:</span>
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl ${
                      settings.passwordRecovery?.activePlan === 'support_contact'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {settings.passwordRecovery?.activePlan === 'support_contact' ? 'فعال و عملیاتی' : 'غیرفعال (جهت فعالسازی کلیک کنید)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Plan 1 (SMS OTP) Customization Form */}
            <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200/80 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                    ۱
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800">تنظیمات و شخصی‌سازی پلن ۱ (سامانه پیامکی و OTP)</h4>
                    <p className="text-[11px] text-slate-500">پیکربندی الگو، زمان اعتبار و فیلدهای ارسال پیامک</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">
                  {settings.passwordRecovery?.activePlan === 'sms_otp' ? '● پلن در حال استفاده' : 'تنظیمات آماده'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">تعداد ارقام کد تایید پیامک</label>
                  <select
                    value={settings.passwordRecovery?.smsOtpCodeLength || 5}
                    onChange={e => handleRecoveryFieldChange('smsOtpCodeLength', parseInt(e.target.value, 10))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value={4}>۴ رقمی (ساده)</option>
                    <option value={5}>۵ رقمی (استاندارد کوثر کاکی)</option>
                    <option value={6}>۶ رقمی (حداکثر امنیت)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">مدت اعتبار کد تایید پیامک (ثانیه)</label>
                  <input
                    type="number"
                    min={30}
                    max={600}
                    value={settings.passwordRecovery?.smsOtpExpirySeconds || 120}
                    onChange={e => handleRecoveryFieldChange('smsOtpExpirySeconds', parseInt(e.target.value, 10) || 120)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="120"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">معادل ۲ دقیقه (تایمر معکوس برای ارسال مجدد)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">حداقل طول رمز عبور جدید</label>
                  <input
                    type="number"
                    min={4}
                    max={20}
                    value={settings.passwordRecovery?.smsMinPasswordLength || 6}
                    onChange={e => handleRecoveryFieldChange('smsMinPasswordLength', parseInt(e.target.value, 10) || 6)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="6"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">تعداد کاراکترهای مجاز برای رمز عبور انتخابی</span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان فرستنده پیامک (نام مرکز / سامانه)</label>
                  <input
                    type="text"
                    value={settings.passwordRecovery?.smsSenderName || ''}
                    onChange={e => handleRecoveryFieldChange('smsSenderName', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="مرکز آموزش علمی کاربردی کوثر کاکی"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="require-mobile-check"
                    checked={settings.passwordRecovery?.smsRequireMobileMatch ?? true}
                    onChange={e => handleRecoveryFieldChange('smsRequireMobileMatch', e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="require-mobile-check" className="font-bold text-xs text-slate-700 cursor-pointer">
                    الزام تطابق شماره همراه وارد شده با شماره ثبت‌شده در پرونده دانشجو
                  </label>
                </div>

                <div className="md:col-span-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">الگوی متن پیامک ارسالی</label>
                    <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                      از تگ <span dir="ltr" className="inline-block font-mono bg-emerald-200/50 px-1 rounded mx-1">{"{code}"}</span> برای جایگذاری کد تایید استفاده کنید
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={settings.passwordRecovery?.smsPatternTemplate || ''}
                    onChange={e => handleRecoveryFieldChange('smsPatternTemplate', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="کد تایید بازیابی رمز عبور میز خدمت مرکز کوثر کاکی: {code}"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Plan 2 (Support Expert Box) Customization Form */}
            <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200/80 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-xs">
                    ۲
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800">تنظیمات و شخصی‌سازی پلن ۲ (باکس راهنما و تماس با کارشناس فنی)</h4>
                    <p className="text-[11px] text-slate-500">اطلاعات تماس، شماره داخلی، ساعات کاری و مراحل احراز هویت کارشناس</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-3 py-1 rounded-xl">
                  {settings.passwordRecovery?.activePlan === 'support_contact' ? '● پلن در حال استفاده' : 'تنظیمات آماده'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان باکس راهنما در صفحه ورود</label>
                  <input
                    type="text"
                    value={settings.passwordRecovery?.supportBoxTitle || ''}
                    onChange={e => handleRecoveryFieldChange('supportBoxTitle', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="بازیابی رمز عبور از طریق کارشناس فنی"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نام و سمت کارشناس فنی / پشتیبانی</label>
                  <input
                    type="text"
                    value={settings.passwordRecovery?.supportExpertName || ''}
                    onChange={e => handleRecoveryFieldChange('supportExpertName', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="مهندس زارعی (کارشناس فناوری اطلاعات و سامانه‌های آموزشی)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">متن توضیحات اولیه و پیام امنیتی</label>
                  <textarea
                    rows={2}
                    value={settings.passwordRecovery?.supportBoxDescription || ''}
                    onChange={e => handleRecoveryFieldChange('supportBoxDescription', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="دانشجوی گرامی، جهت ارتقای امنیت و حفظ محرمانگی پرونده تحصیلی، تغییر و بازیابی رمز عبور توسط کارشناس پشتیبانی فنی و اداره آموزش مرکز انجام می‌پذیرد."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">شماره تلفن ثابت و داخلی</label>
                  <input
                    type="text"
                    value={settings.passwordRecovery?.supportExpertPhone || ''}
                    onChange={e => handleRecoveryFieldChange('supportExpertPhone', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left"
                    dir="ltr"
                    placeholder="077-35320000 (داخلی ۱۰۴)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">شماره تلفن همراه یا خط پیام‌رسان</label>
                  <input
                    type="text"
                    value={settings.passwordRecovery?.supportExpertMobile || ''}
                    onChange={e => handleRecoveryFieldChange('supportExpertMobile', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left"
                    dir="ltr"
                    placeholder="09171700000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ساعات کاری و پاسخگویی</label>
                  <input
                    type="text"
                    value={settings.passwordRecovery?.supportExpertHours || ''}
                    onChange={e => handleRecoveryFieldChange('supportExpertHours', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="شنبه تا چهارشنبه از ساعت ۰۸:۰۰ الی ۱۴:۰۰"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">شناسه پیام‌رسان (ایتا / تلگرام / بله)</label>
                  <input
                    type="text"
                    value={settings.passwordRecovery?.supportMessengerChannel || ''}
                    onChange={e => handleRecoveryFieldChange('supportMessengerChannel', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left"
                    dir="ltr"
                    placeholder="kowsar_it_support"
                  />
                </div>

                {/* Instructions Manager */}
                <div className="md:col-span-2 space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-800">
                    مراحل و دستورالعمل‌های نمایش داده شده برای دانشجو:
                  </label>

                  <div className="space-y-2">
                    {(settings.passwordRecovery?.supportInstructions || []).map((instruction, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={instruction}
                          onChange={e => handleEditInstruction(idx, e.target.value)}
                          className="flex-1 bg-transparent border-0 text-xs font-medium text-slate-800 focus:ring-0 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveInstruction(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                          title="حذف این مرحله"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newInstructionText}
                      onChange={e => setNewInstructionText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddInstruction())}
                      placeholder="متن مرحله یا دستورالعمل جدید را وارد کنید..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddInstruction}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      افزودن مرحله
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Interactive Live Preview Mockup */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="font-black text-sm text-slate-800">پیش‌نمایش زنده دیالوگ بازیابی دانشجو (مطابق با پلن انتخابی)</h4>
              </div>

              <div className="bg-slate-100/80 rounded-3xl p-6 md:p-8 flex justify-center border border-slate-200">
                {settings.passwordRecovery?.activePlan === 'sms_otp' ? (
                  /* Live Preview Plan 1: SMS OTP */
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 text-emerald-600">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-black text-slate-800 text-sm">بازیابی رمز عبور پیامکی</h5>
                          <p className="text-[11px] text-slate-400 font-medium">احراز هویت پیامکی و تعیین رمز عبور دلخواه</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        مرحله ۱ از ۳
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">کد ملی دانشجو *</label>
                        <input
                          type="text"
                          disabled
                          placeholder="مثال: ۱۲۳۴۵۶۷۸۹۰"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 text-left"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">شماره تلفن همراه دانشجو *</label>
                        <input
                          type="text"
                          disabled
                          placeholder="0917..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 text-left"
                          dir="ltr"
                        />
                      </div>

                      <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 text-emerald-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                          <span>قالب پیامک ارسالی به دانشجو:</span>
                        </div>
                        <p className="text-[11px] font-medium leading-relaxed bg-white/70 p-2 rounded-xl border border-emerald-200/50">
                          {settings.passwordRecovery?.smsPatternTemplate?.replace('{code}', '۵۴۸۹۲') || 'کد تایید: ۵۴۸۹۲'}
                        </p>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          disabled
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 shadow-md shadow-emerald-500/20"
                        >
                          <Send className="w-3.5 h-3.5" />
                          ارسال کد تایید پیامکی ({settings.passwordRecovery?.smsOtpCodeLength || 5} رقم)
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Live Preview Plan 2: Support Contact Box */
                  <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 text-indigo-600">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-black text-slate-800 text-sm">
                            {settings.passwordRecovery?.supportBoxTitle || 'بازیابی رمز عبور از طریق کارشناس فنی'}
                          </h5>
                          <p className="text-[11px] text-slate-400 font-medium">پشتیبانی و راهنمایی مرکز آموزش کوثر کاکی</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                        تماس مستقیم
                      </span>
                    </div>

                    <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 text-xs text-indigo-950 space-y-1">
                      <p className="text-[11px] leading-relaxed">
                        {settings.passwordRecovery?.supportBoxDescription}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">کارشناس مسئول:</span>
                        <span className="font-black text-slate-800 text-xs">{settings.passwordRecovery?.supportExpertName}</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">شماره تماس مستقیم:</span>
                        <span className="font-black text-blue-700 text-xs" dir="ltr">{settings.passwordRecovery?.supportExpertPhone}</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">شماره همراه کارشناس:</span>
                        <span className="font-black text-indigo-700 text-xs" dir="ltr">{settings.passwordRecovery?.supportExpertMobile}</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">ساعات پاسخگویی:</span>
                        <span className="font-bold text-slate-700 text-xs">{settings.passwordRecovery?.supportExpertHours}</span>
                      </div>
                    </div>

                    {settings.passwordRecovery?.supportInstructions && settings.passwordRecovery.supportInstructions.length > 0 && (
                      <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100 space-y-2">
                        <span className="text-[11px] font-black text-amber-900 block">مراحل و دستورالعمل بازیابی:</span>
                        <ul className="space-y-1.5 text-[11px] text-amber-800 font-medium">
                          {settings.passwordRecovery.supportInstructions.map((ins, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span>{ins}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Announcements */}
        {activeTab === 'announcements' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">اطلاعیه‌ها و هشدارهای فعال در داشبورد دانشجو</h3>
                <p className="text-xs text-slate-500 mt-0.5">مدیریت پیام‌ها، هشدارهای مالی و اطلاعیه‌های دسترسی</p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewAnn}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all self-start"
              >
                <Plus className="w-4 h-4" />
                افزودن اطلاعیه جدید
              </button>
            </div>

            <div className="space-y-3">
              {settings.announcements.map((ann, idx) => {
                const typeColors = {
                  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
                  info: 'bg-blue-50 border-blue-200 text-blue-900',
                  warning: 'bg-amber-50 border-amber-200 text-amber-900',
                  danger: 'bg-rose-50 border-rose-200 text-rose-900',
                };
                return (
                  <div 
                    key={ann.id} 
                    className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${typeColors[ann.type] || 'bg-slate-50 border-slate-200 text-slate-900'} ${!ann.isActive ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-6 h-6 rounded-full bg-white/70 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-sm">{ann.title}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border">
                            {ann.type === 'success' ? 'موفقیت / سبز' : ann.type === 'warning' ? 'هشدار / زرد' : ann.type === 'danger' ? 'فوری / قرمز' : 'اطلاع‌رسانی / آبی'}
                          </span>
                          {!ann.isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              غیرفعال
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">{ann.content}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <div className="flex items-center gap-1 border-l border-slate-300/40 pl-2 ml-1">
                        <button
                          type="button"
                          onClick={() => handleMoveAnnouncementUp(idx)}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          title="انتقال به بالا"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveAnnouncementDown(idx)}
                          disabled={idx === settings.announcements.length - 1}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          title="انتقال به پایین"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleAnnStatus(ann.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition-colors ${ann.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                        title={ann.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAnnouncement(ann);
                          setIsAnnModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-white text-slate-700 hover:bg-slate-100 border text-xs font-bold transition-colors"
                        title="ویرایش"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Tickets & Departments */}
        {activeTab === 'tickets' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">راهنماها و دپارتمان‌های تیکت (/portal/tickets)</h3>
                <p className="text-xs text-slate-500 mt-0.5">تنظیم شرایط، ضوابط، ساعات پاسخگویی و فعال‌سازی واحدهای مربوطه</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">عنوان باکس راهنمای تیکت</label>
                <input
                  type="text"
                  name="ticketGuidelinesTitle"
                  value={settings.ticketGuidelinesTitle}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="ضوابط و راهنمای ثبت درخواست و تیکت آموزشی"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">ساعات پاسخگویی کارشناسان</label>
                <input
                  type="text"
                  name="ticketWorkingHours"
                  value={settings.ticketWorkingHours}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="شنبه تا چهارشنبه از ساعت ۰۸:۰۰ الی ۱۴:۰۰"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">متن کامل راهنما و شرایط ثبت درخواست</label>
                <textarea
                  name="ticketGuidelines"
                  rows={3}
                  value={settings.ticketGuidelines}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="دانشجوی گرامی، درخواست‌های شما مستقیماً توسط کارشناسان مربوطه بررسی می‌شود..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">پیام پس از ثبت موفق تیکت</label>
                <input
                  type="text"
                  name="ticketSuccessMessage"
                  value={settings.ticketSuccessMessage}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="درخواست شما با موفقیت ثبت شد و به کارشناس مربوطه ارجاع گردید."
                />
              </div>
            </div>

            {/* Departments Configuration */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h4 className="font-bold text-sm text-slate-800">دپارتمان‌ها و واحدهای دریافت‌کننده تیکت</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.departments.map(dep => (
                  <div key={dep.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={dep.name}
                        onChange={e => handleDepartmentChange(dep.id, 'name', e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 w-2/3"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dep.isActive}
                          onChange={e => handleDepartmentChange(dep.id, 'isActive', e.target.checked)}
                          className="rounded text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-700">{dep.isActive ? 'فعال' : 'غیرفعال'}</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={dep.description}
                      onChange={e => handleDepartmentChange(dep.id, 'description', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600"
                      placeholder="توضیحات دپارتمان"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Financial & Banking */}
        {activeTab === 'financial' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">اطلاعات مالی، شماره حساب‌ها و بارگذاری رسید (/portal/financial)</h3>
                <p className="text-xs text-slate-500 mt-0.5">تعیین شماره حساب، شبا، کارت و ضوابط تایید واریزی‌ها</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">عنوان بخش راهنمای پرداخت</label>
                <input
                  type="text"
                  name="financialNoticeTitle"
                  value={settings.financialNoticeTitle}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="راهنما و مقررات واریز شهریه"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">مهلت بررسی و تایید رسیدها</label>
                <input
                  type="text"
                  name="receiptReviewDays"
                  value={settings.receiptReviewDays}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="حداکثر ۲۴ الی ۴۸ ساعت اداری"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">متن کامل راهنمای واریز شهریه و بارگذاری فیش</label>
                <textarea
                  name="financialNoticeText"
                  rows={3}
                  value={settings.financialNoticeText}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="واریز شهریه صرفاً از طریق شماره حساب‌های رسمی مرکز..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">نام صاحب حساب</label>
                <input
                  type="text"
                  name="bankAccountOwner"
                  value={settings.bankAccountOwner}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="مرکز آموزش عالی علمی کاربردی کوثر کاکی"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">شماره کارت بانکی مرکز</label>
                <input
                  type="text"
                  name="bankCardNumber"
                  value={settings.bankCardNumber}
                  onChange={handleInputChange}
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">شماره حساب بانکی</label>
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={settings.bankAccountNumber}
                  onChange={handleInputChange}
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="۰۱۰۷۶۵۴۳۲۱۰۰۵"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">شماره شبای بانکی (IBAN)</label>
                <input
                  type="text"
                  name="bankShebaNumber"
                  value={settings.bankShebaNumber}
                  onChange={handleInputChange}
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="IR720170000000107654321005"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Support & Contact */}
        {activeTab === 'support' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">راه‌های ارتباطی و میز پشتیبانی دانشجویان</h3>
                <p className="text-xs text-slate-500 mt-0.5">شماره تلفن‌ها، پیام‌رسان‌ها و ساعات پشتیبانی نمایش داده شده در پرتال</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">تلفن مستقیم اداره آموزش</label>
                <input
                  type="text"
                  name="supportPhone"
                  value={settings.supportPhone}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="۰۷۷-۳۵۳۲۰۰۰۰"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">شماره همراه پشتیبانی / واتساپ</label>
                <input
                  type="text"
                  name="supportMobile"
                  value={settings.supportMobile}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="۰۹۱۷۰۰۰۰۰۰۰"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">کانال یا آیدی پیام‌رسان ایتا (Eitaa)</label>
                <input
                  type="text"
                  name="supportEitaa"
                  value={settings.supportEitaa}
                  onChange={handleInputChange}
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="kowsar_kaki_uni"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">کانال یا آیدی تلگرام</label>
                <input
                  type="text"
                  name="supportTelegram"
                  value={settings.supportTelegram}
                  onChange={handleInputChange}
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="kowsar_kaki_uni"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">ساعات پاسخگویی حضوری و تلفنی</label>
                <input
                  type="text"
                  name="supportHours"
                  value={settings.supportHours}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="شنبه تا چهارشنبه: ۰۸:۰۰ لغایت ۱۴:۰۰"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800">سوالات متداول دانشجویان (FAQ)</h3>
                <p className="text-xs text-slate-500 mt-0.5">افزودن و ویرایش پرسش و پاسخ‌های پرتکرار در سامانه</p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewFaq}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all self-start"
              >
                <Plus className="w-4 h-4" />
                افزودن پرسش و پاسخ جدید
              </button>
            </div>

            <div className="space-y-3">
              {settings.faqs.map((faq, idx) => (
                <div 
                  key={faq.id} 
                  className={`p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all ${!faq.isActive ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3 flex-grow">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="space-y-1.5 flex-grow">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-800">{faq.question}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border">
                          {faq.category}
                        </span>
                        {!faq.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                            غیرفعال
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                        {faq.answer}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-start shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleFaqStatus(faq.id)}
                      className={`p-2 rounded-xl text-xs font-bold transition-colors ${faq.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                      title={faq.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaq(faq);
                        setIsFaqModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-white text-slate-700 hover:bg-slate-100 border text-xs font-bold transition-colors"
                      title="ویرایش"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Announcement Create / Edit Modal */}
      {isAnnModalOpen && editingAnnouncement && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-800">
                {editingAnnouncement.id.startsWith('ann-') && !settings.announcements.some(a => a.id === editingAnnouncement.id) ? 'افزودن اطلاعیه جدید' : 'ویرایش اطلاعیه پرتال'}
              </h3>
              <button onClick={() => setIsAnnModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">عنوان اطلاعیه</label>
                <input
                  type="text"
                  value={editingAnnouncement.title}
                  onChange={e => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                  placeholder="مثال: اطلاعیه مهم امور مالی و پرداخت شهریه"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">نوع و رنگ کارت اطلاعیه</label>
                <select
                  value={editingAnnouncement.type}
                  onChange={e => setEditingAnnouncement({ ...editingAnnouncement, type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="info">اطلاع‌رسانی عمومی (آبی)</option>
                  <option value="success">دسترسی و تاییدیه (سبز)</option>
                  <option value="warning">هشدار مهم و مالی (زرد)</option>
                  <option value="danger">فوری و اضطراری (قرمز)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">متن کامل توضیحات</label>
                <textarea
                  rows={4}
                  value={editingAnnouncement.content}
                  onChange={e => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800"
                  placeholder="متن کامل اطلاعیه..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ann-active-check"
                  checked={editingAnnouncement.isActive}
                  onChange={e => setEditingAnnouncement({ ...editingAnnouncement, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="ann-active-check" className="font-bold text-slate-700 cursor-pointer">
                  نمایش به عنوان اطلاعیه فعال در داشبورد
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAnnModalOpen(false)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => handleSaveAnnouncement(editingAnnouncement)}
                className="px-6 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 text-xs shadow-md shadow-blue-500/20"
              >
                ذخیره اطلاعیه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Create / Edit Modal */}
      {isFaqModalOpen && editingFaq && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-800">
                {editingFaq.id.startsWith('faq-') && !settings.faqs.some(f => f.id === editingFaq.id) ? 'افزودن پرسش و پاسخ جدید' : 'ویرایش پرسش و پاسخ'}
              </h3>
              <button onClick={() => setIsFaqModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">عنوان پرسش</label>
                <input
                  type="text"
                  value={editingFaq.question}
                  onChange={e => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                  placeholder="مثال: نحوه دریافت گواهی اشتغال به تحصیل چگونه است؟"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">دسته‌بندی موضوعی</label>
                <input
                  type="text"
                  value={editingFaq.category}
                  onChange={e => setEditingFaq({ ...editingFaq, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800"
                  placeholder="مثال: آموزشی، مالی، نظام وظیفه، فارغ‌التحصیلی"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">پاسخ تشریحی و راهنمایی</label>
                <textarea
                  rows={4}
                  value={editingFaq.answer}
                  onChange={e => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800"
                  placeholder="پاسخ کامل و شفاف..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="faq-active-check"
                  checked={editingFaq.isActive}
                  onChange={e => setEditingFaq({ ...editingFaq, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="faq-active-check" className="font-bold text-slate-700 cursor-pointer">
                  نمایش به عنوان پرسش فعال در پرتال
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(false)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => handleSaveFaq(editingFaq)}
                className="px-6 py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 text-xs shadow-md shadow-blue-500/20"
              >
                ذخیره پرسش و پاسخ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Reset Confirmation Modal */}
      {deleteConfirmState && (
        <DeleteConfirmModal
          isOpen={deleteConfirmState.isOpen}
          onClose={() => setDeleteConfirmState(null)}
          onConfirm={deleteConfirmState.onConfirm}
          title={deleteConfirmState.title}
          itemName={deleteConfirmState.itemName}
          message={deleteConfirmState.message}
          details={deleteConfirmState.details}
          variant={deleteConfirmState.variant}
          confirmText={deleteConfirmState.confirmText}
        />
      )}

    </div>
  );
}
