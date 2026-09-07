import React, { useState } from 'react';
import { 
  PinnedNewsSliderConfig, defaultPinnedSliderConfig, 
  PinnedSliderTemplate, PinnedSliderHeight, PinnedSliderAccent, 
  NewsItem, storage 
} from '../../lib/storage';
import PinnedNewsSlider from '../PinnedNewsSlider';
import { 
  Pin, Sparkles, Check, RefreshCw, Layout, Sliders, 
  Palette, Eye, Clock, Image as ImageIcon, Save, AlertCircle,
  Maximize2, Play, ToggleLeft, ToggleRight
} from 'lucide-react';

interface PinnedSliderSettingsEditorProps {
  currentConfig?: PinnedNewsSliderConfig;
  newsItems: NewsItem[];
  onSave: (newConfig: PinnedNewsSliderConfig) => void;
}

export default function PinnedSliderSettingsEditor({
  currentConfig,
  newsItems,
  onSave
}: PinnedSliderSettingsEditorProps) {
  const [config, setConfig] = useState<PinnedNewsSliderConfig>({
    ...defaultPinnedSliderConfig,
    ...(currentConfig || {})
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const sampleItems = newsItems.filter(n => n.isPinned).length > 0 
    ? newsItems.filter(n => n.isPinned)
    : newsItems.slice(0, 3);

  const handleUpdate = <K extends keyof PinnedNewsSliderConfig>(key: K, value: PinnedNewsSliderConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSavedSuccess(false);
  };

  const handleSave = () => {
    onSave(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('آیا مایل به بازگردانی تنظیمات به حالت اولیه هستید؟')) {
      setConfig({ ...defaultPinnedSliderConfig });
      onSave({ ...defaultPinnedSliderConfig });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Ready-made templates description
  const templates: {
    id: PinnedSliderTemplate;
    title: string;
    description: string;
    badge: string;
    icon: string;
  }[] = [
    {
      id: 'split',
      title: 'قالب مدرن دوتکه (اسپلیت)',
      description: 'تصویر اختصاصی در یک ستون و محتوای متنی در ستون دیگر، بسیار خوانا، جمع‌وجور و بدون تداخل عکس با نوشته.',
      badge: 'پیشنهادی و محبوب',
      icon: 'Columns'
    },
    {
      id: 'cinematic',
      title: 'قالب سینمایی فشرده (اورلی)',
      description: 'تصویر تمام‌عرض در پس‌زمینه همراه با لایه‌های گرادیانت تیره جهت جلوه درخشان و متن در پایین کادر.',
      badge: 'جذاب و پرانرژی',
      icon: 'Tv'
    },
    {
      id: 'card',
      title: 'قالب کارتی فلت دانشگاهی',
      description: 'طراحی رسمی و استاندارد دانشگاهی با کادربندی روشن و خطوط مینیمال، متناسب با فضاهای آموزشی.',
      badge: 'رسمی و آکادمیک',
      icon: 'CreditCard'
    },
    {
      id: 'banner',
      title: 'قالب بنر گرادیانتی با جلوه نوری',
      description: 'کادر سرمه‌ای-نیلی تیره با کادر اختصاصی تصویر و هاله‌های رنگی شیک.',
      badge: 'مدرن و متمایز',
      icon: 'Sparkles'
    }
  ];

  const colorPalettes: { id: PinnedSliderAccent; label: string; bg: string; ring: string }[] = [
    { id: 'amber', label: 'طلایی لوکس', bg: 'bg-gradient-to-r from-amber-400 to-amber-600', ring: 'ring-amber-500' },
    { id: 'blue', label: 'آبی سلطنتی دانشگاهی', bg: 'bg-gradient-to-r from-blue-500 to-indigo-600', ring: 'ring-blue-500' },
    { id: 'emerald', label: 'زمردی آرامش‌بخش', bg: 'bg-gradient-to-r from-emerald-500 to-teal-600', ring: 'ring-emerald-500' },
    { id: 'purple', label: 'بنفش مدرن', bg: 'bg-gradient-to-r from-violet-500 to-purple-600', ring: 'ring-violet-500' },
    { id: 'rose', label: 'یاقوتی گرم', bg: 'bg-gradient-to-r from-rose-500 to-pink-600', ring: 'ring-rose-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Action Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Pin className="w-5 h-5 fill-amber-600 text-amber-600" />
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
              شخصی‌سازی و قالب‌های باکس اخبار ویژه
            </h2>
          </div>
          <p className="text-sm text-slate-500 font-light">
            کنترل کامل ظاهر، قالب آماده، ارتفاع، موقعیت تصویر، رنگ‌ها و تعویض خودکار باکس اخبار ویژه بالای صفحه اخبار
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تنظیمات اولیه</span>
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره کلیه تنظیمات</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>تنظیمات و قالب باکس اخبار ویژه با موفقیت ذخیره و در سایت اعمال شد.</span>
        </div>
      )}

      {/* Live Preview Box */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-7 md:p-8 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Eye className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">پیش‌نمایش زنده باکس اخبار ویژه</h3>
            <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full border border-white/10">
              قالب فعلی: {templates.find(t => t.id === config.template)?.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => handleUpdate('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="mr-2 text-xs font-bold text-slate-300">
                {config.enabled ? 'فعال در صفحه اخبار' : 'غیرفعال'}
              </span>
            </label>
          </div>
        </div>

        <div className="pt-2">
          {sampleItems.length > 0 ? (
            <PinnedNewsSlider items={sampleItems} config={config} />
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm border border-dashed border-slate-700 rounded-2xl">
              هنوز خبری سنجاق نشده است. برای نمایش محتوای واقعی، در تب مدیریت اخبار گزینه «سنجاق به بالای صفحه» را برای اخبار مهم فعال کنید.
            </div>
          )}
        </div>
      </div>

      {/* Templates Selector Grid */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Layout className="w-5 h-5 text-blue-600" />
            <span>انتخاب قالب‌های آماده باکس خبری</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-light mt-1">
            قالب دلخواه خود را برای نمایش خبرهای ویژه انتخاب نمایید. چیدمان المان‌ها متناسب با انتخاب شما تغییر خواهد کرد.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(tpl => {
            const isSelected = config.template === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleUpdate('template', tpl.id)}
                className={`p-5 rounded-2xl text-right border transition-all duration-200 flex flex-col justify-between relative group ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3 w-full mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="font-black text-slate-800 text-sm md:text-base">
                      {tpl.title}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tpl.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-light">
                  {tpl.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Customization & Dimensions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dimensions & Image Focus */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <span>اندازه، ارتفاع و تمرکز تصویر</span>
          </h3>

          {/* Badge Label Text */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              متن نشان شاخص (بج)
            </label>
            <input
              type="text"
              value={config.badgeTitle}
              onChange={(e) => handleUpdate('badgeTitle', e.target.value)}
              placeholder="اخبار ویژه"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">پیش‌فرض: «اخبار ویژه»</p>
          </div>

          {/* Height Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ارتفاع کل باکس
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'compact', label: 'فشرده و جمع‌وجور', desc: 'کوچک و شیک (پیشنهادی)' },
                { id: 'medium', label: 'متوسط', desc: 'اندازه استاندارد' },
                { id: 'tall', label: 'کشیده و بزرگ', desc: 'نمای درشت' },
              ].map(h => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleUpdate('height', h.id as PinnedSliderHeight)}
                  className={`p-3 rounded-xl text-center border text-xs font-bold transition-all ${
                    config.height === h.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>{h.label}</div>
                  <div className={`text-[10px] mt-0.5 font-normal ${config.height === h.id ? 'text-blue-100' : 'text-slate-400'}`}>
                    {h.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Image Position */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              موقعیت و کادربندی تصویر
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'center', label: 'مرکز تصویر' },
                { id: 'top', label: 'بالای تصویر (چهره‌ها)' },
                { id: 'bottom', label: 'پایین تصویر' },
              ].map(pos => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => handleUpdate('imagePosition', pos.id as any)}
                  className={`py-2 px-3 rounded-xl text-center border text-xs font-bold transition-all ${
                    config.imagePosition === pos.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rounded Corners */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              میزان گردی گوشه‌های کادر
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'معمولی (16px)' },
                { id: 'large', label: 'بزرگ (28px)' },
                { id: 'full', label: 'حداکثری (36px)' },
              ].map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleUpdate('roundedCorners', r.id as any)}
                  className={`py-2 px-3 rounded-xl text-center border text-xs font-bold transition-all ${
                    config.roundedCorners === r.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accent Colors & Controls */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Palette className="w-4 h-4 text-blue-600" />
            <span>رنگ‌بندی، چرخش خودکار و کلیدها</span>
          </h3>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              رنگ تم نشان و هایلایت‌های اسلایدر
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {colorPalettes.map(c => {
                const isSelected = config.accentColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleUpdate('accentColor', c.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                      isSelected ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/20' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${c.bg} shrink-0`} />
                    <span className="truncate text-slate-800">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-play Timer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>زمان تعویض خودکار اسلایدها</span>
              <span className="text-blue-600 font-mono">
                {config.autoPlayInterval === 0 ? 'غیرفعال' : `${config.autoPlayInterval / 1000} ثانیه`}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 0, label: 'خاموش' },
                { val: 4000, label: '۴ ثانیه' },
                { val: 6000, label: '۶ ثانیه' },
                { val: 9000, label: '۹ ثانیه' },
              ].map(timer => (
                <button
                  key={timer.val}
                  type="button"
                  onClick={() => handleUpdate('autoPlayInterval', timer.val)}
                  className={`py-2 px-2 rounded-xl text-center border text-xs font-bold transition-all ${
                    config.autoPlayInterval === timer.val
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {timer.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <span className="text-xs font-bold text-slate-700">نمایش خلاصه متن خبر</span>
              <input
                type="checkbox"
                checked={config.showSummary}
                onChange={(e) => handleUpdate('showSummary', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <span className="text-xs font-bold text-slate-700">نمایش متادیتا (تاریخ و بازدید)</span>
              <input
                type="checkbox"
                checked={config.showMeta}
                onChange={(e) => handleUpdate('showMeta', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <span className="text-xs font-bold text-slate-700">نمایش کلیدهای فلش بعدی و قبلی</span>
              <input
                type="checkbox"
                checked={config.showControls}
                onChange={(e) => handleUpdate('showControls', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <span className="text-xs font-bold text-slate-700">نمایش تب‌های سریع در پایین اسلایدر</span>
              <input
                type="checkbox"
                checked={config.showBottomTabs}
                onChange={(e) => handleUpdate('showBottomTabs', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Bottom Floating/Sticky Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={handleSave}
          className="px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>ذخیره تغییرات قالب و شخصی‌سازی باکس اخبار ویژه</span>
        </button>
      </div>
    </div>
  );
}
