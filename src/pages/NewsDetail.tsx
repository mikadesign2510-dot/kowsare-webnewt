import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { storage, NewsItem } from '../lib/storage';
import { 
  Calendar, ArrowRight, Share2, Tag, Eye, Clock, 
  User, Check, Download, FileText, Sparkles, ChevronLeft, 
  Layers, ExternalLink, Image as ImageIcon, Printer,
  Bookmark, BookmarkCheck, ChevronRight, X, Maximize2,
  Copy, ArrowLeftRight
} from 'lucide-react';

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const [newsItem, setNewsItem] = useState<NewsItem | undefined>(undefined);
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [newsAlbum, setNewsAlbum] = useState<any>(null);
  
  // Useful reader features
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const published = storage.getPublishedNews();
    setAllNews(published);

    const item = published.find((n) => n.id === Number(id)) || storage.getNews().find((n) => n.id === Number(id));
    if (item) {
      setNewsItem(item);
      storage.incrementNewsViews(item.id);
      
      const album = storage.getAlbums().find((a) => a.newsId === item.id);
      setNewsAlbum(album || null);

      try {
        const saved = JSON.parse(localStorage.getItem('kowsar_saved_news') || '[]');
        setIsBookmarked(saved.includes(item.id));
      } catch {
        setIsBookmarked(false);
      }
    }
  }, [id]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle Bookmark
  const toggleBookmark = () => {
    if (!newsItem) return;
    try {
      const saved: number[] = JSON.parse(localStorage.getItem('kowsar_saved_news') || '[]');
      let updated: number[];
      if (saved.includes(newsItem.id)) {
        updated = saved.filter(i => i !== newsItem.id);
        setIsBookmarked(false);
        showToast('خبر از فهرست نشان‌شده‌ها حذف شد');
      } else {
        updated = [...saved, newsItem.id];
        setIsBookmarked(true);
        showToast('خبر به فهرست نشان‌شده‌ها افزوده شد');
      }
      localStorage.setItem('kowsar_saved_news', JSON.stringify(updated));
    } catch {
      showToast('خطا در ذخیره‌سازی');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: newsItem?.title,
        text: newsItem?.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('لینک خبر کپی شد');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Keyboard navigation for Lightbox
  const allImages = useMemo(() => {
    if (!newsItem) return [];
    return [newsItem.image, ...(newsItem.gallery || [])].filter(Boolean);
  }, [newsItem]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : allImages.length - 1));
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => (prev !== null && prev < allImages.length - 1 ? prev + 1 : 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, allImages]);

  // Social share link generator
  const getSocialShare = (type: 'eitaa' | 'telegram' | 'bale' | 'whatsapp') => {
    if (!newsItem) return '#';
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(newsItem.title);
    switch (type) {
      case 'eitaa': return `https://eitaa.com/share/url?url=${url}&text=${text}`;
      case 'telegram': return `https://t.me/share/url?url=${url}&text=${text}`;
      case 'bale': return `https://ble.ir/share/url?url=${url}&text=${text}`;
      case 'whatsapp': return `https://api.whatsapp.com/send?text=${text}%20${url}`;
    }
  };

  // Previous and Next news
  const { prevNews, nextNews, relatedNews } = useMemo(() => {
    if (!newsItem || allNews.length === 0) return { prevNews: null, nextNews: null, relatedNews: [] };
    const idx = allNews.findIndex(n => n.id === newsItem.id);
    const prev = idx > 0 ? allNews[idx - 1] : null;
    const next = idx < allNews.length - 1 ? allNews[idx + 1] : null;
    const related = allNews
      .filter(n => n.id !== newsItem.id && (n.category === newsItem.category || n.isPinned))
      .slice(0, 3);
    return { prevNews: prev, nextNews: next, relatedNews: related };
  }, [newsItem, allNews]);

  if (!newsItem) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pt-10">
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-4">خبر پیدا نشد!</h1>
        <p className="text-slate-500 mb-8 text-sm">متأسفانه خبری که به دنبال آن هستید وجود ندارد یا حذف شده است.</p>
        <Link to="/news" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
          مشاهده آرشیو اخبار
        </Link>
      </div>
    );
  }

  // Dynamic font class for comfortable reading
  const fontClass = fontSize === 'large' 
    ? 'text-lg leading-[2.2]' 
    : fontSize === 'xlarge' 
    ? 'text-xl leading-[2.4]' 
    : 'text-base leading-relaxed';

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="min-h-screen pb-24 bg-slate-50 relative"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-white/10"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Image Section (Original Cinematic Style) */}
      <div className="w-full h-[45vh] md:h-[60vh] relative bg-slate-900 overflow-hidden print:hidden">
        <img 
          src={newsItem.image} 
          alt={newsItem.title} 
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <Link to="/news" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-bold text-xs md:text-sm mb-6 transition-colors bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <ArrowRight className="w-4 h-4" />
            بازگشت به آرشیو اخبار
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-blue-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-lg">
              {newsItem.category}
            </span>
            {newsItem.isPinned && (
              <span className="bg-amber-500 text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                خبر ویژه
              </span>
            )}
            <div className="flex items-center gap-1.5 text-slate-200 text-xs font-medium bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              <span>{newsItem.date}</span>
            </div>
            {newsItem.readTime && (
              <div className="flex items-center gap-1.5 text-slate-200 text-xs font-medium bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5 text-blue-300" />
                <span>زمان مطالعه: {newsItem.readTime}</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight md:leading-tight drop-shadow-md">
            {newsItem.title}
          </h1>

          {newsItem.subtitle && (
            <p className="text-slate-200 text-sm md:text-lg mt-3 font-light leading-relaxed">
              {newsItem.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Content Section (Original Center Overlapping Card) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-12 -mt-10 relative z-10 space-y-8">
          
          {/* Metadata Bar with Tools */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 text-xs md:text-sm text-slate-500 font-medium">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <span>منبع / نویسنده: <strong className="text-slate-800">{newsItem.author || 'روابط عمومی مرکز'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Eye className="w-4 h-4" />
                <span>{newsItem.views || 1} بازدید</span>
              </div>
            </div>

            {/* Utility Actions */}
            <div className="flex items-center gap-2">
              {/* Font Size Adjuster */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setFontSize('normal')}
                  title="اندازه متن عادی"
                  className={`px-2 py-1 rounded-lg transition-colors ${fontSize === 'normal' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'}`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('large')}
                  title="اندازه متن بزرگ"
                  className={`px-2 py-1 rounded-lg transition-colors text-sm ${fontSize === 'large' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'}`}
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('xlarge')}
                  title="اندازه متن خیلی بزرگ"
                  className={`px-2 py-1 rounded-lg transition-colors text-base ${fontSize === 'xlarge' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'}`}
                >
                  A++
                </button>
              </div>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={toggleBookmark}
                title={isBookmarked ? 'حذف از نشان‌شده‌ها' : 'نشان کردن خبر'}
                className={`p-2 rounded-xl border transition-colors ${isBookmarked ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-600'}`}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-500" /> : <Bookmark className="w-4 h-4" />}
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                title="چاپ خبر"
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors hidden sm:block"
              >
                <Printer className="w-4 h-4" />
              </button>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 text-blue-600 font-bold text-xs bg-blue-50 px-3.5 py-2 rounded-xl hover:bg-blue-100 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'لینک کپی شد' : 'اشتراک‌گذاری'}</span>
              </button>
            </div>
          </div>

          {/* Lead Summary */}
          {newsItem.summary && (
            <div className="p-5 rounded-2xl bg-blue-50/70 border-r-4 border-blue-600 text-slate-800 text-base md:text-lg font-medium leading-relaxed">
              {newsItem.summary}
            </div>
          )}

          {/* Main Body */}
          <div className="prose prose-lg prose-slate max-w-none prose-headings:font-black prose-p:leading-loose prose-p:text-slate-700 prose-p:font-light">
            <div 
              className={`ql-editor p-0 text-slate-700 ${fontClass} space-y-4`}
              dangerouslySetInnerHTML={{ __html: newsItem.content }} 
            />
          </div>

          {/* Photo Gallery (if any) */}
          {(newsItem.gallery?.length > 0 || newsAlbum) && (
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                گالری تصاویر گزارش
              </h3>
              
              {newsAlbum && (
                <div className="mb-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{newsAlbum.title}</h4>
                    <p className="text-xs text-slate-500">{newsAlbum.images.length} تصویر ثبت شده در نگارخانه مرکز</p>
                  </div>
                  <Link 
                    to="/gallery" 
                    className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm border border-slate-200 hover:border-blue-300 transition-colors"
                  >
                    مشاهده در نگارخانه
                  </Link>
                </div>
              )}

              {newsItem.gallery && newsItem.gallery.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {newsItem.gallery.map((img, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setLightboxIndex(idx + 1)}
                      className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group bg-slate-100 border border-slate-200"
                    >
                      <img src={img} alt={`تصویر ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Maximize2 className="w-4 h-4" />
                        <span>بزرگنمایی</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attachments & Files (if any) */}
          {newsItem.attachments && newsItem.attachments.length > 0 && (
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                فایل‌های پیوست و اسناد مرتبط
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {newsItem.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">{file.name}</p>
                        {file.size && <p className="text-[10px] text-slate-400 mt-0.5">حجم: {file.size}</p>}
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {newsItem.tags && newsItem.tags.length > 0 && (
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 pl-2">
                <Tag className="w-4 h-4" />
                برچسب‌ها:
              </span>
              {newsItem.tags.map((tag, idx) => (
                <Link
                  key={idx}
                  to={`/news?tag=${encodeURIComponent(tag)}`}
                  className="text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 px-3 py-1.5 rounded-xl transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Social Share Quick Links */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-500">ارسال به پیام‌رسان‌ها:</span>
            <div className="flex items-center gap-2">
              <a 
                href={getSocialShare('eitaa')} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#e06a1c]/10 text-[#e06a1c] font-bold hover:bg-[#e06a1c] hover:text-white transition-colors"
              >
                ایتا
              </a>
              <a 
                href={getSocialShare('bale')} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#2ea879]/10 text-[#2ea879] font-bold hover:bg-[#2ea879] hover:text-white transition-colors"
              >
                بله
              </a>
              <a 
                href={getSocialShare('telegram')} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#229ed9]/10 text-[#229ed9] font-bold hover:bg-[#229ed9] hover:text-white transition-colors"
              >
                تلگرام
              </a>
              <a 
                href={getSocialShare('whatsapp')} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#25d366]/10 text-[#25d366] font-bold hover:bg-[#25d366] hover:text-white transition-colors"
              >
                واتساپ
              </a>
            </div>
          </div>

          {/* Previous & Next Article Navigation */}
          <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prevNews ? (
              <Link
                to={`/news/${prevNews.id}`}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center gap-3 text-right group"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                  <img src={prevNews.image} alt={prevNews.title} className="w-full h-full object-cover" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block">خبر قبلی</span>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate">{prevNews.title}</p>
                </div>
              </Link>
            ) : <div />}

            {nextNews ? (
              <Link
                to={`/news/${nextNews.id}`}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center justify-between gap-3 text-right group"
              >
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block">خبر بعدی</span>
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate">{nextNews.title}</p>
                </div>
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                  <img src={nextNews.image} alt={nextNews.title} className="w-full h-full object-cover" />
                </div>
              </Link>
            ) : <div />}
          </div>

        </div>

        {/* Related News Section */}
        {relatedNews.length > 0 && (
          <div className="mt-16 space-y-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-600" />
              سایر اخبار و اطلاعیه‌های مرتبط
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedNews.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/news/${rel.id}`}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200 p-4 hover:shadow-lg transition-all flex flex-col group"
                >
                  <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-slate-100">
                    <img src={rel.image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 mb-1">{rel.category}</span>
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                    {rel.title}
                  </h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-auto pt-2 border-t border-slate-100">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{rel.date}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Lightbox Gallery Modal with Next/Previous */}
      {lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
            <span className="text-xs font-bold bg-black/40 px-3 py-1 rounded-xl">
              تصویر {lightboxIndex + 1} از {allImages.length}
            </span>
            <button 
              onClick={() => setLightboxIndex(null)}
              className="p-2 bg-black/40 hover:bg-black/70 rounded-xl text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Arrows */}
          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : allImages.length - 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 rounded-2xl text-white cursor-pointer z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(prev => (prev !== null && prev < allImages.length - 1 ? prev + 1 : 0));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 rounded-2xl text-white cursor-pointer z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </>
          )}

          <div 
            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={allImages[lightboxIndex]} 
              alt="گالری" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl" 
            />
          </div>
        </div>
      )}
    </motion.article>
  );
}
