import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { storage, GalleryAlbum } from '../lib/storage';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Camera, Calendar, ArrowLeft, X, ChevronRight, ChevronLeft, 
  Image as ImageIcon, Video, Sparkles, Layers, Search, 
  CheckCircle2, Film
} from 'lucide-react';
import Navbar from '../components/Navbar';
import AlbumLightbox from '../components/AlbumLightbox';
import Footer from '../components/Footer';

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

export default function Gallery() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    const refreshAlbums = () => {
      const loaded = storage.getAlbums();
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAlbums(loaded);
    };

    refreshAlbums();
    
    // همگام‌سازی بی‌درنگ با دیتابیس سرور
    storage.syncAlbumsWithDB().then(serverAlbums => {
      if (serverAlbums && serverAlbums.length > 0) {
        serverAlbums.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAlbums(serverAlbums);
      }
    });

    const handleAlbumsChanged = (e: any) => {
      const updated = e.detail || storage.getAlbums();
      updated.sort((a: GalleryAlbum, b: GalleryAlbum) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAlbums(updated);
    };

    window.addEventListener('kowsar_albums_changed', handleAlbumsChanged);
    return () => window.removeEventListener('kowsar_albums_changed', handleAlbumsChanged);
  }, []);

  // Filter only published/active albums for public visitor view
  const activeAlbums = useMemo(() => {
    return albums.filter(a => a.isActive !== false);
  }, [albums]);

  useEffect(() => {
    if (location.state?.albumId && activeAlbums.length > 0 && !selectedAlbum) {
      const album = activeAlbums.find(a => a.id === location.state.albumId);
      if (album) {
        setSelectedAlbum(album);
        setLightboxIndex(0);
        document.body.style.overflow = 'hidden';
        
        // Remove the state so it doesn't reopen on refresh if user closes it
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.state, activeAlbums, selectedAlbum]);

  const totalMediaCount = useMemo(() => {
    return activeAlbums.reduce((acc, a) => acc + (a.images?.length || 0), 0);
  }, [activeAlbums]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(activeAlbums.map(a => a.category).filter(Boolean)));
    return ['all', ...unique];
  }, [activeAlbums]);

  const filteredAlbums = useMemo(() => {
    return activeAlbums.filter(a => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory;
      const matchSearch = !searchQuery || 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.category && a.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [activeAlbums, activeCategory, searchQuery]);

  const openLightbox = (album: GalleryAlbum, index: number) => {
    setSelectedAlbum(album);
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedAlbum(null);
    document.body.style.overflow = 'auto';
  };

  const lastSwipeTimeRef = useRef<number>(0);

  const nextImage = () => {
    if (selectedAlbum && lightboxIndex < selectedAlbum.images.length - 1) {
      setDirection(1);
      setLightboxIndex(prev => prev + 1);
    }
  };

  const prevImage = () => {
    if (selectedAlbum && lightboxIndex > 0) {
      setDirection(-1);
      setLightboxIndex(prev => prev - 1);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedAlbum) return;
      if (e.key === 'ArrowLeft') {
        nextImage(); // In RTL, left arrow goes forward/next
      } else if (e.key === 'ArrowRight') {
        prevImage(); // In RTL, right arrow goes backward/prev
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAlbum, lightboxIndex]);

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
        nextImage(); // dragged right -> reveal next (left item in RTL)
      } else {
        prevImage(); // dragged left -> reveal prev (right item in RTL)
      }
    }
  };

  const linkedNews = selectedAlbum?.newsId ? storage.getNews().find(n => n.id === selectedAlbum.newsId) : null;
  const currentMedia = selectedAlbum ? selectedAlbum.images[lightboxIndex] : null;

  return (
    <>
      <div className="min-h-screen pt-8 pb-24 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10"
        >
          
          {/* Page Header Banner (Matching Forms and News) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 md:p-14 shadow-xl shadow-blue-950/10">
            <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -right-24 -top-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-bold mb-4 border border-white/15">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>آرشیو چندرسانه‌ای و روایت تصویری مرکز آموزش علمی کاربردی کوثر کاکی</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
                نگارخانه و آلبوم‌های تصویری
              </h1>
              
              <p className="text-blue-100/80 text-base md:text-lg leading-relaxed font-light">
                مجموعه عکس‌ها، فیلم‌ها و گزارش‌های تصویری از مراسم‌ها، کارگاه‌های علمی و تخصصی، همایش‌ها، اردوها و افتخارات دانشجویان مرکز کوثر کاکی.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-bold text-blue-200/90">
                <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <Layers className="w-4 h-4 text-blue-300" />
                  <span>تعداد آلبوم‌ها: <strong className="text-white font-black">{albums.length}</strong> مجموعه</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>تعداد رسانه‌ها: <strong className="text-white font-black">{totalMediaCount}</strong> تصویر و ویدیو</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>کیفیت بالا و پیوست مستقیم به اخبار مرکز</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              
              {/* Search Input */}
              <div className="relative flex-1 max-w-xl">
                <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجو در آلبوم‌ها و رویدادها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full px-2.5 py-0.5"
                  >
                    پاک کردن
                  </button>
                )}
              </div>

              {/* Categories */}
              {categories.length > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        activeCategory === cat 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat === 'all' ? 'همه تصاویر' : cat}
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* Albums Grid */}
          {filteredAlbums.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-600 mb-1">آلبومی یافت نشد</h3>
              <p className="text-slate-400 text-sm">با تغییر فیلترها یا عبارت جستجو مجدداً تلاش فرمایید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAlbums.map(album => (
                <motion.div
                  key={album.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
                >
                  {/* Cover */}
                  <div 
                    className="relative aspect-video overflow-hidden cursor-pointer bg-slate-900"
                    onClick={() => openLightbox(album, 0)}
                  >
                    <img 
                      src={album.coverImage} 
                      alt={album.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors duration-300" />
                    
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3.5 py-1 rounded-full text-xs font-bold text-blue-700 shadow-sm flex items-center gap-1.5 border border-white/20">
                      <Camera className="w-3.5 h-3.5" />
                      {album.images.length} تصویر
                    </div>
                    {album.images.some(img => img.type === 'video') && (
                      <div className="absolute top-4 left-4 bg-rose-500/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1.5 border border-rose-400/30">
                        <Film className="w-3.5 h-3.5" />
                        ویدئو
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          <span>{album.date}</span>
                        </div>
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                          {album.category}
                        </span>
                      </div>
                      
                      <h3 
                        className="text-lg font-black text-slate-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors line-clamp-1"
                        onClick={() => openLightbox(album, 0)}
                      >
                        {album.title}
                      </h3>
                      
                      {album.description && (
                        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-4 font-light">
                          {album.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between">
                      <button 
                        onClick={() => openLightbox(album, 0)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        مشاهده تصاویر
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {album.newsId && (
                        <Link 
                          to={`/news/${album.newsId}`} 
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 font-bold text-xs transition-colors"
                        >
                          خبر مرتبط
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </motion.div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedAlbum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/95 backdrop-blur-xl select-none text-white overflow-y-auto sm:overflow-hidden p-3 sm:p-6"
          >
            {/* Top Bar Header */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/10 z-40">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-full text-xs font-bold shrink-0">
                  {selectedAlbum.category}
                </span>
                <h3 className="font-bold text-base sm:text-lg text-white truncate">
                  {selectedAlbum.title}
                </h3>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-400 font-mono bg-white/10 px-3 py-1.5 rounded-xl">
                  {lightboxIndex + 1} / {selectedAlbum.images.length}
                </span>
                <button 
                  onClick={closeLightbox}
                  aria-label="بستن گالری"
                  className="w-10 h-10 bg-white/10 hover:bg-red-500/80 rounded-xl flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Buttons (Always visible and prominent on both desktop and mobile) */}
            {selectedAlbum.images.length > 1 && (
              <>
                {/* Right Arrow -> Go Previous (Right side in RTL) */}
                <button 
                  onClick={prevImage}
                  disabled={lightboxIndex === 0}
                  aria-label="تصویر قبلی"
                  title="تصویر قبلی (کلید راست کیبورد)"
                  className={`fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 sm:w-14 sm:h-14 bg-white/15 hover:bg-blue-600/90 active:scale-95 backdrop-blur-md rounded-2xl flex items-center justify-center text-white transition-all shadow-2xl border border-white/20 group ${
                    lightboxIndex === 0 ? 'opacity-25 cursor-not-allowed pointer-events-none' : 'cursor-pointer hover:shadow-blue-500/30'
                  }`}
                >
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
                </button>

                {/* Left Arrow -> Go Next (Left side in RTL) */}
                <button 
                  onClick={nextImage}
                  disabled={lightboxIndex === selectedAlbum.images.length - 1}
                  aria-label="تصویر بعدی"
                  title="تصویر بعدی (کلید چپ کیبورد)"
                  className={`fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 sm:w-14 sm:h-14 bg-white/15 hover:bg-blue-600/90 active:scale-95 backdrop-blur-md rounded-2xl flex items-center justify-center text-white transition-all shadow-2xl border border-white/20 group ${
                    lightboxIndex === selectedAlbum.images.length - 1 ? 'opacity-25 cursor-not-allowed pointer-events-none' : 'cursor-pointer hover:shadow-blue-500/30'
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
                      alt={currentMedia?.title || selectedAlbum.title}
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
                        {currentMedia?.title || selectedAlbum.title}
                      </span>
                      <span className="text-slate-400 text-xs">• {selectedAlbum.date}</span>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed font-light">
                      {selectedAlbum.description || linkedNews?.summary || 'تصاویر و گزارش رویدادهای دانشگاه علمی کاربردی کوثر کاکی.'}
                    </p>
                  </div>

                  {selectedAlbum.newsId && (
                    <Link
                      to={`/news/${selectedAlbum.newsId}`}
                      onClick={closeLightbox}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/25 shrink-0 self-start sm:self-center"
                    >
                      مشاهده متن کامل خبر
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {/* Thumbnails Navigation Strip */}
                {selectedAlbum.images.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/10 overflow-x-auto pb-1">
                    {selectedAlbum.images.map((img, idx) => (
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
        )}
      </AnimatePresence>

    </>
  );
}
