import { storage, AdminUser } from './storage';

export const ADMIN_AUTH_KEY = 'kowsar_admin_auth';
export const ADMIN_TOKEN_KEY = 'kowsar_jwt_token';
export const ADMIN_LAST_ACTIVITY_KEY = 'kowsar_admin_last_activity';
export const ADMIN_LOGOUT_REASON_KEY = 'kowsar_admin_logout_reason';
export const ADMIN_AUTH_CHANGED_EVENT = 'kowsar_admin_auth_changed';
export const ADMIN_SESSION_WARNING_EVENT = 'kowsar_admin_session_warning';

// زمان پیش‌فرض عدم فعالیت: ۱۰ دقیقه (قابل تنظیم در تنظیمات پنل)
export const DEFAULT_TIMEOUT_MINUTES = 10;
export const WARNING_THRESHOLD_SECONDS = 60; // هشدار ۱ دقیقه قبل از خروج خودکار

/**
 * دریافت سقف زمان عدم فعالیت به دقیقه از تنظیمات پنل (پیش‌فرض ۱۰ دقیقه)
 */
export const getSessionTimeoutMinutes = (): number => {
  try {
    const config = storage.getAdminPanelConfig();
    const minutes = Number(config?.sessionTimeoutMinutes);
    if (minutes && minutes >= 1 && minutes <= 120) {
      return minutes;
    }
  } catch (e) {
    console.warn('Could not read sessionTimeoutMinutes from panel config', e);
  }
  return DEFAULT_TIMEOUT_MINUTES;
};

/**
 * سقف زمان عدم فعالیت به میلی‌ثانیه
 */
export const getSessionTimeoutMs = (): number => {
  return getSessionTimeoutMinutes() * 60 * 1000;
};

let lastRecordedTimestamp = 0;

/**
 * ثبت آخرین زمان فعالیت کاربر (تایپ، کلیک، اسکرول، حرکت موس)
 * این متد به صورت خودکار Throttled شده تا عملکرد برنامه کاملاً روان و سبک بماند.
 */
export const recordAdminActivity = (): void => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  const now = Date.now();
  // ثبت فعالیت حداکثر هر ۲ ثانیه یک‌بار در localStorage
  if (now - lastRecordedTimestamp < 2000) return;
  lastRecordedTimestamp = now;

  try {
    // فقط در صورتی که کاربر لاگین است ثبت فعالیت انجام شود
    const hasAuth = localStorage.getItem(ADMIN_AUTH_KEY);
    if (hasAuth) {
      localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, now.toString());
    }
  } catch (e) {
    console.warn('Could not record admin activity timestamp', e);
  }
};

/**
 * محاسبه زمان باقی‌مانده تا خروج خودکار (به میلی‌ثانیه)
 */
export const getRemainingSessionMs = (): number => {
  if (typeof localStorage === 'undefined') return 0;
  const hasAuth = localStorage.getItem(ADMIN_AUTH_KEY);
  if (!hasAuth) return 0;

  const lastActivityStr = localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);
  const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : Date.now();
  const elapsed = Date.now() - lastActivity;
  const timeoutMs = getSessionTimeoutMs();

  return Math.max(0, timeoutMs - elapsed);
};

/**
 * بررسی اینکه آیا نشست کاربر به دلیل عدم فعالیت منقضی شده یا خیر
 */
export const isSessionExpired = (): boolean => {
  if (typeof localStorage === 'undefined') return false;
  const hasAuth = localStorage.getItem(ADMIN_AUTH_KEY);
  if (!hasAuth) return false;

  const remaining = getRemainingSessionMs();
  return remaining <= 0;
};

/**
 * پاک‌سازی نشست مدیر و خروج (دستی یا به دلیل عدم فعالیت)
 */
export const clearAdminSession = (reason: 'manual' | 'inactivity' = 'manual'): void => {
  if (typeof localStorage === 'undefined') return;

  try {
    const rawAuth = localStorage.getItem(ADMIN_AUTH_KEY);
    let userEmail = 'کاربر نامشخص';
    if (rawAuth) {
      try {
        const u = JSON.parse(rawAuth);
        if (u.email) userEmail = u.email;
        if (u.name) userEmail += ` (${u.name})`;
      } catch {}
    }

    if (reason === 'inactivity') {
      const mins = getSessionTimeoutMinutes();
      storage.addSecurityLog({
        eventType: 'auth_attempt',
        severity: 'medium',
        message: 'خروج خودکار از پنل مدیریت به دلیل عدم فعالیت (Auto Logout on Inactivity)',
        userEmail,
        details: `نشست کاربر پس از ${mins} دقیقه عدم تعامل و فعالیت، جهت حفظ امنیت سامانه به صورت خودکار پایان یافت.`
      });
    } else {
      storage.addSecurityLog({
        eventType: 'auth_attempt',
        severity: 'low',
        message: 'خروج دستی از حساب کاربری پنل مدیریت',
        userEmail
      });
    }
  } catch (e) {
    console.warn('Error recording security log on logout:', e);
  }

  localStorage.setItem(ADMIN_LOGOUT_REASON_KEY, reason);
  localStorage.removeItem(ADMIN_AUTH_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADMIN_AUTH_CHANGED_EVENT, { detail: { reason } }));
  }
};

