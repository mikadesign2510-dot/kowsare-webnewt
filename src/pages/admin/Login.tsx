import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, User, ShieldCheck, Loader2, RefreshCw, AlertTriangle, ShieldAlert, Eye, EyeOff, ArrowRight, Home, Clock } from 'lucide-react';
import { storage } from '../../lib/storage';
import { getAdminSession, initAdminSession, getSessionTimeoutMinutes } from '../../lib/adminSession';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Generate random 5-character alphanumeric captcha
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  useEffect(() => {
    // ۱. بررسی اینکه آیا کارشناس قبلاً لاگین کرده و نشست او هنوز منقضی نشده است
    const activeSession = getAdminSession();
    if (activeSession) {
      // کارشناس نشست معتبر دارد؛ نیازی به ورود مجدد نیست و مستقیماً وارد پنل می‌شود
      navigate('/admin', { replace: true });
      return;
    }

    // ۲. بررسی دلیل خروج (عدم فعالیت ۱۰ دقیقه‌ای یا خروج عادی)
    const searchParams = new URLSearchParams(location.search);
    const reason = searchParams.get('reason') || localStorage.getItem('kowsar_admin_logout_reason');
    if (reason === 'inactivity') {
      const timeoutMins = getSessionTimeoutMinutes();
      setInactivityNotice(`نشست شما پس از ${timeoutMins} دقیقه عدم فعالیت جهت حفظ امنیت اطلاعات مرکز پایان یافت. لطفاً برای ورود مجدد، مشخصات خود را وارد نمایید.`);
      localStorage.removeItem('kowsar_admin_logout_reason');
    }

    generateCaptcha();

    // Check if account / IP is currently in a temporary lockout
    const checkLockout = () => {
      const lockExpiry = localStorage.getItem('kowsar_login_lockout_until');
      if (lockExpiry) {
        const remaining = Math.ceil((parseInt(lockExpiry, 10) - Date.now()) / 1000);
        if (remaining > 0) {
          setLockoutRemaining(remaining);
        } else {
          localStorage.removeItem('kowsar_login_lockout_until');
          localStorage.setItem('kowsar_login_failed_attempts', '0');
          setLockoutRemaining(0);
          setFailedAttempts(0);
        }
      } else {
        const savedAttempts = parseInt(localStorage.getItem('kowsar_login_failed_attempts') || '0', 10);
        setFailedAttempts(savedAttempts);
      }
    };

    checkLockout();

    const timer = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          localStorage.removeItem('kowsar_login_lockout_until');
          localStorage.setItem('kowsar_login_failed_attempts', '0');
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set internal IP / client identification without slow external API calls
    if (!localStorage.getItem('kowsar_user_ip')) {
      localStorage.setItem('kowsar_user_ip', '127.0.0.1');
    }

    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) {
      return;
    }

    setError('');

    // 1. بررسی اعتبارسنجی کد امنیتی (کپچا)
    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setError('کد امنیتی تصویر (کپچا) اشتباه وارد شده است.');
      generateCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      // ۲. تلاش برای لاگین امن از طریق API سرور و دیتابیس PostgreSQL
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.includes('@') ? email : `${email}@kowsar.ac.ir`,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // Reset failed attempts on success
          localStorage.removeItem('kowsar_login_failed_attempts');
          localStorage.removeItem('kowsar_login_lockout_until');

          if (data.token) {
            localStorage.setItem('kowsar_jwt_token', data.token);
          }

          const loggedInUser = data.user || { name: 'مدیر سامانه', email, role: 'super_admin' };
          if (loggedInUser.permissions && typeof loggedInUser.permissions === 'string') {
            try { loggedInUser.permissions = JSON.parse(loggedInUser.permissions); } catch {}
          }
          if (!loggedInUser.permissions || loggedInUser.permissions.length === 0) {
            const localUserMatch = storage.getUsers().find(u => 
              (u.email || '').toLowerCase() === email.toLowerCase() || 
              (u.email || '').split('@')[0] === email.split('@')[0]
            );
            if (localUserMatch) {
              loggedInUser.permissions = localUserMatch.permissions;
              loggedInUser.role = localUserMatch.role || loggedInUser.role;
            }
          }

          // راه‌اندازی نشست معتبر با ثبت زمان آخرین فعالیت
          initAdminSession(loggedInUser, data.token);
          navigate('/admin');
          return;
        }
      }
    } catch (apiError) {
      console.warn('API login request failed, checking local storage fallback:', apiError);
    }

    // ۳. بررسی حالت پشتیبان محلی (Offline Fallback)
    const localUser = storage.loginUser(email, password);
    if (localUser) {
      // Reset failed attempts on success
      localStorage.removeItem('kowsar_login_failed_attempts');
      localStorage.removeItem('kowsar_login_lockout_until');

      storage.addSecurityLog({
        eventType: 'login_success',
        severity: 'low',
        message: 'ورود موفقیت‌آمیز به پنل مدیریت',
        userEmail: email,
        details: `نام کاربر: ${localUser.name} | نقش: ${localUser.role}`,
      });
      // راه‌اندازی نشست معتبر با ثبت زمان آخرین فعالیت
      initAdminSession(localUser);
      navigate('/admin');
    } else {
      // افزایش شمارنده تلاش‌های ناموفق
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      localStorage.setItem('kowsar_login_failed_attempts', newAttempts.toString());

      // اگر تعداد تلاش‌های ناموفق به ۴ یا بیشتر رسید: قفل ۳۰ ثانیه‌ای
      if (newAttempts >= 4) {
        const lockoutSeconds = 30;
        const lockExpiry = Date.now() + lockoutSeconds * 1000;
        localStorage.setItem('kowsar_login_lockout_until', lockExpiry.toString());
        setLockoutRemaining(lockoutSeconds);

        storage.addSecurityLog({
          eventType: 'account_locked',
          severity: 'critical',
          message: 'مسدودسازی هوشمند موقت به دلیل تلاش‌های مکرر ناموفق (Brute-Force Protection)',
          userEmail: email || 'نامشخص',
          details: `شناسایی ${newAttempts} تلاش ناموفق پیاپی. دسترسی به مدت ۳۰ ثانیه مسدود شد.`,
        });

        setError(`به دلیل ۴ تلاش ناموفق، دسترسی شما به مدت ۳۰ ثانیه مسدود شد.`);
      } else {
        storage.addSecurityLog({
          eventType: 'login_failed',
          severity: 'medium',
          message: 'تلاش ناموفق برای ورود به پنل',
          userEmail: email,
          details: `رمز عبور یا نام کاربری اشتباه وارد شده است. (تلاش ${newAttempts} از ۴)`,
        });
        setError(`نام کاربری یا رمز عبور اشتباه است. (${4 - newAttempts} تلاش باقیمانده تا قفل موقت)`);
      }

      generateCaptcha();
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-4 relative" dir="rtl">
      {/* دکمه بازگشت شناور بالا */}
      <div className="absolute top-6 right-6">
        <Link
          to="/"
          className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 px-4 py-2 rounded-2xl shadow-sm border border-slate-200 text-xs font-bold transition-all hover:shadow"
        >
          <ArrowRight className="w-4 h-4 text-blue-600" />
          <span>بازگشت به صفحه اصلی سایت</span>
        </Link>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">ورود به پنل مدیریت</h1>
          <p className="text-slate-500 mt-1 text-sm">مرکز آموزش علمی کاربردی کوثر کاکی</p>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 py-1.5 px-3 rounded-xl border border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            اتصال امن و محافظت‌شده فعال است
          </div>
        </div>

        {/* اخطار پایان نشست به دلیل عدم فعالیت ۵ تا ۱۰ دقیقه‌ای */}
        {inactivityNotice && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl mb-6 text-center space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-center gap-2 font-bold text-xs sm:text-sm text-amber-900">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>پایان خودکار نشست به دلیل عدم فعالیت</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              {inactivityNotice}
            </p>
          </div>
        )}

        {/* اخطار قفل موقت در صورت وقوع Brute-Force */}
        {lockoutRemaining > 0 ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl mb-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              دسترسی موقتاً مسدود شد (Rate Limit)
            </div>
            <p className="text-xs text-rose-600">
              به دلیل ورود مکرر اطلاعات نادرست، ورود به مدت <span className="font-bold text-base font-mono">{lockoutRemaining}</span> ثانیه قفل شد.
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-bold text-center border border-red-100 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">نام کاربری</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={email}
                disabled={lockoutRemaining > 0}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="نام کاربری (حروف انگلیسی)"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">رمز عبور</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                disabled={lockoutRemaining > 0}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-12 pl-12 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 font-bold"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 focus:outline-none rounded-lg hover:bg-slate-200/60 transition-colors"
                title={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-blue-600" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* فیلد کپچا و تصویر امنیتی */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">کد امنیتی تصویر (کپچا)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={captchaInput}
                disabled={lockoutRemaining > 0}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="کد را وارد کنید"
                required
                maxLength={5}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-center tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 uppercase placeholder:font-normal placeholder:tracking-normal"
                dir="ltr"
              />

              {/* کادر بصری کپچا با خطوط نویز ضد ربات */}
              <div 
                className="relative bg-slate-800 text-white select-none px-4 py-2.5 rounded-xl flex items-center justify-center font-mono text-lg font-black tracking-[6px] border border-slate-700 shadow-inner overflow-hidden min-w-[130px] h-[46px] cursor-pointer"
                title="برای تغییر کد کلیک کنید"
                onClick={generateCaptcha}
              >
                {/* خطوط نویز ضد OCR */}
                <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px]"></div>
                <div className="absolute w-full h-[1px] bg-red-400/40 rotate-6 pointer-events-none"></div>
                <div className="absolute w-full h-[1px] bg-cyan-400/40 -rotate-6 pointer-events-none"></div>
                <span className="relative z-10 text-cyan-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] italic">
                  {captchaCode}
                </span>
              </div>

              <button
                type="button"
                onClick={generateCaptcha}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shrink-0"
                title="تولید کد جدید"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || lockoutRemaining > 0}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(37,99,235,0.2)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال اعتبارسنجی امن...
              </>
            ) : lockoutRemaining > 0 ? (
              `قفل امنیتی (${lockoutRemaining}s)`
            ) : (
              'ورود به پنل مدیریت'
            )}
          </button>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors py-2 px-3 rounded-lg hover:bg-slate-50"
            >
              <Home className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              <span>بازگشت به پورتال اصلی دانشگاه</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

