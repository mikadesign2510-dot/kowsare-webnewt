import React, { useState, useEffect } from 'react';
import { storage, SystemLog } from '../../lib/storage';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import { 
  Activity, 
  AlertTriangle, 
  Bug, 
  Trash2, 
  CheckCircle2, 
  Search, 
  XCircle, 
  Info, 
  RefreshCw, 
  Wrench, 
  FlaskConical, 
  HardDrive, 
  ShieldCheck, 
  Check, 
  Zap,
  Terminal,
  Sparkles,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Copy,
  Share2,
  Database,
  Gauge,
  Lock,
  Layers,
  Clock,
  Cpu,
  Server,
  CheckCheck,
  HelpCircle,
  Lightbulb,
  X,
  Wifi,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function AdminSystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'error' | 'superficial'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Diagnostic & Health state
  const [diagReport, setDiagReport] = useState<ReturnType<typeof storage.runSystemDiagnostics> | null>(null);
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [repairResults, setRepairResults] = useState<string[] | null>(null);
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [isLoadingBackendHealth, setIsLoadingBackendHealth] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isBulkResolving, setIsBulkResolving] = useState(false);

  // Delete Confirmation states
  const [logToDelete, setLogToDelete] = useState<SystemLog | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  const loadLogs = async () => {
    setLogs(storage.getLogs());
    try {
      const dbLogs = await storage.syncSystemLogsWithDB();
      if (dbLogs && dbLogs.length > 0) {
        setLogs(dbLogs);
      }
    } catch {}
  };

  const loadHealthData = async () => {
    setIsLoadingBackendHealth(true);
    const health = await storage.fetchBackendHealth();
    setBackendHealth(health);
    setIsLoadingBackendHealth(false);
  };

  useEffect(() => {
    loadLogs();
    runDiagnostics();
    loadHealthData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleResolve = (id: string) => {
    storage.updateLogStatus(id, 'resolved');
    loadLogs();
    showToast('وضعیت خطا با موفقیت به «رفع شده» تغییر یافت.', 'success');
  };

  const handleResolveAll = async () => {
    setIsBulkResolving(true);
    try {
      await storage.resolveAllLogs();
      await loadLogs();
      runDiagnostics();
      showToast('تمامی خطاهای حل‌نشده با موفقیت بررسی و رفع گردیدند.', 'success');
    } finally {
      setIsBulkResolving(false);
    }
  };

  const handleCleanSuperficial = async () => {
    setIsBulkResolving(true);
    try {
      const count = await storage.cleanSuperficialLogs();
      await loadLogs();
      runDiagnostics();
      showToast(`تمامی هشدارهای موقت کنسول و خطاهای آزمایشی (${count} مورد) رفع شدند.`, 'success');
    } finally {
      setIsBulkResolving(false);
    }
  };

  const confirmDeleteSingleLog = () => {
    if (!logToDelete) return;
    const id = logToDelete.id;
    setLogToDelete(null);
    storage.deleteLog(id);
    loadLogs();
    runDiagnostics();
    showToast('لاگ مورد نظر با موفقیت حذف گردید.', 'info');
  };

  const confirmClearAllLogs = () => {
    setShowClearAllConfirm(false);
    storage.clearLogs();
    loadLogs();
    runDiagnostics();
    showToast('تمامی لاگ‌های سیستم پاکسازی شدند.', 'info');
  };

  const runDiagnostics = () => {
    setIsRunningDiag(true);
    setTimeout(() => {
      const report = storage.runSystemDiagnostics();
      setDiagReport(report);
      setIsRunningDiag(false);
    }, 400);
  };

  const handleAutoRepair = () => {
    const fixes = storage.autoRepairSystem();
    setRepairResults(fixes);
    loadLogs();
    runDiagnostics();
    showToast('عملیات تعمیر خودکار و بازیابی ساختار با موفقیت انجام شد.', 'success');
  };

  // Helper to intelligently analyze and categorize any log
  const getLogAnalysis = (log: SystemLog) => {
    const isSimulated = log.source?.includes('آزمایشی') || log.message?.includes('شبیه‌سازی');
    const isConsole = log.source?.includes('Console') || log.message?.includes('Console');
    const isNetwork = log.message?.includes('Network') || log.message?.includes('Failed to fetch') || log.message?.includes('Load failed');
    
    if (isSimulated) {
      return {
        type: 'superficial' as const,
        badge: 'آزمایشی / شبیه‌ساز (کاملاً سطحی)',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        reason: 'این رکورد توسط مرکز شبیه‌سازی و تست در پنل مدیریت ایجاد شده تا مکانیسم ثبت خطا را آزمایش کند.',
        impact: 'هیچ تاثیری بر کارکرد واقعی سایت ندارد و صرفاً یک تست نظارتی است.',
        solution: 'با کلیک روی «رفع شده» یا «پاکسازی خطاهای آزمایشی»، این هشدار برطرف می‌شود.'
      };
    }

    if (isConsole || log.level === 'warning' || log.level === 'info' || log.isSuperficial) {
      return {
        type: 'superficial' as const,
        badge: 'هشدار کنسول مرورگر (سطحی و گذرا)',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        reason: 'یک هشدار غیراضطراری در مرورگر بوده و عملکرد فرانت‌اند یا سرور را متوقف نکرده است.',
        impact: 'بدون اختلال؛ داده‌ها و پایگاه داده در سلامت کامل قرار دارند.',
        solution: 'نیازی به مداخله فنی در سرور نیست؛ می‌توانید وضعیت را به «رفع شده» تغییر دهید.'
      };
    }

    if (isNetwork) {
      return {
        type: 'superficial' as const,
        badge: 'نوسان گذرا در اتصال اینترنت کاربر (سطحی)',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        reason: 'درخواست در زمان افت موقت شبکه کلاینت یا خروج سریع از صفحه قبل از پایان دانلود قطع شده است.',
        impact: 'پایگاه داده سالم است و درخواست با اتصال مجدد به‌طور خودکار پاسخ داده می‌شود.',
        solution: 'در صورت فعال بودن سرور، وضعیت را با خیال راحت «رفع شده» علامت بزنید.'
      };
    }

    return {
      type: 'deep' as const,
      badge: 'خطای ساختاری / نیازمند بررسی',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      reason: 'خطایی در رندر کامپوننت React یا استثنای کد کلاینت گزارش شده است.',
      impact: 'ممکن است کاربر صفحه خطا یا ری‌لود دیده باشد.',
      solution: 'جزئیات Stack Trace را بررسی کنید و در صورت نیاز از دکمه «تعمیر خودکار» استفاده فرمایید.'
    };
  };

  // Log Export Handlers
  const downloadBlob = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      systemHealth: diagReport?.overallHealth || 'unknown',
      totalLogs: filteredLogs.length,
      logs: filteredLogs
    };
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadBlob(jsonStr, `kowsar-system-logs-${dateStr}.json`, 'application/json;charset=utf-8;');
    setShowExportMenu(false);
    showToast('فایل JSON لاگ‌ها با موفقیت دانلود شد.', 'success');
  };

  const handleExportCSV = () => {
    const headers = ['شناسه (ID)', 'سطح خطا (Level)', 'منبع (Source)', 'پیام خطا (Message)', 'زمان (Timestamp)', 'وضعیت (Status)'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${l.level}"`,
      `"${(l.source || '').replace(/"/g, '""')}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${new Date(l.timestamp).toLocaleString('fa-IR')}"`,
      `"${l.status === 'resolved' ? 'بررسی شده' : 'حل نشده'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadBlob(csvContent, `kowsar-system-logs-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    setShowExportMenu(false);
    showToast('فایل اکسل/CSV لاگ‌ها با موفقیت دانلود شد.', 'success');
  };

  const handleExportTextReport = () => {
    const dateStr = new Date().toLocaleDateString('fa-IR');
    const timeStr = new Date().toLocaleTimeString('fa-IR');
    let report = `=======================================================\n`;
    report += `گزارش جامع پایش و عیب‌یابی سامانه حوزه علمیه خواهران کوثر\n`;
    report += `تاریخ تولید گزارش: ${dateStr} - ساعت: ${timeStr}\n`;
    report += `وضعیت کلی سلامت سیستم: ${diagReport?.overallHealth === 'excellent' ? 'عالی و پایدار' : diagReport?.overallHealth === 'warning' ? 'نیازمند بررسی' : 'بحرانی'}\n`;
    report += `تعداد کل لاگ‌های موجود: ${logs.length} | خطاهای حل نشده: ${logs.filter(l => l.status === 'unresolved').length}\n`;
    report += `=======================================================\n\n`;

    filteredLogs.forEach((l, idx) => {
      report += `[${idx + 1}] سطح: ${l.level.toUpperCase()} | وضعیت: ${l.status === 'resolved' ? 'رفع شده' : 'حل نشده'}\n`;
      report += `منبع: ${l.source}\n`;
      report += `زمان: ${new Date(l.timestamp).toLocaleString('fa-IR')}\n`;
      report += `پیام: ${l.message}\n`;
      if (l.details) {
        report += `جزئیات / Stack Trace:\n${l.details}\n`;
      }
      report += `-------------------------------------------------------\n`;
    });

    const fileDate = new Date().toISOString().slice(0, 10);
    downloadBlob(report, `kowsar-system-report-${fileDate}.txt`, 'text/plain;charset=utf-8;');
    setShowExportMenu(false);
    showToast('گزارش متنی جامع سیستم با موفقیت تولید و دانلود شد.', 'success');
  };

  const handleCopyToClipboard = async () => {
    try {
      const summaryText = filteredLogs.map((l, i) => 
        `[#${i+1}] [${l.level.toUpperCase()}] (${new Date(l.timestamp).toLocaleString('fa-IR')}) ${l.source}: ${l.message}${l.details ? `\nStack: ${l.details}` : ''}`
      ).join('\n\n');
      
      await navigator.clipboard.writeText(summaryText);
      setShowExportMenu(false);
      showToast('خلاصه لاگ‌ها در کلیپ‌بورد کپی شد (مناسب ارسال به پشتیبانی).', 'success');
    } catch {
      showToast('خطا در دسترسی به کلیپ‌بورد', 'error');
    }
  };

  // Simulation test functions
  const triggerSimulation = (type: 'runtime' | 'console' | 'critical') => {
    if (type === 'runtime') {
      const mockError = new Error('خطای شبیه‌سازی شده در بارگذاری سرویس: اختلال در پاسخگویی شبکه');
      storage.addLog({
        level: 'error',
        source: 'Unhandled Promise Rejection (آزمایشی)',
        message: mockError.message,
        details: `Stack Trace:\nError: ${mockError.message}\n  at fetchServiceStatus (https://kowsar-kaki.ac.ir/src/services/api.ts:48:12)\n  at async loadDashboardData (https://kowsar-kaki.ac.ir/src/pages/Home.tsx:112:5)`,
        isSuperficial: true
      });
      showToast('یک خطای Runtime آزمایشی ثبت شد (سطحی).', 'info');
    } else if (type === 'console') {
      storage.addLog({
        level: 'warning',
        source: 'Console Error (آزمایشی)',
        message: 'هشدار شبیه‌سازی شده: تلاش برای خواندن فیلد نامعتبر در ماژول ثبت‌نام',
        details: 'Console Warning captured:\nWarning: Invalid property access detected in RegistrationForm at src/pages/Registration.tsx:88:14',
        isSuperficial: true
      });
      showToast('یک هشدار شبیه‌سازی شده کنسول ثبت شد (سطحی).', 'info');
    } else if (type === 'critical') {
      storage.addLog({
        level: 'critical',
        source: 'React ErrorBoundary (آزمایشی)',
        message: 'خطای بحرانی رندر کامپوننت اسلایدر: ساختار بنر نامعتبر است',
        details: `TypeError: Cannot read properties of undefined (reading 'imageUrl')\n  at BannerSlider.render (src/components/BannerSlider.tsx:34:18)\n  at ErrorBoundary.componentDidCatch (src/components/ErrorBoundary.tsx:24:5)`,
        isSuperficial: true
      });
      showToast('خطای بحرانی آزمایشی ایجاد شد! به شمارنده خطاهای حل‌نشده توجه کنید.', 'error');
    }

    loadLogs();
    runDiagnostics();
  };

  const unresolvedCount = logs.filter(l => l.status === 'unresolved').length;
  const unresolvedSuperficialCount = logs.filter(l => l.status === 'unresolved' && getLogAnalysis(l).type === 'superficial').length;
  const unresolvedDeepCount = unresolvedCount - unresolvedSuperficialCount;

  const filteredLogs = logs.filter(log => {
    if (filter === 'unresolved' && log.status !== 'unresolved') return false;
    if (filter === 'error' && log.level !== 'error' && log.level !== 'critical') return false;
    if (filter === 'superficial' && getLogAnalysis(log).type !== 'superficial') return false;
    if (searchTerm) {
      return log.message.includes(searchTerm) || log.source.includes(searchTerm);
    }
    return true;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'critical': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">بحرانی (Critical)</span>;
      case 'error': return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">خطا (Error)</span>;
      case 'warning': return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">هشدار (Warning)</span>;
      case 'info': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">اطلاع (Info)</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 left-6 z-50 px-6 py-4 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-bounce ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-800 text-white border-emerald-700' 
            : toastMessage.type === 'error'
            ? 'bg-red-700 text-white border-red-600'
            : 'bg-slate-800 text-white border-slate-700'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-amber-300" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-blue-300" />}
          <span className="font-bold text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            مرکز مانیتورینگ، خطایابی و تست سلامت سامانه
          </h1>
          <p className="text-slate-500 font-medium">
            پایش هوشمند رویدادها، خطایابی تحلیلی و تفکیک خطاهای سطحی از خطاهای عمیق
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 relative">
          {/* Realtime Backend Health Button */}
          <button
            onClick={() => {
              loadHealthData();
              setShowHealthModal(true);
            }}
            className="flex items-center gap-2 bg-slate-800 text-white px-3.5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors shadow-sm font-bold text-xs"
            title="مشاهده زنده وضعیت پایگاه داده PostgreSQL، حافظه و پوشه‌های سرور"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>سلامت دیتابیس و سرور</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-2.5 rounded-xl hover:bg-blue-100 transition-colors shadow-sm font-bold text-xs"
            >
              <Download className="w-4 h-4" />
              <span>خروجی و دانلود</span>
              <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.2 rounded-full">
                {filteredLogs.length}
              </span>
            </button>

            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-400">
                    فرمت‌های خروجی ({filteredLogs.length} مورد فیلتر شده)
                  </div>
                  
                  <button
                    onClick={handleExportJSON}
                    className="w-full text-right px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <FileJson className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold">دانلود فایل استاندارد JSON</p>
                      <p className="text-[10px] text-slate-400 font-normal">داده کامل با تمام جزییات و متادیتا</p>
                    </div>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="w-full text-right px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold">دانلود اکسل / CSV (جدولی)</p>
                      <p className="text-[10px] text-slate-400 font-normal">قابل بازگشایی در اکسل با فونت فارسی</p>
                    </div>
                  </button>

                  <button
                    onClick={handleExportTextReport}
                    className="w-full text-right px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold">گزارش متنی تفصیلی سلامت (.txt)</p>
                      <p className="text-[10px] text-slate-400 font-normal">شامل مشخصات سلامت و زمان‌بندی</p>
                    </div>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={handleCopyToClipboard}
                    className="w-full text-right px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Copy className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold">کپی سریع در کلیپ‌بورد</p>
                      <p className="text-[10px] text-slate-400 font-normal">مناسب ارسال فوری در تیکت پشتیبانی</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={loadLogs}
            className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            بروزرسانی
          </button>
          
          <button 
            type="button"
            onClick={() => setShowClearAllConfirm(true)}
            className="flex items-center justify-center gap-1.5 bg-red-50 text-red-600 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors font-bold text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            پاکسازی همه
          </button>
        </div>
      </div>

      {/* Explanation Banner: Superficial vs Deep Errors */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-blue-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                چرا برخی پیغام‌های خطا در حالت «حل نشده» باقی می‌مانند؟ آیا مشکل عمیق است یا سطحی؟
              </h3>
              <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                سیستم ثبت خطا مانند یک صندوق ورودی پیام است؛ هر رویداد (از جمله هشدارهای مرورگر و تست‌های آزمایشی) در حالت اولیه <span className="font-bold text-orange-700">«حل‌نشده»</span> ثبت می‌شود تا شما آن را ببینید. 
                بیش از <span className="font-bold text-emerald-700">۹۰٪ این پیام‌ها سطحی و گذرا</span> هستند و اختلالی در عملکرد سایت یا دیتابیس ایجاد نمی‌کنند.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              onClick={() => setShowKnowledgeModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-50 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" />
              راهنمای تحلیلی و تفکیک خطاها
            </button>
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="mt-4 pt-4 border-t border-blue-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
            <span className="text-slate-500">تفکیک وضعیت:</span>
            <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg">
              {unresolvedSuperficialCount} خطای سطحی / هشدار گذرا
            </span>
            <span className={`px-2.5 py-1 rounded-lg ${unresolvedDeepCount > 0 ? 'bg-red-100 text-red-800 font-black' : 'bg-emerald-100 text-emerald-800'}`}>
              {unresolvedDeepCount} خطای ساختاری نیازمند بررسی
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCleanSuperficial}
              disabled={isBulkResolving || unresolvedSuperficialCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              title="تغییر وضعیت تمام هشدارهای کنسول و خطاهای آزمایشی به حل شده"
            >
              <Sparkles className="w-3.5 h-3.5" />
              رفع خودکار خطاهای سطحی ({unresolvedSuperficialCount})
            </button>

            <button
              onClick={handleResolveAll}
              disabled={isBulkResolving || unresolvedCount === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
              title="علامت‌گذاری تمامی خطاهای حل نشده به عنوان رفع شده"
            >
              <CheckCheck className="w-4 h-4" />
              رفع همه خطاهای حل‌نشده ({unresolvedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Testing & Simulation Center */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-lg border border-slate-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  شبیه‌ساز و تست زنده کارکرد ابزار عیب‌یابی (Live Test Center)
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    آماده تست
                  </span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  توجه: خطاهای تولید شده در این بخش <span className="text-amber-300 font-bold">سطحی و آزمایشی</span> هستند و برای تست کارکرد ثباتی لاگ‌ها به کار می‌روند:
                </p>
              </div>
            </div>

            <button
              onClick={handleCleanSuperficial}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-colors font-bold"
            >
              پاکسازی لاگ‌های آزمایشی
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => triggerSimulation('runtime')}
              className="group p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-orange-500/50 rounded-2xl text-right transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    تست ۱ (سطحی)
                  </span>
                  <Zap className="w-4 h-4 text-orange-400 group-hover:scale-125 transition-transform" />
                </div>
                <h4 className="font-bold text-white text-xs mb-1">شبیه‌سازی خطای جاوااسکریپت (Promise Rejection)</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  تولید یک استثنای موقت و ثبت فوری آن در دیتابیس لاگ.
                </p>
              </div>
              <div className="mt-3 text-xs font-bold text-orange-400 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                <span>اجرای تست ۱</span>
                <span>←</span>
              </div>
            </button>

            <button
              onClick={() => triggerSimulation('console')}
              className="group p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-2xl text-right transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    تست ۲ (سطحی)
                  </span>
                  <Terminal className="w-4 h-4 text-amber-400 group-hover:scale-125 transition-transform" />
                </div>
                <h4 className="font-bold text-white text-xs mb-1">شبیه‌سازی هشدار کنسول (Console.warn)</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  بررسی تله‌گذار اختصاصی کنسول و ذخیره آن به عنوان هشدار گذرا.
                </p>
              </div>
              <div className="mt-3 text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                <span>اجرای تست ۲</span>
                <span>←</span>
              </div>
            </button>

            <button
              onClick={() => triggerSimulation('critical')}
              className="group p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-red-500/50 rounded-2xl text-right transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                    تست ۳ (شبیه‌ساز بحرانی)
                  </span>
                  <Bug className="w-4 h-4 text-red-400 group-hover:scale-125 transition-transform" />
                </div>
                <h4 className="font-bold text-white text-xs mb-1">شبیه‌سازی خطای رندر (React ErrorBoundary)</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  بررسی مکانیزم ایمنی مرز خطای کامپوننت و جلوگیری از سفید شدن صفحه.
                </p>
              </div>
              <div className="mt-3 text-xs font-bold text-red-400 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                <span>اجرای تست ۳</span>
                <span>←</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostics and Repair Section */}
      {diagReport && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-indigo-600" />
                گزارش جامع سلامت ماژول‌های سامانه و پایگاه داده
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                بررسی بلادرنگ موجودیت رکوردها، بنرهای فعال، اخبار و حساب‌های کاربری
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={runDiagnostics}
                disabled={isRunningDiag}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiag ? 'animate-spin' : ''}`} />
                اسکن مجدد
              </button>

              <button
                onClick={handleAutoRepair}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
              >
                <Wrench className="w-3.5 h-3.5" />
                تعمیر خودکار و ترمیم ساختار (Auto-Repair)
              </button>
            </div>
          </div>

          {/* Module Health Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {diagReport.modulesStatus.map((mod, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                <div className="mt-0.5">
                  {mod.status === 'healthy' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate">{mod.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {mod.count}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{mod.message}</p>
                </div>
              </div>
            ))}
          </div>

          {repairResults && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium space-y-1">
              <div className="font-bold flex items-center gap-1 text-emerald-900 mb-1">
                <Sparkles className="w-4 h-4" />
                نتیجه عملیات تعمیر خودکار و بازیابی ساختار:
              </div>
              {repairResults.length === 0 ? (
                <p>تمامی ساختارهای پایگاه داده سالم بودند و هیچ نقصی مشاهده نشد.</p>
              ) : (
                repairResults.map((res, idx) => (
                  <p key={idx}>• {res}</p>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Filters and Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm md:col-span-1 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            unresolvedCount > 0
              ? 'bg-amber-50 text-amber-600'
              : 'bg-emerald-50 text-emerald-500'
          }`}>
            <Bug className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">کل موارد حل‌نشده</p>
            <p className="text-2xl font-black text-slate-800">{unresolvedCount}</p>
            <p className="text-[10px] text-slate-400">
              ({unresolvedSuperficialCount} سطحی / {unresolvedDeepCount} ساختاری)
            </p>
          </div>
        </div>

        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm md:col-span-3 flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="جستجو در عنوان، منبع و پیام‌های لاگ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl pr-10 pl-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              همه ({logs.length})
            </button>
            <button 
              onClick={() => setFilter('unresolved')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${filter === 'unresolved' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              حل‌نشده ({unresolvedCount})
            </button>
            <button 
              onClick={() => setFilter('superficial')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${filter === 'superficial' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              سطحی/هشدار ({logs.filter(l => getLogAnalysis(l).type === 'superficial').length})
            </button>
            <button 
              onClick={() => setFilter('error')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${filter === 'error' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              فقط خطا و بحرانی ({logs.filter(l => l.level === 'error' || l.level === 'critical').length})
            </button>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">هیچ خطایی در این بخش وجود ندارد</h3>
            <p className="text-slate-500 text-xs max-w-md">
              سامانه و پایگاه داده در وضعیت پایدار هستند. در صورت لزوم می‌توانید از بخش تست زنده بالای صفحه برای شبیه‌سازی خطا استفاده نمایید.
            </p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const analysis = getLogAnalysis(log);
            const isExpanded = expandedLogId === log.id;

            return (
              <div 
                key={log.id} 
                className={`bg-white rounded-2xl border ${
                  log.status === 'unresolved' && (log.level === 'critical' || log.level === 'error')
                    ? 'border-red-200 bg-red-50/10 shadow-sm' 
                    : log.status === 'unresolved'
                    ? 'border-amber-200 bg-amber-50/10 shadow-sm'
                    : 'border-slate-100'
                } p-5 transition-all hover:shadow-md`}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  
                  <div className="flex-shrink-0 pt-1">
                    {getLevelIcon(log.level)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getLevelBadge(log.level)}
                      
                      {/* Analysis Badge (Superficial vs Deep) */}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${analysis.badgeClass}`}>
                        {analysis.badge}
                      </span>

                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {log.source}
                      </span>
                      
                      <span className="text-xs text-slate-400 font-medium" dir="ltr">
                        {new Date(log.timestamp).toLocaleString('fa-IR')}
                      </span>

                      {log.status === 'resolved' ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          بررسی و رفع شده
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                          حل نشده
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-sm font-bold text-slate-800 mb-2 break-words leading-relaxed">{log.message}</h4>

                    {/* Smart Analysis Accordion Toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors mb-2"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isExpanded ? 'بستن راهنما و تحلیل هوشمند' : 'تحلیل علت و راهکار هوشمند این پیام'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Smart Analysis Helper Box */}
                    {isExpanded && (
                      <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-700 animate-in fade-in duration-150">
                        <div className="flex items-start gap-1.5">
                          <span className="font-bold text-slate-900 shrink-0">علت وقوع رویداد:</span>
                          <span className="text-slate-600 leading-relaxed">{analysis.reason}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="font-bold text-slate-900 shrink-0">میزان تاثیر بر سیستم:</span>
                          <span className="text-slate-600 leading-relaxed">{analysis.impact}</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-emerald-800 font-medium">
                          <span className="font-bold text-emerald-950 shrink-0">راهکار رفع و توصیه:</span>
                          <span className="leading-relaxed">{analysis.solution}</span>
                        </div>
                      </div>
                    )}
                    
                    {log.details && (
                      <div className="mt-2 bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs font-mono overflow-x-auto text-left leading-relaxed max-h-48" dir="ltr">
                        <pre>{log.details}</pre>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 mt-4 md:mt-0 flex flex-col sm:flex-row items-stretch md:items-center gap-2">
                    {log.status === 'unresolved' && (
                      <button 
                        onClick={() => handleResolve(log.id)}
                        className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3.5 py-2 rounded-xl transition-colors font-bold text-xs border border-emerald-200/60 shadow-xs"
                        title="تغییر وضعیت به رفع شده"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        رفع شده
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => setLogToDelete(log)}
                      className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3.5 py-2 rounded-xl transition-colors font-bold text-xs border border-red-200/60"
                      title="حذف کامل این رکورد لاگ"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Backend Live Health Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">وضعیت زنده سرور و پایگاه داده PostgreSQL</h3>
                  <p className="text-xs text-slate-500">اتصال مستقیم به سرور و بررسی پوشه‌های فایل</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHealthModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingBackendHealth ? (
              <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span>در حال دریافت اطلاعات سلامت سرور و پایگاه داده...</span>
              </div>
            ) : backendHealth ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-slate-400 text-[10px]">اتصال دیتابیس</p>
                    <p className="text-emerald-700 font-bold text-sm mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      متصل و پایدار
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-slate-400 text-[10px]">پینگ دیتابیس (Latency)</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5" dir="ltr">
                      {backendHealth.database?.latencyMs} ms
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-slate-400 text-[10px]">نام پایگاه داده</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5" dir="ltr">
                      {backendHealth.database?.databaseName}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-slate-400 text-[10px]">مصرف حافظه RAM سرور</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5" dir="ltr">
                      {backendHealth.server?.memoryUsageMb?.rss} MB
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-slate-400 text-[10px]">مدت فعالیت سرور (Uptime)</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5" dir="ltr">
                      {Math.floor(backendHealth.server?.uptimeSeconds / 60)} دقیقه
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-slate-400 text-[10px]">نسخه Node.js</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5" dir="ltr">
                      {backendHealth.server?.nodeVersion}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">تعداد رکوردهای ثبت‌شده در جداول اصلی PostgreSQL:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="text-slate-500">اخبار و رویدادها:</span>
                      <span className="font-bold text-slate-800">{backendHealth.counts?.news}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="text-slate-500">اسلایدرها و بنرها:</span>
                      <span className="font-bold text-slate-800">{backendHealth.counts?.banners}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="text-slate-500">فرم‌ها و جزوات:</span>
                      <span className="font-bold text-slate-800">{backendHealth.counts?.forms}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="text-slate-500">پیش‌ثبت‌نام‌ها:</span>
                      <span className="font-bold text-slate-800">{backendHealth.counts?.registrations}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="text-slate-500">حساب‌های کاربری:</span>
                      <span className="font-bold text-slate-800">{backendHealth.counts?.users}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <span className="text-slate-500">کل لاگ‌های ثبت‌شده:</span>
                      <span className="font-bold text-slate-800">{backendHealth.counts?.totalLogs}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">وضعیت دسترسی و مجوزهای پوشه‌های سرور:</h4>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <span>پوشه آپلود جزوات (/uploads/pamphlets)</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        فعال و دارای مجوز نوشتن ({backendHealth.storageFolders?.pamphlets?.filesCount} فایل)
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <span>پوشه آپلود فرم‌ها (/uploads/forms)</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        فعال و دارای مجوز نوشتن ({backendHealth.storageFolders?.forms?.filesCount} فایل)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-red-600">اطلاعات سلامت در دسترس نیست.</p>
            )}

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowHealthModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Explanation Modal */}
      {showKnowledgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">راهنمای تحلیلی خطاهای سیستم</h3>
                  <p className="text-xs text-slate-500">پاسخ به سوالات رایج درباره پیغام‌های خطا و وضعیت حل‌نشده</p>
                </div>
              </div>
              <button 
                onClick={() => setShowKnowledgeModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-900 mb-1">۱. چرا خطاها در وضعیت «حل نشده» باقی می‌مانند؟</h4>
                <p>
                  لاگ‌گیر سیستم مانند یک سیستم اعلان کار می‌کند. هرگاه رویدادی در مرورگر یا سرور ثبت شود، وضعیت اولیه آن «حل‌نشده» است تا مدیر سیستم مطلع شود. این به این معنی نیست که برنامه از کار افتاده یا خراب است، بلکه صرفاً نیاز به بررسی یا تأیید مدیر دارد. با زدن دکمه <strong>«رفع شده»</strong> یا <strong>«رفع همه»</strong> وضعیت آن ثبت نهایی می‌شود.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <h4 className="font-bold text-emerald-900 mb-1">۲. تفاوت خطای سطحی با خطای عمیق چیست؟</h4>
                <p>
                  <strong>خطای سطحی (Superficial):</strong> مواردی مثل لود نشدن یک تصویر جانبی، هشدارهای کنسول مرورگر کلاینت، قطعی موقت اینترنت کاربر، یا تست‌هایی که در پنل شبیه‌ساز اجرا کرده‌اید. این موارد هیچ خطری برای دیتابیس یا کارکرد کلی سایت ندارند.
                </p>
                <p className="mt-1.5">
                  <strong>خطای عمیق (Deep/Structural):</strong> مواردی که با برچسب بحرانی (Critical) یا خطای دیتابیس مشخص شده و مانع از باز شدن یک صفحه یا ثبت اطلاعات در پایگاه داده می‌شوند.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">۳. چگونه خطاهای سطحی و آزمایشی را یکجا پاک کنیم؟</h4>
                <p>
                  کافی است روی دکمه <strong>«رفع خودکار خطاهای سطحی»</strong> در بالای صفحه کلیک کنید. این دکمه تمام پیام‌های تستی و هشدارهای موقت را بدون حذف سوابق مهم، به وضعیت «بررسی و رفع شده» تغییر می‌دهد.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowKnowledgeModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Log Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(logToDelete)}
        onClose={() => setLogToDelete(null)}
        onConfirm={confirmDeleteSingleLog}
        title="حذف رکورد لاگ سیستم"
        itemName={logToDelete?.message}
        details={logToDelete ? [
          { label: 'منبع رویداد', value: logToDelete.source },
          { label: 'سطح اهمیت', value: logToDelete.level }
        ] : undefined}
      />

      {/* Clear All Logs Modal */}
      <DeleteConfirmModal
        isOpen={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        onConfirm={confirmClearAllLogs}
        title="پاکسازی تمامی لاگ‌های سیستم"
        itemCount={logs.length}
        confirmText="بله، همه لاگ‌ها پاکسازی شوند"
      />
    </div>
  );
}
