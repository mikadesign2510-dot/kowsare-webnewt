import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  getPageTitleForPath, 
  formatFullBrowserTitle, 
  applyBrowserTitle,
  applyFavicon
} from '../lib/pageTitleHelper';

export default function PageTitleManager() {
  const location = useLocation();
  const [customTitle, setCustomTitle] = useState<string | null>(null);

  // تغییر مسیر - عنوان و فاوآیکون بر اساس صفحه جدید تنظیم شود
  useEffect(() => {
    setCustomTitle(null);
    const standardTitle = getPageTitleForPath(location.pathname);
    const formatted = formatFullBrowserTitle(standardTitle);
    applyBrowserTitle(formatted);
    applyFavicon();
  }, [location.pathname]);

  // گوش دادن به رویدادهای اختصاصی (عنوان خبر، ویدیو، یا تغییر تنظیمات در پنل ادمین)
  useEffect(() => {
    const handleCustomTitle = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCustomTitle(customEvent.detail);
        const formatted = formatFullBrowserTitle(customEvent.detail);
        applyBrowserTitle(formatted);
      }
    };

    const handleSettingsChanged = () => {
      const activePageTitle = customTitle || getPageTitleForPath(location.pathname);
      const formatted = formatFullBrowserTitle(activePageTitle);
      applyBrowserTitle(formatted);
      applyFavicon();
    };

    window.addEventListener('kowsar_custom_page_title', handleCustomTitle);
    window.addEventListener('kowsar_site_settings_changed', handleSettingsChanged);

    return () => {
      window.removeEventListener('kowsar_custom_page_title', handleCustomTitle);
      window.removeEventListener('kowsar_site_settings_changed', handleSettingsChanged);
    };
  }, [location.pathname, customTitle]);

  return null;
}
