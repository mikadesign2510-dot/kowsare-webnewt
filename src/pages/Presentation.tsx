import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft, Sparkles, Award, ShieldCheck, Bookmark, 
  Compass, Camera, Layers, CheckCircle2, Star, Gem, 
  Stamp, BookOpen, Ruler, QrCode, Crosshair, Flame, Home, ArrowLeft, ArrowRight
} from 'lucide-react';
import { storage, PresentationSection, PresentationFrameStyle, defaultPresentationSections } from '../lib/storage';

export default function Presentation() {
  const [sections, setSections] = useState<PresentationSection[]>(() => {
    const data = storage.getPresentationSections().filter(s => s.isVisible);
    return data.length > 0 ? data.sort((a, b) => a.order - b.order) : defaultPresentationSections;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const isScrollingRef = useRef(false);
  const touchStart = useRef(0);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    const updateFromStorage = () => {
      const data = storage.getPresentationSections().filter(s => s.isVisible);
      const finalSections = data.length > 0 ? data.sort((a, b) => a.order - b.order) : defaultPresentationSections;
      setSections(finalSections);
    };

    updateFromStorage();
    
    // Fetch latest sections from PostgreSQL database
    storage.syncPresentationWithDB().then(dbData => {
      if (dbData && dbData.length > 0) {
        const visible = dbData.filter(s => s.isVisible);
        setSections(visible.length > 0 ? visible.sort((a, b) => a.order - b.order) : defaultPresentationSections);
      }
    });

    const handlePresentationChange = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        const visible = e.detail.filter((s: PresentationSection) => s.isVisible);
        setSections(visible.length > 0 ? visible.sort((a: PresentationSection, b: PresentationSection) => a.order - b.order) : defaultPresentationSections);
      } else {
        updateFromStorage();
      }
    };

    window.addEventListener('kowsar_presentation_changed', handlePresentationChange);
    return () => {
      window.removeEventListener('kowsar_presentation_changed', handlePresentationChange);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const navigateSlide = (dir: number) => {
    if (isScrollingRef.current) return;
    
    const current = currentIndexRef.current;
    
    if (dir === 1 && current < sections.length - 1) {
      isScrollingRef.current = true;
      setDirection(1);
      setCurrentIndex(current + 1);
      setTimeout(() => { isScrollingRef.current = false; }, 800);
    } else if (dir === -1 && current > 0) {
      isScrollingRef.current = true;
      setDirection(-1);
      setCurrentIndex(current - 1);
      setTimeout(() => { isScrollingRef.current = false; }, 800);
    }
  };

  const jumpToSlide = (idx: number) => {
    if (idx === currentIndex || isScrollingRef.current) return;
    setDirection(idx > currentIndex ? 1 : -1);
    isScrollingRef.current = true;
    setCurrentIndex(idx);
    setTimeout(() => { isScrollingRef.current = false; }, 800);
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 30) {
        navigateSlide(e.deltaY > 0 ? 1 : -1);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowLeft' || e.key === ' ') {
        e.preventDefault();
        navigateSlide(1);
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        navigateSlide(-1);
      }
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sections.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart.current - touchEnd;
    if (Math.abs(diff) > 40) {
      navigateSlide(diff > 0 ? 1 : -1);
    }
  };

  if (sections.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-bold text-lg">در حال بارگذاری محتوا...</p>
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? '100%' : '-100%',
      zIndex: 1,
    }),
    center: {
      y: 0,
      zIndex: 1,
      transition: {
        duration: 0.9,
        ease: [0.65, 0, 0.35, 1]
      }
    },
    exit: (dir: number) => ({
      y: dir > 0 ? '-100%' : '100%',
      zIndex: 0,
      transition: {
        duration: 0.9,
        ease: [0.65, 0, 0.35, 1]
      }
    })
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative w-full h-[calc(100vh-80px)] overflow-hidden bg-slate-900 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Floating Bar - Home Link only */}
      <div className="absolute top-4 right-4 sm:right-8 z-50 pointer-events-auto">
        <Link
          to="/"
          className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 text-xs font-bold transition-all shadow-lg cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-blue-400" />
          <span>صفحه اصلی</span>
        </Link>
      </div>

      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full"
        >
          <PresentationBlock 
            section={sections[currentIndex]} 
            index={currentIndex} 
            isLast={currentIndex === sections.length - 1} 
          />
        </motion.div>
      </AnimatePresence>

      {/* Right Side Dots Navigation */}
      <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {sections.map((sec, i) => (
          <button
            key={sec.id || i}
            onClick={() => jumpToSlide(i)}
            title={sec.title}
            className={`group relative flex items-center justify-end transition-all duration-300 cursor-pointer p-1.5`}
          >
            {/* Tooltip on Hover */}
            <span className="absolute right-full mr-3 whitespace-nowrap bg-slate-900/90 backdrop-blur-md text-white border border-white/20 text-[11px] font-bold px-3 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
              {sec.title}
            </span>
            <span 
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-3.5 h-3.5 bg-blue-400 ring-4 ring-blue-500/30' : 'w-2.5 h-2.5 bg-white/30 group-hover:bg-white/70'
              }`} 
            />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// Visual Frame Component for Presentation Images - 3 Simple & Clean Styles
function RenderPresentationImageFrame({ 
  section, 
  index 
}: { 
  section: PresentationSection; 
  index: number; 
}) {
  const frameStyle: PresentationFrameStyle = section.frameStyle || 'rounded-standard';

  switch (frameStyle) {
    // 1. Modern Glass Card - Clean glassmorphism with subtle glow
    case 'glass-card':
      return (
        <div className="relative group w-full max-w-xl mx-auto">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/25 via-indigo-500/25 to-purple-500/25 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
          <div className="relative rounded-3xl p-2 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="rounded-2xl overflow-hidden aspect-[16/10] relative bg-slate-950">
              <img 
                src={section.image} 
                alt={section.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      );

    // 2. Golden Luxury Frame - Clean elegant gold accent
    case 'golden-gallery':
      return (
        <div className="relative group w-full max-w-xl mx-auto p-2 bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 rounded-3xl shadow-2xl shadow-amber-950/30">
          <div className="p-1 bg-slate-950 rounded-[22px]">
            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] border-2 border-amber-300/40 bg-slate-950">
              <img 
                src={section.image} 
                alt={section.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      );

    // 3. Standard Rounded Frame (Default) - Clean minimalist card with deep shadow
    case 'rounded-standard':
    case 'floating-isometric':
    default:
      return (
        <div className="relative group w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-black/70 ring-1 ring-white/20 bg-slate-900 aspect-[16/10]">
          <img 
            src={section.image} 
            alt={section.title}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
        </div>
      );
  }
}

const PresentationBlock: React.FC<{ section: PresentationSection, index: number, isLast: boolean }> = ({ section, index, isLast }) => {
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'ocean':
        return 'bg-gradient-to-br from-sky-950 via-blue-950 to-slate-950 text-white';
      case 'emerald':
        return 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white';
      case 'royal':
        return 'bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white';
      case 'amber':
        return 'bg-gradient-to-br from-amber-950 via-stone-900 to-slate-950 text-white';
      case 'ruby':
        return 'bg-gradient-to-br from-rose-950 via-red-950 to-slate-950 text-white';
      case 'midnight':
        return 'bg-gradient-to-br from-slate-950 via-black to-slate-950 text-white';
      case 'dark':
        return 'bg-slate-900 text-white';
      case 'primary':
        return 'bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 text-white';
      case 'gradient':
        return 'bg-gradient-to-br from-fuchsia-950 via-indigo-950 to-cyan-950 text-white';
      case 'light':
      default:
        return 'bg-slate-50 text-slate-900';
    }
  };

  const getAnimationProps = (style: string) => {
    switch (style) {
      case 'slide-up':
        return { initial: { opacity: 0, y: 100 }, animate: { opacity: 1, y: 0 } };
      case 'slide-right':
        return { initial: { opacity: 0, x: 100 }, animate: { opacity: 1, x: 0 } };
      case 'slide-left':
        return { initial: { opacity: 0, x: -100 }, animate: { opacity: 1, x: 0 } };
      case 'zoom':
        return { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } };
      case 'flip-3d':
        return { initial: { opacity: 0, rotateX: -90 }, animate: { opacity: 1, rotateX: 0 } };
      case 'rotate-3d':
        return { initial: { opacity: 0, rotateY: 90 }, animate: { opacity: 1, rotateY: 0 } };
      case 'fade':
      default:
        return { initial: { opacity: 0 }, animate: { opacity: 1 } };
    }
  };

  const animProps = getAnimationProps(section.animationStyle);
  const imageAnimProps = section.imageAnimationStyle ? getAnimationProps(section.imageAnimationStyle) : { initial: { opacity: 0, rotateY: index % 2 === 0 ? 30 : -30, x: index % 2 === 0 ? 100 : -100 }, animate: { opacity: 1, rotateY: 0, x: 0 } };
  const themeClasses = getThemeClasses(section.theme);
  const isImageRight = section.imagePosition === 'right';
  const isImageTop = section.imagePosition === 'top';
  const textAlignClass = section.textAlignment === 'center' 
    ? 'text-center' 
    : section.textAlignment === 'justify' 
    ? 'text-justify' 
    : 'text-right';

  const textColSpan = !section.image 
    ? 'col-span-12 max-w-4xl mx-auto'
    : isImageTop 
    ? 'col-span-12 order-2'
    : (section.contentRatio === 'text-heavy' 
        ? 'lg:col-span-7' 
        : section.contentRatio === 'image-heavy' 
        ? 'lg:col-span-5' 
        : 'lg:col-span-6') + (isImageRight ? ' order-2 lg:order-2' : ' order-1 lg:order-1');

  const imageColSpan = isImageTop 
    ? 'col-span-12 order-1'
    : (section.contentRatio === 'text-heavy' 
        ? 'lg:col-span-5' 
        : section.contentRatio === 'image-heavy' 
        ? 'lg:col-span-7' 
        : 'lg:col-span-6') + (isImageRight ? ' order-1 lg:order-1' : ' order-2 lg:order-2');

  return (
    <section className={`relative w-full h-full flex items-center justify-center overflow-hidden ${themeClasses} px-6 sm:px-12 lg:px-16`}>
      {/* Background Image Parallax Effect */}
      {section.image && (
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 z-10 ${section.theme === 'light' ? 'bg-white/90' : 'bg-slate-950/85'} backdrop-blur-sm`} />
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear" }}
            src={section.image} 
            alt={section.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className={`max-w-6xl w-full mx-auto relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 ${
        section.verticalAlign === 'start' ? 'items-start' : 'items-center'
      }`}>
        {/* Text Details Column */}
        <motion.div 
          {...animProps}
          transition={{ 
            duration: section.animationDuration || 0.8, 
            ease: section.animationEasing || "easeOut", 
            delay: 0.3 
          }}
          className={`space-y-6 ${textColSpan} ${textAlignClass}`}
        >
          {section.subtitle && (
            <span className={`inline-block px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-wider ${
              section.theme === 'light' ? 'bg-indigo-100 text-indigo-700' : 'bg-white/10 text-indigo-200'
            } ${section.textAlignment === 'center' ? 'mx-auto' : ''}`}>
              {section.subtitle}
            </span>
          )}
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-black leading-tight tracking-tight">
            {section.title}
          </h2>
          
          <p className={`text-sm sm:text-base md:text-lg leading-loose font-normal ${
            section.theme === 'light' ? 'text-slate-600' : 'text-slate-300'
          }`}>
            {section.content}
          </p>
        </motion.div>

        {/* Visual Frame Showcase */}
        {section.image && (
          <motion.div
            {...imageAnimProps}
            transition={{ 
              duration: section.animationDuration ? section.animationDuration + 0.2 : 1, 
              ease: section.animationEasing || "easeOut", 
              delay: 0.2 
            }}
            className={`perspective-1000 ${imageColSpan} w-full`}
          >
            <RenderPresentationImageFrame section={section} index={index} />
          </motion.div>
        )}
      </div>
    </section>
  );
}
