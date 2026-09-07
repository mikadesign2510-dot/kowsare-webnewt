import React, { useState, useEffect, useMemo, useRef } from 'react';
import { storage, NewsItem, NewsAttachment, SidebarWidget, GalleryAlbum, GalleryImage } from '../../lib/storage';
import { uploadFileToServer, uploadMultipleFilesToServer } from '../../lib/uploadHelper';
import SidebarWidgetsEditor from '../../components/admin/SidebarWidgetsEditor';
import PinnedSliderSettingsEditor from '../../components/admin/PinnedSliderSettingsEditor';
import { 
  Plus, Edit2, Trash2, Search, Filter, Eye,
  PanelRightClose,
  PanelLeftClose, Sparkles, 
  Calendar, Upload, Image as ImageIcon, Link as LinkIcon, 
  Check, X, AlertCircle, FileText, Tag, ChevronDown, 
  ExternalLink, Download, Layers, ShieldCheck, RefreshCw, 
  Globe, Lock, ArrowUpDown, LayoutGrid, List, FileSpreadsheet, 
  Printer, CheckSquare, Square, Share2, Clock, User, LayoutTemplate,
  UploadCloud, CheckCircle2, Camera, Star, Maximize2, FolderPlus, Crop,
  Copy, Pin, PinOff, AlertTriangle
} from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';
import ImageCropperModal from '../../components/admin/ImageCropperModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { forwardRef } from 'react';

const CustomDateInput = forwardRef(({ openCalendar, handleValueChange, ...props }: any, ref: any) => {
  return (
    <input
      {...props}
      ref={ref}
      onClick={openCalendar}
      onChange={handleValueChange}
    />
  );
});


const PRESET_IMAGES = [
  { url: 'https://picsum.photos/seed/7569/1200/800', label: 'محیط دانشگاهی و دانشجویان' },
  { url: 'https://picsum.photos/seed/7625/1200/800', label: 'سالن همایش و کنفرانس' },
  { url: 'https://picsum.photos/seed/7362/1200/800', label: 'آزمایشگاه و فناوری اطلاعات' },
  { url: 'https://picsum.photos/seed/7401/1200/800', label: 'کارگاه آموزشی و هوش مصنوعی' },
  { url: 'https://picsum.photos/seed/7662/1200/800', label: 'رباتیک و مسابقات علمی' },
  { url: 'https://picsum.photos/seed/7563/1200/800', label: 'کلاس درس و پژوهش گروهی' },
];

const DEFAULT_CATEGORIES = ['آموزشی', 'رویدادها', 'امکانات', 'کارگاه', 'افتخارات', 'فرهنگی', 'پژوهشی', 'اطلاعیه'];

