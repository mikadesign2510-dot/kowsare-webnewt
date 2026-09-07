import React, { useState } from 'react';
import { 
  PortalSettings, 
  PortalAnnouncement, 
  PortalFAQ 
} from '../../lib/storage';
import { 
  Sparkles, 
  ShieldAlert, 
  Bell, 
  User, 
  LogIn, 
  Lock, 
  Info, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  CreditCard, 
  PhoneCall, 
  Phone, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  GraduationCap, 
  Copy, 
  Check, 
  HelpCircle, 
  AlertTriangle
} from 'lucide-react';
import { toPersianDigits } from '../../lib/persianNumberHelper';

// Generic Wrapper for Preview Sections
function PreviewCardWrapper({ 
  title, 
  subtitle, 
  children 
}: { 
  title: string; 
  subtitle?: string; 
  children: React.ReactNode; 
}) {
  return (
    <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                پیش‌نمایش لحظه‌ای
              </span>
            </h4>
            {subtitle && <p className="text-[11px] text-slate-500 font-medium mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>تغییرات به صورت آنی در کادر زیر منعکس می‌شود</span>
        </div>
      </div>

      <div className="bg-slate-100/90 rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-inner">
        {children}
      </div>
    </div>
  );
}

// 1. General Tab Preview
export function GeneralSectionPreview({ settings }: { settings: PortalSettings }) {
  return (
    <PreviewCardWrapper 
      title="پیش‌نمایش ظاهر عمومی و سربرگ میز خدمت" 
      subtitle="نمای کلی سربرگ پرتال، اطلاعیه فوری و پیام خوش‌آمدگویی برای دانشجو"
    >
      {!settings.isPortalEnabled ? (
        /* Disabled / Maintenance Mode Preview */
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 md:p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-200/60 px-3 py-0.5 rounded-full">
              حالت تعلیق موقت / تعمیرات
            </span>
            <h3 className="text-lg font-black text-rose-900 mt-2">سامانه میز خدمت موقتاً در دسترس نمی‌باشد</h3>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed font-medium bg-white/70 p-4 rounded-2xl border border-rose-200/80">
            {toPersianDigits(settings.maintenanceMessage || 'میز خدمت دانشجویان موقتاً جهت بروزرسانی تا اطلاع ثانوی در دسترس نمی‌باشد.')}
          </p>
        </div>
      ) : (
        /* Active Portal Preview */
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Urgent Portal Notice Preview */}
          {settings.portalNotice && (
            <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 text-amber-950 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-xs">
              <Bell className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
              <span className="leading-relaxed font-sans">{toPersianDigits(settings.portalNotice)}</span>
            </div>
          )}

          {/* Desktop/Header Bar Preview */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-black text-slate-800 text-sm font-sans">{toPersianDigits(settings.portalTitle || 'میز خدمت دانشجویان')}</h5>
                <p className="text-[11px] text-slate-500 font-medium font-sans">{toPersianDigits(settings.portalSubtitle || 'مرکز آموزش عالی کوثر کاکی')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                پرتال فعال
              </span>
            </div>
          </div>

          {/* Student Banner Preview */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-5 md:p-6 text-white shadow-md relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h6 className="font-black text-base">علی محمدی</h6>
                    <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      دانشجوی فعال
                    </span>
                  </div>
                  <p className="text-blue-100 text-xs font-medium mt-1 font-sans">
                    {toPersianDigits(settings.welcomeMessage || 'به پرتال جامع دانشجویی مرکز آموزش عالی کوثر کاکی خوش آمدید.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PreviewCardWrapper>
  );
}

// 2. Login Tab Preview
export function LoginSectionPreview({ settings }: { settings: PortalSettings }) {
  return (
    <PreviewCardWrapper 
      title="پیش‌نمایش صفحه ورود دانشجویان (/portal/login)" 
      subtitle="نمای کارت لاگین دقیقا همانند آنچه دانشجویان هنگام ورود مشاهده می‌کنند"
    >
      <div className="bg-white rounded-3xl p-6 max-w-md mx-auto shadow-lg border border-slate-200 space-y-4">
        {/* Urgent Alert Banner on Login if provided */}
        {settings.loginAlertBanner && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-2.5 text-xs font-bold shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{toPersianDigits(settings.loginAlertBanner)}</span>
          </div>
        )}

        <div className="text-center space-y-1.5 pb-2">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-blue-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h4 className="text-base font-black text-slate-800">{toPersianDigits(settings.loginTitle || 'ورود به میز خدمت دانشجویان')}</h4>
          <p className="text-xs text-slate-500 font-medium">{toPersianDigits(settings.loginSubtitle || 'سامانه یکپارچه خدمات الکترونیک مرکز آموزش عالی کوثر کاکی')}</p>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">شماره دانشجویی یا کد ملی</label>
            <div className="relative">
              <input 
                type="text" 
                disabled 
                placeholder="مثال: ۴۰۰۱۲۳۴۵۶ یا ۱۲۳۴۵۶۷۸۹۰" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 text-left font-sans"
                dir="ltr"
              />
            </div>
            {settings.loginHelperText && (
              <p className="text-[11px] text-slate-500 font-medium mt-1 leading-normal">
                💡 {toPersianDigits(settings.loginHelperText)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">کلمه عبور</label>
            <div className="relative">
              <input 
                type="password" 
                disabled 
                value="••••••••" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-400 text-left font-sans"
                dir="ltr"
              />
            </div>
          </div>

          <button 
            type="button" 
            disabled 
            className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-default"
          >
            <LogIn className="w-4 h-4" />
            ورود به میز خدمت
          </button>

          {/* Forgot password help preview */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-center">
              <span className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer">
                فراموشی رمز عبور یا راهنمایی؟
              </span>
            </div>
            {settings.forgotPasswordHelp && (
              <div className="mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed font-medium">
                {toPersianDigits(settings.forgotPasswordHelp)}
              </div>
            )}
          </div>
        </div>
      </div>
    </PreviewCardWrapper>
  );
}

// 4. Announcements Tab Preview
export function AnnouncementsSectionPreview({ announcements }: { announcements: PortalAnnouncement[] }) {
  const activeList = announcements.filter(a => a.isActive);

  return (
    <PreviewCardWrapper 
      title="پیش‌نمایش زنده نحوه نمایش اطلاعیه‌ها در پرتال دانشجو" 
      subtitle="مشاهده پیش‌نمایش کارت‌های اطلاعیه فعال همان‌گونه که در بالای صفحه داشبورد دانشجو چیده می‌شوند"
    >
      {activeList.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs font-bold">هیچ اطلاعیه فعالی برای نمایش در داشبورد وجود ندارد.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl mx-auto">
          {activeList.map(ann => {
            const colorClasses = 
              ann.type === 'danger' ? 'bg-rose-50 border-rose-200 text-rose-900' :
              ann.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
              ann.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
              'bg-blue-50 border-blue-200 text-blue-900';

            const icon = 
              ann.type === 'danger' ? <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" /> :
              ann.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /> :
              ann.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> :
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />;

            return (
              <div 
                key={ann.id} 
                className={`p-4 rounded-2xl border shadow-xs flex items-start gap-3 ${colorClasses}`}
              >
                {icon}
                <div className="flex-grow space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-black text-xs sm:text-sm flex items-center gap-1.5 font-sans">
                      {toPersianDigits(ann.title)}
                    </h5>
                    <span className="text-[10px] opacity-75 font-bold">
                      {ann.type === 'danger' ? 'فوری / مهم' : ann.type === 'warning' ? 'هشدار' : ann.type === 'success' ? 'تاییدیه' : 'اطلاعیه'}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed opacity-90 whitespace-pre-line font-sans">
                    {toPersianDigits(ann.content)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PreviewCardWrapper>
  );
}

// 5. Tickets Tab Preview
export function TicketsSectionPreview({ settings }: { settings: PortalSettings }) {
  const activeDepts = (settings.departments || []).filter(d => d.isActive);

  return (
    <PreviewCardWrapper 
      title="پیش‌نمایش زنده صفحه تیکت‌ها و راهنمای درخواست (/portal/tickets)" 
      subtitle="نمای کادر مقررات، ساعات پاسخگویی و دپارتمان‌های انتخابی دانشجو"
    >
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Guidelines Box */}
        {(settings.ticketGuidelines || settings.ticketWorkingHours) && (
          <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-sm space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-800 font-black text-xs sm:text-sm">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>{toPersianDigits(settings.ticketGuidelinesTitle || 'راهنما و مقررات ثبت تیکت')}</span>
              </div>
              {settings.ticketWorkingHours && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 font-sans">
                  <Clock className="w-3.5 h-3.5" />
                  ساعات پاسخگویی: {toPersianDigits(settings.ticketWorkingHours)}
                </span>
              )}
            </div>
            {settings.ticketGuidelines && (
              <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line font-sans">
                {toPersianDigits(settings.ticketGuidelines)}
              </p>
            )}
          </div>
        )}

        {/* Mockup Form with Departments */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-3">
          <h5 className="font-bold text-xs text-slate-700">پیش‌نمایش فرم انتخاب دپارتمان:</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeDepts.length > 0 ? (
              activeDepts.map(dep => (
                <div key={dep.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-xs text-slate-800 block font-sans">{toPersianDigits(dep.name)}</span>
                  {dep.description && (
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5 font-sans">{toPersianDigits(dep.description)}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 text-xs text-rose-600 font-bold p-2 bg-rose-50 rounded-xl">
                هیچ دپارتمان فعالی انتخاب نشده است!
              </div>
            )}
          </div>

          {settings.ticketSuccessMessage && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-sans">پیام پس از ثبت: {toPersianDigits(settings.ticketSuccessMessage)}</span>
            </div>
          )}
        </div>
      </div>
    </PreviewCardWrapper>
  );
}

// 6. Financial Tab Preview
export function FinancialSectionPreview({ settings }: { settings: PortalSettings }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <PreviewCardWrapper 
      title="پیش‌نمایش زنده کارت‌های بانکی و امور مالی (/portal/financial)" 
      subtitle="نمای حساب‌ها، شماره شبا و کارت بانکی همان‌گونه که در پرتال برای پرداخت شهریه نمایش می‌یابد"
    >
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Notice Banner */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-950 rounded-2xl flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-black block">{toPersianDigits(settings.financialNoticeTitle || 'راهنمای واریز و ثبت فیش شهریه')}</span>
            <p className="leading-relaxed opacity-90 font-medium font-sans">{toPersianDigits(settings.financialNoticeText)}</p>
            {settings.receiptReviewDays && (
              <span className="inline-block mt-1 font-bold text-[11px] text-amber-800 bg-amber-200/50 px-2 py-0.5 rounded-md font-sans">
                ⏱️ زمان بررسی فیش‌ها: {toPersianDigits(settings.receiptReviewDays)}
              </span>
            )}
          </div>
        </div>

        {/* Realistic Debit Card Mockup */}
        <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden max-w-md mx-auto">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">کارت پرداخت شهریه</span>
              <h5 className="font-black text-sm">{toPersianDigits(settings.bankAccountTitle || 'حساب رسمی مرکز آموزش')}</h5>
            </div>
            <div className="w-10 h-7 bg-amber-400/80 rounded-md shadow-inner flex items-center justify-center">
              <div className="w-6 h-4 border border-amber-600/50 rounded-xs" />
            </div>
          </div>

          <div className="my-4 text-center">
            <span className="font-sans text-base md:text-lg tracking-wider font-black" dir="ltr">
              {toPersianDigits(settings.bankCardNumber || '۶۲۷۳-۵۳۰۰-۰۰۰۰-۰۰۰۰')}
            </span>
          </div>

          <div className="flex justify-between items-end text-xs pt-2 border-t border-white/10">
            <div>
              <span className="text-[10px] text-indigo-300 block">صاحب حساب:</span>
              <span className="font-bold font-sans">{toPersianDigits(settings.bankAccountOwner || 'مرکز آموزش عالی کوثر کاکی')}</span>
            </div>
            <button 
              type="button" 
              onClick={() => handleCopy(toPersianDigits(settings.bankCardNumber), 'card')}
              className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors"
            >
              {copiedField === 'card' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === 'card' ? 'کپی شد' : 'کپی شماره'}</span>
            </button>
          </div>
        </div>

        {/* Account and Sheba details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block mb-1">شماره حساب رسمی:</span>
            <span className="font-sans font-black text-slate-800 text-sm" dir="ltr">
              {toPersianDigits(settings.bankAccountNumber || '---')}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] text-slate-500 font-bold block mb-1">شماره شبا (IBAN):</span>
            <span className="font-sans font-black text-slate-800 text-xs truncate block" dir="ltr">
              {toPersianDigits(settings.bankShebaNumber || 'IR---')}
            </span>
          </div>
        </div>
      </div>
    </PreviewCardWrapper>
  );
}

// 7. Support Tab Preview
export function SupportSectionPreview({ settings }: { settings: PortalSettings }) {
  return (
    <PreviewCardWrapper 
      title="پیش‌نمایش راه‌های ارتباطی و میز پشتیبانی دانشجویان" 
      subtitle="نمای کارت‌های تماس، ساعات کاری و پیام‌رسان‌ها در بخش تماس با پشتیبانی"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {/* Phone */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">تلفن اداره آموزش:</span>
            <span className="font-bold text-sm text-slate-800 font-sans" dir="ltr">
              {toPersianDigits(settings.supportPhone || '۰۷۷-۳۵۳۲۰۰۰۰')}
            </span>
          </div>
        </div>

        {/* Mobile */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">همراه و واتساپ پشتیبانی:</span>
            <span className="font-bold text-sm text-slate-800 font-sans" dir="ltr">
              {toPersianDigits(settings.supportMobile || '۰۹۱۷۰۰۰۰۰۰۰')}
            </span>
          </div>
        </div>

        {/* Messengers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">پیام‌رسان ایتا (Eitaa):</span>
            <span className="font-bold text-xs text-slate-800 font-sans" dir="ltr">
              @{settings.supportEitaa || 'kowsar_kaki_uni'}
            </span>
          </div>
        </div>

        {/* Telegram */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">کانال تلگرام:</span>
            <span className="font-bold text-xs text-slate-800 font-sans" dir="ltr">
              @{settings.supportTelegram || 'kowsar_kaki_uni'}
            </span>
          </div>
        </div>

        {/* Working hours */}
        <div className="sm:col-span-2 bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3">
          <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="text-xs text-indigo-900">
            <span className="font-bold block">ساعات پاسخگویی حضوری و اداری:</span>
            <span className="font-medium mt-0.5 block font-sans">{toPersianDigits(settings.supportHours || 'شنبه تا چهارشنبه: ۰۸:۰۰ الی ۱۴:۰۰')}</span>
          </div>
        </div>
      </div>
    </PreviewCardWrapper>
  );
}

// 8. FAQ Tab Preview
export function FaqSectionPreview({ faqs }: { faqs: PortalFAQ[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const activeList = faqs.filter(f => f.isActive);

  return (
    <PreviewCardWrapper 
      title="پیش‌نمایش زنده بخش سوالات متداول (FAQ)" 
      subtitle="نمای باز شونده (آکاردئونی) پرسش‌ها که دانشجو می‌تواند برای خواندن پاسخ‌ها کلیک کند"
    >
      {activeList.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
          <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs font-bold">هیچ سوال متداول فعالی برای نمایش وجود ندارد.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-w-2xl mx-auto">
          {activeList.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={faq.id} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-right hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 font-sans">
                      {toPersianDigits(idx + 1)}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-800 font-sans">{toPersianDigits(faq.question)}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-sans">
                      {toPersianDigits(faq.category)}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed font-medium border-t border-slate-100 bg-slate-50/40 font-sans">
                    {toPersianDigits(faq.answer)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PreviewCardWrapper>
  );
}
