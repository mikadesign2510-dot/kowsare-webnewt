import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Upload, 
  Download, 
  Search, 
  Edit2, 
  Trash2, 
  Key, 
  Shield, 
  CheckCircle, 
  XCircle, 
  GraduationCap,
  Filter,
  RotateCcw,
  BookOpen,
  Calendar,
  Layers,
  KeyRound,
  AlertTriangle,
  Power,
  User
} from 'lucide-react';
import { storage, Student } from '../../lib/storage';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';

// Helper function for Persian numbers
const toPersianDigits = (num: string | number | undefined) => {
  if (!num) return '-';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, x => farsiDigits[parseInt(x)]);
};

const MAJORS = {
  'کاردانی': ['حسابداری', 'امورفرهنگی', 'تربیت بدنی', 'کشاورزی', 'حقوق', 'برق صنعتی'],
  'کارشناسی': ['حسابداری', 'گیاه پزشکی', 'گیاهان دارویی']
};

const ALL_MAJORS = Array.from(new Set([...MAJORS['کاردانی'], ...MAJORS['کارشناسی']]));

const SEMESTERS: string[] = [];
for (let year = 1398; year <= 1405; year++) {
  const shortYear = year.toString().slice(1);
  SEMESTERS.push(`${shortYear}1`);
  SEMESTERS.push(`${shortYear}2`);
}

