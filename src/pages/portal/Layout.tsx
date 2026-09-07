import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { LayoutDashboard, MessageSquare, Receipt, LogOut, Menu, X, User, ShieldAlert } from 'lucide-react';
import { storage, PortalUser } from '../../lib/storage';
import { toPersianDigits } from '../../lib/persianNumberHelper';

export default function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);

  const checkUserStatus = useCallback(() => {
    const authData = localStorage.getItem('kowsar_portal_auth');
    if (!authData) {
      navigate('/portal/login');
      return;
    }

    try {
      const user: PortalUser = JSON.parse(authData);
      
      // Perform active verification against student repository
      const statusCheck = storage.isStudentActive(user.id || user.nationalCode);
      
      if (!statusCheck.isActive) {
        setIsTerminated(true);
        const kickoutReason = statusCheck.reason || 'حساب کاربری شما توسط اداره آموزش غیرفعال گردید و دسترسی شما به میز خدمت مسدود شد.';
        
        // Clear session
        localStorage.removeItem('kowsar_portal_auth');
        sessionStorage.setItem('kowsar_portal_kickout_reason', kickoutReason);

        // Record security audit event
        storage.addSecurityLog({
          eventType: 'account_locked',
          severity: 'high',
          category: 'auth',
          message: `اخراج خودکار دانشجو از پنل: ${user.name || user.nationalCode}`,
          userEmail: user.nationalCode,
          details: `دانشجو هنگام حضور در میز خدمت به دلیل غیرفعال بودن حساب در پایگاه داده بلافاصله از سیستم بیرون انداخته شد.`
        });

        // Instant redirect
        navigate('/portal/login?deactivated=1', { replace: true });
        return;
      }

      setCurrentUser(user);
    } catch {
      navigate('/portal/login');
    }
  }, [navigate]);

  useEffect(() => {
    // Initial check
    checkUserStatus();

    // Event listeners for cross-tab and real-time admin actions
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kowsar_students' || e.key === 'kowsar_portal_users' || e.key === 'kowsar_portal_auth') {
        checkUserStatus();
      }
    };

    const handleCustomChange = () => {
      checkUserStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kowsar_students_updated', handleCustomChange);
    window.addEventListener('kowsar_user_status_changed', handleCustomChange);
    window.addEventListener('kowsar_portal_users_updated', handleCustomChange);

    // Active polling every 1.5 seconds for instant response
    const interval = setInterval(checkUserStatus, 1500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kowsar_students_updated', handleCustomChange);
      window.removeEventListener('kowsar_user_status_changed', handleCustomChange);
      window.removeEventListener('kowsar_portal_users_updated', handleCustomChange);
      clearInterval(interval);
    };
  }, [checkUserStatus]);

  const handleLogout = () => {
    storage.addSecurityLog({
      eventType: 'auth_attempt',
      severity: 'low',
      category: 'auth',
      message: `خروج دانشجو از میز خدمت: ${currentUser?.name || currentUser?.nationalCode}`,
      userEmail: currentUser?.nationalCode
    });
    localStorage.removeItem('kowsar_portal_auth');
    navigate('/portal/login');
  };

  const navItems = [
    { name: 'داشبورد', path: '/portal', icon: LayoutDashboard },
    { name: 'درخواست‌ها و تیکت‌ها', path: '/portal/tickets', icon: MessageSquare },
    { name: 'امور مالی و ثبت رسید', path: '/portal/financial', icon: Receipt },
  ];

  if (isTerminated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white" dir="rtl">
        <div className="bg-slate-800 border border-red-500/40 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-red-400">حساب کاربری شما غیرفعال است</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            به دلیل غیرفعال شدن حساب کاربری توسط اداره آموزش، دسترسی شما به میز خدمت متوقف شد و به صفحه ورود هدایت می‌شوید...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <span className="font-black text-slate-800">میز خدمت دانشجویان</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-72 lg:w-64 bg-white border-l border-slate-200 flex flex-col fixed inset-y-0 right-0 z-30 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
        <div className="p-4 flex flex-col items-center justify-center border-b border-slate-100 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
            <User className="w-6 h-6" />
          </div>
          <span className="font-black text-slate-800 text-sm truncate w-full">{currentUser.name}</span>
          <div className="text-xs font-bold text-blue-600 mt-0.5">
            {currentUser.major ? `${currentUser.major} (${currentUser.degreeLevel || 'کاردانی'})` : 'دانشجوی مرکز'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1 bg-slate-100/70 px-2.5 py-0.5 rounded-full">
            {currentUser.studentId ? `شماره دانشجویی: ${toPersianDigits(currentUser.studentId)}` : `کد ملی: ${toPersianDigits(currentUser.nationalCode)}`}
          </div>
        </div>
        
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 w-full transition-all"
          >
            <LogOut className="w-5 h-5" />
            خروج از حساب
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow lg:mr-64 p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden pt-6">
        <Suspense fallback={<div className="flex flex-1 min-h-[50vh] items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
              <Outlet />
            </Suspense>
      </main>
    </div>
  );
}

