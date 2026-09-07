import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ChevronRight, ChevronLeft, ArrowLeft,
  Compass, Eye, Play, Pause, Layers
} from 'lucide-react';
import { storage, type PresentationSection as PresentationSectionType, defaultPresentationSections } from '../lib/storage';

export default function PresentationSection() {
  const [sections, setSections] = useState<PresentationSectionType[]>(() => {
    const data = storage.getPresentationSections().filter(s => s.isVisible);
    return data.length > 0 ? data.sort((a, b) => a.order - b.order) : defaultPresentationSections;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    const handleUpdate = () => {
      const data = storage.getPresentationSections().filter(s => s.isVisible);
      if (data.length > 0) {
        setSections(data.sort((a, b) => a.order - b.order));
      } else {
        setSections(defaultPresentationSections);
      }
    };

    window.addEventListener('kowsar_presentation_changed', handleUpdate);
    storage.syncPresentationWithDB().then(dbData => {
      if (dbData && dbData.length > 0) {
        const visible = dbData.filter(s => s.isVisible);
        if (visible.length > 0) {
          setSections(visible.sort((a, b) => a.order - b.order));
        }
      }
    });

    return () => {
      window.removeEventListener('kowsar_presentation_changed', handleUpdate);
    };
  }, []);

  // Reset index if out of bounds
  useEffect(() => {
    if (currentIndex >= sections.length) {
      setCurrentIndex(0);
    }
  }, [sections.length, currentIndex]);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlay || sections.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % sections.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlay, sections.length]);

  if (sections.length === 0) return null;

  const currentSection = sections[currentIndex] || sections[0];

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % sections.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + sections.length) % sections.length);
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-800/80 pb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-black px-3.5 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>معرفی و شناخت مرکز آموزش علمی کاربردی</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              آشنایی با پتانسیل‌ها و امکانات مرکز کوثر کاکی
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              مرکز آموزش علمی کاربردی کوثر کاکی با رویکرد آموزش مهارت‌محور، ارتباط مستقیم با صنعت و فضای آموزشی استاندارد
            </p>
          </div>

          {/* Action to full 3D Presentation */}
          <div className="flex items-center gap-3">
            <Link
              to="/presentation"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>تجربه تعاملی و ۳ بعدی کامل</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Slide Showcase Main Container */}
        <div 
          className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden"
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
        >
          {/* Slide Navigation Tabs (Top Pill Bar) */}
          <div className="flex items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-700/50 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {sections.map((sec, idx) => (
                <button
                  key={sec.id || idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    currentIndex === idx
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
                  }`}
                >
                  <span className="w-5 h-5 rounded-lg bg-black/20 flex items-center justify-center text-[10px] font-black">
                    {idx + 1}
                  </span>
                  <span>{sec.title}</span>
                </button>
              ))}
            </div>

            {/* Controls: Prev / Pause / Next */}
            <div className="flex items-center gap-2 mr-auto">
              <button
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                title={isAutoPlay ? 'توقف خودکار' : 'پخش خودکار'}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handlePrev}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="اسلاید قبلی"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 font-bold px-1">
                {currentIndex + 1} / {sections.length}
              </span>
              <button
                onClick={handleNext}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="اسلاید بعدی"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Slide Body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection.id || currentIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 ${
                currentSection.verticalAlign === 'start' ? 'items-start' : 'items-center'
              }`}
            >
              {/* Text & Details Column */}
              <div className={`space-y-5 ${
                currentSection.imagePosition === 'top'
                  ? 'col-span-12 order-2'
                  : (currentSection.contentRatio === 'text-heavy'
                      ? 'lg:col-span-7'
                      : currentSection.contentRatio === 'image-heavy'
                      ? 'lg:col-span-5'
                      : 'lg:col-span-6') +
                    (currentSection.imagePosition === 'right' ? ' order-2 lg:order-2' : ' order-1 lg:order-1')
              } ${
                currentSection.textAlignment === 'center' 
                  ? 'text-center' 
                  : currentSection.textAlignment === 'justify' 
                  ? 'text-justify' 
                  : 'text-right'
              }`}>
                {currentSection.subtitle && (
                  <div className={`inline-block bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs ${
                    currentSection.textAlignment === 'center' ? 'mx-auto' : ''
                  }`}>
                    {currentSection.subtitle}
                  </div>
                )}

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                  {currentSection.title}
                </h3>

                <p className="text-slate-300 text-sm sm:text-base leading-loose font-normal">
                  {currentSection.content}
                </p>

                {/* Badges / Highlights */}
                <div className={`pt-1 flex flex-wrap gap-2.5 ${
                  currentSection.textAlignment === 'center' ? 'justify-center' : ''
                }`}>
                  <span className="bg-slate-800/90 border border-slate-700/80 text-blue-300 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-xs">
                    <Layers className="w-4 h-4 text-blue-400" />
                    بخش {currentIndex + 1} از {sections.length} معرفی مرکز
                  </span>
                  {currentSection.imagePosition === 'right' && (
                    <span className="bg-amber-950/80 border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs">
                      <span>چیدمان: تصویر در راست</span>
                    </span>
                  )}
                  {currentSection.imagePosition === 'top' && (
                    <span className="bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs">
                      <span>چیدمان: تصویر در بالا</span>
                    </span>
                  )}
                </div>

                <div className={`pt-2 flex items-center gap-4 ${
                  currentSection.textAlignment === 'center' ? 'justify-center' : ''
                }`}>
                  <Link
                    to="/presentation"
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/30"
                  >
                    <Eye className="w-4 h-4" />
                    <span>مشاهده اسلایدهای سه‌بعدی تمام‌صفحه</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Visual Image Showcase */}
              <div className={`${
                currentSection.imagePosition === 'top'
                  ? 'col-span-12 order-1'
                  : (currentSection.contentRatio === 'text-heavy'
                      ? 'lg:col-span-5'
                      : currentSection.contentRatio === 'image-heavy'
                      ? 'lg:col-span-7'
                      : 'lg:col-span-6') +
                    (currentSection.imagePosition === 'right' ? ' order-1 lg:order-1' : ' order-2 lg:order-2')
              }`}>
                <div className="relative group rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-700/80 shadow-2xl shadow-black/60 aspect-[16/10] ring-1 ring-white/10">
                  {currentSection.image ? (
                    <img
                      src={currentSection.image}
                      alt={currentSection.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-8 text-center">
                      <Sparkles className="w-14 h-14 text-blue-400 mb-3 opacity-60" />
                      <span className="text-white font-bold text-base">{currentSection.title}</span>
                      <span className="text-slate-400 text-xs mt-1">تصویر معرفی مرکز</span>
                    </div>
                  )}

                  {/* Subtle clean ambient vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
