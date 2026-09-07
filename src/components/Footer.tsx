import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../lib/storage';
import { getAdminSession, ADMIN_AUTH_CHANGED_EVENT } from '../lib/adminSession';
import { Library, MapPin, Phone, Mail, Instagram, Send, Navigation, Compass, ShieldCheck } from 'lucide-react';

const toPersianDigits = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '';
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/[0-9]/g, (w) => farsiDigits[+w]);
};

export default function Footer() {
  const [settings, setSettings] = useState(storage.getSettings());
  const [adminUser, setAdminUser] = useState(() => getAdminSession());

  useEffect(() => {
    const handleSettingsChange = () => {
      setSettings(storage.getSettings());
    };
    const handleAdminAuthChange = () => {
      setAdminUser(getAdminSession());
    };
    window.addEventListener('kowsar_site_settings_changed', handleSettingsChange);
    window.addEventListener(ADMIN_AUTH_CHANGED_EVENT, handleAdminAuthChange);
    return () => {
      window.removeEventListener('kowsar_site_settings_changed', handleSettingsChange);
      window.removeEventListener(ADMIN_AUTH_CHANGED_EVENT, handleAdminAuthChange);
    };
  }, []);

  return (
    <footer id="contact" className="bg-blue-950 text-blue-100 pt-24 pb-8 border-t-[10px] border-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & About */}
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.logoTitle || "لوگو مرکز"} 
                  className="w-auto h-12 object-contain bg-white/10 p-1.5 rounded-xl backdrop-blur-sm"
                />
              ) : (
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-xl shadow-lg flex-shrink-0">
                  <Library className="w-7 h-7" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-black text-white text-lg leading-tight tracking-tight">
                  {settings.logoTitle || 'علمی کاربردی'}
                </span>
                <span className="text-blue-300 text-sm font-bold leading-tight mt-0.5">
                  {settings.logoSubtitle || 'کوثر کاکی'}
                </span>
              </div>
            </div>
            <p className="text-blue-200/70 text-sm leading-relaxed mb-8 font-light">
              {settings.footerAbout}
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-blue-900 border border-blue-800 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-blue-900 border border-blue-800 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all">
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              دسترسی سریع
            </h3>
            <ul className="space-y-4 text-sm font-light text-blue-200/80">
              {settings.quickLinks.filter(l => l.isActive !== false).map(link => (
                <li key={link.id}>
                  <a href={link.href} className="hover:text-white hover:translate-x-[-4px] transition-all block">
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="pt-2 border-t border-blue-900/50">
                <Link 
                  to="/admin" 
                  className="hover:text-white hover:translate-x-[-4px] transition-all flex items-center gap-1.5 font-bold text-blue-400"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{adminUser ? `پنل مدیریت (${adminUser.name})` : 'ورود به پنل مدیریت'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info & Map */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              ارتباط با ما و موقعیت مکانی
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-900/50 p-6 rounded-2xl border border-blue-800/50">
              <div className="space-y-5 text-sm font-light text-blue-200/80">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-800 p-2 rounded-lg shrink-0">
                    <MapPin className="w-5 h-5 text-blue-300" />
                  </div>
                  <span className="leading-relaxed mt-1">
                    {settings.contactAddress}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-800 p-2 rounded-lg shrink-0">
                    <Phone className="w-5 h-5 text-blue-300" />
                  </div>
                  <span dir="ltr" className="text-right inline-block font-bold tracking-tight text-white mt-1">{toPersianDigits(settings.contactPhone)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-800 p-2 rounded-lg shrink-0">
                    <Mail className="w-5 h-5 text-blue-300" />
                  </div>
                  <span className="mt-1 font-medium">{settings.contactEmail}</span>
                </div>
              </div>
              
              <div className="rounded-xl overflow-hidden border border-blue-800 bg-blue-900/40 p-3.5 space-y-2.5">
                <div className="flex items-center text-xs">
                  <span className="font-bold text-blue-200 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    مسیریابی سریع با نرم‌افزارها:
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a 
                    href="https://www.google.com/maps/dir/?api=1&destination=28.34291274764676,51.52670733886608" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-red-600/90 hover:bg-red-500 text-white text-[11px] font-bold px-2.5 py-2 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    title="مسیریابی با گوگل مپ"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    گوگل مپ
                  </a>
                  <a 
                    href="https://nshn.ir/search/28.342913,51.526707" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-2 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    title="مسیریابی با نشان"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    نشان
                  </a>
                  <a 
                    href="https://balad.ir/location?latitude=28.342913&longitude=51.526707" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-600/90 hover:bg-blue-500 text-white text-[11px] font-bold px-2.5 py-2 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    title="مسیریابی در بلد"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    بلد
                  </a>
                  <a 
                    href="https://waze.com/ul?ll=28.34291274764676,51.52670733886608&navigate=yes" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-sky-600/90 hover:bg-sky-500 text-white text-[11px] font-bold px-2.5 py-2 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    title="مسیریابی با ویز"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    ویز (Waze)
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-blue-900/50 text-center text-sm font-light text-blue-300/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>{settings.footerCopyrightPersian || 'تمامی حقوق این وب‌سایت متعلق به مرکز آموزش علمی کاربردی کوثر کاکی می‌باشد.'}</p>
          <p dir="ltr">{settings.footerCopyrightEnglish || '© 2024 Kowsar Kaki UAST'}</p>
        </div>
      </div>
    </footer>
  );
}
