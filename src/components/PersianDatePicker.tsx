import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Clock, 
  Check,
  CalendarDays
} from 'lucide-react';
import { 
  getTodayJalali, 
  getYesterdayJalali, 
  getDaysInJalaliMonth, 
  getJalaliDayOfWeek, 
  parseJalaliDate, 
  PERSIAN_MONTH_NAMES, 
  PERSIAN_WEEK_DAYS,
  normalizeJalaliDate
} from '../lib/jalaliDateHelper';
import { toPersianDigits, toEnglishDigits } from '../lib/persianNumberHelper';

interface PersianDatePickerProps {
  id?: string;
  value: string;
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
}

export default function PersianDatePicker({
  id = 'persian-date-picker',
  value,
  onChange,
  label,
  placeholder = 'مثلاً: ۱۴۰۳/۰۸/۱۵',
  required = false,
  disabled = false,
  error,
  helperText,
  className = ''
}: PersianDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const today = getTodayJalali();

  // Initialize view year and month based on current value or today
  const parsed = parseJalaliDate(value);
  const [viewYear, setViewYear] = useState<number>(parsed ? parsed.year : today.year);
  const [viewMonth, setViewMonth] = useState<number>(parsed ? parsed.month : today.month);

  useEffect(() => {
    if (value) {
      const p = parseJalaliDate(value);
      if (p) {
        setViewYear(p.year);
        setViewMonth(p.month);
      }
    }
  }, [value]);

  // Handle outside clicks to close popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${viewYear}/${pad(viewMonth)}/${pad(day)}`;
    onChange(toPersianDigits(formatted));
    setIsOpen(false);
  };

  const handleSetToday = () => {
    onChange(today.persianFormatted);
    setViewYear(today.year);
    setViewMonth(today.month);
    setIsOpen(false);
  };

  const handleSetYesterday = () => {
    const y = getYesterdayJalali();
    onChange(y.persianFormatted);
    setViewYear(y.year);
    setViewMonth(y.month);
    setIsOpen(false);
  };

  // Days calculation for current month view
  const daysInMonth = getDaysInJalaliMonth(viewYear, viewMonth);
  const firstDayOfWeek = getJalaliDayOfWeek(viewYear, viewMonth, 1); // 0 = شنبه

  // Candidate years for dropdown (1399 to 1407)
  const years = Array.from({ length: 9 }, (_, i) => 1400 + i);

  // Selected date components
  const selectedParsed = parseJalaliDate(value);

  return (
    <div className={`relative ${className}`} ref={containerRef} dir="rtl">
      {label && (
        <label htmlFor={id} className="block text-xs font-black text-slate-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </span>
          {value && (
            <span className="text-[11px] font-normal text-slate-400">
              {toPersianDigits(value)}
            </span>
          )}
        </label>
      )}

      {/* Input box trigger */}
      <div className="relative flex items-center">
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-white border text-right px-4 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-sm focus:outline-none focus:ring-2 min-h-[48px] ${
            error 
              ? 'border-rose-400 focus:ring-rose-200 text-rose-800' 
              : isOpen 
                ? 'border-blue-500 ring-2 ring-blue-100 text-slate-800' 
                : 'border-slate-200 hover:border-slate-300 text-slate-800'
          } ${disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <CalendarDays className={`w-5 h-5 shrink-0 ${value ? 'text-blue-600' : 'text-slate-400'}`} />
            {value ? (
              <span className="font-black text-slate-800 text-sm tracking-wide">
                {normalizeJalaliDate(value)}
              </span>
            ) : (
              <span className="text-slate-400 font-normal text-xs">
                {placeholder}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="پاک کردن تاریخ"
              >
                <X className="w-4 h-4" />
              </span>
            )}
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-bold shrink-0">
              تقویم
            </span>
          </div>
        </button>
      </div>

      {helperText && !error && (
        <p className="text-[11px] text-slate-500 mt-1 mr-1">{helperText}</p>
      )}
      {error && (
        <p className="text-[11px] text-rose-600 mt-1 mr-1 font-bold">{error}</p>
      )}

      {/* Calendar Popover / Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 sm:p-0 sm:bg-transparent sm:backdrop-blur-none"
        >
          <div 
            className="w-full max-w-[340px] bg-white rounded-3xl shadow-2xl border border-blue-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Month / Year Navigation */}
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="ماه قبل"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5">
                {/* Month Selector */}
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                  className="text-xs font-black text-slate-800 bg-slate-100/80 hover:bg-slate-100 rounded-xl px-2.5 py-1.5 border-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                >
                  {PERSIAN_MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>

                {/* Year Selector */}
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                  className="text-xs font-black text-slate-800 bg-slate-100/80 hover:bg-slate-100 rounded-xl px-2.5 py-1.5 border-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {toPersianDigits(y)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="ماه بعد"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {PERSIAN_WEEK_DAYS.map((wd) => (
                <div 
                  key={wd.short} 
                  className={`text-[11px] font-black py-1 ${
                    wd.index === 6 ? 'text-rose-500' : 'text-slate-400'
                  }`}
                  title={wd.full}
                >
                  {wd.short}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Blank cells for offset */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = 
                  selectedParsed !== null &&
                  selectedParsed.year === viewYear &&
                  selectedParsed.month === viewMonth &&
                  selectedParsed.day === dayNum;

                const isToday = 
                  today.year === viewYear &&
                  today.month === viewMonth &&
                  today.day === dayNum;

                const dayOfWeek = (firstDayOfWeek + i) % 7;
                const isFriday = dayOfWeek === 6;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-9 w-full flex items-center justify-center rounded-xl text-xs font-bold transition-all relative ${
                      isSelected
                        ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/30'
                        : isToday
                          ? 'bg-blue-50 text-blue-700 font-black border border-blue-200'
                          : isFriday
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{toPersianDigits(dayNum)}</span>
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick action buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="px-3 py-1.5 text-xs font-black bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-colors"
                >
                  امروز ({toPersianDigits(today.day)} {today.monthName})
                </button>
                <button
                  type="button"
                  onClick={handleSetYesterday}
                  className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  دیروز
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                title="بستن تقویم"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
