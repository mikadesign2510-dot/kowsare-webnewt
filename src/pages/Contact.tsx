import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  storage, 
  ContactPageConfig, 
  ContactDepartment,
  defaultContactConfig 
} from '../lib/storage';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  Copy, 
  Check, 
  Navigation, 
  Building2, 
  Share2, 
  ChevronDown, 
  Sparkles, 
  PhoneCall, 
  User, 
  FileText, 
  HelpCircle,
  ExternalLink,
  MessageSquare,
  Compass,
  CornerDownLeft
} from 'lucide-react';

// Helper to convert English digits to Persian digits for clean Vazirmatn typography
const toPersianDigits = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/[0-9]/g, (w) => farsiDigits[+w]);
};

export default function Contact() {
  const [config, setConfig] = useState<ContactPageConfig>(storage.getContactConfig());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Contact Form State
  const [formData, setFormData] = useState({
    senderName: '',
    senderPhone: '',
    senderEmail: '',
    department: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    trackingCode: string;
    senderName: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleConfigChange = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      } else {
        setConfig(storage.getContactConfig());
      }
    };

    const handleSiteSettingsChange = () => {
      setConfig(storage.getContactConfig());
    };

    window.addEventListener('kowsar_contact_config_changed', handleConfigChange);
    window.addEventListener('kowsar_site_settings_changed', handleSiteSettingsChange);

    return () => {
      window.removeEventListener('kowsar_contact_config_changed', handleConfigChange);
      window.removeEventListener('kowsar_site_settings_changed', handleSiteSettingsChange);
    };
  }, []);

  // Copy helper with feedback
  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.senderName.trim()) {
      setFormError('لطفاً نام و نام خانوادگی خود را وارد نمایید.');
      return;
    }
    if (!formData.senderPhone.trim() || formData.senderPhone.length < 8) {
      setFormError('لطفاً شماره تماس معتبر وارد نمایید.');
      return;
    }
    if (!formData.subject.trim()) {
      setFormError('لطفاً موضوع پیام را مشخص کنید.');
      return;
    }
    if (!formData.message.trim()) {
      setFormError('لطفاً متن پیام خود را وارد نمایید.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const selectedDept = formData.department || (config.departments[0]?.name ?? 'امور عمومی و مشاوره');
      const newMsg = storage.addContactMessage({
        senderName: formData.senderName.trim(),
        senderPhone: formData.senderPhone.trim(),
        senderEmail: formData.senderEmail.trim() || undefined,
        department: selectedDept,
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });

      setIsSubmitting(false);
      setSubmissionResult({
        trackingCode: newMsg.trackingCode,
        senderName: newMsg.senderName
      });

      // Reset form
      setFormData({
        senderName: '',
        senderPhone: '',
        senderEmail: '',
        department: '',
        subject: '',
        message: ''
      });
    }, 600);
  };

  const activeDepartments = config.departments.filter(d => d.isActive);
  const activeSocials = config.socialLinks.filter(s => s.isActive);
  const activeFaqs = config.faqs.filter(f => f.isActive);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="min-h-screen bg-[#FBFBFC] text-slate-800 selection:bg-blue-100 selection:text-blue-900 font-sans pb-24" 
      dir="rtl"
    >
      
      {/* 1. Minimal Header Section */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-20 border-b border-slate-200/70 bg-white overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold mb-6 shadow-2xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{config.pageBadge || 'پاسخگویی حضوری و تلفنی فعال است'}</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight md:leading-tight max-w-3xl mx-auto mb-4"
          >
            {config.pageTitle || 'تماس با ما و دسترسی به مرکز'}
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed mb-8"
          >
            {config.pageSubtitle || 'برای هرگونه سوال، مشاوره ثبت‌نام و ارتباط با کارشناسان و مدیریت مرکز، از راه‌های ارتباطی زیر استفاده فرمایید.'}
          </motion.p>

          {/* Fast Contact Highlights Pills */}
          <motion.div 
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
          >
            <a 
              href={`tel:${config.phoneMain}`}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 text-slate-700 hover:text-blue-700 text-xs sm:text-sm font-semibold transition"
            >
              <PhoneCall className="w-4 h-4 text-blue-600 shrink-0" />
              <span>تلفن گویا:</span>
              <span className="font-bold tracking-tight text-blue-900" dir="ltr">{toPersianDigits(config.phoneMain)}</span>
            </a>

            <a 
              href={`mailto:${config.emailMain}`}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 text-slate-700 hover:text-blue-700 text-xs sm:text-sm font-semibold transition"
            >
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <span>ایمیل دبیرخانه:</span>
              <span className="font-medium text-slate-700" dir="ltr">{config.emailMain}</span>
            </a>

            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs sm:text-sm font-medium">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{toPersianDigits(config.workHoursWeekdays || 'شنبه تا چهارشنبه: ۰۷:۳۰ الی ۱۴:۳۰')}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Main Section: 2-Column Grid (Form + Location/Navigation) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Interactive Contact & Inquiry Form */}
          {config.showContactForm && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    ارسال برخط پیام و درخواست مشاوره
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">
                    پیام شما مستقیماً به دپارتمان مربوطه ارجاع داده شده و کد رهگیری صادر خواهد شد.
                  </p>
                </div>
              </div>

              {/* Submission Result Receipt Card */}
              <AnimatePresence>
                {submissionResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-6 mb-6 text-emerald-950"
                  >
                    <div className="flex items-start gap-3.5 mb-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-emerald-900">
                          {submissionResult.senderName} گرامی، پیام شما با موفقیت ثبت شد!
                        </h3>
                        <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                          {config.formSuccessMessage || 'پیام شما به دبیرخانه ارسال شد و در اسرع وقت توسط کارشناسان بررسی می‌گردد.'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-slate-500 block mb-0.5 font-medium">کد رهگیری اختصاصی پیام شما:</span>
                        <span className="text-xl font-black text-emerald-800 tracking-wider inline-block" dir="ltr">
                          {toPersianDigits(submissionResult.trackingCode)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(submissionResult.trackingCode, 'tracking-code')}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        {copiedField === 'tracking-code' ? (
                          <>
                            <Check className="w-4 h-4" />
                            کپی شد
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            کپی کد رهگیری
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSubmissionResult(null)}
                      className="mt-4 text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <CornerDownLeft className="w-3.5 h-3.5" />
                      ارسال پیام جدید دیگر
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Contact Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sender Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      نام و نام خانوادگی <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="مثال: علی رضایی"
                        value={formData.senderName}
                        onChange={e => setFormData({ ...formData, senderName: e.target.value })}
                        className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    </div>
                  </div>

                  {/* Sender Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      شماره تماس همراه <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        dir="ltr"
                        placeholder="۰۹۱۷XXXXXXX"
                        value={formData.senderPhone}
                        onChange={e => setFormData({ ...formData, senderPhone: e.target.value })}
                        className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-right"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Department */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      واحد یا دپارتمان مقصد
                    </label>
                    <div className="relative">
                      <select
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white appearance-none"
                      >
                        <option value="">انتخاب دپارتمان (پیش‌فرض: عمومی)</option>
                        {activeDepartments.map(dept => (
                          <option key={dept.id} value={dept.name}>
                            {dept.name} {dept.extension ? `(داخلی ${toPersianDigits(dept.extension)})` : ''}
                          </option>
                        ))}
                      </select>
                      <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      آدرس ایمیل (اختیاری)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        dir="ltr"
                        placeholder="name@example.com"
                        value={formData.senderEmail}
                        onChange={e => setFormData({ ...formData, senderEmail: e.target.value })}
                        className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-right"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    موضوع پیام <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="مثال: سوال در خصوص مدارک ثبت‌نام کاردانی یا وام شهریه"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                    <FileText className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    متن پیام یا سوال شما <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="شرح کامل درخواست، سوال یا پیام خود را بنویسید..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      در حال ثبت و صدور کد رهگیری...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      ارسال پیام و دریافت کد رهگیری
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* Column 2: Location, Navigation Suite & Direct Details */}
          <div className={`${config.showContactForm ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-6`}>
            
            {/* 4 Navigation App Boxes Card */}
            {config.showMap && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-5"
              >
                {/* Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                      <span>مسیریابی هوشمند تا مجتمع دانشگاهی</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-light mt-0.5">
                      روی هر نرم‌افزار بزنید تا برنامه باز شده و مسیر مستقیم تا دانشگاه آغاز شود:
                    </p>
                  </div>
                </div>

                {/* The 4 Navigation App Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* 1. Google Maps */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${config.latitude || 28.342913},${config.longitude || 51.526707}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group p-4 rounded-2xl bg-gradient-to-br from-red-50/70 via-rose-50/40 to-white hover:from-red-100/80 hover:to-rose-50 border border-red-200/80 hover:border-red-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/25 group-hover:scale-105 transition-transform shrink-0">
                          <MapPin className="w-5 h-5 fill-white text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 group-hover:text-red-700 transition-colors">
                            گوگل‌مپ (Google Maps)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            مسیریابی بین‌المللی با نقشه گوگل
                          </div>
                        </div>
                      </div>
                      <span className="p-1 rounded-lg bg-red-100/80 text-red-700 group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="pt-2 border-t border-red-100/70 flex items-center justify-between text-xs font-bold text-red-700">
                      <span>باز کردن و شروع مسیریابی</span>
                      <Navigation className="w-3.5 h-3.5 transform -rotate-45 group-hover:translate-x-[-3px] transition-transform" />
                    </div>
                  </a>

                  {/* 2. نشان (Neshan) */}
                  <a
                    href={config.neshanLink || `https://nshn.ir/search/${config.latitude || 28.342913},${config.longitude || 51.526707}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white hover:from-emerald-100/80 hover:to-teal-50 border border-emerald-200/80 hover:border-emerald-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform shrink-0">
                          <Navigation className="w-5 h-5 fill-white text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                            مسیریاب نشان (Neshan)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            نقشه و مسیریاب هوشمند سخنگو
                          </div>
                        </div>
                      </div>
                      <span className="p-1 rounded-lg bg-emerald-100/80 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="pt-2 border-t border-emerald-100/70 flex items-center justify-between text-xs font-bold text-emerald-700">
                      <span>باز کردن و شروع مسیریابی</span>
                      <Navigation className="w-3.5 h-3.5 transform -rotate-45 group-hover:translate-x-[-3px] transition-transform" />
                    </div>
                  </a>

                  {/* 3. بلد (Balad) */}
                  <a
                    href={config.baladLink || `https://balad.ir/location?latitude=${config.latitude || 28.342913}&longitude=${config.longitude || 51.526707}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white hover:from-blue-100/80 hover:to-indigo-50 border border-blue-200/80 hover:border-blue-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform shrink-0">
                          <Compass className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                            مسیریاب بلد (Balad)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            نقشه جامع و تخمین دقیق زمان
                          </div>
                        </div>
                      </div>
                      <span className="p-1 rounded-lg bg-blue-100/80 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="pt-2 border-t border-blue-100/70 flex items-center justify-between text-xs font-bold text-blue-700">
                      <span>باز کردن و شروع مسیریابی</span>
                      <Navigation className="w-3.5 h-3.5 transform -rotate-45 group-hover:translate-x-[-3px] transition-transform" />
                    </div>
                  </a>

                  {/* 4. ویز (Waze) */}
                  <a
                    href={config.wazeLink || `https://waze.com/ul?ll=${config.latitude || 28.342913},${config.longitude || 51.526707}&navigate=yes`}
                    target="_blank"
                    rel="noreferrer"
                    className="group p-4 rounded-2xl bg-gradient-to-br from-cyan-50/70 via-sky-50/40 to-white hover:from-cyan-100/80 hover:to-sky-50 border border-cyan-200/80 hover:border-cyan-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/25 group-hover:scale-105 transition-transform shrink-0">
                          <Navigation className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 group-hover:text-sky-700 transition-colors">
                            مسیریاب ویز (Waze)
                          </div>
                          <div className="text-[11px] text-slate-500">
                            مسیریابی با ترافیک لحظه‌ای و هشدارهای مسیر
                          </div>
                        </div>
                      </div>
                      <span className="p-1 rounded-lg bg-sky-100/80 text-sky-700 group-hover:bg-sky-500 group-hover:text-white transition-colors shrink-0">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <div className="pt-2 border-t border-cyan-100/70 flex items-center justify-between text-xs font-bold text-sky-700">
                      <span>باز کردن و شروع مسیریابی</span>
                      <Navigation className="w-3.5 h-3.5 transform -rotate-45 group-hover:translate-x-[-3px] transition-transform" />
                    </div>
                  </a>
                </div>

                {/* Destination info notice */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">
                    <strong>مقصد نهایی:</strong> مرکز آموزش علمی کاربردی کوثر کاکی (بلوار ولیعصر، جنب میدان انقلاب)
                  </span>
                </div>
              </motion.div>
            )}

            {/* Address & Working Hours Card */}
            {config.showMainInfo && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-5"
              >
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-sm">{config.addressTitle || 'نشانی مجتمع دانشگاهی'}</h3>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(config.address, 'address')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 shrink-0"
                      >
                        {copiedField === 'address' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedField === 'address' ? 'کپی شد' : 'کپی نشانی'}
                      </button>
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-2">
                      {config.address}
                    </p>
                    {config.postalCode && (
                      <div className="text-xs text-slate-500">
                        کد پستی: <b className="text-slate-700 font-bold tracking-wider">{toPersianDigits(config.postalCode)}</b>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Working Hours */}
                  {config.showWorkingHours && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs mb-1">ساعات اداری و مراجعات</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-0.5">{toPersianDigits(config.workHoursWeekdays)}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{toPersianDigits(config.workHoursThursdays)}</p>
                      </div>
                    </div>
                  )}

                  {/* Direct Phone */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs mb-1">پاسخگویی تلفنی مستقیم</h4>
                      <a href={`tel:${config.phoneMain}`} className="font-bold text-slate-800 text-sm hover:text-blue-600 block tracking-tight" dir="ltr">
                        {toPersianDigits(config.phoneMain)}
                      </a>
                      {config.phoneSecondary && (
                        <a href={`tel:${config.phoneSecondary}`} className="text-xs text-slate-500 hover:text-blue-600 block mt-0.5 font-medium tracking-tight" dir="ltr">
                          {toPersianDigits(config.phoneSecondary)}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Departments & Extension Directory */}
      {config.showDepartments && activeDepartments.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-3">
              <Building2 className="w-3.5 h-3.5" />
              دفترچه تلفن و تلفن‌های داخلی
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              دپارتمان‌ها و شماره‌های داخلی مرکز
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              برای تسریع در امور اداری، می‌توانید مستقیماً با کارشناس بخش مربوطه ارتباط برقرار نمایید.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeDepartments.map(dept => (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-2.5 rounded-2xl bg-slate-50 text-blue-600 group-hover:bg-blue-50 transition">
                      <Building2 className="w-5 h-5" />
                    </div>

                    {dept.extension && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold">
                        <span>داخلی:</span>
                        <span dir="ltr">{toPersianDigits(dept.extension)}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">{dept.name}</h3>
                  {dept.expertName && (
                    <p className="text-xs text-blue-600 font-semibold mb-3">{dept.expertName}</p>
                  )}

                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">تلفن مستقیم:</span>
                      <a href={`tel:${dept.phone}`} className="font-bold text-slate-800 hover:text-blue-600 tracking-tight" dir="ltr">
                        {toPersianDigits(dept.phone)}
                      </a>
                    </div>

                    {dept.roomNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">محل استقرار:</span>
                        <span className="text-slate-700 font-medium">{toPersianDigits(dept.roomNumber)}</span>
                      </div>
                    )}

                    {dept.workingHours && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">ساعت پاسخگویی:</span>
                        <span className="text-slate-700 font-medium">{toPersianDigits(dept.workingHours)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={`tel:${dept.phone}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    برقراری تماس
                  </a>

                  {dept.extension && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(dept.extension || '', `ext-${dept.id}`)}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium"
                    >
                      {copiedField === `ext-${dept.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === `ext-${dept.id}` ? 'کپی شد' : 'کپی داخلی'}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Social & Official Channels */}
      {config.showSocials && activeSocials.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold mb-3">
                  <Share2 className="w-3.5 h-3.5" />
                  اطلاع‌رسانی برخط و شبکه‌های اجتماعی
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                  عضویت در کانال‌های رسمی مرکز
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                  جهت دریافت سریع‌ترین اخبار، بخشنامه‌های آموزشی، تقویم امتحانات و برنامه‌های فرهنگی ما را در پیام‌رسان‌ها دنبال فرمایید.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {activeSocials.map(soc => (
                  <a
                    key={soc.id}
                    href={soc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold flex items-center gap-2 transition backdrop-blur-sm"
                  >
                    <span>{soc.label}</span>
                    <span className="text-blue-300 text-xs font-medium" dir="ltr">{soc.username}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Frequently Asked Questions Section */}
      {config.showFaq && activeFaqs.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              راهنمای مراجعین
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              سوالات متداول تماس و مراجعات
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              پاسخ به سوالات پرتکرار داوطلبان، دانشجویان و مراجعین محترم
            </p>
          </div>

          <div className="space-y-3">
            {activeFaqs.map(faq => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 font-bold text-slate-800 text-sm hover:bg-slate-50/70 transition"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 pr-9">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </motion.div>
  );
}