/**
 * اعتبارسنجی و دریافت اطلاعات کاربر لاگین‌شده
 * اگر نشست به دلیل عدم فعالیت پایان یافته باشد، سشن پاک شده و null برمی‌گرداند.
 */
export const getAdminSession = (): AdminUser | null => {
  if (typeof localStorage === 'undefined') return null;

  const authData = localStorage.getItem(ADMIN_AUTH_KEY);
  if (!authData) return null;

  // بررسی عدم فعالیت
  const lastActivityStr = localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);
  const now = Date.now();
  const timeoutMs = getSessionTimeoutMs();

  if (lastActivityStr) {
    const lastActivity = parseInt(lastActivityStr, 10);
    if (!isNaN(lastActivity) && (now - lastActivity > timeoutMs)) {
      // نشست به دلیل عدم فعالیت منقضی شده است
      clearAdminSession('inactivity');
      return null;
    }
  } else {
    // مقداردهی اولیه زمان فعالیت در صورتی که ثبت نشده باشد
    localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, now.toString());
  }

  try {
    const parsedUser = JSON.parse(authData) as AdminUser;
    return parsedUser;
  } catch {
    clearAdminSession('manual');
    return null;
  }
};

/**
 * راه‌اندازی نشست مدیر هنگام ورود موفق
 */
export const initAdminSession = (user: AdminUser | any, token?: string): void => {
  if (typeof localStorage === 'undefined') return;

  const now = Date.now().toString();
  localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(user));
  localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, now);
  localStorage.removeItem(ADMIN_LOGOUT_REASON_KEY);

  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADMIN_AUTH_CHANGED_EVENT, { 
      detail: { action: 'login', user } 
    }));
  }
};

/**
 * تمدید نشست مدیر به اندازه سقف کامل
 */
export const refreshAdminSession = (): void => {
  if (typeof localStorage === 'undefined') return;
  const hasAuth = localStorage.getItem(ADMIN_AUTH_KEY);
  if (hasAuth) {
    localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, Date.now().toString());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ADMIN_AUTH_CHANGED_EVENT, { detail: { action: 'refresh' } }));
    }
  }
};

/**
 * ناظر سراسری عدم فعالیت: ثبت رویدادهای کاربر و خروج هوشمند خودکار
 */
export const setupGlobalInactivityTracker = (): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleUserActivity = () => {
    recordAdminActivity();
  };

  const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
  activityEvents.forEach(evt => {
    window.addEventListener(evt, handleUserActivity, { passive: true });
  });

  // تایمر بازرسی دوره‌ای هر ۱ ثانیه
  let hasWarnedForCurrentWindow = false;

  const intervalId = setInterval(() => {
    const authData = localStorage.getItem(ADMIN_AUTH_KEY);
    if (!authData) {
      hasWarnedForCurrentWindow = false;
      return;
    }

    const remainingMs = getRemainingSessionMs();

    if (remainingMs <= 0) {
      // انقضای قطعی نشست به دلیل عدم فعالیت
      clearAdminSession('inactivity');
      hasWarnedForCurrentWindow = false;

      // هدایت امن به صفحه لاگین در صورتی که کاربر در مسیرهای ادمین باشد
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        window.location.href = '/admin/login?reason=inactivity';
      }
      return;
    }

    const remainingSec = Math.ceil(remainingMs / 1000);

    // ارسال هشدار زمانی که کمتر از ۶۰ ثانیه باقی مانده است
    if (remainingSec <= WARNING_THRESHOLD_SECONDS) {
      if (!hasWarnedForCurrentWindow) {
        hasWarnedForCurrentWindow = true;
        window.dispatchEvent(new CustomEvent(ADMIN_SESSION_WARNING_EVENT, {
          detail: { remainingSeconds: remainingSec }
        }));
      }
    } else {
      hasWarnedForCurrentWindow = false;
    }
  }, 1000);

  return () => {
    activityEvents.forEach(evt => {
      window.removeEventListener(evt, handleUserActivity);
    });
    clearInterval(intervalId);
  };
};
