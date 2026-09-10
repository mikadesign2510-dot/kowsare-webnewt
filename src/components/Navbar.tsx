import { Menu, X, Library, GraduationCap, Receipt } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { storage } from '../lib/storage';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(storage.getSettings());
  const location = useLocation();

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setSettings(storage.getSettings());
    };
    window.addEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    return () => {
      window.removeEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    };
  }, []);

  const displayLinks = settings.navLinks && settings.navLinks.length > 0 
    ? settings.navLinks.filter(link => link.isActive !== false) 
    : [];

  const enableStudentPortal = settings.enableStudentPortalButton === true;
  const enableQuickReceipt = settings.enableQuickReceiptButton !== false;

  const rawHeaderButtons = (settings.headerButtons || [])
    .filter(btn => {
      const href = (btn.href || '').trim().toLowerCase();
      const label = (btn.label || '').trim();
      // Exclude only admin panel entry from the public header
      if (
        href === '/admin' || 
        href.startsWith('/admin/') || 
        label.includes('ورود به پنل مدیریت') || 
        label.includes('پنل مدیریت')
      ) {
        return false;
      }
      return true;
    })
    .map(btn => {
      // If formerly named میز خدمت or pointing to portal, display "پنل دانشجویی"
      if (btn.label === 'میز خدمت' || btn.href === '/portal/login' || btn.href === '/portal') {
        return { ...btn, label: 'پنل دانشجویی', href: '/portal/login' };
      }
      if (btn.href === '/submit-receipt' || btn.id === 'quick-receipt-btn') {
        return { ...btn, label: settings.quickReceiptButtonLabel || 'ارسال فیش واریزی', href: '/submit-receipt' };
      }
      return btn;
    });

  // Filter or inject student portal and quick receipt buttons according to settings
  let resolvedHeaderButtons = [...rawHeaderButtons];

  if (!enableStudentPortal) {
    resolvedHeaderButtons = resolvedHeaderButtons.filter(b => 
      b.href !== '/portal/login' && b.href !== '/portal' && b.label !== 'پنل دانشجویی'
    );
  } else {
    if (!resolvedHeaderButtons.some(b => b.href === '/portal/login' || b.label === 'پنل دانشجویی')) {
      resolvedHeaderButtons.push({
        id: 'student-portal-btn',
        label: 'پنل دانشجویی',
        href: '/portal/login',
        style: 'outline'
      });
    }
  }

  if (enableQuickReceipt) {
    if (!resolvedHeaderButtons.some(b => b.href === '/submit-receipt' || b.id === 'quick-receipt-btn')) {
      resolvedHeaderButtons.unshift({
        id: 'quick-receipt-btn',
        label: settings.quickReceiptButtonLabel || 'ارسال فیش واریزی',
        href: '/submit-receipt',
        style: 'primary'
      });
    }
  } else {
    resolvedHeaderButtons = resolvedHeaderButtons.filter(b => 
      b.href !== '/submit-receipt' && b.id !== 'quick-receipt-btn'
    );
  }

  const isLinkActive = (href: string) => {
    if (href === '/' && location.pathname === '/') return true;
    if (href !== '/' && location.pathname === href) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-blue-50 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          {/* Logo Section */}
          <div className="flex items-center gap-4 xl:gap-6">
            
            {/* Main Logo */}
            <Link to="/" className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.logoTitle || "لوگو مرکز"} 
                  className="w-auto h-12 object-contain"
                />
              ) : (
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-[0_8px_20px_rgba(37,99,235,0.25)] flex-shrink-0">
                  <Library className="w-6 h-6" />
                </div>
              )}
              
              {/* Logo text: shown when showLogoText is true (default) or when no logo image is set */}
              {(settings.showLogoText !== false || !settings.logoUrl) && (
                <div className="flex flex-col justify-center">
                  <span className="font-black text-lg text-slate-900 leading-tight tracking-tight">
                    {settings.logoTitle || 'علمی کاربردی'}
                  </span>
                  <span className="font-bold text-blue-600 text-xs leading-tight mt-0.5">
                    {settings.logoSubtitle || 'کوثر کاکی'}
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-8">
            <div className="flex items-center gap-4 xl:gap-6">
              {displayLinks.map((link) => {
                const active = isLinkActive(link.href);
                const isExternal = link.href.startsWith('http://') || link.href.startsWith('https://') || link.href.startsWith('//');
                
                const className = `relative group font-bold transition-colors text-sm py-2 whitespace-nowrap ${
                  active ? 'text-blue-600 font-extrabold' : 'text-slate-600 hover:text-blue-600'
                }`;
                const indicator = (
                  <span 
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-blue-600 transition-all duration-300 rounded-full ${
                      active ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  ></span>
                );

                if (isExternal) {
                  return (
                    <a key={link.id} href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
                      {link.label}
                      {indicator}
                    </a>
                  );
                }

                return (
                  <Link
                    key={link.id}
                    to={link.href}
                    className={className}
                  >
                    {link.label}
                    {indicator}
                  </Link>
                );
              })}
            </div>
            
            {resolvedHeaderButtons.length > 0 && (
              <div className="flex items-center gap-3 mr-2 border-r border-slate-200 pr-5 xl:pr-6">
                {resolvedHeaderButtons.map(btn => {
                  const isExternal = btn.href.startsWith('http://') || btn.href.startsWith('https://') || btn.href.startsWith('//');
                  const isStudentPortal = btn.href === '/portal/login' || btn.href.startsWith('/portal') || btn.label.includes('دانشجو');
                  const isQuickReceipt = btn.href === '/submit-receipt' || btn.id === 'quick-receipt-btn' || btn.label.includes('فیش');
                  const className = btn.style === 'primary'
                    ? "inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-[0_4px_15px_rgba(37,99,235,0.2)] transition-all transform hover:-translate-y-0.5 text-sm whitespace-nowrap"
                    : "inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 font-bold px-4 py-2.5 rounded-xl transition-all text-sm whitespace-nowrap border border-slate-200 hover:border-blue-200";
                  
                  if (isExternal) {
                    return (
                      <a key={btn.id} href={btn.href} target="_blank" rel="noopener noreferrer" className={className}>
                        {isQuickReceipt && <Receipt className="w-4 h-4 text-white" />}
                        {isStudentPortal && <GraduationCap className="w-4 h-4 text-blue-600" />}
                        <span>{btn.label}</span>
                      </a>
                    );
                  }
                  
                  return (
                    <Link
                      key={btn.id}
                      to={btn.href}
                      className={className}
                    >
                      {isQuickReceipt && <Receipt className="w-4 h-4 text-white" />}
                      {isStudentPortal && <GraduationCap className="w-4 h-4 text-blue-600" />}
                      <span>{btn.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-blue-600 focus:outline-none p-2 bg-blue-50 rounded-xl"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="lg:hidden absolute top-[90px] left-4 right-4 md:right-auto md:w-80 bg-white border border-blue-100 shadow-[0_20px_60px_rgba(37,99,235,0.15)] rounded-2xl overflow-hidden z-50 p-2"
          >
            <div className="flex flex-col space-y-1">
              {displayLinks.map((link) => {
                const active = isLinkActive(link.href);
                const isExternal = link.href.startsWith('http://') || link.href.startsWith('https://') || link.href.startsWith('//');
                const className = `block px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  active ? 'bg-blue-50 text-blue-700 font-black' : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                }`;
                
                if (isExternal) {
                  return (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className={className}
                    >
                      {link.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={link.id}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={className}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {resolvedHeaderButtons.length > 0 && (
                <div className="pt-2 mt-1 border-t border-slate-100 px-1 space-y-2">
                  {resolvedHeaderButtons.map(btn => {
                    const isExternal = btn.href.startsWith('http://') || btn.href.startsWith('https://') || btn.href.startsWith('//');
                    const isStudentPortal = btn.href === '/portal/login' || btn.href.startsWith('/portal') || btn.label.includes('دانشجو');
                    const isQuickReceipt = btn.href === '/submit-receipt' || btn.id === 'quick-receipt-btn' || btn.label.includes('فیش');
                    const className = btn.style === 'primary'
                      ? "flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl shadow-[0_4px_15px_rgba(37,99,235,0.2)] transition-all"
                      : "flex items-center justify-center gap-2 w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-4 py-3 rounded-xl transition-all";
                    
                    if (isExternal) {
                      return (
                        <a
                          key={btn.id}
                          href={btn.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsOpen(false)}
                          className={className}
                        >
                          {isQuickReceipt && <Receipt className="w-4 h-4 text-white" />}
                          {isStudentPortal && <GraduationCap className="w-4 h-4 text-indigo-600" />}
                          <span>{btn.label}</span>
                        </a>
                      );
                    }

                    return (
                      <Link
                        key={btn.id}
                        to={btn.href}
                        onClick={() => setIsOpen(false)}
                        className={className}
                      >
                        {isQuickReceipt && <Receipt className="w-4 h-4 text-white" />}
                        {isStudentPortal && <GraduationCap className="w-4 h-4 text-indigo-600" />}
                        <span>{btn.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
