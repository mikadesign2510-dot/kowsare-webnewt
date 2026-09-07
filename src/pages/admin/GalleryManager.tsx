import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Plus, Trash2, Edit, Check, X, Image as ImageIcon, 
  Link as LinkIcon, UploadCloud, Loader2, Video, Sparkles, 
  Info, CheckCircle2, AlertCircle, RefreshCw, Layers, Film, Play, ExternalLink, Clock, Crop, Eye, EyeOff, AlertTriangle, HardDrive
} from 'lucide-react';
import { storage, GalleryAlbum, NewsItem, GalleryImage } from '../../lib/storage';
import { uploadFileToServer, uploadMultipleFilesToServer } from '../../lib/uploadHelper';
import ImageCropperModal from '../../components/admin/ImageCropperModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import ServerImagePickerModal from '../../components/admin/ServerImagePickerModal';

// Helper to convert any Aparat link, code or iframe into standard embed frame URL
export function parseAparatEmbedUrl(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    return iframeSrcMatch[1];
  }
  const vMatch = trimmed.match(/aparat\.com\/v\/([a-zA-Z0-9]+)/i);
  if (vMatch && vMatch[1]) {
    return `https://www.aparat.com/video/video/embed/videohash/${vMatch[1]}/vt/frame`;
  }
  if (trimmed.includes('aparat.com/video/video/embed/')) {
    return trimmed;
  }
  if (/^[a-zA-Z0-9]{4,10}$/.test(trimmed)) {
    return `https://www.aparat.com/video/video/embed/videohash/${trimmed}/vt/frame`;
  }
  return trimmed;
}

