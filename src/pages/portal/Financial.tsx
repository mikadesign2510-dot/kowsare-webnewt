import React, { useState, useEffect, useRef } from 'react';
import { storage, PortalUser, FinancialReceipt } from '../../lib/storage';
import { uploadFileToServer } from '../../lib/uploadHelper';
import { 
  Receipt, 
  Plus, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Check, 
  Coins, 
  FileText, 
  ShieldCheck, 
  Calendar, 
  Hash, 
  Info,
  Sparkles
} from 'lucide-react';
import { 
  toEnglishDigits, 
  toPersianDigits, 
  formatDigitSeparators, 
  formatPersianDigitSeparators, 
  formatRialToWords 
} from '../../lib/persianNumberHelper';

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { forwardRef } from 'react';

const CustomDateInput = forwardRef(({ openCalendar, handleValueChange, ...props }: any, ref: any) => {
  return (
    <input
      {...props}
      ref={ref}
      onClick={openCalendar}
      onChange={handleValueChange}
    />
  );
});


export default function PortalFinancial() {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [receipts, setReceipts] = useState<FinancialReceipt[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');

  // Form states
  const [rawAmount, setRawAmount] = useState(''); // Raw digits in Rials
  const [formattedDisplayAmount, setFormattedDisplayAmount] = useState(''); // Live formatted text with 3-digit separator
  const [separatorType, setSeparatorType] = useState<',' | '.' | '/'>('،' as any); // Separator option
  const [trackingCode, setTrackingCode] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const authData = localStorage.getItem('kowsar_portal_auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      setUser(parsed);
      setReceipts(storage.getReceipts().filter(r => r.userId === parsed.id));
    }
  }, []);

  // Today Shamsi/Gregorian helper for quick date fill
  useEffect(() => {
    if (!date) {
      const today = new Date().toLocaleDateString('fa-IR');
      setDate(today.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))));
    }
  }, [date]);

  // Handle amount change with live 3-digit formatting in Rials
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const cleanDigits = toEnglishDigits(inputVal);
    setRawAmount(cleanDigits);

    if (!cleanDigits) {
      setFormattedDisplayAmount('');
      return;
    }

    // Format with commas / chosen separator
    const sep = separatorType === '،' ? '،' : separatorType;
    const formatted = formatDigitSeparators(cleanDigits, sep === '،' ? ',' : (sep as any));
    setFormattedDisplayAmount(formatted);
  };

  const handleSeparatorChange = (newSep: ',' | '.' | '/') => {
    setSeparatorType(newSep);
    if (rawAmount) {
      const formatted = formatDigitSeparators(rawAmount, newSep);
      setFormattedDisplayAmount(formatted);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setSubmitError('');
      try {
        // Compress heavily for receipts (max 800px width, 60% quality)
        const result = await uploadFileToServer(file, 'receipts', 800, 0.6);
        if (result.success && result.url) {
          setImageUrl(result.url);
        } else {
          setSubmitError('خطا در آپلود تصویر رسید: ' + (result.message || 'فایل نامعتبر است'));
        }
      } catch (err: any) {
        setSubmitError('خطا در ارتباط با سرور: ' + (err.message || ''));
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!user) return;

    // Check if student account is still active
    const statusCheck = storage.isStudentActive(user.id || user.nationalCode);
    if (!statusCheck.isActive) {
      alert(statusCheck.reason || 'حساب کاربری شما غیرفعال شده است.');
      localStorage.removeItem('kowsar_portal_auth');
      window.location.href = '/portal/login?deactivated=1';
      return;
    }

    if (!rawAmount || Number(rawAmount) <= 0) {
      setSubmitError('لطفاً مبلغ واریزی معتبر به ریال وارد نمایید.');
      return;
    }

    if (!trackingCode.trim()) {
      setSubmitError('لطفاً کد پیگیری فیش یا تراکنش را وارد نمایید.');
      return;
    }

    // Save receipt with amount in Rials
    storage.addReceipt({
      userId: user.id,
      userName: user.name,
      studentId: user.studentId || '',
      amount: rawAmount, // stored in Rials
      trackingCode: toEnglishDigits(trackingCode),
      date: date || new Date().toLocaleDateString('fa-IR'),
      description: description.trim(),
      imageUrl: imageUrl || ''
    });

    // Add security audit trail
    storage.addSecurityLog({
      eventType: 'data_modified',
      severity: 'low',
      category: 'data',
      message: `ثبت رسید مالی جدید توسط دانشجو: ${user.name}`,
      userEmail: user.nationalCode,
      details: `مبلغ: ${formatPersianDigitSeparators(rawAmount)} ریال - کد پیگیری: ${trackingCode}`
    });

    setReceipts(storage.getReceipts().filter(r => r.userId === user.id));
    setViewMode('list');
    setRawAmount('');
    setFormattedDisplayAmount('');
    setTrackingCode('');
    setDescription('');
    setImageUrl('');
  };

  if (!user) return null;

  const amountCalculations = formatRialToWords(rawAmount);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">امور مالی و ثبت رسید شهریه</h1>
            <p className="text-slate-500 text-xs mt-1">ثبت فیش‌های بانکی، رهگیری وضعیت تاییدیه و گردش حساب</p>
          </div>
        </div>

        {viewMode === 'list' ? (
          <button 
            onClick={() => setViewMode('create')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 w-full sm:w-auto justify-center text-sm"
          >
            <Plus className="w-5 h-5" />
            ثبت رسید واریزی جدید
          </button>
        ) : (
          <button 
            onClick={() => setViewMode('list')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-bold transition-colors w-full sm:w-auto justify-center text-sm"
          >
            بازگشت به فهرست رسیدها
          </button>
        )}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-slate-400" />
              <h2 className="font-black text-slate-800 text-base">سوابق رسیدهای ثبت شده</h2>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">
              تعداد کل: {toPersianDigits(receipts.length)} رسید
            </span>
          </div>

          {receipts.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8" />
              </div>
              <p className="font-black text-slate-700 text-base mb-1">تا کنون رسیدی ثبت نکرده‌اید</p>
              <p className="text-slate-400 text-xs max-w-sm mx-auto mb-6">
                برای ثبت فیش واریز شهریه، خدمات دانشجویی یا گواهی‌ها از دکمه «ثبت رسید واریزی جدید» استفاده کنید.
              </p>
              <button
                onClick={() => setViewMode('create')}
                className="bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                ثبت اولین رسید
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600 text-xs font-bold">
                  <tr>
                    <th className="p-4">مبلغ واریزی (ریال / تومان)</th>
                    <th className="p-4">کد پیگیری فیش</th>
                    <th className="p-4">تاریخ پرداخت</th>
                    <th className="p-4">وضعیت تایید امور مالی</th>
                    <th className="p-4">تصویر فیش</th>
                    <th className="p-4">توضیحات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {receipts.map(receipt => {
                    const clean = toEnglishDigits(receipt.amount);
                    const rialFormatted = formatPersianDigitSeparators(clean, '،');
                    const tomanBig = clean ? BigInt(clean) / 10n : 0n;
                    const tomanFormatted = formatPersianDigitSeparators(tomanBig.toString(), '،');

                    return (
                      <tr key={receipt.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-4">
                          <div className="font-black text-slate-900 flex items-baseline gap-1">
                            <span className="text-base text-emerald-700">{rialFormatted}</span>
                            <span className="text-xs text-slate-500 font-normal">ریال</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            معادل: <span className="font-bold text-slate-600">{tomanFormatted}</span> تومان
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-700 text-xs">
                          {toPersianDigits(receipt.trackingCode)}
                        </td>
                        <td className="p-4 text-slate-600 text-xs">
                          {toPersianDigits(receipt.date)}
                        </td>
                        <td className="p-4">
                          {receipt.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-bold text-xs">
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                              در انتظار بررسی
                            </span>
                          ) : receipt.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              تایید شده
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl font-bold text-xs">
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                              رد شده
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {receipt.imageUrl ? (
                            <a
                              href={receipt.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 font-bold hover:underline inline-flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              مشاهده تصویر
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">ندارد</span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-slate-500 max-w-[200px] truncate">
                          {receipt.description || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Receipt Form */}
      {viewMode === 'create' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                فرم ثبت فیش و رسید واریزی (به ریال)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                مبلغ پرداختی را به **ریال** وارد نمایید؛ تفکیک ۳ رقم و معادل به تومان به صورت لحظه‌ای محاسبه می‌شود.
              </p>
            </div>
          </div>

          {submitError && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Amount Field with Live Formatting */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-slate-800 font-black text-sm">
                  مبلغ واریزی <span className="text-emerald-600">(به ریال)</span> <span className="text-red-500">*</span>
                </label>
                
                {/* Separator Style Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 p-1 rounded-xl">
                  <span className="px-1 text-[11px] font-bold">جداکننده:</span>
                  <button
                    type="button"
                    onClick={() => handleSeparatorChange(',')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${separatorType === ',' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    کاما (,)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSeparatorChange('.')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${separatorType === '.' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    نقطه (.)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSeparatorChange('/')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${separatorType === '/' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    اسلش (/)
                  </button>
                </div>
              </div>

              <div className="relative">
                <input 
                  type="text" 
                  inputMode="numeric"
                  required
                  value={formattedDisplayAmount}
                  onChange={handleAmountChange}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 rounded-2xl pr-12 pl-4 py-3.5 text-xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-left"
                  dir="ltr"
                  placeholder="25,000,000"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
                  ریال
                </span>
              </div>

              {/* Dynamic Live Conversion Card */}
              {rawAmount && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 p-4 rounded-2xl space-y-2 mt-2 shadow-sm animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center justify-between text-xs font-bold text-emerald-950 gap-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>مبلغ به ریال:</span>
                      <span className="text-sm font-black text-emerald-700">
                        {amountCalculations.rialFormatted} ریال
                      </span>
                    </div>
                    <div className="bg-emerald-100/70 text-emerald-900 px-2.5 py-1 rounded-xl text-xs">
                      معادل: <span className="font-black text-sm">{amountCalculations.tomanFormatted}</span> تومان
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 text-xs text-emerald-900 space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-emerald-800 shrink-0">به حروف (تومان):</span>
                      <span className="font-black text-emerald-950">{amountCalculations.tomanWords}</span>
                    </div>
                    <div className="flex items-start gap-1 text-[11px] text-emerald-700">
                      <span className="shrink-0 font-medium">به حروف (ریال):</span>
                      <span>{amountCalculations.rialWords}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tracking Code and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-800 font-bold mb-2 text-sm flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-slate-400" />
                  کد پیگیری تراکنش / شماره فیش <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={trackingCode}
                  onChange={e => setTrackingCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                  placeholder="مثال: ۹۸۴۵۲۱۰۳۴"
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-slate-800 font-bold mb-2 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  تاریخ پرداخت <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={date}
                  onChange={(dateObject: any) => {
                    setDate(dateObject?.format?.("YYYY/MM/DD") || '');
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  render={<CustomDateInput 
                    required
                    placeholder="مثال: ۱۴۰۳/۰۶/۰۱"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                  />}
                  containerClassName="w-full"
                />
              </div>
            </div>

            {/* Receipt Image Upload */}
            <div>
              <label className="block text-slate-800 font-bold mb-2 text-sm">
                تصویر یا اسکن فیش واریزی
              </label>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              {imageUrl ? (
                <div className="relative border border-emerald-200 rounded-2xl p-4 bg-emerald-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={imageUrl} alt="رسید" className="w-16 h-16 object-cover rounded-xl border border-emerald-200 shadow-sm" />
                    <div>
                      <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-600" />
                        تصویر رسید در سرور ذخیره شد
                      </span>
                      <a href={imageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline block mt-1">
                        مشاهده تصویر بزرگ
                      </a>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setImageUrl(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-xs text-red-600 hover:text-red-700 font-bold px-3 py-1.5 bg-white rounded-xl border border-red-200 shadow-sm transition-colors"
                  >
                    تغییر فایل
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition-all ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-10 h-10 mb-2 text-emerald-600 animate-spin" />
                      <span className="text-sm font-bold text-slate-800">در حال آپلود رسید به سرور...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 mb-2 text-emerald-500" />
                      <span className="text-sm font-bold text-slate-800">برای انتخاب یا بارگذاری تصویر فیش کلیک کنید</span>
                      <span className="text-xs text-slate-400 mt-1">فرمت‌های مجاز: JPG, PNG (ذخیره مطمئن در سرور)</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-800 font-bold mb-2 text-sm">
                توضیحات و بابت پرداخت (اختیاری)
              </label>
              <textarea 
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="مثال: شهریه متغیر نیمسال اول یا هزینه صدور گواهی اشتغال به تحصیل..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              ></textarea>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl transition-all w-full shadow-lg shadow-emerald-600/20 text-sm flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                ثبت نهایی رسید و ارسال به امور مالی
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                پس از بررسی کارشناس مالی مرکز، وضعیت تایید یا رد در همین صفحه منعکس خواهد شد.
              </p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
