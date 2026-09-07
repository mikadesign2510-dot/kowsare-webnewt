import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Lock, Eye, EyeOff, 
  AlertCircle, 
  ArrowLeft, 
  GraduationCap, 
  KeyRound, 
  CheckCircle2, 
  PhoneCall, 
  RotateCcw, 
  X, 
  HelpCircle, 
  AlertTriangle,
  Smartphone,
  Send,
  Clock,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Check,
  Copy,
  ChevronRight,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { storage, PortalUser, PortalSettings, defaultPortalSettings } from '../../lib/storage';

const toPersianDigits = (num: string | number | undefined | null) => {
  if (num === undefined || num === null || num === '') return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
};

export default function PortalLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [nationalCode, setNationalCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [deactivatedNotice, setDeactivatedNotice] = useState<string | null>(null);
  const [portalSettings, setPortalSettings] = useState<PortalSettings>(defaultPortalSettings);

  // Forgot password modal states
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify' | 'new_password'>('request');
  const [forgotNatCode, setForgotNatCode] = useState('');
  const [forgotMobile, setForgotMobile] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);
  
  // Timer & feedback
  const [countdown, setCountdown] = useState(0);
  const [simulatedSms, setSimulatedSms] = useState<{ sender: string; text: string; code: string } | null>(null);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    // Check if redirected due to deactivation / kickout
    const reason = sessionStorage.getItem('kowsar_portal_kickout_reason');
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('deactivated') === '1' || reason) {
      setDeactivatedNotice(reason || 'حساب کاربری شما توسط اداره آموزش دانشگاه غیرفعال گردیده و دسترسی شما به میز خدمت قطع شد. جهت بررسی وضعیت با کارشناس آموزش تماس حاصل فرمایید.');
      sessionStorage.removeItem('kowsar_portal_kickout_reason');
    }

    setPortalSettings(storage.getPortalSettings());

    const handleSettingsChange = () => {
      setPortalSettings(storage.getPortalSettings());
    };
    window.addEventListener('kowsar_portal_settings_changed', handleSettingsChange);
    return () => window.removeEventListener('kowsar_portal_settings_changed', handleSettingsChange);
  }, [location.search]);

  // OTP Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if portal is under maintenance
    if (portalSettings.isPortalEnabled === false) {
      setError(portalSettings.maintenanceMessage || 'میز خدمت دانشجویان موقتاً جهت بروزرسانی تا اطلاع ثانوی در دسترس نمی‌باشد.');
      return;
    }

    const username = nationalCode.trim();
    const pass = password.trim();

    // 1. Try Server Database Login first
    try {
      const resp = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId: username, password: pass })
      });
      const data = await resp.json();

      if (resp.status === 403) {
        setError(data.message || 'حساب کاربری شما توسط آموزش غیرفعال شده است.');
        return;
      }

      if (resp.ok && data.success && data.data) {
        const student = data.data;
        const studentUser: PortalUser = {
          id: `std_${student.id || username}`,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'دانشجو',
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          nationalCode: student.nationalCode || username,
          studentId: student.studentId || '',
          major: student.major || '',
          degreeLevel: student.degreeLevel || '',
          entranceSemester: student.entranceSemester || '',
          mobile: student.mobile || '',
          emergencyMobile: student.emergencyMobile || '',
          role: 'student',
          isApproved: true,
          createdAt: student.createdAt || new Date().toISOString()
        };

        if (data.token) {
          localStorage.setItem('kowsar_portal_token', data.token);
        }
        localStorage.setItem('kowsar_portal_auth', JSON.stringify(studentUser));

        // Sync tickets & receipts in background
        storage.syncTicketsWithDB().catch(() => {});
        storage.syncReceiptsWithDB().catch(() => {});

        navigate('/portal');
        return;
      }
    } catch (apiErr) {
      console.warn('Server auth request error, fallback to local store:', apiErr);
    }

    // 2. Fallback check in local Students database
    const students = storage.getStudents();
    
    // First check if the credentials match any student
    const credentialMatchedStudent = students.find(s => 
      (s.nationalCode === username || (s.studentId && s.studentId === username)) &&
      ((s.password && s.password === pass) || (!s.password && s.nationalCode === pass))
    );

    if (credentialMatchedStudent) {
      if (credentialMatchedStudent.isActive === false) {
        setError('حساب کاربری شما توسط آموزش غیرفعال شده است.');
        return;
      }
      
      const studentUser: PortalUser = {
        id: `std_${credentialMatchedStudent.id}`,
        name: `${credentialMatchedStudent.firstName} ${credentialMatchedStudent.lastName}`.trim() || 'دانشجو',
        firstName: credentialMatchedStudent.firstName,
        lastName: credentialMatchedStudent.lastName,
        nationalCode: credentialMatchedStudent.nationalCode,
        studentId: credentialMatchedStudent.studentId,
        major: credentialMatchedStudent.major,
        degreeLevel: credentialMatchedStudent.degreeLevel,
        entranceSemester: credentialMatchedStudent.entranceSemester,
        mobile: credentialMatchedStudent.mobile,
        emergencyMobile: credentialMatchedStudent.emergencyMobile,
        role: 'student',
        isApproved: true,
        createdAt: credentialMatchedStudent.createdAt
      };
      localStorage.setItem('kowsar_portal_auth', JSON.stringify(studentUser));
      navigate('/portal');
      return;
    }

    // 3. Check in general Portal Users (professors, custom registered portal accounts)
    const users = storage.getPortalUsers();
    const user = users.find(u => 
      (u.nationalCode === username || (u.studentId && u.studentId === username)) && 
      u.password === pass
    );

    if (user) {
      if (!user.isApproved) {
        setError('حساب کاربری شما در انتظار تایید توسط آموزش است.');
        return;
      }
      localStorage.setItem('kowsar_portal_auth', JSON.stringify(user));
      navigate('/portal');
      return;
    }

    setError('کد ملی / شماره دانشجویی یا رمز عبور اشتباه است.');
  };

  // Open recovery modal
  const handleOpenRecovery = () => {
    setForgotNatCode(nationalCode);
    setForgotMobile('');
    setEnteredOtp('');
    setGeneratedOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setSimulatedSms(null);
    setRecoveryStep('request');
    setIsForgotModalOpen(true);
  };

  // Plan 1: Step 1 -> Send SMS OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const targetNat = forgotNatCode.trim();
    const targetMob = forgotMobile.trim();
    const clientIp = '127.0.0.1'; // Simulated Client IP

    if (!targetNat) {
      setForgotError('لطفاً کد ملی یا شماره دانشجویی خود را وارد نمایید.');
      return;
    }

    if (!targetMob) {
      setForgotError('لطفاً شماره تلفن همراه خود را وارد نمایید.');
      return;
    }

    const cfg = portalSettings.passwordRecovery;
    const students = storage.getStudents();
    const foundStudent = students.find(s => 
      s.nationalCode === targetNat || (s.studentId && s.studentId === targetNat)
    );

    // If student not found in main database, also check portal users
    const pUsers = storage.getPortalUsers();
    const foundUser = pUsers.find(u => u.nationalCode === targetNat || u.studentId === targetNat);

    if (!foundStudent && !foundUser) {
      storage.addSecurityLog({
        eventType: 'auth_attempt',
        severity: 'medium',
        message: 'تلاش ناموفق بازیابی رمز عبور (کاربر یافت نشد)',
        details: `کد ملی / دانشجویی وارد شده: ${targetNat}`,
        ipAddress: clientIp
      });
      setForgotError('دانشجویی با این کد ملی در سامانه یافت نشد. لطفاً از صحت اطلاعات اطمینان حاصل نمایید.');
      return;
    }

    // Validate mobile matching if required
    if (cfg?.smsRequireMobileMatch) {
      const studentMobile = foundStudent?.mobile || foundStudent?.emergencyMobile || foundUser?.mobile || '';
      const cleanTarget = targetMob.replace(/\D/g, '').slice(-7);
      const cleanRecord = studentMobile.replace(/\D/g, '').slice(-7);
      
      if (cleanRecord && cleanTarget && cleanRecord !== cleanTarget) {
        storage.addSecurityLog({
          eventType: 'auth_attempt',
          severity: 'medium',
          message: 'تلاش ناموفق بازیابی رمز عبور (عدم تطابق شماره همراه)',
          details: `کد ملی: ${targetNat} | شماره همراه وارد شده: ${targetMob}`,
          ipAddress: clientIp
        });
        setForgotError('شماره همراه وارد شده با شماره ثبت‌شده در پرونده این دانشجو مطابقت ندارد.');
        return;
      }
    }

    // Generate random code
    const length = cfg?.smsOtpCodeLength || 5;
    let randomDigits = '';
    for (let i = 0; i < length; i++) {
      randomDigits += Math.floor(Math.random() * 10).toString();
    }

    setGeneratedOtp(randomDigits);
    setTargetStudentId(foundStudent ? foundStudent.id : (foundUser ? foundUser.id : null));

    // Prepare simulated SMS content
    const template = cfg?.smsPatternTemplate || 'کد تایید بازیابی رمز عبور: {code}';
    const sender = cfg?.smsSenderName || 'مرکز آموزش علمی کاربردی کوثر کاکی';
    const smsMessage = template.replace('{code}', randomDigits);

    setSimulatedSms({
      sender,
      text: smsMessage,
      code: randomDigits
    });

    // Start timer
    setCountdown(cfg?.smsOtpExpirySeconds || 120);
    setRecoveryStep('verify');
    setForgotSuccess(`کد تایید پیامکی به شماره ${toPersianDigits(targetMob)} ارسال گردید.`);
    
    storage.addSecurityLog({
      eventType: 'auth_attempt',
      severity: 'low',
      message: 'ارسال موفق کد تایید پیامکی جهت بازیابی رمز',
      details: `کد ملی: ${targetNat} | شماره همراه: ${targetMob}`,
      ipAddress: clientIp
    });
  };

  // Plan 1: Step 2 -> Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    const clientIp = '127.0.0.1'; // Simulated Client IP

    if (countdown <= 0) {
      storage.addSecurityLog({
        eventType: 'auth_attempt',
        severity: 'low',
        message: 'انقضای مهلت کد تایید پیامکی',
        details: `کد ملی: ${forgotNatCode.trim()}`,
        ipAddress: clientIp
      });
      setForgotError('مهلت استفاده از این کد پیامکی منقضی شده است. لطفاً مجدداً درخواست ارسال کد نمایید.');
      return;
    }

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      storage.addSecurityLog({
        eventType: 'auth_attempt',
        severity: 'high',
        message: 'تلاش ناموفق بازیابی رمز عبور (کد تایید اشتباه)',
        details: `کد ملی: ${forgotNatCode.trim()} | کد وارد شده: ${enteredOtp.trim()}`,
        ipAddress: clientIp
      });
      setForgotError('کد تایید وارد شده نادرست است. لطفاً پیامک دریافتی را مجدداً بررسی نمایید.');
      return;
    }

    setForgotError('');
    setForgotSuccess('هویت شما با موفقیت تایید شد. اکنون رمز عبور جدید خود را تعیین فرمایید.');
    setRecoveryStep('new_password');
  };

  // Plan 1: Step 3 -> Set New Password
  const handleSetNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    const clientIp = '127.0.0.1'; // Simulated Client IP

    const minLen = portalSettings.passwordRecovery?.smsMinPasswordLength || 6;
    if (newPassword.length < minLen) {
      setForgotError(`طول رمز عبور جدید باید حداقل ${toPersianDigits(minLen)} کاراکتر باشد.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('رمز عبور جدید و تکرار آن یکسان نمی‌باشند.');
      return;
    }

    const targetNat = forgotNatCode.trim();
    const students = storage.getStudents();
    const foundStudent = students.find(s => s.nationalCode === targetNat || s.studentId === targetNat || s.id === targetStudentId);

    if (foundStudent) {
      storage.updateStudent(foundStudent.id, { password: newPassword });
    }

    // Persist new password to PostgreSQL database
    try {
      fetch('/api/portal/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nationalId: targetNat,
          newPassword
        })
      }).catch(err => console.warn('Reset password API sync error:', err));
    } catch (e) {
      console.warn(e);
    }

    // Sync portal users
    const pUsers = storage.getPortalUsers();
    const updatedUsers = pUsers.map(u => {
      if (u.nationalCode === targetNat || u.studentId === targetNat || (targetStudentId && u.id === `std_${targetStudentId}`)) {
        return { ...u, password: newPassword };
      }
      return u;
    });
    storage.savePortalUsers(updatedUsers);

    // Save security log
    storage.addSecurityLog({
      eventType: 'auth_attempt',
      severity: 'low',
      message: 'بازیابی و تغییر رمز عبور دانشجو از طریق پیامک (موفقیت‌آمیز)',
      details: `کد ملی: ${targetNat}`,
      ipAddress: clientIp
    });

    setNationalCode(targetNat);
    setPassword(newPassword);
    setForgotSuccess('رمز عبور شما با موفقیت تغییر یافت. در حال انتقال به صفحه ورود...');

    setTimeout(() => {
      setIsForgotModalOpen(false);
      setForgotSuccess('');
    }, 2000);
  };

  const handleCopyOtp = () => {
    if (simulatedSms?.code) {
      setEnteredOtp(simulatedSms.code);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  const activePlan = portalSettings.passwordRecovery?.activePlan || 'sms_otp';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          بازگشت به سایت
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6"
        >
          <div className="text-center">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">
              {portalSettings.loginTitle || 'میز خدمت الکترونیک'}
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium">
              {portalSettings.loginSubtitle || 'پورتال دانشجویان و اساتید مرکز کوثر کاکی'}
            </p>
          </div>

          {/* Deactivation Banner */}
          {deactivatedNotice && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 text-red-900 p-4 rounded-2xl text-xs font-bold border-2 border-red-200 shadow-sm"
            >
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-black text-sm text-red-900">عدم دسترسی به میز خدمت (حساب غیرفعال)</p>
                  <p className="leading-relaxed text-red-700">{deactivatedNotice}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Maintenance Notice if disabled */}
          {portalSettings.isPortalEnabled === false && (
            <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-start gap-2.5 border border-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-sm text-rose-900 mb-0.5">میز خدمت در حالت تعمیرات است</p>
                <p className="leading-relaxed text-rose-700">{portalSettings.maintenanceMessage}</p>
              </div>
            </div>
          )}

          {/* Alert Banner if configured */}
          {portalSettings.loginAlertBanner && portalSettings.isPortalEnabled !== false && (
            <div className="bg-amber-50 text-amber-900 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{portalSettings.loginAlertBanner}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 text-xs">کد ملی یا شماره دانشجویی</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  required
                  value={nationalCode}
                  onChange={(e) => setNationalCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pr-11 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-left text-sm"
                  dir="ltr"
                  placeholder="کد ملی یا شماره دانشجویی"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-700 font-bold text-xs">رمز عبور (پیش‌فرض: کد ملی)</label>
                <button
                  type="button"
                  onClick={handleOpenRecovery}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  فراموشی رمز عبور؟
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pr-11 pl-11 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-left text-sm"
                  dir="ltr"
                  placeholder="رمز عبور"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-blue-500/20 text-sm"
            >
              ورود به میز خدمت
            </button>
          </form>

          <div className="text-center text-xs font-medium text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
            <p className="text-slate-700 font-bold">
              {portalSettings.loginHelperText || 'نام کاربری شماره دانشجویی یا کد ملی و رمز عبور پیش‌فرض کد ملی شما می‌باشد.'}
            </p>
            {portalSettings.supportPhone && (
              <p className="text-[11px] text-slate-400">
                پشتیبانی تلفنی: <span className="font-bold text-slate-600" dir="ltr">{toPersianDigits(portalSettings.supportPhone)}</span>
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Password Recovery Modal (Supports both Plan 1 SMS and Plan 2 Support Contact) */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white rounded-3xl p-6 md:p-8 w-full shadow-2xl border border-slate-100 space-y-5 ${
                activePlan === 'support_contact' ? 'max-w-lg' : 'max-w-md'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    activePlan === 'sms_otp' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {activePlan === 'sms_otp' ? <Smartphone className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base">
                      {activePlan === 'sms_otp' 
                        ? 'بازیابی رمز عبور پیامکی (OTP)' 
                        : (portalSettings.passwordRecovery?.supportBoxTitle || 'بازیابی رمز عبور از طریق کارشناس فنی')}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {activePlan === 'sms_otp' 
                        ? (recoveryStep === 'request' ? 'گام ۱: دریافت کد تایید پیامکی' : recoveryStep === 'verify' ? 'گام ۲: تایید کد پیامک' : 'گام ۳: تعیین رمز عبور دلخواه')
                        : 'راهنمای ارتباط مستقیم با پشتیبانی فنی مرکز کوثر کاکی'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error Message */}
              {forgotError && (
                <div className="bg-rose-50 text-rose-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* Success Message */}
              {forgotSuccess && (
                <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {/* ========================================================================= */}
              {/* PLAN 1: SMS OTP RECOVERY FLOW */}
              {/* ========================================================================= */}
              {activePlan === 'sms_otp' && (
                <div className="space-y-4">
                  {/* Interactive simulated SMS push notification */}
                  {simulatedSms && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5 text-emerald-800 text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          پیامک دریافتی از: {simulatedSms.sender}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyOtp}
                          className="flex items-center gap-1 text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedNotification ? 'درج شد!' : 'درج خودکار کد'}
                        </button>
                      </div>
                      <p className="text-[11px] leading-relaxed font-mono bg-white/80 p-2 rounded-xl border border-emerald-200/60 text-slate-800" dir="rtl">
                        {simulatedSms.text}
                      </p>
                    </div>
                  )}

                  {/* Step 1: Request SMS Code */}
                  {recoveryStep === 'request' && (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-xs">کد ملی یا شماره دانشجویی *</label>
                        <div className="relative">
                          <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={forgotNatCode}
                            onChange={e => setForgotNatCode(e.target.value)}
                            placeholder="کد ملی ده‌رقمی"
                            dir="ltr"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-left"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-xs">شماره تلفن همراه دانشجو *</label>
                        <div className="relative">
                          <Smartphone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={forgotMobile}
                            onChange={e => setForgotMobile(e.target.value)}
                            placeholder="0917..."
                            dir="ltr"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-left"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">کد تایید احراز هویت به این شماره پیامک خواهد شد.</span>
                      </div>

                      <div className="flex justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsForgotModalOpen(false)}
                          className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200"
                        >
                          انصراف
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
                        >
                          <Send className="w-3.5 h-3.5" />
                          ارسال پیامک کد تایید
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Step 2: Enter & Verify Code */}
                  {recoveryStep === 'verify' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-slate-700 font-bold text-xs">کد تایید پیامک‌شده را وارد کنید *</label>
                          <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            <Clock className="w-3 h-3" />
                            <span>
                              {toPersianDigits(Math.floor(countdown / 60).toString().padStart(2, '0'))}:
                              {toPersianDigits((countdown % 60).toString().padStart(2, '0'))}
                            </span>
                          </div>
                        </div>
                        <div className="relative">
                          <KeyRound className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            maxLength={portalSettings.passwordRecovery?.smsOtpCodeLength || 6}
                            value={enteredOtp}
                            onChange={e => setEnteredOtp(e.target.value)}
                            placeholder="کد چندرقمی پیامک"
                            dir="ltr"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-base font-black tracking-widest text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          type="button"
                          onClick={() => setRecoveryStep('request')}
                          className="text-slate-500 hover:text-slate-700 font-bold text-[11px]"
                        >
                          تغییر شماره یا کد ملی
                        </button>

                        <button
                          type="button"
                          disabled={countdown > 0}
                          onClick={handleSendOtp}
                          className={`font-bold text-[11px] flex items-center gap-1 ${
                            countdown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-emerald-700 hover:underline'
                          }`}
                        >
                          <RotateCcw className="w-3 h-3" />
                          ارسال مجدد کد
                        </button>
                      </div>

                      <div className="flex justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsForgotModalOpen(false)}
                          className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200"
                        >
                          انصراف
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          تایید کد و مرحله بعد
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Step 3: Set New Password */}
                  {recoveryStep === 'new_password' && (
                    <form onSubmit={handleSetNewPassword} className="space-y-4">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-xs">رمز عبور جدید *</label>
                        <div className="relative">
                          <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder={`حداقل ${portalSettings.passwordRecovery?.smsMinPasswordLength || 6} کاراکتر`}
                            dir="ltr"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-left"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1 text-xs">تکرار رمز عبور جدید *</label>
                        <div className="relative">
                          <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="تکرار دقیق رمز جدید"
                            dir="ltr"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-left"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsForgotModalOpen(false)}
                          className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200"
                        >
                          انصراف
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          ذخیره رمز عبور جدید و ورود
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* PLAN 2: CONTACT SUPPORT / EXPERT BOX */}
              {/* ========================================================================= */}
              {activePlan === 'support_contact' && (
                <div className="space-y-4">
                  {/* Description message */}
                  <div className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-100 text-xs text-indigo-950 space-y-1">
                    <p className="text-[11px] leading-relaxed">
                      {portalSettings.passwordRecovery?.supportBoxDescription || 'دانشجوی گرامی، جهت تغییر و بازیابی رمز عبور لطفاً با کارشناس پشتیبانی فنی و آموزش تماس حاصل فرمایید.'}
                    </p>
                  </div>

                  {/* Contact details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">کارشناس مسئول:</span>
                      <span className="font-black text-slate-800 text-xs">
                        {portalSettings.passwordRecovery?.supportExpertName || 'مهندس زارعی (پشتیبانی فنی)'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">شماره تلفن مستقیم:</span>
                      <a 
                        href={`tel:${portalSettings.passwordRecovery?.supportExpertPhone || portalSettings.supportPhone}`}
                        className="font-black text-blue-600 hover:underline text-xs flex items-center gap-1.5"
                        dir="ltr"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        {toPersianDigits(portalSettings.passwordRecovery?.supportExpertPhone || portalSettings.supportPhone)}
                      </a>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">شماره همراه کارشناس:</span>
                      <span className="font-black text-indigo-700 text-xs" dir="ltr">
                        {toPersianDigits(portalSettings.passwordRecovery?.supportExpertMobile || '۰۹۱۷۱۷۰۰۰۰۰')}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">ساعات پاسخگویی:</span>
                      <span className="font-bold text-slate-700 text-xs">
                        {portalSettings.passwordRecovery?.supportExpertHours || 'شنبه تا چهارشنبه ۰۸:۰۰ الی ۱۴:۰۰'}
                      </span>
                    </div>

                    {portalSettings.passwordRecovery?.supportMessengerChannel && (
                      <div className="sm:col-span-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">شناسه پیام‌رسان (ایتا / تلگرام):</span>
                          <span className="font-bold text-slate-700 text-xs" dir="ltr">
                            @{portalSettings.passwordRecovery.supportMessengerChannel}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-xl">
                          پشتیبانی آنلاین
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Guidance & instructions list */}
                  {portalSettings.passwordRecovery?.supportInstructions && portalSettings.passwordRecovery.supportInstructions.length > 0 && (
                    <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100 space-y-2">
                      <span className="text-[11px] font-black text-amber-900 block flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                        مراحل و دستورالعمل بازیابی رمز:
                      </span>
                      <ul className="space-y-1.5 text-[11px] text-amber-800 font-medium">
                        {portalSettings.passwordRecovery.supportInstructions.map((ins, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {toPersianDigits(i + 1)}
                            </span>
                            <span>{ins}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200"
                    >
                      بستن
                    </button>
                    {portalSettings.passwordRecovery?.supportExpertPhone && (
                      <a
                        href={`tel:${portalSettings.passwordRecovery.supportExpertPhone}`}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        تماس تلفنی با کارشناس
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