export default function GalleryManager() {
  const [activeTab, setActiveTab] = useState<'albums' | 'videos'>('albums');
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  
  // Albums State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  
  // Album Form Fields
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCover, setNewCover] = useState('');
  const [newNewsId, setNewNewsId] = useState<string>('');
  const [newIsActive, setNewIsActive] = useState<boolean>(true);
  const [newImages, setNewImages] = useState<{url: string, type: 'image' | 'video', title?: string}[]>([]);

  // Video Management State
  const [isVideoFormOpen, setIsVideoFormOpen] = useState(false);
  const [editingVideoAlbumId, setEditingVideoAlbumId] = useState<string | null>(null);
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null);
  const [videoSourceType, setVideoSourceType] = useState<'aparat' | 'upload' | 'url'>('aparat');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCategory, setVideoCategory] = useState('رویدادها');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCover, setVideoCover] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [targetAlbumId, setTargetAlbumId] = useState<string>('new');
  const [previewVideoModal, setPreviewVideoModal] = useState<{ url: string; title: string; type?: string } | null>(null);
  const [deleteConfirmAlbum, setDeleteConfirmAlbum] = useState<GalleryAlbum | null>(null);
  const [deleteConfirmVideo, setDeleteConfirmVideo] = useState<{ albumId: string; imageIndex: number; title: string } | null>(null);

  // Universal Cropper Modal State
  const [cropperModal, setCropperModal] = useState<{
    isOpen: boolean;
    imageSrc: string | File | null;
    targetType: 'cover' | 'image' | 'videoCover';
    targetIndex?: number;
    initialRatio?: number | null;
  }>({
    isOpen: false,
    imageSrc: null,
    targetType: 'image',
    initialRatio: 16 / 9
  });

  const handleGalleryCropComplete = (croppedFile: File, previewUrl: string, uploadResult?: any) => {
    const finalUrl = uploadResult?.url || previewUrl;
    if (cropperModal.targetType === 'cover') {
      setNewCover(finalUrl);
    } else if (cropperModal.targetType === 'videoCover') {
      setVideoCover(finalUrl);
    } else if (cropperModal.targetType === 'image' && typeof cropperModal.targetIndex === 'number') {
      updateImageField(cropperModal.targetIndex, 'url', finalUrl);
    }
  };

  // Server Image Picker State
  const [serverPickerState, setServerPickerState] = useState<{
    isOpen: boolean;
    target: 'cover' | 'images' | 'videoCover';
  }>({
    isOpen: false,
    target: 'images'
  });

  const coverInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const videoCoverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const localAlbums = storage.getAlbums();
    setAlbums(localAlbums);
    
    // همگام‌سازی بی‌درنگ با دیتابیس سرور
    storage.syncAlbumsWithDB().then(serverAlbums => {
      if (serverAlbums && serverAlbums.length > 0) {
        setAlbums(serverAlbums);
      }
    });

    storage.syncNewsWithDB().then(setNews);

    const handleAlbumsChanged = (e: any) => {
      const updated = e.detail || storage.getAlbums();
      setAlbums(updated);
    };

    window.addEventListener('kowsar_albums_changed', handleAlbumsChanged);
    return () => window.removeEventListener('kowsar_albums_changed', handleAlbumsChanged);
  }, []);

  const handleToggleAlbumStatus = async (albumId: string, currentStatus: boolean, albumTitle: string) => {
    const nextStatus = !currentStatus;
    // Update locally and in DB
    await storage.toggleAlbumActive(albumId, nextStatus);
    const updatedAlbums = storage.getAlbums();
    setAlbums(updatedAlbums);
    
    setUploadStatusMsg(`وضعیت آلبوم «${albumTitle}» با موفقیت به ${nextStatus ? '«فعال و در حال نمایش در سایت»' : '«غیرفعال و مخفی»'} تغییر یافت.`);
    setTimeout(() => setUploadStatusMsg(null), 3500);
  };

  // Compute all videos from all albums
  const allVideos: { albumId: string; albumTitle: string; imageIndex: number; media: GalleryImage; category: string; date: string }[] = [];
  albums.forEach(album => {
    album.images.forEach((img, idx) => {
      if (img.type === 'video') {
        allVideos.push({
          albumId: album.id,
          albumTitle: album.title,
          imageIndex: idx,
          media: img,
          category: album.category,
          date: album.date
        });
      }
    });
  });

  const handleUploadCover = async (files: FileList | null | File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      setIsUploading(true);
      setUploadStatusMsg('در حال بهینه‌سازی و آپلود تصویر کاور در پوشه اختصاصی نگارخانه...');
      
      const result = await uploadFileToServer(file, 'gallery');
      if (result.success && result.url) {
        setNewCover(result.url);
        setUploadStatusMsg(result.message || 'تصویر کاور با موفقیت ثبت شد');
        setTimeout(() => setUploadStatusMsg(null), 3000);
      } else {
        alert(result.message || 'خطا در بارگذاری تصویر کاور');
      }
    } catch (err: any) {
      console.error('Cover upload error:', err);
      alert('خطا در پردازش تصویر کاور');
    } finally {
      setIsUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleUploadMultiple = async (fileList: FileList | null | File[]) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    try {
      setIsUploading(true);
      setUploadStatusMsg(`در حال تبدیل و بهینه‌سازی ${files.length} تصویر به فرمت WebP و ارسال به پوشه gallery...`);
      
      const result = await uploadMultipleFilesToServer(files, 'gallery');
      if (result.success && result.items.length > 0) {
        const mapped = result.items.map(item => ({
          url: item.url,
          type: 'image' as const,
          title: item.filename.replace(/\.webp$/i, '').replace(/[-_]/g, ' ')
        }));
        
        setNewImages(prev => [...prev, ...mapped]);
        
        if (!newCover && mapped[0]?.url) {
          setNewCover(mapped[0].url);
        }

        setUploadStatusMsg(result.message || `${mapped.length} تصویر با موفقیت اضافه شد`);
        setTimeout(() => setUploadStatusMsg(null), 3500);
      } else {
        alert(result.message || 'خطا در آپلود گروهی تصاویر');
      }
    } catch (err: any) {
      console.error('Multi upload error:', err);
      alert('خطا در پردازش گروهی تصاویر');
    } finally {
      setIsUploading(false);
      if (imagesInputRef.current) imagesInputRef.current.value = '';
    }
  };

  // Upload video file directly to server (in /uploads/videos)
  const handleUploadVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadStatusMsg('در حال آپلود فایل ویدیویی روی سرور در پوشه videos...');
      const res = await uploadFileToServer(file, 'videos');
      if (res.success && res.url) {
        setVideoUrl(res.url);
        if (!videoTitle) {
          setVideoTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
        }
        setUploadStatusMsg('فایل ویدیو با موفقیت روی سرور بارگذاری شد');
        setTimeout(() => setUploadStatusMsg(null), 3000);
      } else {
        alert('خطا در آپلود ویدیو: ' + (res.message || ''));
      }
    } catch (err: any) {
      alert('خطا در بارگذاری ویدیو: ' + (err.message || ''));
    } finally {
      setIsUploading(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  // Upload video poster/thumbnail
  const handleUploadVideoCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadStatusMsg('در حال بهینه‌سازی پوستر ویدیو در پوشه videos...');
      const res = await uploadFileToServer(file, 'videos');
      if (res.success && res.url) {
        setVideoCover(res.url);
        setUploadStatusMsg('پوستر ویدیو ثبت شد');
        setTimeout(() => setUploadStatusMsg(null), 2500);
      } else {
        alert('خطا در آپلود پوستر: ' + (res.message || ''));
      }
    } catch (err: any) {
      alert('خطا در بارگذاری پوستر ویدیو');
    } finally {
      setIsUploading(false);
      if (videoCoverInputRef.current) videoCoverInputRef.current.value = '';
    }
  };

  const handleSaveAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('لطفاً عنوان آلبوم را وارد کنید.');
      return;
    }
    if (!newCategory.trim()) {
      alert('لطفاً دسته‌بندی آلبوم را مشخص کنید.');
      return;
    }
    if (!newCover.trim()) {
      alert('لطفاً یک تصویر کاور برای آلبوم انتخاب یا آپلود کنید.');
      return;
    }
    if (newImages.length === 0) {
      alert('لطفاً حداقل یک تصویر یا ویدئو به این آلبوم اضافه کنید.');
      return;
    }

    const images = newImages.map((item, index) => ({
      id: `media-${Date.now()}-${index}`,
      url: item.url,
      type: item.type,
      title: item.title || `${newTitle} - فایل ${index + 1}`
    }));

    if (editingId) {
      storage.updateAlbum(editingId, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory.trim(),
        coverImage: newCover.trim(),
        images: images,
        newsId: newNewsId ? parseInt(newNewsId) : undefined,
        isActive: newIsActive
      });
    } else {
      storage.addAlbum({
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory.trim(),
        coverImage: newCover.trim(),
        date: new Date().toLocaleDateString('fa-IR'),
        images: images,
        newsId: newNewsId ? parseInt(newNewsId) : undefined,
        isActive: newIsActive
      });
    }

    setAlbums(storage.getAlbums());
    setIsFormOpen(false);
    setEditingId(null);
    resetForm();
  };

  const openEditForm = (album: GalleryAlbum) => {
    setEditingId(album.id);
    setNewTitle(album.title);
    setNewDesc(album.description || '');
    setNewCategory(album.category);
    setNewCover(album.coverImage);
    setNewNewsId(album.newsId ? album.newsId.toString() : '');
    setNewIsActive(album.isActive !== false);
    setNewImages(album.images.map(img => ({ url: img.url, type: img.type || 'image', title: img.title })));
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewCategory('');
    setNewCover('');
    setNewNewsId('');
    setNewIsActive(true);
    setNewImages([]);
    setEditingId(null);
    setUploadStatusMsg(null);
  };

  const handleDeleteAlbum = (albumOrId: GalleryAlbum | string) => {
    if (typeof albumOrId === 'string') {
      const found = albums.find(a => a.id === albumOrId);
      if (found) {
        setDeleteConfirmAlbum(found);
      } else {
        setDeleteConfirmAlbum({ id: albumOrId, title: 'آلبوم انتخاب شده', images: [] } as any);
      }
    } else {
      setDeleteConfirmAlbum(albumOrId);
    }
  };

  const executeDeleteAlbum = async (id: string) => {
    setDeleteConfirmAlbum(null);
    await storage.deleteAlbum(id);
    setAlbums(storage.getAlbums());
  };

  // Video management handlers
  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      alert('لطفاً عنوان ویدیو را وارد کنید.');
      return;
    }
    if (!videoUrl.trim()) {
      alert('لطفاً آدرس ویدیو یا کد آپارات را مشخص نمایید.');
      return;
    }

    const finalVideoUrl = videoSourceType === 'aparat' ? parseAparatEmbedUrl(videoUrl) : videoUrl.trim();
    const finalCover = videoCover.trim() || 'https://picsum.photos/seed/7565/1200/800';

    const currentAlbums = storage.getAlbums();

    if (editingVideoAlbumId && editingVideoIndex !== null) {
      // Editing existing video in an album
      const album = currentAlbums.find(a => a.id === editingVideoAlbumId);
      if (album && album.images[editingVideoIndex]) {
        album.images[editingVideoIndex] = {
          ...album.images[editingVideoIndex],
          url: finalVideoUrl,
          title: videoTitle.trim(),
          type: 'video'
        };
        storage.saveAlbums(currentAlbums);
      }
    } else if (targetAlbumId === 'new') {
      // Create a brand new dedicated video album
      storage.addAlbum({
        title: videoTitle.trim(),
        description: videoDesc.trim() || (videoDuration ? `مدت زمان: ${videoDuration}` : ''),
        category: videoCategory.trim() || 'ویدیوها',
        coverImage: finalCover,
        date: new Date().toLocaleDateString('fa-IR'),
        images: [
          {
            id: `video-${Date.now()}`,
            url: finalVideoUrl,
            type: 'video',
            title: videoTitle.trim()
          }
        ]
      });
    } else {
      // Append video to existing album
      const album = currentAlbums.find(a => a.id === targetAlbumId);
      if (album) {
        album.images.push({
          id: `video-${Date.now()}`,
          url: finalVideoUrl,
          type: 'video',
          title: videoTitle.trim()
        });
        storage.saveAlbums(currentAlbums);
      }
    }

    setAlbums(storage.getAlbums());
    setIsVideoFormOpen(false);
    resetVideoForm();
  };

  const resetVideoForm = () => {
    setVideoTitle('');
    setVideoCategory('رویدادها');
    setVideoUrl('');
    setVideoCover('');
    setVideoDuration('');
    setVideoDesc('');
    setTargetAlbumId('new');
    setEditingVideoAlbumId(null);
    setEditingVideoIndex(null);
    setUploadStatusMsg(null);
  };

  const openEditVideo = (videoItem: typeof allVideos[0]) => {
    setEditingVideoAlbumId(videoItem.albumId);
    setEditingVideoIndex(videoItem.imageIndex);
    setVideoTitle(videoItem.media.title || '');
    setVideoUrl(videoItem.media.url);
    const album = albums.find(a => a.id === videoItem.albumId);
    setVideoCategory(album?.category || 'ویدیوها');
    setVideoCover(album?.coverImage || '');
    setVideoDesc(album?.description || '');
    setTargetAlbumId(videoItem.albumId);
    setVideoSourceType(videoItem.media.url.includes('aparat.com') ? 'aparat' : (videoItem.media.url.startsWith('/uploads') ? 'upload' : 'url'));
    setIsVideoFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVideo = (albumId: string, imageIndex: number, title?: string) => {
    setDeleteConfirmVideo({ albumId, imageIndex, title: title || 'این ویدیو' });
  };

  const executeDeleteVideo = () => {
    if (!deleteConfirmVideo) return;
    const { albumId, imageIndex } = deleteConfirmVideo;
    setDeleteConfirmVideo(null);
    const currentAlbums = storage.getAlbums();
    const album = currentAlbums.find(a => a.id === albumId);
    if (album) {
      album.images.splice(imageIndex, 1);
      // If album is now empty, delete album as well
      if (album.images.length === 0) {
        storage.deleteAlbum(albumId);
      } else {
        storage.saveAlbums(currentAlbums);
      }
      setAlbums(storage.getAlbums());
    }
  };

  const addImageField = () => setNewImages([...newImages, { url: '', type: 'image', title: '' }]);
  const addVideoField = () => setNewImages([...newImages, { url: '', type: 'video', title: '' }]);
  const updateImageField = (index: number, field: string, value: string) => {
    const updated = [...newImages];
    updated[index] = { ...updated[index], [field]: value };
    setNewImages(updated);
  };
  const removeImageField = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 min-h-[500px]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-1 flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-600" />
            مدیریت نگارخانه و ویدیوها
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-light">
            مدیریت دسته‌بندی‌شده آلبوم‌های تصویری و کلیپ‌های ویدیویی (آپارات و MP4) با پوشه‌بندی اختصاصی در سرور
          </p>
        </div>
        
        {/* Top Action Button */}
        <div className="flex items-center gap-2">
          {activeTab === 'albums' && (
            <button
              type="button"
              onClick={async () => {
                setIsUploading(true);
                setUploadStatusMsg('در حال همگام‌سازی آلبوم‌ها با پایگاه داده سرور...');
                const list = await storage.syncAlbumsWithDB();
                setAlbums(list);
                setIsUploading(false);
                setUploadStatusMsg('همگام‌سازی با موفقیت انجام شد');
                setTimeout(() => setUploadStatusMsg(null), 2500);
              }}
              className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-2xl font-bold transition-all text-xs border border-slate-200"
              title="بروزرسانی و همگام‌سازی با سرور"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
              <span>همگام‌سازی</span>
            </button>
          )}

          {activeTab === 'albums' && !isFormOpen && (
            <button 
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-bold transition-all shadow-[0_4px_15px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              ایجاد آلبوم جدید
            </button>
          )}

          {activeTab === 'videos' && !isVideoFormOpen && (
            <button 
              onClick={() => { resetVideoForm(); setIsVideoFormOpen(true); }}
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-2xl font-bold transition-all shadow-[0_4px_15px_rgba(225,29,72,0.25)] hover:-translate-y-0.5 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              افزودن ویدیوی جدید
            </button>
          )}
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl mb-8 border border-slate-200/80 w-fit">
        <button
          type="button"
          onClick={() => { setActiveTab('albums'); setIsVideoFormOpen(false); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'albums' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-blue-600" />
          <span>آلبوم‌های تصویری</span>
          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[11px] font-black mr-1">
            {albums.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('videos'); setIsFormOpen(false); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'videos' 
              ? 'bg-white text-rose-700 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Film className="w-4 h-4 text-rose-600" />
          <span>مدیریت فیلم و ویدئوها</span>
          <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[11px] font-black mr-1">
            {allVideos.length}
          </span>
        </button>
      </div>

      {/* -------------------- TAB 1: ALBUMS MANAGEMENT -------------------- */}
      {activeTab === 'albums' && (
        <>
          {isFormOpen ? (
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200 mb-8 space-y-8">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div>
                  <h3 className="font-black text-xl text-slate-800">
                    {editingId ? 'ویرایش آلبوم تصاویر' : 'ایجاد آلبوم جدید در نگارخانه'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">مشخصات آلبوم و تصاویر را تکمیل و در پوشه اختصاصی gallery ذخیره کنید.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => { setIsFormOpen(false); resetForm(); }} 
                  className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-xl border border-slate-200 transition-colors"
                  title="بستن فرم"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Status Alert */}
              {uploadStatusMsg && (
                <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl flex items-center gap-3 text-sm font-bold animate-fadeIn">
                  <RefreshCw className={`w-5 h-5 text-blue-600 ${isUploading ? 'animate-spin' : ''}`} />
                  <span>{uploadStatusMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveAlbum} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">عنوان آلبوم *</label>
                    <input 
                      type="text" 
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="مثال: گزارش تصویری جشن فارغ‌التحصیلی دانشجویان"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">دسته‌بندی موضوعی *</label>
                    <input 
                      type="text" 
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      placeholder="مثال: مراسم‌ها، کارگاه‌های آموزشی، ورزشی، فرهنگی"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">توضیحات تکمیلی آلبوم (اختیاری)</label>
                    <textarea 
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      placeholder="شرح مختصری درباره رویداد، تاریخ برگزاری و جزئیات تصاویر..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none"
                    />
                  </div>

                  {/* Cover Image Upload Section */}
                  <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4">
                    <label className="block text-sm font-bold text-slate-800 flex items-center justify-between">
                      <span>تصویر کاور (شاخص) آلبوم * (ذخیره در پوشه /uploads/gallery)</span>
                      {newCover && <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> کاور انتخاب شده</span>}
                    </label>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                      <div className="lg:col-span-2 space-y-3">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={coverInputRef}
                          onChange={(e) => handleUploadCover(e.target.files)}
                        />
                        
                        {/* Drag and Drop Box for Cover */}
                        <div 
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingCover(true); }}
                          onDragLeave={() => setIsDraggingCover(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingCover(false);
                            handleUploadCover(e.dataTransfer.files);
                          }}
                          className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                            isDraggingCover ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full flex flex-col items-center justify-center cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                            </div>
                            <span className="font-bold text-sm text-slate-700">
                              {isUploading ? 'در حال آپلود و بهینه‌سازی...' : 'برای آپلود کاور کلیک کنید یا تصویر را اینجا رها کنید'}
                            </span>
                            <span className="text-xs text-slate-400 mt-1">تبدیل خودکار به WebP • حجم تا ۵ مگابایت • ذخیره در /uploads/gallery</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setServerPickerState({ isOpen: true, target: 'cover' })}
                            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                          >
                            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                            <span>مخزن سرور</span>
                          </button>
                          <span className="text-xs text-slate-400 font-bold whitespace-nowrap">یا آدرس (URL):</span>
                          <input 
                            type="text" 
                            value={newCover}
                            onChange={e => setNewCover(e.target.value)}
                            className="flex-grow px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-xs text-left"
                            dir="ltr"
                            placeholder="https://... یا /uploads/gallery/cover.webp"
                          />
                        </div>
                      </div>

                      {/* Cover Preview */}
                      <div className="h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center relative shadow-inner group">
                        {newCover ? (
                          <>
                            <img src={newCover} alt="کاور آلبوم" className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-lg font-bold">
                              پیش‌نمایش کاور
                            </div>
                            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setCropperModal({
                                  isOpen: true,
                                  imageSrc: newCover,
                                  targetType: 'cover',
                                  initialRatio: 16 / 9
                                })}
                                className="px-2.5 py-1 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow cursor-pointer transition-all"
                                title="برش و تنظیم کادر کاور"
                              >
                                <Crop className="w-3.5 h-3.5" />
                                <span>برش (Crop)</span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-slate-400 text-xs p-4">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                            هنوز تصویری برای کاور انتخاب نشده است
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* News link option */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4 text-blue-500" />
                      اتصال به خبر مرتبط (اختیاری)
                    </label>
                    <select
                      value={newNewsId}
                      onChange={e => setNewNewsId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">-- بدون اتصال مستقیم (آلبوم مستقل در نگارخانه) --</option>
                      {news.map(n => (
                        <option key={n.id} value={n.id}>خبر شماره {n.id}: {n.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Active / Inactive Status Toggle Switch */}
                  <div className="md:col-span-2 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 p-4 sm:p-5 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold transition-all shadow-sm ${
                        newIsActive ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-slate-300 text-slate-600'
                      }`}>
                        {newIsActive ? <Check className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-800">وضعیت انتشار و نمایش در وب‌سایت</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            newIsActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {newIsActive ? 'فعال (در حال نمایش)' : 'غیرفعال (مخفی)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {newIsActive 
                            ? 'این آلبوم پس از ذخیره در بخش نگارخانه و صفحه اصلی سایت برای همه بازدیدکنندگان نمایش داده می‌شود.' 
                            : 'این آلبوم در سایت مخفی خواهد بود و فقط برای مدیریت در این بخش ذخیره می‌گردد.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setNewIsActive(!newIsActive)}
                        className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          newIsActive ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                        role="switch"
                        aria-checked={newIsActive}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                            newIsActive ? 'translate-x-0' : '-translate-x-8'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Images List Section */}
                <div className="border-t border-slate-200 pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="block text-base font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600" />
                        تصاویر آلبوم ({newImages.length} مورد ثبت شده) *
                      </label>
                      <p className="text-xs text-slate-400 mt-0.5">می‌توانید چندین تصویر را همزمان انتخاب یا رها کنید.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setServerPickerState({ isOpen: true, target: 'images' })}
                        className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <HardDrive className="w-4 h-4 text-blue-400" />
                        <span>مخزن تصاویر سرور</span>
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        ref={imagesInputRef}
                        onChange={(e) => handleUploadMultiple(e.target.files)}
                      />
                      <button 
                        type="button"
                        onClick={() => imagesInputRef.current?.click()}
                        disabled={isUploading}
                        className="text-xs font-bold text-white bg-blue-600 px-4 py-2.5 rounded-xl hover:bg-blue-700 flex items-center gap-1.5 transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        آپلود فایل جدید
                      </button>
                      <button 
                        type="button"
                        onClick={addVideoField}
                        className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2.5 rounded-xl hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
                      >
                        <Video className="w-4 h-4" />
                        + افزودن ویدئو
                      </button>
                      <button 
                        type="button"
                        onClick={addImageField}
                        className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        + افزودن دستی لینک
                      </button>
                    </div>
                  </div>

                  {/* Multi Drag and Drop Area */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingGallery(true); }}
                    onDragLeave={() => setIsDraggingGallery(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingGallery(false);
                      handleUploadMultiple(e.dataTransfer.files);
                    }}
                    onClick={() => imagesInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDraggingGallery ? 'border-blue-500 bg-blue-50/60' : 'border-slate-300 hover:border-blue-400 bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
                      </div>
                      <span className="font-bold text-sm text-slate-800">
                        برای آپلود سریع گروهی، تصاویر را اینجا بکشید و رها کنید یا کلیک نمایید
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        پشتیبانی از انتخاب همزمان ده‌ها عکس • تبدیل خودکار به WebP • ذخیره در پوشه /uploads/gallery
                      </span>
                    </div>
                  </div>

                  {/* Upload Guidelines Box */}
                  <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-100/80 rounded-2xl p-4 sm:p-5 text-slate-700 space-y-3">
                    <div className="flex items-center gap-2 text-blue-800 font-black text-sm">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>راهنمای فنی استاندارد بارگذاری تصاویر نگارخانه</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
                      <div className="bg-white/80 p-3 rounded-xl border border-blue-50 shadow-2xs">
                        <span className="font-bold text-blue-900 block mb-1">ابعاد و نسبت تصویر:</span>
                        نسبت استاندارد ۱۶:۹ (حداقل ۱۲۸۰×۷۲۰ یا ۱۹۲۰×۱۰۸۰ پیکسل) جهت نمایش بدون برش در اسلایدر.
                      </div>

                      <div className="bg-white/80 p-3 rounded-xl border border-blue-50 shadow-2xs">
                        <span className="font-bold text-blue-900 block mb-1">محدودیت حجم و فشرده‌سازی:</span>
                        حداکثر حجم مجاز هر فایل ۲۰ مگابایت است. سیستم تصاویر را خودکار به فرمت کم‌حجم WebP تبدیل می‌کند.
                      </div>

                      <div className="bg-white/80 p-3 rounded-xl border border-blue-50 shadow-2xs">
                        <span className="font-bold text-blue-900 block mb-1">پوشه اختصاصی سرور:</span>
                        تمام تصاویر به صورت سازمان‌یافته در دایرکتوری <code className="font-mono text-blue-700 font-bold">/uploads/gallery</code> ذخیره می‌گردند.
                      </div>
                    </div>
                  </div>

                  {/* Images Thumbnails Grid */}
                  {newImages.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                      {newImages.map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2 relative group hover:border-blue-300 transition-all">
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-100 flex items-center justify-center">
                            {item.type === 'video' ? (
                              <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white p-2 text-center">
                                <Video className="w-8 h-8 text-rose-500 mb-1" />
                                <span className="text-[10px] text-slate-300 font-mono truncate max-w-full px-2">{item.url || 'آدرس ویدئو'}</span>
                              </div>
                            ) : (
                              <img 
                                src={item.url} 
                                alt={item.title || `تصویر ${idx + 1}`} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/7563/1200/800';
                                }}
                              />
                            )}
                            
                            <div className="absolute top-2 right-2 flex items-center gap-1">
                              <span className="bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                                #{idx + 1}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm ${
                                item.type === 'video' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white'
                              }`}>
                                {item.type === 'video' ? 'ویدئو' : 'عکس'}
                              </span>
                            </div>

                            {item.url === newCover && (
                              <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                کاور آلبوم
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <input 
                              type="text" 
                              value={item.title || ''}
                              onChange={e => updateImageField(idx, 'title', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                              placeholder="توضیح یا عنوان تصویر (اختیاری)"
                            />
                            <input 
                              type="text" 
                              value={item.url}
                              onChange={e => updateImageField(idx, 'url', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-left focus:ring-2 focus:ring-blue-500"
                              dir="ltr"
                              placeholder="URL..."
                              required
                            />
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-1">
                            <div className="flex items-center gap-1">
                              {item.type === 'image' && item.url && (
                                <button
                                  type="button"
                                  onClick={() => setCropperModal({
                                    isOpen: true,
                                    imageSrc: item.url,
                                    targetType: 'image',
                                    targetIndex: idx,
                                    initialRatio: 16 / 9
                                  })}
                                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                  title="برش و کادربندی این تصویر"
                                >
                                  <Crop className="w-3 h-3" />
                                  برش
                                </button>
                              )}
                              {item.type === 'image' && item.url && item.url !== newCover && (
                                <button
                                  type="button"
                                  onClick={() => setNewCover(item.url)}
                                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                                >
                                  کاور
                                </button>
                              )}
                            </div>

                            <button 
                              type="button" 
                              onClick={() => removeImageField(idx)}
                              className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors text-xs flex items-center gap-1"
                              title="حذف این تصویر"
                            >
                              <Trash2 className="w-4 h-4" />
                              حذف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                  <button 
                    type="button"
                    onClick={() => { setIsFormOpen(false); resetForm(); }}
                    className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
                  >
                    انصراف
                  </button>
                  <button 
                    type="submit"
                    disabled={isUploading}
                    className="px-8 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all text-sm disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    {editingId ? 'ذخیره تغییرات آلبوم' : 'ثبت و انتشار آلبوم'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-bold text-base mb-1">هنوز هیچ آلبومی در نگارخانه ثبت نشده است</p>
                  <p className="text-slate-400 text-xs mb-4">می‌توانید با کلیک روی دکمه زیر اولین آلبوم را ایجاد نمایید.</p>
                  <button 
                    onClick={() => { resetForm(); setIsFormOpen(true); }}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن اولین آلبوم
                  </button>
                </div>
              ) : (
                albums.map(album => {
                  const isActive = album.isActive !== false;
                  return (
                    <div 
                      key={album.id} 
                      className={`bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between ${
                        isActive ? 'border-slate-200/90' : 'border-amber-300 bg-amber-50/20'
                      }`}
                    >
                      <div>
                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                          <img 
                            src={album.coverImage} 
                            alt={album.title} 
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                              !isActive ? 'grayscale-[40%] opacity-85' : ''
                            }`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/7563/1200/800';
                            }}
                          />
                          
                          {/* Active / Inactive Status Badge on Cover */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAlbumStatus(album.id, isActive, album.title);
                              }}
                              className={`px-2.5 py-1 rounded-xl backdrop-blur-md text-[11px] font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white' 
                                  : 'bg-amber-600/90 hover:bg-amber-600 text-white ring-2 ring-white/50'
                              }`}
                              title={isActive ? 'کلیک کنید تا آلبوم غیرفعال و مخفی شود' : 'کلیک کنید تا آلبوم فعال و در سایت نمایان شود'}
                            >
                              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'}`}></span>
                              <span>{isActive ? 'فعال (در سایت)' : 'غیرفعال (مخفی)'}</span>
                            </button>
                          </div>

                          <div className="absolute bottom-3 right-3 bg-slate-900/75 text-white text-xs px-2.5 py-1 rounded-xl backdrop-blur-md font-bold shadow-sm flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>{album.images.length} تصویر</span>
                          </div>

                          {album.images.some(img => img.type === 'video') && (
                            <div className="absolute top-3 left-3 bg-rose-600/90 text-white text-[10px] px-2 py-0.5 rounded-lg backdrop-blur-md font-bold shadow-sm flex items-center gap-1">
                              <Film className="w-3 h-3" />
                              شامل ویدئو
                            </div>
                          )}
                        </div>
                        
                        <div className="p-5">
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-md">{album.category}</span>
                            <span>{album.date}</span>
                          </div>
                          
                          <h4 className="font-black text-slate-800 text-base line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">
                            {album.title}
                          </h4>
                          
                          {album.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                              {album.description}
                            </p>
                          )}
                          
                          {album.newsId && (
                            <div className="text-xs text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 font-medium">
                              <LinkIcon className="w-3.5 h-3.5" />
                              متصل به خبر شناسه {album.newsId}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-slate-50/50">
                        {/* Toggle Active Button */}
                        <button 
                          type="button"
                          onClick={() => handleToggleAlbumStatus(album.id, isActive, album.title)}
                          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                            isActive
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80'
                          }`}
                          title={isActive ? 'غیرفعال‌سازی (مخفی کردن از سایت)' : 'فعال‌سازی (نمایش در سایت)'}
                        >
                          {isActive ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4 text-emerald-600" />}
                          <span>{isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => openEditForm(album)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                            title="ویرایش آلبوم"
                          >
                            <Edit className="w-4 h-4" />
                            ویرایش
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteAlbum(album)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
                            title="حذف آلبوم"
                          >
                            <Trash2 className="w-4 h-4" />
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* -------------------- TAB 2: DEDICATED VIDEOS MANAGEMENT -------------------- */}
      {activeTab === 'videos' && (
        <>
          {isVideoFormOpen ? (
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200 mb-8 space-y-8 animate-fadeIn">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div>
                  <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                    <Film className="w-5 h-5 text-rose-600" />
                    {editingVideoAlbumId ? 'ویرایش اطلاعات ویدیو' : 'ثبت و مدیریت ویدیوی جدید'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">پشتیبانی از کدهای آپارات، ویدیوهای MP4 سرور (پوشه videos) و لینک مستقیم</p>
                </div>
                <button 
                  type="button"
                  onClick={() => { setIsVideoFormOpen(false); resetVideoForm(); }} 
                  className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-xl border border-slate-200 transition-colors"
                  title="بستن فرم"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {uploadStatusMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-sm font-bold">
                  <RefreshCw className={`w-5 h-5 text-rose-600 ${isUploading ? 'animate-spin' : ''}`} />
                  <span>{uploadStatusMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveVideo} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">عنوان یا نام ویدیو *</label>
                    <input 
                      type="text" 
                      value={videoTitle}
                      onChange={e => setVideoTitle(e.target.value)}
                      placeholder="مثال: کلیپ معرفی امکانات و کارگاه‌های دانشگاه علمی کاربردی کوثر"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">دسته‌بندی موضوعی ویدیو *</label>
                    <select
                      value={videoCategory}
                      onChange={e => setVideoCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 text-sm"
                    >
                      <option value="رویدادها">رویدادها و مراسم‌ها</option>
                      <option value="معرفی مرکز">معرفی دانشگاه و امکانات</option>
                      <option value="آموزشی">آموزشی و کارگاه‌های تخصصی</option>
                      <option value="مصاحبه">مصاحبه و گفتگو با اساتید</option>
                      <option value="مستند">مستند و گزارش ویژه</option>
                      <option value="متفرقه">سایر کلیپ‌ها</option>
                    </select>
                  </div>

                  {/* Video Source Type Selector */}
                  <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                    <label className="block text-sm font-bold text-slate-800">
                      انتخاب منبع ویدیو *
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setVideoSourceType('aparat')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          videoSourceType === 'aparat' 
                            ? 'bg-rose-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        آپارات (کد امبد یا لینک آپارات)
                      </button>

                      <button
                        type="button"
                        onClick={() => setVideoSourceType('upload')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          videoSourceType === 'upload' 
                            ? 'bg-rose-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        آپلود مستقیم فایل ویدیویی روی سرور (/uploads/videos)
                      </button>

                      <button
                        type="button"
                        onClick={() => setVideoSourceType('url')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          videoSourceType === 'url' 
                            ? 'bg-rose-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        لینک مستقیم اینترنتی (MP4/WebM)
                      </button>
                    </div>

                    {videoSourceType === 'aparat' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500">
                          لینک صفحه ویدیو، شناسه آپارات یا کد iframe را وارد نمایید:
                        </label>
                        <input 
                          type="text" 
                          value={videoUrl}
                          onChange={e => setVideoUrl(e.target.value)}
                          placeholder="مثال: https://www.aparat.com/v/Jb1k9 یا Jb1k9"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-mono text-xs text-left"
                          dir="ltr"
                          required
                        />
                        <p className="text-[11px] text-slate-400">
                          سیستم به صورت خودکار لینک آپارات یا کد فریم را شناسایی و به پلیر بدون تبلیغ تبدیل می‌کند.
                        </p>
                      </div>
                    )}

                    {videoSourceType === 'upload' && (
                      <div className="space-y-3">
                        <input 
                          type="file" 
                          accept="video/mp4,video/webm,video/ogg"
                          className="hidden" 
                          ref={videoFileInputRef}
                          onChange={handleUploadVideoFile}
                        />
                        <div 
                          onClick={() => videoFileInputRef.current?.click()}
                          className="border-2 border-dashed border-rose-300 hover:border-rose-500 rounded-2xl p-6 text-center cursor-pointer bg-rose-50/40 hover:bg-rose-50/70 transition-all"
                        >
                          <Video className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-800">
                            {isUploading ? 'در حال آپلود ویدیو به سرور...' : 'برای انتخاب و آپلود فایل ویدیویی کلیک کنید'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">فرمت‌های مجاز: MP4, WebM • ذخیره مستقیم در پوشه /uploads/videos</p>
                        </div>
                        {videoUrl && (
                          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 truncate" dir="ltr">
                            <span className="font-sans font-bold text-emerald-600 shrink-0">مسیر فایل:</span>
                            <span className="truncate">{videoUrl}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {videoSourceType === 'url' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500">
                          آدرس مستقیم فایل ویدیویی (URL):
                        </label>
                        <input 
                          type="text" 
                          value={videoUrl}
                          onChange={e => setVideoUrl(e.target.value)}
                          placeholder="https://example.com/videos/campus-tour.mp4"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-mono text-xs text-left"
                          dir="ltr"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Video Thumbnail / Poster */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      تصویر کاور یا پوستر ویدیو (اختیاری)
                    </label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      ref={videoCoverInputRef}
                      onChange={handleUploadVideoCover}
                    />
                    <div className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={() => setServerPickerState({ isOpen: true, target: 'videoCover' })}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                        title="انتخاب از مخزن سرور"
                      >
                        <HardDrive className="w-4 h-4 text-blue-400" />
                        <span>مخزن سرور</span>
                      </button>
                      <input 
                        type="text" 
                        value={videoCover}
                        onChange={e => setVideoCover(e.target.value)}
                        placeholder="/uploads/videos/poster.webp یا لینک تصویر"
                        className="flex-grow px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-mono text-xs text-left"
                        dir="ltr"
                      />
                      {videoCover && (
                        <button
                          type="button"
                          onClick={() => setCropperModal({
                            isOpen: true,
                            imageSrc: videoCover,
                            targetType: 'videoCover',
                            initialRatio: 16 / 9
                          })}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                          title="برش و تنظیم کادر پوستر ویدیو"
                        >
                          <Crop className="w-4 h-4" />
                          برش
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => videoCoverInputRef.current?.click()}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1 shrink-0"
                      >
                        <UploadCloud className="w-4 h-4" />
                        آپلود
                      </button>
                    </div>
                  </div>

                  {/* Video Duration */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      مدت زمان ویدیو (اختیاری)
                    </label>
                    <input 
                      type="text" 
                      value={videoDuration}
                      onChange={e => setVideoDuration(e.target.value)}
                      placeholder="مثال: ۰۳:۴۵ یا ۸ دقیقه"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 text-sm"
                    />
                  </div>

                  {/* Target Album Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      انتساب به آلبوم در نگارخانه
                    </label>
                    <select
                      value={targetAlbumId}
                      onChange={e => setTargetAlbumId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 text-sm"
                    >
                      <option value="new">✨ ایجاد آلبوم ویدیویی مجزا و جدید در نگارخانه با همین عنوان</option>
                      {albums.map(a => (
                        <option key={a.id} value={a.id}>افزودن به آلبوم موجود: {a.title} ({a.category})</option>
                      ))}
                    </select>
                  </div>

                  {/* Video Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">توضیحات ویدیو (اختیاری)</label>
                    <textarea 
                      value={videoDesc}
                      onChange={e => setVideoDesc(e.target.value)}
                      placeholder="توضیحات و گزارش مربوط به این ویدیو..."
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 text-sm h-20 resize-none"
                    />
                  </div>
                </div>

                {/* Real-time Video Preview Player in Admin */}
                {videoUrl && (
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5" />
                        پیش‌نمایش زنده پخش ویدیو در پنل
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{videoUrl}</span>
                    </div>

                    <div className="w-full max-w-2xl mx-auto rounded-xl overflow-hidden aspect-video bg-black relative shadow-lg">
                      {videoSourceType === 'aparat' || videoUrl.includes('aparat.com') ? (
                        <iframe 
                          src={parseAparatEmbedUrl(videoUrl)} 
                          title="پیش‌نمایش ویدیو آپارات"
                          allowFullScreen
                          className="w-full h-full border-none"
                        />
                      ) : (
                        <video 
                          src={videoUrl} 
                          controls 
                          poster={videoCover || undefined}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button 
                    type="button"
                    onClick={() => { setIsVideoFormOpen(false); resetVideoForm(); }}
                    className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
                  >
                    انصراف
                  </button>
                  <button 
                    type="submit"
                    disabled={isUploading}
                    className="px-8 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all text-sm disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    {editingVideoAlbumId ? 'ذخیره تغییرات ویدیو' : 'ثبت و انتشار ویدیو'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {allVideos.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Film className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-bold text-base mb-1">هنوز هیچ ویدیویی در نگارخانه ثبت نشده است</p>
                  <p className="text-slate-400 text-xs mb-4">می‌توانید کدهای آپارات یا ویدیوهای MP4 دانشگاه را در این بخش مدیریت نمایید.</p>
                  <button 
                    onClick={() => { resetVideoForm(); setIsVideoFormOpen(true); }}
                    className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن اولین ویدیو
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allVideos.map((videoItem, index) => (
                    <div 
                      key={`${videoItem.albumId}-${videoItem.imageIndex}-${index}`}
                      className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Video Thumbnail with Play Badge */}
                        <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
                          {videoItem.media.url.includes('aparat.com') ? (
                            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                              <Film className="w-12 h-12 text-rose-500 mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                              <span className="text-xs text-white font-bold line-clamp-1">{videoItem.media.title || videoItem.albumTitle}</span>
                              <span className="text-[10px] text-rose-300 font-mono mt-1">آپارات (Aparat Embed)</span>
                            </div>
                          ) : (
                            <video 
                              src={videoItem.media.url}
                              className="w-full h-full object-cover"
                            />
                          )}

                          <button 
                            type="button"
                            onClick={() => setPreviewVideoModal({ url: videoItem.media.url, title: videoItem.media.title || videoItem.albumTitle })}
                            className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition-colors group cursor-pointer"
                            title="پخش پیش‌نمایش ویدیو"
                          >
                            <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-white mr-0.5" />
                            </div>
                          </button>

                          <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-lg font-bold">
                            {videoItem.category}
                          </div>
                        </div>

                        <div className="p-5">
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span>{videoItem.date}</span>
                            <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                              {videoItem.media.url.includes('aparat.com') ? 'ویدیو آپارات' : 'فایل ویدیو سرور'}
                            </span>
                          </div>

                          <h4 className="font-black text-slate-800 text-sm line-clamp-2 mb-2 group-hover:text-rose-600 transition-colors">
                            {videoItem.media.title || videoItem.albumTitle}
                          </h4>

                          <p className="text-xs text-slate-500 line-clamp-1 mb-2 font-mono" dir="ltr">
                            {videoItem.media.url}
                          </p>

                          <div className="text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                            آلبوم: <strong className="text-slate-600">{videoItem.albumTitle}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-slate-50/50">
                        <button 
                          onClick={() => setPreviewVideoModal({ url: videoItem.media.url, title: videoItem.media.title || videoItem.albumTitle })}
                          className="text-slate-600 hover:text-blue-600 text-xs font-bold flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          پخش
                        </button>

                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openEditVideo(videoItem)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-colors text-xs font-bold"
                            title="ویرایش ویدیو"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            type="button" onClick={() => handleDeleteVideo(videoItem.albumId, videoItem.imageIndex, videoItem.media.title)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors text-xs font-bold"
                            title="حذف ویدیو"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Admin Video Modal Preview */}
      {previewVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-700 w-full max-w-3xl overflow-hidden shadow-2xl space-y-4 p-5 animate-fadeIn text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Film className="w-5 h-5 text-rose-500" />
                {previewVideoModal.title}
              </h3>
              <button 
                onClick={() => setPreviewVideoModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black relative">
              {previewVideoModal.url.includes('aparat.com') ? (
                <iframe 
                  src={parseAparatEmbedUrl(previewVideoModal.url)}
                  title={previewVideoModal.title}
                  allowFullScreen
                  className="w-full h-full border-none"
                />
              ) : (
                <video 
                  src={previewVideoModal.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
      {/* UNIVERSAL IMAGE CROPPER MODAL */}
      <ImageCropperModal
        isOpen={cropperModal.isOpen}
        onClose={() => setCropperModal(prev => ({ ...prev, isOpen: false }))}
        imageSrc={cropperModal.imageSrc}
        initialAspectRatio={cropperModal.initialRatio ?? (16 / 9)}
        title={
          cropperModal.targetType === 'cover' 
            ? 'برش و تنظیم کادر کاور آلبوم نگارخانه'
            : cropperModal.targetType === 'videoCover'
            ? 'برش و کادربندی پوستر ویدیو'
            : 'برش و کادربندی تصویر نگارخانه'
        }
        targetFolder="gallery"
        onCropComplete={handleGalleryCropComplete}
      />

      {/* Delete Album Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteConfirmAlbum)}
        onClose={() => setDeleteConfirmAlbum(null)}
        onConfirm={() => deleteConfirmAlbum && executeDeleteAlbum(deleteConfirmAlbum.id)}
        title="تأیید حذف آلبوم"
        itemName={deleteConfirmAlbum?.title}
        details={deleteConfirmAlbum ? [
          { label: 'تعداد تصاویر / رسانه‌ها', value: `${deleteConfirmAlbum.images?.length || 0} فایل` },
          { label: 'دسته‌بندی', value: deleteConfirmAlbum.category || 'عمومی' }
        ] : undefined}
      />

      {/* Delete Video Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteConfirmVideo)}
        onClose={() => setDeleteConfirmVideo(null)}
        onConfirm={executeDeleteVideo}
        title="تأیید حذف ویدیو"
        itemName={deleteConfirmVideo?.title}
      />

      {/* Server Storage Picker Modal */}
      <ServerImagePickerModal
        isOpen={serverPickerState.isOpen}
        onClose={() => setServerPickerState(prev => ({ ...prev, isOpen: false }))}
        onSelect={(imgUrl) => {
          if (serverPickerState.target === 'cover') {
            setNewCover(imgUrl);
          } else if (serverPickerState.target === 'videoCover') {
            setVideoCover(imgUrl);
          } else if (serverPickerState.target === 'images') {
            setNewImages(prev => [...prev, { url: imgUrl, type: 'image' }]);
          }
          setServerPickerState(prev => ({ ...prev, isOpen: false }));
        }}
        initialFolder="gallery"
        title={
          serverPickerState.target === 'cover' 
            ? 'انتخاب تصویر کاور آلبوم از مخزن سرور' 
            : serverPickerState.target === 'videoCover'
            ? 'انتخاب پوستر ویدیو از مخزن سرور'
            : 'انتخاب تصاویر نگارخانه از مخزن سرور'
        }
      />
    </div>
  );
}