export default function AdminNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [managerTab, setManagerTab] = useState<'news' | 'pinned_slider' | 'sidebars' | 'settings'>('news');
  const [siteSettings, setSiteSettings] = useState<any>(storage.getSettings());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [previewItem, setPreviewItem] = useState<NewsItem | null>(null);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'pinned'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Active Tab inside Editor Modal: 'content' | 'media' | 'settings' | 'preview'
  const [editorTab, setEditorTab] = useState<'content' | 'media' | 'settings' | 'preview'>('content');

  // New category creation input
  const [customCategory, setCustomCategory] = useState('');
  const [allCategories, setAllCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // New Tag input
  const [tagInput, setTagInput] = useState('');

  // New Attachment input
  const [newAttachment, setNewAttachment] = useState({ name: '', url: '', size: '' });

  // Gallery URL input
  const [galleryUrlInput, setGalleryUrlInput] = useState('');

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string | null>(null);
  const [isDraggingImages, setIsDraggingImages] = useState(false);

  // Gallery Album Integration State
  const [syncWithGallery, setSyncWithGallery] = useState<boolean>(false);
  const [gallerySyncMode, setGallerySyncMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingAlbumId, setSelectedExistingAlbumId] = useState<string>('');
  const [directGalleryToast, setDirectGalleryToast] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [deleteConfirmNews, setDeleteConfirmNews] = useState<NewsItem | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState<boolean>(false);

  // Universal Cropper Modal State
  const [cropperModal, setCropperModal] = useState<{
    isOpen: boolean;
    imageSrc: string | File | null;
    targetImage?: string;
    initialRatio?: number | null;
  }>({
    isOpen: false,
    imageSrc: null,
    initialRatio: 4 / 3
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Main Form Data State
  const [formData, setFormData] = useState<Omit<NewsItem, 'id'>>({
    title: '',
    subtitle: '',
    date: new Date().toLocaleDateString('fa-IR'),
    image: PRESET_IMAGES[0].url,
    summary: '',
    content: '',
    category: 'آموزشی',
    priority: 1,
    isPinned: false,
    isPublished: true,
    author: 'روابط عمومی مرکز',
    views: 0,
    tags: ['کوثر_کاکی', 'دانشگاه'],
    attachments: [],
    gallery: [],
    readTime: '۳ دقیقه'
  });

  const loadData = async () => {
    const list = await storage.syncNewsWithDB();
    setNews(list);
    const loadedAlbums = storage.getAlbums();
    setAlbums(loadedAlbums);

    // Collect all existing categories
    const cats = new Set(DEFAULT_CATEGORIES);
    list.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    setAllCategories(Array.from(cats));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = news.length;
    const published = news.filter(n => n.isPublished !== false).length;
    const drafts = total - published;
    const pinned = news.filter(n => n.isPinned).length;
    const totalViews = news.reduce((sum, n) => sum + (n.views || 0), 0);
    return { total, published, drafts, pinned, totalViews };
  }, [news]);

  // Filtered News
  const filteredNews = useMemo(() => {
    return news.filter(item => {
      // Search
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.author && item.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      
      // Status
      let matchesStatus = true;
      if (statusFilter === 'published') matchesStatus = item.isPublished !== false;
      if (statusFilter === 'draft') matchesStatus = item.isPublished === false;
      if (statusFilter === 'pinned') matchesStatus = !!item.isPinned;

      // Category
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [news, searchQuery, statusFilter, categoryFilter]);

  // Form Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      try {
        const result = await uploadFileToServer(file, 'news');
        if (result.success && result.url) {
          setFormData(prev => {
            const curGallery = prev.gallery || [];
            const newGallery = curGallery.includes(result.url!) ? curGallery : [...curGallery, result.url!];
            return { ...prev, image: result.url!, gallery: newGallery };
          });
        } else {
          alert('خطا در بارگذاری تصویر: ' + (result.message || ''));
        }
      } catch (err: any) {
        alert('خطا در ارتباط با سرور: ' + (err.message || ''));
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  // Batch Image Upload (Single or Multiple)
  const handleBatchImageUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setIsUploadingBatch(true);
    setUploadProgressMsg(`در حال بهینه‌سازی و آپلود ${fileArray.length} تصویر...`);

    try {
      const result = await uploadMultipleFilesToServer(fileArray, 'news');
      if (result.success && result.items && result.items.length > 0) {
        const newUrls = result.items.map(item => item.url);
        setFormData(prev => {
          const currentGallery = prev.gallery || [];
          const updatedGallery = [...currentGallery];
          newUrls.forEach(u => {
            if (!updatedGallery.includes(u)) updatedGallery.push(u);
          });

          // If current image is not set or is a preset, pick the first uploaded as cover
          let cover = prev.image;
          if (!cover || PRESET_IMAGES.some(p => p.url === cover)) {
            cover = newUrls[0];
          }

          return {
            ...prev,
            image: cover,
            gallery: updatedGallery
          };
        });

        setUploadProgressMsg(`${result.items.length} تصویر با موفقیت بارگذاری و افزوده شد.`);
        setTimeout(() => setUploadProgressMsg(null), 3500);
      } else {
        alert('خطا در بارگذاری گروهی تصاویر: ' + (result.message || ''));
      }
    } catch (err: any) {
      alert('خطا در ارتباط با سرور: ' + (err.message || ''));
    } finally {
      setIsUploadingBatch(false);
      if (batchFileInputRef.current) batchFileInputRef.current.value = '';
    }
  };

  // Drag and Drop Handler for Images
  const handleImagesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImages(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      const imageFiles = filesArray.filter((f: File) => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        handleBatchImageUpload(imageFiles);
      }
    }
  };

  const handleSetAsCover = (url: string) => {
    setFormData(prev => {
      const gallery = prev.gallery || [];
      const updatedGallery = gallery.includes(url) ? gallery : [...gallery, url];
      return {
        ...prev,
        image: url,
        gallery: updatedGallery
      };
    });
  };

  const handleRemoveImage = (urlToRemove: string) => {
    setFormData(prev => {
      const updatedGallery = (prev.gallery || []).filter(u => u !== urlToRemove);
      let updatedCover = prev.image;
      if (prev.image === urlToRemove) {
        updatedCover = updatedGallery.length > 0 ? updatedGallery[0] : PRESET_IMAGES[0].url;
      }
      return {
        ...prev,
        image: updatedCover,
        gallery: updatedGallery
      };
    });
  };

  const handleNewsCropComplete = (croppedFile: File, previewUrl: string, uploadResult?: any) => {
    const finalUrl = uploadResult?.url || previewUrl;
    const oldUrl = cropperModal.targetImage;
    
    setFormData(prev => {
      const isOldCover = prev.image === oldUrl;
      const gallery = prev.gallery || [];
      const updatedGallery = oldUrl 
        ? gallery.map(u => u === oldUrl ? finalUrl : u)
        : [...gallery, finalUrl];
      
      return {
        ...prev,
        image: isOldCover || !prev.image ? finalUrl : prev.image,
        gallery: updatedGallery
      };
    });
  };

  const handleAttachmentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAttachment(true);
      try {
        const result = await uploadFileToServer(file, 'news');
        if (result.success && result.url) {
          const attachment: NewsAttachment = {
            id: Date.now().toString(),
            name: file.name.replace(/\.[^/.]+$/, ""),
            url: result.url,
            size: result.sizeFormatted
          };
          setFormData(prev => ({
            ...prev,
            attachments: [...(prev.attachments || []), attachment]
          }));
        } else {
          alert('خطا در بارگذاری پیوست: ' + (result.message || ''));
        }
      } catch (err: any) {
        alert('خطا در ارتباط با سرور: ' + (err.message || ''));
      } finally {
        setIsUploadingAttachment(false);
        if (attachmentFileInputRef.current) attachmentFileInputRef.current.value = '';
      }
    }
  };

  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleBatchImageUpload(files);
    }
  };

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter') return;
    if (tagInput.trim()) {
      const cleanTag = tagInput.trim().replace(/^#/, '');
      if (!formData.tags?.includes(cleanTag)) {
        setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), cleanTag] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tagToRemove) || []
    }));
  };

  const handleAddAttachment = () => {
    if (newAttachment.name.trim() && newAttachment.url.trim()) {
      const attachment: NewsAttachment = {
        id: Date.now().toString(),
        name: newAttachment.name.trim(),
        url: newAttachment.url.trim(),
        size: newAttachment.size.trim() || 'PDF'
      };
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), attachment]
      }));
      setNewAttachment({ name: '', url: '', size: '' });
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter(a => a.id !== attId) || []
    }));
  };

  const handleAddGalleryImage = () => {
    if (galleryUrlInput.trim()) {
      const url = galleryUrlInput.trim();
      setFormData(prev => {
        const curGallery = prev.gallery || [];
        const newGallery = curGallery.includes(url) ? curGallery : [...curGallery, url];
        let cover = prev.image;
        if (!cover || PRESET_IMAGES.some(p => p.url === cover)) {
          cover = url;
        }
        return {
          ...prev,
          image: cover,
          gallery: newGallery
        };
      });
      setGalleryUrlInput('');
    }
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery?.filter((_, i) => i !== idx) || []
    }));
  };

  const handleAddCustomCategory = () => {
    if (customCategory.trim()) {
      const cat = customCategory.trim();
      if (!allCategories.includes(cat)) {
        setAllCategories(prev => [...prev, cat]);
      }
      setFormData(prev => ({ ...prev, category: cat }));
      setCustomCategory('');
    }
  };

  // Gallery Album Synchronization
  const syncNewsToGalleryAlbum = (item: NewsItem, showFeedback = false) => {
    try {
      const allImages: string[] = [];
      if (item.image && item.image.trim()) {
        allImages.push(item.image.trim());
      }
      if (item.gallery && item.gallery.length > 0) {
        item.gallery.forEach(url => {
          if (url && url.trim() && !allImages.includes(url.trim())) {
            allImages.push(url.trim());
          }
        });
      }

      if (allImages.length === 0) {
        if (showFeedback) alert('هنوز تصویری برای افزودن به نگارخانه وجود ندارد.');
        return;
      }

      const currentAlbums = storage.getAlbums();

      if (gallerySyncMode === 'existing' && selectedExistingAlbumId) {
        const existing = currentAlbums.find(a => a.id === selectedExistingAlbumId);
        if (existing) {
          const updatedImages = [...existing.images];
          allImages.forEach((url, i) => {
            if (!updatedImages.some(img => img.url === url)) {
              updatedImages.push({
                id: `img-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
                url,
                type: 'image',
                title: item.title
              });
            }
          });
          storage.updateAlbum(existing.id, {
            images: updatedImages,
            newsId: item.id
          });
          setAlbums(storage.getAlbums());
          if (showFeedback) {
            setDirectGalleryToast(`تصاویر با موفقیت به آلبوم «${existing.title}» اضافه شدند.`);
            setTimeout(() => setDirectGalleryToast(null), 4000);
          }
          return;
        }
      }

      // New or linked album
      const existingNewsAlbum = currentAlbums.find(a => a.newsId === item.id);
      const galleryImageObjects: GalleryImage[] = allImages.map((url, i) => ({
        id: `img-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        url,
        type: 'image',
        title: `${item.title} - تصویر ${i + 1}`
      }));

      if (existingNewsAlbum) {
        storage.updateAlbum(existingNewsAlbum.id, {
          title: item.title,
          description: item.summary,
          category: item.category || 'رویدادها',
          date: item.date,
          coverImage: item.image || allImages[0],
          images: galleryImageObjects
        });
        setAlbums(storage.getAlbums());
        if (showFeedback) {
          setDirectGalleryToast(`آلبوم نگارخانه متناظر این خبر با موفقیت به‌روزرسانی شد.`);
          setTimeout(() => setDirectGalleryToast(null), 4000);
        }
      } else {
        storage.addAlbum({
          title: item.title,
          description: item.summary,
          category: item.category || 'رویدادها',
          date: item.date,
          coverImage: item.image || allImages[0],
          images: galleryImageObjects,
          newsId: item.id
        });
        setAlbums(storage.getAlbums());
        if (showFeedback) {
          setDirectGalleryToast(`آلبوم جدیدی در نگارخانه با ${galleryImageObjects.length} تصویر ایجاد شد.`);
          setTimeout(() => setDirectGalleryToast(null), 4000);
        }
      }
    } catch (e) {
      console.error('Error syncing news to gallery:', e);
    }
  };

  const handleDirectSyncToGallery = () => {
    if (!formData.title.trim()) {
      alert('لطفاً ابتدا عنوان خبر را وارد فرمایید.');
      return;
    }

    const dummyItem: NewsItem = {
      id: editingId || Date.now(),
      ...formData
    };

    syncNewsToGalleryAlbum(dummyItem, true);
  };

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      subtitle: '',
      date: new Date().toLocaleDateString('fa-IR'),
      image: PRESET_IMAGES[0].url,
      summary: '',
      content: '',
      category: allCategories[0] || 'آموزشی',
      priority: 1,
      isPinned: false,
      isPublished: true,
      author: 'روابط عمومی مرکز',
      views: 0,
      tags: ['کوثر_کاکی', 'دانشگاه'],
      attachments: [],
      gallery: [],
      readTime: '۳ دقیقه'
    });
    setEditingId(null);
    setSyncWithGallery(false);
    setGallerySyncMode('new');
    setSelectedExistingAlbumId('');
    setUploadProgressMsg(null);
    setEditorTab('content');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: NewsItem) => {
    setFormData({
      title: item.title,
      subtitle: item.subtitle || '',
      date: item.date,
      image: item.image,
      summary: item.summary,
      content: item.content,
      category: item.category,
      priority: item.priority || 1,
      isPinned: !!item.isPinned,
      isPublished: item.isPublished !== false,
      author: item.author || 'روابط عمومی مرکز',
      views: item.views || 0,
      tags: item.tags || [],
      attachments: item.attachments || [],
      gallery: item.gallery || [],
      readTime: item.readTime || '۳ دقیقه'
    });
    setEditingId(item.id);

    // Check if album is already connected
    const existingAlbum = storage.getAlbums().find(a => a.newsId === item.id);
    if (existingAlbum) {
      setSyncWithGallery(true);
      setGallerySyncMode('new');
    } else {
      setSyncWithGallery(false);
      setGallerySyncMode('new');
    }
    setSelectedExistingAlbumId('');
    setUploadProgressMsg(null);
    setEditorTab('content');
    setIsEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.summary.trim()) {
      alert('لطفاً عنوان و خلاصه خبر را تکمیل فرمایید.');
      return;
    }

    let savedItem: NewsItem;
    if (editingId) {
      savedItem = { ...formData, id: editingId };
      await storage.updateNewsInDB(savedItem);
    } else {
      savedItem = await storage.createNewsInDB(formData);
    }

    if (syncWithGallery) {
      syncNewsToGalleryAlbum(savedItem);
    }

    await loadData();
    setIsEditorOpen(false);
    setEditingId(null);
  };

  const handleDelete = (idOrItem: number | NewsItem) => {
    if (typeof idOrItem === 'number') {
      const target = news.find(n => n.id === idOrItem);
      if (target) {
        setDeleteConfirmNews(target);
      } else {
        setDeleteConfirmNews({ id: idOrItem, title: 'خبر انتخاب شده' } as NewsItem);
      }
    } else {
      setDeleteConfirmNews(idOrItem);
    }
  };

  const executeDeleteNews = async (id: number) => {
    setDeleteConfirmNews(null);
    await storage.deleteNewsFromDB(id);
    await loadData();
    setSelectedIds(prev => prev.filter(item => item !== id));
  };

  const handleTogglePublish = async (id: number) => {
    const item = news.find(n => n.id === id);
    if (!item) return;
    const currentStatus = item.isPublished !== false;
    const nextStatus = !currentStatus;

    // Optimistic UI state update immediately in local state
    setNews(prev => prev.map(n => n.id === id ? { ...n, isPublished: nextStatus } : n));

    try {
      await storage.toggleNewsPublishInDB(id, currentStatus);
    } catch (e) {
      console.error('Failed to toggle publish in DB:', e);
    }
  };

  const handleTogglePin = async (id: number) => {
    const item = news.find(n => n.id === id);
    if (!item) return;
    const currentPin = !!item.isPinned;
    const nextPin = !currentPin;

    // Optimistic UI state update immediately in local state
    setNews(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isPinned: nextPin } : n);
      return updated.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
        return b.id - a.id;
      });
    });

    try {
      await storage.toggleNewsPinInDB(id, currentPin);
    } catch (e) {
      console.error('Failed to toggle pin in DB:', e);
    }
  };

  const handleDuplicate = async (item: NewsItem) => {
    try {
      const duplicatedItem: Omit<NewsItem, 'id'> = {
        title: `(کپی) ${item.title}`,
        subtitle: item.subtitle || '',
        date: new Date().toLocaleDateString('fa-IR'),
        image: item.image,
        summary: item.summary,
        content: item.content,
        category: item.category,
        priority: (item.priority || 1) + 1,
        isPinned: false,
        isPublished: false, // Default to draft for duplicates
        author: item.author || 'روابط عمومی مرکز',
        views: 0,
        tags: item.tags ? [...item.tags] : [],
        attachments: item.attachments ? [...item.attachments] : [],
        gallery: item.gallery ? [...item.gallery] : [],
        readTime: item.readTime || '۳ دقیقه'
      };
      await storage.createNewsInDB(duplicatedItem);
      await loadData();
    } catch (e) {
      console.error('Failed to duplicate news item:', e);
    }
  };

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedIds.length === filteredNews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNews.map(n => n.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkPublish = async (status: boolean) => {
    // Optimistic update
    setNews(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, isPublished: status } : n));
    for (const id of selectedIds) {
      const item = news.find(n => n.id === id);
      if (item && (item.isPublished !== false) !== status) {
        await storage.toggleNewsPublishInDB(id, item.isPublished !== false);
      }
    }
    await loadData();
    setSelectedIds([]);
  };

  const handleBulkPin = async (status: boolean) => {
    // Optimistic update
    setNews(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, isPinned: status } : n));
    for (const id of selectedIds) {
      const item = news.find(n => n.id === id);
      if (item && (!!item.isPinned) !== status) {
        await storage.toggleNewsPinInDB(id, !!item.isPinned);
      }
    }
    await loadData();
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteConfirmOpen(true);
  };

  const executeBulkDelete = async () => {
    setBulkDeleteConfirmOpen(false);
    setNews(prev => prev.filter(n => !selectedIds.includes(n.id)));
    for (const id of selectedIds) {
      await storage.deleteNewsFromDB(id);
    }
    await loadData();
    setSelectedIds([]);
  };

  const handleExportCSV = () => {
    const headers = ['شناسه', 'عنوان', 'دسته‌بندی', 'تاریخ', 'نویسنده', 'وضعیت انتشار', 'ویژه/سنجاق', 'بازدید'];
    const rows = news.map(n => [
      n.id,
      `"${n.title.replace(/"/g, '""')}"`,
      `"${n.category}"`,
      n.date,
      `"${n.author || ''}"`,
      n.isPublished !== false ? 'منتشر شده' : 'پیش‌نویس',
      n.isPinned ? 'بله' : 'خیر',
      n.views || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kowsar_news_archive_${new Date().toLocaleDateString('fa-IR')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">مدیریت جامع اخبار و اطلاعیه‌ها</h1>
          <p className="text-slate-500 text-sm mt-1">پایگاه مدیریت محتوا، کنترل دسترسی، برچسب‌ها و تنظیمات انتشار پورتال خبری مرکز</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-2xl shadow-sm text-xs transition-all"
            title="خروجی اکسل و CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            خروجی اکسل
          </button>
          
          <button 
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 text-sm"
          >
            <Plus className="w-5 h-5" />
            ثبت و نگارش خبر جدید
          </button>
        </div>
      </div>

      {/* Manager Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-fit mx-auto md:mx-0 flex-wrap gap-1">
        <button
          onClick={() => setManagerTab('news')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            managerTab === 'news' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          مدیریت محتوای اخبار
        </button>
        <button
          onClick={() => setManagerTab('pinned_slider')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            managerTab === 'pinned_slider' 
              ? 'bg-white text-amber-600 shadow-sm ring-1 ring-amber-400/30' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>شخصی‌سازی و قالب‌های اخبار ویژه</span>
          <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-black">
            قالب‌ها
          </span>
        </button>
        <button
          onClick={() => setManagerTab('sidebars')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            managerTab === 'sidebars' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          شخصی‌سازی سایدبار و باکس‌ها
        </button>
        <button
          onClick={() => setManagerTab('settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            managerTab === 'settings' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          تنظیمات کارت‌های اخبار (صفحه اصلی)
        </button>
      </div>

      {managerTab === 'pinned_slider' ? (
        <PinnedSliderSettingsEditor
          currentConfig={siteSettings.pinnedNewsSliderConfig}
          newsItems={news}
          onSave={(newConfig) => {
            const updated = { ...siteSettings, pinnedNewsSliderConfig: newConfig };
            setSiteSettings(updated);
            storage.updateSettings(updated);
          }}
        />
      ) : managerTab === 'sidebars' ? (
        <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-200">
          <SidebarWidgetsEditor 
            widgets={siteSettings.newsWidgets || []} 
            onChange={(newWidgets) => {
              const newSettings = { ...siteSettings, newsWidgets: newWidgets };
              setSiteSettings(newSettings);
            }} 
          />
        </div>
      ) : managerTab === 'settings' ? (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-800 mb-2">تنظیمات متون و نمایش اخبار (صفحه اصلی)</h2>
            <p className="text-sm text-slate-500">در این بخش می‌توانید متون و نحوه نمایش اخبار در صفحه اصلی سایت را تنظیم کنید.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">متن نشانک (Badge)</label>
              <input 
                type="text" 
                value={siteSettings.newsBadge || ''} 
                onChange={(e) => {
                  const newSettings = { ...siteSettings, newsBadge: e.target.value };
                  setSiteSettings(newSettings);
                }}
                placeholder="اطلاع‌رسانی مرکز"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان اصلی</label>
              <input 
                type="text" 
                value={siteSettings.newsTitle || ''} 
                onChange={(e) => {
                  const newSettings = { ...siteSettings, newsTitle: e.target.value };
                  setSiteSettings(newSettings);
                }}
                placeholder="اخبار و رویدادها"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-amber-700 mb-2">عنوان باکس اطلاعیه مهم</label>
              <input 
                type="text" 
                value={siteSettings.newsNoticeTitle || ''} 
                onChange={(e) => {
                  const newSettings = { ...siteSettings, newsNoticeTitle: e.target.value };
                  setSiteSettings(newSettings);
                }}
                placeholder="اطلاعیه مهم تقویم آموزشی"
                className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-amber-700 mb-2">متن باکس اطلاعیه مهم</label>
              <textarea 
                value={siteSettings.newsNoticeText || ''} 
                onChange={(e) => {
                  const newSettings = { ...siteSettings, newsNoticeText: e.target.value };
                  setSiteSettings(newSettings);
                }}
                rows={3}
                className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              ></textarea>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">تعداد اخبار قابل نمایش در گردونه</label>
              <select 
                value={siteSettings.newsCarouselCount || 4}
                onChange={(e) => {
                  const newSettings = { ...siteSettings, newsCarouselCount: Number(e.target.value) };
                  setSiteSettings(newSettings);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value={3}>۳ خبر (سبک)</option>
                <option value={4}>۴ خبر (استاندارد)</option>
                <option value={5}>۵ خبر (پرحجم)</option>
                <option value={6}>۶ خبر (حداکثر)</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">سایز قاب و کارت‌های اخبار سه بعدی</label>
              <select 
                value={siteSettings.newsCarouselSize || 'standard'}
                onChange={(e) => {
                  const newSettings = { ...siteSettings, newsCarouselSize: e.target.value };
                  setSiteSettings(newSettings);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="compact">فشرده (کوچک و جمع‌وجور)</option>
                <option value="standard">استاندارد (متوسط)</option>
                <option value="large">بزرگ (عریض و واضح)</option>
                <option value="xlarge">بسیار بزرگ (سینمایی)</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">فاصله دکمه‌های جهت‌نما (فلش‌ها)</label>
              <select 
                value={siteSettings.newsCarouselArrowSpacing || 'normal'}
                onChange={(e) => {
                  const newSettings = { ...siteSettings, newsCarouselArrowSpacing: e.target.value };
                  setSiteSettings(newSettings);
                }}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="tight">نزدیک به هم</option>
                <option value="normal">استاندارد (روی کارت‌های کناری)</option>
                <option value="wide">باز (نزدیک به حاشیه صفحه)</option>
                <option value="extra">خیلی باز (چسبیده به لبه‌ها)</option>
              </select>
            </div>

            <div className="space-y-4 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700">استایل کارت‌های اخبار</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'default', title: 'پیش‌فرض (مدرن)', desc: 'کارت‌های سفید با سایه ملایم' },
                  { id: 'glass', title: 'شیشه‌ای (Glass)', desc: 'پس‌زمینه نیمه‌شفاف و تار' },
                  { id: 'minimal', title: 'مینیمال', desc: 'بدون سایه، حاشیه پررنگ‌تر' }
                ].map(style => (
                  <button
                    key={style.id}
                    onClick={() => {
                      const newSettings = { ...siteSettings, newsCarouselStyle: style.id };
                      setSiteSettings(newSettings);
                    }}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between h-full ${
                      (siteSettings.newsCarouselStyle || 'default') === style.id
                        ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-sm ${
                        (siteSettings.newsCarouselStyle || 'default') === style.id ? 'text-blue-700' : 'text-slate-700'
                      }`}>{style.title}</span>
                      {(siteSettings.newsCarouselStyle || 'default') === style.id && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <span className="text-xs text-slate-500 block">{style.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  storage.updateSettings(siteSettings);
                  alert('تنظیمات اخبار با موفقیت ذخیره شد.');
                }}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* Analytics & Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">کل اخبار</p>
            <p className="text-2xl font-black text-slate-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">منتشر شده (عمومی)</p>
            <p className="text-2xl font-black text-slate-800">{stats.published}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">پیش‌نویس (مخفی)</p>
            <p className="text-2xl font-black text-slate-800">{stats.drafts}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">اخبار ویژه / سنجاق</p>
            <p className="text-2xl font-black text-slate-800">{stats.pinned}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 col-span-2 sm:col-span-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">کل بازدیدها</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalViews}</p>
          </div>
        </div>
      </div>

      {/* Main Filter, Search & Bulk Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="جستجو در عنوان، خلاصه، نویسنده یا برچسب‌ها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-0.5 rounded-full"
              >
                پاک کردن
              </button>
            )}
          </div>

          {/* Filters & View Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="published">فقط منتشر شده‌ها</option>
              <option value="draft">فقط پیش‌نویس‌ها</option>
              <option value="pinned">فقط اخبار سنجاق شده (ویژه)</option>
            </select>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">همه دسته‌بندی‌ها</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                title="نمای جدولی"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                title="نمای کارتی"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar (when items selected) */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between p-3.5 bg-blue-50 border border-blue-200 rounded-2xl gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <span>{selectedIds.length} مورد انتخاب شده است:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkPublish(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>انتشار همگانی</span>
              </button>
              <button
                onClick={() => handleBulkPublish(false)}
                className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>تبدیل به پیش‌نویس</span>
              </button>
              <button
                onClick={() => handleBulkPin(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>سنجاق گروهی</span>
              </button>
              <button
                onClick={() => handleBulkPin(false)}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <PinOff className="w-3.5 h-3.5" />
                <span>برداشتن سنجاق</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف گروهی</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content List: Table or Cards */}
      {filteredNews.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">خبری با این مشخصات یافت نشد!</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            می‌توانید فیلترها را تغییر دهید یا اولین خبر جدید را ثبت و منتشر فرمایید.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-md"
          >
            ثبت اولین خبر
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-400">
                  <th className="p-4 w-12 text-center">
                    <button onClick={handleSelectAll} className="text-slate-500 cursor-pointer">
                      {selectedIds.length === filteredNews.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">تصویر و عنوان خبر</th>
                  <th className="p-4">دسته‌بندی</th>
                  <th className="p-4">تاریخ / زمان مطالعه</th>
                  <th className="p-4">نویسنده</th>
                  <th className="p-4 text-center">وضعیت انتشار</th>
                  <th className="p-4 text-center">ویژه / سنجاق</th>
                  <th className="p-4 text-center">بازدید</th>
                  <th className="p-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredNews.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/60 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50/30' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="p-4 text-center">
                      <button onClick={() => handleToggleSelect(item.id)} className="cursor-pointer">
                        {selectedIds.includes(item.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </td>

                    {/* Image & Title */}
                    <td className="p-4">
                      <div className="flex items-center gap-3.5 max-w-md">
                        <div className="relative w-14 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200 group cursor-pointer" onClick={() => handleOpenEdit(item)}>
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          {item.isPinned && (
                            <div className="absolute top-0 right-0 bg-amber-500 w-3.5 h-3.5 rounded-bl-lg flex items-center justify-center">
                              <Sparkles className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                          {item.gallery && item.gallery.length > 0 && (
                            <div className="absolute bottom-0 right-0 left-0 bg-black/60 backdrop-blur-xs text-[9px] text-white text-center py-0.5 font-bold">
                              {item.gallery.length + 1} عکس
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 line-clamp-1 hover:text-blue-600 cursor-pointer" onClick={() => handleOpenEdit(item)}>
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-slate-400 line-clamp-1 font-light">
                              {item.summary}
                            </p>
                            {albums.some(a => a.newsId === item.id) && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
                                <Layers className="w-3 h-3" /> نگارخانه
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-xl">
                        {item.category}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.date}</span>
                      </div>
                      {item.readTime && (
                        <p className="text-[10px] text-slate-400 mt-1">مطالعه: {item.readTime}</p>
                      )}
                    </td>

                    {/* Author */}
                    <td className="p-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                      {item.author || 'روابط عمومی'}
                    </td>

                    {/* Published Toggle */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(item.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          item.isPublished !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                            : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                        }`}
                        title="کلیک برای تغییر وضعیت انتشار (فعال/غیرفعال)"
                      >
                        {item.isPublished !== false ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>منتشر شده</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                            <span>پیش‌نویس</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Pin Toggle */}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(item.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                          item.isPinned
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 shadow-xs'
                            : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200'
                        }`}
                        title={item.isPinned ? 'سنجاق شده در صدر اخبار (کلیک برای لغو)' : 'کلیک برای سنجاق کردن در صدر اخبار'}
                      >
                        <Sparkles className={`w-4 h-4 ${item.isPinned ? 'text-amber-600 fill-amber-500' : ''}`} />
                        <span className="text-[11px] font-bold">{item.isPinned ? 'ویژه' : 'سنجاق'}</span>
                      </button>
                    </td>

                    {/* Views */}
                    <td className="p-4 text-center text-xs font-bold text-slate-600">
                      <div className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.views || 0}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-left">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/news/${item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="مشاهده در سایت"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(item)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                          title="کپی / ایجاد نسخه مشابه از خبر"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          title="ویرایش خبر"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="حذف خبر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item) => {
            const hasAlbum = albums.some(a => a.newsId === item.id);
            const totalImgs = (item.gallery?.length || 0) + (item.image ? 1 : 0);
            return (
            <div 
              key={item.id}
              className={`bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col group ${
                selectedIds.includes(item.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm">
                    {item.category}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleTogglePin(item.id); }}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer transition-all ${
                      item.isPinned 
                        ? 'bg-amber-500 text-white hover:bg-amber-600' 
                        : 'bg-black/40 hover:bg-black/60 text-white/90 backdrop-blur-md'
                    }`}
                    title={item.isPinned ? 'سنجاق شده (کلیک برای لغو)' : 'کلیک برای سنجاق کردن'}
                  >
                    <Sparkles className={`w-3 h-3 ${item.isPinned ? 'fill-white' : ''}`} />
                    <span>{item.isPinned ? 'ویژه' : 'سنجاق'}</span>
                  </button>
                  {hasAlbum && (
                    <span className="bg-indigo-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      نگارخانه
                    </span>
                  )}
                </div>

                {totalImgs > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{totalImgs} تصویر</span>
                  </div>
                )}

                <div className="absolute top-3 left-3">
                  <button
                    type="button"
                    onClick={() => handleToggleSelect(item.id)}
                    className="p-1.5 bg-white/80 backdrop-blur-md rounded-xl text-slate-700 shadow-sm cursor-pointer"
                  >
                    {selectedIds.includes(item.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{item.views || 0}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-light">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(item.id)}
                    className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      item.isPublished !== false 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                    }`}
                    title="کلیک برای تغییر وضعیت انتشار"
                  >
                    {item.isPublished !== false ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>منتشر شده</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>پیش‌نویس</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(item.id)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        item.isPinned ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-slate-50'
                      }`}
                      title={item.isPinned ? 'سنجاق شده (کلیک برای لغو)' : 'سنجاق کردن خبر'}
                    >
                      <Sparkles className={`w-4 h-4 ${item.isPinned ? 'fill-amber-500' : ''}`} />
                    </button>
                    <a
                      href={`/news/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-blue-600 rounded-xl cursor-pointer"
                      title="مشاهده در سایت"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(item)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer"
                      title="کپی خبر"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* COMPREHENSIVE NEWS EDITOR MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-800">
                  {editingId ? 'ویرایش و بازبینی خبر' : 'ثبت و نگارش خبر جدید'}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">اطلاعات، رسانه‌ها، فایل‌ها و برچسب‌های خبر را تنظیم کنید</p>
              </div>

              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex items-center px-4 sm:px-6 border-b border-slate-100 bg-white overflow-x-auto shrink-0 no-scrollbar gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setEditorTab('content')}
                className={`py-3 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  editorTab === 'content'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                اطلاعات اصلی و متن خبر
              </button>

              <button
                type="button"
                onClick={() => setEditorTab('media')}
                className={`py-3 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  editorTab === 'media'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                تصویر شاخص و گالری
              </button>

              <button
                type="button"
                onClick={() => setEditorTab('settings')}
                className={`py-3 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  editorTab === 'settings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                پیوست‌ها، برچسب‌ها و تنظیمات
              </button>

              <button
                type="button"
                onClick={() => setEditorTab('preview')}
                className={`py-3 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  editorTab === 'preview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="w-4 h-4" />
                پیش‌نمایش زنده
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 admin-modal-body">
                
                {/* TAB 1: CONTENT & BASIC INFO */}
                {editorTab === 'content' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-2">عنوان اصلی خبر *</label>
                        <input
                          type="text"
                          required
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="مثال: برگزاری همایش بزرگ مهارت‌آموزی در مرکز کوثر کاکی"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">روتیتر / زیرعنوان (اختیاری)</label>
                        <input
                          type="text"
                          name="subtitle"
                          value={formData.subtitle}
                          onChange={handleInputChange}
                          placeholder="توضیح کوتاه تکمیلی بالای خبر..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">دسته‌بندی موضوعی *</label>
                        <div className="flex gap-2">
                          <select
                            required
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {allCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex flex-col">
                        <label className="block text-xs font-bold text-slate-700 mb-2">تاریخ انتشار (شمسی)</label>
                        <DatePicker
                          value={formData.date}
                          onChange={(dateObject: any) => {
                            setFormData({ ...formData, date: dateObject?.format?.("YYYY/MM/DD") || '' });
                          }}
                          calendar={persian}
                          locale={persian_fa}
                          calendarPosition="bottom-right"
                          render={<CustomDateInput 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold"
                          />}
                          containerClassName="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">نویسنده / منبع</label>
                        <input
                          type="text"
                          name="author"
                          value={formData.author}
                          onChange={handleInputChange}
                          placeholder="مثلاً: روابط عمومی مرکز"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">تخمین زمان مطالعه</label>
                        <input
                          type="text"
                          name="readTime"
                          value={formData.readTime}
                          onChange={handleInputChange}
                          placeholder="مثلاً: ۳ دقیقه"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">چکیده و خلاصه خبر (برای نمایش در کارت‌ها و پیش‌نمایش) *</label>
                      <textarea
                        required
                        name="summary"
                        value={formData.summary}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="متن جذاب و کوتاهی که در صفحه اصلی و شبکه‌های اجتماعی نمایش داده می‌شود..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">متن کامل و جامع خبر (ویرایشگر پیشرفته با تیتر، لیست و نقل‌قول)</label>
                      <RichTextEditor
                        value={formData.content}
                        onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
                      />
                    </div>

                                      </div>
                )}

                {/* TAB 2: MEDIA & GALLERY */}
                {editorTab === 'media' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* DEDICATED IMAGE UPLOADER & THUMBNAILS PANEL RIGHT BELOW CONTENT */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-5 rounded-3xl border border-blue-100 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">تصاویر خبر، تصاویر کوچک (Thumbnails) و نگارخانه</h4>
                            <p className="text-[11px] text-slate-500">افزودن تکی یا گروهی تصاویر با قابلیت انتخاب تصویر شاخص و انتقال به نگارخانه</p>
                          </div>
                        </div>

                        {/* Direct Batch Upload Button */}
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={batchFileInputRef}
                            onChange={(e) => e.target.files && handleBatchImageUpload(e.target.files)}
                            accept="image/*"
                            multiple
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={isUploadingBatch}
                            onClick={() => batchFileInputRef.current?.click()}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            {isUploadingBatch ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>در حال آپلود...</span>
                              </>
                            ) : (
                              <>
                                <UploadCloud className="w-3.5 h-3.5" />
                                <span>+ افزودن تصاویر (تکی یا گروهی)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Drag and Drop Zone */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingImages(true); }}
                        onDragLeave={() => setIsDraggingImages(false)}
                        onDrop={handleImagesDrop}
                        onClick={() => batchFileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                          isDraggingImages 
                            ? 'border-blue-500 bg-blue-100/50' 
                            : 'border-slate-300 hover:border-blue-400 bg-white/70 hover:bg-white'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                          <ImageIcon className="w-6 h-6 text-blue-500 mb-1" />
                          <p className="text-xs font-bold text-slate-700">تصاویر را اینجا بکشید و رها کنید، یا برای انتخاب کلیک نمایید</p>
                          <p className="text-[10px] text-slate-400">پشتیبانی از JPG, PNG, WebP با فشرده‌سازی خودکار و حفظ کیفیت</p>
                        </div>
                      </div>

                      {/* Direct URL input */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="یا آدرس اینترنتی تصویر را اینجا پیست کنید..."
                          value={galleryUrlInput}
                          onChange={(e) => setGalleryUrlInput(e.target.value)}
                          dir="ltr"
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddGalleryImage}
                          className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0"
                        >
                          افزودن لینک
                        </button>
                      </div>

                      {/* THUMBNAILS GRID */}
                      {(() => {
                        const allThumbnails: string[] = [];
                        if (formData.image && formData.image.trim()) allThumbnails.push(formData.image);
                        if (formData.gallery && formData.gallery.length > 0) {
                          formData.gallery.forEach(u => {
                            if (u && !allThumbnails.includes(u)) allThumbnails.push(u);
                          });
                        }

                        if (allThumbnails.length === 0) return null;

                        return (
                          <div className="space-y-2 pt-2 border-t border-slate-200/60">
                            <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                              <span>تصاویر بارگذاری شده ({allThumbnails.length} تصویر):</span>
                              <span className="text-[10px] text-slate-400 font-normal">تصویر دارای ستاره زرد، پوستر اصلی خبر است.</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                              {allThumbnails.map((imgUrl, idx) => {
                                const isCover = formData.image === imgUrl;
                                return (
                                  <div 
                                    key={idx}
                                    className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all bg-slate-100 ${
                                      isCover 
                                        ? 'border-amber-500 ring-2 ring-amber-300 shadow-md' 
                                        : 'border-slate-200 hover:border-blue-400'
                                    }`}
                                  >
                                    <img src={imgUrl} alt={`تصویر ${idx + 1}`} className="w-full h-full object-cover" />
                                    
                                    {/* Cover Badge */}
                                    {isCover && (
                                      <div className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm">
                                        <Star className="w-2.5 h-2.5 fill-white" />
                                        <span>شاخص</span>
                                      </div>
                                    )}

                                    {/* Hover Actions Bar */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                                      <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => setPreviewImageModal(imgUrl)}
                                            className="p-1 bg-white/80 hover:bg-white text-slate-800 rounded-md cursor-pointer"
                                            title="بزرگنمایی تصویر"
                                          >
                                            <Maximize2 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setCropperModal({
                                              isOpen: true,
                                              imageSrc: imgUrl,
                                              targetImage: imgUrl,
                                              initialRatio: 4 / 3
                                            })}
                                            className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md cursor-pointer"
                                            title="برش و تنظیم کادر (Crop)"
                                          >
                                            <Crop className="w-3 h-3" />
                                          </button>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleRemoveImage(imgUrl)}
                                          className="p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-md cursor-pointer"
                                          title="حذف این تصویر"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>

                                      {!isCover && (
                                        <button
                                          type="button"
                                          onClick={() => handleSetAsCover(imgUrl)}
                                          className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-bold py-1 rounded-md transition-colors"
                                        >
                                          تنظیم به عنوان تصویر اصلی
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* GALLERY / ALBUM INTEGRATION CONTROLS */}
                      <div className="bg-white p-4 rounded-2xl border border-indigo-100 space-y-3 pt-3">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={syncWithGallery}
                              onChange={(e) => setSyncWithGallery(e.target.checked)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <div>
                              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                افزودن خودکار تصاویر به بخش «نگارخانه و آلبوم‌های مرکز»
                              </span>
                              <p className="text-[10px] text-slate-400">با فعال کردن این گزینه، این تصاویر همزمان در بخش آلبوم‌های نگارخانه سایت ثبت می‌شوند.</p>
                            </div>
                          </label>

                          <button
                            type="button"
                            onClick={handleDirectSyncToGallery}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                            ارسال آنی به نگارخانه
                          </button>
                        </div>

                        {syncWithGallery && (
                          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs space-y-2 animate-in fade-in">
                            <div className="flex flex-wrap items-center gap-4">
                              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-xs">
                                <input
                                  type="radio"
                                  name="gallerySyncMode"
                                  value="new"
                                  checked={gallerySyncMode === 'new'}
                                  onChange={() => setGallerySyncMode('new')}
                                  className="text-indigo-600"
                                />
                                ایجاد آلبوم جدید در نگارخانه (با نام همین خبر)
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 text-xs">
                                <input
                                  type="radio"
                                  name="gallerySyncMode"
                                  value="existing"
                                  checked={gallerySyncMode === 'existing'}
                                  onChange={() => setGallerySyncMode('existing')}
                                  className="text-indigo-600"
                                />
                                افزودن به یکی از آلبوم‌های موجود
                              </label>
                            </div>

                            {gallerySyncMode === 'existing' && (
                              <div className="pt-2">
                                <select
                                  value={selectedExistingAlbumId}
                                  onChange={(e) => setSelectedExistingAlbumId(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                                >
                                  <option value="">انتخاب آلبوم مقصد در نگارخانه...</option>
                                  {albums.map(album => (
                                    <option key={album.id} value={album.id}>
                                      {album.title} ({album.images.length} تصویر)
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </div>


                  </div>
                )}

                {/* TAB 3: SETTINGS, TAGS & ATTACHMENTS */}
                {editorTab === 'settings' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Publishing Status & Pin */}
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                      <h4 className="text-xs font-bold text-slate-800">وضعیت دسترسی و نمایش عمومی</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            name="isPublished"
                            checked={formData.isPublished}
                            onChange={handleInputChange}
                            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-800">انتشار عمومی در پورتال</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">در صورت غیرفعال بودن به صورت پیش‌نویس ذخیره می‌شود.</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            name="isPinned"
                            checked={formData.isPinned}
                            onChange={handleInputChange}
                            className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              خبر برگزیده و سنجاق شده (Featured)
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">نمایش در صدر تمامی اخبار و بنر ویژه بالای آرشیو.</p>
                          </div>
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">رتبه اولویت نمایش عددی (عدد کمتر = اولویت بالاتر)</label>
                        <input
                          type="number"
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          className="w-36 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Custom Category Creation */}
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800">افزودن دسته‌بندی موضوعی دلخواه جدید</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="نام دسته‌بندی جدید (مثلاً: امور رفاهی، بین‌الملل...)"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCategory}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-2xl transition-colors"
                        >
                          ثبت دسته
                        </button>
                      </div>
                    </div>

                    {/* Tags System */}
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-blue-600" />
                        برچسب‌ها و کلمات کلیدی (Tags)
                      </h4>
                      <p className="text-[11px] text-slate-400">برچسب‌ها به دانشجویان در پیدا کردن سریع اخبار مرتبط کمک می‌کنند.</p>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="برچسب جدید (بدون #) و فشردن Enter..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                          className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTag()}
                          className="bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-2xl"
                        >
                          افزودن برچسب
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {formData.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-xl flex items-center gap-1.5"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-blue-600 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Attachments / Downloadable Documents */}
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Download className="w-4 h-4 text-blue-600" />
                            فایل‌های پیوست و اسناد دانلودی (بخشنامه‌ها، فایل‌های PDF)
                          </h4>
                          <p className="text-[11px] text-slate-400">می‌توانید مستقیماً از هارد یا به صورت لینک پیوست کنید.</p>
                        </div>
                        <div>
                          <input
                            type="file"
                            ref={attachmentFileInputRef}
                            onChange={handleAttachmentFileUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={isUploadingAttachment}
                            onClick={() => attachmentFileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm"
                          >
                            {isUploadingAttachment ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                در حال ارسال پیوست...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                آپلود مستقیم فایل پیوست به سرور
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60">
                        <input
                          type="text"
                          placeholder="عنوان فایل دستی (اختیاری)"
                          value={newAttachment.name}
                          onChange={(e) => setNewAttachment(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs"
                        />
                        <input
                          type="url"
                          placeholder="یا لینک دانلود اینترنتی (URL)"
                          dir="ltr"
                          value={newAttachment.url}
                          onChange={(e) => setNewAttachment(prev => ({ ...prev, url: e.target.value }))}
                          className="bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs text-left"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="حجم (مثال: ۲ مگابایت)"
                            value={newAttachment.size}
                            onChange={(e) => setNewAttachment(prev => ({ ...prev, size: e.target.value }))}
                            className="w-24 bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs text-center"
                          />
                          <button
                            type="button"
                            onClick={handleAddAttachment}
                            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-2xl py-2"
                          >
                            افزودن لینک دستی
                          </button>
                        </div>
                      </div>

                      {formData.attachments && formData.attachments.length > 0 && (
                        <div className="space-y-2 pt-2">
                          {formData.attachments.map((att) => (
                            <div key={att.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="font-bold text-slate-800">{att.name}</span>
                                {att.size && <span className="text-[10px] text-slate-400">({att.size})</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(att.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* TAB 4: LIVE PREVIEW */}
                {editorTab === 'preview' && (
                  <div className="space-y-6 animate-in fade-in duration-200 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <div className="text-xs font-bold text-blue-600 mb-2">پیش‌نمایش ظاهر خبر در سایت:</div>
                    
                    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
                      <div className="relative aspect-video bg-slate-900 overflow-hidden">
                        <img src={formData.image} alt={formData.title} className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                        <div className="absolute bottom-4 right-4 left-4 text-white">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-600 text-xs px-2.5 py-1 rounded-full font-bold">{formData.category}</span>
                            {formData.isPinned && <span className="bg-amber-500 text-xs px-2 py-1 rounded-full font-bold">خبر ویژه</span>}
                          </div>
                          <h2 className="text-lg md:text-2xl font-black">{formData.title || 'عنوان نمونه خبر'}</h2>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="p-4 rounded-2xl bg-blue-50/70 border-r-4 border-blue-600 text-slate-800 text-sm font-medium">
                          {formData.summary || 'خلاصه خبر اینجا قرار می‌گیرد...'}
                        </div>

                        <div 
                          className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formData.content || '<p>متن کامل خبر در این قسمت نمایش داده خواهد شد.</p>' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Buttons */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-2xl transition-colors"
                >
                  انصراف
                </button>

                <div className="flex items-center gap-3">
                  {editorTab !== 'preview' && (
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      پیش‌نمایش
                    </button>
                  )}

                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl transition-all shadow-md shadow-blue-500/20"
                  >
                    {editingId ? 'ذخیره نهایی تغییرات' : 'ذخیره و انتشار خبر'}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE PREVIEW MODAL */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute -top-10 left-0 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImageModal} 
              alt="نمایش تصویر" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

      {/* UNIVERSAL IMAGE CROPPER MODAL */}
      <ImageCropperModal
        isOpen={cropperModal.isOpen}
        onClose={() => setCropperModal(prev => ({ ...prev, isOpen: false }))}
        imageSrc={cropperModal.imageSrc}
        initialAspectRatio={cropperModal.initialRatio ?? (4 / 3)}
        title="برش و تنظیم کادر استاندارد تصویر خبر"
        targetFolder="news"
        onCropComplete={handleNewsCropComplete}
      />

      {/* Delete Confirmation Modal (News) */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteConfirmNews)}
        onClose={() => setDeleteConfirmNews(null)}
        onConfirm={() => deleteConfirmNews && executeDeleteNews(deleteConfirmNews.id)}
        title="تأیید حذف خبر"
        itemName={deleteConfirmNews?.title}
        details={deleteConfirmNews ? [
          { label: 'دسته‌بندی', value: deleteConfirmNews.category || 'عمومی' },
          { label: 'تاریخ انتشار', value: deleteConfirmNews.date || '-' }
        ] : undefined}
      />

      {/* Bulk Delete Confirmation Modal (News) */}
      <DeleteConfirmModal
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={executeBulkDelete}
        title="حذف دسته‌جمعی اخبار"
        itemCount={selectedIds.length}
        confirmText="بله، همه حذف شوند"
      />
      </>
      )}

    </div>
  );
}
