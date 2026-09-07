import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronRight, ChevronLeft, ExternalLink } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { storage, BannerItem } from '../lib/storage';

const FALLBACK_HERO_IMAGE = 'https://picsum.photos/seed/7605/1200/800';

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    zIndex: 0,
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.98,
  }),
};

export default function Hero() {
  const [banners, setBanners] = useState<BannerItem[]>(() => {
    const active = storage.getActiveBanners();
    return active.length > 0 ? active : [
      {
        id: 'default-hero-1',
        imageUrl: FALLBACK_HERO_IMAGE,
        title: 'محیط پویای یادگیری و مهارت‌آموزی',
        subtitle: 'دانشگاه جامع علمی کاربردی مرکز کوثر کاکی',
        link: '/register',
        order: 1,
        isActive: true,
        createdAt: '1403/01/01',
        duration: 5
      }
    ];
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [settings, setSettings] = useState(storage.getSettings());

  useEffect(() => {
    const updateBannersList = (list: BannerItem[]) => {
      const active = (list || []).filter(b => b.isActive && b.imageUrl && b.imageUrl.trim().length > 0).sort((a, b) => (a.order || 0) - (b.order || 0));
      if (active.length > 0) {
        setBanners(active);
      }
    };

    storage.syncBannersWithDB().then(loadedBanners => {
      updateBannersList(loadedBanners);
    });
    setSettings(storage.getSettings());

    const handleSettingsUpdate = () => {
      setSettings(storage.getSettings());
    };
    const handleBannersUpdate = (e: any) => {
      const allBanners = e.detail || storage.getBanners();
      updateBannersList(allBanners);
    };

    window.addEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    window.addEventListener('kowsar_banners_changed', handleBannersUpdate);
    return () => {
      window.removeEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
      window.removeEventListener('kowsar_banners_changed', handleBannersUpdate);
    };
  }, []);

  const safeIndex = currentImageIndex >= banners.length ? 0 : currentImageIndex;
  const currentBanner = banners[safeIndex] || banners[0];
  const slideDuration = (currentBanner?.duration || 5) * 1000;

  useEffect(() => {
    if (isHovered || banners.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentImageIndex((prev) => (prev + 1) % banners.length);
    }, slideDuration);
    return () => clearInterval(timer);
  }, [isHovered, banners.length, slideDuration, currentImageIndex]);

  const lastSwipeTimeRef = useRef<number>(0);

  const nextSlide = () => {
    if (banners.length === 0) return;
    setDirection(1);
    setCurrentImageIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    if (banners.length === 0) return;
    setDirection(-1);
    setCurrentImageIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleDragEnd = (event: any, info: any) => {
    const now = Date.now();
    // Debounce to prevent rapid double-triggers and jitter
    if (now - lastSwipeTimeRef.current < 350) return;

    const offsetX = info.offset.x;
    const offsetY = info.offset.y || 0;
    const absX = Math.abs(offsetX);
    const absY = Math.abs(offsetY);
    const velocityX = Math.abs(info.velocity.x);

    // Filter out predominantly vertical scroll gestures
    if (absY > absX * 0.8 && absY > 30) return;

    // Filter out minor displacements / micro-movements
    const isIntentionalSwipe = (absX > 55) || (absX > 25 && velocityX > 350);

    if (isIntentionalSwipe) {
      lastSwipeTimeRef.current = now;
      if (offsetX > 0) {
        nextSlide(); // Swiped right -> reveal next (left item in RTL)
      } else {
        prevSlide(); // Swiped left -> reveal prev (right item in RTL)
      }
    }
  };

  return (
    <div className="relative w-full pt-4 sm:pt-8 pb-10 sm:pb-16 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative bg-white rounded-3xl sm:rounded-[3rem] shadow-[0_20px_60px_rgba(37,99,235,0.08)] border border-blue-50 overflow-hidden flex items-center p-4 sm:p-8 lg:p-12">
        {/* Abstract Blue Background Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-50 z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-blue-100 rounded-full blur-3xl opacity-40 z-0 pointer-events-none"></div>

        <div className="relative z-10 w-full mt-2 sm:mt-4 lg:mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
            
            {/* Text Content (Right side in RTL) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 py-1.5 px-3.5 sm:px-4 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs sm:text-sm font-bold mb-4 sm:mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                {settings.heroBadge}
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-slate-900 leading-[1.25] sm:leading-[1.2] mb-4 sm:mb-6 tracking-tight">
                {settings.heroTitleLine1} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
                  {settings.heroTitleLine2}
                </span>
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-slate-500 mb-6 sm:mb-10 leading-relaxed font-light">
                {settings.heroSubtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                {((settings.customButtons && settings.customButtons.length > 0) 
                  ? settings.customButtons 
                  : [
                      { id: 'default-1', label: 'ثبت‌نام آنلاین', href: '/register', style: 'primary' as const },
                      { id: 'default-2', label: 'فرم‌های ضروری', href: '/forms', style: 'outline' as const }
                    ]
                ).map((btn) => {
                  const baseClasses = "flex items-center justify-center gap-2 font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl transition-all hover:-translate-y-1 shadow-sm text-sm sm:text-base w-full sm:w-auto";
                  let styleClasses = "";
                  
                  switch (btn.style) {
                    case 'primary':
                      styleClasses = "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_8px_25px_rgba(37,99,235,0.3)]";
                      break;
                    case 'secondary':
                      styleClasses = "bg-slate-800 hover:bg-slate-900 text-white shadow-[0_8px_25px_rgba(15,23,42,0.3)]";
                      break;
                    case 'danger':
                      styleClasses = "bg-red-500 hover:bg-red-600 text-white shadow-[0_8px_25px_rgba(239,68,68,0.3)]";
                      break;
                    case 'outline':
                    default:
                      styleClasses = "bg-white hover:bg-blue-50 text-blue-700 border-2 border-blue-100 hover:border-blue-200";
                      break;
                  }

                  const isInternal = btn.href.startsWith('/') && !btn.href.startsWith('//');

                  if (isInternal) {
                    return (
                      <Link key={btn.id} to={btn.href} className={`${baseClasses} ${styleClasses}`}>
                        <span>{btn.label || 'دکمه'}</span>
                        {btn.style === 'primary' && <ArrowLeft className="w-5 h-5" />}
                      </Link>
                    );
                  }

                  return (
                    <a key={btn.id} href={btn.href} target="_blank" rel="noopener noreferrer" className={`${baseClasses} ${styleClasses}`}>
                      <span>{btn.label || 'دکمه'}</span>
                      {btn.style === 'primary' && <ArrowLeft className="w-5 h-5" />}
                    </a>
                  );
                })}
              </div>
            </motion.div>

            {/* Image Content (Left side in RTL) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full lg:col-span-7"
            >
              <div 
                className="relative rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(37,99,235,0.15)] aspect-[16/11] sm:aspect-[4/3] md:aspect-[4/3] lg:aspect-[4/3] xl:aspect-[16/11] bg-slate-100 group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {banners.length > 0 && currentBanner && (
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                      key={currentBanner.id ? `banner-${currentBanner.id}` : `banner-idx-${currentImageIndex}`}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ 
                        x: { type: "tween", ease: [0.25, 1, 0.5, 1], duration: 0.45 },
                        opacity: { duration: 0.35 },
                        scale: { duration: 0.35 }
                      }}
                      className="absolute inset-0 w-full h-full touch-pan-y cursor-grab active:cursor-grabbing select-none"
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.15}
                      onDragEnd={handleDragEnd}
                    >
                      <img
                        src={currentBanner.imageUrl || FALLBACK_HERO_IMAGE}
                        alt={currentBanner.title || "تصویر بنر"}
                        className="w-full h-full object-cover pointer-events-none"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_HERO_IMAGE;
                        }}
                      />
                      
                      

                      {/* Caption & Subtitle overlay moving with the slide */}
                      {(currentBanner.title || currentBanner.subtitle) && (
                        <div className="absolute left-3 right-3 sm:left-6 sm:right-6 bottom-3 sm:bottom-6 z-10 flex justify-center pointer-events-none">
                          <div className="bg-black/50 backdrop-blur-md rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4 max-w-full border border-white/15 shadow-xl pointer-events-auto transition-all hover:bg-black/60">
                            <div className="min-w-0 flex-1 text-right">
                              {currentBanner.title && (
                                <h3 className="font-bold text-xs sm:text-sm md:text-base text-white truncate drop-shadow-sm">
                                  {currentBanner.title}
                                </h3>
                              )}
                              {currentBanner.subtitle && (
                                <p className="text-[10px] sm:text-xs text-slate-200/90 truncate font-light mt-0.5 drop-shadow-sm">
                                  {currentBanner.subtitle}
                                </p>
                              )}
                            </div>
                            {currentBanner.link && currentBanner.showButton !== false && (
                              currentBanner.link.startsWith('/') && !currentBanner.link.startsWith('//') ? (
                                <Link 
                                  to={currentBanner.link} 
                                  className="shrink-0 text-[10px] sm:text-[11px] text-white hover:text-blue-200 font-bold inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-xl transition-colors"
                                >
                                  <span>{currentBanner.buttonText || 'مشاهده جزئیات'}</span>
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </Link>
                              ) : (
                                <a 
                                  href={currentBanner.link} 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 text-[10px] sm:text-[11px] text-white hover:text-blue-200 font-bold inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-xl transition-colors"
                                >
                                  <span>{currentBanner.buttonText || 'مشاهده جزئیات'}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* Slider Navigation Arrows (shown on hover if >1 slides) */}
                {banners.length > 1 && (
                  <div className="absolute inset-0 z-20 flex items-center justify-between p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <button 
                      onClick={prevSlide} 
                      aria-label="تصویر قبلی"
                      className="pointer-events-auto bg-white/30 hover:bg-white/50 backdrop-blur-md text-white p-2.5 sm:p-3 rounded-full transition-all hover:scale-110 shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button 
                      onClick={nextSlide} 
                      aria-label="تصویر بعدی"
                      className="pointer-events-auto bg-white/30 hover:bg-white/50 backdrop-blur-md text-white p-2.5 sm:p-3 rounded-full transition-all hover:scale-110 shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                )}

                {/* Slider Dots */}
                {banners.length > 1 && (
                  <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5 sm:gap-2 max-w-[90%] mx-auto flex-wrap px-4 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                    {banners.map((banner, idx) => (
                      <button
                        key={banner.id || idx}
                        onClick={() => {
                          setDirection(idx > currentImageIndex ? 1 : -1);
                          setCurrentImageIndex(idx);
                        }}
                        aria-label={`اسلاید ${idx + 1}`}
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 shadow-sm ${idx === currentImageIndex ? 'w-6 sm:w-7 bg-white' : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/80'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
