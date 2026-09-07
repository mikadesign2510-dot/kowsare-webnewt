import React from 'react';
import { Check, Sparkles, Wand2, Star } from 'lucide-react';

export interface PamphletHighlightPreset {
  id: string;
  name: string;
  dotClass: string;
  cardBg: string;
  cardBorder: string;
  topBarClass: string;
  hoverBorder: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  teacherText: string;
  accentHex: string;
  buttonClass?: string;
}

export const PAMPHLET_HIGHLIGHT_PRESETS: PamphletHighlightPreset[] = [
  {
    id: 'indigo',
    name: 'هایلایت نیلی (کامپیوتر و IT)',
    dotClass: 'bg-indigo-600',
    cardBg: 'bg-gradient-to-b from-indigo-50/70 via-white to-white',
    cardBorder: 'border-indigo-100/90',
    topBarClass: 'border-t-[3.5px] border-t-indigo-500',
    hoverBorder: 'hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200/80',
    teacherText: 'text-indigo-700',
    accentHex: '#6366f1',
    buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
  },
  {
    id: 'emerald',
    name: 'هایلایت زمردی (حسابداری و مالی)',
    dotClass: 'bg-emerald-600',
    cardBg: 'bg-gradient-to-b from-emerald-50/70 via-white to-white',
    cardBorder: 'border-emerald-100/90',
    topBarClass: 'border-t-[3.5px] border-t-emerald-500',
    hoverBorder: 'hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200/80',
    teacherText: 'text-emerald-700',
    accentHex: '#10b981',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
  },
  {
    id: 'amber',
    name: 'هایلایت کهربایی (حقوق و علوم قضایی)',
    dotClass: 'bg-amber-600',
    cardBg: 'bg-gradient-to-b from-amber-50/70 via-white to-white',
    cardBorder: 'border-amber-100/90',
    topBarClass: 'border-t-[3.5px] border-t-amber-500',
    hoverBorder: 'hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-200/80',
    teacherText: 'text-amber-800',
    accentHex: '#f59e0b',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
  },
  {
    id: 'purple',
    name: 'هایلایت بنفش (گرافیک و طراحی دوخت)',
    dotClass: 'bg-purple-600',
    cardBg: 'bg-gradient-to-b from-purple-50/70 via-white to-white',
    cardBorder: 'border-purple-100/90',
    topBarClass: 'border-t-[3.5px] border-t-purple-500',
    hoverBorder: 'hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200/80',
    teacherText: 'text-purple-700',
    accentHex: '#a855f7',
    buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
  },
  {
    id: 'rose',
    name: 'هایلایت رز و یاقوتی (معماری و هنر)',
    dotClass: 'bg-rose-600',
    cardBg: 'bg-gradient-to-b from-rose-50/70 via-white to-white',
    cardBorder: 'border-rose-100/90',
    topBarClass: 'border-t-[3.5px] border-t-rose-500',
    hoverBorder: 'hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/10',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200/80',
    teacherText: 'text-rose-700',
    accentHex: '#f43f5e',
    buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
  },
  {
    id: 'cyan',
    name: 'هایلایت فیروزه‌ای (مهندسی و صنایع)',
    dotClass: 'bg-cyan-600',
    cardBg: 'bg-gradient-to-b from-cyan-50/70 via-white to-white',
    cardBorder: 'border-cyan-100/90',
    topBarClass: 'border-t-[3.5px] border-t-cyan-500',
    hoverBorder: 'hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/10',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-200/80',
    teacherText: 'text-cyan-700',
    accentHex: '#06b6d4',
    buttonClass: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-500/20'
  },
  {
    id: 'blue',
    name: 'هایلایت آبی اقیانوسی (مدیریت و زبان)',
    dotClass: 'bg-blue-600',
    cardBg: 'bg-gradient-to-b from-blue-50/70 via-white to-white',
    cardBorder: 'border-blue-100/90',
    topBarClass: 'border-t-[3.5px] border-t-blue-500',
    hoverBorder: 'hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200/80',
    teacherText: 'text-blue-700',
    accentHex: '#3b82f6',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
  },
  {
    id: 'slate',
    name: 'هایلایت نقره‌ای (دروس عمومی و پایه)',
    dotClass: 'bg-slate-600',
    cardBg: 'bg-gradient-to-b from-slate-50/70 via-white to-white',
    cardBorder: 'border-slate-200/90',
    topBarClass: 'border-t-[3.5px] border-t-slate-500',
    hoverBorder: 'hover:border-slate-400 hover:shadow-xl hover:shadow-slate-400/10',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
    teacherText: 'text-slate-700',
    accentHex: '#64748b',
    buttonClass: 'bg-slate-700 hover:bg-slate-800 text-white shadow-slate-600/20'
  },
];

/**
 * نشانگر برجسته و شیک برای جزوات منتخب
 */
export function FeaturedPamphletBadge({ isPinned, className = '' }: { isPinned?: boolean; className?: string }) {
  if (!isPinned) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-white shadow-sm shadow-amber-500/30 ring-1 ring-amber-300/50 ${className}`}>
      <Sparkles className="w-3.5 h-3.5 text-amber-100 shrink-0" />
      <span>جزوه منتخب</span>
    </span>
  );
}

/**
 * نشانگر برجسته بالای کارت برای تمایز چشم‌نواز جزوات منتخب (بدون بریدگی و تداخل)
 */
export function PinnedCornerRibbon({ isPinned, className = '' }: { isPinned?: boolean; className?: string }) {
  if (!isPinned) return null;
  return (
    <div className={`-mt-6 -mx-6 mb-4 px-5 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-white rounded-t-[22px] flex items-center justify-between text-xs font-black shadow-xs ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5 fill-amber-100 text-amber-100 shrink-0" />
        <span>جزوه منتخب</span>
      </span>
      <span className="text-[10px] text-amber-100 font-bold bg-black/10 px-2 py-0.5 rounded-full">
        برگزیده ویژه ترم
      </span>
    </div>
  );
}

