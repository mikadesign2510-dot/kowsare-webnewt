import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { storage, NewsItem } from '../lib/storage';
import { Calendar, ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react';

export default function NewsSection() {
  const [allNewsItems, setAllNewsItems] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Start at 0
  const [settings, setSettings] = useState(storage.getSettings());

  useEffect(() => {
    storage.syncNewsWithDB().then(items => {
      setAllNewsItems(items);
    });
    
    const handleSettingsUpdate = () => {
      setSettings(storage.getSettings());
    };
    window.addEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    return () => {
      window.removeEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    };
  }, []);

  const newsItems = allNewsItems.slice(0, settings.newsCarouselCount || 4);

  const nextSlide = () => {
    if (newsItems.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % newsItems.length);
    }
  };

  const prevSlide = () => {
    if (newsItems.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + newsItems.length) % newsItems.length);
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      nextSlide(); // Swiped right -> move to the item on the left (RTL Next)
    } else if (info.offset.x < -swipeThreshold) {
      prevSlide(); // Swiped left -> move to the item on the right (RTL Prev)
    }
  };

  const newsSize = settings.newsCarouselSize || 'standard';

  // Config map for different frame sizes
  const sizeMap = {
    compact: {
      containerHeight: "h-[310px] sm:h-[330px] md:h-[340px]",
      cardMaxWidth: "max-w-[210px] sm:max-w-[235px] md:max-w-[255px]",
      imageAspect: "aspect-[16/9]",
      contentPadding: "p-2.5 sm:p-3",
      titleClass: "text-xs sm:text-[13px] font-black text-slate-800 mb-1 line-clamp-2 leading-snug",
      summaryClass: "text-slate-500 mb-2 line-clamp-2 leading-relaxed flex-grow text-[10px] sm:text-[11px] font-normal",
      spacingTight: "max-w-[260px] sm:max-w-[300px] md:max-w-[340px]",
      spacingNormal: "max-w-[310px] sm:max-w-[420px] md:max-w-[500px]",
      spacingWide: "max-w-[370px] sm:max-w-[540px] md:max-w-[660px]",
      spacingExtra: "max-w-full sm:max-w-[680px] md:max-w-[840px]",
      xMobile: 58,
      xDesktop: 85
    },
    standard: {
      containerHeight: "h-[360px] sm:h-[385px] md:h-[390px]",
      cardMaxWidth: "max-w-[240px] sm:max-w-[270px] md:max-w-[290px]",
      imageAspect: "aspect-[16/9]",
      contentPadding: "p-3 sm:p-4",
      titleClass: "text-xs sm:text-sm font-black text-slate-800 mb-1.5 line-clamp-2 leading-snug",
      summaryClass: "text-slate-500 mb-3 line-clamp-2 leading-relaxed flex-grow text-[11px] sm:text-xs font-normal",
      spacingTight: "max-w-[280px] sm:max-w-[340px] md:max-w-[380px]",
      spacingNormal: "max-w-[340px] sm:max-w-[480px] md:max-w-[580px]",
      spacingWide: "max-w-[420px] sm:max-w-[620px] md:max-w-[760px]",
      spacingExtra: "max-w-full sm:max-w-[760px] md:max-w-[960px]",
      xMobile: 62,
      xDesktop: 92
    },
    large: {
      containerHeight: "h-[420px] sm:h-[455px] md:h-[470px]",
      cardMaxWidth: "max-w-[270px] sm:max-w-[320px] md:max-w-[350px]",
      imageAspect: "aspect-[16/10]",
      contentPadding: "p-4 sm:p-5",
      titleClass: "text-sm sm:text-base font-black text-slate-800 mb-2 line-clamp-2 leading-snug",
      summaryClass: "text-slate-500 mb-3 line-clamp-3 leading-relaxed flex-grow text-xs sm:text-[13px] font-normal",
      spacingTight: "max-w-[320px] sm:max-w-[390px] md:max-w-[450px]",
      spacingNormal: "max-w-[380px] sm:max-w-[540px] md:max-w-[680px]",
      spacingWide: "max-w-[460px] sm:max-w-[690px] md:max-w-[860px]",
      spacingExtra: "max-w-full sm:max-w-[820px] md:max-w-[1040px]",
      xMobile: 66,
      xDesktop: 98
    },
    xlarge: {
      containerHeight: "h-[480px] sm:h-[520px] md:h-[540px]",
      cardMaxWidth: "max-w-[300px] sm:max-w-[360px] md:max-w-[410px]",
      imageAspect: "aspect-[16/10]",
      contentPadding: "p-4 sm:p-6",
      titleClass: "text-sm sm:text-lg font-black text-slate-800 mb-2.5 line-clamp-2 leading-tight",
      summaryClass: "text-slate-500 mb-4 line-clamp-3 leading-relaxed flex-grow text-xs sm:text-sm font-normal",
      spacingTight: "max-w-[350px] sm:max-w-[440px] md:max-w-[520px]",
      spacingNormal: "max-w-[420px] sm:max-w-[600px] md:max-w-[760px]",
      spacingWide: "max-w-[500px] sm:max-w-[760px] md:max-w-[960px]",
      spacingExtra: "max-w-full sm:max-w-[900px] md:max-w-[1140px]",
      xMobile: 70,
      xDesktop: 104
    },
    cinematic: {
      containerHeight: "h-[370px] sm:h-[400px] md:h-[420px]",
      cardMaxWidth: "max-w-[300px] sm:max-w-[380px] md:max-w-[440px]",
      imageAspect: "aspect-[21/10]",
      contentPadding: "p-3.5 sm:p-4",
      titleClass: "text-xs sm:text-sm md:text-base font-black text-slate-800 mb-1.5 line-clamp-2 leading-snug",
      summaryClass: "text-slate-500 mb-2.5 line-clamp-2 leading-relaxed flex-grow text-[11px] sm:text-xs font-normal",
      spacingTight: "max-w-[360px] sm:max-w-[460px] md:max-w-[560px]",
      spacingNormal: "max-w-[440px] sm:max-w-[640px] md:max-w-[800px]",
      spacingWide: "max-w-[520px] sm:max-w-[800px] md:max-w-[990px]",
      spacingExtra: "max-w-full sm:max-w-[920px] md:max-w-[1160px]",
      xMobile: 68,
      xDesktop: 102
    }
  };

  const currentSize = sizeMap[newsSize] || sizeMap.standard;

  return (
    <section id="news" className="py-7 md:py-10 bg-gradient-to-b from-blue-50/40 via-slate-50/30 to-transparent overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 sm:mb-6 gap-3 sm:gap-4 relative z-10">
          <div>
            <span className="text-blue-600 font-bold tracking-wider text-xs sm:text-sm mb-1 block">
              {settings.newsBadge || 'اطلاع‌رسانی مرکز'}
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {settings.newsTitle || 'اخبار و رویدادها'}
            </h2>
          </div>
          <Link 
            to="/news" 
            className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors group bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-xs border border-blue-100 hover:shadow-sm text-xs sm:text-sm w-full sm:w-auto justify-center"
          >
            آرشیو کامل اخبار
            <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1.5 transition-transform" />
          </Link>
        </div>

        {/* 3D Carousel Container */}
        <motion.div 
          className={`relative ${currentSize.containerHeight} w-full flex justify-center items-center mt-2 sm:mt-4 touch-pan-y`}
          onPanEnd={handleDragEnd}
        >
          {newsItems.map((item, index) => {
            const n = newsItems.length;
            let offset = (index - currentIndex) % n;
            if (offset > Math.floor(n / 2)) offset -= n;
            if (offset < -Math.floor(n / 2)) offset += n;
            
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            
            // Base values
            let x = 0;
            let scale = 1;
            let opacity = 1;
            let blur = "blur(0px)";
            let zIndex = 30;
            let rotateY = 0;

            // Position calculation (RTL mode: negative offset is right, positive is left)
            if (offset === 0) {
              x = 0;
              scale = 1;
              opacity = 1;
              blur = "blur(0px)";
              zIndex = 30;
              rotateY = 0;
            } else if (offset === -1) {
              x = isMobile ? currentSize.xMobile : currentSize.xDesktop; 
              scale = 0.86;
              opacity = 0.82;
              blur = "blur(2px)";
              zIndex = 20;
              rotateY = -12; // rotate towards center
            } else if (offset === 1) {
              x = isMobile ? -currentSize.xMobile : -currentSize.xDesktop;
              scale = 0.86;
              opacity = 0.82;
              blur = "blur(2px)";
              zIndex = 20;
              rotateY = 12;
            } else {
              // Hide any items further than +/- 1 directly behind the center
              x = 0;
              scale = 0.5;
              opacity = 0;
              blur = "blur(10px)";
              zIndex = 10;
              rotateY = 0;
            }

            // Determine style based on settings
            const baseCardStyle = `absolute w-full ${currentSize.cardMaxWidth} rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col select-none`;
            let customCardStyle = "bg-white border border-slate-100 shadow-[0_12px_28px_rgba(37,99,235,0.09)]"; // default
            
            if (settings.newsCarouselStyle === 'glass') {
              customCardStyle = "bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.05)]";
            } else if (settings.newsCarouselStyle === 'minimal') {
              customCardStyle = "bg-slate-50 border-2 border-slate-200 shadow-none";
            }

            return (
              <motion.article
                key={item.id}
                animate={{ 
                  x: `${x}%`,
                  scale,
                  opacity,
                  filter: blur,
                  zIndex,
                  rotateY
                }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                onClick={() => setCurrentIndex(index)}
                style={{ transformStyle: 'preserve-3d', perspective: '1000px', willChange: 'transform, opacity, filter' }}
                className={`${baseCardStyle} ${customCardStyle} ${offset === 0 ? 'cursor-default ring-3 ring-blue-500/25 shadow-blue-500/10' : 'cursor-pointer hover:border-blue-200'}`}
              >
                <div className={`relative ${currentSize.imageAspect} overflow-hidden bg-slate-100`}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover pointer-events-none"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/7561/1200/800';
                    }}
                  />
                  <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold text-blue-700 shadow-xs border border-blue-50">
                    {item.category}
                  </div>
                </div>
                
                <div className={`${currentSize.contentPadding} flex flex-col flex-grow relative`}>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] sm:text-xs mb-1.5 font-medium">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    <span>{item.date}</span>
                  </div>
                  <h3 className={currentSize.titleClass}>
                    {item.title}
                  </h3>
                  <p className={currentSize.summaryClass}>
                    {item.summary}
                  </p>
                  <div className="mt-auto pt-2.5 border-t border-slate-100/90 flex items-center justify-between">
                    <Link to={`/news/${item.id}`} className="text-blue-600 font-bold text-[11px] sm:text-xs flex items-center gap-1 hover:text-blue-800 transition-colors">
                      ادامه مطلب
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {/* Navigation Controls */}
          {(() => {
            let containerWidth = currentSize.spacingNormal;
            if (settings.newsCarouselArrowSpacing === 'tight') {
              containerWidth = currentSize.spacingTight;
            } else if (settings.newsCarouselArrowSpacing === 'wide') {
              containerWidth = currentSize.spacingWide;
            } else if (settings.newsCarouselArrowSpacing === 'extra') {
              containerWidth = currentSize.spacingExtra;
            }
            return (
              <div className={`absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-full ${containerWidth} px-2 flex justify-between z-40 pointer-events-none`}>
                <button 
                  onClick={prevSlide}
                  disabled={newsItems.length <= 1}
                  className="pointer-events-auto w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-white/95 backdrop-blur-md border border-blue-100/80 shadow-lg flex items-center justify-center text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:bg-white hover:scale-105 active:scale-95"
                  title="خبر قبلی"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
                <button 
                  onClick={nextSlide}
                  disabled={newsItems.length <= 1}
                  className="pointer-events-auto w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-white/95 backdrop-blur-md border border-blue-100/80 shadow-lg flex items-center justify-center text-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:bg-white hover:scale-105 active:scale-95"
                  title="خبر بعدی"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
              </div>
            );
          })()}

          {/* Indicators */}
          <div className="absolute -bottom-1 sm:bottom-0 left-1/2 -translate-x-1/2 flex gap-1.5 z-40">
            {newsItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-5 sm:w-7 bg-blue-600' : 'w-1.5 bg-blue-200 hover:bg-blue-400'}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
