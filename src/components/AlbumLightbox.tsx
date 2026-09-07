import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GalleryAlbum, storage } from '../lib/storage';
import { Link } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Video, ArrowLeft } from 'lucide-react';

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

interface AlbumLightboxProps {
  album: GalleryAlbum;
  onClose: () => void;
}

export default function AlbumLightbox({ album, onClose }: AlbumLightboxProps) {
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const lastSwipeTimeRef = useRef<number>(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const nextImage = () => {
    if (lightboxIndex < album.images.length - 1) {
      setDirection(1);
      setLightboxIndex(prev => prev + 1);
    }
  };

  const prevImage = () => {
    if (lightboxIndex > 0) {
      setDirection(-1);
      setLightboxIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        nextImage();
      } else if (e.key === 'ArrowRight') {
        prevImage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  const handleDragEnd = (event: any, info: any) => {
    const now = Date.now();
    if (now - lastSwipeTimeRef.current < 350) return;

    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      prevImage();
      lastSwipeTimeRef.current = now;
    } else if (info.offset.x < -swipeThreshold) {
      nextImage();
      lastSwipeTimeRef.current = now;
    }
  };

  const currentMedia = album.images[lightboxIndex];
  const linkedNews = album.newsId ? storage.getNews().find(n => n.id === album.newsId) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-slate-950/95 backdrop-blur-xl p-4 sm:p-6 md:p-8"
    >
      {/* Top Header */}
      <div className="w-full flex justify-between items-start z-50">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2">
            {album.title}
          </h2>
          <div className="flex items-center gap-3">
            <span className="bg-blue-600/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold">
              {album.category}
            </span>
            <span className="text-white/60 text-xs sm:text-sm font-medium">
              {(lightboxIndex + 1).toLocaleString('fa-IR')} از {album.images.length.toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-red-500/90 active:scale-95 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      {album.images.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            disabled={lightboxIndex === 0}
            className={`fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 sm:w-14 sm:h-14 bg-white/15 hover:bg-blue-600/90 active:scale-95 backdrop-blur-md rounded-2xl flex items-center justify-center text-white transition-all shadow-2xl border border-white/20 group ${
              lightboxIndex === 0 ? 'opacity-25 cursor-not-allowed pointer-events-none' : 'cursor-pointer hover:shadow-blue-500/30'
            }`}
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
          </button>
          
          <button 
            onClick={nextImage}
            disabled={lightboxIndex === album.images.length - 1}
            className={`fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 sm:w-14 sm:h-14 bg-white/15 hover:bg-blue-600/90 active:scale-95 backdrop-blur-md rounded-2xl flex items-center justify-center text-white transition-all shadow-2xl border border-white/20 group ${
              lightboxIndex === album.images.length - 1 ? 'opacity-25 cursor-not-allowed pointer-events-none' : 'cursor-pointer hover:shadow-blue-500/30'
            }`}
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      {/* Center Slider Area */}
      <div className="relative flex-1 w-full max-w-5xl mx-auto my-auto flex items-center justify-center h-[46vh] sm:h-[54vh] md:h-[58vh] overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={`lightbox-${lightboxIndex}`}
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
            className="absolute inset-0 w-full h-full flex items-center justify-center touch-pan-y cursor-grab active:cursor-grabbing select-none"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
          >
            {currentMedia?.type === 'video' ? (
              <div className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative pointer-events-auto border border-white/10 flex items-center justify-center">
                {currentMedia.url.includes('aparat.com') ? (
                  <iframe 
                    src={currentMedia.url.includes('/video/video/embed/') ? currentMedia.url : `https://www.aparat.com/video/video/embed/videohash/${currentMedia.url.match(/aparat\.com\/v\/([a-zA-Z0-9]+)/)?.[1] || currentMedia.url}/vt/frame`}
                    allowFullScreen
                    className="w-full h-full border-none"
                  />
                ) : (
                  <video 
                    src={currentMedia.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            ) : (
              <img 
                src={currentMedia?.url} 
                alt={currentMedia?.title || album.title}
                className="max-w-full max-h-full object-contain drop-shadow-2xl pointer-events-none rounded-2xl border border-white/10"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Caption & News Summary */}
      <div className="w-full max-w-4xl mx-auto z-40 mt-2">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-300 font-bold">
                  {currentMedia?.title || album.title}
                </span>
                <span className="text-slate-400 text-xs">• {album.date}</span>
              </div>
              
              <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed font-light">
                {album.description || linkedNews?.summary || 'تصاویر و گزارش رویدادهای دانشگاه علمی کاربردی کوثر کاکی.'}
              </p>
            </div>

            {album.newsId && (
              <Link
                to={`/news/${album.newsId}`}
                onClick={onClose}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/25 shrink-0 self-start sm:self-center"
              >
                مشاهده متن کامل خبر
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Thumbnails Navigation Strip */}
          {album.images.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/10 overflow-x-auto pb-1">
              {album.images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => {
                    setDirection(idx > lightboxIndex ? 1 : -1);
                    setLightboxIndex(idx);
                  }}
                  className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    idx === lightboxIndex 
                      ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/40 opacity-100' 
                      : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/60'
                  }`}
                >
                  <img 
                    src={img.url} 
                    alt={img.title || `تصویر ${idx + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                  {img.type === 'video' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Video className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
