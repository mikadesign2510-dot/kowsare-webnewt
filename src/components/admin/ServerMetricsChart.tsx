import { useState, useEffect, useCallback, useId } from 'react';
import { 
  Cpu, HardDrive, Zap, RefreshCw, Radio, CheckCircle2, AlertCircle, 
  Server, ShieldCheck, Activity
} from 'lucide-react';

interface MetricPoint {
  time: string;
  memoryPercent: number;
  usedMemoryMB: number;
  totalMemoryMB: number;
  cpuPercent: number;
  cpuLoad: number;
  dbPingMs: number;
}

interface ServerData {
  status: string;
  engine: string;
  databaseName: string;
  performanceMetrics: {
    pingLatency: string;
    pingLatencyMs?: number;
    speedGrade: string;
    databaseSize: string;
    totalConnectionsInPool: number;
  };
  serverHardware: {
    cpuModel: string;
    cpuCores: number;
    cpuLoad1Min: number;
    cpuLoadPercent?: number;
    totalMemoryMB: number;
    usedMemoryMB: number;
    freeMemoryMB: number;
    memoryUsagePercent: number;
  };
  checkedAt: string;
}

export default function ServerMetricsChart() {
  const [history, setHistory] = useState<MetricPoint[]>([]);
  const [currentData, setCurrentData] = useState<ServerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'memory' | 'cpu' | 'db'>('all');
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gradientId = useId();

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/db-benchmark');
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات سرور');
      const data: ServerData = await res.json();
      setCurrentData(data);
      setError(null);

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const memPercent = data.serverHardware.memoryUsagePercent || 0;
      const cpuPercent = data.serverHardware.cpuLoadPercent || 
        Math.min(100, Math.max(1, Math.round((data.serverHardware.cpuLoad1Min / Math.max(1, data.serverHardware.cpuCores)) * 100)));
      
      const pingMs = typeof data.performanceMetrics.pingLatencyMs === 'number' 
        ? data.performanceMetrics.pingLatencyMs 
        : parseFloat(data.performanceMetrics.pingLatency) || 1;

      const newPoint: MetricPoint = {
        time: timeStr,
        memoryPercent: memPercent,
        usedMemoryMB: data.serverHardware.usedMemoryMB || 0,
        totalMemoryMB: data.serverHardware.totalMemoryMB || 4096,
        cpuPercent: cpuPercent,
        cpuLoad: data.serverHardware.cpuLoad1Min || 0,
        dbPingMs: pingMs,
      };

      setHistory(prev => {
        const updated = [...prev, newPoint];
        if (updated.length > 15) {
          return updated.slice(updated.length - 15);
        }
        return updated;
      });
    } catch (err: any) {
      setError(err?.message || 'عدم دسترسی به سرویس بنچمارک سرور');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      fetchMetrics();
    }, 3500);
    return () => clearInterval(interval);
  }, [isLive, fetchMetrics]);

  const memPercent = currentData?.serverHardware?.memoryUsagePercent ?? 0;
  const cpuLoad = currentData?.serverHardware?.cpuLoad1Min ?? 0;
  const cpuPercent = currentData?.serverHardware?.cpuLoadPercent ?? 
    Math.min(100, Math.max(1, Math.round((cpuLoad / Math.max(1, currentData?.serverHardware?.cpuCores || 2)) * 100)));
  const pingLatency = currentData?.performanceMetrics?.pingLatency ?? 'در حال بررسی...';

  // Generate SVG Path for Areas and Lines
  const width = 800;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const pointsCount = Math.max(1, history.length);
  const getX = (index: number) => paddingX + (index / Math.max(1, pointsCount - 1)) * chartW;
  
  const getY = (val: number, max: number = 100) => {
    const safeVal = Math.min(max, Math.max(0, val));
    return paddingY + chartH - (safeVal / max) * chartH;
  };

  const createAreaPath = (getter: (p: MetricPoint) => number, maxVal = 100) => {
    if (history.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(history.length - 1);
    const bottomY = paddingY + chartH;
    
    let path = `M ${firstX},${bottomY}`;
    history.forEach((p, i) => {
      const x = getX(i);
      const y = getY(getter(p), maxVal);
      path += ` L ${x},${y}`;
    });
    path += ` L ${lastX},${bottomY} Z`;
    return path;
  };

  const createLinePath = (getter: (p: MetricPoint) => number, maxVal = 100) => {
    if (history.length === 0) return '';
    return history.reduce((acc, p, i) => {
      const x = getX(i);
      const y = getY(getter(p), maxVal);
      return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, '');
  };

  const activeHoveredPoint = hoveredIndex !== null && history[hoveredIndex] ? history[hoveredIndex] : history[history.length - 1];

  return (
    <div id="server-metrics-dashboard-widget" className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                مانیتورینگ زنده منابع سرور و پایگاه‌داده
                {isLive && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    زنده (Live)
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                نمایش لحظه‌ای مصرف رم، بار پردازنده (CPU) و پینگ دیتابیس PostgreSQL
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            id="toggle-live-polling-btn"
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isLive 
                ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLive ? 'animate-spin' : ''}`} />
            {isLive ? 'پایش خودکار فعال' : 'پایش متوقف'}
          </button>

          <button
            id="manual-refresh-metrics-btn"
            onClick={() => {
              setIsLoading(true);
              fetchMetrics();
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Status Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Card 1: Memory */}
        <div 
          id="stat-memory-card"
          onClick={() => setActiveTab('memory')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === 'memory' 
              ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-100' 
              : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-blue-600" />
              حافظه رم (RAM)
            </span>
            <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg">
              {memPercent}%
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-800">
              {currentData?.serverHardware?.usedMemoryMB || 0}
              <span className="text-xs font-normal text-slate-400 mr-1">MB</span>
            </span>
            <span className="text-xs text-slate-400">
              از {currentData?.serverHardware?.totalMemoryMB || 4096} MB
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                memPercent > 85 ? 'bg-red-500' : memPercent > 65 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, memPercent))}%` }}
            />
          </div>
        </div>

        {/* Card 2: CPU Load */}
        <div 
          id="stat-cpu-card"
          onClick={() => setActiveTab('cpu')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === 'cpu' 
              ? 'bg-purple-50/50 border-purple-300 ring-2 ring-purple-100' 
              : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-600" />
              بار پردازنده (CPU)
            </span>
            <span className="text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-lg">
              {cpuPercent}%
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-800">
              {cpuLoad}
              <span className="text-xs font-normal text-slate-400 mr-1">Load</span>
            </span>
            <span className="text-xs text-slate-400">
              {currentData?.serverHardware?.cpuCores || 2} هسته فعال
            </span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                cpuPercent > 80 ? 'bg-red-500' : cpuPercent > 50 ? 'bg-amber-500' : 'bg-purple-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, cpuPercent))}%` }}
            />
          </div>
        </div>

        {/* Card 3: Database Latency */}
        <div 
          id="stat-db-card"
          onClick={() => setActiveTab('db')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeTab === 'db' 
              ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-100' 
              : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              پینگ دیتابیس
            </span>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
              {currentData?.performanceMetrics?.speedGrade || 'A+'}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-800">
              {pingLatency}
            </span>
            <span className="text-xs text-slate-400">
              اتصال محلی Local
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-2 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            پاسخ‌دهی زیر ۱ ثانیه
          </div>
        </div>

        {/* Card 4: Engine Status */}
        <div 
          id="stat-engine-card"
          className="p-4 rounded-2xl border bg-slate-50/60 border-slate-100"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-slate-600" />
              نوع سرور و استقرار
            </span>
            <span className="text-xs font-black text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-lg">
              Ubuntu
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 truncate mt-1">
            {currentData?.engine || 'PostgreSQL اختصاصی سرور کوثر'}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            دیتابیس: {currentData?.databaseName || 'kowsar_db'}
          </div>
        </div>
      </div>

      {/* Chart View Tabs */}
      <div className="flex items-center gap-2 mt-8 mb-4">
        <button
          id="chart-tab-all"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          نمودار جامع منابع (RAM + CPU)
        </button>
        <button
          id="chart-tab-memory"
          onClick={() => setActiveTab('memory')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'memory' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          حافظه رم (RAM %)
        </button>
        <button
          id="chart-tab-cpu"
          onClick={() => setActiveTab('cpu')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'cpu' 
              ? 'bg-purple-600 text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          بار پردازنده (CPU %)
        </button>
        <button
          id="chart-tab-db"
          onClick={() => setActiveTab('db')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'db' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          تأخیر دیتابیس (Latency ms)
        </button>
      </div>

      {/* Main Real-time Chart (Native High Performance SVG) */}
      <div className="relative w-full pt-4 bg-slate-50/50 rounded-2xl border border-slate-100/80 p-4">
        {history.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            <span className="text-xs font-bold">در حال جمع‌آوری متریک‌های اولیه سرور...</span>
          </div>
        ) : (
          <div className="w-full">
            <div className="relative w-full h-64 sm:h-72">
              <svg 
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id={`gradMemory-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id={`gradCpu-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9333ea" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id={`gradDb-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 25, 50, 75, 100].map((level) => {
                  const y = getY(level, 100);
                  return (
                    <g key={level}>
                      <line 
                        x1={paddingX} 
                        y1={y} 
                        x2={width - paddingX} 
                        y2={y} 
                        stroke="#e2e8f0" 
                        strokeDasharray="4 4" 
                        strokeWidth="1"
                      />
                      <text 
                        x={paddingX - 8} 
                        y={y + 3} 
                        fill="#94a3b8" 
                        fontSize="10" 
                        textAnchor="end"
                      >
                        {level}{activeTab === 'db' ? 'ms' : '%'}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Time Labels */}
                {history.map((p, i) => {
                  if (i % 3 === 0 || i === history.length - 1) {
                    const x = getX(i);
                    return (
                      <text 
                        key={i} 
                        x={x} 
                        y={height - 8} 
                        fill="#94a3b8" 
                        fontSize="10" 
                        textAnchor="middle"
                      >
                        {p.time}
                      </text>
                    );
                  }
                  return null;
                })}

                {/* Memory Area & Line */}
                {(activeTab === 'all' || activeTab === 'memory') && (
                  <>
                    <path d={createAreaPath(p => p.memoryPercent)} fill={`url(#gradMemory-${gradientId})`} />
                    <path d={createLinePath(p => p.memoryPercent)} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}

                {/* CPU Area & Line */}
                {(activeTab === 'all' || activeTab === 'cpu') && (
                  <>
                    <path d={createAreaPath(p => p.cpuPercent)} fill={`url(#gradCpu-${gradientId})`} />
                    <path d={createLinePath(p => p.cpuPercent)} fill="none" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}

                {/* DB Latency Area & Line */}
                {activeTab === 'db' && (
                  <>
                    <path d={createAreaPath(p => p.dbPingMs, 50)} fill={`url(#gradDb-${gradientId})`} />
                    <path d={createLinePath(p => p.dbPingMs, 50)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}

                {/* Interactive Points on hover */}
                {history.map((p, i) => {
                  const x = getX(i);
                  return (
                    <g 
                      key={i} 
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <rect 
                        x={x - chartW / (pointsCount * 2)} 
                        y={paddingY} 
                        width={chartW / pointsCount} 
                        height={chartH} 
                        fill="transparent" 
                      />
                      {hoveredIndex === i && (
                        <line 
                          x1={x} 
                          y1={paddingY} 
                          x2={x} 
                          y2={paddingY + chartH} 
                          stroke="#64748b" 
                          strokeDasharray="2 2" 
                          strokeWidth="1.5" 
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hovered / Current Realtime Info Box */}
            {activeHoveredPoint && (
              <div className="mt-3 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs flex flex-wrap items-center justify-between gap-4 shadow-md">
                <span className="font-mono text-slate-300">
                  زمان نمونه: {activeHoveredPoint.time}
                </span>
                <div className="flex items-center gap-4">
                  {(activeTab === 'all' || activeTab === 'memory') && (
                    <span className="text-blue-300 font-bold">
                      رم: {activeHoveredPoint.memoryPercent}% ({activeHoveredPoint.usedMemoryMB} MB)
                    </span>
                  )}
                  {(activeTab === 'all' || activeTab === 'cpu') && (
                    <span className="text-purple-300 font-bold">
                      پردازنده: {activeHoveredPoint.cpuPercent}% (Load: {activeHoveredPoint.cpuLoad})
                    </span>
                  )}
                  {activeTab === 'db' && (
                    <span className="text-emerald-300 font-bold">
                      پینگ دیتابیس: {activeHoveredPoint.dbPingMs} ms
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Footer Legend & Specs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            حافظه رم ({memPercent}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
            پردازنده ({cpuPercent}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            پینگ ({pingLatency})
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          مدل سی‌پی‌یو: {currentData?.serverHardware?.cpuModel || 'Intel / AMD Cloud Server'}
        </div>
      </div>
    </div>
  );
}

