import React, { useState, useEffect } from 'react';
import { storage, AdminUser, Role } from '../../lib/storage';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import { 
  Trash2, 
  Edit, 
  UserPlus, 
  ShieldAlert, 
  CheckSquare, 
  Square, 
  X, 
  Check, 
  Eye, 
  EyeOff, 
  Copy, 
  KeyRound, 
  Shield, 
  User, 
  Phone, 
  CreditCard, 
  LayoutGrid, 
  List, 
  Sparkles,
  Lock,
  Search,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const toPersianDigits = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/[0-9]/g, (w) => farsiDigits[+w]);
};

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', label: 'داشبورد خلاصه وضعیت' },
  { id: 'manage_students', label: 'مدیریت دانشجویان' },
  { id: 'manage_student_profiles', label: 'پرونده جامع دانشجویان' },
  { id: 'manage_tickets', label: 'درخواست‌ها و تیکت‌ها' },
  { id: 'manage_financial', label: 'امور مالی (رسیدها)' },
  { id: 'manage_portal_settings', label: 'شخصی‌سازی میز خدمت' },
  { id: 'manage_panel_settings', label: 'تنظیمات ظاهر پنل' },
  { id: 'manage_registrations', label: 'ثبت‌نام‌ها' },
  { id: 'manage_news', label: 'مدیریت اخبار و اطلاعیه‌ها' },
  { id: 'manage_presentation', label: 'معرفی مرکز (3D)' },
  { id: 'manage_banners', label: 'مدیریت بنر و تصاویر' },
  { id: 'manage_gallery', label: 'نگارخانه (گالری)' },
  { id: 'manage_forms', label: 'مدیریت جزوه و فرم‌ها' },
  { id: 'manage_contact', label: 'مدیریت پیام‌های تماس با ما' },
  { id: 'manage_settings', label: 'تنظیمات متون سایت' },
  { id: 'manage_users', label: 'مدیریت کارشناسان' },
  { id: 'manage_server_monitoring', label: 'پایش سرور و دیتابیس' },
  { id: 'view_logs', label: 'لاگ‌ها و خطایابی' },
  { id: 'view_security_logs', label: 'گزارشگیری امنیتی (Audit)' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [previewUser, setPreviewUser] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Password visibility states
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [showAddPassword, setShowAddPassword] = useState(true);
  const [showEditPassword, setShowEditPassword] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    mobile: '',
    email: '',
    password: '',
    role: 'education_expert' as Role,
    permissions: [] as string[],
  });
  const navigate = useNavigate();

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'بدون رمز', color: 'bg-slate-200', text: 'text-slate-400' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score, label: 'بسیار ضعیف', color: 'bg-red-500', text: 'text-red-600' };
    if (score === 2) return { score, label: 'ضعیف', color: 'bg-orange-500', text: 'text-orange-600' };
    if (score === 3) return { score, label: 'متوسط', color: 'bg-yellow-500', text: 'text-yellow-600' };
    return { score, label: 'قوی', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const passStrength = getPasswordStrength(formData.password);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const loadUsers = async () => {
    const localUsers = storage.getUsers();
    try {
      const token = localStorage.getItem('kowsar_jwt_token');
      const res = await fetch('/api/users', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const apiUsers: AdminUser[] = json.data.map((u: any) => {
            const matchedLocal = localUsers.find(lu => lu.id === u.id || lu.email === u.email);
            return {
              id: u.id,
              name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || matchedLocal?.name || u.email,
              firstName: u.firstName || matchedLocal?.firstName || (u.name ? u.name.split(' ')[0] : ''),
              lastName: u.lastName || matchedLocal?.lastName || (u.name ? u.name.split(' ').slice(1).join(' ') : ''),
              nationalId: u.nationalId || matchedLocal?.nationalId || '',
              mobile: u.mobile || matchedLocal?.mobile || '',
              email: u.email,
              password: u.password || matchedLocal?.password || (u.email === 'elmi_admin' ? 'M3540143041m@' : ''),
              role: u.role || matchedLocal?.role || 'education_expert',
              permissions: Array.isArray(u.permissions) 
                ? u.permissions 
                : (typeof u.permissions === 'string' ? JSON.parse(u.permissions || '[]') : (matchedLocal?.permissions || []))
            };
          });
          setUsers(apiUsers);
          localStorage.setItem('kowsar_admin_users', JSON.stringify(apiUsers));
          return;
        }
      }
    } catch (e) {
      console.warn('API connection notice, using local storage:', e);
    }
    setUsers(localUsers);
  };

  useEffect(() => {
    // Basic protection - verify super_admin or manage_users permission
    const authData = localStorage.getItem('kowsar_admin_auth');
    if (authData) {
      try {
        const user = JSON.parse(authData);
        let userPerms: string[] = [];
        if (Array.isArray(user.permissions)) {
          userPerms = user.permissions;
        } else if (typeof user.permissions === 'string') {
          try { userPerms = JSON.parse(user.permissions || '[]'); } catch { userPerms = []; }
        }
        
        const hasAccess = user.role === 'super_admin' || 
          userPerms.includes('*') || 
          userPerms.includes('manage_users');

        if (!hasAccess) {
          navigate('/admin');
          return;
        }
      } catch {
        navigate('/admin/login');
        return;
      }
    }
    loadUsers();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const selectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: AVAILABLE_PERMISSIONS.map(p => p.id)
    }));
  };

  const deselectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: ['dashboard']
    }));
  };

  const startEdit = (user: AdminUser) => {
    setEditingUser(user);
    setIsAdding(false);
    
    let fName = user.firstName || '';
    let lName = user.lastName || '';
    if (!fName && !lName && user.name) {
      const parts = user.name.split(' ');
      fName = parts[0] || '';
      lName = parts.slice(1).join(' ') || '';
    }

    setFormData({
      firstName: fName,
      lastName: lName,
      nationalId: user.nationalId || '',
      mobile: user.mobile || '',
      email: user.email,
      password: user.password || '',
      role: user.role,
      permissions: user.permissions || [],
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const fullName = `${formData.firstName} ${formData.lastName}`.trim() || formData.email;
    const updatedUser: AdminUser = {
      ...editingUser,
      name: fullName,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      nationalId: formData.nationalId.trim(),
      mobile: formData.mobile.trim(),
      email: formData.email.trim(),
      role: formData.role,
      permissions: formData.permissions,
      password: formData.password ? formData.password.trim() : (editingUser.password || '')
    };

    // 1. Immediately update in memory UI state
    setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));

    // 2. Persist in local storage
    storage.updateUser(editingUser.id, updatedUser);

    // 3. Persist to API backend
    try {
      const token = localStorage.getItem('kowsar_jwt_token');
      await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updatedUser)
      });
    } catch (err) {
      console.warn('API update user error:', err);
    }

    await loadUsers();
    setEditingUser(null);
    showNotification(`مشخصات و دسترسی «${fullName}» با موفقیت به‌روزرسانی شد.`);
    setFormData({
      firstName: '',
      lastName: '',
      nationalId: '',
      mobile: '',
      email: '',
      password: '',
      role: 'education_expert',
      permissions: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullName = `${formData.firstName} ${formData.lastName}`.trim() || formData.email;
    const newUser = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      nationalId: formData.nationalId.trim(),
      mobile: formData.mobile.trim(),
      name: fullName,
    };

    try {
      const token = localStorage.getItem('kowsar_jwt_token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.warn(data.message || 'خطا در ثبت کاربر روی سرور');
      }
    } catch (err) {
      console.warn('API add user error, saving locally:', err);
    }

    storage.addUser(newUser);
    await loadUsers();
    setIsAdding(false);
    showNotification(`کارشناس جدید «${fullName}» با موفقیت اضافه گردید.`);
    setFormData({
      firstName: '',
      lastName: '',
      nationalId: '',
      mobile: '',
      email: '',
      password: '',
      role: 'education_expert',
      permissions: [],
    });
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    if ((userToDelete.email || '').toLowerCase().trim() === 'elmi_admin') {
      showNotification('حساب مدیر اصلی و ارشد سامانه (elmi_admin) محافظت شده است و قابل حذف نمی‌باشد.', 'error');
      setUserToDelete(null);
      return;
    }
    try {
      const token = localStorage.getItem('kowsar_jwt_token');
      await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
    } catch (err) {
      console.warn('API delete user error:', err);
    }
    storage.deleteUser(userToDelete.id);
    await loadUsers();
    showNotification(`حساب کارشناس «${userToDelete.name || userToDelete.email}» حذف شد.`);
    setUserToDelete(null);
  };

  const getRoleDetails = (role: string) => {
    switch (role) {
      case 'super_admin':
        return {
          titleFa: 'مدیر ارشد سامانه',
          titleEn: 'super_admin',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          gradientClass: 'from-purple-600 to-indigo-700',
          icon: ShieldAlert
        };
      case 'education_expert':
        return {
          titleFa: 'کارشناس آموزش',
          titleEn: 'education_expert',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
          gradientClass: 'from-blue-600 to-cyan-700',
          icon: User
        };
      case 'cultural_expert':
        return {
          titleFa: 'کارشناس فرهنگی',
          titleEn: 'cultural_expert',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          gradientClass: 'from-amber-500 to-orange-600',
          icon: Sparkles
        };
      case 'custom_expert':
      default:
        return {
          titleFa: 'دسترسی سفارشی',
          titleEn: 'custom_expert',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          gradientClass: 'from-emerald-600 to-teal-700',
          icon: Shield
        };
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.nationalId && user.nationalId.includes(searchQuery)) ||
      (user.mobile && user.mobile.includes(searchQuery));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-slate-100">{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                مدیریت کارشناسان و دسترسی‌ها
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                تعریف کاربران سازمانی، مشاهده و ویرایش مشخصات پرسنلی، کد ملی، شماره همراه و سطوح دسترسی
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {!isAdding && !editingUser && (
            <button 
              onClick={() => {
                setIsAdding(true);
                setEditingUser(null);
                setShowAddPassword(true);
                setFormData({
                  firstName: '',
                  lastName: '',
                  nationalId: '',
                  mobile: '',
                  email: '',
                  password: '',
                  role: 'education_expert',
                  permissions: [],
                });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              افزودن کارشناس جدید
            </button>
          )}
        </div>
      </div>

      {/* فرم ویرایش کاربر */}
      {editingUser && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-purple-200 mb-8 max-w-3xl ring-4 ring-purple-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  ویرایش اطلاعات و پرونده کارشناس
                </h2>
                <span className="text-xs font-bold text-purple-600">
                  {editingUser.name || `${editingUser.firstName} ${editingUser.lastName}` || editingUser.email}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setEditingUser(null)}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">نام</label>
                <input 
                  type="text" required name="firstName" value={formData.firstName} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium text-slate-800"
                  placeholder="مثال: مهدی"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">نام خانوادگی</label>
                <input 
                  type="text" required name="lastName" value={formData.lastName} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium text-slate-800"
                  placeholder="مثال: کرمی"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">کد ملی</label>
                <input 
                  type="text" name="nationalId" value={formData.nationalId} onChange={handleChange} dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium text-slate-800 font-sans"
                  placeholder="۱۰ رقم کد ملی (مثال: 3540143041)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">شماره همراه</label>
                <input 
                  type="tel" name="mobile" value={formData.mobile} onChange={handleChange} dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium text-slate-800 font-sans"
                  placeholder="0917..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">نام کاربری ورود (شناسه سیستم)</label>
                <input 
                  type="text" required name="email" value={formData.email} onChange={handleChange} dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold text-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    رمز عبور کارشناس
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    تولید رمز قوی
                  </button>
                </div>
                
                <div className="relative">
                  <input 
                    type={showEditPassword ? "text" : "password"} 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    dir="ltr"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold text-slate-900 tracking-wider font-sans"
                    placeholder="رمز جدید وارد کنید یا قبلی را حفظ کنید"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-purple-600 transition-colors"
                    title={showEditPassword ? "مخفی کردن رمز" : "نمایش رمز عبور"}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                  با کلیک روی آیکون چشم، رمز عبور مستقیماً قابل رویت و بررسی است.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">نقش سازمانی و سطح دسترسی</label>
              <select 
                required name="role" value={formData.role} onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold text-slate-800"
              >
                <option value="super_admin">مدیر ارشد سامانه (Super Admin - دسترسی نامحدود)</option>
                <option value="education_expert">کارشناس آموزش (فقط دسترسی به ثبت‌نام‌ها)</option>
                <option value="cultural_expert">کارشناس فرهنگی (فقط دسترسی به اخبار و اطلاعیه‌ها)</option>
                <option value="custom_expert">دسترسی سفارشی (تعیین دستی ماژول‌ها)</option>
              </select>
            </div>

            {formData.role === 'custom_expert' && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span>تعیین دسترسی‌های اختصاصی کارشناس:</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[11px] font-bold">
                      {toPersianDigits(formData.permissions.length)} از {toPersianDigits(AVAILABLE_PERMISSIONS.length)}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      انتخاب همه
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAllPermissions}
                      className="text-[11px] font-bold text-slate-500 hover:text-red-600 hover:underline"
                    >
                      حداقل دسترسی
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVAILABLE_PERMISSIONS.map(perm => {
                    const isChecked = formData.permissions.includes(perm.id);
                    return (
                      <div 
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-purple-100/70 border-purple-300 text-purple-900 font-bold shadow-xs' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-purple-200 hover:bg-purple-50 text-xs font-medium'
                        }`}
                      >
                        {isChecked ? <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
                        <span className="text-xs">{perm.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setEditingUser(null)} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl transition-all text-xs"
              >
                انصراف
              </button>
              <button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-7 py-2.5 rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center gap-2 text-xs"
              >
                <Check className="w-4 h-4" />
                ذخیره تغییرات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* فرم ایجاد کاربر جدید */}
      {isAdding && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-purple-200 mb-8 max-w-3xl ring-4 ring-purple-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  تعریف و ایجاد حساب کارشناس جدید
                </h2>
                <p className="text-xs text-slate-500">مشخصات هویتی و رمز عبور ورود همکار جدید را وارد نمایید.</p>
              </div>
            </div>

            <button 
              onClick={() => setIsAdding(false)} 
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">نام</label>
                <input 
                  type="text" required name="firstName" value={formData.firstName} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium text-slate-800"
                  placeholder="مثال: علی"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">نام خانوادگی</label>
                <input 
                  type="text" required name="lastName" value={formData.lastName} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium text-slate-800"
                  placeholder="مثال: رضایی"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">کد ملی</label>
                <input 
                  type="text" required name="nationalId" value={formData.nationalId} onChange={handleChange} dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium text-slate-800 font-sans"
                  placeholder="۱۰ رقم کد ملی"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">شماره همراه</label>
                <input 
                  type="tel" required name="mobile" value={formData.mobile} onChange={handleChange} dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium text-slate-800 font-sans"
                  placeholder="0917..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">نام کاربری ورود (انگلیسی)</label>
                <input 
                  type="text" required name="email" value={formData.email} onChange={handleChange} dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold text-slate-800"
                  placeholder="مثال: edu_rezaei"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">رمز عبور</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    تولید رمز قوی
                  </button>
                </div>

                <div className="relative">
                  <input 
                    type={showAddPassword ? "text" : "password"} 
                    required 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    dir="ltr"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold text-slate-900 tracking-wider font-sans"
                    placeholder="کلمه عبور ورود به پنل"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-purple-600 transition-colors"
                    title={showAddPassword ? "مخفی کردن رمز" : "نمایش رمز عبور"}
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="mt-2.5 bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between">
                    <div className="flex gap-1 w-full max-w-[120px]">
                      {[1, 2, 3, 4].map(level => (
                        <div 
                          key={level} 
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            passStrength.score >= level ? passStrength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-[11px] font-bold ${passStrength.text}`}>
                      {passStrength.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">سطح دسترسی (Role)</label>
              <select 
                required name="role" value={formData.role} onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold text-slate-800"
              >
                <option value="super_admin">مدیر ارشد سامانه (دسترسی کامل به تمام بخش‌ها)</option>
                <option value="education_expert">کارشناس آموزش (فقط دسترسی به ثبت‌نام‌ها)</option>
                <option value="cultural_expert">کارشناس فرهنگی (فقط دسترسی به اخبار و اطلاعیه‌ها)</option>
                <option value="custom_expert">دسترسی سفارشی (تعیین دستی ماژول‌ها)</option>
              </select>
            </div>

            {formData.role === 'custom_expert' && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span>تعیین دسترسی‌های اختصاصی:</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[11px] font-bold">
                      {toPersianDigits(formData.permissions.length)} از {toPersianDigits(AVAILABLE_PERMISSIONS.length)}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-[11px] font-bold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      انتخاب همه
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAllPermissions}
                      className="text-[11px] font-bold text-slate-500 hover:text-red-600 hover:underline"
                    >
                      حداقل دسترسی
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVAILABLE_PERMISSIONS.map(perm => {
                    const isChecked = formData.permissions.includes(perm.id);
                    return (
                      <div 
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-purple-100/70 border-purple-300 text-purple-900 font-bold shadow-xs' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-purple-200 hover:bg-purple-50 text-xs font-medium'
                        }`}
                      >
                        {isChecked ? <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
                        <span className="text-xs">{perm.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl transition-all text-xs"
              >
                انصراف
              </button>
              <button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-7 py-2.5 rounded-xl transition-all shadow-md shadow-purple-500/20 text-xs"
              >
                ذخیره و ایجاد دسترسی
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and View Modes Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام، کد ملی، موبایل، نام کاربری..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
          />
        </div>

        {/* Role Filter and View Switcher */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">همه نقش‌ها ({toPersianDigits(users.length)})</option>
            <option value="super_admin">مدیران ارشد</option>
            <option value="education_expert">کارشناسان آموزش</option>
            <option value="cultural_expert">کارشناسان فرهنگی</option>
            <option value="custom_expert">کارشناسان سفارشی</option>
          </select>

          {/* Switcher View: Profile Cards vs Table */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="نمایش جدولی منظم"
            >
              <List className="w-3.5 h-3.5" />
              نمای جدولی
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="پیش‌نمایش پروفایل‌ها و کارت‌های پرسنلی"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              کارت‌های پرسنلی
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-black text-xs text-slate-700">مشخصات کارشناس</th>
                  <th className="px-6 py-4 font-black text-xs text-slate-700">کد ملی</th>
                  <th className="px-6 py-4 font-black text-xs text-slate-700">شماره همراه</th>
                  <th className="px-6 py-4 font-black text-xs text-slate-700">نام کاربری (شناسه)</th>
                  <th className="px-6 py-4 font-black text-xs text-slate-700">رمز عبور</th>
                  <th className="px-6 py-4 font-black text-xs text-slate-700">سطح دسترسی</th>
                  <th className="px-6 py-4 font-black text-xs text-slate-700 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((user) => {
                  const isPasswordVisible = !!showPasswordMap[user.id];
                  const roleMeta = getRoleDetails(user.role);
                  const displayName = user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.name || user.email;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleMeta.gradientClass} text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0`}>
                            {(user.firstName?.[0] || user.name?.[0] || 'U')}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="block font-black text-slate-900 text-sm">
                                {displayName}
                              </span>
                              {user.email === 'elmi_admin' && (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-300/80 text-[10px] font-black px-2 py-0.5 rounded-md shadow-2xs">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                  یوزر اصلی سایت
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium font-sans">
                              {user.email === 'elmi_admin' ? 'مدیر ارشد و مسئول اصلی سایت' : (user.role === 'super_admin' ? 'مدیر ارشد' : 'کارشناس رسمی')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* National Code */}
                      <td className="px-6 py-4 text-slate-800 font-bold">
                        {user.nationalId ? (
                          <span className="font-sans tracking-wide">
                            {toPersianDigits(user.nationalId)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">ثبت نشده</span>
                        )}
                      </td>

                      {/* Mobile Phone */}
                      <td className="px-6 py-4 text-slate-800 font-bold">
                        {user.mobile ? (
                          <span className="font-sans tracking-wide">
                            {toPersianDigits(user.mobile)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">ثبت نشده</span>
                        )}
                      </td>

                      {/* Username */}
                      <td className="px-6 py-4 text-slate-900 font-bold" dir="ltr">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-sans">
                          {user.email}
                        </span>
                      </td>
                      
                      {/* Password Cell with View / Toggle / Copy */}
                      <td className="px-6 py-4 text-slate-700 font-bold">
                        <div className="flex items-center gap-1.5">
                          {isPasswordVisible ? (
                            user.password ? (
                              <span 
                                className="font-sans text-xs px-2.5 py-1 rounded-xl bg-purple-100 text-purple-950 border border-purple-200 font-bold tracking-wider"
                                dir="ltr"
                              >
                                {user.password}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                ثبت نشده
                              </span>
                            )
                          ) : (
                            <span 
                              className="font-sans text-xs px-2.5 py-1 rounded-xl bg-slate-100 text-slate-500 font-bold tracking-widest"
                              dir="ltr"
                            >
                              ••••••••
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title={isPasswordVisible ? "مخفی کردن رمز" : "رویت رمز عبور"}
                          >
                            {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          {user.password && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(user.password || '', user.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="کپی کردن رمز عبور"
                            >
                              {copiedId === user.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Role / Access Level: Beautiful 2-Line Layout (فارسی در خط اول، انگلیسی در خط دوم) */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap border ${roleMeta.badgeClass}`}>
                            <roleMeta.icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{roleMeta.titleFa}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium px-1 font-sans" dir="ltr">
                            {roleMeta.titleEn}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setPreviewUser(user)}
                            className="text-purple-600 hover:bg-purple-50 px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold transition-colors border border-purple-100"
                            title="مشاهده شناسنامه و مشخصات کامل"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            پروفایل
                          </button>

                          <button 
                            onClick={() => startEdit(user)}
                            className="text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold transition-colors border border-blue-100"
                            title="ویرایش اطلاعات و رمز"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            ویرایش
                          </button>

                          {user.email === 'elmi_admin' ? (
                            <span className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 flex items-center gap-1 shadow-2xs">
                              <Shield className="w-3.5 h-3.5 text-amber-600" />
                              مدیر اصلی (محفوظ)
                            </span>
                          ) : (
                            <button 
                              onClick={() => setUserToDelete(user)}
                              className="text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs font-bold transition-colors border border-red-100"
                              title="حذف اکانت"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              حذف
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Profile Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const roleMeta = getRoleDetails(user.role);
            const isPasswordVisible = !!showPasswordMap[user.id];
            const displayName = user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.name || user.email;
            
            const initials = displayName
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('');

            return (
              <div 
                key={user.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:border-purple-300"
              >
                <div>
                  {/* Top Header Gradient */}
                  <div className={`h-20 bg-gradient-to-r ${user.email === 'elmi_admin' ? 'from-amber-600 via-purple-700 to-indigo-800' : roleMeta.gradientClass} p-4 flex items-start justify-between relative`}>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-black/25 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                        {user.email === 'elmi_admin' ? <Sparkles className="w-3.5 h-3.5 text-amber-300" /> : <roleMeta.icon className="w-3.5 h-3.5" />}
                        {user.email === 'elmi_admin' ? 'مدیر اصلی سامانه' : roleMeta.titleFa}
                      </span>
                      <span className="text-[9px] text-white/80 font-mono px-2" dir="ltr">
                        {user.email === 'elmi_admin' ? 'Primary Super Admin' : roleMeta.titleEn}
                      </span>
                    </div>

                    <button
                      onClick={() => setPreviewUser(user)}
                      className="text-white/80 hover:text-white bg-white/10 hover:bg-white/25 p-1.5 rounded-xl transition-colors backdrop-blur-sm"
                      title="مشاهده شناسنامه و پروفایل کامل"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Profile Header & Avatar */}
                  <div className="px-6 pt-0 pb-4 relative">
                    <div className="flex items-end justify-between -mt-9 mb-3">
                      <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-lg ring-4 ring-slate-100 flex items-center justify-center">
                        <div className={`w-full h-full rounded-xl bg-gradient-to-br ${roleMeta.gradientClass} text-white flex items-center justify-center font-black text-lg shadow-inner`}>
                          {initials || <User className="w-6 h-6" />}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          فعال در سیستم
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">
                      {displayName}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mb-3">
                      {roleMeta.titleFa}
                    </p>

                    {/* Dedicated High-Contrast User ID Badge */}
                    <div className="mb-3.5 flex items-center justify-between gap-2 bg-slate-100/90 hover:bg-slate-100 p-2.5 rounded-2xl border border-slate-200/90 transition-colors">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
                        <User className="w-3.5 h-3.5 text-purple-600" />
                        شناسه کاربری:
                      </span>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span 
                          className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-2xs truncate max-w-[160px] text-left" 
                          dir="ltr"
                          title={user.email}
                        >
                          {user.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(user.email, `email-${user.id}`)}
                          className="p-1 text-slate-400 hover:text-purple-600 hover:bg-white rounded-lg transition-colors shrink-0"
                          title="کپی شناسه کاربری"
                        >
                          {copiedId === `email-${user.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Identity Details */}
                    <div className="space-y-2.5 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          کد ملی:
                        </span>
                        <strong className="text-slate-800 font-bold font-sans">
                          {user.nationalId ? toPersianDigits(user.nationalId) : 'ثبت نشده'}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          شماره همراه:
                        </span>
                        <strong className="text-slate-800 font-bold font-sans">
                          {user.mobile ? toPersianDigits(user.mobile) : 'ثبت نشده'}
                        </strong>
                      </div>

                      {/* Password Field with Toggle & Copy */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <span className="text-slate-600 font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-purple-600" />
                          رمز عبور:
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isPasswordVisible ? (
                            user.password ? (
                              <span 
                                className="font-sans text-xs px-2 py-0.5 rounded-lg bg-purple-100 text-purple-950 border border-purple-200 font-bold tracking-wider"
                                dir="ltr"
                              >
                                {user.password}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                ثبت نشده
                              </span>
                            )
                          ) : (
                            <span 
                              className="font-sans text-xs px-2 py-0.5 rounded-lg bg-slate-200 text-slate-600 font-bold tracking-widest"
                              dir="ltr"
                            >
                              ••••••••
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title={isPasswordVisible ? "مخفی کردن رمز" : "نمایش رمز عبور"}
                          >
                            {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          {user.password && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(user.password || '', user.id)}
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="کپی کردن رمز عبور"
                            >
                              {copiedId === user.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Permissions list (if custom) */}
                    {user.role === 'custom_expert' && user.permissions && user.permissions.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                          دسترسی‌های فعال ({toPersianDigits(user.permissions.length)} مورد):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.slice(0, 3).map(pId => {
                            const pObj = AVAILABLE_PERMISSIONS.find(ap => ap.id === pId);
                            return (
                              <span key={pId} className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg border border-purple-100">
                                {pObj?.label || pId}
                              </span>
                            );
                          })}
                          {user.permissions.length > 3 && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                              +{toPersianDigits(user.permissions.length - 3)} مورد دیگر
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setPreviewUser(user)}
                    className="text-xs font-bold text-slate-600 hover:text-purple-600 flex items-center gap-1 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    مشاهده پرونده
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEdit(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-100 flex items-center gap-1 text-xs font-bold"
                      title="ویرایش مشخصات و رمز"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      ویرایش
                    </button>

                    {user.email === 'elmi_admin' ? (
                      <span className="px-2.5 py-1.5 text-amber-700 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-1 text-xs font-bold shadow-2xs">
                        <Shield className="w-3.5 h-3.5 text-amber-600" />
                        مدیر اصلی سایت
                      </span>
                    ) : (
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100 flex items-center gap-1 text-xs font-bold"
                        title="حذف حساب کارشناس"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile Preview Modal (شناسنامه و کارت پرسنلی رسمی کارشناس) */}
      {previewUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200 font-sans">
            {/* Header */}
            {(() => {
              const meta = getRoleDetails(previewUser.role);
              const isPasswordVisible = !!showPasswordMap[previewUser.id];
              const displayName = previewUser.firstName && previewUser.lastName 
                ? `${previewUser.firstName} ${previewUser.lastName}` 
                : previewUser.name || previewUser.email;

              return (
                <div>
                  <div className={`p-6 bg-gradient-to-r ${meta.gradientClass} text-white relative`}>
                    <button
                      onClick={() => setPreviewUser(null)}
                      className="absolute top-4 left-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md p-1 border border-white/30 flex items-center justify-center text-2xl font-black text-white shadow-inner">
                        {displayName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white/90 bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20 inline-block mb-1">
                          {meta.titleFa}
                        </span>
                        <h3 className="text-xl font-black text-white">{displayName}</h3>
                        <p className="text-xs text-white/80 mt-0.5 font-sans" dir="ltr">{previewUser.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4 text-xs">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                        <span className="text-slate-500 font-medium">کد ملی کارشناس:</span>
                        <strong className="text-slate-800 font-bold font-sans">
                          {previewUser.nationalId ? toPersianDigits(previewUser.nationalId) : 'ثبت نشده'}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                        <span className="text-slate-500 font-medium">شماره تلفن همراه:</span>
                        <strong className="text-slate-800 font-bold font-sans">
                          {previewUser.mobile ? toPersianDigits(previewUser.mobile) : 'ثبت نشده'}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                        <span className="text-slate-500 font-medium">سطح دسترسی سیستمی:</span>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${meta.badgeClass}`}>
                            {meta.titleFa}
                          </span>
                          <span className="text-[9px] text-slate-400 font-sans" dir="ltr">{meta.titleEn}</span>
                        </div>
                      </div>

                      {/* Password Row in Modal */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-purple-700 font-black flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-purple-600" />
                          رمز عبور ورود:
                        </span>
                        <div className="flex items-center gap-2">
                          {isPasswordVisible ? (
                            previewUser.password ? (
                              <span 
                                className="font-sans text-xs px-3 py-1 rounded-xl bg-purple-100 text-purple-950 border border-purple-300 font-bold tracking-wider"
                                dir="ltr"
                              >
                                {previewUser.password}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                ثبت نشده
                              </span>
                            )
                          ) : (
                            <span 
                              className="font-sans text-xs px-3 py-1 rounded-xl bg-slate-200 text-slate-600 font-bold tracking-widest"
                              dir="ltr"
                            >
                              ••••••••
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(previewUser.id)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl"
                            title={isPasswordVisible ? "مخفی کردن" : "نمایش رمز"}
                          >
                            {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          {previewUser.password && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(previewUser.password || '', previewUser.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl"
                              title="کپی کردن رمز عبور"
                            >
                              {copiedId === previewUser.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Permissions list */}
                    <div>
                      <h4 className="font-bold text-slate-700 mb-2">مجوزها و بخش‌های مجاز:</h4>
                      {previewUser.role === 'super_admin' ? (
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-xs font-bold flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
                          دسترسی نامحدود به تمامی ماژول‌ها، تنظیمات، بانک اطلاعاتی و مدیریت سیستم
                        </div>
                      ) : previewUser.permissions && previewUser.permissions.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {previewUser.permissions.map(pId => {
                            const pObj = AVAILABLE_PERMISSIONS.find(ap => ap.id === pId);
                            return (
                              <div key={pId} className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-700">
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{pObj?.label || pId}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                          دسترسی‌های پایه سازمانی بر اساس نقش «{meta.titleFa}»
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setPreviewUser(null);
                          startEdit(previewUser);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        ویرایش این کاربر
                      </button>

                      <button
                        onClick={() => setPreviewUser(null)}
                        className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-xs"
                      >
                        بستن
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Confirm Delete */}
      <DeleteConfirmModal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="حذف حساب کاربری کارشناس"
        itemName={userToDelete?.name || userToDelete?.email}
        details={userToDelete ? [
          { label: 'نقش کاربری', value: userToDelete.role === 'admin' ? 'مدیر ارشد' : 'کارشناس' },
          { label: 'نام کاربری / ایمیل', value: userToDelete.email }
        ] : undefined}
      />
    </div>
  );
}
