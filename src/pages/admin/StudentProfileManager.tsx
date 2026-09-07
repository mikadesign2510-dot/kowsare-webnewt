import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  storage, 
  Student, 
  Ticket, 
  FinancialReceipt 
} from '../../lib/storage';
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  CreditCard, 
  ShieldCheck, 
  FileText, 
  Save, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Key, 
  RefreshCw, 
  Printer, 
  ExternalLink, 
  Eye, 
  Phone, 
  MapPin, 
  Calendar, 
  Hash, 
  Clock, 
  Shield, 
  Sparkles, 
  MessageSquare, 
  Receipt, 
  UserCheck, 
  UserX,
  FileBadge,
  Award,
  HelpCircle,
  X
} from 'lucide-react';

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


const MAJORS: Record<'کاردانی' | 'کارشناسی', string[]> = {
  'کاردانی': [
    'حسابداری',
    'تربیت بدنی',
    'امور اداری',
    'نرم‌افزار کامپیوتر',
    'گرافیک',
    'معماری',
    'برق صنعتی',
    'مکانیک خودرو',
    'طراحی دوخت'
  ],
  'کارشناسی': [
    'حسابداری',
    'تربیت بدنی و علوم ورزشی',
    'مدیریت بازرگانی',
    'مهندسی حرفه‌ای کامپیوتر',
    'مهندسی حرفه‌ای معماری',
    'ارتباط تصویری (گرافیک)',
    'حقوق',
    'روانشناسی'
  ]
};

const SEMESTERS = [
  '4031', '4022', '4021', '4012', '4011', '4002', '4001', '3992', '3991'
];

const toPersianDigits = (num: string | number | undefined | null) => {
  if (num === undefined || num === null || num === '') return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
};

