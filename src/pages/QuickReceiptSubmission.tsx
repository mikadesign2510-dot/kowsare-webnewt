import React, { useState, useEffect, useRef } from 'react';
import { 
  Receipt, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Upload, 
  Copy, 
  Check, 
  ArrowRight, 
  Info, 
  Calendar, 
  Building2, 
  User, 
  Phone, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Clock, 
  Printer, 
  X, 
  Eye, 
  ShieldCheck, 
  Tag, 
  FileCheck,
  Headphones
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { storage, QuickReceiptConfig, FinancialReceipt, Student, QuickReceiptBankAccount } from '../lib/storage';
import { 
  toPersianDigits, 
  toEnglishDigits, 
  replacePersianWithEnglishDigits,
  formatPersianDigitSeparators, 
  numberToPersianWords 
} from '../lib/persianNumberHelper';
import { getTodayJalali } from '../lib/jalaliDateHelper';
import PersianDatePicker from '../components/PersianDatePicker';

// تقسیم شماره کارت ۱۶ رقمی به ۴ بلوک ۴ رقمی
function getCardBlocks(num?: string): string[] {
  if (!num) return ['', '', '', ''];
  const digits = String(num).replace(/\D/g, '');
  if (digits.length >= 16) {
    return [
      digits.slice(0, 4),
      digits.slice(4, 8),
      digits.slice(8, 12),
      digits.slice(12, 16)
    ];
  }
  const chunks: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    chunks.push(digits.slice(i, i + 4));
  }
  while (chunks.length < 4) chunks.push('');
  return chunks;
}

// کلاس‌های تم رنگی کارت بانکی (سرمه‌ای، زمردی، طلایی، بنفش، زغالی)
function getCardThemeClasses(theme?: string): {
  bg: string;
  accent: string;
  badge: string;
  border: string;
} {
  switch (theme) {
    case 'emerald':
      return {
        bg: 'bg-gradient-to-br from-[#06241e] via-[#093e34] to-[#0f5c4d]',
        accent: 'text-emerald-300',
        badge: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
        border: 'border-emerald-500/30 shadow-emerald-950/40'
      };
    case 'gold':
      return {
        bg: 'bg-gradient-to-br from-[#241a06] via-[#43310d] to-[#6d5018]',
        accent: 'text-amber-300',
        badge: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
        border: 'border-amber-500/30 shadow-amber-950/40'
      };
    case 'purple':
      return {
        bg: 'bg-gradient-to-br from-[#1b0a33] via-[#33155d] to-[#512391]',
        accent: 'text-purple-300',
        badge: 'bg-purple-400/20 text-purple-200 border-purple-400/30',
        border: 'border-purple-500/30 shadow-purple-950/40'
      };
    case 'slate':
      return {
        bg: 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155]',
        accent: 'text-slate-300',
        badge: 'bg-slate-400/20 text-slate-200 border-slate-400/30',
        border: 'border-slate-500/30 shadow-slate-950/40'
      };
    case 'navy':
    default:
      return {
        bg: 'bg-gradient-to-br from-[#0a1832] via-[#0f2854] to-[#1c4386]',
        accent: 'text-blue-300',
        badge: 'bg-blue-400/20 text-blue-200 border-blue-400/30',
        border: 'border-blue-500/30 shadow-blue-950/40'
      };
  }
}

// فرمت‌بندی شماره کارت ۱۶ رقمی به ۴ بلوک ۴ رقمی
function formatCardDisplay(num?: string): string {
  if (!num) return '';
  const digits = String(num).replace(/[^0-9]/g, '');
  if (digits.length === 16) {
    return `${digits.slice(0, 4)} - ${digits.slice(4, 8)} - ${digits.slice(8, 12)} - ${digits.slice(12, 16)}`;
  }
  return num;
}

// فرمت‌بندی شماره شبا به صورت استاندارد IR...
function formatShebaDisplay(sheba?: string): string {
  if (!sheba) return '';
  const clean = String(sheba).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean.startsWith('IR') && clean.length === 24) {
    return `IR${clean}`;
  }
  return clean;
}

