import React, { useState, useEffect, useRef } from 'react';
import { 
  storage, 
  ContactPageConfig, 
  ContactDepartment, 
  ContactSocialLink, 
  ContactFAQ, 
  ContactMessage 
} from '../../lib/storage';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import { 
  PhoneCall, 
  Mail, 
  MapPin, 
  Clock, 
  Save, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  MessageSquare, 
  Navigation, 
  Building2, 
  Share2, 
  HelpCircle, 
  Sliders, 
  Search, 
  Filter, 
  RotateCcw, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  Send,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Layers,
  GripVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const toPersianDigits = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/[0-9]/g, (w) => farsiDigits[+w]);
};

export default function AdminContactManager() {
  const [config, setConfig] = useState<ContactPageConfig>(storage.getContactConfig());
  const [messages, setMessages] = useState<ContactMessage[]>(storage.getContactMessages());
  const [activeTab, setActiveTab] = useState<'messages' | 'general' | 'location' | 'departments' | 'socials' | 'faqs' | 'layout'>('messages');
  const [isSaved, setIsSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollOffset = direction === 'left' ? -220 : 220;
      tabsContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  // Department modal / editing
  const [editingDept, setEditingDept] = useState<ContactDepartment | null>(null);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);

  // Social link modal / editing
  const [editingSocial, setEditingSocial] = useState<ContactSocialLink | null>(null);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

  // FAQ modal / editing
  const [editingFaq, setEditingFaq] = useState<ContactFAQ | null>(null);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

  // Unified Delete Confirmation State
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
    const handleMessagesChange = () => {
      setMessages(storage.getContactMessages());
    };
    window.addEventListener('kowsar_contact_messages_changed', handleMessagesChange);
    return () => window.removeEventListener('kowsar_contact_messages_changed', handleMessagesChange);
  }, []);

  const handleConfigChange = (field: keyof ContactPageConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    storage.updateContactConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetToDefaults = () => {
    setDeleteConfirmState({
      isOpen: true,
      title: 'بازنشانی صفحه تماس با ما',
      message: 'آیا از بازنشانی کلیه تنظیمات و محتوای صفحه تماس با ما به حالت پیش‌فرض اطمینان دارید؟',
      variant: 'warning',
      confirmText: 'بله، بازنشانی شود',
      onConfirm: () => {
        const reset = storage.resetContactConfig();
        setConfig(reset);
        setIsSaved(true);
        setDeleteConfirmState(null);
        setTimeout(() => setIsSaved(false), 3000);
      }
    });
  };

  // --- Message Actions ---
  const handleOpenMessage = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setReplyText(msg.adminReply || '');
    if (msg.status === 'unread') {
      storage.updateContactMessage(msg.id, { status: 'read' });
      setMessages(storage.getContactMessages());
    }
  };

  const handleUpdateMessageStatus = (id: string, status: ContactMessage['status']) => {
    storage.updateContactMessage(id, { status });
    setMessages(storage.getContactMessages());
    if (selectedMessage && selectedMessage.id === id) {
      setSelectedMessage(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleSaveReply = () => {
    if (!selectedMessage) return;
    const now = new Date().toISOString();
    storage.updateContactMessage(selectedMessage.id, {
      adminReply: replyText,
      repliedAt: now,
      repliedBy: 'مدیریت سامانه',
      status: 'replied'
    });
    setMessages(storage.getContactMessages());
    setSelectedMessage(prev => prev ? { ...prev, adminReply: replyText, status: 'replied', repliedAt: now } : null);
    alert('پاسخ ثبت گردید و وضعیت پیام به «پاسخ داده شده» تغییر یافت.');
  };

  const handleDeleteMessage = (id: string, senderName?: string) => {
    setDeleteConfirmState({
      isOpen: true,
      title: 'حذف پیام تماس با ما',
      itemName: senderName ? `پیام ارسالی از «${senderName}»` : undefined,
      onConfirm: () => {
        storage.deleteContactMessage(id);
        setMessages(storage.getContactMessages());
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage(null);
        }
        setDeleteConfirmState(null);
      }
    });
  };

  // --- Department Actions ---
  const handleSaveDepartment = (dept: ContactDepartment) => {
    let updatedDepts: ContactDepartment[];
    if (dept.id) {
      updatedDepts = config.departments.map(d => d.id === dept.id ? dept : d);
    } else {
      const newDept = { ...dept, id: `dept-${Date.now()}` };
      updatedDepts = [...config.departments, newDept];
    }
    const newConfig = { ...config, departments: updatedDepts };
    setConfig(newConfig);
    storage.updateContactConfig(newConfig);
    setIsDeptModalOpen(false);
    setEditingDept(null);
  };

  const handleDeleteDepartment = (id: string) => {
    const targetDept = config.departments.find(d => d.id === id);
    setDeleteConfirmState({
      isOpen: true,
      title: 'حذف واحد دانشگاهی / دپارتمان',
      itemName: targetDept?.name,
      details: targetDept ? [
        { label: 'مسئول واحد', value: targetDept.head || '-' },
        { label: 'شماره مستقیم', value: targetDept.phone || '-' }
      ] : undefined,
      onConfirm: () => {
        const updatedDepts = config.departments.filter(d => d.id !== id);
        const newConfig = { ...config, departments: updatedDepts };
        setConfig(newConfig);
        storage.updateContactConfig(newConfig);
        setDeleteConfirmState(null);
      }
    });
  };

  const handleToggleDepartment = (id: string) => {
    const updatedDepts = config.departments.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d);
    const newConfig = { ...config, departments: updatedDepts };
    setConfig(newConfig);
    storage.updateContactConfig(newConfig);
  };

  // --- Social Actions ---
  const handleSaveSocial = (soc: ContactSocialLink) => {
    let updated: ContactSocialLink[];
    if (soc.id) {
      updated = config.socialLinks.map(s => s.id === soc.id ? soc : s);
    } else {
      const newSoc = { ...soc, id: `soc-${Date.now()}` };
      updated = [...config.socialLinks, newSoc];
    }
    const newConfig = { ...config, socialLinks: updated };
    setConfig(newConfig);
    storage.updateContactConfig(newConfig);
    setIsSocialModalOpen(false);
    setEditingSocial(null);
  };

  const handleDeleteSocial = (id: string) => {
    const targetSocial = config.socialLinks.find(s => s.id === id);
    setDeleteConfirmState({
      isOpen: true,
      title: 'حذف شبکه اجتماعی / پیام‌رسان',
      itemName: targetSocial?.label,
      details: targetSocial ? [
        { label: 'شناسه / آیدی', value: targetSocial.username || '-' }
      ] : undefined,
      onConfirm: () => {
        const updated = config.socialLinks.filter(s => s.id !== id);
        const newConfig = { ...config, socialLinks: updated };
        setConfig(newConfig);
        storage.updateContactConfig(newConfig);
        setDeleteConfirmState(null);
      }
    });
  };

  // --- FAQ Actions ---
  const handleSaveFaq = (faq: ContactFAQ) => {
    let updated: ContactFAQ[];
    if (faq.id) {
      updated = config.faqs.map(f => f.id === faq.id ? faq : f);
    } else {
      const newFaq = { ...faq, id: `faq-${Date.now()}`, order: config.faqs.length + 1 };
      updated = [...config.faqs, newFaq];
    }
    const newConfig = { ...config, faqs: updated };
    setConfig(newConfig);
    storage.updateContactConfig(newConfig);
    setIsFaqModalOpen(false);
    setEditingFaq(null);
  };

  const handleDeleteFaq = (id: string) => {
    const targetFaq = config.faqs.find(f => f.id === id);
    setDeleteConfirmState({
      isOpen: true,
      title: 'حذف پرسش متداول',
      itemName: targetFaq?.question,
      onConfirm: () => {
        const updated = config.faqs.filter(f => f.id !== id);
        const newConfig = { ...config, faqs: updated };
        setConfig(newConfig);
        storage.updateContactConfig(newConfig);
        setDeleteConfirmState(null);
      }
    });
  };

  // --- Reordering & Movement Handlers ---
  const handleMoveDepartment = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.departments.length) return;
    const items = [...config.departments];
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);
    const updated = { ...config, departments: items };
    setConfig(updated);
    storage.updateContactConfig(updated);
  };

  const handleMoveSocial = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.socialLinks.length) return;
    const items = [...config.socialLinks];
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);
    const updated = { ...config, socialLinks: items };
    setConfig(updated);
    storage.updateContactConfig(updated);
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.faqs.length) return;
    const items = [...config.faqs];
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);
    const updated = { ...config, faqs: items };
    setConfig(updated);
    storage.updateContactConfig(updated);
  };

  const defaultSectionsList = ['header', 'highlights', 'form', 'location', 'departments', 'socials', 'working_hours', 'faq'];

  const currentSectionsOrder = config.sectionsOrder && config.sectionsOrder.length > 0
    ? config.sectionsOrder
    : defaultSectionsList;

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentSectionsOrder.length) return;
    const items = [...currentSectionsOrder];
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);
    const updated = { ...config, sectionsOrder: items };
    setConfig(updated);
    storage.updateContactConfig(updated);
  };

  const handleResetSectionsOrder = () => {
    const updated = { ...config, sectionsOrder: defaultSectionsList };
    setConfig(updated);
    storage.updateContactConfig(updated);
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    const matchesQuery = 
      msg.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.senderPhone.includes(searchQuery) ||
      msg.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesQuery;
    return matchesQuery && msg.status === statusFilter;
  });

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">مدیریت جامع صفحه تماس با ما</h1>
              <p className="text-slate-500 text-sm">مدیریت پیام‌های مراجعین، ویرایش مشخصات تماس، لوکیشن، دپارتمان‌ها و مسیریابی</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="/contact"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 transition"
          >
            <Eye className="w-4 h-4" />
            مشاهده صفحه در سایت
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>

          <button
            onClick={handleResetToDefaults}
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2 transition"
            title="بازنشانی اطلاعات تماس به حالت اولیه"
          >
            <RotateCcw className="w-4 h-4" />
            بازنشانی پیش‌فرض
          </button>

          <button
            onClick={() => handleSaveConfig()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition shadow-blue-500/20"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                ذخیره شد!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                ذخیره تغییرات
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar with Scroll Arrows */}
      <div className="relative bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-colors shrink-0 shadow-sm"
            title="حرکت تب‌ها به سمت راست"
            aria-label="حرکت تب‌ها به راست"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Scrollable Tabs Track */}
          <div 
            ref={tabsContainerRef}
            className="flex-1 flex items-center gap-2 overflow-x-auto py-1 scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: 'thin' }}
          >
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'messages'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>صندوق پیام‌های دریافتی</span>
              {unreadCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeTab === 'messages' ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                }`}>
                  {toPersianDigits(unreadCount)} جدید
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'general'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>مشخصات و متون عمومی</span>
            </button>

            <button
              onClick={() => setActiveTab('location')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'location'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>لوکیشن، نقشه و مسیریابی</span>
            </button>

            <button
              onClick={() => setActiveTab('departments')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'departments'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>دپارتمان‌ها و تلفن‌های داخلی ({toPersianDigits(config.departments.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab('socials')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'socials'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>پیام‌رسان‌ها و شبکه‌ها ({toPersianDigits(config.socialLinks.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab('faqs')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'faqs'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>سوالات متداول تماس ({toPersianDigits(config.faqs.length)})</span>
            </button>

            <button
              onClick={() => setActiveTab('layout')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'layout'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-600" />
              <span>چیدمان و ترتیب بخش‌های صفحه</span>
            </button>
          </div>

          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-colors shrink-0 shadow-sm"
            title="حرکت تب‌ها به سمت چپ"
            aria-label="حرکت تب‌ها به چپ"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab 1: Messages Inbox */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="جستجو در پیام‌ها، فرستنده، تلفن، کد رهگیری..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-xs text-slate-400 font-bold whitespace-nowrap">وضعیت:</span>
              {[
                { id: 'all', label: 'همه پیام‌ها', count: messages.length },
                { id: 'unread', label: 'خوانده‌نشده', count: unreadCount },
                { id: 'read', label: 'خوانده‌شده', count: messages.filter(m => m.status === 'read').length },
                { id: 'replied', label: 'پاسخ داده شده', count: messages.filter(m => m.status === 'replied').length },
                { id: 'in_progress', label: 'در حال پیگیری', count: messages.filter(m => m.status === 'in_progress').length },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    statusFilter === f.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>

          {/* Messages Table & Details Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* List */}
            <div className={`${selectedMessage ? 'lg:col-span-5' : 'lg:col-span-12'} bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden`}>
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">لیست پیام‌ها ({filteredMessages.length})</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      const updated = messages.map(m => ({ ...m, status: m.status === 'unread' ? 'read' as const : m.status }));
                      storage.saveContactMessages(updated);
                      setMessages(updated);
                    }}
                    className="text-xs text-blue-600 hover:underline font-bold"
                  >
                    علامت‌گذاری همه به عنوان خوانده‌شده
                  </button>
                )}
              </div>

              {filteredMessages.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-sm">هیچ پیامی با این مشخصات یافت نشد.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
                  {filteredMessages.map(msg => {
                    const isSelected = selectedMessage?.id === msg.id;
                    return (
                      <div
                        key={msg.id}
                        onClick={() => handleOpenMessage(msg)}
                        className={`p-4 cursor-pointer transition flex items-start gap-3 relative ${
                          isSelected ? 'bg-blue-50/70 border-r-4 border-blue-600' : 'hover:bg-slate-50'
                        } ${msg.status === 'unread' ? 'bg-amber-50/30 font-semibold' : ''}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${
                          msg.status === 'unread' ? 'bg-amber-500 animate-pulse' :
                          msg.status === 'replied' ? 'bg-emerald-500' :
                          msg.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'
                        }`} />

                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-sm font-bold text-slate-800 truncate">{msg.senderName}</h4>
                            <span className="text-[11px] text-slate-400 shrink-0" dir="ltr">
                              {toPersianDigits(new Date(msg.createdAt).toLocaleDateString('fa-IR'))}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 font-medium mb-1 truncate">{msg.subject}</div>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
                            {msg.message}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 truncate max-w-[140px]">
                              {msg.department || 'عمومی'}
                            </span>
                            <span className=" text-slate-400 text-[10px]" dir="ltr">
                              {toPersianDigits(msg.trackingCode)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message Detail Card */}
            {selectedMessage && (
              <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Detail Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold text-slate-800">{selectedMessage.subject}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          selectedMessage.status === 'unread' ? 'bg-amber-100 text-amber-800' :
                          selectedMessage.status === 'replied' ? 'bg-emerald-100 text-emerald-800' :
                          selectedMessage.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {selectedMessage.status === 'unread' ? 'خوانده نشده' :
                           selectedMessage.status === 'replied' ? 'پاسخ داده شده' :
                           selectedMessage.status === 'in_progress' ? 'در حال پیگیری' : 'خوانده شده'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>کد رهگیری: <b className="text-slate-700 tracking-tight" dir="ltr">{toPersianDigits(selectedMessage.trackingCode)}</b></span>
                        <span>دپارتمان: <b className="text-slate-700">{selectedMessage.department}</b></span>
                        <span>تاریخ: <b className="text-slate-700 tracking-tight">{toPersianDigits(new Date(selectedMessage.createdAt).toLocaleString('fa-IR'))}</b></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(selectedMessage.id, selectedMessage.senderName)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                        title="حذف پیام"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sender Profile Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">نام فرستنده:</span>
                      <strong className="text-slate-800 font-bold">{selectedMessage.senderName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">تلفن تماس:</span>
                      <a href={`tel:${selectedMessage.senderPhone}`} className="text-blue-600 font-bold hover:underline tracking-tight" dir="ltr">
                        {toPersianDigits(selectedMessage.senderPhone)}
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">ایمیل:</span>
                      <span className="text-slate-700 font-medium tracking-tight" dir="ltr">{selectedMessage.senderEmail || 'ثبت نشده'}</span>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">متن پیام مراجع:</h4>
                    <div className="bg-slate-50/70 p-4 rounded-xl text-slate-700 text-sm leading-relaxed border border-slate-200/60 whitespace-pre-wrap">
                      {selectedMessage.message}
                    </div>
                  </div>

                  {/* Reply Section */}
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Send className="w-4 h-4 text-blue-600" />
                        پاسخ و توضیحات پیگیری کارشناس
                      </h4>
                      {selectedMessage.repliedAt && (
                        <span className="text-xs text-emerald-600 font-medium">
                          پاسخ در {toPersianDigits(new Date(selectedMessage.repliedAt).toLocaleDateString('fa-IR'))} ثبت شده
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="متن پاسخ یا نتیجه پیگیری تماس را اینجا بنویسید..."
                      className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 font-medium">تغییر وضعیت به:</label>
                        <select
                          value={selectedMessage.status}
                          onChange={e => handleUpdateMessageStatus(selectedMessage.id, e.target.value as any)}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white font-medium"
                        >
                          <option value="unread">خوانده نشده</option>
                          <option value="read">خوانده شده</option>
                          <option value="in_progress">در حال پیگیری</option>
                          <option value="replied">پاسخ داده شده</option>
                          <option value="archived">بایگانی شده</option>
                        </select>
                      </div>

                      <button
                        onClick={handleSaveReply}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        ثبت پاسخ و بروزرسانی
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: General Info & Contact Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Header Titles */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                عناوین و متون هدر صفحه
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نشان بالا (Badge):</label>
                <input
                  type="text"
                  value={config.pageBadge}
                  onChange={e => handleConfigChange('pageBadge', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان اصلی صفحه:</label>
                <input
                  type="text"
                  value={config.pageTitle}
                  onChange={e => handleConfigChange('pageTitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">زیرعنوان / متن توضیحات هدر:</label>
                <textarea
                  rows={2}
                  value={config.pageSubtitle}
                  onChange={e => handleConfigChange('pageSubtitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">پیام موفقیت پس از ارسال فرم تماس:</label>
                <textarea
                  rows={2}
                  value={config.formSuccessMessage}
                  onChange={e => handleConfigChange('formSuccessMessage', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Direct Contact Numbers & Emails */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-blue-600" />
                تلفن‌ها و ایمیل‌های اصلی مرکز
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شماره تماس اصلی (تلفن گویا):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={config.phoneMain}
                    onChange={e => handleConfigChange('phoneMain', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شماره تماس دوم / روابط عمومی:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={config.phoneSecondary}
                    onChange={e => handleConfigChange('phoneSecondary', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">شماره نمابر (فکس):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={config.phoneFax}
                    onChange={e => handleConfigChange('phoneFax', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تلفن همراه شیفت / ضروری:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={config.emergencyPhone}
                    onChange={e => handleConfigChange('emergencyPhone', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ایمیل رسمی دبیرخانه:</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={config.emailMain}
                    onChange={e => handleConfigChange('emailMain', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ایمیل مشاوره و ثبت‌نام:</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={config.emailAdmissions}
                    onChange={e => handleConfigChange('emailAdmissions', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                ساعات کاری و پاسخگویی
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">شنبه تا چهارشنبه:</label>
                <input
                  type="text"
                  value={config.workHoursWeekdays}
                  onChange={e => handleConfigChange('workHoursWeekdays', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">پنج‌شنبه‌ها:</label>
                <input
                  type="text"
                  value={config.workHoursThursdays}
                  onChange={e => handleConfigChange('workHoursThursdays', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">جمعه‌ها و تعطیلات:</label>
                <input
                  type="text"
                  value={config.workHoursHolidays}
                  onChange={e => handleConfigChange('workHoursHolidays', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Section Visibility Switches */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                نمایش / عدم نمایش بخش‌های صفحه
              </h3>

              <div className="space-y-3">
                {[
                  { key: 'showMainInfo', label: 'اطلاعات اصلی تماس (آدرس، تلفن، ایمیل)' },
                  { key: 'showWorkingHours', label: 'بخش ساعات کاری و پاسخگویی' },
                  { key: 'showContactForm', label: 'فرم ارسال پیام و مشاوره آنلاین' },
                  { key: 'showDepartments', label: 'دفترچه تلفن و دپارتمان‌های مرکز' },
                  { key: 'showMap', label: 'نقشه و موقعیت ماهواره‌ای' },
                  { key: 'showRoutingButtons', label: 'دکمه‌های مسیریابی سریع (نشان، بلد، گوگل‌مپ، ویز)' },
                  { key: 'showSocials', label: 'بخش پیام‌رسان‌ها و شبکه‌های اجتماعی' },
                  { key: 'showFaq', label: 'بخش سوالات متداول مراجعین' },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(config as any)[item.key]}
                      onChange={e => handleConfigChange(item.key as any, e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              ذخیره تنظیمات عمومی
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Location, Map & Navigation */}
      {activeTab === 'location' && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Address & GPS settings */}
            <div className="lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                مشخصات نشانی و موقعیت جغرافیایی
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان نشانی:</label>
                <input
                  type="text"
                  value={config.addressTitle}
                  onChange={e => handleConfigChange('addressTitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نشانی دقیق پستی و فیزیکی:</label>
                <textarea
                  rows={2}
                  value={config.address}
                  onChange={e => handleConfigChange('address', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">کد پستی ۱۰ رقمی:</label>
                  <input
                    type="text"
                    value={config.postalCode}
                    onChange={e => handleConfigChange('postalCode', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مختصات عرض جغرافیایی (Latitude):</label>
                  <input
                    type="number"
                    step="any"
                    dir="ltr"
                    value={config.latitude}
                    onChange={e => handleConfigChange('latitude', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">مختصات طول جغرافیایی (Longitude):</label>
                  <input
                    type="number"
                    step="any"
                    dir="ltr"
                    value={config.longitude}
                    onChange={e => handleConfigChange('longitude', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-sm  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const lat = 28.342913;
                      const lng = 51.526707;
                      const newCfg = {
                        ...config,
                        latitude: lat,
                        longitude: lng,
                        neshanLink: `https://nshn.ir/search/${lat},${lng}`,
                        baladLink: `https://balad.ir/location?latitude=${lat}&longitude=${lng}`,
                        googleMapsLink: `https://www.google.com/maps/dir/?api=1&destination=28.34291274764676,51.52670733886608`,
                        wazeLink: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
                        mapIframe: `<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=51.519707%2C28.337913%2C51.533707%2C28.347913&amp;layer=mapnik&amp;marker=28.342913%2C51.526707" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`
                      };
                      setConfig(newCfg);
                      storage.updateContactConfig(newCfg);
                      alert('مختصات دقیق دانشگاه با موفقیت در نقشه، نشان، بلد، گوگل‌مپ و ویز تنظیم شد.');
                    }}
                    className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>تنظیم خودکار روی مختصات دقیق دانشگاه (۲۸.۳۴۲۹۱۲, ۵۱.۵۲۶۷۰۷)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Routing Apps Links & Map Iframe */}
            <div className="lg:col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                لینک‌های مسیریابی در اپلیکیشن‌های نقشه
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">لینک مسیریابی نشان (Neshan):</label>
                  <input
                    type="url"
                    dir="ltr"
                    value={config.neshanLink}
                    onChange={e => handleConfigChange('neshanLink', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">لینک مسیریابی بلد (Balad):</label>
                  <input
                    type="url"
                    dir="ltr"
                    value={config.baladLink}
                    onChange={e => handleConfigChange('baladLink', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">لینک مسیریابی گوگل مپ (Google Maps):</label>
                  <input
                    type="url"
                    dir="ltr"
                    value={config.googleMapsLink}
                    onChange={e => handleConfigChange('googleMapsLink', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">لینک مسیریابی ویز (Waze):</label>
                  <input
                    type="url"
                    dir="ltr"
                    value={config.wazeLink}
                    onChange={e => handleConfigChange('wazeLink', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">کد آی‌فریم نقشه (Embed Iframe):</label>
                <textarea
                  rows={3}
                  dir="ltr"
                  value={config.mapIframe}
                  onChange={e => handleConfigChange('mapIframe', e.target.value)}
                  placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
                  className="w-full p-2.5 text-xs  rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Live Map Preview */}
            <div className="lg:col-span-12 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  پیش‌نمایش زنده نقشه و بخش مسیریابی
                </h3>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 h-80 w-full relative bg-slate-100">
                {config.mapIframe ? (
                  <div 
                    className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                    dangerouslySetInnerHTML={{ __html: config.mapIframe }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    کد آی‌فریم نقشه وارد نشده است
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              ذخیره تنظیمات موقعیت و نقشه
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Departments & Extensions */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              لیست دپارتمان‌ها، مسئولین پاسخگو و شماره تلفن‌های داخلی که در جدول دفترچه تلفن سایت نمایش داده می‌شوند.
            </p>
            <button
              onClick={() => {
                setEditingDept({
                  id: '',
                  name: '',
                  expertName: '',
                  phone: config.phoneMain,
                  extension: '',
                  email: '',
                  workingHours: '۰۸:۰۰ الی ۱۴:۰۰',
                  roomNumber: '',
                  isActive: true
                });
                setIsDeptModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              افزودن دپارتمان جدید
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.departments.map((dept, deptIdx) => (
              <div 
                key={dept.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition ${
                  dept.isActive ? 'border-slate-100' : 'border-slate-200 opacity-60 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">{dept.name}</h4>
                    {dept.expertName && (
                      <span className="text-xs text-blue-600 font-medium">{dept.expertName}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Move Up/Down */}
                    <button
                      type="button"
                      disabled={deptIdx === 0}
                      onClick={() => handleMoveDepartment(deptIdx, 'up')}
                      className={`p-1.5 rounded-lg border text-xs transition ${
                        deptIdx === 0 ? 'text-slate-300 border-slate-100 cursor-not-allowed' : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="انتقال به بالا"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={deptIdx === config.departments.length - 1}
                      onClick={() => handleMoveDepartment(deptIdx, 'down')}
                      className={`p-1.5 rounded-lg border text-xs transition ${
                        deptIdx === config.departments.length - 1 ? 'text-slate-300 border-slate-100 cursor-not-allowed' : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="انتقال به پایین"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleDepartment(dept.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition ${
                        dept.isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                      }`}
                      title={dept.isActive ? 'فعال (کلیک برای غیرفعال‌سازی)' : 'غیرفعال (کلیک برای فعال‌سازی)'}
                    >
                      {dept.isActive ? 'فعال' : 'مخفی'}
                    </button>

                    <button
                      onClick={() => {
                        setEditingDept(dept);
                        setIsDeptModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="ویرایش دپارتمان"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteDepartment(dept.id)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="حذف دپارتمان"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">تلفن مستقیم:</span>
                    <strong className="text-slate-800 tracking-tight" dir="ltr">{toPersianDigits(dept.phone)}</strong>
                  </div>
                  {dept.extension && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">شماره داخلی:</span>
                      <strong className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-bold tracking-tight" dir="ltr">
                        {toPersianDigits(dept.extension)}
                      </strong>
                    </div>
                  )}
                  {dept.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ایمیل:</span>
                      <span className="text-slate-700 tracking-tight" dir="ltr">{dept.email}</span>
                    </div>
                  )}
                  {dept.roomNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">محل استقرار:</span>
                      <span className="text-slate-700">{toPersianDigits(dept.roomNumber)}</span>
                    </div>
                  )}
                  {dept.workingHours && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ساعت حضور:</span>
                      <span className="text-slate-700">{toPersianDigits(dept.workingHours)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Social Media & Messengers */}
      {activeTab === 'socials' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              کانال‌ها و حساب‌های رسمی مرکز در پیام‌رسان‌های ایرانی و بین‌المللی
            </p>
            <button
              onClick={() => {
                setEditingSocial({
                  id: '',
                  platform: 'eitaa',
                  label: '',
                  url: '',
                  username: '',
                  isActive: true
                });
                setIsSocialModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              افزودن پیام‌رسان / شبکه
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {config.socialLinks.map((soc, socIdx) => (
              <div 
                key={soc.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition flex flex-col justify-between ${
                  soc.isActive ? 'border-slate-100' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Move Up/Down */}
                      <button
                        type="button"
                        disabled={socIdx === 0}
                        onClick={() => handleMoveSocial(socIdx, 'up')}
                        className={`p-1 rounded border text-xs transition ${
                          socIdx === 0 ? 'text-slate-300 border-slate-100 cursor-not-allowed' : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="انتقال به جلو"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={socIdx === config.socialLinks.length - 1}
                        onClick={() => handleMoveSocial(socIdx, 'down')}
                        className={`p-1 rounded border text-xs transition ${
                          socIdx === config.socialLinks.length - 1 ? 'text-slate-300 border-slate-100 cursor-not-allowed' : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="انتقال به عقب"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => {
                          const updated = config.socialLinks.map(s => s.id === soc.id ? { ...s, isActive: !s.isActive } : s);
                          const newConfig = { ...config, socialLinks: updated };
                          setConfig(newConfig);
                          storage.updateContactConfig(newConfig);
                        }}
                        className={`text-xs px-2 py-0.5 rounded font-bold ${soc.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                      >
                        {soc.isActive ? 'فعال' : 'مخفی'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingSocial(soc);
                          setIsSocialModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title="ویرایش شبکه"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSocial(soc.id)}
                        className="p-1 text-slate-400 hover:text-red-600"
                        title="حذف شبکه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm mb-1">{soc.label}</h4>
                  <p className="text-xs text-slate-500  mb-2" dir="ltr">{soc.username}</p>
                </div>

                <a
                  href={soc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate pt-2 border-t border-slate-100"
                  dir="ltr"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  {soc.url}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Frequently Asked Questions */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              پرسش‌ها و پاسخ‌های پرتکرار جهت راهنمایی سریع دانشجویان و مراجعین
            </p>
            <button
              onClick={() => {
                setEditingFaq({
                  id: '',
                  question: '',
                  answer: '',
                  order: config.faqs.length + 1,
                  isActive: true
                });
                setIsFaqModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              افزودن پرسش جدید
            </button>
          </div>

          <div className="space-y-3">
            {config.faqs.map((faq, idx) => (
              <div 
                key={faq.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition ${
                  faq.isActive ? 'border-slate-100' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm">{faq.question}</h4>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Move Up/Down */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveFaq(idx, 'up')}
                      className={`p-1.5 rounded-lg border text-xs transition ${
                        idx === 0 ? 'text-slate-300 border-slate-100 cursor-not-allowed' : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="انتقال به بالا"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === config.faqs.length - 1}
                      onClick={() => handleMoveFaq(idx, 'down')}
                      className={`p-1.5 rounded-lg border text-xs transition ${
                        idx === config.faqs.length - 1 ? 'text-slate-300 border-slate-100 cursor-not-allowed' : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title="انتقال به پایین"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        const updated = config.faqs.map(f => f.id === faq.id ? { ...f, isActive: !f.isActive } : f);
                        const newConfig = { ...config, faqs: updated };
                        setConfig(newConfig);
                        storage.updateContactConfig(newConfig);
                      }}
                      className={`text-xs px-2 py-0.5 rounded font-bold ${faq.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                    >
                      {faq.isActive ? 'فعال' : 'مخفی'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingFaq(faq);
                        setIsFaqModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600"
                      title="ویرایش پرسش"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                      title="حذف پرسش"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed pr-8">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Sections Order & Layout Manager */}
      {activeTab === 'layout' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                ترتیب و چیدمان بخش‌های صفحه تماس با ما
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                با استفاده از دکمه‌های بالا و پایین می‌توانید ترتیب نمایش بلوک‌های مختلف در صفحه تماس با ما را به دلخواه تغییر دهید.
              </p>
            </div>

            <button
              onClick={handleResetSectionsOrder}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              بازنشانی ترتیب پیش‌فرض
            </button>
          </div>

          {/* Sections List */}
          <div className="space-y-3">
            {currentSectionsOrder.map((sectionKey, idx) => {
              const meta: Record<string, { title: string; desc: string; icon: any; toggleKey?: keyof ContactPageConfig }> = {
                header: {
                  title: 'هدر و عنوان اصلی صفحه',
                  desc: 'عنوان صفحه، نشان وضعیت پاسخگویی مرکز و معرفی اجمالی',
                  icon: Sliders
                },
                highlights: {
                  title: 'کارت‌ها و دکمه‌های دسترسی سریع',
                  desc: 'باکس‌های تلفن گویا، ایمیل رسمی دبیرخانه و ساعت کاری در بالای صفحه',
                  icon: PhoneCall,
                  toggleKey: 'showMainInfo'
                },
                form: {
                  title: 'فرم ارسال برخط پیام و مشاوره',
                  desc: 'فرم ثبت پیام همراه با صدور کد رهگیری اختصاصی و پیگیری',
                  icon: MessageSquare,
                  toggleKey: 'showContactForm'
                },
                location: {
                  title: 'نقشه و دسترسی‌های مسیریابی',
                  desc: 'نقشه ماهواره‌ای، نشانی فیزیکی، کدپستی و لینک‌های بلد، نشان، گوگل‌مپ و ویز',
                  icon: Navigation,
                  toggleKey: 'showMap'
                },
                departments: {
                  title: 'دفترچه تلفن و دپارتمان‌های مرکز',
                  desc: 'جدول اسامی کارشناسان، واحدهای دانشگاهی، شماره‌های داخلی و ساعات پاسخگویی',
                  icon: Building2,
                  toggleKey: 'showDepartments'
                },
                socials: {
                  title: 'کانال‌ها و پیام‌رسان‌های رسمی',
                  desc: 'پیام‌رسان‌های ایتا، بله، تلگرام و اینستاگرام مرکز',
                  icon: Share2,
                  toggleKey: 'showSocials'
                },
                working_hours: {
                  title: 'ساعات کاری و تماس اضطراری',
                  desc: 'باکس ساعات اداری روزهای هفته، پنج‌شنبه‌ها و شماره پاسخگویی اضطراری',
                  icon: Clock,
                  toggleKey: 'showWorkingHours'
                },
                faq: {
                  title: 'پرسش‌های متداول مراجعین',
                  desc: 'راهنمای سوالات متداول در انتهای صفحه تماس با ما',
                  icon: HelpCircle,
                  toggleKey: 'showFaq'
                }
              };

              const currentMeta: { title: string; desc: string; icon: any; toggleKey?: keyof ContactPageConfig } = meta[sectionKey] || {
                title: sectionKey,
                desc: 'بخش سفارشی صفحه',
                icon: Layers
              };

              const Icon = currentMeta.icon;
              const isEnabled = currentMeta.toggleKey ? Boolean(config[currentMeta.toggleKey]) : true;

              return (
                <div
                  key={sectionKey}
                  className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isEnabled ? 'border-slate-200/90 hover:border-blue-300' : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {toPersianDigits(idx + 1)}
                      </span>
                      <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        {currentMeta.title}
                        {!isEnabled && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                            غیرفعال
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {currentMeta.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Toggle Visibility if supported */}
                    {currentMeta.toggleKey && (
                      <button
                        type="button"
                        onClick={() => {
                          const key = currentMeta.toggleKey!;
                          handleConfigChange(key, !config[key]);
                          storage.updateContactConfig({ ...config, [key]: !config[key] });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isEnabled
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {isEnabled ? 'نمایش در سایت' : 'مخفی در سایت'}
                      </button>
                    )}

                    {/* Move Up Button */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(idx, 'up')}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                        idx === 0
                          ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50'
                          : 'text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                      }`}
                      title="انتقال به موقعیت بالاتر"
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span className="hidden sm:inline">بالا</span>
                    </button>

                    {/* Move Down Button */}
                    <button
                      type="button"
                      disabled={idx === currentSectionsOrder.length - 1}
                      onClick={() => handleMoveSection(idx, 'down')}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                        idx === currentSectionsOrder.length - 1
                          ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50'
                          : 'text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                      }`}
                      title="انتقال به موقعیت پایین‌تر"
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span className="hidden sm:inline">پایین</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => handleSaveConfig()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              ذخیره چیدمان و ترتیب بخش‌ها
            </button>
          </div>
        </div>
      )}

      {/* Modal: Department Editor */}
      {isDeptModalOpen && editingDept && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              {editingDept.id ? 'ویرایش دپارتمان / داخلی' : 'افزودن دپارتمان جدید'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نام دپارتمان یا واحد:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اداره آموزش و امور دانشجویی"
                  value={editingDept.name}
                  onChange={e => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نام کارشناس یا مسئول پاسخگو:</label>
                <input
                  type="text"
                  placeholder="مثال: مهندس حسینی"
                  value={editingDept.expertName || ''}
                  onChange={e => setEditingDept({ ...editingDept, expertName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">شماره تلفن مستقیم:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editingDept.phone}
                    onChange={e => setEditingDept({ ...editingDept, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm  focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">شماره داخلی (Extension):</label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="۱۰۱"
                    value={editingDept.extension || ''}
                    onChange={e => setEditingDept({ ...editingDept, extension: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm  focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ایمیل واحد:</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={editingDept.email || ''}
                    onChange={e => setEditingDept({ ...editingDept, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm  focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">محل استقرار / اتاق:</label>
                  <input
                    type="text"
                    placeholder="اتاق ۱۰۲ - طبقه همکف"
                    value={editingDept.roomNumber || ''}
                    onChange={e => setEditingDept({ ...editingDept, roomNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ساعات پاسخگویی و حضور:</label>
                <input
                  type="text"
                  placeholder="۰۸:۰۰ الی ۱۴:۰۰"
                  value={editingDept.workingHours || ''}
                  onChange={e => setEditingDept({ ...editingDept, workingHours: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingDept.isActive}
                  onChange={e => setEditingDept({ ...editingDept, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-bold text-slate-700">نمایش در سایت و جدول دفترچه تلفن</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsDeptModalOpen(false);
                  setEditingDept(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
              >
                انصراف
              </button>
              <button
                onClick={() => handleSaveDepartment(editingDept)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
              >
                ذخیره دپارتمان
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Social Link Editor */}
      {isSocialModalOpen && editingSocial && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              {editingSocial.id ? 'ویرایش پیام‌رسان / شبکه اجتماعی' : 'افزودن پیام‌رسان'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع پلتفرم:</label>
                <select
                  value={editingSocial.platform}
                  onChange={e => setEditingSocial({ ...editingSocial, platform: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 bg-white"
                >
                  <option value="eitaa">ایتا (Eitaa)</option>
                  <option value="bale">بله (Bale)</option>
                  <option value="telegram">تلگرام (Telegram)</option>
                  <option value="instagram">اینستاگرام (Instagram)</option>
                  <option value="rubika">روبیکا (Rubika)</option>
                  <option value="soroush">سروش (Soroush)</option>
                  <option value="whatsapp">واتساپ (WhatsApp)</option>
                  <option value="aparat">آپارات (Aparat)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان نمایشی:</label>
                <input
                  type="text"
                  placeholder="مثال: کانال رسمی در پیام‌رسان ایتا"
                  value={editingSocial.label}
                  onChange={e => setEditingSocial({ ...editingSocial, label: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شناسه کاربری / آی‌دی:</label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="@kowsarkaki_uast"
                  value={editingSocial.username}
                  onChange={e => setEditingSocial({ ...editingSocial, username: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm  focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">آدرس اینترنتی (URL):</label>
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://eitaa.com/..."
                  value={editingSocial.url}
                  onChange={e => setEditingSocial({ ...editingSocial, url: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm  focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsSocialModalOpen(false);
                  setEditingSocial(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
              >
                انصراف
              </button>
              <button
                onClick={() => handleSaveSocial(editingSocial)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
              >
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: FAQ Editor */}
      {isFaqModalOpen && editingFaq && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
              {editingFaq.id ? 'ویرایش پرسش متداول' : 'افزودن پرسش جدید'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">متن پرسش:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ساعات پاسخگویی حضوری مرکز به چه صورت است؟"
                  value={editingFaq.question}
                  onChange={e => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">متن پاسخ:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="پاسخ کامل و راهنمای مورد نیاز را بنویسید..."
                  value={editingFaq.answer}
                  onChange={e => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsFaqModalOpen(false);
                  setEditingFaq(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
              >
                انصراف
              </button>
              <button
                onClick={() => handleSaveFaq(editingFaq)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
              >
                ذخیره پرسش
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
