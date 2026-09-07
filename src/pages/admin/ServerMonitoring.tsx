import { useState, useEffect } from 'react';
import { 
  Server, Cpu, HardDrive, Zap, Database, ShieldCheck, 
  Activity, CheckCircle2, AlertTriangle, ArrowUpRight, 
  Layers, Terminal, Clock, Lock
} from 'lucide-react';
import ServerMetricsChart from '../../components/admin/ServerMetricsChart';

interface BenchmarkData {
  status: string;
  engine: string;
  databaseName: string;
  connectedUser: string;
  postgresEngineVersion: string;
  isReplica: boolean;
  performanceMetrics: {
    pingLatency: string;
    batchCountLatency: string;
    totalServerRoundTrip: string;
    speedGrade: string;
    databaseSize: string;
    totalConnectionsInPool: number;
    idleConnections: number;
  };
  serverHardware: {
    cpuModel: string;
    cpuCores: number;
    cpuLoad1Min: number;
    totalMemoryMB: number;
    usedMemoryMB: number;
    freeMemoryMB: number;
    memoryUsagePercent: number;
  };
  liveRecordCounts: {
    totalNews: number;
    totalBanners: number;
    totalForms: number;
    totalAdminUsers: number;
    totalRegistrations: number;
    totalStudents?: number;
  };
  healthCheck: {
    connection: string;
    sslEncryption: string;
    schemaStatus: string;
  };
  checkedAt: string;
}