export default function QuickReceiptSubmission() {
  const [settings, setSettings] = useState(storage.getSettings());
  const config: QuickReceiptConfig = settings.quickReceiptConfig || {
    enabled: true,
    pageTitle: 'سامانه ارسال سریع فیش واریزی',
    pageSubtitle: 'ثبت آنی و آسان فیش‌های پرداختی شهریه و امور رفاهی بدون نیاز به ورود به پورتال',
    noticeTitle: 'اطلاعیه و راهنمای مهم قبل از واریز وجه',
    noticeText: 'دانشجویان گرامی لطفاً مبالغ واریزی را صرفاً به حساب‌های رسمی مرکز واریز فرموده و تصویر واضح رسید را بارگذاری فرمایید.',
    guidelines: [
      'واریز را ترجیحاً با کارت به نام دانشجو انجام داده و یا نام دانشجو را در توضیحات قید فرمایید.',
      'رسیدهای ارسالی ظرف حداکثر ۲۴ الی ۴۸ ساعت کاری توسط امور مالی بررسی و در سامانه اعمال خواهد شد.',
      'اصل فیش بانکی یا تصویر تراکنش را تا پایان نیم‌سال تحصیلی جاری نزد خود نگهداری فرمایید.'
    ],
    receiptReviewDays: 'حداکثر ۲۴ الی ۴۸ ساعت اداری',
    supportPhone: '۰۷۷-۳۵۳۲۰۰۰۰ (داخلی ۱۰۲)',
    maxFileSizeMB: 10,
    allowStudentAutoLookup: true,
    requireNationalCode: true,
    requireStudentMobile: true,
    requireFullName: true,
    requireCategory: true,
    requireDepositDate: true,
    requireAmount: true,
    requireReceiptUpload: true,
    showNoticeBox: true,
    showBankAccountsBox: true,
    showTrackingTab: true,
    showSupportContactBox: true,
    showFullNameField: true,
    showNationalCodeField: true,
    showMobileField: true,
    showCategoryField: true,
    showDepositDateField: true,
    showAmountField: true,
    showBankRefNumberField: true,
    showStudentNoteField: true,
    showReceiptUploadField: true,
    successTitle: 'فیش واریزی شما با موفقیت در سرور ثبت شد',
    successMessage: 'کد پیگیری اختصاصی برای رسید شما صادر گردید. کارشناسان امور مالی پس از بررسی بانکی، مبلغ را در پرونده شما منظور خواهند کرد.'
  };

  const bankAccounts: QuickReceiptBankAccount[] = (config.bankAccounts || config.accounts || []).filter(acc => acc.isActive !== false);
  const guidelines: string[] = config.importantGuidelines || config.guidelines || [];
  const maxFileMB = config.maxFileSizeMB || 10;

  // مدیریت تب‌های بالا
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

  // مقادیر فیلدهای فرم
  const today = getTodayJalali();
  const [nationalCode, setNationalCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [studentFoundInfo, setStudentFoundInfo] = useState<Student | null>(null);

  const [category, setCategory] = useState(
    config.categories && config.categories.length > 0 ? (config.categories[0].title || config.categories[0].label || 'شهریه متغیر') : 'شهریه متغیر'
  );
  const [rawAmount, setRawAmount] = useState('');
  const [currencyUnit, setCurrencyUnit] = useState<'toman' | 'rial'>('toman');
  const [depositDate, setDepositDate] = useState(today.formatted);
  const [bankRefNumber, setBankRefNumber] = useState('');
  const [description, setDescription] = useState('');

  // وضعیت آپلود تصویر یا فایل PDF رسید
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [isPdfReceipt, setIsPdfReceipt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // ارسال فرم و بازخورد
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submittedReceipt, setSubmittedReceipt] = useState<FinancialReceipt | null>(null);

  // بازخورد کپی
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // تب پیگیری فیش
  const [trackQuery, setTrackQuery] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackResults, setTrackResults] = useState<FinancialReceipt[] | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);

  // وضعیت باز/بسته بودن راهنما
  const [guidelinesOpen, setGuidelinesOpen] = useState(true);

  // همگام‌سازی با تغییرات تنظیمات در زمان واقعی
  useEffect(() => {
    const handleSettingsUpdate = () => {
      setSettings(storage.getSettings());
    };
    window.addEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    return () => {
      window.removeEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    };
  }, []);

  // هندلر کپی متن در کلیپ‌بورد با بازخورد تصویری
  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // جستجوی هوشمند دانشجو از روی کدملی در صورت فعال بودن
  const handleNationalCodeChange = (val: string) => {
    const clean = replacePersianWithEnglishDigits(val).replace(/\D/g, '').slice(0, 10);
    setNationalCode(clean);

    if (formErrors.nationalCode) {
      setFormErrors(prev => ({ ...prev, nationalCode: '' }));
    }

    if (config.allowStudentAutoLookup !== false && clean.length === 10) {
      const student = storage.lookupStudent(clean);
      if (student) {
        setStudentFoundInfo(student);
        if (!fullName || fullName === 'دانشجو') {
          const sName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
          setFullName(sName || (student as any).name || '');
        }
        if (!mobile && (student.mobile || student.phone)) {
          setMobile(student.mobile || student.phone || '');
        }
      } else {
        setStudentFoundInfo(null);
      }
    } else {
      setStudentFoundInfo(null);
    }
  };

  // کنترل تغییر مبلغ با ارقام انگلیسی/فارسی
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = replacePersianWithEnglishDigits(e.target.value).replace(/\D/g, '');
    setRawAmount(clean);
    if (formErrors.amount) {
      setFormErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  // محاسبه مبالغ به تومان و ریال و تبدیل به حروف
  const computedAmountNumber = parseInt(rawAmount || '0', 10);
  const amountInRials = currencyUnit === 'toman' ? computedAmountNumber * 10 : computedAmountNumber;
  const amountInTomans = currencyUnit === 'toman' ? computedAmountNumber : Math.floor(computedAmountNumber / 10);
  const amountInWords = computedAmountNumber > 0
    ? (currencyUnit === 'toman'
        ? `${numberToPersianWords(computedAmountNumber)} تومان`
        : `${numberToPersianWords(computedAmountNumber)} ریال (معادل ${formatPersianDigitSeparators(amountInTomans)} تومان)`)
    : '';

  // انتخاب و بارگذاری فایل رسید با سقف ۱۰ مگابایت
  const handleFileSelect = (file: File) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      setFormErrors(prev => ({ ...prev, image: 'لطفاً یک فایل تصویری (JPG, PNG, WEBP) یا فایل PDF رسید انتخاب فرمایید.' }));
      return;
    }

    if (file.size > maxFileMB * 1024 * 1024) {
      setFormErrors(prev => ({ ...prev, image: `حجم فایل انتخاب شده نباید بیشتر از ${toPersianDigits(maxFileMB)} مگابایت باشد.` }));
      return;
    }

    setIsPdfReceipt(isPdf);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
      setReceiptFileName(file.name);
      setFormErrors(prev => ({ ...prev, image: '' }));
    };
    reader.readAsDataURL(file);
  };

  // اعتبارسنجی مقادیر فرم بر اساس تنظیمات ادمین
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // بررسی نام دانشجو
    if (config.showFullNameField !== false && config.requireFullName !== false) {
      if (!fullName.trim()) {
        errors.fullName = 'لطفاً نام و نام خانوادگی دانشجو را وارد فرمایید.';
      }
    }

    // بررسی کد ملی
    if (config.showNationalCodeField !== false && config.requireNationalCode !== false) {
      const cleanNat = replacePersianWithEnglishDigits(nationalCode).replace(/\D/g, '');
      if (!cleanNat) {
        errors.nationalCode = 'کد ملی ۱۰ رقمی الزامی است.';
      } else if (cleanNat.length !== 10) {
        errors.nationalCode = 'کد ملی باید دقیقاً ۱۰ رقم باشد.';
      }
    }

    // بررسی شماره همراه
    if (config.showMobileField !== false && config.requireStudentMobile !== false) {
      const cleanMob = replacePersianWithEnglishDigits(mobile).replace(/\D/g, '');
      if (!cleanMob) {
        errors.mobile = 'شماره همراه الزامی است.';
      } else if (!/^09\d{9}$/.test(cleanMob)) {
        errors.mobile = 'شماره همراه معتبر نیست (مثال: ۰۹۱۷۱۲۳۴۵۶۷).';
      }
    }

    // بررسی سرفصل
    if (config.showCategoryField !== false && config.requireCategory) {
      if (!category.trim()) {
        errors.category = 'لطفاً بابت واریز (سرفصل مالی) را مشخص فرمایید.';
      }
    }

    // بررسی مبلغ واریز
    if (config.showAmountField !== false && config.requireAmount !== false) {
      if (!computedAmountNumber || computedAmountNumber <= 0) {
        errors.amount = 'لطفاً مبلغ واریزی را به صورت صحیح وارد فرمایید.';
      }
    }

    // بررسی تاریخ واریز
    if (config.showDepositDateField !== false && config.requireDepositDate !== false) {
      if (!depositDate) {
        errors.date = 'لطفاً تاریخ واریز را مشخص فرمایید.';
      }
    }

    // بررسی شماره ارجاع بانکی
    if (config.showBankRefNumberField !== false && config.requireBankRefNumber) {
      if (!bankRefNumber.trim()) {
        errors.bankRefNumber = 'شماره پیگیری / ارجاع بانکی الزامی است.';
      }
    }

    // بررسی یادداشت دانشجو
    if (config.showStudentNoteField !== false && config.requireStudentNote) {
      if (!description.trim()) {
        errors.description = 'توضیحات واریز الزامی است.';
      }
    }

    // بررسی بارگذاری تصویر فیش
    if (config.showReceiptUploadField !== false && config.requireReceiptUpload !== false) {
      if (!receiptImage) {
        errors.image = 'بارگذاری تصویر فیش یا فایل رسید واریزی الزامی است.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ارسال نهایی فیش به سرور
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const cleanNat = replacePersianWithEnglishDigits(nationalCode).replace(/\D/g, '');
      const cleanMob = replacePersianWithEnglishDigits(mobile).replace(/\D/g, '');
      const cleanRef = replacePersianWithEnglishDigits(bankRefNumber).trim();

      const result = await storage.addQuickReceipt({
        userName: fullName.trim() || 'دانشجو',
        userNationalId: cleanNat,
        studentMobile: cleanMob,
        amount: String(amountInRials),
        date: depositDate,
        category: category || 'شهریه',
        bankRefNumber: cleanRef,
        description: description.trim(),
        imageUrl: receiptImage
      });

      if (result) {
        setSubmittedReceipt(result);
      }
    } catch (err) {
      console.error('Error submitting quick receipt:', err);
      setFormErrors({ submit: 'متأسفانه در ثبت فیش در سرور خطایی رخ داد. لطفاً مجدداً تلاش فرمایید.' });
    } finally {
      setSubmitting(false);
    }
  };

  // بازنشانی فرم برای ثبت فیش دیگر
  const handleResetForm = () => {
    setSubmittedReceipt(null);
    setNationalCode('');
    setFullName('');
    setMobile('');
    setStudentFoundInfo(null);
    setRawAmount('');
    setBankRefNumber('');
    setDescription('');
    setReceiptImage('');
    setReceiptFileName('');
    setIsPdfReceipt(false);
    setFormErrors({});
  };

  // جستجوی وضعیت فیش در سرور و لوکال
  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawQ = trackQuery.trim();
    if (!rawQ) return;

    const cleanQ = replacePersianWithEnglishDigits(rawQ).trim();
    setTrackingLoading(true);
    setTrackSearched(true);
    try {
      const results = await storage.trackReceipt(cleanQ);
      setTrackResults(results);
    } catch (err) {
      console.error('Tracking query error:', err);
      setTrackResults([]);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-4 md:pt-8 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors bg-white px-3.5 py-2 rounded-xl shadow-xs border border-slate-200"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به صفحه اصلی</span>
          </Link>
          
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>سامانه امن امور مالی دانشگاه</span>
          </div>
        </div>

        {/* Hero Header Card */}
        <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold border border-white/20">
                <Receipt className="w-3.5 h-3.5" />
                <span>امور مالی و شهریه دانشگاه</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {config.pageTitle || 'سامانه ارسال مستقیم فیش واریزی'}
              </h1>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed max-w-2xl font-medium">
                {config.pageSubtitle || 'ثبت آنی و آسان فیش‌های پرداختی شهریه و امور رفاهی بدون نیاز به ورود به پورتال'}
              </p>
            </div>

            {/* Sub-tab Navigation (if tracking enabled) */}
            {config.showTrackingTab !== false && (
              <div className="flex bg-black/20 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('submit')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'submit'
                      ? 'bg-white text-blue-900 shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>ارسال فیش جدید</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('track')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'track'
                      ? 'bg-white text-blue-900 shadow-md'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>پیگیری وضعیت فیش</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: SUBMISSION FORM */}
        {activeTab === 'submit' && (
          <div className="space-y-8">
            
            {/* Screen 1: Success State */}
            {submittedReceipt ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-500/5 p-6 sm:p-10 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-800">
                    {config.successTitle || 'فیش واریزی با موفقیت در سرور ثبت شد'}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
                    {config.successMessage || 'کد پیگیری اختصاصی برای رسید شما صادر گردید. کارشناسان امور مالی پس از بررسی بانکی، مبلغ را در پرونده شما منظور خواهند کرد.'}
                  </p>
                </div>

                {/* Tracking Code Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto space-y-2 text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    کد پیگیری اختصاصی شما
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-persian text-2xl sm:text-3xl font-black text-blue-700 tracking-wider select-all" dir="ltr">
                      {submittedReceipt.trackingCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(submittedReceipt.trackingCode, 'receipt-tracking')}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-xs"
                      title="کپی کد پیگیری"
                    >
                      {copiedKey === 'receipt-tracking' ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 font-medium pt-1">
                    لطفاً این کد را برای استعلام‌های بعدی نزد خود نگهداری فرمایید.
                  </p>
                </div>

                {/* Submitted Summary Info */}
                <div className="bg-blue-50/50 rounded-2xl p-5 max-w-xl mx-auto border border-blue-100 text-right space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-blue-100">
                    <span className="text-slate-500 font-medium">نام دانشجو:</span>
                    <span className="font-bold text-slate-800">{submittedReceipt.userName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-blue-100">
                    <span className="text-slate-500 font-medium">کد ملی:</span>
                    <span className="font-bold text-slate-800 dir-ltr text-right">
                      {toPersianDigits(submittedReceipt.studentId || submittedReceipt.userNationalId || '-')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-blue-100">
                    <span className="text-slate-500 font-medium">مبلغ واریزی:</span>
                    <span className="font-extrabold text-blue-700">
                      {formatPersianDigitSeparators(Math.floor(parseInt(submittedReceipt.amount || '0', 10) / 10))} تومان
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-blue-100">
                    <span className="text-slate-500 font-medium">تاریخ واریز:</span>
                    <span className="font-bold text-slate-800">{toPersianDigits(submittedReceipt.date)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-500 font-medium">بابت:</span>
                    <span className="font-bold text-slate-800">{submittedReceipt.category || 'شهریه'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  {config.showTrackingTab !== false && (
                    <button
                      type="button"
                      onClick={() => {
                        setTrackQuery(submittedReceipt.trackingCode);
                        setActiveTab('track');
                      }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>پیگیری این فیش</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>چاپ رسید</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all"
                  >
                    ثبت یک فیش دیگر
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Official Bank Accounts Box */}
                {config.showBankAccountsBox !== false && bankAccounts.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <span>حساب‌های رسمی واریز وجه مرکز</span>
                      </h2>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        مورد تأیید امور مالی
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {bankAccounts.map((acc, index) => {
                        const rawCard = String(acc.cardNumber || '').replace(/\D/g, '');
                        const rawSheba = formatShebaDisplay(acc.shebaNumber);
                        const rawAcc = toEnglishDigits(acc.accountNumber || '').replace(/\D/g, '');
                        const cardBlocks = getCardBlocks(acc.cardNumber);
                        const theme = getCardThemeClasses(acc.cardTheme || 'navy');

                        return (
                          <div 
                            key={acc.id || index}
                            className={`group relative overflow-hidden rounded-[26px] p-6 sm:p-7 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between min-h-[250px] border ${theme.bg} ${theme.border}`}
                          >
                            {/* Watermark and glossy reflection */}
                            <div className="absolute -right-16 -top-16 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute -left-16 -bottom-16 w-52 h-52 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />

                            {/* Card Header: Bank Logo + EMV Chip & NFC */}
                            <div className="flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                                  <Building2 className={`w-5 h-5 ${theme.accent}`} />
                                </div>
                                <div>
                                  <span className="font-black text-base sm:text-lg text-white block tracking-tight">
                                    {acc.bankName}
                                  </span>
                                  <span className="text-[11px] font-bold text-white/70 block">
                                    حساب رسمی واریز مرکز
                                  </span>
                                </div>
                              </div>

                              {/* Realistic EMV Metallic Smart Chip & Contactless Waves */}
                              <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-white/70 -rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                  <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                                  <path d="M12 19a8.5 8.5 0 0 1 0-14" />
                                  <path d="M15.5 21.5a12 12 0 0 1 0-19" />
                                </svg>
                                
                                <div className="relative w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-200 p-0.5 shadow-md border border-amber-600/50 overflow-hidden flex items-center justify-center shrink-0">
                                  <div className="w-full h-full rounded-[5px] border border-amber-800/40 relative grid grid-cols-3 grid-rows-2">
                                    <div className="border-r border-b border-amber-800/40" />
                                    <div className="border-b border-amber-800/40" />
                                    <div className="border-l border-b border-amber-800/40" />
                                    <div className="border-r border-amber-800/40" />
                                    <div className="" />
                                    <div className="border-l border-amber-800/40" />
                                    <div className="absolute inset-x-1.5 inset-y-1 rounded-xs border border-amber-900/40 bg-amber-400/30" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 16-Digit Card Number with Persian Digits & Copy */}
                            {acc.cardNumber && (
                              <div className="my-4 relative z-10">
                                <div className="flex items-center justify-between mb-1.5 px-0.5">
                                  <span className="text-[11px] font-bold text-white/80">شماره ۱۶ رقمی کارت:</span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${theme.badge}`}>
                                    عضو شتاب
                                  </span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-black/30 hover:bg-black/40 transition-colors p-3 rounded-2xl border border-white/15 backdrop-blur-md">
                                  <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 font-black text-lg sm:text-xl tracking-widest text-white select-all font-persian" dir="ltr">
                                    {cardBlocks.map((b, i) => (
                                      <span key={i} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                        {toPersianDigits(b)}
                                      </span>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(rawCard, `card-${acc.id || index}`)}
                                    className="self-end sm:self-auto text-xs font-black bg-white/20 hover:bg-amber-400 hover:text-slate-950 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-white border border-white/25 shadow-sm active:scale-95 cursor-pointer"
                                    title="کپی شماره کارت ۱۶ رقمی"
                                  >
                                    {copiedKey === `card-${acc.id || index}` ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                                        <span className="text-emerald-300 font-black">کپی شد!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>کپی شماره کارت</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Card Footer: Account Owner, Sheba, Account Number */}
                            <div className="pt-3 border-t border-white/15 relative z-10 space-y-2 text-xs">
                              <div className="flex items-center justify-between text-white/95">
                                <span className="text-white/65 font-bold">صاحب حساب:</span>
                                <span className="font-black text-white text-right flex items-center gap-1.5">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span>{acc.accountOwner}</span>
                                </span>
                              </div>

                              {acc.shebaNumber && (
                                <div className="flex items-center justify-between text-white/95 pt-0.5">
                                  <span className="text-white/65 font-bold">شماره شبا (IBAN):</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold dir-ltr text-amber-300 tracking-wider font-persian text-xs">
                                      {toPersianDigits(rawSheba)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(rawSheba, `sheba-${acc.id || index}`)}
                                      className="p-1 hover:text-amber-300 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
                                      title="کپی شماره شبا"
                                    >
                                      {copiedKey === `sheba-${acc.id || index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {acc.accountNumber && (
                                <div className="flex items-center justify-between text-white/95">
                                  <span className="text-white/65 font-bold">شماره حساب:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold dir-ltr font-persian text-xs">
                                      {toPersianDigits(acc.accountNumber)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(rawAcc, `acc-${acc.id || index}`)}
                                      className="p-1 hover:text-blue-300 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
                                      title="کپی شماره حساب"
                                    >
                                      {copiedKey === `acc-${acc.id || index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notice & Guidelines Accordion Box */}
                {config.showNoticeBox !== false && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 sm:p-6 transition-all">
                    <button
                      type="button"
                      onClick={() => setGuidelinesOpen(!guidelinesOpen)}
                      className="w-full flex items-center justify-between text-right font-extrabold text-amber-900 text-sm sm:text-base focus:outline-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <span>{config.noticeTitle || 'راهنما و نکات مهم پیش از واریز وجه'}</span>
                      </div>
                      {guidelinesOpen ? <ChevronUp className="w-5 h-5 text-amber-700" /> : <ChevronDown className="w-5 h-5 text-amber-700" />}
                    </button>

                    <AnimatePresence>
                      {guidelinesOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3.5 pt-3.5 border-t border-amber-200/80 space-y-2.5 text-xs sm:text-sm text-amber-900/90 leading-relaxed font-medium"
                        >
                          {config.noticeText && (
                            <p className="pb-1 text-amber-950 font-bold">{config.noticeText}</p>
                          )}
                          {guidelines.length > 0 && (
                            <ul className="space-y-1.5 list-disc list-inside text-amber-800 pr-1">
                              {guidelines.map((g, idx) => (
                                <li key={idx}>{g}</li>
                              ))}
                            </ul>
                          )}
                          {config.supportPhone && (
                            <div className="pt-2 flex items-center gap-2 text-xs font-bold text-amber-900">
                              <Phone className="w-4 h-4 text-amber-700" />
                              <span>پشتیبانی امور مالی: {toPersianDigits(config.supportPhone)}</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Main Submission Form */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>فرم ثبت اطلاعات فیش واریزی</span>
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      لطفاً مشخصات پرداخت خود را مطابق با رسید بانکی تکمیل نمایید.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Student Info Group */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      
                      {/* National Code Field */}
                      {config.showNationalCodeField !== false && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">
                            کد ملی دانشجو {config.requireNationalCode !== false && <span className="text-rose-500">*</span>}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={nationalCode ? toPersianDigits(nationalCode) : ''}
                              onChange={(e) => handleNationalCodeChange(e.target.value)}
                              placeholder="۱۰ رقم کد ملی"
                              maxLength={10}
                              dir="rtl"
                              className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-800 font-bold text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 text-right font-persian ${
                                formErrors.nationalCode 
                                  ? 'border-rose-300 focus:ring-rose-500/20' 
                                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                              }`}
                            />
                            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                          </div>
                          {formErrors.nationalCode && (
                            <p className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{formErrors.nationalCode}</span>
                            </p>
                          )}
                          {studentFoundInfo && (
                            <p className="text-xs text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>شناسایی شد: {studentFoundInfo.name || `${studentFoundInfo.firstName} ${studentFoundInfo.lastName}`} ({studentFoundInfo.field || 'دانشجو'})</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Full Name Field */}
                      {config.showFullNameField !== false && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">
                            نام و نام خانوادگی دانشجو {config.requireFullName !== false && <span className="text-rose-500">*</span>}
                          </label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => {
                              setFullName(e.target.value);
                              if (formErrors.fullName) setFormErrors(prev => ({ ...prev, fullName: '' }));
                            }}
                            placeholder="مثلاً: علیرضا محمدی"
                            dir="rtl"
                            className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-800 font-bold text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 font-persian ${
                              formErrors.fullName 
                                ? 'border-rose-300 focus:ring-rose-500/20' 
                                : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                            }`}
                          />
                          {formErrors.fullName && (
                            <p className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{formErrors.fullName}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Mobile Phone Field */}
                      {config.showMobileField !== false && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">
                            شماره تلفن همراه {config.requireStudentMobile !== false && <span className="text-rose-500">*</span>}
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={mobile ? toPersianDigits(mobile) : ''}
                              onChange={(e) => {
                                const clean = replacePersianWithEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 11);
                                setMobile(clean);
                                if (formErrors.mobile) setFormErrors(prev => ({ ...prev, mobile: '' }));
                              }}
                              placeholder="مثال: ۰۹۱۷۱۲۳۴۵۶۷"
                              maxLength={11}
                              dir="rtl"
                              className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-800 font-bold text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 text-right font-persian ${
                                formErrors.mobile 
                                  ? 'border-rose-300 focus:ring-rose-500/20' 
                                  : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                              }`}
                            />
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                          </div>
                          {formErrors.mobile && (
                            <p className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{formErrors.mobile}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Payment Category & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      
                      {/* Payment Category Field */}
                      {config.showCategoryField !== false && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">
                            بابت و سرفصل واریزی {config.requireCategory && <span className="text-rose-500">*</span>}
                          </label>
                          <div className="relative">
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              dir="rtl"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none font-persian"
                            >
                              {config.categories?.filter(c => c.isActive !== false).map(cat => {
                                const catName = cat.title || cat.label || '';
                                return (
                                  <option key={cat.id} value={catName}>{catName}</option>
                                );
                              })}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                          </div>
                          {formErrors.category && (
                            <p className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{formErrors.category}</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Deposit Date Field */}
                      {config.showDepositDateField !== false && (
                        <div>
                          <PersianDatePicker
                            value={depositDate}
                            onChange={(newDate) => {
                              setDepositDate(newDate);
                              if (formErrors.date) setFormErrors(prev => ({ ...prev, date: '' }));
                            }}
                            label="تاریخ واریز وجه"
                            required={config.requireDepositDate !== false}
                            error={formErrors.date}
                          />
                        </div>
                      )}
                    </div>

                    {/* Amount Field */}
                    {config.showAmountField !== false && (
                      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700">
                            مبلغ واریز شده {config.requireAmount !== false && <span className="text-rose-500">*</span>}
                          </label>

                          {/* Currency Toggle */}
                          <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => setCurrencyUnit('toman')}
                              className={`px-3 py-1 rounded-lg transition-all ${
                                currencyUnit === 'toman'
                                  ? 'bg-white text-blue-700 shadow-xs font-black'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              تومان
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrencyUnit('rial')}
                              className={`px-3 py-1 rounded-lg transition-all ${
                                currencyUnit === 'rial'
                                  ? 'bg-white text-blue-700 shadow-xs font-black'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              ریال
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            value={rawAmount ? formatPersianDigitSeparators(rawAmount) : ''}
                            onChange={handleAmountChange}
                            placeholder="مثلاً: ۱,۵۰۰,۰۰۰"
                            dir="rtl"
                            className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 font-extrabold text-lg transition-all focus:outline-none focus:ring-2 text-right font-persian ${
                              formErrors.amount
                                ? 'border-rose-300 focus:ring-rose-500/20'
                                : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                            }`}
                          />
                          <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-400">
                            {currencyUnit === 'toman' ? 'تومان' : 'ریال'}
                          </span>
                        </div>

                        {/* Amount in Persian Words */}
                        {amountInWords ? (
                          <div className="text-xs text-blue-700 bg-blue-50 px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 border border-blue-100">
                            <Tag className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span>به حروف: {amountInWords}</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 font-medium">
                            رقم به صورت خودکار سه رقم سه رقم تفکیک و به حروف نمایش داده می‌شود.
                          </p>
                        )}

                        {formErrors.amount && (
                          <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{formErrors.amount}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bank Ref Number & Student Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Bank Ref Number Field */}
                      {config.showBankRefNumberField !== false && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">
                            شماره پیگیری / ارجاع بانکی {config.requireBankRefNumber ? <span className="text-rose-500">*</span> : '(اختیاری)'}
                          </label>
                          <input
                            type="text"
                            value={bankRefNumber ? toPersianDigits(bankRefNumber) : ''}
                            onChange={(e) => {
                              const clean = replacePersianWithEnglishDigits(e.target.value).replace(/\D/g, '');
                              setBankRefNumber(clean);
                              if (formErrors.bankRefNumber) setFormErrors(prev => ({ ...prev, bankRefNumber: '' }));
                            }}
                            placeholder="کد ارجاع درج شده روی رسید بانکی"
                            dir="rtl"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right font-persian"
                          />
                          {formErrors.bankRefNumber ? (
                            <p className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{formErrors.bankRefNumber}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 mt-1">
                              جهت تسریع در فرآیند تطبیق بانکی پیشنهاد می‌شود وارد نمایید.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Student Note Field */}
                      {config.showStudentNoteField !== false && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">
                            توضیحات تکمیلی دانشجو {config.requireStudentNote ? <span className="text-rose-500">*</span> : '(اختیاری)'}
                          </label>
                          <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="مثلاً: قسط دوم شهریه ترم جاری"
                            dir="rtl"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-persian"
                          />
                          {formErrors.description && (
                            <p className="text-xs text-rose-500 font-bold mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>{formErrors.description}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Receipt Upload Field (10 MB Limit) */}
                    {config.showReceiptUploadField !== false && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          تصویر یا فایل PDF رسید واریز {config.requireReceiptUpload !== false && <span className="text-rose-500">*</span>}
                        </label>

                        {receiptImage ? (
                          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                            <div className="flex items-center gap-3">
                              {isPdfReceipt ? (
                                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-bold text-xs">
                                  PDF
                                </div>
                              ) : (
                                <img
                                  src={receiptImage}
                                  alt="پیش‌نمایش فیش"
                                  className="w-14 h-14 object-cover rounded-xl border border-slate-200 cursor-pointer shadow-xs"
                                  onClick={() => setPreviewModalOpen(true)}
                                />
                              )}
                              <div>
                                <p className="text-xs font-bold text-slate-800 truncate max-w-xs">
                                  {receiptFileName || 'فایل رسید پیوست شده'}
                                </p>
                                {!isPdfReceipt && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewModalOpen(true)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 mt-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>مشاهده تصویر در ابعاد اصلی</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setReceiptImage('');
                                setReceiptFileName('');
                                setIsPdfReceipt(false);
                              }}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                              title="حذف و انتخاب فایل دیگر"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handleFileSelect(e.dataTransfer.files[0]);
                              }
                            }}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                              isDragging
                                ? 'border-blue-500 bg-blue-50/50'
                                : formErrors.image
                                ? 'border-rose-300 bg-rose-50/30'
                                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                            }`}
                            onClick={() => {
                              const fileInput = document.getElementById('receipt-file-input');
                              if (fileInput) fileInput.click();
                            }}
                          >
                            <input
                              id="receipt-file-input"
                              type="file"
                              accept="image/png, image/jpeg, image/webp, application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileSelect(e.target.files[0]);
                                }
                              }}
                            />
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                              <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-700">
                              برای انتخاب فایل کلیک کنید یا تصویر/فایل را به اینجا بکشید
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              فرمت‌های مجاز: تصاویر (JPG، PNG، WEBP) یا رسید PDF (حداکثر حجم مجاز: {toPersianDigits(maxFileMB)} مگابایت)
                            </p>
                          </div>
                        )}

                        {formErrors.image && (
                          <p className="text-xs text-rose-500 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{formErrors.image}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Submit Error */}
                    {formErrors.submit && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{formErrors.submit}</span>
                      </div>
                    )}

                    {/* Submit Action Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-base shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>در حال ثبت و ذخیره فیش در سرور...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>ثبت و ارسال نهایی فیش واریزی</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: TRACKING STATUS */}
        {activeTab === 'track' && config.showTrackingTab !== false && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  <span>پیگیری وضعیت فیش‌های ثبت‌شده در سرور</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  کد پیگیری اختصاصی فیش، کد ملی دانشجو، یا شماره تلفن همراه را وارد نمایید.
                </p>
              </div>

              <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={trackQuery}
                    onChange={(e) => setTrackQuery(e.target.value)}
                    placeholder="کد پیگیری (مثال: KOW-260910-12345) یا شماره ملی یا شماره همراه"
                    dir="rtl"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold text-sm transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-persian"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />
                </div>

                <button
                  type="submit"
                  disabled={trackingLoading || !trackQuery.trim()}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 flex-shrink-0 cursor-pointer"
                >
                  {trackingLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>جستجو و پیگیری</span>
                </button>
              </form>
            </div>

            {/* Tracking Results */}
            {trackSearched && (
              <div className="space-y-4">
                {trackResults && trackResults.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-700">
                      نتایج استعلام از سرور ({toPersianDigits(trackResults.length)} مورد):
                    </h3>

                    {trackResults.map((receipt) => {
                      const amountToman = Math.floor(parseInt(receipt.amount || '0', 10) / 10);
                      const isApproved = receipt.status === 'approved';
                      const isRejected = receipt.status === 'rejected';
                      const isPending = receipt.status === 'pending';

                      return (
                        <div
                          key={receipt.id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-base text-slate-900">{receipt.userName}</span>
                                <span className="text-xs text-slate-400">
                                  ({toPersianDigits(receipt.studentId || receipt.userNationalId)})
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2">
                                <span>کد پیگیری:</span>
                                <span className="font-black text-blue-700 select-all inline-block tracking-wider px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-persian" dir="ltr">
                                  {receipt.trackingCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(receipt.trackingCode, `track-${receipt.id}`)}
                                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                  title="کپی کد پیگیری"
                                >
                                  {copiedKey === `track-${receipt.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {isPending && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>در حال بررسی امور مالی</span>
                                </span>
                              )}
                              {isApproved && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>تأیید و در سیستم اعمال شد</span>
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>عدم تأیید / نیازمند اصلاح</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Detail Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="bg-slate-50 p-2.5 rounded-xl">
                              <span className="text-slate-400 block mb-1">مبلغ واریز:</span>
                              <span className="font-extrabold text-slate-800">
                                {formatPersianDigitSeparators(amountToman)} تومان
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl">
                              <span className="text-slate-400 block mb-1">تاریخ واریز:</span>
                              <span className="font-bold text-slate-800">{toPersianDigits(receipt.date)}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl">
                              <span className="text-slate-400 block mb-1">بابت:</span>
                              <span className="font-bold text-slate-800">{receipt.category || 'شهریه'}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl">
                              <span className="text-slate-400 block mb-1">شماره ارجاع بانکی:</span>
                              <span className="font-bold text-slate-800">
                                {receipt.bankRefNumber ? toPersianDigits(receipt.bankRefNumber) : '-'}
                              </span>
                            </div>
                          </div>

                          {/* Admin Feedback */}
                          {receipt.adminMessage && (
                            <div className={`p-3.5 rounded-xl text-xs font-medium border ${
                              isApproved 
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                                : isRejected
                                ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                                : 'bg-blue-50/70 border-blue-200 text-blue-900'
                            }`}>
                              <span className="font-bold block mb-1">پیام کارشناس امور مالی:</span>
                              <p className="leading-relaxed">{receipt.adminMessage}</p>
                            </div>
                          )}

                          {/* Attached Receipt Thumbnail */}
                          {receipt.imageUrl && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-xs text-slate-400 font-medium">تصویر رسید پیوست:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setReceiptImage(receipt.imageUrl);
                                  setPreviewModalOpen(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>مشاهده تصویر رسید</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">هیچ فیشی با مشخصات وارد شده یافت نشد</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      لطفاً از صحت کد پیگیری، شماره ملی یا شماره تلفن همراه وارد شده اطمینان حاصل نموده و مجدداً جستجو فرمایید.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Support Contact Box */}
        {config.showSupportContactBox !== false && config.supportPhone && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-800 block">نیاز به راهنمایی در پرداخت دارید؟</span>
                <span className="text-slate-500">واحد امور مالی و شهریه در ساعات اداری پاسخگوی سوالات شما می‌باشد.</span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-slate-800 dir-ltr">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>{toPersianDigits(config.supportPhone)}</span>
            </div>
          </div>
        )}

        {/* Universal Zoom Modal for Receipt Preview */}
        <AnimatePresence>
          {previewModalOpen && receiptImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl max-w-2xl w-full p-4 relative shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-sm font-bold text-slate-800">پیش‌نمایش تصویر فیش واریزی</span>
                  <button
                    type="button"
                    onClick={() => setPreviewModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-3 flex justify-center max-h-[75vh] overflow-auto">
                  <img
                    src={receiptImage}
                    alt="فیش واریزی"
                    className="max-h-[70vh] w-auto object-contain rounded-xl"
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
