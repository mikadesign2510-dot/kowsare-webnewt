import React, { useState, useEffect, useMemo, useRef } from 'react';
import { storage, FormItem, defaultForms, SidebarWidget } from '../../lib/storage';
import { uploadFileToServer } from '../../lib/uploadHelper';
import SidebarWidgetsEditor from '../../components/admin/SidebarWidgetsEditor';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import { 
  PamphletHighlightPicker, 
  getPamphletHighlight, 
  PAMPHLET_HIGHLIGHT_PRESETS,
  PinnedCornerRibbon,
  FeaturedPamphletBadge
} from '../../components/PamphletCover';
import { 
  Plus, Edit2, Trash2, Search, Filter, Eye,
  PanelRightClose,
  PanelLeftClose, Sparkles, 
  Calendar, Upload, Link as LinkIcon, Check, X, AlertCircle, 
  FileText, Tag, ChevronDown, ExternalLink, Download, Layers, 
  RefreshCw, Globe, Lock, LayoutGrid, List, FileSpreadsheet,
  CheckSquare, Square, Building2, FileCheck, FileType,
  Archive, Info, BookOpen, Clock, ArrowUpDown, ShieldCheck,
  RotateCcw, LayoutTemplate, GraduationCap, User, BookOpenCheck,
  FileCode, CheckCircle2, Settings, HardDrive, FolderCheck, FolderOpen, Copy,
  Palette
} from 'lucide-react';

const DEFAULT_FORM_CATEGORIES = [
  'آموزشی و تحصیلی',
  'مالی و رفاهی',
  'فارغ‌التحصیلی و تسویه',
  'آیین‌نامه‌ها و قوانین',
  'دانشجویی و فرهنگی',
  'نظام وظیفه و معافیت',
  'پژوهش و کارورزی'
];

const DEFAULT_PAMPHLET_CATEGORIES = [
  'جزوات مهندسی کامپیوتر و IT',
  'جزوات حسابداری و مالی',
  'جزوات حقوق و مدیریت',
  'جزوات معماری و نقشه‌کشی',
  'جزوات دروس عمومی و معارف',
  'جزوات زبان تخصصی و عمومی',
  'جزوات کارگاهی و آزمایشگاهی'
];

const DEFAULT_DEPARTMENTS = [
  'اداره آموزش و پذیرش',
  'اداره آموزش',
  'گروه کامپیوتر و فناوری اطلاعات',
  'گروه حسابداری و مدیریت مالی',
  'گروه حقوق و مدیریت کسب‌وکار',
  'امور مالی و صندوق رفاه',
  'اداره امور فارغ‌التحصیلان',
  'امور فرهنگی و دانشجویی',
  'امور فرهنگی و کمیته انضباطی',
  'امور نظام وظیفه و پذیرش',
  'دفتر ارتباط با صنعت و کارورزی',
  'دایره امتحانات'
];

const DEGREE_LEVELS = [
  'کاردانی',
  'کارشناسی',
  'کاردانی و کارشناسی'
];

const ACADEMIC_TERMS = [
  'نیمسال اول (مهر)',
  'نیمسال دوم (بهمن)',
  'ترم تابستان',
  'نیمسال اول و دوم'
];

