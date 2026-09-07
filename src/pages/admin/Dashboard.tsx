import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { Users, Newspaper, TrendingUp, Images, FileText, Activity, Database, CheckCircle2, MessageSquare, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    registrations: 0, newRegistrations: 0, openTickets: 0, pendingReceipts: 0, unreadMessages: 0,
    news: 0,
    banners: 0,
    forms: 0,
    unresolvedLogs: 0
  });
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    storage.syncAllWithDB().then(() => {
      setStats({
        registrations: storage.getRegistrations().length, newRegistrations: storage.getRegistrations().filter(r => r.status === "new").length, openTickets: storage.getTickets().filter(t => t.status === "open").length, pendingReceipts: storage.getReceipts().filter(r => r.status === "pending").length, unreadMessages: storage.getContactMessages().filter(m => m.status === "unread").length,
        news: storage.getNews().length,
        banners: storage.getActiveBanners().length,
        forms: storage.getForms().length,
        unresolvedLogs: storage.getUnresolvedErrorsCount()
      });
    });

    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') setDbConnected(true);
        else setDbConnected(false);
      })
      .catch(() => setDbConnected(false));
  }, []);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-black text-slate-800">داشبورد خلاصه وضعیت</h1>
        <Link 
          to="/admin/server-monitoring"
          className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 py-2 px-4 rounded-2xl text-xs font-bold shadow-sm hover:bg-emerald-100/60 transition-colors"
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>پایگاه داده PostgreSQL سرور کوثر:</span>
          <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {dbConnected ? 'متصل و پایدار' : 'در حال بررسی...'}
          </span>
          <span className="text-[11px] text-emerald-700 underline mr-1">مشاهده مانیتورینگ</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat Card 1 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-sm mb-1">کل پیش‌ثبت‌نام‌ها</p>
            <p className="text-3xl font-black text-slate-800">{stats.registrations} <span className="text-base font-medium text-slate-400">نفر</span></p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Newspaper className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-sm mb-1">اخبار منتشر شده</p>
            <p className="text-3xl font-black text-slate-800">{stats.news} <span className="text-base font-medium text-slate-400">خبر</span></p>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Images className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-sm mb-1">بنرهای فعال صفحه اول</p>
            <p className="text-3xl font-black text-slate-800">{stats.banners} <span className="text-base font-medium text-slate-400">اسلاید</span></p>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-sm mb-1">فرم‌های ضروری و آیین‌نامه‌ها</p>
            <p className="text-3xl font-black text-slate-800">{stats.forms} <span className="text-base font-medium text-slate-400">فرم</span></p>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            دسترسی سریع
          </h2>
          <div className="space-y-4">
            <Link to="/admin/server-monitoring" className="flex items-center justify-between p-4 bg-indigo-50/60 rounded-xl hover:bg-indigo-100/60 transition-colors border border-indigo-100">
              <span className="font-bold text-indigo-900">پایش بلادرنگ منابع سرور و پایگاه‌داده</span>
              <span className="bg-indigo-200/80 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">مانیتورینگ</span>
            </Link>
            <Link to="/admin/forms" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <span className="font-bold text-slate-700">مدیریت و بارگذاری فرم‌های آموزشی</span>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">فرم‌ها</span>
            </Link>
            <Link to="/admin/banners" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <span className="font-bold text-slate-700">مدیریت تصاویر و اسلایدر بنر</span>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">اسلایدر</span>
            </Link>
            <Link to="/admin/registrations" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <span className="font-bold text-slate-700">مشاهده لیست ثبت‌نامی‌ها</span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">جدید</span>
            </Link>
            <Link to="/admin/news" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <span className="font-bold text-slate-700">افزودن خبر جدید به سایت</span>
            </Link>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500" />
            سلامت سیستم
          </h2>
          
          <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-2xl border border-slate-100 mb-6 p-6 text-center">
            {stats.unresolvedLogs > 0 ? (
              <>
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{stats.unresolvedLogs} خطای حل نشده سیستم</h3>
                <p className="text-slate-500 text-sm">برخی از بخش‌های سایت ممکن است با مشکل مواجه باشند.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">سیستم پایدار است</h3>
                <p className="text-slate-500 text-sm">هیچ خطای بحرانی یا هشدار حل نشده‌ای وجود ندارد.</p>
              </>
            )}
          </div>
          
          <Link to="/admin/logs" className="flex items-center justify-center w-full p-4 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors font-bold">
            مشاهده کامل لاگ‌های سیستم
          </Link>
        </div>
      </div>
    </div>
  );
}
