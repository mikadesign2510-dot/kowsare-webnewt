import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { NewsItem, PinnedNewsSliderConfig, defaultPinnedSliderConfig } from '../lib/storage';
import { 
  Pin, Sparkles, Calendar, ArrowLeft, Eye, Clock, 
  ChevronRight, ChevronLeft, Pause, Play, User, Tag
} from 'lucide-react';

interface PinnedNewsSliderProps {
  items: NewsItem[];
  className?: string;
  config?: Partial<PinnedNewsSliderConfig>;
  onSlideChange?: (index: number) => void;
}

export default function PinnedNewsSlider({
  items,
  className = '',
  config: customConfig,
  onSlideChange
}: PinnedNewsSliderProps) {
  const config: PinnedNewsSliderConfig = {
    ...defaultPinnedSliderConfig,
    ...(customConfig || {})
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  const total = items.length;

  const autoPlayInterval = config.autoPlayInterval || 6000;
  const isAutoPlayEnabled = autoPlayInterval > 0 && total > 1 && !isPaused;

  // Auto-play timer and progress indicator
  useEffect(() => {
    if (!isAutoPlayEnabled) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const stepInterval = 50;
    const totalSteps = autoPlayInterval / stepInterval;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setProgress((step / totalSteps) * 100);

      if (step >= totalSteps) {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % total;
          onSlideChange?.(next);
          return next;
        });
        step = 0;
        setProgress(0);
      }
    }, stepInterval);

    return () => clearInterval(timer);
  }, [currentIndex, total, isAutoPlayEnabled, autoPlayInterval, onSlideChange]);

  if (!items || items.length === 0 || config.enabled === false) return null;

  const currentItem = items[currentIndex] || items[0];

  const goToNext = () => {
    const next = (currentIndex + 1) % total;
    setCurrentIndex(next);
    setProgress(0);
    onSlideChange?.(next);
  };

  const goToPrev = () => {
    const prev = (currentIndex - 1 + total) % total;
    setCurrentIndex(prev);
    setProgress(0);
    onSlideChange?.(prev);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    
    // In RTL, swipe left goes forward, swipe right goes backward
    if (diff > 50) {
      goToPrev();
    } else if (diff < -50) {
      goToNext();
    }
    touchStartXRef.current = null;
  };

  // Accent styles mapping
  const accentStyles = {
    amber: {
      badge: 'from-amber-500 via-amber-400 to-amber-600 text-slate-950 shadow-amber-500/25 ring-amber-300/60',
      btn: 'from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 border-amber-300/40',
      tagText: 'text-amber-300',
      progress: 'from-amber-400 to-amber-500',
      borderGlow: 'hover:border-amber-400/40',
      pill: 'bg-amber-400/20 text-amber-300 border-amber-400/30'
    },
    blue: {
      badge: 'from-blue-600 via-sky-400 to-indigo-600 text-white shadow-blue-500/25 ring-blue-300/50',
      btn: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 border-blue-400/30',
      tagText: 'text-blue-300',
      progress: 'from-blue-400 to-indigo-500',
      borderGlow: 'hover:border-blue-400/40',
      pill: 'bg-blue-400/20 text-blue-300 border-blue-400/30'
    },
    emerald: {
      badge: 'from-emerald-500 via-teal-400 to-emerald-600 text-slate-950 shadow-emerald-500/25 ring-emerald-300/60',
      btn: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 border-emerald-400/30',
      tagText: 'text-emerald-300',
      progress: 'from-emerald-400 to-teal-500',
      borderGlow: 'hover:border-emerald-400/40',
      pill: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
    },
    purple: {
      badge: 'from-violet-600 via-purple-400 to-fuchsia-600 text-white shadow-purple-500/25 ring-purple-300/50',
      btn: 'from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-purple-500/25 border-purple-400/30',
      tagText: 'text-purple-300',
      progress: 'from-violet-400 to-purple-500',
      borderGlow: 'hover:border-violet-400/40',
      pill: 'bg-violet-400/20 text-violet-300 border-violet-400/30'
    },
    rose: {
      badge: 'from-rose-500 via-pink-400 to-rose-600 text-white shadow-rose-500/25 ring-rose-300/50',
      btn: 'from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-500/25 border-rose-400/30',
      tagText: 'text-rose-300',
      progress: 'from-rose-400 to-pink-500',
      borderGlow: 'hover:border-rose-400/40',
      pill: 'bg-rose-400/20 text-rose-300 border-rose-400/30'
    }
  };

  const accent = accentStyles[config.accentColor || 'amber'] || accentStyles.amber;

  // Height configurations
  const heightClasses = {
    compact: 'min-h-[290px] md:min-h-[340px] lg:min-h-[320px]',
    medium: 'min-h-[360px] md:min-h-[420px] lg:min-h-[400px]',
    tall: 'min-h-[440px] md:min-h-[500px] lg:min-h-[480px]'
  };

  const roundedClasses = {
    normal: 'rounded-2xl',
    large: 'rounded-[24px] md:rounded-[30px]',
    full: 'rounded-[32px] md:rounded-[40px]'
  };

  const currentHeightClass = heightClasses[config.height || 'compact'];
  const currentRoundedClass = roundedClasses[config.roundedCorners || 'large'];

  // Image position class
  const imgPosClass = 
    config.imagePosition === 'top' ? 'object-top' :
    config.imagePosition === 'bottom' ? 'object-bottom' : 'object-center';

  const badgeLabel = config.badgeTitle?.trim() || 'اخبار ویژه';

  // --------------------------------------------------------------------------
  // TEMPLATE 1: SPLIT MODERN (قالب مدرن دوتکه با تصویر خوش‌فرم و محتوای مجزا)
  // --------------------------------------------------------------------------
  if (config.template === 'split') {
    return (
      <div
        className={`relative overflow-hidden ${currentRoundedClass} bg-slate-900 border border-slate-700/60 shadow-xl shadow-slate-950/20 group ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
          {/* Left Column: Dedicated Image Section */}
          <div className="md:col-span-5 lg:col-span-5 relative min-h-[220px] md:min-h-full overflow-hidden bg-slate-950">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-0 w-full h-full"
              >
                <img
                  src={currentItem.image}
                  alt={currentItem.title}
                  className={`w-full h-full object-cover select-none ${imgPosClass}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent md:hidden" />
              </motion.div>
            </AnimatePresence>

            {/* Badge on top of image on mobile/split */}
            {config.showBadges && (
              <div className="absolute top-3.5 right-3.5 z-20">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${accent.badge} text-[11px] font-black shadow-lg ring-1`}>
                  <Pin className="w-3 h-3 shrink-0 transform rotate-12" />
                  <span>{badgeLabel}</span>
                  <Sparkles className="w-2.5 h-2.5 shrink-0" />
                </div>
              </div>
            )}

            {/* Category tag on image bottom left */}
            {config.showCategory && currentItem.category && (
              <div className="absolute bottom-3 right-3 z-20">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
                  <Tag className="w-2.5 h-2.5 text-slate-300" />
                  {currentItem.category}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: News Content */}
          <div className="md:col-span-7 lg:col-span-7 p-5 sm:p-7 md:p-8 flex flex-col justify-between relative z-20">
            <div>
              {/* Header inside content area (hidden on mobile since on image) */}
              <div className="hidden md:flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  {config.showBadges && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${accent.badge} text-[11px] font-black shadow-lg ring-1`}>
                      <Pin className="w-3 h-3 shrink-0 transform rotate-12" />
                      <span>{badgeLabel}</span>
                      <Sparkles className="w-2.5 h-2.5 shrink-0" />
                    </div>
                  )}

                  {config.showCategory && currentItem.category && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 text-xs font-bold border border-white/10">
                      <Tag className="w-3 h-3 text-slate-300" />
                      {currentItem.category}
                    </span>
                  )}
                </div>

                {/* Auto-play pause button */}
                {total > 1 && config.showControls && (
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    title={isPaused ? 'ادامه پخش خودکار' : 'توقف پخش خودکار'}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center border border-white/10 transition-colors"
                    aria-label="Pause or Play"
                  >
                    {isPaused ? <Play className="w-3 h-3 fill-white" /> : <Pause className="w-3 h-3 fill-white" />}
                  </button>
                )}
              </div>

              {/* Meta tags */}
              {config.showMeta && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium mb-3">
                  {currentItem.date && (
                    <div className="flex items-center gap-1 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-blue-300" />
                      <span>{currentItem.date}</span>
                    </div>
                  )}
                  {currentItem.author && (
                    <div className="hidden sm:flex items-center gap-1 text-slate-400">
                      <User className="w-3.5 h-3.5 text-indigo-300" />
                      <span>{currentItem.author}</span>
                    </div>
                  )}
                  {currentItem.views !== undefined && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Eye className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{currentItem.views} بازدید</span>
                    </div>
                  )}
                  {config.showReadTime && currentItem.readTime && (
                    <div className="hidden sm:flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>زمان مطالعه: {currentItem.readTime}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link to={`/news/${currentItem.id}`} className="block group/link">
                    <h2 className="text-xl sm:text-2xl lg:text-[26px] font-black text-white leading-snug tracking-tight group-hover/link:text-blue-300 transition-colors">
                      {currentItem.title}
                    </h2>
                  </Link>

                  {/* Summary */}
                  {config.showSummary && currentItem.summary && (
                    <p className="mt-2.5 text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3 font-light">
                      {currentItem.summary}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Actions and Arrow Navigation */}
            <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between gap-4">
              <Link
                to={`/news/${currentItem.id}`}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${accent.btn} font-black text-xs sm:text-sm shadow-md hover:gap-3 transition-all duration-200 border`}
              >
                <span>مطالعه کامل خبر</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>

              {/* Prev / Next controls */}
              {total > 1 && config.showControls && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrev}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center transition-all active:scale-95"
                    title="خبر قبلی"
                    aria-label="Previous"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center transition-all active:scale-95"
                    title="خبر بعدی"
                    aria-label="Next"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom thumbnail tabs */}
        {total > 1 && config.showBottomTabs && (
          <div className="relative z-20 px-4 py-2.5 bg-slate-950/90 backdrop-blur-xl border-t border-white/10">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {items.map((item, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setProgress(0);
                      onSlideChange?.(idx);
                    }}
                    className={`relative p-2 rounded-lg text-right transition-all duration-200 overflow-hidden text-xs flex flex-col justify-between ${
                      isActive
                        ? 'bg-white/15 border border-white/25 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300'
                    }`}
                  >
                    {isActive && (
                      <div
                        className={`absolute bottom-0 right-0 left-0 h-[2.5px] bg-gradient-to-r ${accent.progress} transition-all`}
                        style={{ width: `${progress}%` }}
                      />
                    )}
                    <span className={`text-[10px] font-bold line-clamp-1 ${isActive ? accent.tagText : 'text-slate-400'}`}>
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 2: ACADEMY MINIMAL CARD (قالب کارتی فلت دانشگاهی)
  // --------------------------------------------------------------------------
  if (config.template === 'card') {
    return (
      <div
        className={`relative overflow-hidden ${currentRoundedClass} bg-white border border-slate-200 shadow-lg group ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
          {/* Content Side */}
          <div className="md:col-span-7 lg:col-span-8 p-6 sm:p-7 flex flex-col justify-between order-2 md:order-1">
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {config.showBadges && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${accent.badge} text-[11px] font-black shadow-sm ring-1`}>
                      <Pin className="w-3 h-3 shrink-0 transform rotate-12" />
                      <span>{badgeLabel}</span>
                    </div>
                  )}
                  {config.showCategory && currentItem.category && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                      {currentItem.category}
                    </span>
                  )}
                </div>

                {total > 1 && config.showControls && (
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    title={isPaused ? 'ادامه' : 'توقف'}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                  >
                    {isPaused ? <Play className="w-3 h-3 fill-slate-700" /> : <Pause className="w-3 h-3 fill-slate-700" />}
                  </button>
                )}
              </div>

              {/* Meta */}
              {config.showMeta && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mb-2.5">
                  {currentItem.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentItem.date}</span>
                    </div>
                  )}
                  {currentItem.author && (
                    <div className="hidden sm:flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentItem.author}</span>
                    </div>
                  )}
                  {config.showReadTime && currentItem.readTime && (
                    <div className="hidden sm:flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentItem.readTime}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link to={`/news/${currentItem.id}`} className="block group/link">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight group-hover/link:text-blue-600 transition-colors">
                      {currentItem.title}
                    </h2>
                  </Link>

                  {config.showSummary && currentItem.summary && (
                    <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-2 font-light">
                      {currentItem.summary}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-4">
              <Link
                to={`/news/${currentItem.id}`}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm transition-all duration-200`}
              >
                <span>مشاهده خبر</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>

              {total > 1 && config.showControls && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrev}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-95"
                    title="قبلی"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all active:scale-95"
                    title="بعدی"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Image Side */}
          <div className="md:col-span-5 lg:col-span-4 relative min-h-[190px] md:min-h-full overflow-hidden bg-slate-100 order-1 md:order-2">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentItem.id}
                src={currentItem.image}
                alt={currentItem.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className={`w-full h-full object-cover select-none ${imgPosClass}`}
              />
            </AnimatePresence>
          </div>
        </div>

        {/* Progress bar line */}
        {total > 1 && (
          <div className="w-full bg-slate-100 h-1">
            <div
              className={`h-full bg-gradient-to-r ${accent.progress} transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 3: GRADIENT GLOW BANNER (قالب بنر گرادیانتی مدرن)
  // --------------------------------------------------------------------------
  if (config.template === 'banner') {
    return (
      <div
        className={`relative overflow-hidden ${currentRoundedClass} bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/30 shadow-xl shadow-indigo-950/20 group ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 items-center p-6 sm:p-8 gap-6">
          <div className="md:col-span-7 lg:col-span-8 space-y-3 relative z-10">
            <div className="flex items-center gap-2">
              {config.showBadges && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${accent.badge} text-[11px] font-black shadow-lg ring-1`}>
                  <Pin className="w-3 h-3 shrink-0 transform rotate-12" />
                  <span>{badgeLabel}</span>
                </div>
              )}
              {config.showCategory && currentItem.category && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs font-bold border border-white/15">
                  {currentItem.category}
                </span>
              )}
            </div>

            <Link to={`/news/${currentItem.id}`} className="block">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-snug tracking-tight hover:text-indigo-300 transition-colors">
                {currentItem.title}
              </h2>
            </Link>

            {config.showSummary && currentItem.summary && (
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2 font-light">
                {currentItem.summary}
              </p>
            )}

            <div className="pt-3 flex items-center justify-between gap-4">
              <Link
                to={`/news/${currentItem.id}`}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${accent.btn} font-black text-xs sm:text-sm shadow-lg hover:gap-3 transition-all`}
              >
                <span>مطالعه کامل</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>

              {total > 1 && config.showControls && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrev}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center transition-all"
                    title="قبلی"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 flex items-center justify-center transition-all"
                    title="بعدی"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-5 lg:col-span-4 relative rounded-2xl overflow-hidden aspect-video shadow-md border border-white/10">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentItem.id}
                src={currentItem.image}
                alt={currentItem.title}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className={`w-full h-full object-cover ${imgPosClass}`}
              />
            </AnimatePresence>
          </div>
        </div>

        {total > 1 && (
          <div className="w-full bg-white/5 h-1">
            <div
              className={`h-full bg-gradient-to-r ${accent.progress} transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // TEMPLATE 4: CINEMATIC OVERLAY (قالب سینمایی فشرده)
  // --------------------------------------------------------------------------
  return (
    <div
      className={`relative overflow-hidden ${currentRoundedClass} bg-slate-950 border border-slate-800 shadow-xl group ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`relative ${currentHeightClass} w-full flex flex-col justify-end overflow-hidden`}>
        {/* Background Animated Image & Atmospheric Overlays */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-0"
          >
            <img
              src={currentItem.image}
              alt={currentItem.title}
              className={`w-full h-full object-cover select-none ${imgPosClass}`}
            />
            {/* Cinematic multi-stop gradient for supreme text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Top Header: Badge, Category & Play/Pause (NO slide number counter) */}
        <div className="relative z-20 px-5 pt-5 sm:px-8 sm:pt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {config.showBadges && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${accent.badge} text-[11px] font-black shadow-lg ring-1`}>
                <Pin className="w-3 h-3 shrink-0 transform rotate-12" />
                <span>{badgeLabel}</span>
                <Sparkles className="w-2.5 h-2.5 shrink-0" />
              </div>
            )}

            {config.showCategory && currentItem.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                <Tag className="w-3 h-3 text-slate-300" />
                {currentItem.category}
              </span>
            )}
          </div>

          {/* Pause / Play button only (Slide counter removed completely!) */}
          {total > 1 && config.showControls && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'ادامه پخش خودکار' : 'توقف موقت پخش'}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center border border-white/10 transition-colors"
              aria-label="Pause or Play"
            >
              {isPaused ? <Play className="w-3 h-3 fill-white" /> : <Pause className="w-3 h-3 fill-white" />}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="relative z-20 px-5 py-5 sm:px-8 sm:py-6 flex-1 flex flex-col justify-end max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-3"
            >
              {/* Meta information */}
              {config.showMeta && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
                  {currentItem.date && (
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/10">
                      <Calendar className="w-3.5 h-3.5 text-blue-300" />
                      <span>{currentItem.date}</span>
                    </div>
                  )}
                  {currentItem.author && (
                    <div className="hidden sm:flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/10">
                      <User className="w-3.5 h-3.5 text-indigo-300" />
                      <span>{currentItem.author}</span>
                    </div>
                  )}
                  {currentItem.views !== undefined && (
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/10">
                      <Eye className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{currentItem.views} بازدید</span>
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <Link to={`/news/${currentItem.id}`} className="block group/title">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug tracking-tight group-hover/title:text-blue-300 transition-colors">
                  {currentItem.title}
                </h2>
              </Link>

              {/* Summary */}
              {config.showSummary && currentItem.summary && (
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-2 font-light max-w-3xl">
                  {currentItem.summary}
                </p>
              )}

              {/* Action Button & Navigation */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <Link
                  to={`/news/${currentItem.id}`}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${accent.btn} font-black text-xs sm:text-sm shadow-lg hover:gap-3 transition-all duration-300 border`}
                >
                  <span>مشاهده و مطالعه کامل خبر</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>

                {total > 1 && config.showControls && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPrev}
                      className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                      title="خبر قبلی"
                      aria-label="Previous"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={goToNext}
                      className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                      title="خبر بعدی"
                      aria-label="Next"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom thumbnail tabs */}
        {total > 1 && config.showBottomTabs && (
          <div className="relative z-20 px-4 py-2.5 sm:px-6 sm:py-3 bg-slate-950/80 backdrop-blur-xl border-t border-white/10">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {items.map((item, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setProgress(0);
                      onSlideChange?.(idx);
                    }}
                    className={`relative p-2 rounded-lg text-right transition-all duration-200 overflow-hidden text-xs flex flex-col justify-between ${
                      isActive
                        ? 'bg-white/15 border border-white/25 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300'
                    }`}
                  >
                    {isActive && (
                      <div
                        className={`absolute bottom-0 right-0 left-0 h-[2.5px] bg-gradient-to-r ${accent.progress} transition-all`}
                        style={{ width: `${progress}%` }}
                      />
                    )}
                    <span className={`text-[10px] font-bold line-clamp-1 ${isActive ? accent.tagText : 'text-slate-400'}`}>
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
