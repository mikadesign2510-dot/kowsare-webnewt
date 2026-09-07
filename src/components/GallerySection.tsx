import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { storage, GalleryAlbum } from '../lib/storage';
import { Link } from 'react-router-dom';
import { Camera, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import AlbumLightbox from './AlbumLightbox';

export default function GallerySection() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);

  useEffect(() => {
    const refresh = () => {
      const loaded = storage.getAlbums();
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const activeOnly = loaded.filter(a => a.isActive !== false);
      setAlbums(activeOnly.slice(0, 3)); // show top 3 active
    };
    refresh();

    // همگام‌سازی بی‌درنگ با دیتابیس سرور
    storage.syncAlbumsWithDB().then(serverAlbums => {
      if (serverAlbums && serverAlbums.length > 0) {
        serverAlbums.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const activeOnly = serverAlbums.filter(a => a.isActive !== false);
        setAlbums(activeOnly.slice(0, 3));
      }
    });

    const handleAlbumsChanged = (e: any) => {
      const updated = e.detail || storage.getAlbums();
      updated.sort((a: GalleryAlbum, b: GalleryAlbum) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const activeOnly = updated.filter((a: GalleryAlbum) => a.isActive !== false);
      setAlbums(activeOnly.slice(0, 3));
    };

    window.addEventListener('kowsar_albums_changed', handleAlbumsChanged);
    return () => window.removeEventListener('kowsar_albums_changed', handleAlbumsChanged);
  }, []);

  if (albums.length === 0) return null;

  return (
    <section className="py-10 md:py-16 bg-slate-50/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Distinct Gallery Box */}
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-slate-200/70 p-6 sm:p-8 md:p-12 relative overflow-hidden">
          
          {/* Decorative Blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-blue-100/50 rounded-full blur-3xl -mr-20 sm:-mr-32 -mt-20 sm:-mt-32 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-50/50 rounded-full blur-3xl -ml-20 sm:-ml-32 -mb-20 sm:-mb-32 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-10 gap-4 sm:gap-6">
            <div>
              <span className="text-blue-600 font-bold tracking-wider text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                نگارخانه تصاویر
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                تصاویر منتخب مرکز
              </h2>
            </div>
            <Link 
              to="/gallery" 
              className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors group bg-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-sm border border-slate-200 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md text-xs sm:text-sm w-full sm:w-auto justify-center"
            >
              مشاهده همه آلبوم‌ها
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform" />
            </Link>
          </div>

          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {albums.map((album, idx) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <button onClick={() => setSelectedAlbum(album)} className="w-full text-right group block bg-white rounded-2xl sm:rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-300">
                <div className="relative aspect-[16/11] sm:aspect-[4/3] overflow-hidden bg-slate-50">
                  <img 
                    src={album.coverImage}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-transparent transition-colors" />
                  
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold font-sans text-slate-700 shadow-sm flex items-center gap-1.5 border border-white/50">
                    <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                    <span>{album.images.length.toLocaleString('fa-IR')} تصویر</span>
                  </div>
                </div>
                
                <div className="p-4 sm:p-5 flex flex-col relative bg-white border-t border-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                      {album.category}
                    </span>
                    <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transform group-hover:-translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {album.title}
                  </h3>
                </div>
              </button>
            </motion.div>
          ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAlbum && (
          <AlbumLightbox 
            album={selectedAlbum} 
            onClose={() => setSelectedAlbum(null)} 
          />
        )}
      </AnimatePresence>
    </section>
  );
}
