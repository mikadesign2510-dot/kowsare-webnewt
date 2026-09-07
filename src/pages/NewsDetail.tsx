import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { storage, NewsItem } from '../lib/storage';
import { 
  Calendar, ArrowRight, Share2, Tag, Eye, Clock, 
  User, Check, Download, FileText, Sparkles, ChevronLeft, 
  Layers, ExternalLink, Image as ImageIcon
} from 'lucide-react';

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>();
  const [newsItem, setNewsItem] = useState<NewsItem | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [selectedGalleryImg, setSelectedGalleryImg] = useState<string | null>(null);
  const [newsAlbum, setNewsAlbum] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const item = storage.getNews().find((n) => n.id === Number(id));
    if (item) {
      setNewsItem(item);
      storage.incrementNewsViews(item.id);
      
      const album = storage.getAlbums().find((a) => a.newsId === item.id);
      setNewsAlbum(album || null);
    }
  }, [id]);

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
      setTimeout(() => setCopied(false), 2500);
    }
  };

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

  // Related news
  const relatedNews = storage.getPublishedNews()
    .filter(n => n.id !== newsItem.id && (n.category === newsItem.category || n.isPinned))
    .slice(0, 3);

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="min-h-screen pb-24 bg-slate-50"
    >
      {/* Hero Image Section */}
      <div className="w-full h-[45vh] md:h-[60vh] relative bg-slate-900 overflow-hidden">
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

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-12 -mt-10 relative z-10 space-y-8">
          
          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 text-xs md:text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-4">
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

            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-blue-600 font-bold text-xs bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'لینک کپی شد' : 'اشتراک‌گذاری خبر'}
            </button>
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
              className="ql-editor p-0 text-slate-700 leading-relaxed space-y-4"
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
                      onClick={() => setSelectedGalleryImg(img)}
                      className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group bg-slate-100 border border-slate-200"
                    >
                      <img src={img} alt={`تصویر ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        بزرگنمایی
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

      {/* Gallery Modal */}
      {selectedGalleryImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedGalleryImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl">
            <img src={selectedGalleryImg} alt="گالری" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl" />
            <button 
              onClick={() => setSelectedGalleryImg(null)}
              className="absolute top-4 right-4 bg-black/60 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black/80"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </motion.article>
  );
}
