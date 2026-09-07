import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { storage, SiteSettings } from '../lib/storage';

export default function HigherEdSystems() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  // Drag and infinite scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false);

  useEffect(() => {
    setSettings(storage.getSettings());
    const handleSettingsChange = () => setSettings(storage.getSettings());
    window.addEventListener('kowsar_site_settings_changed', handleSettingsChange);
    return () => window.removeEventListener('kowsar_site_settings_changed', handleSettingsChange);
  }, []);

  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const scroll = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      if (scrollRef.current && !isHovered && !isDragging) {
        // Move automatically (e.g., 0.04 pixels per millisecond -> 40px/s)
        scrollRef.current.scrollLeft += dt * 0.04;

        const halfWidth = scrollRef.current.scrollWidth / 2;
        if (scrollRef.current.scrollLeft >= halfWidth) {
          scrollRef.current.scrollLeft -= halfWidth;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isHovered, isDragging]);

  if (!settings) return null;

  const activeSystems = (settings.higherEdSystems || [])
    .filter(sys => sys.isActive)
    .sort((a, b) => a.order - b.order);

  if (activeSystems.length === 0) return null;

  // We need exactly two identical halves for the half-width math to work seamlessly.
  // Base items repeated enough times to overflow screen. Let's say 4 times.
  const baseItems = [...activeSystems, ...activeSystems, ...activeSystems, ...activeSystems, ...activeSystems, ...activeSystems];
  // allItems is exactly two baseItems arrays. So scrollWidth / 2 is exactly one baseItems block.
  const allItems = [...baseItems, ...baseItems]; 

  const getHostname = (url: string) => {
    try { return new URL(url).hostname; } catch { return url; }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasDragged.current = false;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsHovered(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.pageX - (scrollRef.current.offsetLeft || 0);
    
    if (Math.abs(x - startX.current) > 5) { 
      hasDragged.current = true;
    }
    
    if (hasDragged.current) {
      e.preventDefault();
      const walk = (x - startX.current) * 2; 
      let newScrollLeft = scrollLeft.current - walk;
      
      const halfWidth = scrollRef.current.scrollWidth / 2;
      // Seamless wrapping when dragging
      if (newScrollLeft >= halfWidth) {
        newScrollLeft -= halfWidth;
        startX.current = x; // Reset startX to prevent jumping
        scrollLeft.current = newScrollLeft;
      } else if (newScrollLeft <= 0) {
        newScrollLeft += halfWidth;
        startX.current = x;
        scrollLeft.current = newScrollLeft;
      }
      
      scrollRef.current.scrollLeft = newScrollLeft;
    }
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    hasDragged.current = false;
    startX.current = e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - (scrollRef.current.offsetLeft || 0);
    
    if (Math.abs(x - startX.current) > 5) {
      hasDragged.current = true;
    }

    if (hasDragged.current) {
      const walk = (x - startX.current) * 2;
      let newScrollLeft = scrollLeft.current - walk;
      
      const halfWidth = scrollRef.current.scrollWidth / 2;
      if (newScrollLeft >= halfWidth) {
        newScrollLeft -= halfWidth;
        startX.current = x;
        scrollLeft.current = newScrollLeft;
      } else if (newScrollLeft <= 0) {
        newScrollLeft += halfWidth;
        startX.current = x;
        scrollLeft.current = newScrollLeft;
      }
      
      scrollRef.current.scrollLeft = newScrollLeft;
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault(); // Don't follow link if it was a drag
    }
  };

  return (
    <section className="py-10 sm:py-20 relative select-none overflow-hidden bg-slate-50/50">
      {/* Decorative blurred blobs for glassmorphism background */}
      <div className="absolute top-1/2 left-0 sm:left-1/4 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-blue-200/40 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-1/2 right-0 sm:right-1/4 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-200/40 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-white py-8 sm:py-12 relative overflow-hidden">
          <div className="mb-8 sm:mb-12 text-center px-4 sm:px-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              سامانه‌های آموزش عالی و دستگاه‌های اجرایی
            </h2>
            <div className="w-16 sm:w-24 h-1.5 bg-blue-500 rounded-full mx-auto mt-4 sm:mt-5 opacity-80"></div>
          </div>

          <div 
            className="w-full flex items-center overflow-x-hidden cursor-grab active:cursor-grabbing pb-4"
            dir="ltr"
            ref={scrollRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
          >
            <div className="flex w-max px-2 sm:px-4 items-center">
              {allItems.map((sys, idx) => (
                <div key={`${sys.id}-${idx}`} className="px-2 sm:px-4 shrink-0">
                  <a
                    href={sys.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    draggable={false}
                    onClick={handleLinkClick}
                    className="flex flex-col items-center bg-white/50 backdrop-blur-md border border-white/80 hover:border-blue-200 hover:bg-white/80 w-32 h-40 sm:w-40 sm:h-48 md:w-48 md:h-56 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] transition-all duration-300 group p-4 sm:p-5 text-center relative overflow-hidden"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-3 sm:mb-4 bg-gradient-to-br from-white/90 to-white/40 backdrop-blur-xl border border-white/80 rounded-2xl sm:rounded-[1.5rem] shadow-sm flex items-center justify-center p-3 group-hover:scale-105 transition-transform duration-300 pointer-events-none">
                      {sys.logoUrl ? (
                        <img src={sys.logoUrl} alt={sys.title} draggable={false} className="w-full h-full object-contain drop-shadow-sm" />
                      ) : (
                        <ExternalLink className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                      )}
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-blue-700 text-xs sm:text-sm md:text-sm leading-snug line-clamp-2 px-1 pointer-events-none mt-auto mb-auto">
                      {sys.title}
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
