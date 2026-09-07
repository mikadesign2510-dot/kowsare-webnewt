/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, Suspense, lazy, ComponentType } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { storage } from './lib/storage';
import { setupGlobalInactivityTracker } from './lib/adminSession';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error: any) {
      const msg = error?.message || '';
      const isChunkError =
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('dynamically imported module') ||
        msg.includes('error loading dynamically imported module') ||
        error?.name === 'ChunkLoadError';

      const lastReload = parseInt(sessionStorage.getItem('kowsar_chunk_reload') || '0', 10);
      if (isChunkError && Date.now() - lastReload > 8000) {
        sessionStorage.setItem('kowsar_chunk_reload', Date.now().toString());
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });
}

const Home = lazyRetry(() => import('./pages/Home'));
const PreRegistration = lazyRetry(() => import('./pages/PreRegistration'));
const NewsList = lazyRetry(() => import('./pages/NewsList'));
const NewsDetail = lazyRetry(() => import('./pages/NewsDetail'));
const FormsPage = lazyRetry(() => import('./pages/Forms'));
const Gallery = lazyRetry(() => import('./pages/Gallery'));
const Presentation = lazyRetry(() => import('./pages/Presentation'));
const Contact = lazyRetry(() => import('./pages/Contact'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const AdminLogin = lazyRetry(() => import('./pages/admin/Login'));
const AdminLayout = lazyRetry(() => import('./pages/admin/Layout'));
const AdminDashboard = lazyRetry(() => import('./pages/admin/Dashboard'));
const AdminRegistrations = lazyRetry(() => import('./pages/admin/Registrations'));
const AdminStudentManager = lazyRetry(() => import('./pages/admin/StudentManager'));
const AdminStudentProfileManager = lazyRetry(() => import('./pages/admin/StudentProfileManager'));
const AdminNews = lazyRetry(() => import('./pages/admin/NewsManager'));
const AdminForms = lazyRetry(() => import('./pages/admin/FormsManager'));
const AdminUsers = lazyRetry(() => import('./pages/admin/UserManager'));
const AdminSettings = lazyRetry(() => import('./pages/admin/Settings'));
const AdminContact = lazyRetry(() => import('./pages/admin/ContactManager'));
const AdminBanners = lazyRetry(() => import('./pages/admin/BannerManager'));
const AdminGallery = lazyRetry(() => import('./pages/admin/GalleryManager'));
const AdminSystemLogs = lazyRetry(() => import('./pages/admin/SystemLogs'));
const AdminSecurityLogs = lazyRetry(() => import('./pages/admin/SecurityLogs'));
const AdminServerMonitoring = lazyRetry(() => import('./pages/admin/ServerMonitoring'));


const PortalLogin = lazyRetry(() => import('./pages/portal/Login'));
const PortalRegister = lazyRetry(() => import('./pages/portal/Register'));
const PortalLayout = lazyRetry(() => import('./pages/portal/Layout'));
const PortalDashboard = lazyRetry(() => import('./pages/portal/Dashboard'));
const PortalTickets = lazyRetry(() => import('./pages/portal/Tickets'));
const PortalFinancial = lazyRetry(() => import('./pages/portal/Financial'));


const AdminTickets = lazyRetry(() => import('./pages/admin/TicketsManager'));
const AdminFinancial = lazyRetry(() => import('./pages/admin/FinancialManager'));
const AdminPanelCustomization = lazyRetry(() => import('./pages/admin/PanelCustomization'));
const AdminPortalCustomization = lazyRetry(() => import('./pages/admin/PortalCustomization'));

const AdminPresentation = lazyRetry(() => import('./pages/admin/PresentationManager'));
const AdminMedia = lazyRetry(() => import('./pages/admin/ImageFileManager'));

export default function App() {
  useEffect(() => {
    
    // Fetch only public settings and content for visitors
    Promise.allSettled([
      storage.syncSettingsWithDB(),
      storage.syncPortalSettingsWithDB(),
      storage.syncBannersWithDB(),
      storage.syncNewsWithDB(),
      storage.syncPresentationWithDB()
    ]);

    
    // ناظر خودکار عدم فعالیت پنل مدیریت (خروج امن پس از ۱۰ دقیقه بی‌حرکتی)
    const cleanupInactivityTracker = setupGlobalInactivityTracker();

    // Cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kowsar_site_settings' || e.key === 'kowsar_portal_settings') {
        window.dispatchEvent(new Event('kowsar_site_settings_changed'));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      cleanupInactivityTracker();
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="images" element={<AdminMedia />} />
          <Route path="registrations" element={<AdminRegistrations />} />
          <Route path="students" element={<AdminStudentManager />} />
          <Route path="student-profiles" element={<AdminStudentProfileManager />} />
          <Route path="news" element={<AdminNews />} />
          <Route path="presentation" element={<AdminPresentation />} />
          <Route path="forms" element={<AdminForms />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="financial" element={<AdminFinancial />} />
          <Route path="portal-settings" element={<AdminPortalCustomization />} />
          <Route path="panel-settings" element={<AdminPanelCustomization />} />

          <Route path="settings" element={<AdminSettings />} />
          <Route path="contact" element={<AdminContact />} />
          <Route path="server-monitoring" element={<AdminServerMonitoring />} />
          <Route path="logs" element={<AdminSystemLogs />} />
          <Route path="security-logs" element={<AdminSecurityLogs />} />
        </Route>
        
        
        <Route path="/portal/login" element={<PortalLogin />} />
        <Route path="/portal/register" element={<PortalRegister />} />
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalDashboard />} />
          <Route path="tickets" element={<PortalTickets />} />
          <Route path="financial" element={<PortalFinancial />} />
        </Route>

        <Route path="*" element={
          <div className="min-h-screen flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900 bg-slate-50" dir="rtl">
            <Navbar />
            <main className="flex-grow w-full">
              <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
                <Routes>
                  <Route path="/" element={<Home />} />
                <Route path="/register" element={<PreRegistration />} />
                <Route path="/presentation" element={<Presentation />} />
                <Route path="/forms" element={<FormsPage />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/news" element={<NewsList />} />
                <Route path="/news/:id" element={<NewsDetail />} />
              </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </Router>
  );
}

