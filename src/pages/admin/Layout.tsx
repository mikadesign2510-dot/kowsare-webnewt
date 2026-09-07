import { useEffect, useState, Suspense } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Newspaper, 
  LogOut, 
  Library, 
  UserCog, 
  Settings, 
  Images, 
  FileText, 
  Activity, 
  ShieldAlert, 
  Menu, 
  X, 
  MessageSquare, 
  Receipt, 
  Server, 
  GraduationCap,
  User,
  Palette,
  Sliders,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Layers,
  PhoneCall,
  ListOrdered,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  FolderKanban,
  Clock,
  RefreshCw
} from 'lucide-react';
import { AdminUser, AdminPanelConfig, defaultPanelConfig, storage } from '../../lib/storage';
import { 
  getAdminSession, 
  clearAdminSession, 
  refreshAdminSession, 
  getRemainingSessionMs, 
  getSessionTimeoutMinutes, 
  ADMIN_SESSION_WARNING_EVENT, 
  ADMIN_AUTH_CHANGED_EVENT 
} from '../../lib/adminSession';
import MenuReorderModal from './MenuReorderModal';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [unresolvedLogsCount, setUnresolvedLogsCount] = useState(0);
  const [unreadContactMessagesCount, setUnreadContactMessagesCount] = useState(0);
  const [unreadTicketsCount, setUnreadTicketsCount] = useState(0);
  const [pendingReceiptsCount, setPendingReceiptsCount] = useState(0);
  const [newRegistrationsCount, setNewRegistrationsCount] = useState(0);

  // وضعیت نشست و تایمر عدم فعالیت
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => Math.ceil(getRemainingSessionMs() / 1000));
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [panelConfig, setPanelConfig] = useState<AdminPanelConfig>(defaultPanelConfig);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [isQuickToolsOpen, setIsQuickToolsOpen] = useState<boolean>(() => {
    return localStorage.getItem('kowsar_quick_tools_open') !== 'false';
  });

  const toggleQuickTools = () => {
    setIsQuickToolsOpen(prev => {
      const next = !prev;
      localStorage.setItem('kowsar_quick_tools_open', String(next));
      return next;
    });
  };

  const [isCompact, setIsCompact] = useState<boolean>(() => {
    const saved = localStorage.getItem('kowsar_admin_compact_mode');
    if (saved !== null) return saved === 'true';
    return defaultPanelConfig.compactMode || false;
  });

  const toggleCompactMode = () => {
    setIsCompact(prev => {
      const next = !prev;
      localStorage.setItem('kowsar_admin_compact_mode', String(next));
      storage.updateAdminPanelConfig({ compactMode: next });
      return next;
    });
  };

  useEffect(() => {
    const syncAdminData = async () => {
      try {
        await Promise.allSettled([
          storage.syncStudentsWithDB(),
          storage.syncTicketsWithDB(),
          storage.syncReceiptsWithDB(),
          storage.syncFormsWithDB(),
          storage.syncContactWithDB(),
          storage.syncRegistrationsWithDB()
        ]);
      } catch (e) { console.error('Admin sync error:', e); }
    };
    syncAdminData();

    // Load panel configuration
    const initCfg = storage.getAdminPanelConfig();
    setPanelConfig(initCfg);
    if (localStorage.getItem('kowsar_admin_compact_mode') === null && initCfg.compactMode !== undefined) {
      setIsCompact(initCfg.compactMode);
    }

    const handleConfigChange = (e: any) => {
      if (e.detail) {
        setPanelConfig(e.detail);
        if (e.detail.compactMode !== undefined) {
          setIsCompact(e.detail.compactMode);
        }
      } else {
        const cfg = storage.getAdminPanelConfig();
        setPanelConfig(cfg);
        if (cfg.compactMode !== undefined) {
          setIsCompact(cfg.compactMode);
        }
      }
    };

    window.addEventListener('kowsar_panel_config_changed', handleConfigChange);

    // Fetch and store IP address for audit logs
    const fetchIP = async () => {
      try {
        if (!localStorage.getItem('kowsar_user_ip')) {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          localStorage.setItem('kowsar_user_ip', data.ip);
        }
      } catch (err) {
        console.warn('Could not fetch IP for audit logs', err);
      }
    };
    fetchIP();

    // احراز هویت اولیه و بررسی عدم انقضای نشست (۱۰ دقیقه عدم فعالیت)
    const activeSession = getAdminSession();
    if (!activeSession) {
      const logoutReason = localStorage.getItem('kowsar_admin_logout_reason');
      if (logoutReason === 'inactivity') {
        navigate('/admin/login?reason=inactivity');
      } else {
        storage.addSecurityLog({
          eventType: 'permission_denied',
          severity: 'medium',
          message: 'مسدودسازی دسترسی بدون احراز هویت',
          details: 'تلاش برای دسترسی به پنل مدیریت بدون سشن فعال'
        });
        navigate('/admin/login');
      }
      return;
    }

    try {
      const user = activeSession;
      // Normalize permissions
      if (user.permissions && typeof user.permissions === 'string') {
        try { user.permissions = JSON.parse(user.permissions); } catch { user.permissions = []; }
      }
      // If user permissions are missing or empty, match with local user base
      const localUsers = storage.getUsers();
      const matched = localUsers.find(u => 
        (u.id && user.id && u.id === user.id) || 
        (u.email && user.email && (u.email.toLowerCase() === user.email.toLowerCase() || u.email.split('@')[0] === user.email.split('@')[0]))
      );
      if (matched) {
        user.role = matched.role || user.role;
        user.permissions = matched.permissions || user.permissions || [];
        localStorage.setItem('kowsar_admin_auth', JSON.stringify(user));
      }

      setCurrentUser(user);

      // Also attempt fresh sync from server if JWT token is available
      const token = localStorage.getItem('kowsar_jwt_token');
      if (token) {
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.success && data?.user) {
              const freshUser = { ...user, ...data.user };
              if (freshUser.permissions && typeof freshUser.permissions === 'string') {
                try { freshUser.permissions = JSON.parse(freshUser.permissions); } catch {}
              }
              setCurrentUser(freshUser);
              localStorage.setItem('kowsar_admin_auth', JSON.stringify(freshUser));
              storage.updateUser(freshUser.id, freshUser);
            }
          })
          .catch(() => {});
      }
    } catch {
      navigate('/admin/login');
    }
    
    // Fetch logs count
    setUnresolvedLogsCount(storage.getUnresolvedErrorsCount());
    
    // Fetch unread contact messages
    const updateUnreadContact = () => {
      const msgs = storage.getContactMessages();
      setUnreadContactMessagesCount(msgs.filter(m => m.status === 'unread').length);

      const tickets = storage.getTickets();
      setUnreadTicketsCount(tickets.filter(t => t.status === 'open').length);

      const receipts = storage.getReceipts();
      setPendingReceiptsCount(receipts.filter(r => r.status === 'pending').length);

      const registrations = storage.getRegistrations();
      setNewRegistrationsCount(registrations.filter(r => r.status === 'new').length);
    };
    updateUnreadContact();

    window.addEventListener('kowsar_contact_messages_changed', updateUnreadContact);
    window.addEventListener('kowsar_tickets_changed', updateUnreadContact);
    window.addEventListener('kowsar_receipts_changed', updateUnreadContact);
    window.addEventListener('kowsar_registrations_changed', updateUnreadContact);

    // تایمر لحظه‌ای بررسی زمان انقضای نشست (خروج خودکار پس از ۱۰ دقیقه عدم تعامل)
    const sessionCheckTimer = setInterval(() => {
      const remainingMs = getRemainingSessionMs();
      const sec = Math.ceil(remainingMs / 1000);
      setRemainingSeconds(sec);

      if (sec <= 0) {
        clearAdminSession('inactivity');
        navigate('/admin/login?reason=inactivity');
      } else if (sec <= 60) {
        setShowWarningModal(true);
      } else {
        setShowWarningModal(false);
      }
    }, 1000);

    const handleWarningEvent = (e: any) => {
      setShowWarningModal(true);
      if (e?.detail?.remainingSeconds) {
        setRemainingSeconds(e.detail.remainingSeconds);
      }
    };
    window.addEventListener(ADMIN_SESSION_WARNING_EVENT, handleWarningEvent);

    const interval = setInterval(() => {
      setUnresolvedLogsCount(storage.getUnresolvedErrorsCount());
      updateUnreadContact();
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(sessionCheckTimer);
      window.removeEventListener(ADMIN_SESSION_WARNING_EVENT, handleWarningEvent);
      window.removeEventListener('kowsar_panel_config_changed', handleConfigChange);
      window.removeEventListener('kowsar_contact_messages_changed', updateUnreadContact);
      window.removeEventListener('kowsar_tickets_changed', updateUnreadContact);
      window.removeEventListener('kowsar_receipts_changed', updateUnreadContact);
      window.removeEventListener('kowsar_registrations_changed', updateUnreadContact);
    };
  }, [navigate]);

  const handleExtendSession = () => {
    refreshAdminSession();
    setShowWarningModal(false);
    setRemainingSeconds(Math.ceil(getRemainingSessionMs() / 1000));
  };

  const handleLogout = () => {
    clearAdminSession('manual');
    navigate('/admin/login');
  };

  const rawNavItems = [
    { defaultName: 'داشبورد', path: '/admin', icon: LayoutDashboard, roles: ['super_admin', 'education_expert', 'cultural_expert', 'custom_expert'], permissionKey: 'dashboard' },
    { defaultName: 'مدیریت دانشجویان', path: '/admin/students', icon: GraduationCap, roles: ['super_admin', 'education_expert'], permissionKey: 'manage_students' },
    { defaultName: 'پرونده جامع دانشجویان', path: '/admin/student-profiles', icon: User, roles: ['super_admin', 'education_expert'], permissionKey: 'manage_student_profiles' },
    { defaultName: 'درخواست‌ها و تیکت‌ها', path: '/admin/tickets', icon: MessageSquare, roles: ['super_admin', 'education_expert', 'cultural_expert'], permissionKey: 'manage_tickets', badge: unreadTicketsCount > 0 ? unreadTicketsCount : undefined },
    { defaultName: 'امور مالی (رسیدها)', path: '/admin/financial', icon: Receipt, roles: ['super_admin', 'education_expert'], permissionKey: 'manage_financial', badge: pendingReceiptsCount > 0 ? pendingReceiptsCount : undefined },
    { defaultName: 'شخصی‌سازی میز خدمت', path: '/admin/portal-settings', icon: Sliders, roles: ['super_admin', 'education_expert'], permissionKey: 'manage_portal_settings' },
    { defaultName: 'تنظیمات ظاهر پنل', path: '/admin/panel-settings', icon: Palette, roles: ['super_admin'], permissionKey: 'manage_panel_settings' },
    { defaultName: 'ثبت‌نام‌ها', path: '/admin/registrations', icon: Users, roles: ['super_admin', 'education_expert'], permissionKey: 'manage_registrations', badge: newRegistrationsCount > 0 ? newRegistrationsCount : undefined },
    { defaultName: 'مدیریت اخبار و اطلاعیه‌ها', path: '/admin/news', icon: Newspaper, roles: ['super_admin', 'education_expert', 'cultural_expert'], permissionKey: 'manage_news' },
    { defaultName: 'معرفی مرکز (3D)', path: '/admin/presentation', icon: Layers, roles: ['super_admin', 'cultural_expert'], permissionKey: 'manage_presentation' },
    { defaultName: 'مدیریت بنر و اسلایدر', path: '/admin/banners', icon: Images, roles: ['super_admin', 'cultural_expert'], permissionKey: 'manage_banners' },
    { defaultName: 'نگارخانه (گالری)', path: '/admin/gallery', icon: Images, roles: ['super_admin', 'cultural_expert'], permissionKey: 'manage_gallery' },
    { defaultName: 'مدیریت فایل و تصاویر', path: '/admin/media', icon: FolderKanban, roles: ['super_admin', 'cultural_expert', 'education_expert'], permissionKey: 'manage_media' },
    { defaultName: 'مدیریت جزوه و فرم‌ها', path: '/admin/forms', icon: FileText, roles: ['super_admin', 'education_expert', 'cultural_expert', 'custom_expert'], permissionKey: 'manage_forms' },
    { defaultName: 'مدیریت تماس با ما', path: '/admin/contact', icon: PhoneCall, roles: ['super_admin', 'education_expert', 'cultural_expert', 'custom_expert'], permissionKey: 'manage_contact', badge: unreadContactMessagesCount > 0 ? unreadContactMessagesCount : undefined },
    { defaultName: 'تنظیمات متون سایت', path: '/admin/settings', icon: Settings, roles: ['super_admin'], permissionKey: 'manage_settings' },
    { defaultName: 'مدیریت کارشناسان', path: '/admin/users', icon: UserCog, roles: ['super_admin'], permissionKey: 'manage_users' },
    { defaultName: 'پایش سرور و دیتابیس', path: '/admin/server-monitoring', icon: Server, roles: ['super_admin'], permissionKey: 'manage_server_monitoring' },
    { defaultName: 'لاگ‌ها و خطایابی', path: '/admin/logs', icon: Activity, roles: ['super_admin'], permissionKey: 'view_logs', badge: unresolvedLogsCount > 0 ? unresolvedLogsCount : undefined },
    { defaultName: 'گزارشگیری امنیتی (Audit)', path: '/admin/security-logs', icon: ShieldAlert, roles: ['super_admin'], permissionKey: 'view_security_logs' },
  ];

  if (panelConfig.customMenuOrder && panelConfig.customMenuOrder.length > 0) {
    rawNavItems.sort((a, b) => {
      const idxA = panelConfig.customMenuOrder!.indexOf(a.path);
      const idxB = panelConfig.customMenuOrder!.indexOf(b.path);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }

  const navItems = rawNavItems.map(item => ({
    ...item,
    name: (panelConfig.customMenuTitles && panelConfig.customMenuTitles[item.path]) || item.defaultName
  }));

  if (!currentUser) return null;

  const hasAccess = (item: typeof navItems[0]) => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;

    // Normalizing permissions
    let userPerms: string[] = [];
    if (Array.isArray(currentUser.permissions)) {
      userPerms = currentUser.permissions;
    } else if (typeof currentUser.permissions === 'string') {
      try {
        userPerms = JSON.parse(currentUser.permissions || '[]');
      } catch {
        userPerms = [];
      }
    }

    // Dashboard is always available
    if (item.permissionKey === 'dashboard' || item.path === '/admin') return true;

    // If explicit permission is assigned to user
    if (userPerms && userPerms.length > 0 && (userPerms.includes(item.permissionKey) || userPerms.includes('*'))) {
      return true;
    }

    // If role has built-in access (and not custom_expert)
    if (currentUser.role !== 'custom_expert' && item.roles && item.roles.includes(currentUser.role)) {
      return true;
    }

    return false;
  };

  const allowedNavItems = navItems.filter(hasAccess);

  const handleSaveMenuOrder = (newOrder: string[]) => {
    storage.updateAdminPanelConfig({ customMenuOrder: newOrder });
    setPanelConfig(storage.getAdminPanelConfig());
    window.dispatchEvent(new CustomEvent('kowsar_panel_config_changed', { detail: storage.getAdminPanelConfig() }));
  };

  // Current active page title for header breadcrumb
  const currentNav = allowedNavItems.find(item => item.path === location.pathname) || allowedNavItems[0];

  // Theme styling definitions
  const themeStyles = {
    light: {
      sidebarBg: 'bg-white border-slate-200 text-slate-700',
      headerBg: 'bg-white/90 backdrop-blur-md border-slate-200 text-slate-800',
      itemNormal: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      brandText: 'text-slate-800',
      subText: 'text-slate-500',
      divider: 'border-slate-100',
      userBox: 'bg-slate-50 text-slate-700 border-slate-200'
    },
    dark: {
      sidebarBg: 'bg-slate-900 border-slate-800 text-slate-100',
      headerBg: 'bg-slate-900/90 backdrop-blur-md border-slate-800 text-slate-100',
      itemNormal: 'text-slate-300 hover:bg-slate-800 hover:text-white',
      brandText: 'text-white',
      subText: 'text-slate-400',
      divider: 'border-slate-800',
      userBox: 'bg-slate-800/80 text-slate-200 border-slate-700'
    },
    navy: {
      sidebarBg: 'bg-[#0a0f1d] border-blue-950/80 text-blue-100',
      headerBg: 'bg-[#0a0f1d]/90 backdrop-blur-md border-blue-950/80 text-blue-100',
      itemNormal: 'text-blue-200/90 hover:bg-blue-950/70 hover:text-white',
      brandText: 'text-white',
      subText: 'text-blue-300/80',
      divider: 'border-blue-950/60',
      userBox: 'bg-blue-950/50 text-blue-200 border-blue-900/50'
    },
    emerald: {
      sidebarBg: 'bg-[#051f19] border-emerald-950/80 text-emerald-100',
      headerBg: 'bg-[#051f19]/90 backdrop-blur-md border-emerald-950/80 text-emerald-100',
      itemNormal: 'text-emerald-200/90 hover:bg-emerald-950/70 hover:text-white',
      brandText: 'text-white',
      subText: 'text-emerald-300/80',
      divider: 'border-emerald-950/60',
      userBox: 'bg-emerald-950/50 text-emerald-200 border-emerald-900/50'
    }
  };

  const activeTheme = themeStyles[panelConfig.sidebarTheme] || themeStyles.light;

  // Accent color active pill classes
  const accentClasses = {
    blue: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
    emerald: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25',
    violet: 'bg-violet-600 text-white shadow-md shadow-violet-600/25',
    rose: 'bg-rose-600 text-white shadow-md shadow-rose-600/25',
    amber: 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
  };

  const activePill = accentClasses[panelConfig.accentColor] || accentClasses.blue;

  const isTopNav = panelConfig.sidebarPosition === 'top';
  const isLeftSidebar = panelConfig.sidebarPosition === 'left';

  // Sidebar width classes
  const sidebarWidthClass = isCompact ? 'w-20' : 'w-64';

  return (
    <div className={`min-h-screen flex flex-col antialiased admin-theme-${panelConfig.sidebarTheme || 'light'} transition-colors duration-300`} dir="rtl">
      {/* ========================================================================= */}
      {/* 1. TOP-NAV MODE (when sidebarPosition === 'top') */}
      {/* ========================================================================= */}
      {isTopNav ? (
        <div className="min-h-screen flex flex-col">
          <header className={`sticky top-0 z-40 border-b shadow-sm transition-colors ${activeTheme.headerBg}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              {/* Row 1: Brand, User Info, Action buttons */}
              <div className="h-16 flex items-center justify-between border-b border-inherit/15 gap-4">
                <Link to="/" className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/20 font-bold">
                    <Library className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-black text-base tracking-tight leading-tight ${activeTheme.brandText}`}>
                      مرکز آموزش عالی کوثر کاکی
                    </span>
                    <span className={`text-[11px] font-bold ${activeTheme.subText}`}>
                      سامانه یکپارچه مدیریت دانشگاهی
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-3">
                  <Link 
                    to="/" 
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${activeTheme.userBox} hover:opacity-80`}
                    title="مشاهده سایت عمومی کوثر"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <span>مشاهده سایت</span>
                  </Link>

                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${activeTheme.userBox}`}>
                    <span className="truncate max-w-[120px]">{currentUser.name}</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      ({currentUser.role === 'super_admin' ? 'مدیر کل' : 'کارشناس'})
                    </span>
                  </div>

                  <Link
                    to="/admin/panel-settings"
                    className={`p-2 rounded-xl border transition-colors ${activeTheme.userBox} hover:opacity-80`}
                    title="تنظیمات چیدمان و تم پنل"
                  >
                    <Palette className="w-4 h-4 text-blue-500" />
                  </Link>

                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-red-500 hover:bg-red-50/20 border border-red-500/20 transition-all"
                    title="خروج از حساب"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">خروج</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Horizontal Navigation Bar */}
              <nav className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar scroll-smooth">
                {allowedNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.path} 
                      to={item.path}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                        isActive ? activePill : activeTheme.itemNormal
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                      {panelConfig.showBadges && item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </header>

          <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
            <Suspense fallback={<div className="flex flex-1 min-h-[50vh] items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. SIDEBAR MODE (Right or Left position) */
        /* ========================================================================= */
        <div className="min-h-screen flex flex-col">
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Desktop & Mobile Fixed Sidebar */}
          <aside 
            className={`fixed top-0 bottom-0 z-50 transition-all duration-300 ease-in-out border-inherit flex flex-col ${
              isLeftSidebar ? 'left-0 border-r' : 'right-0 border-l'
            } ${activeTheme.sidebarBg} ${
              // Width handling
              isCompact ? 'w-64 lg:w-20' : 'w-64'
            } ${
              // Mobile drawer translate
              isSidebarOpen 
                ? 'translate-x-0' 
                : isLeftSidebar
                  ? '-translate-x-full lg:translate-x-0'
                  : 'translate-x-full lg:translate-x-0'
            }`}
          >
            {/* Sidebar Brand Header */}
            <div className={`h-16 flex items-center justify-between px-3 sm:px-4 border-b ${activeTheme.divider}`}>
              <Link 
                to="/" 
                className={`flex items-center gap-2.5 overflow-hidden ${isCompact ? 'lg:justify-center' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
                title="صفحه اصلی سایت کوثر"
              >
                <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20 font-bold shrink-0">
                  <Library className="w-5 h-5" />
                </div>
                {(!isCompact || isSidebarOpen) && (
                  <div className="flex flex-col truncate">
                    <span className={`font-black text-sm leading-tight truncate ${activeTheme.brandText}`}>
                      مرکز کوثر کاکی
                    </span>
                    <span className={`text-[10px] font-bold truncate ${activeTheme.subText}`}>
                      سامانه مدیریت
                    </span>
                  </div>
                )}
              </Link>
              
              {/* Desktop Toggle Sidebar in header */}
              <button 
                type="button"
                onClick={toggleCompactMode}
                className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isCompact ? "باز کردن منوی کامل" : "بستن منو (فقط آیکون‌ها)"}
              >
                {isCompact ? <PanelRightOpen className="w-4 h-4 text-blue-500" /> : <PanelRightClose className="w-4 h-4" />}
              </button>

              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Navigation Items */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
              {allowedNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                const showFull = !isCompact || isSidebarOpen;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center ${
                      showFull ? 'justify-between px-3.5 py-2.5' : 'justify-center p-2.5'
                    } rounded-xl font-bold text-xs transition-all ${
                      isActive ? activePill : activeTheme.itemNormal
                    }`}
                    title={item.name}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      {showFull && <span className="truncate">{item.name}</span>}
                    </div>
                    {panelConfig.showBadges && showFull && item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar Bottom Footer Actions */}
            <div className={`p-2.5 border-t ${activeTheme.divider} space-y-1.5`}>
              {/* Box Collapse/Expand Header Toggle */}
              {(!isCompact || isSidebarOpen) && (
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    ابزارهای سریع منو
                  </span>
                  <button
                    type="button"
                    onClick={toggleQuickTools}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-bold"
                    title={isQuickToolsOpen ? "بستن باکس ابزارها" : "باز کردن باکس ابزارها"}
                  >
                    <span>{isQuickToolsOpen ? "بستن" : "نمایش"}</span>
                    {isQuickToolsOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              )}

              {/* Collapsible Tools Items */}
              {(isQuickToolsOpen || isCompact) && (
                <div className="space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setIsReorderModalOpen(true);
                    }}
                    className={`flex items-center ${
                      !isCompact || isSidebarOpen ? 'gap-2.5 px-3 py-1.5' : 'justify-center p-2'
                    } rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-500/10 transition-colors w-full`}
                    title="ویرایش منو و چیدمان"
                  >
                    <ListOrdered className="w-4 h-4 shrink-0" />
                    {(!isCompact || isSidebarOpen) && <span>ویرایش منو</span>}
                  </button>

                  <Link
                    to="/admin/panel-settings"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center ${
                      !isCompact || isSidebarOpen ? 'gap-2.5 px-3 py-1.5' : 'justify-center p-2'
                    } rounded-xl text-xs font-bold text-blue-500 hover:bg-blue-500/10 transition-colors w-full`}
                    title="شخصی‌سازی ظاهر پنل"
                  >
                    <Palette className="w-4 h-4 shrink-0" />
                    {(!isCompact || isSidebarOpen) && <span>شخصی‌سازی پنل</span>}
                  </Link>
                </div>
              )}

              <button 
                onClick={handleLogout}
                className={`flex items-center ${
                  !isCompact || isSidebarOpen ? 'gap-2.5 px-3 py-1.5' : 'justify-center p-2'
                } rounded-xl font-bold text-xs text-red-500 hover:bg-red-500/10 transition-all w-full`}
                title="خروج از حساب"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {(!isCompact || isSidebarOpen) && <span>خروج از حساب</span>}
              </button>
            </div>
          </aside>

          {/* Main Wrapper with correct padding offset for fixed sidebar */}
          <div 
            className={`min-h-screen flex flex-col flex-1 transition-all duration-300 ${
              isLeftSidebar
                ? isCompact ? 'lg:pl-20' : 'lg:pl-64'
                : isCompact ? 'lg:pr-20' : 'lg:pr-64'
            }`}
          >
            {/* Top Bar Header */}
            <header className={`h-16 sticky top-0 z-30 border-b shadow-sm flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-colors ${activeTheme.headerBg}`}>
              {/* Right side: Mobile Menu button & Breadcrumbs */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  title="باز کردن منو"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Desktop Toggle Button (بستن منو و نمایش فقط آیکون‌ها) */}
                <button 
                  type="button"
                  onClick={toggleCompactMode}
                  className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 shadow-sm transition-all"
                  title={isCompact ? "باز کردن منوی کامل (نمایش عناوین)" : "بستن منو (فقط نمایش آیکون‌ها)"}
                >
                  {isCompact ? (
                    <>
                      <PanelRightOpen className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>باز کردن منو</span>
                    </>
                  ) : (
                    <>
                      <PanelRightClose className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>فقط آیکون‌ها</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${activeTheme.subText} hidden sm:inline`}>
                    پنل مدیریت
                  </span>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                  <span className={`text-sm font-black ${activeTheme.brandText}`}>
                    {currentNav?.name || 'سامانه جامع'}
                  </span>
                </div>
              </div>

              {/* Left side: Quick actions & User badge */}
              <div className="flex items-center gap-2.5">
                <Link 
                  to="/" 
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${activeTheme.userBox} hover:opacity-80`}
                  title="مشاهده سایت عمومی کوثر"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  <span>مشاهده سایت</span>
                </Link>

                <Link
                  to="/admin/panel-settings"
                  className={`p-2 rounded-xl border transition-colors ${activeTheme.userBox} hover:opacity-80`}
                  title="شخصی‌سازی ظاهر پنل"
                >
                  <Palette className="w-4 h-4 text-blue-500" />
                </Link>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${activeTheme.userBox}`}>
                  <span className="truncate max-w-[120px]">{currentUser.name}</span>
                  <span className="text-[10px] opacity-75 font-normal hidden sm:inline">
                    ({currentUser.role === 'super_admin' ? 'مدیر کل' : 'کارشناس'})
                  </span>
                </div>

                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-red-500 hover:bg-red-50/20 border border-red-500/20 transition-all"
                  title="خروج از حساب"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">خروج</span>
                </button>
              </div>
            </header>

            {/* Page Content Container */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
              <Suspense fallback={<div className="flex flex-1 min-h-[50vh] items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
              <Outlet />
            </Suspense>
            </main>
          </div>
        </div>
      )}

      {/* هشدار صوتی/تصویری انقضای نشست به دلیل عدم فعالیت */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-200 animate-in zoom-in-95 duration-200 text-center space-y-5" dir="rtl">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-rose-600/15">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">
                هشدار عدم فعالیت در پنل مدیریت
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                به منظور حفظ امنیت سامانه، در صورتی که کاری انجام ندهید نشست شما تا{' '}
                <span className="font-mono font-black text-base text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">{remainingSeconds}</span>{' '}
                ثانیه دیگر به صورت اتوماتیک منقضی شده و خارج خواهید شد.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleExtendSession}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>تمدید نشست و ادامه کار</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-sm transition-colors"
              >
                خروج امن
              </button>
            </div>
          </div>
        </div>
      )}

      <MenuReorderModal 
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        items={allowedNavItems}
        onSave={handleSaveMenuOrder}
      />
    </div>
  );
}
