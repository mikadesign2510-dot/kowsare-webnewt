import { storage } from './storage';

/**
 * نقشه عناوین پیش‌فرض صفحات بر اساس مسیر (URL Path)
 */
export const ROUTE_TITLE_MAP: Record<string, string> = {
  '/': '', // صفحه اصلی - عنوان اصلی سایت بدون پیشوند/پسوند
  '/presentation': 'معرفی مرکز',
  '/register': 'پذیرش دانشجو',
  '/forms': 'جزوه و فرم‌ها',
  '/gallery': 'نگارخانه و تصاویر',
  '/news': 'اخبار و اطلاعیه‌ها',
  '/contact': 'تماس با ما',
  '/submit-receipt': 'سامانه ارسال فیش واریزی',
  '/quick-receipt': 'سامانه ارسال فیش واریزی',
  '/portal': 'پورتال دانشجویی',
  '/portal/login': 'ورود به پورتال دانشجویی',
  '/portal/register': 'عضویت در پورتال دانشجویی',
  '/portal/tickets': 'تیکت‌های پشتیبانی',
  '/portal/financial': 'امور مالی و پرداخت‌ها',
  '/admin/login': 'ورود به پنل مدیریت',
  '/admin': 'داشبورد مدیریت',
  '/admin/registrations': 'مدیریت پذیرش دانشجویان',
  '/admin/students': 'مدیریت دانشجویان',
  '/admin/student-profiles': 'پرونده‌های تحصیلی',
  '/admin/news': 'مدیریت اخبار و رویدادها',
  '/admin/forms': 'مدیریت فرم‌ها و جزوات',
  '/admin/users': 'مدیریت کاربران',
  '/admin/settings': 'تنظیمات سایت',
  '/admin/contact': 'مدیریت پیام‌های تماس',
  '/admin/banners': 'مدیریت بنرها و اسلایدر',
  '/admin/gallery': 'مدیریت نگارخانه و ویدیوها',
  '/admin/media': 'مدیریت رسانه و فایل‌ها',
  '/admin/tickets': 'مدیریت تیکت‌های پشتیبانی',
  '/admin/financial': 'مدیریت امور مالی',
  '/admin/presentation': 'مدیریت اسلایدهای معرفی',
  '/admin/panel-customization': 'شخصی‌سازی پنل مدیریت',
  '/admin/portal-customization': 'شخصی‌سازی پورتال دانشجویی',
  '/admin/system-logs': 'گزارش‌های سیستم',
  '/admin/security-logs': 'گزارش‌های امنیتی',
  '/admin/server-monitoring': 'پایش سرور و منابع',
};

/**
 * تعیین عنوان مناسب بر اساس مسیر صفحه
 */
export function getPageTitleForPath(pathname: string): string {
  // تطابق مستقیم مسیر
  if (ROUTE_TITLE_MAP[pathname] !== undefined) {
    return ROUTE_TITLE_MAP[pathname];
  }

  // بررسی مسیرهای پویا و زیرمجموعه
  if (pathname.startsWith('/news/')) {
    return 'مشاهده خبر';
  }
  if (pathname.startsWith('/gallery/video/')) {
    return 'مشاهده ویدیو';
  }
  if (pathname.startsWith('/admin/')) {
    return 'پنل مدیریت';
  }
  if (pathname.startsWith('/portal/')) {
    return 'پورتال دانشجویی';
  }

  return '';
}

/**
 * فرمت‌بندی عنوان نهایی بر اساس تنظیمات تب مرورگر
 */
export function formatFullBrowserTitle(
  pageTitle?: string,
  customSiteTitle?: string,
  customFormat?: 'page_site' | 'site_page' | 'site_only'
): string {
  const currentSettings = storage.getSettings();
  const siteTitle = (
    customSiteTitle || 
    currentSettings.browserTabTitle || 
    'دانشگاه جامع علمی کاربردی کوثر کاکی'
  ).trim();

  const format = customFormat || currentSettings.browserTabFormat || 'page_site';

  // اگر عنوان صفحه خالی یا صفحه اصلی باشد، فقط نام سایت نمایش داده می‌شود
  if (!pageTitle || pageTitle === 'صفحه اصلی' || pageTitle === '') {
    return siteTitle;
  }

  switch (format) {
    case 'site_only':
      return siteTitle;
    case 'site_page':
      return `${siteTitle} - ${pageTitle}`;
    case 'page_site':
    default:
      return `${pageTitle} | ${siteTitle}`;
  }
}

/**
 * اعمال آیکون تب مرورگر (Favicon)
 */
export function applyFavicon(faviconUrl?: string) {
  if (typeof document === 'undefined') return;

  const currentSettings = storage.getSettings();
  // اگر کاربر آیکون اختصاصی مشخص کرده بود یا لوگوی سایت ثبت شده بود از آن استفاده می‌شود
  const iconUrl = (
    faviconUrl ||
    currentSettings.faviconUrl ||
    currentSettings.logoUrl ||
    '/favicon.svg'
  ).trim();

  // ۱. آپدیت یا ایجاد تگ link[rel="icon"]
  let linkIcon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!linkIcon) {
    linkIcon = document.createElement('link');
    linkIcon.rel = 'icon';
    document.head.appendChild(linkIcon);
  }
  
  // بررسی فرمت
  if (iconUrl.endsWith('.svg')) {
    linkIcon.type = 'image/svg+xml';
  } else if (iconUrl.endsWith('.png')) {
    linkIcon.type = 'image/png';
  } else if (iconUrl.endsWith('.ico')) {
    linkIcon.type = 'image/x-icon';
  } else {
    linkIcon.removeAttribute('type');
  }
  linkIcon.href = iconUrl;

  // ۲. آپدیت یا ایجاد تگ link[rel="shortcut icon"] و link[rel="apple-touch-icon"]
  let linkShortcut = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');
  if (linkShortcut) {
    linkShortcut.href = iconUrl;
  }

  let appleTouchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (!appleTouchIcon) {
    appleTouchIcon = document.createElement('link');
    appleTouchIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleTouchIcon);
  }
  appleTouchIcon.href = iconUrl;
}

/**
 * اعمال عنوان در سند، تب مرورگر و تگ‌های متای شبکه‌های اجتماعی
 */
export function applyBrowserTitle(title: string) {
  if (typeof document === 'undefined') return;

  const cleanTitle = title.trim();
  document.title = cleanTitle;

  // به‌روزرسانی OpenGraph og:title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', cleanTitle);
  }

  // به‌روزرسانی Twitter Card title
  let twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute('content', cleanTitle);
  }

  // اطمینان از اعمال آیکون تب مرورگر
  applyFavicon();
}

/**
 * تنظیم عنوان اختصاصی برای یک صفحه خاص (مثل مشاهده خبر یا ویدیو)
 */
export function setCustomPageTitle(pageTitle: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('kowsar_custom_page_title', { detail: pageTitle }));
}
