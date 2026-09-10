import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { storage, GalleryAlbum, GalleryImage } from '../lib/storage';
import { 
  Film, Video, Share2, Copy, Check, ArrowRight, ArrowLeft, 
  Calendar, Eye, Layers, Sparkles, ExternalLink, Download, 
  Code, Play, Newspaper, CheckCircle2, RefreshCw
} from 'lucide-react';
import { parseAparatEmbedUrl } from './admin/GalleryManager';

export default function GalleryVideoDetail() {
  const { albumId, videoId } = useParams<{ albumId?: string; videoId: string }>();
  const navigate = useNavigate();

  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);

  // بارگذاری آلبوم‌ها از حافظه و همگام‌سازی با سرور
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const load = () => {
      const loaded = storage.getAlbums();
      setAlbums(loaded);
    };
    load();

    storage.syncAlbumsWithDB().then(serverAlbums => {
      if (serverAlbums && serverAlbums.length > 0) {
        setAlbums(serverAlbums);
      }
    });

    const handleAlbumsChanged = (e: any) => {
      const updated = e.detail || storage.getAlbums();
      setAlbums(updated);
    };

    window.addEventListener('kowsar_albums_changed', handleAlbumsChanged);
    return () => window.removeEventListener('kowsar_albums_changed', handleAlbumsChanged);
  }, []);

  // یافتن ویدیو و آلبوم متناظر
  const { targetAlbum, targetVideo, videoIndex } = useMemo(() => {
    if (!videoId || albums.length === 0) {
      return { targetAlbum: null, targetVideo: null, videoIndex: -1 };
    }

    // ۱. جستجو با albumId و videoId
    if (albumId) {
      const foundAlbum = albums.find(a => a.id === albumId);
      if (foundAlbum && foundAlbum.images) {
        // ابتدا بر اساس id دقیق
        let idx = foundAlbum.images.findIndex(img => img.id === videoId);
        // اگر پیدا نشد، ممکن است اندیس عددی باشد
        if (idx === -1 && /^\d+$/.test(videoId)) {
          const numIdx = parseInt(videoId, 10);
          if (numIdx >= 0 && numIdx < foundAlbum.images.length) {
            idx = numIdx;
          }
        }
        if (idx !== -1) {
          return { targetAlbum: foundAlbum, targetVideo: foundAlbum.images[idx], videoIndex: idx };
        }
      }
    }

    // ۲. جستجو در تمام آلبوم‌ها بدون نیاز به albumId
    for (const alb of albums) {
      if (!alb.images) continue;
      // بررسی id
      const exactIdx = alb.images.findIndex(img => img.id === videoId);
      if (exactIdx !== -1) {
        return { targetAlbum: alb, targetVideo: alb.images[exactIdx], videoIndex: exactIdx };
      }
      // بررسی کد ویدیو با پیشوند
      const compIdx = alb.images.findIndex((img, i) => `${alb.id}-${i}` === videoId || `${alb.id}-${img.id}` === videoId);
      if (compIdx !== -1) {
        return { targetAlbum: alb, targetVideo: alb.images[compIdx], videoIndex: compIdx };
      }
    }

    // ۳. به عنوان بازگشت اضطراری، اگر یک آلبوم با شناسه ویدیو وجود دارد که تک‌ویدیو است
    const directAlbum = albums.find(a => a.id === videoId);
    if (directAlbum && directAlbum.images && directAlbum.images.length > 0) {
      const vIdx = directAlbum.images.findIndex(img => img.type === 'video');
      const finalIdx = vIdx !== -1 ? vIdx : 0;
      return { targetAlbum: directAlbum, targetVideo: directAlbum.images[finalIdx], videoIndex: finalIdx };
    }

    return { targetAlbum: null, targetVideo: null, videoIndex: -1 };
  }, [albums, albumId, videoId]);

  // سایر ویدیوهای موجود در دانشگاه جهت پیشنهاد و تماشای بعدی
  const otherVideos = useMemo(() => {
    const list: { album: GalleryAlbum; video: GalleryImage; index: number }[] = [];
    albums.forEach(alb => {
      (alb.images || []).forEach((img, idx) => {
        if (img.type === 'video') {
          // فیلتر کردن ویدیوی فعلی
          if (alb.id !== targetAlbum?.id || idx !== videoIndex) {
            list.push({ album: alb, video: img, index: idx });
          }
        }
      });
    });
    return list.slice(0, 6);
  }, [albums, targetAlbum, videoIndex]);

  // خبر مرتبط (در صورت انتساب)
  const linkedNews = useMemo(() => {
    if (!targetAlbum?.newsId) return null;
    return storage.getNews().find(n => n.id === targetAlbum.newsId) || null;
  }, [targetAlbum]);

  // آدرس کامل صفحه فعلی جهت اشتراک‌گذاری
  const currentFullUrl = typeof window !== 'undefined' ? window.location.href : '';

  // کپی آدرس اشتراک در حافظه کلیپ‌بورد
  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentFullUrl);
      setCopied('link');
      setTimeout(() => setCopied(null), 3000);
    }
  };

  // کپی کد امبد در حافظه
  const handleCopyEmbed = () => {
    const embedCode = `<iframe src="${currentFullUrl}" width="100%" height="450" frameborder="0" allowfullscreen title="${targetVideo?.title || targetAlbum?.title || 'ویدئو دانشگاه کوثر کاکی'}"></iframe>`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 3000);
    }
  };

  // اشتراک با رابط پیش‌فرض سیستم‌عامل
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: targetVideo?.title || targetAlbum?.title || 'ویدئو دانشگاه علمی کاربردی کوثر کاکی',
          text: targetAlbum?.description || 'مشاهده ویدئو در نگارخانه دانشگاه علمی کاربردی کوثر کاکی',
          url: currentFullUrl,
        });
      } catch {
        // کاربر انصراف داد یا لغو شد
      }
    } else {
      handleCopyLink();
    }
  };

  // سازنده لینک پیام‌رسان‌ها
  const getSocialShareUrl = (platform: 'eitaa' | 'bale' | 'telegram' | 'whatsapp') => {
    const url = encodeURIComponent(currentFullUrl);
    const text = encodeURIComponent(
      `${targetVideo?.title || targetAlbum?.title || 'ویدئو دانشگاه علمی کاربردی کوثر کاکی'}\nمرکز آموزش علمی کاربردی کوثر کاکی`
    );

    switch (platform) {
      case 'eitaa':
        return `https://eitaa.com/share/url?url=${url}&text=${text}`;
      case 'bale':
        return `https://ble.ir/share/url?url=${url}&text=${text}`;
      case 'telegram':
        return `https://t.me/share/url?url=${url}&text=${text}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${text}%20${url}`;
    }
  };

  // اگر هنوز در حال بارگذاری اولیه یا ویدیو یافت نشده است
  if (!targetVideo || !targetAlbum) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm max-w-lg w-full text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <Film className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800">ویدیوی مورد نظر یافت نشد</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            ممکن است این ویدیو توسط مدیر مرکز حذف شده یا آدرس وارد شده تغییر یافته باشد.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/gallery"
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              بازگشت به نگارخانه
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تلاش مجدد
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAparat = targetVideo.url.includes('aparat.com') || !targetVideo.url.endsWith('.mp4');
  const aparatEmbedUrl = isAparat ? parseAparatEmbedUrl(targetVideo.url) : '';
  const videoTitle = targetVideo.title || targetAlbum.title;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-24 selection:bg-rose-500 selection:text-white">
      {/* Top Breadcrumb & Controls Bar */}
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              to="/gallery"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-all shrink-0 flex items-center gap-1 text-xs font-bold"
              title="بازگشت به نگارخانه"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">نگارخانه</span>
            </Link>

            <span className="text-slate-600 hidden sm:inline">/</span>

            <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" />
              <span>پخش ویدئو</span>
            </span>

            <span className="text-slate-600 hidden sm:inline">/</span>

            <h1 className="text-xs sm:text-sm font-bold text-slate-200 truncate" title={videoTitle}>
              {videoTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-white/10 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer active:scale-95"
              title="کپی لینک اشتراک‌گذاری"
            >
              {copied === 'link' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">کپی لینک</span>
                </>
              )}
            </button>

            <button
              onClick={handleNativeShare}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer active:scale-95"
              title="اشتراک‌گذاری"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>اشتراک</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        
        {/* Main Player Cinema Container */}
        <div className="bg-black/60 rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner border border-white/5">
            {isAparat ? (
              <iframe
                src={aparatEmbedUrl}
                title={videoTitle}
                allowFullScreen
                className="w-full h-full border-none"
              />
            ) : (
              <video
                src={targetVideo.url}
                controls
                autoPlay
                poster={targetAlbum.coverImage}
                className="w-full h-full object-contain"
              >
                مرورگر شما از پخش مستقیم ویدیو پشتیبانی نمی‌کند.
              </video>
            )}
          </div>

          {/* Player Bottom Quick Stats */}
          <div className="pt-4 px-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                <span>تاریخ انتشار: <strong className="text-slate-200">{targetAlbum.date}</strong></span>
              </span>

              <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>دسته‌بندی: <strong className="text-slate-200">{targetAlbum.category}</strong></span>
              </span>

              <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>آلبوم: <strong className="text-slate-200">{targetAlbum.title}</strong></span>
              </span>
            </div>

            {!isAparat && targetVideo.url.startsWith('http') && (
              <a
                href={targetVideo.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود مستقیم فایل ویدئو</span>
              </a>
            )}
          </div>
        </div>

        {/* Video Information & Dedicated Sharing Hub (Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Main Column: Details & Description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/60 rounded-3xl p-6 sm:p-8 border border-slate-700/60 space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                    گزارش تصویری و چندرسانه‌ای
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
                    {targetAlbum.category}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
                  {videoTitle}
                </h2>
              </div>

              {targetAlbum.description && (
                <div className="pt-4 border-t border-slate-700/60">
                  <h3 className="text-xs font-bold text-slate-400 mb-2">توضیحات و خلاصه گزارش:</h3>
                  <p className="text-slate-300 text-sm leading-relaxed font-light whitespace-pre-line">
                    {targetAlbum.description}
                  </p>
                </div>
              )}

              {linkedNews && (
                <div className="pt-4 border-t border-slate-700/60 bg-blue-950/30 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8 rounded-b-3xl border-t border-blue-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                      <Newspaper className="w-3.5 h-3.5" />
                      خبر متناظر در پورتال دانشگاه
                    </span>
                    <p className="text-sm font-bold text-white line-clamp-1">{linkedNews.title}</p>
                  </div>
                  <Link
                    to={`/news/${linkedNews.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0"
                  >
                    مطالعه متن کامل خبر
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Other Media From This Same Album */}
            {targetAlbum.images.length > 1 && (
              <div className="bg-slate-800/40 rounded-3xl p-6 border border-slate-700/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rose-400" />
                    <span>سایر تصاویر و ویدیوهای همین آلبوم ({targetAlbum.images.length} مورد)</span>
                  </h3>
                  <Link
                    to="/gallery"
                    state={{ albumId: targetAlbum.id }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                  >
                    مشاهده آلبوم در نگارخانه
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {targetAlbum.images.map((img, idx) => {
                    const isCurrent = idx === videoIndex;
                    return (
                      <div
                        key={img.id || idx}
                        onClick={() => {
                          if (img.type === 'video') {
                            navigate(`/gallery/video/${targetAlbum.id}/${img.id || idx}`);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          } else {
                            navigate('/gallery', { state: { albumId: targetAlbum.id } });
                          }
                        }}
                        className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                          isCurrent
                            ? 'border-rose-500 ring-2 ring-rose-500/40 opacity-100'
                            : 'border-slate-700 opacity-70 hover:opacity-100 hover:border-slate-500'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.title || `مورد ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {img.type === 'video' ? (
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                            <Play className="w-5 h-5 text-rose-400 fill-rose-400/50 mb-0.5" />
                            <span className="text-[10px] font-bold">ویدیو</span>
                          </div>
                        ) : (
                          <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] text-white">
                            عکس
                          </div>
                        )}
                        {isCurrent && (
                          <div className="absolute top-1 left-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            در حال پخش
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Complete Sharing Hub (اشتراک‌گذاری اختصاصی) */}
          <div className="space-y-6">
            
            {/* Share Card */}
            <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-7 border border-slate-700 shadow-xl space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-700">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">اشتراک‌گذاری ویدئو</h3>
                  <p className="text-[11px] text-slate-400">لینک اختصاصی و ارسال به پیام‌رسان‌ها</p>
                </div>
              </div>

              {/* Direct Link Copy Box */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  لینک اختصاصی این ویدیو برای اشتراک:
                </label>
                <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-700/80">
                  <input
                    type="text"
                    readOnly
                    value={currentFullUrl}
                    className="flex-1 bg-transparent text-xs text-slate-300 font-mono focus:outline-none px-2 text-left"
                    dir="ltr"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                      copied === 'link'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {copied === 'link' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Social Messengers Grid */}
              <div className="space-y-2.5">
                <span className="block text-xs font-bold text-slate-300">ارسال مستقیم به پیام‌رسان:</span>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* ایتا */}
                  <a
                    href={getSocialShareUrl('eitaa')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#e06a1c]/15 hover:bg-[#e06a1c] text-[#fca369] hover:text-white border border-[#e06a1c]/30 font-bold text-xs transition-all active:scale-95"
                  >
                    <span>پیام‌رسان ایتا</span>
                  </a>

                  {/* بله */}
                  <a
                    href={getSocialShareUrl('bale')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#2ea879]/15 hover:bg-[#2ea879] text-[#55e0ac] hover:text-white border border-[#2ea879]/30 font-bold text-xs transition-all active:scale-95"
                  >
                    <span>پیام‌رسان بله</span>
                  </a>

                  {/* تلگرام */}
                  <a
                    href={getSocialShareUrl('telegram')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#229ed9]/15 hover:bg-[#229ed9] text-[#71ccf8] hover:text-white border border-[#229ed9]/30 font-bold text-xs transition-all active:scale-95"
                  >
                    <span>تلگرام</span>
                  </a>

                  {/* واتساپ */}
                  <a
                    href={getSocialShareUrl('whatsapp')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25d366]/15 hover:bg-[#25d366] text-[#69f79b] hover:text-white border border-[#25d366]/30 font-bold text-xs transition-all active:scale-95"
                  >
                    <span>واتساپ</span>
                  </a>
                </div>
              </div>

              {/* Native Mobile Share Button */}
              <div>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-600/60"
                >
                  <Share2 className="w-4 h-4 text-rose-400" />
                  <span>اشتراک‌گذاری در سایر برنامه‌های گوشی</span>
                </button>
              </div>

              {/* Embed Code Toggle */}
              <div className="pt-3 border-t border-slate-700/70 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowEmbedCode(!showEmbedCode)}
                  className="text-xs font-bold text-slate-400 hover:text-white flex items-center justify-between w-full"
                >
                  <span className="flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-blue-400" />
                    <span>کد قرار دادن در سایت‌ها (Embed Iframe)</span>
                  </span>
                  <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded">
                    {showEmbedCode ? 'بستن' : 'نمایش'}
                  </span>
                </button>

                {showEmbedCode && (
                  <div className="space-y-2 pt-2">
                    <textarea
                      readOnly
                      rows={3}
                      value={`<iframe src="${currentFullUrl}" width="100%" height="450" frameborder="0" allowfullscreen></iframe>`}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-[11px] font-mono text-slate-300 focus:outline-none resize-none text-left"
                      dir="ltr"
                    />
                    <button
                      onClick={handleCopyEmbed}
                      className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      {embedCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">کد امبد کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی کد امبد (HTML)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Quick Link to Gallery */}
            <div className="bg-gradient-to-br from-blue-900/30 to-indigo-950/40 rounded-3xl p-6 border border-blue-800/30 space-y-3">
              <h4 className="font-bold text-sm text-blue-200">آرشیو چندرسانه‌ای کوثر کاکی</h4>
              <p className="text-xs text-blue-100/70 leading-relaxed font-light">
                برای مشاهده تمامی آلبوم‌های تصویری و گزارش‌های مرکز می‌توانید به صفحه اصلی نگارخانه مراجعه فرمایید.
              </p>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-300 hover:text-white transition-colors pt-1"
              >
                <span>مشاهده کلیه آلبوم‌های دانشگاه</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>

        {/* More Videos Section */}
        {otherVideos.length > 0 && (
          <div className="pt-8 border-t border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-rose-500" />
                  <span>سایر ویدیوها و کلیپ‌های دانشگاه</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">کلیپ‌های معرفی، همایش‌ها و کارگاه‌های تخصصی مرکز</p>
              </div>

              <Link
                to="/gallery"
                className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <span>مشاهده نگارخانه</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherVideos.map((item, idx) => (
                <div
                  key={`${item.album.id}-${item.index}-${idx}`}
                  onClick={() => {
                    navigate(`/gallery/video/${item.album.id}/${item.video.id || item.index}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/60 hover:border-rose-500/50 transition-all duration-300 cursor-pointer group flex flex-col justify-between hover:shadow-xl hover:shadow-rose-950/20"
                >
                  <div className="relative aspect-video bg-slate-950 overflow-hidden">
                    <img
                      src={item.video.url || item.album.coverImage}
                      alt={item.video.title || item.album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white mr-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded-md text-[10px] font-bold text-white">
                      {item.album.category}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-rose-300 transition-colors">
                      {item.video.title || item.album.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{item.album.date}</span>
                      <span className="text-rose-400 text-[11px] font-bold flex items-center gap-1">
                        تماشا
                        <ArrowLeft className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