export default function AdminForms() {
  const [activeTab, setActiveTab] = useState<'forms' | 'pamphlets' | 'storage' | 'sidebar' | 'settings'>('pamphlets');
  const [forms, setForms] = useState<FormItem[]>([]);

  const [siteSettings, setSiteSettings] = useState<any>(storage.getSettings());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [previewItem, setPreviewItem] = useState<FormItem | null>(null);

  // In-app confirmation modal states
  const [formToDelete, setFormToDelete] = useState<{ id: string; title: string; itemType?: string } | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showResetFormsConfirm, setShowResetFormsConfirm] = useState(false);

  // Dedicated Server Storage state
  const [serverFiles, setServerFiles] = useState<any[]>([]);
  const [isLoadingServerFiles, setIsLoadingServerFiles] = useState(false);
  const [serverFoldersStats, setServerFoldersStats] = useState<any[]>([]);
  const [selectedServerFolder, setSelectedServerFolder] = useState<'all' | 'pamphlets' | 'forms'>('pamphlets');
  const [serverFileSearch, setServerFileSearch] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [showServerFilePicker, setShowServerFilePicker] = useState(false);
  const [isDirectUploading, setIsDirectUploading] = useState(false);
  const directServerFileInputRef = useRef<HTMLInputElement>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'pinned'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [degreeFilter, setDegreeFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCustomField, setIsCustomField] = useState(false);

  // Active Tab inside Editor Modal: 'details' | 'instructions' | 'preview'
  const [editorTab, setEditorTab] = useState<'details' | 'instructions' | 'preview'>('details');

  // Custom Category creation input
  const [customCategory, setCustomCategory] = useState('');
  const [allCategories, setAllCategories] = useState<string[]>([...DEFAULT_FORM_CATEGORIES, ...DEFAULT_PAMPHLET_CATEGORIES]);

  // Tag & List item inputs
  const [tagInput, setTagInput] = useState('');
  const [instructionInput, setInstructionInput] = useState('');
  const [attachmentInput, setAttachmentInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to fetch server files from /api/upload/files
  const fetchServerFiles = async (folder?: string) => {
    setIsLoadingServerFiles(true);
    try {
      const targetFolder = folder !== undefined ? folder : (selectedServerFolder === 'all' ? '' : selectedServerFolder);
      const url = targetFolder ? `/api/upload/files?folder=${encodeURIComponent(targetFolder)}` : '/api/upload/list';
      const token = localStorage.getItem('kowsar_jwt_token') || localStorage.getItem('kowsar_admin_token');
      const res = await fetch(url, {
        headers: {
          'x-admin-email': 'admin@kowsar.ac.ir',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setServerFiles(json.data);
        }
      }
    } catch (e) {
      console.warn('Fetch server files error:', e);
    } finally {
      setIsLoadingServerFiles(false);
    }
  };

  // Helper to fetch folder storage stats
  const fetchFoldersStats = async () => {
    try {
      const token = localStorage.getItem('kowsar_jwt_token') || localStorage.getItem('kowsar_admin_token');
      const res = await fetch('/api/upload/folders', {
        headers: {
          'x-admin-email': 'admin@kowsar.ac.ir',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setServerFoldersStats(json.data);
        }
      }
    } catch (e) {
      console.warn('Fetch folder stats error:', e);
    }
  };

  const handleDeleteServerFile = async (folder: string, filename: string) => {
    if (!window.confirm(`آیا از حذف دائمی فایل ${filename} از سرور اطمینان دارید؟`)) return;
    try {
      const token = localStorage.getItem('kowsar_jwt_token') || localStorage.getItem('kowsar_admin_token');
      const res = await fetch(`/api/upload/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-email': 'admin@kowsar.ac.ir',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        setServerFiles(prev => prev.filter(f => f.name !== filename));
        fetchFoldersStats();
        fetchServerFiles(selectedServerFolder === 'all' ? undefined : selectedServerFolder);
        window.dispatchEvent(new Event('kowsar_forms_changed'));
        setSaveSuccessMessage('فایل با موفقیت از سرور حذف شد.');
        setTimeout(() => setSaveSuccessMessage(null), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'خطا در حذف فایل از سرور');
      }
    } catch (err: any) {
      alert('خطا در حذف فایل از سرور: ' + (err?.message || ''));
    }
  };

  const handleCopyServerUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  // Main Form Data State
  const [formData, setFormData] = useState<Omit<FormItem, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>>({
    code: 'EDU-101',
    title: '',
    description: '',
    category: DEFAULT_FORM_CATEGORIES[0],
    department: DEFAULT_DEPARTMENTS[0],
    fileFormat: 'PDF',
    fileSize: '۱.۲ مگابایت',
    fileUrl: '',
    isPublished: true,
    isPinned: false,
    priority: 1,
    tags: ['فرم_آموزشی', 'کوثر_کاکی'],
    instructions: ['تکمیل دقیق تمامی فیلدهای مشخص شده'],
    requiredAttachments: ['کپی مدارک شناسایی'],
    itemType: 'form',
    fieldOfStudy: '',
    professorName: '',
    academicTerm: '',
    degreeLevel: '',
    pageCount: '',
    courseCode: '',
    frameStyle: 'isometric-3d',
    frameColor: 'indigo'
  });

  const loadData = async () => {
    const list = await storage.syncFormsWithDB();
    setForms(list);

    // Collect all existing categories
    const cats = new Set([...DEFAULT_FORM_CATEGORIES, ...DEFAULT_PAMPHLET_CATEGORIES]);
    list.forEach(item => {
      if (item.category) cats.add(item.category);
    });
    setAllCategories(Array.from(cats));
  };

  useEffect(() => {
    loadData();
    fetchFoldersStats();
    fetchServerFiles();

    // Auto-migrate fw_links to higher_ed_systems
    let currentSettings = storage.getSettings();
    if (currentSettings.formsWidgets) {
      let migrated = false;
      const updatedWidgets = currentSettings.formsWidgets.map(w => {
        if (w.id === 'fw_links' && w.type === 'links') {
          migrated = true;
          return { ...w, type: 'higher_ed_systems' as any, links: [] };
        }
        return w;
      });
      if (migrated) {
        const newSettings = { ...currentSettings, formsWidgets: updatedWidgets };
        setSiteSettings(newSettings);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'storage') {
      fetchFoldersStats();
      fetchServerFiles();
    }
  }, [activeTab, selectedServerFolder]);

  // Split lists: Admin Forms vs Pamphlets
  const adminFormsList = useMemo(() => {
    return forms.filter(f => f.itemType !== 'pamphlet');
  }, [forms]);

  const pamphletsList = useMemo(() => {
    return forms.filter(f => f.itemType === 'pamphlet');
  }, [forms]);

  const configuredStudyFields = useMemo(() => {
    const s = siteSettings || storage.getSettings();
    return (s.studyFields || []).filter(f => f.isActive !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [siteSettings]);

  // Stats for Admin Forms
  const formsStats = useMemo(() => {
    const total = adminFormsList.length;
    const published = adminFormsList.filter(f => f.isPublished !== false).length;
    const drafts = total - published;
    const pinned = adminFormsList.filter(f => f.isPinned).length;
    const totalDownloads = adminFormsList.reduce((sum, f) => sum + (f.downloadCount || 0), 0);
    return { total, published, drafts, pinned, totalDownloads };
  }, [adminFormsList]);

  // Stats for Pamphlets
  const pamphletsStats = useMemo(() => {
    const total = pamphletsList.length;
    const published = pamphletsList.filter(f => f.isPublished !== false).length;
    const drafts = total - published;
    const pinned = pamphletsList.filter(f => f.isPinned).length;
    const totalDownloads = pamphletsList.reduce((sum, f) => sum + (f.downloadCount || 0), 0);
    const professorsCount = new Set(pamphletsList.map(p => p.professorName).filter(Boolean)).size;
    const majorsCount = new Set(pamphletsList.map(p => p.fieldOfStudy).filter(Boolean)).size;
    return { total, published, drafts, pinned, totalDownloads, professorsCount, majorsCount };
  }, [pamphletsList]);

  // Filtered dataset according to active tab
  const activeItemsList = activeTab === 'pamphlets' ? pamphletsList : adminFormsList;

  const filteredItems = useMemo(() => {
    return activeItemsList.filter(item => {
      // Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        item.title.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        (item.code && item.code.toLowerCase().includes(searchLower)) ||
        (item.department && item.department.toLowerCase().includes(searchLower)) ||
        (item.professorName && item.professorName.toLowerCase().includes(searchLower)) ||
        (item.fieldOfStudy && item.fieldOfStudy.toLowerCase().includes(searchLower)) ||
        (item.courseCode && item.courseCode.toLowerCase().includes(searchLower)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(searchLower)));

      // Status
      let matchesStatus = true;
      if (statusFilter === 'published') matchesStatus = item.isPublished !== false;
      if (statusFilter === 'draft') matchesStatus = item.isPublished === false;
      if (statusFilter === 'pinned') matchesStatus = !!item.isPinned;

      // Category
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

      // Degree Level (for pamphlets)
      const matchesDegree = degreeFilter === 'all' || item.degreeLevel === degreeFilter;

      // Field of Study (for pamphlets)
      const matchesField = fieldFilter === 'all' || item.fieldOfStudy === fieldFilter;

      // Format
      const matchesFormat = formatFilter === 'all' || item.fileFormat.toLowerCase() === formatFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory && matchesDegree && matchesField && matchesFormat;
    });
  }, [activeItemsList, searchQuery, statusFilter, categoryFilter, degreeFilter, fieldFilter, formatFilter]);

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

  const processFileForUpload = async (file: File) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const cleanName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[_-]+/g, ' ').trim();
    const fileSizeFormatted = `${(file.size / (1024 * 1024)).toFixed(2)} مگابایت`;
    
    setIsUploading(true);
    setFormError(null);
    try {
      const uploadFolder = formData.itemType === 'pamphlet' ? 'pamphlets' : 'forms';
      const result = await uploadFileToServer(file, uploadFolder);
      if (result.success && result.url) {
        setFormData(prev => ({
          ...prev,
          title: prev.title.trim() ? prev.title : cleanName,
          fileUrl: result.url,
          fileSize: result.sizeFormatted || fileSizeFormatted,
          fileFormat: ['PDF', 'DOCX', 'XLSX', 'ZIP', 'PPTX'].includes(ext) ? (ext as any) : 'PDF'
        }));
        fetchFoldersStats();
        fetchServerFiles();
        setSaveSuccessMessage(`فایل جدید "${file.name}" با موفقیت روی سرور بارگذاری و ثبت گردید.`);
        setTimeout(() => setSaveSuccessMessage(null), 5000);
      } else {
        setFormData(prev => ({
          ...prev,
          title: prev.title.trim() ? prev.title : cleanName,
          fileSize: fileSizeFormatted,
          fileFormat: ['PDF', 'DOCX', 'XLSX', 'ZIP', 'PPTX'].includes(ext) ? (ext as any) : 'PDF'
        }));
        setFormError(result.message || 'خطا در بارگذاری فایل در سرور. لطفاً مجدداً تلاش کنید یا لینک مستقیم وارد نمایید.');
      }
    } catch (err: any) {
      setFormError('خطا در ارتباط با سرور: ' + (err?.message || 'پاسخ نامعتبر'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFileForUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFileForUpload(file);
    }
  };

  const handleDirectUploadToFolder = async (e: React.ChangeEvent<HTMLInputElement>, targetFolder: 'pamphlets' | 'forms') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsDirectUploading(true);
    setFormError(null);
    try {
      const result = await uploadFileToServer(file, targetFolder);
      if (result.success && result.url) {
        setSaveSuccessMessage(`فایل "${file.name}" با موفقیت در پوشه /uploads/${targetFolder}/ سرور بارگذاری شد.`);
        setTimeout(() => setSaveSuccessMessage(null), 4000);
        fetchFoldersStats();
        fetchServerFiles(targetFolder);
      } else {
        alert(result.message || 'خطا در بارگذاری مستقیم فایل در سرور');
      }
    } catch (err: any) {
      alert('خطا در ارتباط با سرور: ' + (err?.message || ''));
    } finally {
      setIsDirectUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCreateItemFromServerFile = (serverFile: any, type: 'pamphlet' | 'form') => {
    const ext = serverFile.ext || 'PDF';
    const cleanName = serverFile.name.substring(0, serverFile.name.lastIndexOf('.')).replace(/[_-]+/g, ' ').trim() || serverFile.name;
    setFormData({
      code: type === 'pamphlet' ? `BOK-${Math.floor(100 + Math.random() * 900)}` : `EDU-${Math.floor(100 + Math.random() * 900)}`,
      title: cleanName,
      description: type === 'pamphlet' ? `جزوه آموزشی و درسنامه درس ${cleanName}` : `فرم و کاربرگ رسمی دانشگاه ${cleanName}`,
      category: type === 'pamphlet' ? DEFAULT_PAMPHLET_CATEGORIES[0] : DEFAULT_FORM_CATEGORIES[0],
      department: DEFAULT_DEPARTMENTS[0],
      fileFormat: ['PDF', 'DOCX', 'XLSX', 'ZIP', 'PPTX'].includes(ext) ? (ext as any) : 'PDF',
      fileSize: serverFile.sizeFormatted || '۱.۵ مگابایت',
      fileUrl: serverFile.url,
      isPublished: true,
      isPinned: false,
      priority: 1,
      tags: type === 'pamphlet' ? ['جزوه_درسی', 'کوثر_کاکی'] : ['فرم_آموزشی', 'کوثر_کاکی'],
      instructions: type === 'pamphlet' ? ['مطالعه دقیق سرفصل‌ها'] : ['تکمیل دقیق تمامی فیلدها'],
      requiredAttachments: [],
      itemType: type,
      fieldOfStudy: type === 'pamphlet' ? 'مهندسی کامپیوتر' : '',
      professorName: '',
      academicTerm: 'نیمسال اول و دوم',
      degreeLevel: 'کاردانی',
      pageCount: '',
      courseCode: ''
    });
    setEditingId(null);
    setEditorTab('details');
    setIsEditorOpen(true);
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

  const handleAddInstruction = () => {
    if (instructionInput.trim()) {
      setFormData(prev => ({
        ...prev,
        instructions: [...(prev.instructions || []), instructionInput.trim()]
      }));
      setInstructionInput('');
    }
  };

  const handleRemoveInstruction = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions?.filter((_, i) => i !== idx) || []
    }));
  };

  const handleAddAttachmentReq = () => {
    if (attachmentInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requiredAttachments: [...(prev.requiredAttachments || []), attachmentInput.trim()]
      }));
      setAttachmentInput('');
    }
  };

  const handleRemoveAttachmentReq = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      requiredAttachments: prev.requiredAttachments?.filter((_, i) => i !== idx) || []
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

  // Open modal to add Form
  const handleOpenAddForm = () => {
    setFormData({
      code: `EDU-${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      description: '',
      category: DEFAULT_FORM_CATEGORIES[0],
      department: DEFAULT_DEPARTMENTS[0],
      fileFormat: 'PDF',
      fileSize: '۱.۲ مگابایت',
      fileUrl: '',
      isPublished: true,
      isPinned: false,
      priority: adminFormsList.length + 1,
      tags: ['فرم_دانشجویی', 'کوثر_کاکی'],
      instructions: [
        'تکمیل مشخصات فردی و تحصیلی با خط خوانا',
        'تحویل فرم تکمیل شده به کارشناس مربوطه'
      ],
      requiredAttachments: ['کپی کارت دانشجویی'],
      itemType: 'form',
      fieldOfStudy: '',
      professorName: '',
      academicTerm: '',
      degreeLevel: '',
      pageCount: '',
      courseCode: ''
    });
    setEditingId(null);
    setEditorTab('details');
    setIsEditorOpen(true);
  };

  // Open modal to add Pamphlet
  const handleOpenAddPamphlet = () => {
    setFormError(null);
    setFormData({
      code: `BOK-${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      description: '',
      category: DEFAULT_PAMPHLET_CATEGORIES[0],
      department: 'گروه کامپیوتر و فناوری اطلاعات',
      fileFormat: 'PDF',
      fileSize: '۳.۵ مگابایت',
      fileUrl: '',
      isPublished: true,
      isPinned: false,
      priority: pamphletsList.length + 1,
      tags: [],
      instructions: [
        'مطالعه پیش از جلسات کلاسی جهت آمادگی در کارگاه‌ها',
        'پاسخگویی به تمرینات انتهای هر فصل'
      ],
      requiredAttachments: [],
      itemType: 'pamphlet',
      fieldOfStudy: configuredStudyFields[0]?.name || 'مهندسی فناوری اطلاعات (IT)',
      professorName: '',
      academicTerm: 'نیمسال اول (مهر)',
      degreeLevel: 'کاردانی',
      pageCount: '',
      courseCode: 'CS-101',
      frameStyle: 'isometric-3d',
      frameColor: 'indigo'
    });
    setIsCustomField(false);
    setEditingId(null);
    setEditorTab('details');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: FormItem) => {
    setFormError(null);
    const itemField = item.fieldOfStudy || '';
    const existsInList = configuredStudyFields.some(f => f.name === itemField) || itemField === 'دروس عمومی (تمامی رشته‌ها)' || !itemField;
    setIsCustomField(!existsInList && !!itemField);

    setFormData({
      code: item.code,
      title: item.title,
      description: item.description,
      category: item.category,
      department: item.department || DEFAULT_DEPARTMENTS[0],
      fileFormat: item.fileFormat || 'PDF',
      fileSize: item.fileSize || '۱.۲ مگابایت',
      fileUrl: item.fileUrl || '',
      isPublished: item.isPublished !== false,
      isPinned: !!item.isPinned,
      priority: item.priority || 1,
      tags: item.tags || [],
      instructions: item.instructions || [],
      requiredAttachments: item.requiredAttachments || [],
      itemType: item.itemType || (item.category?.includes('جزوه') ? 'pamphlet' : 'form'),
      fieldOfStudy: item.fieldOfStudy || '',
      professorName: item.professorName || '',
      academicTerm: item.academicTerm || '',
      degreeLevel: item.degreeLevel || '',
      pageCount: item.pageCount || '',
      courseCode: item.courseCode || '',
      frameStyle: item.frameStyle || 'isometric-3d',
      frameColor: item.frameColor || 'indigo'
    });
    setEditingId(item.id);
    setEditorTab('details');
    setIsEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const title = formData.title.trim();
    if (!title) {
      setFormError(formData.itemType === 'pamphlet' ? 'لطفاً نام درس و عنوان جزوه را وارد نمایید.' : 'لطفاً عنوان رسمی فرم را وارد نمایید.');
      setEditorTab('details');
      return;
    }

    setIsSaving(true);

    const finalDescription = formData.description?.trim() || (formData.itemType === 'pamphlet' 
      ? `جزوه و درسنامه آموزشی درس ${title}` 
      : `فرم و کاربرگ اداری دانشگاه ${title}`);

    const finalCode = formData.code?.trim() || (formData.itemType === 'pamphlet' 
      ? `BOK-${Math.floor(100 + Math.random() * 900)}` 
      : `EDU-${Math.floor(100 + Math.random() * 900)}`);

    const itemToSave = {
      ...formData,
      code: finalCode,
      title,
      description: finalDescription,
      courseCode: formData.courseCode?.trim() || finalCode,
      fileSize: formData.fileSize?.trim() || '۱.۵ مگابایت',
      fieldOfStudy: formData.fieldOfStudy?.trim() || 'عمومی',
      professorName: formData.professorName?.trim() || 'استاد مربوطه'
    };

    const isPamphlet = formData.itemType === 'pamphlet';

    try {
      if (editingId) {
        const existing = forms.find(f => f.id === editingId);
        const fullUpdatedItem: FormItem = {
          ...(existing || {}),
          ...itemToSave,
          id: editingId,
          updatedAt: new Date().toLocaleDateString('fa-IR')
        } as FormItem;

        setForms(prev => prev.map(f => f.id === editingId ? fullUpdatedItem : f));
        setIsEditorOpen(false);
        setEditingId(null);
        setSaveSuccessMessage(isPamphlet ? 'جزوه درسی با موفقیت ویرایش و ذخیره گردید.' : 'فرم با موفقیت ویرایش و ذخیره گردید.');
        storage.updateFormInDB(fullUpdatedItem).catch(err => console.warn('Update form DB error:', err));
      } else {
        setActiveTab(isPamphlet ? 'pamphlets' : 'forms');
        const savedItem = await storage.createFormInDB(itemToSave);
        setForms(prev => [savedItem, ...prev.filter(f => f.id !== savedItem.id && f.id !== itemToSave.id)]);
        setIsEditorOpen(false);
        setEditingId(null);
        setSaveSuccessMessage(isPamphlet ? 'جزوه درسی جدید با موفقیت ثبت و منتشر گردید.' : 'فرم جدید با موفقیت ثبت و منتشر گردید.');
        window.dispatchEvent(new Event('kowsar_forms_changed'));
        fetchFoldersStats();
      }

      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Save form error:', err);
      if (editingId) {
        storage.updateForm({ ...itemToSave, id: editingId } as FormItem);
      } else {
        const fallbackItem = storage.addForm(itemToSave);
        setForms(prev => [fallbackItem, ...prev.filter(f => f.id !== fallbackItem.id)]);
        window.dispatchEvent(new Event('kowsar_forms_changed'));
      }
      setIsEditorOpen(false);
      setEditingId(null);
      setSaveSuccessMessage(isPamphlet ? 'جزوه با موفقیت ذخیره شد.' : 'فرم با موفقیت ذخیره شد.');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteSingleForm = async () => {
    if (!formToDelete) return;
    const id = formToDelete.id;
    const isPamphlet = formToDelete.itemType === 'pamphlet';

    // بروزرسانی فوری استیت محلی جهت حذف بلادرنگ از صفحه بدون نیاز به رفرش
    setForms(prev => prev.filter(item => item.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));
    setFormToDelete(null);

    // حذف بلادرنگ از لوکال استوریج و اطلاع‌رسانی آنی به تمام صفحات و کامپوننت‌ها
    storage.deleteForm(id);
    window.dispatchEvent(new Event('kowsar_forms_changed'));

    setSaveSuccessMessage(isPamphlet ? 'جزوه آموزشی با موفقیت حذف گردید.' : 'فرم با موفقیت حذف گردید.');
    setTimeout(() => setSaveSuccessMessage(null), 4000);

    try {
      await storage.deleteFormFromDB(id);
      fetchFoldersStats();
    } catch (err) {
      console.warn('DB delete single form error:', err);
    }
  };

  const confirmBulkDeleteForms = async () => {
    const idsToDelete = [...selectedIds];
    setForms(prev => prev.filter(item => !idsToDelete.includes(item.id)));
    setSelectedIds([]);
    setShowBulkDeleteConfirm(false);

    // حذف بلادرنگ تمامی موارد از حافظه محلی و انتشار رویداد
    idsToDelete.forEach(id => storage.deleteForm(id));
    window.dispatchEvent(new Event('kowsar_forms_changed'));

    setSaveSuccessMessage(`${idsToDelete.length} مورد با موفقیت حذف شدند.`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);

    try {
      for (const id of idsToDelete) {
        await storage.deleteFormFromDB(id);
      }
      fetchFoldersStats();
    } catch (err) {
      console.warn('DB bulk delete item error:', err);
    }
  };

  const confirmResetFormsToDefault = async () => {
    storage.resetFormsToDefault();
    const updated = storage.getForms();
    setForms(updated);
    setShowResetFormsConfirm(false);
    window.dispatchEvent(new Event('kowsar_forms_changed'));

    try {
      await storage.saveFormsToDB(updated);
      fetchFoldersStats();
    } catch (err) {
      console.warn('DB sync forms error:', err);
    }
  };

  const handleTogglePublish = async (id: string) => {
    const item = forms.find(f => f.id === id);
    if (!item) return;
    const updatedItem = { ...item, isPublished: item.isPublished === false };
    const updated = forms.map(f => f.id === id ? updatedItem : f);
    setForms(updated);
    storage.saveForms(updated, false);

    try {
      await storage.updateFormInDB(updatedItem);
      window.dispatchEvent(new Event('kowsar_forms_changed'));
    } catch (err) {
      console.warn('DB toggle publish error:', err);
    }
  };

  const handleTogglePin = async (id: string) => {
    const item = forms.find(f => f.id === id);
    if (!item) return;
    const newPinnedState = !item.isPinned;
    const updatedItem = { ...item, isPinned: newPinnedState };
    const updated = forms.map(f => f.id === id ? updatedItem : f);
    setForms(updated);
    storage.saveForms(updated, false);
    
    // Instant feedback toast
    const isPamphlet = item.itemType === 'pamphlet';
    setSaveSuccessMessage(
      newPinnedState 
        ? `${isPamphlet ? 'جزوه' : 'فرم'} «${item.title}» با موفقیت به عنوان منتخب برگزیده شد ⭐` 
        : `${isPamphlet ? 'جزوه' : 'فرم'} «${item.title}» از لیست منتخب‌ها خارج شد.`
    );
    setTimeout(() => setSaveSuccessMessage(null), 3500);

    window.dispatchEvent(new Event('kowsar_forms_changed'));

    try {
      await storage.updateFormInDB(updatedItem);
    } catch (err) {
      console.warn('DB toggle pin error:', err);
    }
  };

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(f => f.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkPublish = async (status: boolean) => {
    const updated = forms.map(f => selectedIds.includes(f.id) ? { ...f, isPublished: status } : f);
    setForms(updated);
    storage.saveForms(updated, false);
    setSelectedIds([]);

    try {
      await storage.saveFormsToDB(updated);
    } catch (err) {
      console.warn('DB sync forms error:', err);
    }
  };

  const handleExportCSV = () => {
    const isPamphletTab = activeTab === 'pamphlets';
    const targetList = isPamphletTab ? pamphletsList : adminFormsList;
    const headers = isPamphletTab 
      ? ['کد درس', 'عنوان جزوه', 'نام استاد', 'رشته تحصیلی', 'مقطع', 'نیمسال', 'تعداد صفحات', 'فرمت', 'حجم', 'دانلودها', 'وضعیت']
      : ['کد فرم', 'عنوان فرم', 'دسته‌بندی', 'دپارتمان', 'فرمت', 'حجم', 'تعداد دانلود', 'وضعیت انتشار', 'ویژه/سنجاق'];
    
    const rows = targetList.map(f => isPamphletTab ? [
      `"${f.code || f.courseCode || ''}"`,
      `"${f.title.replace(/"/g, '""')}"`,
      `"${f.professorName || ''}"`,
      `"${f.fieldOfStudy || ''}"`,
      `"${f.degreeLevel || ''}"`,
      `"${f.academicTerm || ''}"`,
      `"${f.pageCount || ''}"`,
      f.fileFormat,
      `"${f.fileSize || ''}"`,
      f.downloadCount || 0,
      f.isPublished !== false ? 'منتشر شده' : 'پیش‌نویس'
    ] : [
      `"${f.code || ''}"`,
      `"${f.title.replace(/"/g, '""')}"`,
      `"${f.category}"`,
      `"${f.department || ''}"`,
      f.fileFormat,
      `"${f.fileSize || ''}"`,
      f.downloadCount || 0,
      f.isPublished !== false ? 'منتشر شده' : 'پیش‌نویس',
      f.isPinned ? 'بله' : 'خیر'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kowsar_${activeTab}_${new Date().toLocaleDateString('fa-IR')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFormatBadge = (format: string) => {
    switch (format.toUpperCase()) {
      case 'PDF':
        return { label: 'PDF', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'DOCX':
        return { label: 'WORD', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'XLSX':
        return { label: 'EXCEL', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'ZIP':
        return { label: 'ZIP', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'PPTX':
        return { label: 'PPTX', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
      default:
        return { label: format, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">مدیریت جزوه و فرم‌ها</h1>
          <p className="text-slate-500 text-sm mt-1">
            سامانه جامع بارگذاری جزوات درسی اساتید، فرم‌های اداری و مالی، آیین‌نامه‌ها و شخصی‌سازی سایدبار
          </p>
        </div>

        {activeTab === 'forms' ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowResetFormsConfirm(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2.5 rounded-2xl shadow-sm text-xs transition-all"
              title="بازگردانی فرم‌های پیش‌فرض دانشگاه"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              فرم‌های پیش‌فرض
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2.5 rounded-2xl shadow-sm text-xs transition-all"
              title="خروجی اکسل فرم‌ها"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              خروجی اکسل
            </button>
            
            <button 
              onClick={handleOpenAddForm}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 text-sm"
            >
              <Plus className="w-5 h-5" />
              افزودن
            </button>
          </div>
        ) : activeTab === 'pamphlets' ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2.5 rounded-2xl shadow-sm text-xs transition-all"
              title="خروجی اکسل جزوات"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              خروجی اکسل
            </button>
            
            <button 
              onClick={handleOpenAddPamphlet}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 text-sm"
            >
              <Plus className="w-5 h-5" />
              افزودن
            </button>
          </div>
        ) : activeTab === 'storage' ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { fetchFoldersStats(); fetchServerFiles(); }}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2.5 rounded-2xl shadow-sm text-xs transition-all"
              title="بروزرسانی فایل‌های سرور"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-600 ${isLoadingServerFiles ? 'animate-spin' : ''}`} />
              بروزرسانی لیست فایل‌ها
            </button>
            <a
              href="/forms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-2xl shadow-sm text-xs transition-all"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              مشاهده در سایت
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <a
              href="/forms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-2xl shadow-sm text-xs transition-all"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              مشاهده صفحه جزوه و فرم‌ها در سایت
            </a>
          </div>
        )}
      </div>
      
      {/* Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 overflow-x-auto pb-px">
        {/* Tab 1: Forms */}
        <button
          type="button"
          onClick={() => { setActiveTab('forms'); setSelectedIds([]); }}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'forms'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-2xl'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>مدیریت فرم‌ها و مدارک اداری</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'forms' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {adminFormsList.length}
          </span>
        </button>

        {/* Tab 2: Pamphlets */}
        <button
          type="button"
          onClick={() => { setActiveTab('pamphlets'); setSelectedIds([]); }}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pamphlets'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-2xl'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>مدیریت جزوات درسی و منابع آموزشی</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'pamphlets' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {pamphletsList.length}
          </span>
        </button>

        {/* Tab 3: Dedicated Server Storage */}
        <button
          type="button"
          onClick={() => { setActiveTab('storage'); setSelectedIds([]); }}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'storage'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-2xl'
          }`}
        >
          <FolderCheck className="w-4 h-4" />
          <span>پوشه‌های اختصاصی سرور (/uploads)</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            نامحدود
          </span>
        </button>

        {/* Tab 3: Sidebar */}
        <button
          type="button"
          onClick={() => setActiveTab('sidebar')}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'sidebar'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-2xl'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>تنظیمات سایدبار و ابزارک‌ها</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'sidebar' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {(siteSettings.formsWidgets || []).length}
          </span>
        </button>
        {/* Tab 4: Settings */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-2xl'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>تنظیمات سربرگ و اطلاعات تماس (صفحه فرم‌ها و جزوات)</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'forms' ? (
        <div className="space-y-6">

          {/* Analytics & Stats Bar for Forms */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">کل فرم‌ها</p>
                <p className="text-2xl font-black text-slate-800">{formsStats.total}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">فعال (عمومی)</p>
                <p className="text-2xl font-black text-slate-800">{formsStats.published}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">پیش‌نویس</p>
                <p className="text-2xl font-black text-slate-800">{formsStats.drafts}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">فرم‌های ویژه</p>
                <p className="text-2xl font-black text-slate-800">{formsStats.pinned}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 col-span-2 sm:col-span-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">مجموع دانلودها</p>
                <p className="text-2xl font-black text-slate-800">{formsStats.totalDownloads}</p>
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
                  placeholder="جستجو در عنوان، کد فرم، دپارتمان یا برچسب‌ها..."
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
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="published">فقط فعال‌ها (عمومی)</option>
                  <option value="draft">فقط پیش‌نویس‌ها</option>
                  <option value="pinned">فقط فرم‌های ویژه / سنجاق</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">همه دسته‌بندی‌ها</option>
                  {DEFAULT_FORM_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">همه فرمت‌ها</option>
                  <option value="pdf">PDF</option>
                  <option value="docx">Word (DOCX)</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="zip">ZIP</option>
                </select>

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

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between p-3.5 bg-blue-50 border border-blue-200 rounded-2xl gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>{selectedIds.length} فرم انتخاب شده است:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkPublish(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    انتشار همگانی
                  </button>
                  <button
                    onClick={() => handleBulkPublish(false)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    تبدیل به پیش‌نویس
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    حذف گروهی
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Content List: Table or Cards */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">فرمی با این مشخصات یافت نشد!</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                می‌توانید فیلترها را تغییر دهید یا اولین فرم جدید را ثبت و بارگذاری نمایید.
              </p>
              <button
                onClick={handleOpenAddForm}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-md"
              >
                ثبت فرم جدید
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
                        <button onClick={handleSelectAll} className="text-slate-500">
                          {selectedIds.length === filteredItems.length ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="p-4">کد و عنوان فرم</th>
                      <th className="p-4">دسته‌بندی و دپارتمان</th>
                      <th className="p-4 text-center">فرمت و حجم</th>
                      <th className="p-4 text-center">وضعیت انتشار</th>
                      <th className="p-4 text-center">ویژه / سنجاق</th>
                      <th className="p-4 text-center">تعداد دانلود</th>
                      <th className="p-4 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredItems.map(item => {
                      const formatBadge = getFormatBadge(item.fileFormat);
                      const isSelected = selectedIds.includes(item.id);

                      return (
                        <tr key={item.id} className={`hover:bg-blue-50/40 transition-colors ${isSelected ? 'bg-blue-50/60' : ''}`}>
                          <td className="p-4 text-center">
                            <button onClick={() => handleToggleSelect(item.id)} className="text-slate-400 hover:text-blue-600">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    {item.code}
                                  </span>
                                  <span className="font-bold text-slate-800 text-sm hover:text-blue-600 cursor-pointer" onClick={() => handleOpenEdit(item)}>
                                    {item.title}
                                  </span>
                                </div>
                                <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1 max-w-md">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="space-y-1">
                              <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold">
                                {item.category}
                              </span>
                              {item.department && (
                                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {item.department}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black border ${formatBadge.bg}`}>
                              {formatBadge.label} ({item.fileSize})
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleTogglePublish(item.id)}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                                item.isPublished !== false
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              {item.isPublished !== false ? 'منتشر شده' : 'پیش‌نویس'}
                            </button>
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleTogglePin(item.id)}
                              className={`p-1.5 rounded-xl transition-all ${
                                item.isPinned
                                  ? 'bg-amber-100 text-amber-600 shadow-sm'
                                  : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                              }`}
                              title={item.isPinned ? 'حذف از فرم‌های ویژه' : 'افزودن به فرم‌های ویژه'}
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          </td>

                          <td className="p-4 text-center font-bold font-mono text-slate-600">
                            {item.downloadCount || 0}
                          </td>

                          <td className="p-4 text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="ویرایش فرم"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setFormToDelete({ id: item.id, title: item.title, itemType: 'form' })}
                                className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="حذف فرم"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => {
                const formatBadge = getFormatBadge(item.fileFormat);
                const isSelected = selectedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between relative group ${
                      isSelected ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' : 'border-slate-200/80 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggleSelect(item.id)}>
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                            {item.code}
                          </span>
                          {item.isPinned && (
                            <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 shadow-sm">
                              <Sparkles className="w-3 h-3" />
                              ویژه
                            </span>
                          )}
                        </div>

                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border ${formatBadge.bg}`}>
                          {formatBadge.label}
                        </span>
                      </div>

                      <h3 
                        className="text-base font-bold text-slate-800 leading-snug hover:text-blue-600 cursor-pointer transition-colors"
                        onClick={() => handleOpenEdit(item)}
                      >
                        {item.title}
                      </h3>

                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 font-light">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                        <span className="bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100 font-medium">
                          {item.category}
                        </span>
                        {item.department && (
                          <span className="text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {item.department}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Download className="w-3.5 h-3.5" />
                        <span>{item.downloadCount || 0} دانلود</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTogglePublish(item.id)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                            item.isPublished !== false
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.isPublished !== false ? 'عمومی' : 'پیش‌نویس'}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setFormToDelete({ id: item.id, title: item.title, itemType: 'form' })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : activeTab === 'pamphlets' ? (
        /* TAB 2: PAMPHLETS MANAGEMENT */
        <div className="space-y-6">

          {/* Analytics & Stats Bar for Pamphlets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">کل جزوات درسی</p>
                <p className="text-2xl font-black text-slate-800">{pamphletsStats.total}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">رشته‌های آموزشی</p>
                <p className="text-2xl font-black text-slate-800">{pamphletsStats.majorsCount}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">اساتید و مدرسین</p>
                <p className="text-2xl font-black text-slate-800">{pamphletsStats.professorsCount}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'pinned' ? 'all' : 'pinned')}
              className={`p-5 rounded-3xl border transition-all flex items-center gap-4 text-right cursor-pointer ${
                statusFilter === 'pinned'
                  ? 'bg-purple-100 border-purple-300 ring-2 ring-purple-400 shadow-md'
                  : 'bg-white border-slate-200/80 hover:border-purple-200 hover:bg-purple-50/50 shadow-sm'
              }`}
              title="کلیک برای نمایش فقط جزوات منتخب"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                statusFilter === 'pinned' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600'
              }`}>
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">جزوات منتخب</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-2xl font-black text-slate-800">{pamphletsStats.pinned}</p>
                  {statusFilter === 'pinned' && (
                    <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">فیلتر فعال</span>
                  )}
                </div>
              </div>
            </button>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-4 col-span-2 sm:col-span-1">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-black">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">مجموع دانلود جزوات</p>
                <p className="text-2xl font-black text-slate-800">{pamphletsStats.totalDownloads}</p>
              </div>
            </div>
          </div>

          {/* Pamphlets Filter Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              
              {/* Search bar */}
              <div className="relative flex-1 max-w-lg">
                <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجو در نام درس، نام استاد، رشته تحصیلی، کد یا سرفصل‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
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

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="published">فقط منتشر شده</option>
                  <option value="draft">فقط پیش‌نویس</option>
                  <option value="pinned">فقط جزوات منتخب ترم ⭐</option>
                </select>

                <select
                  value={fieldFilter}
                  onChange={(e) => setFieldFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[210px]"
                >
                  <option value="all">همه رشته‌های تحصیلی</option>
                  <option value="دروس عمومی (تمامی رشته‌ها)">دروس عمومی (تمامی رشته‌ها)</option>
                  {configuredStudyFields.some(f => f.degreeType === 'associate' || f.degreeType === 'both') && (
                    <optgroup label="مقطع کاردانی">
                      {configuredStudyFields.filter(f => f.degreeType === 'associate' || f.degreeType === 'both').map(field => (
                        <option key={`filter-assoc-${field.id}`} value={field.name}>{field.name}</option>
                      ))}
                    </optgroup>
                  )}
                  {configuredStudyFields.some(f => f.degreeType === 'bachelor' || f.degreeType === 'both') && (
                    <optgroup label="مقطع کارشناسی">
                      {configuredStudyFields.filter(f => f.degreeType === 'bachelor' || f.degreeType === 'both').map(field => (
                        <option key={`filter-bach-${field.id}`} value={field.name}>{field.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>

                <select
                  value={degreeFilter}
                  onChange={(e) => setDegreeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">همه مقاطع تحصیلی</option>
                  {DEGREE_LEVELS.map(deg => (
                    <option key={deg} value={deg}>{deg}</option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">همه گروه‌های آموزشی</option>
                  {DEFAULT_PAMPHLET_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                    title="نمای جدولی"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                    title="نمای کارتی"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <span>{selectedIds.length} جزوه انتخاب شده است:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkPublish(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    انتشار همگانی
                  </button>
                  <button
                    onClick={() => handleBulkPublish(false)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    تبدیل به پیش‌نویس
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    حذف گروهی
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pamphlets List */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">جزوه یا درسنامه‌ای یافت نشد!</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                می‌توانید اولین جزوه درسی را همراه با مشخصات استاد، رشته و سرفصل‌ها ثبت فرمایید.
              </p>
              <button
                onClick={handleOpenAddPamphlet}
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
              >
                افزودن
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* PAMPHLETS TABLE */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-400">
                      <th className="p-4 w-12 text-center">
                        <button onClick={handleSelectAll} className="text-slate-500">
                          {selectedIds.length === filteredItems.length ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="p-4">عنوان جزوه و درس</th>
                      <th className="p-4">استاد / مدرس</th>
                      <th className="p-4">رشته و مقطع تحصیلی</th>
                      <th className="p-4 text-center">ترم و صفحات</th>
                      <th className="p-4 text-center">فرمت و حجم</th>
                      <th className="p-4 text-center">وضعیت انتشار</th>
                      <th className="p-4 text-center">منتخب</th>
                      <th className="p-4 text-center">دانلود</th>
                      <th className="p-4 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredItems.map(item => {
                      const formatBadge = getFormatBadge(item.fileFormat);
                      const isSelected = selectedIds.includes(item.id);

                      return (
                        <tr key={item.id} className={`hover:bg-indigo-50/40 transition-colors ${isSelected ? 'bg-indigo-50/60' : ''}`}>
                          <td className="p-4 text-center">
                            <button onClick={() => handleToggleSelect(item.id)} className="text-slate-400 hover:text-indigo-600">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  {item.courseCode && (
                                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                                      {item.courseCode}
                                    </span>
                                  )}
                                  <span className="font-bold text-slate-800 text-sm hover:text-indigo-600 cursor-pointer" onClick={() => handleOpenEdit(item)}>
                                    {item.title}
                                  </span>
                              {(() => {
                                const rowHighlight = getPamphletHighlight(item.frameColor, item.fieldOfStudy);
                                return (
                                  <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-md ${rowHighlight.badgeBg} ${rowHighlight.badgeText} border ${rowHighlight.badgeBorder} font-bold`}>
                                    <span className={`w-2 h-2 rounded-full ${rowHighlight.dotClass}`} />
                                    {rowHighlight.name.split(' (')[0].replace('هایلایت ', '')}
                                  </span>
                                );
                              })()}
                            </div>
                            <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1 max-w-md">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>

                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                              <User className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{item.professorName || 'نامشخص'}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                                <GraduationCap className="w-3 h-3 text-slate-400" />
                                {item.fieldOfStudy || 'عمومی'}
                              </p>
                              {item.degreeLevel && (
                                <span className="inline-block text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                  {item.degreeLevel}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-bold text-slate-600 block">
                                {item.pageCount || '-'}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {item.academicTerm || 'نیمسال تحصیلی'}
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black border ${formatBadge.bg}`}>
                              {formatBadge.label} ({item.fileSize})
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleTogglePublish(item.id)}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                                item.isPublished !== false
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              {item.isPublished !== false ? 'منتشر شده' : 'پیش‌نویس'}
                            </button>
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleTogglePin(item.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 transition-all ${
                                item.isPinned
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs shadow-amber-500/30 ring-1 ring-amber-300'
                                  : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              }`}
                              title={item.isPinned ? 'حذف از منتخب‌ها' : 'انتخاب به عنوان جزوه برگزیده'}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              {item.isPinned ? 'منتخب' : 'عادی'}
                            </button>
                          </td>

                          <td className="p-4 text-center font-bold font-mono text-slate-600">
                            {item.downloadCount || 0}
                          </td>

                          <td className="p-4 text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              {item.fileUrl && (
                                <a
                                  href={item.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="مشاهده / دانلود فایل جزوه"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}

                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title="ویرایش جزوه"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setFormToDelete({ id: item.id, title: item.title, itemType: 'pamphlet' })}
                                className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="حذف جزوه"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* PAMPHLETS CARDS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => {
                const formatBadge = getFormatBadge(item.fileFormat);
                const isSelected = selectedIds.includes(item.id);
                const highlight = getPamphletHighlight(item.frameColor, item.fieldOfStudy);

                return (
                  <div
                    key={item.id}
                    className={`${highlight.cardBg} ${
                      item.isPinned 
                        ? 'border-amber-300/90 ring-2 ring-amber-400/50 shadow-md shadow-amber-500/10 border-t-[3.5px] border-t-amber-500' 
                        : `${highlight.cardBorder} ${highlight.topBarClass} shadow-xs`
                    } ${highlight.hoverBorder} rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between relative group ${
                      isSelected ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20' : 'hover:shadow-xl'
                    }`}
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggleSelect(item.id)}>
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                          {item.courseCode && (
                            <span className="font-mono text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                              {item.courseCode}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(item.id);
                            }}
                            className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 transition-all ${
                              item.isPinned
                                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs shadow-amber-500/30 ring-1 ring-amber-300/50'
                                : 'bg-white hover:bg-amber-50 text-slate-500 hover:text-amber-700 border border-slate-200/80 shadow-2xs'
                            }`}
                            title={item.isPinned ? 'کلیک برای حذف از منتخب‌ها' : 'کلیک برای افزودن به منتخب‌ها'}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-100" />
                            {item.isPinned ? 'منتخب ترم ⭐' : 'عادی'}
                          </button>
                        </div>

                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border ${formatBadge.bg}`}>
                          {formatBadge.label}
                        </span>
                      </div>

                      <div>
                        <h3 
                          className="text-base font-black text-slate-900 leading-snug hover:text-indigo-600 cursor-pointer transition-colors"
                          onClick={() => handleOpenEdit(item)}
                        >
                          {item.title}
                        </h3>
                        {item.professorName && (
                          <div className={`flex items-center gap-1.5 text-xs ${highlight.teacherText} font-bold mt-1.5`}>
                            <User className="w-3.5 h-3.5" />
                            <span>مدرس: {item.professorName}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 font-light">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                        {item.fieldOfStudy && (
                          <span className="bg-white/80 text-slate-700 border border-slate-200/70 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-slate-500" />
                            {item.fieldOfStudy}
                          </span>
                        )}
                        {item.degreeLevel && (
                          <span className="bg-white/80 text-slate-600 border border-slate-200/70 px-2 py-0.5 rounded-md">
                            {item.degreeLevel}
                          </span>
                        )}
                        {item.pageCount && (
                          <span className={`${highlight.badgeBg} ${highlight.badgeText} border ${highlight.badgeBorder} px-2 py-0.5 rounded-md font-bold`}>
                            {item.pageCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Download className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{item.downloadCount || 0} دریافت</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(item.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.isPinned ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-slate-50'
                          }`}
                          title={item.isPinned ? 'حذف از منتخب‌ها' : 'افزودن به منتخب‌ها'}
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleTogglePublish(item.id)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                            item.isPublished !== false
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.isPublished !== false ? 'عمومی' : 'پیش‌نویس'}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setFormToDelete({ id: item.id, title: item.title, itemType: 'pamphlet' })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : activeTab === 'storage' ? (
        /* TAB: DEDICATED SERVER STORAGE & FILE ARCHIVE */
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>پوشه‌های اختصاصی روی دیسک سرور • بدون محدودیت حجم فایل</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                مرکز مدیریت فایل‌ها و پوشه‌های اختصاصی سرور
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                تمام فایل‌های جزوات درسی در مسیر اختصاصی <code className="bg-white/10 px-2 py-0.5 rounded font-mono text-emerald-300">/uploads/pamphlets/</code> و تمام فرم‌های اداری در مسیر <code className="bg-white/10 px-2 py-0.5 rounded font-mono text-teal-300">/uploads/forms/</code> با امنیت بالا و دسترسی عمومی مستقیم ذخیره می‌شوند.
              </p>
            </div>
          </div>

          {/* Dedicated Folders Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Folder 1: Pamphlets */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                    پوشه اختصاصی جزوات
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">پوشه جزوات درسی و منابع اساتید</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">مسیر دیسک سرور:</span>
                    <code className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold" dir="ltr">/uploads/pamphlets/</code>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">تعداد فایل‌ها:</span>
                    <span className="font-black text-slate-800 text-sm">
                      {serverFoldersStats.find(f => f.name === 'pamphlets')?.count ?? 0} فایل
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">حجم کل ذخیره شده:</span>
                    <span className="font-black text-slate-800 text-sm">
                      {serverFoldersStats.find(f => f.name === 'pamphlets')?.totalSizeFormatted ?? '۰ بایت'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleDirectUploadToFolder(e, 'pamphlets')}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.pptx,.ppt,.txt,.epub,.djvu"
                  />
                  <span className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm">
                    <Upload className="w-4 h-4" />
                    بارگذاری مستقیم جزوه
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServerFolder('pamphlets');
                    fetchServerFiles('pamphlets');
                  }}
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs border transition-colors ${
                    selectedServerFolder === 'pamphlets'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  مشاهده فایل‌ها
                </button>
              </div>
            </div>

            {/* Folder 2: Forms */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold border border-teal-100">
                    پوشه اختصاصی فرم‌ها
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">پوشه فرم‌ها و اسناد اداری دانشگاه</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">مسیر دیسک سرور:</span>
                    <code className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold" dir="ltr">/uploads/forms/</code>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">تعداد فایل‌ها:</span>
                    <span className="font-black text-slate-800 text-sm">
                      {serverFoldersStats.find(f => f.name === 'forms')?.count ?? 0} فایل
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">حجم کل ذخیره شده:</span>
                    <span className="font-black text-slate-800 text-sm">
                      {serverFoldersStats.find(f => f.name === 'forms')?.totalSizeFormatted ?? '۰ بایت'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleDirectUploadToFolder(e, 'forms')}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.pptx,.ppt,.txt,.epub,.djvu"
                  />
                  <span className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm">
                    <Upload className="w-4 h-4" />
                    بارگذاری مستقیم فرم
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServerFolder('forms');
                    fetchServerFiles('forms');
                  }}
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs border transition-colors ${
                    selectedServerFolder === 'forms'
                      ? 'bg-teal-50 text-teal-700 border-teal-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  مشاهده فایل‌ها
                </button>
              </div>
            </div>
          </div>

          {/* Files Explorer Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Explorer Toolbar */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedServerFolder('all'); fetchServerFiles(''); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedServerFolder === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  همه فایل‌ها ({serverFiles.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedServerFolder('pamphlets'); fetchServerFiles('pamphlets'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedServerFolder === 'pamphlets'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  فایل‌های جزوات (/uploads/pamphlets)
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedServerFolder('forms'); fetchServerFiles('forms'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedServerFolder === 'forms'
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  فایل‌های فرم‌ها (/uploads/forms)
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={serverFileSearch}
                    onChange={(e) => setServerFileSearch(e.target.value)}
                    placeholder="جستجوی نام فایل..."
                    className="w-48 sm:w-64 pr-9 pl-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { fetchFoldersStats(); fetchServerFiles(); }}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600"
                  title="بروزرسانی"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingServerFiles ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Table / List */}
            {isLoadingServerFiles ? (
              <div className="p-16 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500">در حال دریافت لیست فایل‌های ذخیره شده در سرور...</p>
              </div>
            ) : serverFiles.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FolderOpen className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-700">هیچ فایلی در این پوشه یافت نشد</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  می‌توانید با استفاده از دکمه‌های بارگذاری بالا، جزوات و فرم‌های خود را بدون محدودیت حجم فایل مستقیماً روی سرور ذخیره کنید.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50/80 text-slate-400 font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-4 pr-6">نام فایل در سرور</th>
                      <th className="p-4">پوشه ذخیره‌سازی</th>
                      <th className="p-4">حجم فایل</th>
                      <th className="p-4">تاریخ بارگذاری</th>
                      <th className="p-4 pl-6 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {serverFiles
                      .filter(f => !serverFileSearch || f.name.toLowerCase().includes(serverFileSearch.toLowerCase()))
                      .map((file, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 pr-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                                {file.ext || 'FILE'}
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-bold text-slate-800 truncate max-w-xs sm:max-w-md" title={file.name}>
                                  {file.name}
                                </p>
                                <span className="font-mono text-[10px] text-slate-400 block truncate" dir="ltr">
                                  {file.url}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              file.folder === 'pamphlets'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : 'bg-teal-50 text-teal-700 border border-teal-100'
                            }`}>
                              /uploads/{file.folder}/
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-700">
                            {file.sizeFormatted}
                          </td>
                          <td className="p-4 text-slate-400">
                            {file.createdAt ? new Date(file.createdAt).toLocaleDateString('fa-IR') : '—'}
                          </td>
                          <td className="p-4 pl-6">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyServerUrl(file.url)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                title="کپی آدرس مستقیم سرور"
                              >
                                {copiedUrl === file.url ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                title="مشاهده / دانلود فایل"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              <button
                                type="button"
                                onClick={() => handleCreateItemFromServerFile(file, file.folder === 'pamphlets' ? 'pamphlet' : 'form')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-colors flex items-center gap-1.5"
                                title="ایجاد رکورد جدید در سایت با این فایل"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{file.folder === 'pamphlets' ? 'ثبت جزوه جدید' : 'ثبت فرم جدید'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteServerFile(file.folder, file.name)}
                                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                                title="حذف از سرور"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      ) : activeTab === 'sidebar' ? (
        /* Tab 3: Sidebar Widgets Management */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                <LayoutTemplate className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  شخصی‌سازی و مدیریت باکس‌های کناری سایدبار
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  باکس‌هایی که در ستون کناری صفحه جزوه و فرم‌ها برای دانشجویان به نمایش درمی‌آیند را در این بخش مدیریت، فعال/غیرفعال یا ویرایش کنید.
                </p>
              </div>
            </div>
          </div>

          <SidebarWidgetsEditor 
            widgets={siteSettings.formsWidgets || []} 
            onChange={(newWidgets) => {
              const newSettings = { ...siteSettings, formsWidgets: newWidgets };
              setSiteSettings(newSettings);
            }} 
          />
        </div>
      ) : activeTab === 'settings' ? (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-800 mb-2">تنظیمات سربرگ و اطلاعات تماس صفحه فرم‌ها و جزوات (forms/)</h2>
            <p className="text-sm text-slate-500">در این بخش می‌توانید متن بنر بالایی، عناوین و شماره تماس‌های پشتیبانی مختص صفحه عمومی «فرم‌ها و جزوات دانشگاهی» را ویرایش کنید.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">متن نشانک بالای بنر (Badge)</label>
              <input 
                type="text" 
                value={siteSettings.formsBadge || ''} 
                onChange={(e) => {
                  const newSettings = { ...siteSettings, formsBadge: e.target.value };
                  setSiteSettings(newSettings);
                }}
                placeholder="بانک منابع درسی و فرم‌های آموزشی"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان بزرگ بنر صفحه</label>
              <input 
                type="text" 
                value={siteSettings.formsTitle || ''} 
                onChange={(e) => {
                  const newSettings = { ...siteSettings, formsTitle: e.target.value };
                  setSiteSettings(newSettings);
                }}
                placeholder="جزوه و فرم‌های دانشگاهی"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">متن توضیحات زیر عنوان در بنر</label>
              <textarea 
                value={siteSettings.formsSubtitle || ''} 
                onChange={(e) => {
                  const newSettings = { ...siteSettings, formsSubtitle: e.target.value };
                  setSiteSettings(newSettings);
                }}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              ></textarea>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-emerald-700 mb-2">ساعات پاسخگویی کارشناسان</label>
              <textarea 
                value={siteSettings.formsSupportHours || ''} 
                onChange={(e) => {
                  const newSettings = { ...siteSettings, formsSupportHours: e.target.value };
                  setSiteSettings(newSettings);
                }}
                rows={2}
                placeholder="شنبه تا چهارشنبه..."
                className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              ></textarea>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-emerald-700 mb-2">شماره تماس آموزش</label>
              <input 
                type="text" 
                value={siteSettings.formsSupportPhone || ''} 
                onChange={(e) => {
                  const newSettings = { ...siteSettings, formsSupportPhone: e.target.value };
                  setSiteSettings(newSettings);
                }}
                dir="ltr"
                placeholder="۰۷۷-۳۵۳۲۲۴۴۱"
                className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
              />
            </div>
            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={() => {
                  storage.updateSettings(siteSettings);
                  alert('تنظیمات با موفقیت ذخیره شد.');
                }}
                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* CREATE / EDIT MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  formData.itemType === 'pamphlet' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {formData.itemType === 'pamphlet' ? <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {editingId 
                      ? (formData.itemType === 'pamphlet' ? 'ویرایش جزوه و منبع درسی' : 'ویرایش فرم و مدرک اداری')
                      : (formData.itemType === 'pamphlet' ? 'افزودن جزوه و درسنامه جدید' : 'افزودن فرم و کاربرگ جدید')
                    }
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    {formData.itemType === 'pamphlet' 
                      ? 'مشخصات درس، نام استاد، رشته، مقطع تحصیلی و بارگذاری فایل جزوه'
                      : 'اطلاعات کامل فرم، دسته‌بندی، مراحل تکمیل و بارگذاری فایل'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/60 p-2 sm:p-2.5 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditorTab('details')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  editorTab === 'details'
                    ? (formData.itemType === 'pamphlet' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25' : 'bg-blue-600 text-white shadow-sm shadow-blue-600/25')
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/70 hover:bg-slate-50'
                }`}
              >
                <FileCheck className="w-4 h-4 shrink-0" />
                <span className="truncate">{formData.itemType === 'pamphlet' ? 'مشخصات و بارگذاری فایل' : 'مشخصات و بارگذاری فایل'}</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorTab('instructions')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  editorTab === 'instructions'
                    ? (formData.itemType === 'pamphlet' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25' : 'bg-blue-600 text-white shadow-sm shadow-blue-600/25')
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/70 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="truncate">{formData.itemType === 'pamphlet' ? 'سرفصل‌ها و توضیحات' : 'راهنما و مدارک لازم'}</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorTab('preview')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  editorTab === 'preview'
                    ? (formData.itemType === 'pamphlet' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25' : 'bg-blue-600 text-white shadow-sm shadow-blue-600/25')
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/70 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span className="truncate">پیش‌نمایش کارت</span>
              </button>
            </div>

            {/* Modal Body Form with noValidate to prevent URL error bugs */}
            <form onSubmit={handleSave} noValidate className="flex flex-col flex-1 overflow-hidden">
              {/* Persistent hidden file input accessible from any tab */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.pptx,.ppt,.txt,.epub,.djvu"
              />

              <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 admin-modal-body">
                {formError && (
                  <div className="p-4 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-200 flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{formError}</span>
                    </div>
                    <button type="button" onClick={() => setFormError(null)} className="text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {saveSuccessMessage && (
                  <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{saveSuccessMessage}</span>
                    </div>
                    <button type="button" onClick={() => setSaveSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* TAB 1: DETAILS */}
                {editorTab === 'details' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Item Type Switcher */}
                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          itemType: 'form', 
                          category: DEFAULT_FORM_CATEGORIES[0] 
                        }))}
                        className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                          formData.itemType !== 'pamphlet'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        فرم / کاربرگ اداری
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          itemType: 'pamphlet', 
                          category: DEFAULT_PAMPHLET_CATEGORIES[0] 
                        }))}
                        className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                          formData.itemType === 'pamphlet'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        جزوه / درسنامه آموزشی
                      </button>
                    </div>

                    {/* PAMPHLET SPECIFIC FIELDS */}
                    {formData.itemType === 'pamphlet' ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">کد درس / شناسه</label>
                            <input
                              type="text"
                              name="code"
                              value={formData.code}
                              onChange={handleInputChange}
                              placeholder="مثلاً: CS-204 یا BOK-101 (اختیاری)"
                              dir="ltr"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-2">نام درس و عنوان جزوه *</label>
                            <input
                              type="text"
                              required
                              name="title"
                              value={formData.title}
                              onChange={handleInputChange}
                              placeholder="مثلاً: جزوه درس ساختمان داده‌ها و الگوریتم‌های کاربردی"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">نام استاد / مدرس</label>
                            <input
                              type="text"
                              name="professorName"
                              value={formData.professorName || ''}
                              onChange={handleInputChange}
                              placeholder="مثلاً: دکتر علوی / مهندس حسینی"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-xs font-bold text-slate-700">رشته و گرایش تحصیلی *</label>
                              <button
                                type="button"
                                onClick={() => setIsCustomField(!isCustomField)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                              >
                                {isCustomField ? 'انتخاب از رشته‌های پیش‌فرض' : 'ورود دستی رشته'}
                              </button>
                            </div>
                            {isCustomField ? (
                              <input
                                type="text"
                                name="fieldOfStudy"
                                value={formData.fieldOfStudy || ''}
                                onChange={handleInputChange}
                                placeholder="نام رشته تحصیلی را وارد کنید..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            ) : (
                              <select
                                name="fieldOfStudy"
                                value={formData.fieldOfStudy || ''}
                                onChange={handleInputChange}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                              >
                                <option value="">انتخاب رشته تحصیلی...</option>
                                <option value="دروس عمومی (تمامی رشته‌ها)">دروس عمومی (تمامی رشته‌ها)</option>
                                {configuredStudyFields.some(f => f.degreeType === 'associate' || f.degreeType === 'both') && (
                                  <optgroup label="مقطع کاردانی">
                                    {configuredStudyFields.filter(f => f.degreeType === 'associate' || f.degreeType === 'both').map(field => (
                                      <option key={`edit-assoc-${field.id}`} value={field.name}>{field.name}</option>
                                    ))}
                                  </optgroup>
                                )}
                                {configuredStudyFields.some(f => f.degreeType === 'bachelor' || f.degreeType === 'both') && (
                                  <optgroup label="مقطع کارشناسی">
                                    {configuredStudyFields.filter(f => f.degreeType === 'bachelor' || f.degreeType === 'both').map(field => (
                                      <option key={`edit-bach-${field.id}`} value={field.name}>{field.name}</option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">مقطع تحصیلی</label>
                            <select
                              name="degreeLevel"
                              value={formData.degreeLevel || DEGREE_LEVELS[0]}
                              onChange={handleInputChange}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {DEGREE_LEVELS.map(deg => (
                                <option key={deg} value={deg}>{deg}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">نیمسال تحصیلی</label>
                            <select
                              name="academicTerm"
                              value={formData.academicTerm || ACADEMIC_TERMS[0]}
                              onChange={handleInputChange}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              {ACADEMIC_TERMS.map(term => (
                                <option key={term} value={term}>{term}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">تعداد صفحات</label>
                            <input
                              type="text"
                              name="pageCount"
                              value={formData.pageCount || ''}
                              onChange={handleInputChange}
                              placeholder="مثلاً: ۷۸ صفحه"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      /* FORM SPECIFIC FIELDS */
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">شناسه یا کد فرم</label>
                            <input
                              type="text"
                              name="code"
                              value={formData.code}
                              onChange={handleInputChange}
                              placeholder="مثلاً: EDU-101 (اختیاری)"
                              dir="ltr"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-2">عنوان رسمی فرم یا آیین‌نامه *</label>
                            <input
                              type="text"
                              required
                              name="title"
                              value={formData.title}
                              onChange={handleInputChange}
                              placeholder="مثلاً: فرم ثبت‌نام و پذیرش دانشجویان جدیدالورود"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">دسته‌بندی موضوعی</label>
                            <select
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

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">دپارتمان یا واحد صادرکننده</label>
                            <input
                              type="text"
                              name="department"
                              value={formData.department}
                              onChange={handleInputChange}
                              placeholder="مثلاً: اداره آموزش و پذیرش"
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Add Custom Category Option - Only for Forms */}
                    {formData.itemType !== 'pamphlet' && (
                      <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="افزودن دسته‌بندی موضوعی جدید..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCategory}
                          className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shrink-0"
                        >
                          ثبت دسته جدید
                        </button>
                      </div>
                    )}

                    {/* Description - only for administrative forms */}
                    {formData.itemType !== 'pamphlet' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          توضیحات، هدف و کاربرد فرم
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="توضیح دهید این فرم ویژه چه دانشجویانی است و چه کاربردی دارد..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* Tags - Only for Forms */}
                    {formData.itemType !== 'pamphlet' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">برچسب‌ها و کلمات کلیدی</label>
                        <div className="flex flex-col sm:flex-row gap-2 mb-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                            placeholder="مثلاً: ثبت‌نام، کاردانی، فرم..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddTag()}
                            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition-colors shrink-0"
                          >
                            افزودن تگ
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {formData.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-xl text-xs font-bold"
                            >
                              #{tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="text-blue-400 hover:text-red-500 mr-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* FILE ATTACHMENT & REPLACEMENT (Integrated in primary tab) */}
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-indigo-600" />
                            {formData.itemType === 'pamphlet' ? 'فایل جزوه و دانلود مستقیم' : 'فایل فرم و دانلود مستقیم'}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {editingId ? 'می‌توانید فایل فعلی را تست یا فایل جدیدی را جایگزین نمایید.' : 'فایل را برای ذخیره در سرور آپلود کنید.'}
                          </p>
                        </div>

                        {formData.fileUrl ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-200">
                            <Check className="w-3.5 h-3.5" />
                            دارای فایل پیوست
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1 border border-amber-200">
                            بدون فایل
                          </span>
                        )}
                      </div>

                      {/* File Format & Size Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">فرمت فایل *</label>
                          <select
                            name="fileFormat"
                            value={formData.fileFormat}
                            onChange={handleInputChange}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="PDF">PDF (سند پی‌دی‌اف)</option>
                            <option value="DOCX">DOCX / Word (ورد)</option>
                            <option value="PPTX">PPTX / PowerPoint (اسلاید)</option>
                            <option value="XLSX">XLSX / Excel (اکسل)</option>
                            <option value="ZIP">ZIP (فایل فشرده)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">حجم فایل (خودکار هنگام آپلود یا دستی)</label>
                          <input
                            type="text"
                            name="fileSize"
                            value={formData.fileSize}
                            onChange={handleInputChange}
                            placeholder="مثلاً: ۲.۴ مگابایت"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Attached File Preview Card */}
                      {formData.fileUrl ? (
                        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-[10px] font-black">
                                {formData.fileFormat || 'PDF'}
                              </span>
                              <span className="text-xs font-bold text-slate-800 font-mono truncate max-w-[260px] sm:max-w-md" dir="ltr">
                                {formData.fileUrl}
                              </span>
                              {formData.fileSize && (
                                <span className="text-[10px] px-2 py-0.5 bg-white text-slate-600 rounded-md border border-slate-200">
                                  {formData.fileSize}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href={formData.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors border border-slate-200"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                                تست دانلود فایل
                              </a>

                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, fileUrl: '', fileSize: '' }))}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                title="حذف پیوند فایل"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Dropzone for Uploading / Replacing */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-2.5 ${
                          isDraggingFile 
                            ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]' 
                            : 'border-slate-300 hover:border-indigo-400 bg-white'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          {isUploading ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-black text-slate-800">
                            {isUploading 
                              ? 'در حال آپلود و ذخیره فایل در سرور...' 
                              : editingId 
                                ? 'برای جایگزینی، فایل جدید جزوه را اینجا بکشید یا دکمه زیر را بزنید' 
                                : 'فایل جزوه را اینجا بکشید یا انتخاب کنید'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            فرمت‌های مجاز: PDF, Word, PowerPoint, Excel, ZIP (بدون محدودیت حجم روی سرور)
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm"
                          >
                            <Upload className="w-4 h-4" />
                            {editingId ? 'انتخاب و آپلود فایل جدید' : 'انتخاب فایل از کامپیوتر'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const folder = formData.itemType === 'pamphlet' ? 'pamphlets' : 'forms';
                              setSelectedServerFolder(folder);
                              fetchServerFiles(folder);
                              setShowServerFilePicker(true);
                            }}
                            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
                          >
                            <FolderOpen className="w-4 h-4 text-emerald-600" />
                            انتخاب از آرشیو سرور
                          </button>
                        </div>
                      </div>

                      {/* Direct manual URL/path input */}
                      <div className="pt-1">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                          آدرس یا مسیر فایل روی سرور (اختیاری):
                        </label>
                        <input
                          type="text"
                          name="fileUrl"
                          value={formData.fileUrl}
                          onChange={handleInputChange}
                          placeholder="/uploads/pamphlets/sample.pdf یا لینک مستقیم"
                          dir="ltr"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-left font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Pamphlet Color Highlight Picker - Placed DIRECTLY below upload box as requested */}
                    {formData.itemType === 'pamphlet' && (
                      <div className="pt-4 border-t border-slate-100">
                        <PamphletHighlightPicker
                          selectedColor={formData.frameColor}
                          fieldOfStudy={formData.fieldOfStudy}
                          onColorChange={(color) => setFormData(prev => ({ ...prev, frameColor: color }))}
                        />
                      </div>
                    )}

                    {/* Publishing & Priority Toggles - Placed in first tab as requested */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                        <input
                          type="checkbox"
                          name="isPublished"
                          checked={formData.isPublished}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">انتشار عمومی در پورتال</span>
                          <span className="text-[11px] text-slate-400">در صورت غیرفعال بودن به صورت پیش‌نویس ذخیره می‌شود</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                        <input
                          type="checkbox"
                          name="isPinned"
                          checked={formData.isPinned}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-amber-500 rounded"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            {formData.itemType === 'pamphlet' ? 'جزوه برگزیده و ویژه ترم (منتخب)' : 'فرم ویژه و ضروری (سنجاق در صدر)'}
                          </span>
                          <span className="text-[11px] text-slate-400">با نشان ویژه و کادر برجسته در صدر لیست نمایش داده می‌شود</span>
                        </div>
                      </label>
                    </div>

                  </div>
                )}

                {/* TAB 3: INSTRUCTIONS & REQUIRED ATTACHMENTS */}
                {editorTab === 'instructions' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Step-by-Step Instructions */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        {formData.itemType === 'pamphlet' ? 'سرفصل‌های آموزشی و نکات مطالعه جزوه' : 'مراحل و راهنمای گام‌به‌گام تکمیل فرم'}
                      </label>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={instructionInput}
                          onChange={(e) => setInstructionInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInstruction(); } }}
                          placeholder={formData.itemType === 'pamphlet' ? 'مثلاً: فصل ۱ - مبانی و مفاهیم مقدماتی...' : 'مثلاً: مراجعه به اداره آموزش پس از اخذ امضای مدیر گروه...'}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddInstruction}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition-colors"
                        >
                          افزودن بند
                        </button>
                      </div>

                      <div className="space-y-2">
                        {formData.instructions?.map((inst, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">
                                {idx + 1}
                              </span>
                              <span>{inst}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveInstruction(idx)}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Required Documents / Attachments (only for admin forms) */}
                    {formData.itemType !== 'pamphlet' && (
                      <div className="pt-4 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          مدارک و پیوست‌های مورد نیاز جهت تحویل
                        </label>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={attachmentInput}
                            onChange={(e) => setAttachmentInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAttachmentReq(); } }}
                            placeholder="مثلاً: کپی کارت ملی و شناسنامه، فیش واریزی..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddAttachmentReq}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition-colors"
                          >
                            افزودن مدرک
                          </button>
                        </div>

                        <div className="space-y-2">
                          {formData.requiredAttachments?.map((att, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                              <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span>{att}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachmentReq(idx)}
                                className="text-slate-400 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* TAB 3: LIVE PREVIEW */}
                {editorTab === 'preview' && (() => {
                  const isPamphlet = formData.itemType === 'pamphlet';
                  const isPinnedPamphlet = isPamphlet && formData.isPinned;
                  const previewHighlight = getPamphletHighlight(formData.frameColor, formData.fieldOfStudy);
                  return (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <p className="text-xs text-slate-500 font-medium">پیش‌نمایش ظاهر نهایی این کارت برای دانشجویان در پورتال:</p>
                      
                      <div className={`${
                        isPamphlet 
                          ? `${previewHighlight.cardBg} ${
                              isPinnedPamphlet 
                                ? 'border-amber-300/90 ring-2 ring-amber-400/50 shadow-md shadow-amber-500/10' 
                                : `${previewHighlight.cardBorder} shadow-sm`
                            } ${isPinnedPamphlet ? 'border-t-[3.5px] border-t-amber-500' : previewHighlight.topBarClass}` 
                          : 'bg-white border-slate-200 shadow-sm'
                      } rounded-3xl p-6 border max-w-md mx-auto relative overflow-hidden transition-all duration-300 flex flex-col justify-between`}>
                        
                        {/* Pinned Distinctive Ribbon for Featured Pamphlet */}
                        {isPinnedPamphlet && (
                          <PinnedCornerRibbon isPinned={true} />
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span className="font-mono text-xs font-black px-2.5 py-1 bg-white/95 text-slate-700 rounded-xl border border-slate-200/80 shadow-2xs">
                                {formData.code || (isPamphlet ? 'BOK-101' : 'FORM-101')}
                              </span>
                              {isPamphlet ? (
                                isPinnedPamphlet && (
                                  <FeaturedPamphletBadge isPinned={true} />
                                )
                              ) : (
                                formData.isPinned && (
                                  <span className="bg-amber-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
                                    <Sparkles className="w-3 h-3" />
                                    فرم ویژه
                                  </span>
                                )
                              )}
                              {isPamphlet && (
                                <span className={`${previewHighlight.badgeBg} ${previewHighlight.badgeText} border ${previewHighlight.badgeBorder} px-2.5 py-1 rounded-xl text-[10px] font-black shadow-2xs`}>
                                  جزوه درسی
                                </span>
                              )}
                            </div>

                            <span className="text-xs font-black px-2.5 py-1 rounded-xl border bg-white text-slate-700 border-slate-200 shadow-2xs">
                              {formData.fileFormat || 'PDF'}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-black text-slate-900 leading-snug">
                              {formData.title || 'عنوان نمونه جزوه / فرم'}
                            </h3>
                            {isPamphlet ? (
                              <div className="space-y-2 mt-2">
                                {formData.professorName && (
                                  <div className={`inline-flex items-center gap-1.5 text-xs ${previewHighlight.teacherText} font-bold bg-white/80 px-2.5 py-1 rounded-xl border border-slate-200/60 shadow-2xs`}>
                                    <User className="w-3.5 h-3.5 shrink-0" />
                                    <span>مدرس: {formData.professorName}</span>
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                                  {formData.fieldOfStudy && (
                                    <span className="flex items-center gap-1.5 bg-white/95 text-slate-700 border border-slate-200/80 px-2.5 py-1 rounded-xl font-medium shadow-2xs">
                                      <GraduationCap className="w-3 h-3 text-slate-500" />
                                      {formData.fieldOfStudy}
                                    </span>
                                  )}
                                  {formData.degreeLevel && (
                                    <span className="bg-white/95 text-slate-600 border border-slate-200/80 px-2.5 py-1 rounded-xl font-medium shadow-2xs">
                                      {formData.degreeLevel}
                                    </span>
                                  )}
                                  {formData.academicTerm && (
                                    <span className="bg-white/95 text-slate-500 border border-slate-200/80 px-2.5 py-1 rounded-xl font-medium shadow-2xs">
                                      {formData.academicTerm}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold mt-2">
                                <Building2 className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                                <span>{formData.department || 'اداره آموزش'}</span>
                              </div>
                            )}
                          </div>

                          {formData.description && (
                            <p className="text-slate-500 text-xs leading-relaxed font-light line-clamp-3">
                              {formData.description}
                            </p>
                          )}

                          <div className="pt-4 border-t border-slate-100/90 flex items-center justify-between text-xs text-slate-500">
                            <span>حجم: <strong className="text-slate-700">{formData.fileSize || '۱ MB'}</strong></span>
                            {formData.pageCount && (
                              <span>تعداد صفحات: <strong className="text-slate-700">{formData.pageCount}</strong></span>
                            )}
                            <span>وضعیت: <strong className={formData.isPublished ? 'text-emerald-700' : 'text-amber-700'}>{formData.isPublished ? 'منتشر شده' : 'پیش‌نویس'}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  انصراف و لغو
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-6 py-2.5 rounded-2xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 ${
                    isSaving ? 'opacity-70 cursor-not-allowed' : ''
                  } ${
                    formData.itemType === 'pamphlet' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isSaving ? 'در حال ثبت و ذخیره...' : (
                    editingId 
                      ? (formData.itemType === 'pamphlet' ? 'ذخیره تغییرات جزوه' : 'ذخیره تغییرات فرم')
                      : (formData.itemType === 'pamphlet' ? 'ثبت و انتشار جزوه' : 'ثبت و انتشار فرم')
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Single Item Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(formToDelete)}
        onClose={() => setFormToDelete(null)}
        onConfirm={confirmDeleteSingleForm}
        title={formToDelete?.itemType === 'pamphlet' ? 'حذف جزوه درسی' : 'حذف فرم دانشگاهی'}
        itemName={formToDelete?.title}
      />

      {/* Bulk Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={confirmBulkDeleteForms}
        title="حذف گروهی موارد انتخاب شده"
        itemCount={selectedIds.length}
        confirmText="بله، همه حذف شوند"
      />

      {/* Reset Forms To Default Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showResetFormsConfirm}
        onClose={() => setShowResetFormsConfirm(false)}
        onConfirm={confirmResetFormsToDefault}
        variant="warning"
        title="بازگردانی فرم‌های استاندارد دانشگاه"
        message="آیا مایل به بازگردانی فرم‌ها به لیست پیش‌فرض و جامع دانشگاه هستید؟ (فرم‌های سفارشی حذف و لیست استاندارد جایگزین خواهد شد)"
        confirmText="بله، بازنشانی شود"
        icon={RotateCcw}
      />

      {/* Server File Picker Modal */}
      {showServerFilePicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">انتخاب از فایل‌های ذخیره‌شده در سرور</h3>
                  <p className="text-[11px] text-slate-400">یکی از فایل‌های ذخیره شده در پوشه سرور را انتخاب کنید</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowServerFilePicker(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedServerFolder('pamphlets'); fetchServerFiles('pamphlets'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedServerFolder === 'pamphlets' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  پوشه جزوات (/uploads/pamphlets)
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedServerFolder('forms'); fetchServerFiles('forms'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedServerFolder === 'forms' ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  پوشه فرم‌ها (/uploads/forms)
                </button>
              </div>
              <button
                type="button"
                onClick={() => fetchServerFiles(selectedServerFolder === 'all' ? '' : selectedServerFolder)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingServerFiles ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {isLoadingServerFiles ? (
                <div className="py-12 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">در حال دریافت لیست فایل‌ها...</p>
                </div>
              ) : serverFiles.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  فایلی در این پوشه یافت نشد. می‌توانید از بخش مدیریت پوشه‌ها فایل بارگذاری نمایید.
                </div>
              ) : (
                serverFiles.map((file, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        fileUrl: file.url,
                        fileSize: file.sizeFormatted,
                        fileFormat: (file.ext || 'PDF').toUpperCase(),
                        title: prev.title.trim() ? prev.title : file.name.replace(/\.[^/.]+$/, "")
                      }));
                      setShowServerFilePicker(false);
                    }}
                    className="py-3 px-3 hover:bg-emerald-50/60 rounded-2xl cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] uppercase">
                        {file.ext || 'FILE'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700" title={file.name}>
                          {file.name}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{file.url}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold">
                        {file.sizeFormatted}
                      </span>
                      <button className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        انتخاب
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {saveSuccessMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 font-bold text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <span>{saveSuccessMessage}</span>
        </div>
      )}
    </div>
  );
}
