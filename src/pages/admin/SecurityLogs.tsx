import React, { useState, useEffect, useMemo } from 'react';
import { storage, SecurityLog, SecurityEventType, SecuritySeverity, SecurityLogCategory } from '../../lib/storage';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  Trash2, 
  Search, 
  UserX, 
  Database,
  LockKeyhole,
  AlertTriangle,
  Fingerprint,
  MonitorSmartphone,
  CalendarClock,
  LogOut,
  Ban,
  Activity,
  FileJson,
  FileSpreadsheet,
  Printer,
  Download,
  Globe,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  X,
  Eye,
  Send,
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';
import { toPersianDigits } from '../../lib/persianNumberHelper';

type CategoryTab = 'all' | 'auth' | 'access' | 'data' | 'threat' | 'system';
type TimeRange = 'all' | 'today' | '24h' | '7d' | '30d';

export default function AdminSecurityLogs() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [filterSeverity, setFilterSeverity] = useState<SecuritySeverity | 'all'>('all');
  const [filterType, setFilterType] = useState<SecurityEventType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'investigating' | 'resolved'>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI states
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadLogs = () => {
    setLogs(storage.getSecurityLogs());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const confirmClearSecurityLogs = () => {
    setShowClearConfirm(false);
    storage.clearSecurityLogs();
    storage.addSecurityLog({
      eventType: 'data_modified',
      severity: 'critical',
      category: 'data',
      message: 'پاکسازی پایگاه داده لاگ‌های امنیتی',
      details: 'تمامی لاگ‌های امنیتی توسط مدیر سیستم پاکسازی شد.'
    });
    loadLogs();
    showToast('لاگ‌های امنیتی با موفقیت پاکسازی شدند.', 'info');
  };

  const handleSimulateTestLog = () => {
    const testTypes: { type: SecurityEventType; sev: SecuritySeverity; cat: SecurityLogCategory; msg: string; det: string }[] = [
      {
        type: 'account_locked',
        sev: 'high',
        cat: 'auth',
        msg: 'تست سیستم: اخراج خودکار دانشجوی غیرفعال',
        det: 'راستی‌آزمایی ماژول پایان نشست خودکار با موفقیت ارزیابی شد.'
      },
      {
        type: 'login_failed',
        sev: 'medium',
        cat: 'auth',
        msg: 'تست سیستم: ورود ناموفق با رمز عبور اشتباه',
        det: 'سامانه دفاعی نرخ درخواست فعال گردید.'
      },
      {
        type: 'permission_denied',
        sev: 'high',
        cat: 'access',
        msg: 'تست سیستم: تلاش برای فراخوانی API مسدودشده',
        det: 'مسیر /api/admin توسط دیوار آتش داخلی مسدود شد.'
      }
    ];

    const pick = testTypes[Math.floor(Math.random() * testTypes.length)];
    storage.addSecurityLog({
      eventType: pick.type,
      severity: pick.sev,
      category: pick.cat,
      message: pick.msg,
      details: pick.det,
      ipAddress: '127.0.0.1 (تست شبیه‌ساز)'
    });
    loadLogs();
    showToast('یک رویداد امنیتی آزمایشی با موفقیت ثبت گردید.', 'success');
  };

  const handleUpdateLogStatus = (id: string, status: 'investigating' | 'resolved') => {
    storage.updateSecurityLogStatus(id, status, resolutionNoteInput);
    loadLogs();
    showToast(`وضعیت رویداد با موفقیت به "${status === 'resolved' ? 'بررسی‌شده و مختومه' : 'در حال پیگیری'}" تغییر یافت.`, 'success');
    if (selectedLog?.id === id) {
      setSelectedLog(prev => prev ? { ...prev, status, resolutionNote: resolutionNoteInput } : null);
    }
  };

  // Helper to map log to category
  const getLogCategory = (log: SecurityLog): SecurityLogCategory => {
    if (log.category) return log.category;
    if (log.eventType === 'login_success' || log.eventType === 'login_failed' || log.eventType === 'auth_attempt' || log.eventType === 'account_locked') return 'auth';
    if (log.eventType === 'permission_denied') return 'access';
    if (log.eventType === 'rate_limited') return 'threat';
    if (log.eventType === 'data_modified') return 'data';
    return 'system';
  };

  // Filtering
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const cat = getLogCategory(log);
      
      // Category Tab
      if (activeTab !== 'all' && cat !== activeTab) {
        // also handle threat / access overlap gracefully
        if (activeTab === 'threat' && (cat !== 'threat' && log.eventType !== 'rate_limited' && log.eventType !== 'permission_denied')) return false;
        if (activeTab === 'access' && (cat !== 'access' && log.eventType !== 'permission_denied')) return false;
        if (activeTab !== 'threat' && activeTab !== 'access') return false;
      }

      // Severity
      if (filterSeverity !== 'all' && log.severity !== filterSeverity) return false;

      // Event Type
      if (filterType !== 'all' && log.eventType !== filterType) return false;

      // Status
      if (filterStatus !== 'all') {
        const currentStatus = log.status || (log.severity === 'critical' || log.severity === 'high' ? 'investigating' : 'resolved');
        if (currentStatus !== filterStatus) return false;
      }

      // Time Range
      if (timeRange !== 'all') {
        const logTime = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (timeRange === 'today') {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          if (logTime < startOfToday.getTime()) return false;
        } else if (timeRange === '24h') {
          if (now - logTime > 24 * 60 * 60 * 1000) return false;
        } else if (timeRange === '7d') {
          if (now - logTime > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (timeRange === '30d') {
          if (now - logTime > 30 * 24 * 60 * 60 * 1000) return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          log.message.toLowerCase().includes(term) ||
          (log.userEmail && log.userEmail.toLowerCase().includes(term)) ||
          (log.details && log.details.toLowerCase().includes(term)) ||
          (log.ipAddress && log.ipAddress.toLowerCase().includes(term))
        );
      }

      return true;
    });
  }, [logs, activeTab, filterSeverity, filterType, filterStatus, timeRange, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const critical = logs.filter(l => l.severity === 'critical').length;
    const high = logs.filter(l => l.severity === 'high').length;
    const medium = logs.filter(l => l.severity === 'medium').length;
    const low = logs.filter(l => l.severity === 'low').length;

    const authCount = logs.filter(l => getLogCategory(l) === 'auth').length;
    const accessCount = logs.filter(l => getLogCategory(l) === 'access' || l.eventType === 'permission_denied').length;
    const threatCount = logs.filter(l => getLogCategory(l) === 'threat' || l.eventType === 'rate_limited').length;
    const dataCount = logs.filter(l => getLogCategory(l) === 'data').length;
    const systemCount = logs.filter(l => getLogCategory(l) === 'system').length;

    const resolved = logs.filter(l => l.status === 'resolved' || (!l.status && l.severity === 'low')).length;
    const pendingInvestigate = total - resolved;

    // Security Posture Score (100 - penalties for open criticals/highs)
    let score = 100;
    score -= critical * 8;
    score -= high * 3;
    score -= pendingInvestigate * 1;
    if (score < 65) score = 65;

    return {
      total,
      critical,
      high,
      medium,
      low,
      authCount,
      accessCount,
      threatCount,
      dataCount,
      systemCount,
      resolved,
      pendingInvestigate,
      healthScore: Math.min(100, Math.max(0, score))
    };
  }, [logs]);

  const getSeverityBadge = (severity: SecuritySeverity) => {
    switch (severity) {
      case 'critical': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg text-xs font-black border border-red-200">بحرانی (Critical)</span>;
      case 'high': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-black border border-orange-200">بالا (High)</span>;
      case 'medium': return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-black border border-amber-200">متوسط (Medium)</span>;
      case 'low': return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-black border border-emerald-200">پایین (Low)</span>;
      default: return null;
    }
  };

  const getEventTypeConfig = (type: SecurityEventType) => {
    switch (type) {
      case 'login_success': return { icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />, label: 'ورود موفق به سامانه', color: 'text-emerald-700', bg: 'bg-emerald-50' };
      case 'login_failed': return { icon: <UserX className="w-5 h-5 text-rose-600" />, label: 'تلاش ناموفق ورود', color: 'text-rose-700', bg: 'bg-rose-50' };
      case 'auth_attempt': return { icon: <LogOut className="w-5 h-5 text-indigo-600" />, label: 'نشست کاربری / خروج', color: 'text-indigo-700', bg: 'bg-indigo-50' };
      case 'data_modified': return { icon: <Database className="w-5 h-5 text-blue-600" />, label: 'تغییر داده‌های حساس', color: 'text-blue-700', bg: 'bg-blue-50' };
      case 'permission_denied': return { icon: <Ban className="w-5 h-5 text-amber-600" />, label: 'دسترسی غیرمجاز', color: 'text-amber-700', bg: 'bg-amber-50' };
      case 'account_locked': return { icon: <LockKeyhole className="w-5 h-5 text-red-600" />, label: 'اخراج / مسدودسازی حساب', color: 'text-red-700', bg: 'bg-red-50' };
      case 'rate_limited': return { icon: <AlertTriangle className="w-5 h-5 text-rose-600" />, label: 'محدودیت نرخ (Rate Limit)', color: 'text-rose-700', bg: 'bg-rose-50' };
      case 'system_alert': return { icon: <Activity className="w-5 h-5 text-teal-600" />, label: 'پایش و هشدار سیستم', color: 'text-teal-700', bg: 'bg-teal-50' };
      default: return { icon: <Activity className="w-5 h-5 text-slate-500" />, label: 'رویداد عمومی', color: 'text-slate-700', bg: 'bg-slate-50' };
    }
  };

  // Export handlers
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
      exportTitle: 'گزارش امنیتی مرکز آموزش علمی کاربردی کوثر کاکی',
      generatedAt: new Date().toISOString(),
      summaryStats: stats,
      totalRecords: filteredLogs.length,
      logs: filteredLogs
    };
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    downloadBlob(jsonStr, `kowsar-security-report-${Date.now()}.json`, 'application/json;charset=utf-8;');
    setShowExportMenu(false);
    showToast('فایل گزارش JSON با موفقیت دانلود شد.', 'success');
  };

  const handleExportCSV = () => {
    const headers = ['شناسه', 'دسته‌بندی', 'نوع رویداد', 'سطح اهمیت', 'پیام رویداد', 'شناسه کاربر', 'آدرس IP', 'زمان وقوع', 'وضعیت بررسی', 'مرورگر و کلاینت'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${getLogCategory(l)}"`,
      `"${getEventTypeConfig(l.eventType).label}"`,
      `"${l.severity}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${l.userEmail || 'کاربر ناشناس'}"`,
      `"${l.ipAddress || 'نامشخص'}"`,
      `"${new Date(l.timestamp).toLocaleString('fa-IR')}"`,
      `"${l.status === 'resolved' ? 'بررسی‌شده' : 'در حال بررسی'}"`,
      `"${(l.userAgent || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    downloadBlob(csvContent, `kowsar-security-audit-${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    setShowExportMenu(false);
    showToast('فایل گزارش اکسل (CSV) با موفقیت دانلود شد.', 'success');
  };

  const handlePrint = () => {
    window.print();
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 left-6 z-50 px-6 py-4 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-5 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-900 text-white border-emerald-700' 
            : toastMessage.type === 'info'
            ? 'bg-slate-900 text-white border-slate-700'
            : 'bg-rose-900 text-white border-rose-700'
        }`}>
          {toastMessage.type === 'success' && <ShieldCheck className="w-5 h-5 text-emerald-300" />}
          {toastMessage.type === 'info' && <Shield className="w-5 h-5 text-blue-300" />}
          <span className="font-bold text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              مرکز پایش و گزارشگری امنیتی (Security Intelligence)
            </h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              تفکیک هوشمند نشست‌ها، دسترسی‌های غیرمجاز، ممیزی تغییرات داده‌ها و ردیابی بلادرنگ وقایع
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
          {/* Simulate Action for verification */}
          <button
            onClick={handleSimulateTestLog}
            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-3.5 py-2.5 rounded-xl hover:bg-indigo-100 transition-colors font-bold text-xs"
            title="ایجاد لاگ نمونه برای تست"
          >
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>ثبت لاگ تستی</span>
          </button>

          {/* Export Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 font-bold text-xs"
            >
              <Download className="w-4 h-4" />
              <span>دریافت خروجی گزارش</span>
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowExportMenu(false)} />
                <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-30 animate-in fade-in zoom-in-95 duration-100 text-right">
                  <button onClick={handleExportCSV} className="w-full text-right px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> دانلود خروجی اکسل (CSV)
                  </button>
                  <button onClick={handleExportJSON} className="w-full text-right px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                    <FileJson className="w-4 h-4 text-amber-600" /> دانلود ساختاریافته (JSON)
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button onClick={handlePrint} className="w-full text-right px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                    <Printer className="w-4 h-4 text-slate-600" /> چاپ رسمی گزارش امنیتی
                  </button>
                </div>
              </>
            )}
          </div>

          <button 
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center justify-center gap-1.5 bg-rose-50 text-rose-700 px-3.5 py-2.5 rounded-xl hover:bg-rose-100 transition-colors font-bold text-xs border border-rose-200"
          >
            <Trash2 className="w-4 h-4" />
            <span>پاکسازی</span>
          </button>
        </div>
      </div>

      {/* Security Health & KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Health Score Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl border border-slate-700 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">شاخص سلامت امنیتی</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">{toPersianDigits(stats.healthScore)}٪</span>
              <span className="text-xs font-bold text-slate-300">وضعیت پایدار</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.healthScore}%` }}
              ></div>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            {stats.pendingInvestigate > 0 ? `${toPersianDigits(stats.pendingInvestigate)} مورد نیازمند بررسی` : 'همه رویدادها بررسی شده‌اند'}
          </span>
        </div>

        {/* Critical Severity Card */}
        <div 
          onClick={() => setFilterSeverity(filterSeverity === 'critical' ? 'all' : 'critical')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            filterSeverity === 'critical' ? 'bg-red-50 border-red-400 ring-2 ring-red-400' : 'bg-white border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">رویدادهای بحرانی</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600">{toPersianDigits(stats.critical)}</div>
          <p className="text-[11px] text-slate-400 mt-1">نیازمند اقدام و رسیدگی فوری</p>
        </div>

        {/* High Severity Card */}
        <div 
          onClick={() => setFilterSeverity(filterSeverity === 'high' ? 'all' : 'high')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            filterSeverity === 'high' ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400' : 'bg-white border-slate-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">شدت بالا (High)</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <LockKeyhole className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-600">{toPersianDigits(stats.high)}</div>
          <p className="text-[11px] text-slate-400 mt-1">مسدودسازی و قطع نشست‌ها</p>
        </div>

        {/* Medium Severity Card */}
        <div 
          onClick={() => setFilterSeverity(filterSeverity === 'medium' ? 'all' : 'medium')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            filterSeverity === 'medium' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400' : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">شدت متوسط (Medium)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{toPersianDigits(stats.medium)}</div>
          <p className="text-[11px] text-slate-400 mt-1">تلاش ناموفق ورود / ویرایش</p>
        </div>

        {/* Low Severity Card */}
        <div 
          onClick={() => setFilterSeverity(filterSeverity === 'low' ? 'all' : 'low')}
          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
            filterSeverity === 'low' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400' : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">عادی و ورودها (Low)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{toPersianDigits(stats.low)}</div>
          <p className="text-[11px] text-slate-400 mt-1">ورود موفق و پایش عادی</p>
        </div>
      </div>

      {/* Categorized Tab Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>همه رویدادها</span>
          <span className="bg-white/20 text-current px-1.5 py-0.5 rounded-md text-[10px]">{toPersianDigits(stats.total)}</span>
        </button>

        <button
          onClick={() => setActiveTab('auth')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'auth' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>احراز هویت و نشست‌ها</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'auth' ? 'bg-white/20' : 'bg-blue-50 text-blue-700'}`}>
            {toPersianDigits(stats.authCount)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('access')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'access' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>کنترل دسترسی و نقض‌ها</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'access' ? 'bg-white/20' : 'bg-orange-50 text-orange-700'}`}>
            {toPersianDigits(stats.accessCount)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'data' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>ممیزی داده‌های حساس</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'data' ? 'bg-white/20' : 'bg-indigo-50 text-indigo-700'}`}>
            {toPersianDigits(stats.dataCount)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('threat')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'threat' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>پدافند تهدیدات و حملات</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'threat' ? 'bg-white/20' : 'bg-rose-50 text-rose-700'}`}>
            {toPersianDigits(stats.threatCount)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'system' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>پایش و سلامت سیستم</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'system' ? 'bg-white/20' : 'bg-teal-50 text-teal-700'}`}>
            {toPersianDigits(stats.systemCount)}
          </span>
        </button>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="جستجو در پیام‌ها، کدملی کاربر، آدرس IP یا جزئیات فنی..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              پاکسازی
            </button>
          )}
        </div>

        {/* Time Range */}
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
        >
          <option value="all">همه بازه‌های زمانی</option>
          <option value="today">امروز</option>
          <option value="24h">۲۴ ساعت اخیر</option>
          <option value="7d">۷ روز گذشته</option>
          <option value="30d">۳۰ روز گذشته</option>
        </select>

        {/* Status Filter */}
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
        >
          <option value="all">همه وضعیت‌های بررسی</option>
          <option value="investigating">در حال بررسی / پیگیری</option>
          <option value="resolved">بررسی‌شده و مختومه</option>
        </select>

        {/* Severity */}
        <select 
          value={filterSeverity} 
          onChange={(e) => setFilterSeverity(e.target.value as SecuritySeverity | 'all')}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
        >
          <option value="all">همه سطوح اهمیت</option>
          <option value="critical">بحرانی (Critical)</option>
          <option value="high">بالا (High)</option>
          <option value="medium">متوسط (Medium)</option>
          <option value="low">پایین (Low)</option>
        </select>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-slate-100 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">هیچ گزارش یا لاگی یافت نشد</h3>
            <p className="text-slate-400 text-xs max-w-sm">
              با معیارهای فیلتر یا جستجوی انتخابی، موردی در پایگاه داده ثبت نشده است.
            </p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const config = getEventTypeConfig(log.eventType);
            const isResolved = log.status === 'resolved';

            return (
              <div 
                key={log.id} 
                className={`bg-white rounded-2xl border transition-all ${
                  log.severity === 'critical' ? 'border-red-300 shadow-sm shadow-red-500/10' :
                  log.severity === 'high' ? 'border-orange-200' :
                  'border-slate-200/80 hover:border-slate-300'
                } overflow-hidden`}
              >
                <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-start">
                  
                  <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${config.bg} border ${config.bg.replace('bg-', 'border-')}`}>
                    {config.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSeverityBadge(log.severity)}
                        <span className={`text-xs font-bold ${config.color} ${config.bg} px-2.5 py-0.5 rounded-lg border`}>
                          {config.label}
                        </span>
                        {isResolved ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            بررسی‌شده
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            در حال پیگیری
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1" dir="ltr">
                        <CalendarClock className="w-3.5 h-3.5" />
                        {new Date(log.timestamp).toLocaleString('fa-IR')}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-black text-slate-800 mb-1.5">{log.message}</h4>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs mt-3">
                      {log.userEmail && (
                        <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-mono font-bold">
                          <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.userEmail}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-mono text-[11px]" dir="ltr">
                        <Globe className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-bold">{log.ipAddress || '127.0.0.1'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-[11px]" dir="ltr">
                        <MonitorSmartphone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[200px]" title={log.userAgent}>{log.userAgent || 'مرورگر استاندارد'}</span>
                      </div>

                      {/* Quick action button */}
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setResolutionNoteInput(log.resolutionNote || '');
                        }}
                        className="mr-auto text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        مشاهده کامل و وضعیت
                      </button>
                    </div>

                    {log.details && (
                      <div className="mt-3 bg-slate-900 text-emerald-400 p-3.5 rounded-xl text-xs font-mono overflow-x-auto text-left leading-relaxed border border-slate-800" dir="ltr">
                        <pre className="whitespace-pre-wrap">{log.details}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Log Details & Investigation Modal */}
      {selectedLog && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">جزئیات رویداد امنیتی</h3>
                  <span className="text-[11px] text-slate-400 font-mono" dir="ltr">{selectedLog.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">سطح اهمیت:</span>
                  {getSeverityBadge(selectedLog.severity)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">نوع واقعه:</span>
                  <span className="font-black text-slate-800">{getEventTypeConfig(selectedLog.eventType).label}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">زمان دقیق وقوع:</span>
                  <span className="font-mono font-bold text-slate-700" dir="ltr">{new Date(selectedLog.timestamp).toLocaleString('fa-IR')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">شناسه کاربری / ایمیل / کدملی:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedLog.userEmail || 'ناشناس'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">آدرس آی‌پی (IP Address):</span>
                  <span className="font-mono font-bold text-blue-600" dir="ltr">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">پیام ثبت شده:</span>
                <p className="bg-slate-100/70 p-3 rounded-xl font-bold text-slate-800 leading-relaxed">
                  {selectedLog.message}
                </p>
              </div>

              {selectedLog.details && (
                <div>
                  <span className="text-slate-500 font-bold block mb-1">جزئیات فنی رویداد:</span>
                  <div className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-left leading-relaxed text-xs overflow-x-auto" dir="ltr">
                    <pre className="whitespace-pre-wrap">{selectedLog.details}</pre>
                  </div>
                </div>
              )}

              {/* Status and note updating */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <span className="font-black text-slate-800 block">ثبت یادداشت و بروزرسانی وضعیت ممیزی:</span>
                <textarea
                  rows={2}
                  value={resolutionNoteInput}
                  onChange={e => setResolutionNoteInput(e.target.value)}
                  placeholder="یادداشت کارشناس امنیت (اختیاری)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateLogStatus(selectedLog.id, 'resolved')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    علامت‌گذاری به عنوان حل‌شده
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateLogStatus(selectedLog.id, 'investigating')}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    قرار دادن در حال بررسی
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Security Logs Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClearSecurityLogs}
        title="پاکسازی تمامی رویدادهای امنیتی"
        itemCount={logs.length}
        message="آیا از پاکسازی تمامی لاگ‌های امنیتی اطمینان دارید؟ این عمل به عنوان یک رویداد بحرانی در سیستم ثبت و بایگانی خواهد شد."
        confirmText="بله، پاکسازی و بایگانی شود"
        variant="danger"
      />
    </div>
  );
}