/**
 * Automatically maps any field of study name to an appropriate highlight color preset.
 */
export function getDefaultColorForField(fieldOfStudy?: string): string {
  if (!fieldOfStudy) return 'indigo';
  const f = fieldOfStudy.trim().toLowerCase();

  // کامپیوتر، فناوری اطلاعات، نرم‌افزار، شبکه، وب، هوش مصنوعی
  if (/کامپیوتر|نرم\s*افزار|فناوری اطلاعات|سخت\s*افزار|شبکه|برنامه‌نویسی|داده|هوش مصنوعی|\bit\b|ict|وب/i.test(f)) {
    return 'indigo';
  }

  // حسابداری، مدیریت مالی، امور مالی، بانکداری، بورس
  if (/حسابداری|مالی|بانک|بورس|اقتصاد|بازرگانی/i.test(f)) {
    return 'emerald';
  }

  // حقوق، علوم قضایی، امور ثبتی، وکالت، دادگستری
  if (/حقوق|قضا|ثبت|وکالت|دادرسی|شورا/i.test(f)) {
    return 'amber';
  }

  // گرافیک، طراحی لباس، دوخت، انیمیشن، نقاشی، عکاسی
  if (/گرافیک|دوخت|لباس|انیمیشن|عکاسی|نقاشی|طراحی لباس|چاپ/i.test(f)) {
    return 'purple';
  }

  // معماری، نقشه‌کشی، شهرسازی، دکوراسیون، ساختمان، عمران
  if (/معماری|نقشه‌کشی|ساختمان|عمران|شهرسازی|دکوراسیون/i.test(f)) {
    return 'rose';
  }

  // مکانیک، برق، الکترونیک، مکاترونیک، صنایع، تاسیسات، خودرو
  if (/مکانیک|برق|الکترونیک|صنایع|تاسیسات|خودرو|مکاترونیک|ابزار/i.test(f)) {
    return 'cyan';
  }

  // مدیریت، روابط عمومی، بازاریابی، امور اداری، زبان، مترجمی
  if (/مدیریت|روابط عمومی|کسب‌وکار|کسب و کار|اداری|زبان|مترجمی|انگلیسی/i.test(f)) {
    return 'blue';
  }

  // دروس عمومی، معارف، اخلاق، فارسی، تربیت بدنی
  if (/عمومی|معارف|اخلاق|اندیشه|انقلاب|فارسی|تربیت بدنی|ورزش/i.test(f)) {
    return 'slate';
  }

  return 'indigo';
}

export function getPamphletHighlight(colorId?: string, fieldOfStudy?: string): PamphletHighlightPreset {
  if (colorId) {
    const found = PAMPHLET_HIGHLIGHT_PRESETS.find(p => p.id === colorId);
    if (found) return found;
  }
  
  // If no explicit colorId is set, determine default from fieldOfStudy
  const autoColor = getDefaultColorForField(fieldOfStudy);
  const matched = PAMPHLET_HIGHLIGHT_PRESETS.find(p => p.id === autoColor);
  return matched || PAMPHLET_HIGHLIGHT_PRESETS[0];
}

interface PamphletHighlightPickerProps {
  selectedColor?: string;
  fieldOfStudy?: string;
  onColorChange: (color: string) => void;
}

export function PamphletHighlightPicker({ selectedColor, fieldOfStudy, onColorChange }: PamphletHighlightPickerProps) {
  const defaultColor = getDefaultColorForField(fieldOfStudy);
  const effectiveColor = selectedColor || defaultColor;
  const current = getPamphletHighlight(effectiveColor, fieldOfStudy);
  const defaultPreset = getPamphletHighlight(defaultColor);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-black text-slate-800">
            رنگ هایلایت کارت جزوه
          </label>
          <p className="text-[11px] text-slate-500 font-normal">
            رنگ کارت بر اساس رشته تحصیلی به‌صورت خودکار تعیین می‌شود؛ در صورت تمایل می‌توانید آن را تغییر دهید.
          </p>
        </div>

        {fieldOfStudy && selectedColor && selectedColor !== defaultColor && (
          <button
            type="button"
            onClick={() => onColorChange(defaultColor)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 self-start sm:self-auto"
          >
            <Wand2 className="w-3 h-3" />
            <span>بازگشت به رنگ پیش‌فرض رشته ({defaultPreset.name.split(' (')[0].replace('هایلایت ', '')})</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {PAMPHLET_HIGHLIGHT_PRESETS.map((preset) => {
          const isSelected = effectiveColor === preset.id;
          const isAutoDefault = defaultColor === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onColorChange(preset.id)}
              className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer text-center relative ${
                isSelected 
                  ? 'border-indigo-600 bg-white shadow-md ring-2 ring-indigo-500/25' 
                  : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
              }`}
            >
              {isAutoDefault && (
                <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                  پیش‌فرض
                </span>
              )}
              <div className={`w-7 h-7 rounded-xl ${preset.dotClass} flex items-center justify-center text-white shadow-sm`}>
                {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
              <span className="text-[10px] font-bold text-slate-700 truncate max-w-full">
                {preset.name.split(' (')[0].replace('هایلایت ', '')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