export default function StudentProfileManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'identity' | 'academic' | 'contact' | 'portal' | 'notes'>('identity');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);

  // Form State for currently selected student
  const [formData, setFormData] = useState<Partial<Student>>({});

  useEffect(() => {
    const loadedStudents = storage.getStudents();
    setStudents(loadedStudents);

    // Initial student selection from URL or first in list
    const queryId = searchParams.get('id');
    if (queryId && loadedStudents.some(s => s.id === queryId)) {
      setSelectedStudentId(queryId);
    } else if (loadedStudents.length > 0) {
      setSelectedStudentId(loadedStudents[0].id);
    }
  }, [searchParams]);

  // Sync formData when selectedStudentId changes
  useEffect(() => {
    if (!selectedStudentId) return;
    const current = students.find(s => s.id === selectedStudentId);
    if (current) {
      setFormData({
        ...current,
        degreeLevel: current.degreeLevel || 'کاردانی',
        major: current.major || MAJORS['کاردانی'][0],
        entranceSemester: current.entranceSemester || '4021',
        academicStatus: current.academicStatus || 'studying',
        admissionType: current.admissionType || 'exam',
        gender: current.gender || 'male',
        maritalStatus: current.maritalStatus || 'single',
        militaryStatus: current.militaryStatus || 'educational_exemption',
        financialStatus: current.financialStatus || 'settled',
        discountType: current.discountType || 'none',
        documentStatus: current.documentStatus || 'complete',
        isActive: current.isActive !== false,
        passedUnits: current.passedUnits ?? 0,
        gpa: current.gpa || '',
        tuitionDebt: current.tuitionDebt || '0'
      });
    }
  }, [selectedStudentId, students]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(s => 
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      (s.nationalCode && s.nationalCode.includes(q)) ||
      (s.studentId && s.studentId.includes(q)) ||
      (s.major && s.major.toLowerCase().includes(q)) ||
      (s.mobile && s.mobile.includes(q))
    );
  }, [students, searchQuery]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Related tickets and receipts
  const studentTickets = useMemo(() => {
    if (!selectedStudent) return [];
    return storage.getTickets().filter(t => 
      t.userId === selectedStudent.id || 
      t.userId === `std_${selectedStudent.id}` ||
      (selectedStudent.nationalCode && t.userName.includes(selectedStudent.lastName))
    );
  }, [selectedStudent]);

  const studentReceipts = useMemo(() => {
    if (!selectedStudent) return [];
    return storage.getReceipts().filter(r => 
      r.userId === selectedStudent.id || 
      r.userId === `std_${selectedStudent.id}` ||
      (selectedStudent.studentId && r.studentId === selectedStudent.studentId)
    );
  }, [selectedStudent]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'degreeLevel') {
      const level = value as 'کاردانی' | 'کارشناسی';
      setFormData(prev => ({
        ...prev,
        degreeLevel: level,
        major: MAJORS[level][0]
      }));
    } else if (name === 'passedUnits') {
      setFormData(prev => ({ ...prev, [name]: Number(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectStudent = (id: string) => {
    setSelectedStudentId(id);
    setSearchParams({ id });
    setSaveSuccess(false);
    setSaveError('');
  };

  const handlePrevStudent = () => {
    const currentIndex = filteredStudents.findIndex(s => s.id === selectedStudentId);
    if (currentIndex > 0) {
      handleSelectStudent(filteredStudents[currentIndex - 1].id);
    }
  };

  const handleNextStudent = () => {
    const currentIndex = filteredStudents.findIndex(s => s.id === selectedStudentId);
    if (currentIndex !== -1 && currentIndex < filteredStudents.length - 1) {
      handleSelectStudent(filteredStudents[currentIndex + 1].id);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStudentId || !formData.firstName || !formData.lastName || !formData.nationalCode) {
      setSaveError('تکمیل نام، نام خانوادگی و کدملی الزامی است.');
      return;
    }

    try {
      storage.updateStudent(selectedStudentId, formData as any);
      
      // Update portal user session if exists
      const portalUsers = storage.getPortalUsers();
      const updatedPortalUsers = portalUsers.map(pu => {
        if (pu.id === `std_${selectedStudentId}` || pu.id === selectedStudentId || pu.nationalCode === formData.nationalCode) {
          return {
            ...pu,
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            firstName: formData.firstName,
            lastName: formData.lastName,
            nationalCode: formData.nationalCode || pu.nationalCode,
            studentId: formData.studentId,
            major: formData.major,
            degreeLevel: formData.degreeLevel,
            entranceSemester: formData.entranceSemester,
            mobile: formData.mobile,
            emergencyMobile: formData.emergencyMobile
          };
        }
        return pu;
      });
      storage.savePortalUsers(updatedPortalUsers);

      // Refresh list
      const updatedList = storage.getStudents();
      setStudents(updatedList);
      
      setSaveSuccess(true);
      setSaveError('');
      setTimeout(() => setSaveSuccess(false), 3500);

      storage.addSecurityLog({
        eventType: 'data_modified',
        severity: 'low',
        message: 'بروزرسانی کامل پرونده دانشجو',
        details: `پرونده دانشجو «${formData.firstName} ${formData.lastName}» ویرایش و ذخیره شد.`
      });
    } catch (err) {
      setSaveError('خطا در ذخیره‌سازی اطلاعات پرونده.');
    }
  };

  const handleGenerateRandomPassword = () => {
    const chars = '1234567890';
    let newPass = '';
    for (let i = 0; i < 6; i++) {
      newPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: newPass }));
  };

  const handleResetPasswordToNationalCode = () => {
    if (formData.nationalCode) {
      setFormData(prev => ({ ...prev, password: formData.nationalCode }));
    }
  };

  const handlePrintOfficialDossier = () => {
    if (!selectedStudent) return;
    
    const militaryLabel = formData.militaryStatus === 'educational_exemption' ? 'معافیت تحصیلی' : 
      formData.militaryStatus === 'service_completed' ? 'کارت پایان خدمت' : 
      formData.militaryStatus === 'permanent_exemption' ? 'معافیت دائم' : 
      formData.militaryStatus === 'not_applicable' ? 'غیرمشمول (خواهران)' : 'معافیت تحصیلی';

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <title>خلاصه پرونده تحصیلی دانشجو - ${formData.firstName} ${formData.lastName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, sans-serif;
            margin: 0;
            padding: 15px;
            color: #0f172a;
            background: #fff;
            direction: rtl;
            font-size: 12px;
          }
          .dossier-box {
            border: 2px solid #1e293b;
            border-radius: 12px;
            padding: 24px;
            max-width: 820px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #1e293b;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .header-title {
            text-align: center;
            flex-grow: 1;
          }
          .header-title h1 {
            font-size: 16px;
            margin: 0 0 4px 0;
            color: #0f172a;
            font-weight: 900;
          }
          .header-title h2 {
            font-size: 12px;
            margin: 0;
            color: #475569;
            font-weight: bold;
          }
          .header-meta {
            font-size: 11px;
            font-weight: bold;
            color: #334155;
            text-align: left;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 14px;
          }
          .field-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 12px;
          }
          .field-label {
            font-size: 10px;
            color: #64748b;
            display: block;
            margin-bottom: 3px;
          }
          .field-val {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
          }
          .full-width {
            grid-column: span 3;
          }
          .section-title {
            font-size: 12px;
            font-weight: 900;
            background: #e2e8f0;
            color: #0f172a;
            padding: 6px 12px;
            border-radius: 6px;
            margin: 14px 0 10px 0;
          }
          .footer-signs {
            display: flex;
            justify-content: space-between;
            margin-top: 36px;
            padding-top: 16px;
            border-top: 1px solid #cbd5e1;
            font-weight: bold;
            font-size: 11px;
            color: #334155;
          }
          .sign-col {
            text-align: center;
            width: 200px;
            padding-top: 35px;
          }
          @media print {
            body { padding: 0; }
            .dossier-box { border: 2px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="dossier-box">
          <div class="header">
            <div>
              <div style="font-weight: bold; font-size: 13px; color: #1e3a8a;">مرکز آموزش علمی کاربردی کوثر کاکی</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">دانشگاه جامع علمی کاربردی واحد بوشهر</div>
            </div>
            <div class="header-title">
              <h1>برگ خلاصه پرونده تحصیلی و هویتی دانشجو</h1>
              <h2>سیستم یکپارچه مدیریت آموزشی</h2>
            </div>
            <div class="header-meta">
              <div>تاریخ صدور: ${toPersianDigits(new Date().toLocaleDateString('fa-IR'))}</div>
              <div style="margin-top: 3px;">وضعیت پرونده: ${formData.isActive ? 'فعال و تایید شده' : 'مسدود'}</div>
            </div>
          </div>

          <div class="section-title">مشخصات سجلی و هویتی</div>
          <div class="grid">
            <div class="field-box">
              <span class="field-label">نام و نام خانوادگی:</span>
              <span class="field-val">${formData.firstName} ${formData.lastName}</span>
            </div>
            <div class="field-box">
              <span class="field-label">کد ملی:</span>
              <span class="field-val">${toPersianDigits(formData.nationalCode)}</span>
            </div>
            <div class="field-box">
              <span class="field-label">شماره شناسنامه:</span>
              <span class="field-val">${toPersianDigits(formData.certificateNo) || '-'}</span>
            </div>
            <div class="field-box">
              <span class="field-label">نام پدر:</span>
              <span class="field-val">${formData.fatherName || '-'}</span>
            </div>
            <div class="field-box">
              <span class="field-label">تاریخ تولد:</span>
              <span class="field-val">${toPersianDigits(formData.birthDate) || '-'}</span>
            </div>
            <div class="field-box">
              <span class="field-label">محل تولد / صدور:</span>
              <span class="field-val">${formData.birthPlace || '-'}</span>
            </div>
          </div>

          <div class="section-title">مشخصات تحصیلی و رشته</div>
          <div class="grid">
            <div class="field-box">
              <span class="field-label">شماره دانشجویی:</span>
              <span class="field-val">${toPersianDigits(formData.studentId)}</span>
            </div>
            <div class="field-box">
              <span class="field-label">مقطع تحصیلی:</span>
              <span class="field-val">${formData.degreeLevel || 'کاردانی'}</span>
            </div>
            <div class="field-box">
              <span class="field-label">رشته تحصیلی:</span>
              <span class="field-val">${formData.major}</span>
            </div>
            <div class="field-box">
              <span class="field-label">نیمسال ورود:</span>
              <span class="field-val">${toPersianDigits(formData.entranceSemester)}</span>
            </div>
            <div class="field-box">
              <span class="field-label">وضعیت تحصیلی:</span>
              <span class="field-val">${formData.academicStatus === 'studying' ? 'در حال تحصیل (فعال)' : 'سایر'}</span>
            </div>
            <div class="field-box">
              <span class="field-label">معدل کل / واحدهای گذرانده:</span>
              <span class="field-val">${formData.gpa ? toPersianDigits(formData.gpa) : '-'} (واحدهای گذرانده: ${formData.passedUnits ? toPersianDigits(formData.passedUnits) : '۰'})</span>
            </div>
          </div>

          <div class="section-title">اطلاعات تماس، نظام وظیفه و نشانی</div>
          <div class="grid">
            <div class="field-box">
              <span class="field-label">شماره تماس همراه:</span>
              <span class="field-val">${toPersianDigits(formData.mobile) || '-'}</span>
            </div>
            <div class="field-box">
              <span class="field-label">شماره تماس اضطراری:</span>
              <span class="field-val">${toPersianDigits(formData.emergencyMobile || formData.phone) || '-'}</span>
            </div>
            <div class="field-box">
              <span class="field-label">وضعیت نظام وظیفه:</span>
              <span class="field-val">${militaryLabel}</span>
            </div>
            <div class="field-box full-width">
              <span class="field-label">نشانی محل سکونت:</span>
              <span class="field-val">${formData.address || 'ثبت نشده'} ${formData.postalCode ? ` - کد پستی: ${toPersianDigits(formData.postalCode)}` : ''}</span>
            </div>
          </div>

          <div class="footer-signs">
            <div class="sign-col">
              <div>امضاء و مهر کارشناس آموزش</div>
            </div>
            <div class="sign-col">
              <div>امضاء و مهر امور مالی</div>
            </div>
            <div class="sign-col">
              <div>مهر و امضای ریاست مرکز علمی کاربردی کوثر کاکی</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    try {
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
      } else {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(printContent);
          doc.close();
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 2000);
          }, 400);
        }
      }
    } catch {
      window.print();
    }
  };

  const handleQuickLoginAsStudent = () => {
    if (!selectedStudent) return;
    const studentUser = {
      id: `std_${selectedStudent.id}`,
      name: `${selectedStudent.firstName} ${selectedStudent.lastName}`.trim() || 'دانشجو',
      firstName: selectedStudent.firstName,
      lastName: selectedStudent.lastName,
      nationalCode: selectedStudent.nationalCode,
      studentId: selectedStudent.studentId,
      major: selectedStudent.major,
      degreeLevel: selectedStudent.degreeLevel,
      entranceSemester: selectedStudent.entranceSemester,
      mobile: selectedStudent.mobile,
      emergencyMobile: selectedStudent.emergencyMobile,
      role: 'student',
      isApproved: true,
      createdAt: selectedStudent.createdAt
    };
    localStorage.setItem('kowsar_portal_auth', JSON.stringify(studentUser));
    window.open('/portal', '_blank');
  };

  const currentIndex = filteredStudents.findIndex(s => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800">
                مدیریت جامع پرونده و پروفایل دانشجویان
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                مشاهده، ویرایش اختصاصی، سوابق سجلی، آموزشی، مالی، امنیت و چاپ پرونده
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Link
            to="/admin/students"
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            جدول لیست دانشجویان
          </Link>
          <button
            type="button"
            onClick={handleQuickLoginAsStudent}
            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
            title="مشاهده میز خدمت از دید این دانشجو"
          >
            <Eye className="w-4 h-4" />
            پیش‌نمایش پرتال دانشجو
          </button>
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            چاپ پرونده رسمی
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            ذخیره تغییرات پرونده
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {saveSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-2xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">
            مشخصات پرونده دانشجو با موفقیت در دیتابیس سامانه ثبت و بروزرسانی شد.
          </span>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-3 bg-rose-50 text-rose-800 border border-rose-200 p-4 rounded-2xl animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-bold">{saveError}</span>
        </div>
      )}

      {/* Main Grid: Student Sidebar Selector + Full Dossier Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Right Sidebar: Student Selector & Search (4 Columns on LG) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                انتخاب دانشجو
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                {toPersianDigits(filteredStudents.length)} پرونده
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جستجو نام، کدملی، ش.دانشجویی..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Quick Navigation: Prev / Next */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrevStudent}
                disabled={currentIndex <= 0}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                قبلی
              </button>
              <span className="text-[11px] font-bold text-slate-400">
                {toPersianDigits(currentIndex + 1)} از {toPersianDigits(filteredStudents.length)}
              </span>
              <button
                type="button"
                onClick={handleNextStudent}
                disabled={currentIndex === -1 || currentIndex >= filteredStudents.length - 1}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                بعدی
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Student List */}
            <div className="max-h-[560px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  دانشجویی با این مشخصات یافت نشد.
                </div>
              ) : (
                filteredStudents.map(student => {
                  const isSelected = student.id === selectedStudentId;
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => handleSelectStudent(student.id)}
                      className={`w-full text-right p-3 rounded-2xl transition-all border flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-blue-50/80 border-blue-300 shadow-sm text-blue-950' 
                          : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100/80 text-slate-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {student.firstName ? student.firstName[0] : 'د'}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs truncate">
                            {student.firstName} {student.lastName}
                          </span>
                          {student.isActive === false ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                              غیرفعال
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                              فعال
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                          <span className="truncate">{student.major || 'نامشخص'}</span>
                          <span className="font-medium shrink-0">{toPersianDigits(student.studentId || student.nationalCode)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right/Left Main Area: Comprehensive Student Dossier (8 Columns on LG) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedStudent ? (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
              
              {/* Dossier Header Card Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-lg">
                <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center text-xl font-black text-white shadow-inner">
                      {formData.firstName ? formData.firstName[0] : 'ک'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5 mb-1">
                        <h2 className="text-xl md:text-2xl font-black">
                          {formData.firstName} {formData.lastName}
                        </h2>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          formData.isActive 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                            : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                        }`}>
                          {formData.isActive ? 'دسترسی فعال به میز خدمت' : 'دسترسی مسدود'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium">
                        مقطع {formData.degreeLevel} • رشته {formData.major} • نیمسال ورود {toPersianDigits(formData.entranceSemester)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-white/10 hover:bg-white/15 px-3.5 py-2 rounded-xl border border-white/20 transition-colors">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive ?? true}
                        onChange={handleInputChange}
                        className="rounded text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-200">وضعیت فعال</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dossier Tabs Navigation */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('identity')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'identity' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  مشخصات سجلی و هویتی
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('academic')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'academic' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  پرونده و سوابق تحصیلی
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'contact' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  اطلاعات تماس و آدرس
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('portal')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'portal' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  امنیت، رمز و میز خدمت
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    activeTab === 'notes' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  یادداشت‌های محرمانه آموزش
                </button>
              </div>

              {/* Tab 1: Identity & Vital Info */}
              {activeTab === 'identity' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">نام *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="مثال: علی"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">نام خانوادگی *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="مثال: احمدی"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">کد ملی (۱۰ رقم) *</label>
                      <input
                        type="text"
                        name="nationalCode"
                        value={formData.nationalCode || ''}
                        onChange={handleInputChange}
                        required
                        maxLength={10}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="0123456789"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">نام پدر</label>
                      <input
                        type="text"
                        name="fatherName"
                        value={formData.fatherName || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="مثال: محمد"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">شماره شناسنامه</label>
                      <input
                        type="text"
                        name="certificateNo"
                        value={formData.certificateNo || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="مثال: 1234"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">تاریخ تولد (هجری خورشیدی)</label>
                      <DatePicker
                        value={formData.birthDate || ''}
                        onChange={(dateObject: any) => {
                          setFormData({ ...formData, birthDate: dateObject?.format?.("YYYY/MM/DD") || '' });
                        }}
                        calendar={persian}
                        locale={persian_fa}
                        calendarPosition="bottom-right"
                        render={<CustomDateInput 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="مثال: ۱۳۸۲/۰۴/۱۵"
                        />}
                        containerClassName="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">محل صدور / تولد</label>
                      <input
                        type="text"
                        name="birthPlace"
                        value={formData.birthPlace || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="مثال: بوشهر"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">جنسیت</label>
                      <select
                        name="gender"
                        value={formData.gender || 'male'}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="male">مرد</option>
                        <option value="female">زن</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">وضعیت تاهل</label>
                      <select
                        name="maritalStatus"
                        value={formData.maritalStatus || 'single'}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="single">مجرد</option>
                        <option value="married">متاهل</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">وضعیت نظام وظیفه</label>
                      <select
                        name="militaryStatus"
                        value={formData.militaryStatus || 'educational_exemption'}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="educational_exemption">معافیت تحصیلی</option>
                        <option value="service_completed">کارت پایان خدمت</option>
                        <option value="permanent_exemption">معافیت دائم پزشکی/کفالت</option>
                        <option value="subject_to_service">مشمول خدمت</option>
                        <option value="not_applicable">غیرمشمول (خواهران)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">شماره معافیت / پرونده نظام وظیفه</label>
                      <input
                        type="text"
                        name="militaryCode"
                        value={formData.militaryCode || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="مثال: 98451203"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Academic Profile */}
              {activeTab === 'academic' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">شماره دانشجویی</label>
                      <input
                        type="text"
                        name="studentId"
                        value={formData.studentId || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="402123456"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">مقطع تحصیلی</label>
                      <select
                        name="degreeLevel"
                        value={formData.degreeLevel || 'کاردانی'}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="کاردانی">کاردانی (فوق دیپلم)</option>
                        <option value="کارشناسی">کارشناسی (لیسانس)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">رشته تحصیلی</label>
                      <select
                        name="major"
                        value={formData.major || MAJORS[(formData.degreeLevel as 'کاردانی' | 'کارشناسی') || 'کاردانی'][0]}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        {MAJORS[(formData.degreeLevel as 'کاردانی' | 'کارشناسی') || 'کاردانی'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">گرایش تحصیلی</label>
                      <input
                        type="text"
                        name="orientation"
                        value={formData.orientation || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="مثال: نرم‌افزار / مالی"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">نیمسال ورود</label>
                      <select
                        name="entranceSemester"
                        value={formData.entranceSemester || '4021'}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        {SEMESTERS.map(sem => (
                          <option key={sem} value={sem}>{toPersianDigits(sem)} ({sem})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع پذیرش در مرکز</label>
                      <select
                        name="admissionType"
                        value={formData.admissionType || 'exam'}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="exam">آزمون سراسری (کنکور)</option>
                        <option value="records">بر اساس سوابق تحصیلی (بدون آزمون)</option>
                        <option value="transfer">انتقالی از دانشگاه دیگر</option>
                        <option value="guest">دانشجوی مهمان</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">وضعیت تحصیلی</label>
                      <select
                        name="academicStatus"
                        value={formData.academicStatus || 'studying'}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="studying">در حال تحصیل (فعال)</option>
                        <option value="graduated">فارغ‌التحصیل</option>
                        <option value="leave">مرخصی تحصیلی</option>
                        <option value="withdrawn">انصراف از تحصیل</option>
                        <option value="expelled">اخراج آموزشی / انضباطی</option>
                        <option value="guest">دانشجوی مهمان</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">استاد مشاور / راهنما</label>
                      <input
                        type="text"
                        name="advisorTeacher"
                        value={formData.advisorTeacher || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="مثال: دکتر علوی"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">تعداد واحدهای گذرانده</label>
                      <input
                        type="number"
                        name="passedUnits"
                        value={formData.passedUnits ?? 0}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="مثال: 45"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">معدل کل (GPA)</label>
                      <input
                        type="text"
                        name="gpa"
                        value={formData.gpa || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="مثال: 17.50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">وضعیت پرونده فیزیکی و مدارک</label>
                      <select
                        name="documentStatus"
                        value={formData.documentStatus || 'complete'}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      >
                        <option value="complete">تکمیل (مدارک کامل)</option>
                        <option value="incomplete">نقص مدرک (دیپلم/ریز نمرات/تاییدیه)</option>
                        <option value="pending">در حال بررسی دبیرخانه</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Contact & Location */}
              {activeTab === 'contact' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">شماره همراه دانشجو</label>
                      <input
                        type="text"
                        name="mobile"
                        value={formData.mobile || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="09123456789"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">شماره همراه اضطراری</label>
                      <input
                        type="text"
                        name="emergencyMobile"
                        value={formData.emergencyMobile || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="09171234567"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">تلفن ثابت منزل</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="07735320000"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">استان محل سکونت</label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="مثال: بوشهر"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">شهر محل سکونت</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="مثال: کاکی / خورموج"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">کد پستی ده‌رقمی</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="7545112345"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">پست الکترونیک (ایمیل)</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="student@example.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">نشانی پستی دقیق منزل</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="استان، شهر، خیابان، کوچه، پلاک، طبقه"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Portal Security & Access */}
              {activeTab === 'portal' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-600" />
                      مدیریت رمز عبور و ورود به میز خدمت دانشجو
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          رمز عبور اختصاصی ورود به پرتال
                        </label>
                        <input
                          type="text"
                          name="password"
                          value={formData.password || ''}
                          onChange={handleInputChange}
                          className="w-full bg-white border border-blue-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                          placeholder="کد ملی به عنوان رمز پیش‌فرض"
                        />
                      </div>

                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateRandomPassword}
                          className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          تولید رمز عددی ۶ رقمی
                        </button>
                        <button
                          type="button"
                          onClick={handleResetPasswordToNationalCode}
                          className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-colors"
                        >
                          تنظیم مجدد به کدملی
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      دانشجو می‌تواند با استفاده از شماره دانشجویی یا کد ملی به عنوان نام کاربری، و این رمز عبور وارد میز خدمت الکترونیکی شود.
                    </p>
                  </div>

                  {/* Student Tickets Summary */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        تیکت‌ها و مکاتبات ارسالی این دانشجو ({toPersianDigits(studentTickets.length)})
                      </h4>
                      <Link to="/admin/tickets" className="text-xs font-bold text-blue-600 hover:underline">
                        مدیریت همه تیکت‌ها
                      </Link>
                    </div>

                    {studentTickets.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                        تا کنون تیکتی توسط این دانشجو ارسال نشده است.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {studentTickets.map(t => (
                          <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-slate-800">{t.subject}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                بخش: {t.department === 'education' ? 'آموزش' : t.department === 'financial' ? 'مالی' : 'سایر'} • {toPersianDigits(t.messages.length)} پیام
                              </p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              t.status === 'answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {t.status === 'answered' ? 'پاسخ داده شده' : 'در انتظار بررسی'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 6: Confidential Notes */}
              {activeTab === 'notes' && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-indigo-600" />
                        یادداشت‌های محرمانه و سوابق داخلی آموزش
                      </label>
                      <span className="text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-bold">
                        صرفاً برای کارشناسان و مدیریت قابل مشاهده است
                      </span>
                    </div>
                    <textarea
                      name="adminNotes"
                      rows={6}
                      value={formData.adminNotes || ''}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                      placeholder="ثبت مصوبات کمیسیون موارد خاص، تذکرات انضباطی، تقدیرنامه‌ها، سوابق پیگیری مدارک و یادداشت‌های داخلی کارشناسان آموزش..."
                    />
                  </div>
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div className="text-xs text-slate-400 font-medium">
                  تاریخ ایجاد پرونده: {formData.createdAt ? toPersianDigits(new Date(formData.createdAt).toLocaleDateString('fa-IR')) : 'ثبت اولیه'}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    ذخیره کلیه تغییرات این پرونده
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100 text-slate-400">
              <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-sm">هیچ دانشجویی انتخاب نشده است.</p>
              <p className="text-xs mt-1">لطفاً از لیست سمت راست یک دانشجو را انتخاب کنید.</p>
            </div>
          )}
        </div>

      </div>

      {/* Official Student Dossier Printable Modal */}
      {isPrintModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">خلاصه پرونده رسمی دانشجو جهت چاپ</h3>
                  <p className="text-xs text-slate-500 font-medium">مرکز آموزش عالی علمی کاربردی کوثر کاکی</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Paper Card */}
            <div className="border border-slate-300 rounded-2xl p-6 bg-slate-50/50 space-y-6 text-slate-800 text-xs leading-relaxed print:m-0 print:border-none">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h4 className="font-black text-sm text-slate-900">برگ مشخصات تحصیلی و شناسنامه‌ای دانشجو</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">دانشگاه جامع علمی کاربردی - واحد استان بوشهر</p>
                </div>
                <div className="text-left font-bold text-[11px] text-slate-600">
                  تاریخ صدور: {toPersianDigits(new Date().toLocaleDateString('fa-IR'))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">نام و نام خانوادگی:</span>
                  <span className="font-bold">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">کد ملی:</span>
                  <span className="font-bold">{toPersianDigits(formData.nationalCode)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">شماره دانشجویی:</span>
                  <span className="font-bold">{toPersianDigits(formData.studentId)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">مقطع و رشته:</span>
                  <span className="font-bold">{formData.major} ({formData.degreeLevel})</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">نیمسال ورود:</span>
                  <span className="font-bold">{toPersianDigits(formData.entranceSemester)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">نام پدر:</span>
                  <span className="font-bold">{formData.fatherName || '-'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">شماره شناسنامه:</span>
                  <span className="font-bold">{toPersianDigits(formData.certificateNo) || '-'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">وضعیت تحصیلی:</span>
                  <span className="font-bold">{formData.academicStatus === 'studying' ? 'در حال تحصیل' : 'سایر'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">شماره تماس همراه:</span>
                  <span className="font-bold">{toPersianDigits(formData.mobile) || '-'}</span>
                </div>
              </div>

              {formData.address && (
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">نشانی پستی محل سکونت:</span>
                  <span className="font-bold">{formData.address} {formData.postalCode ? `(کد پستی: ${toPersianDigits(formData.postalCode)})` : ''}</span>
                </div>
              )}

              <div className="pt-8 border-t border-slate-200 flex justify-between text-[11px] font-bold text-slate-500">
                <span>مهر و امضای کارشناس آموزش</span>
                <span>مهر و امضای ریاست مرکز آموزش عالی کوثر کاکی</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs"
              >
                بستن
              </button>
              <button
                type="button"
                onClick={handlePrintOfficialDossier}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 text-xs shadow-md shadow-blue-500/20"
              >
                <Printer className="w-4 h-4" />
                چاپ برگ خلاصه پرونده
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