export default function StudentManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [filterDegree, setFilterDegree] = useState<string>('all');
  const [filterMajor, setFilterMajor] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewStudents, setPreviewStudents] = useState<Student[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    nationalCode: '',
    firstName: '',
    lastName: '',
    studentId: '',
    entranceSemester: SEMESTERS[0],
    mobile: '',
    emergencyMobile: '',
    major: MAJORS['کاردانی'][0],
    degreeLevel: 'کاردانی' as 'کاردانی' | 'کارشناسی',
    password: '',
    isActive: true
  });

  useEffect(() => {
    setStudents(storage.getStudents());
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'degreeLevel') {
      const level = value as 'کاردانی' | 'کارشناسی';
      setFormData(prev => ({ ...prev, degreeLevel: level, major: MAJORS[level][0] }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      storage.updateStudent(editingStudent.id, formData);
      setSuccessMessage('اطلاعات دانشجو با موفقیت ویرایش شد.');
    } else {
      storage.addStudent({
        ...formData,
        password: formData.password || formData.nationalCode
      });
      setSuccessMessage('دانشجوی جدید با موفقیت ثبت شد.');
    }
    setStudents(storage.getStudents());
    setIsAddModalOpen(false);
    setEditingStudent(null);
    resetForm();
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const resetForm = () => {
    setFormData({
      nationalCode: '',
      firstName: '',
      lastName: '',
      studentId: '',
      entranceSemester: SEMESTERS[0],
      mobile: '',
      emergencyMobile: '',
      major: MAJORS['کاردانی'][0],
      degreeLevel: 'کاردانی',
      password: '',
      isActive: true
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterDegree('all');
    setFilterMajor('all');
    setFilterSemester('all');
    setFilterStatus('all');
  };

  const hasActiveFilters = searchQuery !== '' || filterDegree !== 'all' || filterMajor !== 'all' || filterSemester !== 'all' || filterStatus !== 'all';

  const handleToggleStatus = (student: Student) => {
    storage.toggleStudentStatus(student.id);
    const updated = storage.getStudents();
    setStudents(updated);
    const isNowActive = student.isActive === false;
    setSuccessMessage(`وضعیت دانشجو «${student.firstName} ${student.lastName}» به ${isNowActive ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const confirmDeleteStudent = () => {
    if (studentToDelete) {
      const fullName = `${studentToDelete.firstName} ${studentToDelete.lastName}`.trim() || 'دانشجو';
      storage.deleteStudent(studentToDelete.id);
      setStudents(storage.getStudents());
      setStudentToDelete(null);
      setSuccessMessage(`دانشجو «${fullName}» با موفقیت از سیستم حذف شد.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nationalCode: student.nationalCode,
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      studentId: student.studentId,
      entranceSemester: student.entranceSemester,
      mobile: student.mobile,
      emergencyMobile: student.emergencyMobile,
      major: student.major,
      degreeLevel: (student.degreeLevel as 'کاردانی' | 'کارشناسی') || 'کاردانی',
      password: student.password || '',
      isActive: student.isActive !== false
    });
    setIsAddModalOpen(true);
  };

  const downloadSampleExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const data = [{
        'نام': 'علی',
        'نام خانوادگی': 'احمدی',
        'کد ملی': '1234567890',
        'شماره دانشجویی': '402123456',
        'نیمسال ورود': '4021',
        'شماره همراه': '09123456789',
        'شماره همراه ضروری': '09198765432',
        'مقطع': 'کارشناسی',
        'رشته': 'حسابداری',
        'رمز عبور': '1234567890'
      }];
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students");
      XLSX.writeFile(wb, "Sample_Students.xlsx");
    } catch (e) {
      console.error(e);
      alert('خطا در بارگذاری ماژول اکسل');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          const parsed: any[] = [];
          data.forEach((row: any) => {
            const nationalCode = row['کد ملی']?.toString().trim() || '';
            if (nationalCode) {
              const dl = row['مقطع'] === 'کارشناسی' ? 'کارشناسی' : 'کاردانی';
              parsed.push({
                nationalCode: nationalCode,
                firstName: row['نام']?.toString().trim() || '',
                lastName: row['نام خانوادگی']?.toString().trim() || '',
                studentId: row['شماره دانشجویی']?.toString().trim() || '',
                entranceSemester: row['نیمسال ورود']?.toString().trim() || SEMESTERS[0],
                mobile: row['شماره همراه']?.toString().trim() || '',
                emergencyMobile: row['شماره همراه ضروری']?.toString().trim() || '',
                degreeLevel: dl,
                major: row['رشته']?.toString().trim() || MAJORS[dl][0],
                password: row['رمز عبور']?.toString().trim() || nationalCode
              });
            }
          });
          
          setPreviewStudents(parsed);
          setShowPreview(true);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
          console.error(error);
          alert('خطا در پردازش فایل اکسل. لطفاً از قالب نمونه استفاده کنید.');
        }
      };
      reader.readAsBinaryString(file);
    } catch (e) {
      console.error(e);
      alert('خطا در بارگذاری کتابخانه اکسل');
    }
  };

  const confirmImport = () => {
    let importedCount = 0;
    const addedList: Student[] = [];
    previewStudents.forEach(s => {
      const added = storage.addStudent(s);
      if (added) addedList.push(added);
      importedCount++;
    });
    setStudents(storage.getStudents());
    setShowPreview(false);
    setIsImportModalOpen(false);
    setPreviewStudents([]);

    // Trigger batch sync to PostgreSQL database
    try {
      const token = localStorage.getItem('kowsar_jwt_token');
      const authData = localStorage.getItem('kowsar_admin_auth');
      let email = 'admin@kowsar.ac.ir';
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed.email) email = parsed.email;
        } catch {}
      }
      fetch('/api/students/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-admin-email': email
        },
        body: JSON.stringify(addedList)
      }).catch(e => console.warn('Bulk import sync error:', e));
    } catch {}

    alert(`${importedCount} دانشجو با موفقیت وارد و در پایگاه داده ذخیره شدند.`);
  };

  const cancelImport = () => {
    setShowPreview(false);
    setPreviewStudents([]);
  };

  // Filter dynamic list of majors based on degree level filter
  const availableFilterMajors = filterDegree === 'کاردانی' 
    ? MAJORS['کاردانی']
    : filterDegree === 'کارشناسی'
    ? MAJORS['کارشناسی']
    : ALL_MAJORS;

  const filteredStudents = students.filter(s => {
    const term = searchQuery.toLowerCase().trim();
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    
    const matchesSearch = !term || (
      fullName.includes(term) ||
      s.nationalCode.includes(term) ||
      (s.studentId && s.studentId.includes(term)) ||
      (s.mobile && s.mobile.includes(term))
    );

    const matchesDegree = filterDegree === 'all' || s.degreeLevel === filterDegree;
    const matchesMajor = filterMajor === 'all' || s.major === filterMajor;
    const matchesSemester = filterSemester === 'all' || s.entranceSemester === filterSemester;
    
    let matchesStatus = true;
    if (filterStatus === 'active') matchesStatus = s.isActive !== false;
    if (filterStatus === 'inactive') matchesStatus = s.isActive === false;

    return matchesSearch && matchesDegree && matchesMajor && matchesSemester && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
              مدیریت دانشجویان
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              اطلاعات تمام دانشجویان در این بخش، مستقیماً برای ورود به «میز خدمت الکترونیک» فعال است.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          <Link 
            to="/admin/student-profiles"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-5 py-3 rounded-xl font-bold transition-all shadow-sm text-sm"
          >
            <User className="w-5 h-5" />
            پرونده جامع و ویرایش تفصیلی
          </Link>
          <button 
            onClick={() => { resetForm(); setEditingStudent(null); setIsAddModalOpen(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 text-sm"
          >
            <UserPlus className="w-5 h-5" />
            ثبت دانشجو
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-xl font-bold transition-all shadow-sm text-sm"
          >
            <Upload className="w-5 h-5" />
            ورود گروهی (اکسل)
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold text-sm">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage('')}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
        {/* Search & Filters Section */}
        <div className="space-y-5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  لیست دانشجویان
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">مدیریت، جستجو و فیلتر اطلاعات</p>
              </div>
              <span className="mr-2 bg-blue-100/50 text-blue-700 text-xs px-3 py-1 rounded-full font-bold">
                {toPersianDigits(filteredStudents.length)} از {toPersianDigits(students.length)} دانشجو
              </span>
            </div>

            {hasActiveFilters && (
              <button 
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 self-end lg:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                حذف تمام فیلترها
              </button>
            )}
          </div>

          {/* Filter Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            {/* Search Query */}
            <div className="relative">
              <label className="block text-[11px] font-black text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                جستجوی متنی
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="نام، کد ملی یا ش.دانشجویی..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Entrance Semester Filter */}
            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                نیمسال ورودی
              </label>
              <select 
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="all">همه نیمسال‌ها</option>
                {SEMESTERS.map(s => (
                  <option key={s} value={s}>نیمسال {s}</option>
                ))}
              </select>
            </div>

            {/* Degree Level Filter */}
            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                مقطع تحصیلی
              </label>
              <select 
                value={filterDegree}
                onChange={(e) => {
                  setFilterDegree(e.target.value);
                  // Reset major filter if it's not valid in new degree
                  setFilterMajor('all');
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="all">همه مقاطع</option>
                <option value="کاردانی">کاردانی</option>
                <option value="کارشناسی">کارشناسی</option>
              </select>
            </div>

            {/* Major Filter */}
            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                رشته تحصیلی
              </label>
              <select 
                value={filterMajor}
                onChange={(e) => setFilterMajor(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="all">همه رشته‌ها</option>
                {availableFilterMajors.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                <Power className="w-3.5 h-3.5 text-rose-500" />
                وضعیت
              </label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
          <table className="w-full text-sm text-right">
            <thead className="text-[11px] font-black text-slate-500 bg-slate-50/80 border-b border-slate-100 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">نام و نام خانوادگی</th>
                <th className="px-5 py-4">کد ملی (نام کاربری)</th>
                <th className="px-5 py-4">شماره دانشجویی</th>
                <th className="px-5 py-4">رشته / مقطع</th>
                <th className="px-5 py-4">نیمسال ورود</th>
                <th className="px-5 py-4">شماره همراه</th>
                <th className="px-5 py-4">میز خدمت</th>
                <th className="px-5 py-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 py-4 font-bold text-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        {(student.firstName?.[0] || '') + (student.lastName?.[0] || '')}
                      </div>
                      <span className="text-[13px]">{student.firstName} {student.lastName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700 text-[13px] font-medium">
                    {toPersianDigits(student.nationalCode)}
                  </td>
                  <td className="px-5 py-4 text-slate-600 text-[13px] font-medium">
                    {toPersianDigits(student.studentId)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-bold text-slate-700 text-[13px]">{student.major}</span>
                      <span className="inline-block self-start bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {student.degreeLevel}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700 font-bold">
                    <span className="bg-amber-50 text-amber-800 border border-amber-200/50 text-[11px] px-2.5 py-1 rounded-lg">
                      {toPersianDigits(student.entranceSemester)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 text-[13px] font-medium">
                    {toPersianDigits(student.mobile)}
                  </td>
                  <td className="px-5 py-4">
                    {student.isActive === false ? (
                      <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200/60 text-[10px] font-bold px-2.5 py-1 rounded-full">
                        <Power className="w-3 h-3" />
                        غیرفعال
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[10px] font-bold px-2.5 py-1 rounded-full">
                        <KeyRound className="w-3 h-3" />
                        فعال
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/admin/student-profiles?id=${student.id}`}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="مشاهده و ویرایش پرونده جامع دانشجو"
                      >
                        <User className="w-4 h-4" />
                      </Link>
                      <button 
                        type="button"
                        onClick={() => handleToggleStatus(student)} 
                        className={`p-2 rounded-xl transition-all ${student.isActive === false ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 bg-emerald-50/60' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`} 
                        title={student.isActive === false ? "فعال‌سازی مجدد دانشجو" : "غیرفعال‌سازی دسترسی دانشجو"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => openEdit(student)} 
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" 
                        title="ویرایش مشخصات و رمز عبور"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => setStudentToDelete(student)} 
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                        title="حذف دانشجو"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-24 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-4">
                      <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <Filter className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="font-black text-slate-700 text-base">نتیجه‌ای یافت نشد</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">دانشجویی با مشخصات و فیلترهای انتخابی شما در سیستم وجود ندارد.</p>
                      </div>
                      {hasActiveFilters && (
                        <button 
                          onClick={resetFilters}
                          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-5 py-2.5 rounded-xl font-bold transition-all inline-flex items-center gap-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          پاک کردن فیلترها و نمایش همه
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    {editingStudent ? 'ویرایش اطلاعات دانشجو' : 'ثبت دانشجوی جدید'}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">لطفاً مشخصات فردی و تحصیلی را بادقت وارد کنید.</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-2xl transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">نام <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" 
                    placeholder="مثال: علی"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">نام خانوادگی <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" 
                    placeholder="مثال: محمدی"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">کد ملی (نام کاربری میز خدمت) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="nationalCode" 
                    value={formData.nationalCode} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" 
                    placeholder="0123456789"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">شماره دانشجویی</label>
                  <input 
                    type="text" 
                    name="studentId" 
                    value={formData.studentId} 
                    onChange={handleInputChange} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" 
                    placeholder="402100100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">مقطع تحصیلی</label>
                  <select 
                    name="degreeLevel" 
                    value={formData.degreeLevel} 
                    onChange={handleInputChange} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="کاردانی">کاردانی</option>
                    <option value="کارشناسی">کارشناسی</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">رشته تحصیلی</label>
                  <select 
                    name="major" 
                    value={formData.major} 
                    onChange={handleInputChange} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {MAJORS[formData.degreeLevel].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">نیمسال ورود</label>
                  <select 
                    name="entranceSemester" 
                    value={formData.entranceSemester} 
                    onChange={handleInputChange} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer" 
                  >
                    {SEMESTERS.map(s => (
                      <option key={s} value={s}>{toPersianDigits(s)} ({s})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">شماره همراه</label>
                  <input 
                    type="text" 
                    name="mobile" 
                    value={formData.mobile} 
                    onChange={handleInputChange} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" 
                    placeholder="09123456789"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">شماره همراه ضروری</label>
                  <input 
                    type="text" 
                    name="emergencyMobile" 
                    value={formData.emergencyMobile} 
                    onChange={handleInputChange} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" 
                    placeholder="09198765432"
                  />
                </div>
              </div>

              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex gap-4">
                <div className="mt-1 shrink-0"><Shield className="w-5 h-5 text-blue-600" /></div>
                <div className="w-full">
                  <label className="block text-sm font-bold text-blue-900 mb-2.5">رمز عبور اختصاصی میز خدمت</label>
                  <input 
                    type="text" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder="اگر خالی بگذارید، کد ملی به عنوان رمز عبور تنظیم می‌شود" 
                    className="w-full bg-white border border-blue-200/60 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-slate-400" 
                  />
                  <p className="text-xs text-blue-700/80 mt-2 font-medium">این رمز منحصراً برای ورود به پورتال شخصی دانشجو استفاده می‌شود.</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <Power className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-800">وضعیت حساب دانشجو</span>
                    <span className="block text-xs text-slate-500 font-medium">
                      {formData.isActive ? 'حساب کاربری فعال است و اجازه ورود به میز خدمت را دارد' : 'حساب کاربری غیرفعال است و دسترسی به میز خدمت مسدود می‌باشد'}
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="isActive"
                    checked={formData.isActive} 
                    onChange={handleInputChange} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  انصراف
                </button>
                <button type="submit" className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ذخیره اطلاعات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && !showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    ورود گروهی اطلاعات (اکسل)
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">افزودن لیست دانشجویان از طریق فایل اکسل</p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-2xl transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-emerald-50/50 text-emerald-800 p-5 rounded-2xl border border-emerald-100/50 text-sm leading-relaxed font-medium">
                <p className="mb-3 font-bold">برای ورود گروهی دانشجویان مراحل زیر را دنبال کنید:</p>
                <ol className="list-decimal list-inside space-y-2 opacity-90">
                  <li>ابتدا فایل نمونه اکسل را دانلود کنید.</li>
                  <li>اطلاعات دانشجویان را دقیقاً مطابق با ستون‌های فایل نمونه وارد کنید.</li>
                  <li>فایل ذخیره شده را در کادر زیر انتخاب کرده و آپلود کنید.</li>
                </ol>
              </div>

              <button 
                onClick={downloadSampleExcel}
                className="w-full flex justify-center items-center gap-2 border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 font-bold py-4 px-4 rounded-2xl transition-all border-dashed"
              >
                <Download className="w-5 h-5" />
                دانلود فایل نمونه اکسل
              </button>

              <div className="pt-6 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-3">انتخاب فایل اکسل تکمیل شده:</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={handleFileUpload} 
                    ref={fileInputRef}
                    className="w-full bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl px-4 py-8 text-sm focus:outline-none transition-all hover:border-blue-500 hover:bg-blue-50/20 file:hidden cursor-pointer absolute inset-0 opacity-0 z-10"
                  />
                  <div className="w-full bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl px-4 py-8 flex flex-col items-center justify-center gap-3 group-hover:border-blue-500 group-hover:bg-blue-50/20 transition-all">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-700 group-hover:text-blue-700">برای انتخاب فایل کلیک کنید</p>
                      <p className="text-xs text-slate-500 mt-1">فرمت‌های مجاز: xlsx, xls, csv</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Import Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">
                    پیش‌نمایش اطلاعات جهت تایید
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">تعداد {toPersianDigits(previewStudents.length)} دانشجو از فایل خوانده شد. پس از تایید، دسترسی میز خدمت برای آن‌ها فعال می‌شود.</p>
                </div>
              </div>
              <button onClick={cancelImport} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-2xl transition-all">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-right">
                  <thead className="text-[11px] font-black text-slate-500 bg-slate-50/80 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-4">نام و نام خانوادگی</th>
                      <th className="px-5 py-4">کد ملی</th>
                      <th className="px-5 py-4">شماره دانشجویی</th>
                      <th className="px-5 py-4">نیمسال ورود</th>
                      <th className="px-5 py-4">رشته / مقطع</th>
                      <th className="px-5 py-4">رمز عبور میز خدمت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewStudents.map((student, idx) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-800">{student.firstName} {student.lastName}</td>
                        <td className="px-5 py-3 text-slate-700 text-[13px] font-medium">{toPersianDigits(student.nationalCode)}</td>
                        <td className="px-5 py-3 text-slate-600 text-[13px] font-medium">{toPersianDigits(student.studentId)}</td>
                        <td className="px-5 py-3 text-slate-700 font-bold">
                           <span className="bg-amber-50 text-amber-800 border border-amber-200/50 text-[11px] px-2 py-0.5 rounded-md">
                             {toPersianDigits(student.entranceSemester)}
                           </span>
                        </td>
                        <td className="px-5 py-3 text-slate-700">
                          <span className="font-bold text-[13px]">{student.major}</span>
                          <span className="inline-block mr-2 bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                            {student.degreeLevel}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600 text-xs font-medium">{toPersianDigits(student.password || '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button onClick={cancelImport} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                لغو و بازگشت
              </button>
              <button onClick={confirmImport} className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                تایید نهایی و ذخیره در سیستم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(studentToDelete)}
        onClose={() => setStudentToDelete(null)}
        onConfirm={confirmDeleteStudent}
        title="حذف پرونده دانشجو"
        itemName={studentToDelete ? `${studentToDelete.firstName} ${studentToDelete.lastName}`.trim() : undefined}
        details={studentToDelete ? [
          { label: 'شماره دانشجویی', value: toPersianDigits(studentToDelete.studentId || '-') },
          { label: 'کد ملی', value: toPersianDigits(studentToDelete.nationalCode || '-') },
          { label: 'رشته تحصیلی', value: studentToDelete.major || '-' }
        ] : undefined}
      />

    </div>
  );
}
