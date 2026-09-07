import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  storage, 
  PortalUser, 
  Student, 
  Ticket, 
  FinancialReceipt,
  PortalSettings,
  defaultPortalSettings
} from '../../lib/storage';
import { 
  MessageSquare, 
  Receipt, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  GraduationCap, 
  UserCheck, 
  Calendar, 
  Hash, 
  BookOpen, 
  Phone, 
  ShieldCheck,
  User,
  Award,
  CreditCard,
  FileBadge,
  Sparkles,
  Bell,
  AlertTriangle,
  Info,
  HelpCircle,
  PhoneCall,
  MessageCircle
} from 'lucide-react';

const toPersianDigits = (num: string | number | undefined | null) => {
  if (num === undefined || num === null || num === '') return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
};

const getMilitaryLabel = (status?: string) => {
  switch (status) {
    case 'educational_exemption': return 'معافیت تحصیلی فعال';
    case 'service_completed': return 'کارت پایان خدمت';
    case 'permanent_exemption': return 'معافیت دائم';
    case 'subject_to_service': return 'مشمول وظیفه';
    case 'not_applicable': return 'غیرمشمول (خواهران)';
    default: return 'معافیت تحصیلی';
  }
};

const getAcademicStatusLabel = (status?: string) => {
  switch (status) {
    case 'studying': return 'در حال تحصیل (فعال)';
    case 'graduated': return 'فارغ‌التحصیل';
    case 'leave': return 'مرخصی تحصیلی';
    case 'withdrawn': return 'انصراف از تحصیل';
    case 'expelled': return 'اخراج آموزشی';
    case 'guest': return 'دانشجوی مهمان';
    default: return 'در حال تحصیل (فعال)';
  }
};

