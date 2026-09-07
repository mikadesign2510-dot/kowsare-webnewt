import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { storage, NewsItem } from '../lib/storage';
import DynamicSidebar from '../components/DynamicSidebar';
import PinnedNewsSlider from '../components/PinnedNewsSlider';
import { 
  Search, Calendar, ArrowLeft, Tag, Filter, 
  Sparkles, Newspaper, ChevronLeft, ChevronRight,
  Layers, AlertCircle, FileText, Eye, Clock, User, Pin
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export default function NewsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tagParam = searchParams.get('tag');

  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('همه');
  const [selectedTag, setSelectedTag] = useState<string | null>(tagParam);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [settings, setSettings] = useState(storage.getSettings());

  useEffect(() => {
    window.scrollTo(0, 0);
    storage.syncNewsWithDB().then(items => {
      const published = items.filter(n => n.isPublished !== false);
      setAllNews(published);
    });

    const handleSettingsUpdate = () => {
      setSettings(storage.getSettings());
    };
    window.addEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    return () => {
      window.removeEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    if (tagParam) {
      setSelectedTag(tagParam);
      setCurrentPage(1);
    }
  }, [tagParam]);

  // Extract unique categories with count
  const categories = useMemo(() => {
    const counts: Record<string, number> = { 'همه': allNews.length };
    allNews.forEach(item => {
      const cat = item.category || 'عمومی';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [allNews]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    allNews.forEach(item => {
      item.tags?.forEach(t => tagsSet.add(t));
    });
    return Array.from(tagsSet);
  }, [allNews]);

  // Filter and Sort news
  const filteredNews = useMemo(() => {
    return allNews
      .filter(item => {
        const matchesCategory = selectedCategory === 'همه' || item.category === selectedCategory;
        const matchesTag = !selectedTag || (item.tags && item.tags.includes(selectedTag));
        const matchesSearch = 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.author && item.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.content && item.content.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesTag && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'popular') return (b.views || 0) - (a.views || 0);
        if (sortBy === 'oldest') return a.id - b.id;
        // Default newest: pinned items first, then by priority/id
        if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
        return b.id - a.id;
      });
  }, [allNews, searchQuery, selectedCategory, selectedTag, sortBy]);

  // Pinned news items for the top interactive slider
  const pinnedNews = useMemo(() => {
    const pinned = allNews.filter(n => n.isPinned);
    if (pinned.length > 0) return pinned;
    // Fallback if none pinned yet: top 3 news items so the slider is always active and engaging
    return allNews.slice(0, 3);
  }, [allNews]);

  const showPinnedSlider = 
    settings.pinnedNewsSliderConfig?.enabled !== false &&
    currentPage === 1 && 
    selectedCategory === 'همه' && 
    !selectedTag && 
    searchQuery.trim() === '' && 
    pinnedNews.length > 0;

  // Paginated list
  const gridItems = useMemo(() => {
    return filteredNews;
  }, [filteredNews]);

  const totalPages = Math.ceil(gridItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedNews = gridItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('همه');
    setSelectedTag(null);
    setSearchParams({});
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen pt-8 pb-24 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10"
      >
        
        {/* Page Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white p-8 md:p-14 shadow-xl shadow-blue-950/10">
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-bold mb-4 border border-white/15">
              <Newspaper className="w-4 h-4" />
              <span>پایگاه رسمی اطلاع‌رسانی مرکز آموزش علمی کاربردی کوثر کاکی</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
              اخبار، اطلاعیه‌ها و رویدادها
            </h1>
            <p className="text-blue-100/80 text-base md:text-lg leading-relaxed font-light">
              آخرین رویدادهای علمی، آموزشی، فرهنگی، تقویم‌های تحصیلی و اطلاعیه‌های مرکز را به تفکیک موضوع در این بخش دنبال کنید.
            </p>
          </div>
        </div>

        {/* Pinned News Slider Section */}
        {showPinnedSlider && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {settings.pinnedNewsSliderConfig?.badgeTitle || 'اخبار ویژه'}
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                مهم‌ترین اطلاعیه‌ها و رویدادهای برگزیده مرکز
              </span>
            </div>

            <PinnedNewsSlider items={pinnedNews} config={settings.pinnedNewsSliderConfig} />
          </motion.section>
        )}

        {/* Active Tag Notice */}
        {selectedTag && (
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <div className="flex items-center gap-2 text-blue-900 text-sm font-bold">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>در حال نمایش اخبار با برچسب: <strong>#{selectedTag}</strong></span>
            </div>
            <button
              onClick={() => {
                setSelectedTag(null);
                setSearchParams({});
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl transition-colors"
            >
              حذف فیلتر برچسب
            </button>
          </div>
        )}

        {/* Search, Filter & Toolbar Bar */}
        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جستجو در عناوین، متون یا نویسنده..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full px-2 py-0.5"
                >
                  پاک کردن
                </button>
              )}
            </div>

            {/* Sort & Quick Counter */}
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
              <div className="text-xs font-bold text-slate-500">
                یافت شد: <span className="text-blue-600 font-black text-sm">{filteredNews.length}</span> خبر
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">مرتب‌سازی:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">جدیدترین اخبار</option>
                  <option value="popular">پربازدیدترین‌ها</option>
                  <option value="oldest">قدیمی‌ترین‌ها</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1 pl-1">
              <Filter className="w-3.5 h-3.5" />
              موضوع:
            </span>
            {categories.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => handleCategoryChange(name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  selectedCategory === name
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedCategory === name ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main News Grid & Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Grid Area */}
          <div className="lg:col-span-8 space-y-8">
            {paginatedNews.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">هیچ خبری یافت نشد!</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  با فیلترها یا عبارت جستجو شده موردی پیدا نشد.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
                >
                  نمایش تمامی اخبار
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedNews.map((item, idx) => (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all flex flex-col group"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-700 shadow-sm">
                          {item.category}
                        </div>
                        {item.isPinned && (
                          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black shadow-md flex items-center gap-1 ring-1 ring-amber-300/80">
                            <Pin className="w-3 h-3 fill-slate-950 text-slate-950" />
                            سنجاق‌شده
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow justify-between">
                      <div>
                        <div className="flex items-center justify-between text-slate-400 text-xs mb-3 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{item.date}</span>
                          </div>
                          {item.views !== undefined && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{item.views}</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>

                        <p className="text-slate-500 text-xs md:text-sm mb-6 line-clamp-3 leading-relaxed font-light">
                          {item.summary}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
                          {item.author || 'روابط عمومی'}
                        </span>
                        <Link
                          to={`/news/${item.id}`}
                          className="text-blue-600 font-bold text-xs md:text-sm flex items-center gap-1.5 group-hover:text-blue-700 group-hover:gap-2 transition-all"
                        >
                          ادامه مطلب
                          <ArrowLeft className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all"
                  title="صفحه قبل"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-all"
                  title="صفحه بعد"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <DynamicSidebar 
              widgets={settings.newsWidgets || []} 
              dynamicData={{
                categories: categories,
                onCategoryClick: handleCategoryChange,
                activeCategory: selectedCategory,
                tags: allTags,
                onTagClick: (tag) => {
                  setSelectedTag(tag);
                  setCurrentPage(1);
                },
                activeTag: selectedTag || undefined
              }}
            />
          </div>

        </div>

      </motion.div>
    </div>
  );
}