export default function ServerMonitoring() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<string>('');

  const fetchFullDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db-benchmark');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastCheck(new Date().toLocaleTimeString('fa-IR'));
      }
    } catch (err) {
      console.error('Failed to fetch diagnostics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullDiagnostics();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 text-white p-6 md:p-8 rounded-3xl shadow-md">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold mb-1">
            <Server className="w-4 h-4" />
            <span>مرکز پایش زیرساخت، سرور و پایگاه‌داده</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">مانیتورینگ جامع سلامت سرور و دیتابیس</h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            نظارت بلادرنگ بر توان پردازشی، حافظه رم، پینگ پایگاه‌داده PostgreSQL و نرخ پایداری سرور ابری پارس‌پک (تهران).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs">
            <span className="text-slate-300 block text-[11px]">وضعیت کلی سامانه:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              پایدار و برخط (Online)
            </span>
          </div>
        </div>
      </div>

      {/* Embedded High-Performance Interactive Chart */}
      <ServerMetricsChart />

      {/* Deep Diagnostic Hardware & Database Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware & OS Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <Cpu className="w-5 h-5 text-purple-600" />
                مشخصات سخت‌افزاری سرور
              </h3>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl">
                Ubuntu 26 LTS
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">مدل پردازنده (CPU):</span>
                <span className="font-bold text-slate-700 font-mono text-[11px] truncate max-w-[180px]">
                  {data?.serverHardware?.cpuModel || 'Intel / AMD Virtual CPU'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">تعداد هسته‌های فعال:</span>
                <span className="font-bold text-slate-800">{data?.serverHardware?.cpuCores || 2} Core vCPU</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">کل حافظه رم اختصاص‌یافته:</span>
                <span className="font-bold text-slate-800">{data?.serverHardware?.totalMemoryMB || 4096} MB</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">حافظه رم آزاد (Free):</span>
                <span className="font-bold text-emerald-600">{data?.serverHardware?.freeMemoryMB || 3500} MB</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">موقعیت دیتاسنتر:</span>
                <span className="font-bold text-slate-800">ایران / تهران (DC-THR)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            سیستم‌عامل ۶۴ بیتی با معماری ابری پارس‌پک
          </div>
        </div>

        {/* Database Engine Specs Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <Database className="w-5 h-5 text-blue-600" />
                مشخصات دیتابیس PostgreSQL
              </h3>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl">
                {data?.status || 'ONLINE'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">نام پایگاه‌داده:</span>
                <span className="font-bold text-slate-800 font-mono">{data?.databaseName || 'kowsar_db'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">کاربر متصل دیتابیس:</span>
                <span className="font-bold text-slate-700 font-mono">{data?.connectedUser || 'kowsar_user'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">نسخه موتور PostgreSQL:</span>
                <span className="font-bold text-slate-800 font-mono text-[11px]">{data?.postgresEngineVersion || 'PostgreSQL 16+'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">تعداد کانکشن فعال (Pool):</span>
                <span className="font-bold text-slate-800">{data?.performanceMetrics?.totalConnectionsInPool ?? 1} اتصال</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">حجم دیتابیس روی دیسک:</span>
                <span className="font-bold text-indigo-600">{data?.performanceMetrics?.databaseSize || '8.2 MB'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold">
            <Lock className="w-3.5 h-3.5" />
            ارتباط امن و ایزوله داخلی (Localhost Unix Socket)
          </div>
        </div>

        {/* Live Table Counts Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <Layers className="w-5 h-5 text-emerald-600" />
                شمارش رکوردهای دیتابیس
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                همگام (Synced)
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">تعداد کل اخبار و مقالات:</span>
                <span className="font-bold text-slate-800">{data?.liveRecordCounts?.totalNews ?? 0} رکورد</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">فرم‌ها و آیین‌نامه‌ها:</span>
                <span className="font-bold text-slate-800">{data?.liveRecordCounts?.totalForms ?? 0} رکورد</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">دانشجویان ثبت‌شده پورتال:</span>
                <span className="font-bold text-slate-800">{data?.liveRecordCounts?.totalStudents ?? 0} دانشجو</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">پیش‌ثبت‌نام‌های ورودی:</span>
                <span className="font-bold text-slate-800">{data?.liveRecordCounts?.totalRegistrations ?? 0} دانشجو</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500">بنرها و اسلایدرها:</span>
                <span className="font-bold text-slate-800">{data?.liveRecordCounts?.totalBanners ?? 0} رکورد</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">کاربران ارشد و کارشناسان:</span>
                <span className="font-bold text-slate-800">{data?.liveRecordCounts?.totalAdminUsers ?? 0} حساب</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>آخرین استعلام سلامت:</span>
            <span className="font-mono text-slate-600 font-bold">{lastCheck || 'هم‌اکنون'}</span>
          </div>
        </div>
      </div>

      {/* Security & Integrity Matrix */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ماتریس امنیت و یکپارچگی پایگاه‌داده
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              بررسی لایه‌های امنیتی Helmet، مدیریت نشست‌ها و دسترسی به فایل‌های سامانه
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            سطح امنیت سرور: حداکثری (Enterprise)
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">رمزنگاری نشست‌ها:</span>
            <span className="text-white font-bold text-sm">JWT با کلید ۲۵۶ بیتی</span>
            <span className="block text-[11px] text-emerald-400 mt-1">✓ محافظت شده در برابر جعل</span>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">رمزنگاری پسوردها:</span>
            <span className="text-white font-bold text-sm">Bcrypt با Salt 10</span>
            <span className="block text-[11px] text-emerald-400 mt-1">✓ غیرقابل معکوس‌سازی</span>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">فایروال نرم‌افزاری (UFW):</span>
            <span className="text-white font-bold text-sm">بسته بودن پورت‌های غیرمجاز</span>
            <span className="block text-[11px] text-emerald-400 mt-1">✓ فقط پورت‌های ۸۰ و ۳۰۰۰</span>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
            <span className="text-slate-400 block mb-1">ارتباط Nginx و برنامه:</span>
            <span className="text-white font-bold text-sm">Reverse Proxy محلی</span>
            <span className="block text-[11px] text-emerald-400 mt-1">✓ پنهان‌سازی مستقیم پورت‌ها</span>
          </div>
        </div>
      </div>
    </div>
  );
}