export default function PortalDashboard() {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [studentDetails, setStudentDetails] = useState<Student | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [receipts, setReceipts] = useState<FinancialReceipt[]>([]);
  const [portalSettings, setPortalSettings] = useState<PortalSettings>(defaultPortalSettings);

  const loadData = () => {
    setPortalSettings(storage.getPortalSettings());
    const authData = localStorage.getItem('kowsar_portal_auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      setUser(parsed);
      
      // Load fresh full student data from repository
      const allStudents = storage.getStudents();
      const matched = allStudents.find(s => 
        (s.nationalCode && s.nationalCode === parsed.nationalCode) || 
        (s.studentId && s.studentId === parsed.studentId) ||
        parsed.id === `std_${s.id}` ||
        parsed.id === s.id
      );

      if (matched) {
        setStudentDetails(matched);
      }

      const userTickets = storage.getTickets().filter(t => t.userId === parsed.id || (matched && t.userId === `std_${matched.id}`));
      const userReceipts = storage.getReceipts().filter(r => r.userId === parsed.id || (matched && r.userId === `std_${matched.id}`));
      
      setTickets(userTickets);
      setReceipts(userReceipts);
    }
  };

  useEffect(() => {
    loadData();

    const handleSettingsChange = () => {
      setPortalSettings(storage.getPortalSettings());
    };

    window.addEventListener('kowsar_portal_settings_changed', handleSettingsChange);
    return () => {
      window.removeEventListener('kowsar_portal_settings_changed', handleSettingsChange);
    };
  }, []);

  if (!user) return null;

  // Resolved values prioritizing up-to-date student profile
  const fullName = studentDetails ? `${studentDetails.firstName} ${studentDetails.lastName}`.trim() : user.name;
  const nationalCode = studentDetails?.nationalCode || user.nationalCode;
  const studentId = studentDetails?.studentId || user.studentId;
  const major = studentDetails?.major || user.major;
  const degreeLevel = studentDetails?.degreeLevel || user.degreeLevel || 'کاردانی';
  const entranceSemester = studentDetails?.entranceSemester || user.entranceSemester;
  const mobile = studentDetails?.mobile || user.mobile;
  const emergencyMobile = studentDetails?.emergencyMobile || user.emergencyMobile;
  const fatherName = studentDetails?.fatherName;
  const certificateNo = studentDetails?.certificateNo;
  const birthDate = studentDetails?.birthDate;
  const birthPlace = studentDetails?.birthPlace;
  const gpa = studentDetails?.gpa;
  const passedUnits = studentDetails?.passedUnits;
  const militaryStatus = studentDetails?.militaryStatus;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Profile Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
              <GraduationCap className="w-9 h-9 md:w-11 md:h-11 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-black">{fullName}</h1>
                <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                  <UserCheck className="w-3.5 h-3.5" />
                  دانشجوی فعال
                </span>
                {studentDetails?.academicStatus && (
                  <span className="bg-white/15 text-blue-100 text-xs px-3 py-1 rounded-full font-bold">
                    {getAcademicStatusLabel(studentDetails.academicStatus)}
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-sm font-medium">
                {major ? `${degreeLevel} رشته ${major}` : 'میز خدمت دانشجویان مرکز آموزش عالی کوثر کاکی'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link 
              to="/portal/tickets"
              className="bg-white text-blue-800 hover:bg-blue-50 font-bold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              ثبت تیکت آموزشی
            </Link>
            <Link 
              to="/portal/financial"
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-2.5 rounded-xl transition-all border border-white/30 flex items-center gap-2 text-sm backdrop-blur-sm"
            >
              <Receipt className="w-4 h-4" />
              ارسال رسید شهریه
            </Link>
          </div>
        </div>
      </div>

      {/* Announcements Section (Dynamic from PortalSettings) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          اطلاعیه‌ها و پیام‌های مهم میز خدمت
        </h2>

        {(!portalSettings.announcements || portalSettings.announcements.filter(a => a.isActive).length === 0) ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500 font-medium">
            در حال حاضر اطلاعیه جدیدی در میز خدمت ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-3">
            {portalSettings.announcements.filter(a => a.isActive).map((ann) => {
              const bgStyles = {
                success: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
                warning: 'bg-amber-50/80 border-amber-200 text-amber-950',
                danger: 'bg-rose-50/80 border-rose-200 text-rose-950',
                info: 'bg-blue-50/80 border-blue-200 text-blue-950'
              };
              const iconStyles = {
                success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
                warning: <Clock className="w-5 h-5 text-amber-600" />,
                danger: <AlertTriangle className="w-5 h-5 text-rose-600" />,
                info: <Info className="w-5 h-5 text-blue-600" />
              };

              return (
                <div key={ann.id} className={`flex items-start gap-4 p-4 rounded-2xl border ${bgStyles[ann.type] || bgStyles.info}`}>
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    {iconStyles[ann.type] || iconStyles.info}
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1">{ann.title}</p>
                    <p className="text-xs leading-relaxed opacity-90">{ann.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Academic & Identity Details Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            اطلاعات تحصیلی دانشجو
          </h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">
            سامانه جامع آموزش کوثر
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-blue-600" />
              کد ملی
            </p>
            <p className="text-base font-bold text-slate-800">{toPersianDigits(nationalCode) || '-'}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              شماره دانشجویی
            </p>
            <p className="text-base font-bold text-slate-800">{toPersianDigits(studentId) || '-'}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              مقطع و رشته تحصیلی
            </p>
            <p className="text-sm font-bold text-slate-800">
              {major ? `${major} (${degreeLevel})` : 'تعریف نشده'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500 font-bold mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              نیمسال ورود
            </p>
            <p className="text-base font-bold text-slate-800">{toPersianDigits(entranceSemester) || '-'}</p>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm mb-1">تیکت‌ها و مکاتبات شما</p>
              <p className="text-2xl font-black text-slate-800">{toPersianDigits(tickets.length)} درخواست</p>
            </div>
          </div>
          <Link to="/portal/tickets" className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-3 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Receipt className="w-7 h-7" />
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm mb-1">رسیدهای پرداختی ثبت شده</p>
              <p className="text-2xl font-black text-slate-800">{toPersianDigits(receipts.length)} رسید</p>
            </div>
          </div>
          <Link to="/portal/financial" className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-3 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Support & Contacts Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-indigo-600" />
          راه‌های ارتباط با کارشناسان و پشتیبانی
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold">تلفن اداره آموزش</p>
              <p className="text-xs font-black text-slate-800" dir="ltr">{toPersianDigits(portalSettings.supportPhone)}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold">کانال ایتا (Eitaa)</p>
              <p className="text-xs font-bold text-slate-800">@{portalSettings.supportEitaa}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold">ساعات پاسخگویی</p>
              <p className="text-xs font-bold text-slate-800">{portalSettings.supportHours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) Section */}
      {portalSettings.faqs && portalSettings.faqs.filter(f => f.isActive).length > 0 && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            سوالات متداول دانشجویان
          </h2>
          <div className="space-y-3">
            {portalSettings.faqs.filter(f => f.isActive).map(faq => (
              <div key={faq.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <h4 className="font-bold text-xs md:text-sm text-slate-800">{faq.question}</h4>
                  <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {faq.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pr-4">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
