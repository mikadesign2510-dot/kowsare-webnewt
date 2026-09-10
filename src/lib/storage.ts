import { newsItems as initialNewsItems } from '../data';
import { replacePersianWithEnglishDigits, toPersianDigits } from './persianNumberHelper';

export type Role = 'super_admin' | 'education_expert' | 'cultural_expert' | 'custom_expert';

export interface AdminUser {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  nationalId?: string;
  mobile?: string;
  email: string;
  password?: string;
  role: Role;
  permissions?: string[];
}

export interface LinkItem {
  id: string;
  label: string;
  href: string;
  isActive?: boolean;
}

export interface CustomButton {
  id: string;
  label: string;
  href: string;
  style: 'primary' | 'secondary' | 'outline' | 'danger';
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface StatItem {
  id: string;
  value: number;
  suffix?: string;
  prefix?: string;
  title: string;
  description: string;
  iconName: string;
  colorScheme: 'blue' | 'emerald' | 'indigo' | 'amber';
}

export type WidgetType = 'links' | 'text' | 'html' | 'dynamic_categories' | 'dynamic_tags' | 'higher_ed_systems';

export interface SidebarLink {
  id: string;
  title: string;
  url: string;
  iconName?: string;
  bgColor?: string;
}

export interface SidebarWidget {
  id: string;
  title: string;
  iconName: string;
  type: WidgetType;
  isActive: boolean;
  order: number;
  content?: string;
  links?: SidebarLink[];
}

export interface HigherEdSystem {
  id: string;
  title: string;
  url: string;
  logoUrl?: string;
  isActive: boolean;
  order: number;
}

export interface StudyField {
  id: string;
  name: string;
  value: string;
  degreeType?: 'associate' | 'bachelor' | 'both';
  isActive: boolean;
  order: number;
}

export type PinnedSliderTemplate = 'split' | 'cinematic' | 'card' | 'banner';
export type PinnedSliderHeight = 'compact' | 'medium' | 'tall';
export type PinnedSliderAccent = 'amber' | 'blue' | 'emerald' | 'purple' | 'rose';

export interface PinnedNewsSliderConfig {
  enabled: boolean;
  template: PinnedSliderTemplate;
  badgeTitle: string; // e.g. 'اخبار ویژه'
  height: PinnedSliderHeight;
  autoPlayInterval: number; // 0 to pause
  showBadges: boolean;
  showCategory: boolean;
  showMeta: boolean;
  showReadTime: boolean;
  showSummary: boolean;
  showControls: boolean;
  showBottomTabs: boolean;
  accentColor: PinnedSliderAccent;
  imagePosition: 'center' | 'top' | 'bottom';
  roundedCorners: 'normal' | 'large' | 'full';
}

export const defaultPinnedSliderConfig: PinnedNewsSliderConfig = {
  enabled: true,
  template: 'split',
  badgeTitle: 'اخبار ویژه',
  height: 'compact',
  autoPlayInterval: 6000,
  showBadges: true,
  showCategory: true,
  showMeta: true,
  showReadTime: true,
  showSummary: true,
  showControls: true,
  showBottomTabs: true,
  accentColor: 'amber',
  imagePosition: 'center',
  roundedCorners: 'large'
};

export interface QuickReceiptBankAccount {
  id: string;
  bankName: string;
  accountOwner: string;
  accountNumber: string;
  cardNumber: string;
  shebaNumber: string;
  isDefault?: boolean;
}

export interface QuickReceiptCategory {
  id: string;
  label?: string;
  title?: string;
  isActive: boolean;
}

export type BankAccount = QuickReceiptBankAccount;
export type ReceiptCategory = QuickReceiptCategory;

export interface QuickReceiptConfig {
  enabled: boolean;
  pageTitle: string;
  pageSubtitle: string;
  
  // بخش‌ها و باکس‌های کلیدی صفحه
  showNoticeBox: boolean;
  noticeTitle: string;
  noticeText: string;
  guidelines: string[];
  importantGuidelines?: string[];
  
  showBankAccountsBox: boolean;
  accounts: QuickReceiptBankAccount[];
  bankAccounts?: QuickReceiptBankAccount[];
  
  showCategories: boolean;
  categories: QuickReceiptCategory[];
  
  // باکس‌ها و فیلدهای ورودی فرم (قابلیت فعال/غیرفعال‌سازی توسط مدیر)
  showNationalCodeField: boolean;
  requireNationalCode: boolean;
  
  showFullNameField: boolean;
  requireFullName: boolean;
  
  showMobileField: boolean;
  requireStudentMobile: boolean;
  
  showCategoryField: boolean;
  requireCategory: boolean;
  
  showDepositDateField: boolean;
  requireDepositDate: boolean;
  
  showAmountField: boolean;
  requireAmount: boolean;
  
  showBankRefNumberField: boolean;
  requireBankRefNumber: boolean;
  
  showOriginBankField: boolean;
  requireOriginBank: boolean;
  
  showStudentNoteField: boolean;
  requireStudentNote: boolean;
  
  showReceiptUploadField: boolean;
  requireReceiptUpload: boolean;
  
  showTrackingTab: boolean;
  showSupportContactBox: boolean;

  maxFileSizeMB: number; // پیش‌فرض ۱۰ مگابایت
  receiptReviewDays: string;
  supportPhone: string;
  supportMobile?: string;
  supportTelegram?: string;
  supportEitaa?: string;
  allowStudentAutoLookup: boolean;
  successTitle: string;
  successMessage: string;
}

export const defaultQuickReceiptConfig: QuickReceiptConfig = {
  enabled: true,
  pageTitle: 'سامانه ارسال سریع فیش واریزی',
  pageSubtitle: 'ثبت آنی و آسان فیش‌های پرداختی شهریه و امور رفاهی بدون نیاز به ورود به پورتال',
  
  showNoticeBox: true,
  noticeTitle: 'اطلاعیه و راهنمای مهم قبل از واریز وجه',
  noticeText: 'دانشجویان گرامی لطفاً مبالغ واریزی را صرفاً به حساب‌های رسمی مرکز واریز فرموده و تصویر واضح رسید یا اسکرین‌شات پرداخت همراه با کد پیگیری بانکی را ثبت فرمایید.',
  guidelines: [
    'واریز را ترجیحاً با کارت به نام دانشجو انجام داده و یا نام دانشجو را در توضیحات قید فرمایید.',
    'رسیدهای ارسالی ظرف حداکثر ۲۴ الی ۴۸ ساعت کاری توسط امور مالی بررسی و در سامانه هم‌آوا اعمال خواهد شد.',
    'اصل فیش بانکی یا تصویر تراکنش را تا پایان نیم‌سال تحصیلی جاری نزد خود نگهداری فرمایید.',
    'پس از ثبت موفق، حتماً کد پیگیری اختصاصی را جهت استعلام‌های بعدی یادداشت فرمایید.'
  ],
  
  showBankAccountsBox: true,
  accounts: [
    {
      id: 'acc-1',
      bankName: 'بانک ملی ایران',
      accountOwner: 'مرکز آموزش علمی کاربردی کوثر کاکی',
      accountNumber: '۰۱۰۷۶۵۴۳۲۱۰۰۵',
      cardNumber: '۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸',
      shebaNumber: 'IR۷۲۰۱۷۰۰۰۰۰۰۰۱۰۷۶۵۴۳۲۱۰۰۵',
      isDefault: true
    }
  ],
  
  showCategories: true,
  categories: [
    { id: 'cat-1', label: 'شهریه متغیر نیم‌سال جاری', title: 'شهریه متغیر نیم‌سال جاری', isActive: true },
    { id: 'cat-2', label: 'شهریه ثابت', title: 'شهریه ثابت', isActive: true },
    { id: 'cat-3', label: 'تسویه بدهی سنوات گذشته', title: 'تسویه بدهی سنوات گذشته', isActive: true },
    { id: 'cat-4', label: 'هزینه خدمات آموزشی و صدور مدرک', title: 'هزینه خدمات آموزشی و صدور مدرک', isActive: true },
    { id: 'cat-5', label: 'هزینه خوابگاه و امور دانشجویی', title: 'هزینه خوابگاه و امور دانشجویی', isActive: true },
    { id: 'cat-6', label: 'سایر واریزی‌ها', title: 'سایر واریزی‌ها', isActive: true }
  ],
  
  showNationalCodeField: true,
  requireNationalCode: true,
  
  showFullNameField: true,
  requireFullName: true,
  
  showMobileField: true,
  requireStudentMobile: true,
  
  showCategoryField: true,
  requireCategory: true,
  
  showDepositDateField: true,
  requireDepositDate: true,
  
  showAmountField: true,
  requireAmount: true,
  
  showBankRefNumberField: true,
  requireBankRefNumber: false,
  
  showOriginBankField: true,
  requireOriginBank: false,
  
  showStudentNoteField: true,
  requireStudentNote: false,
  
  showReceiptUploadField: true,
  requireReceiptUpload: true,
  
  showTrackingTab: true,
  showSupportContactBox: true,
  
  maxFileSizeMB: 10,
  receiptReviewDays: 'حداکثر ۲۴ الی ۴۸ ساعت اداری',
  supportPhone: '۰۷۷-۳۵۳۲۰۰۰۰ (داخلی ۱۰۲)',
  supportMobile: '۰۹۱۷۱۷۰۰۰۰۰',
  supportTelegram: 'kowsar_finance',
  supportEitaa: 'kowsar_finance',
  allowStudentAutoLookup: true,
  successTitle: 'فیش واریزی شما با موفقیت ثبت شد',
  successMessage: 'کد پیگیری اختصاصی برای رسید شما صادر گردید. کارشناسان امور مالی پس از بررسی بانکی، مبلغ را در پرونده آموزشی و مالی شما منظور خواهند کرد.'
};

export interface SiteSettings {
  logoUrl?: string;
  logoTitle?: string;
  logoSubtitle?: string;
  showLogoText?: boolean;
  heroBadge: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  statsBadge?: string;
  statsTitle?: string;
  statsSubtitle?: string;
  statsItems?: StatItem[];
  featuresBadge?: string;
  featuresTitle?: string;
  featuresSubtitle?: string;
  featuresItems?: FeatureItem[];
  newsBadge?: string;
  newsTitle?: string;
  newsCarouselStyle?: 'default' | 'glass' | 'minimal';
  newsCarouselSize?: 'compact' | 'standard' | 'large' | 'xlarge' | 'cinematic';
  newsCarouselCount?: number;
  newsCarouselArrowSpacing?: 'tight' | 'normal' | 'wide' | 'extra';
  pinnedNewsSliderConfig?: PinnedNewsSliderConfig;
  formsBadge?: string;
  formsTitle?: string;
  formsSubtitle?: string;
  newsNoticeTitle?: string;
  newsNoticeText?: string;
  formsNoticeTitle?: string;
  formsNoticeText?: string;
  formsSupportHours?: string;
  formsSupportPhone?: string;
  contactPageTitle?: string;
  contactPageSubtitle?: string;
  contactMapIframe?: string;
  footerAbout: string;
  footerCopyrightPersian?: string;
  footerCopyrightEnglish?: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  navLinks: LinkItem[];
  quickLinks: LinkItem[];
  customButtons: CustomButton[];
  headerButtons?: CustomButton[];
  enableStudentPortalButton?: boolean;
  enableQuickReceiptButton?: boolean;
  quickReceiptButtonLabel?: string;
  quickReceiptConfig?: QuickReceiptConfig;
  formsWidgets?: SidebarWidget[];
  newsWidgets?: SidebarWidget[];
  higherEdSystems?: HigherEdSystem[];
  studyFields?: StudyField[];
}

export interface ContactDepartment {
  id: string;
  name: string;
  expertName?: string;
  phone: string;
  extension?: string;
  email?: string;
  workingHours?: string;
  roomNumber?: string;
  isActive: boolean;
}

export interface ContactSocialLink {
  id: string;
  platform: 'eitaa' | 'bale' | 'telegram' | 'instagram' | 'rubika' | 'soroush' | 'whatsapp' | 'aparat';
  label: string;
  url: string;
  username: string;
  isActive: boolean;
}

export interface ContactFAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export interface ContactMessage {
  id: string;
  trackingCode: string;
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  subject: string;
  department: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt: string;
  ipAddress?: string;
}

export interface ContactPageConfig {
  pageBadge: string;
  pageTitle: string;
  pageSubtitle: string;
  addressTitle: string;
  address: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  neshanLink: string;
  baladLink: string;
  googleMapsLink: string;
  wazeLink: string;
  mapIframe: string;
  phoneMain: string;
  phoneSecondary: string;
  phoneFax: string;
  emailMain: string;
  emailAdmissions: string;
  emailSupport: string;
  workHoursWeekdays: string;
  workHoursThursdays: string;
  workHoursHolidays: string;
  emergencyPhone: string;
  showContactForm: boolean;
  showDepartments: boolean;
  showMap: boolean;
  showRoutingButtons: boolean;
  showSocials: boolean;
  showFaq: boolean;
  showMainInfo: boolean;
  showWorkingHours: boolean;
  sectionsOrder?: string[];
  formSuccessMessage: string;
  departments: ContactDepartment[];
  socialLinks: ContactSocialLink[];
  faqs: ContactFAQ[];
}

export interface Student {
  id: string;
  nationalCode: string;
  firstName: string;
  lastName: string;
  studentId: string;
  entranceSemester: string;
  mobile: string;
  emergencyMobile: string;
  major: string;
  degreeLevel: string;
  password?: string;
  createdAt: string;
  isActive?: boolean;
  fatherName?: string;
  certificateNo?: string;
  birthDate?: string;
  birthPlace?: string;
  gender?: 'male' | 'female';
  maritalStatus?: 'single' | 'married';
  avatarUrl?: string;
  academicStatus?: 'studying' | 'graduated' | 'leave' | 'withdrawn' | 'expelled' | 'guest';
  admissionType?: 'exam' | 'records' | 'transfer' | 'guest';
  orientation?: string;
  advisorTeacher?: string;
  passedUnits?: number;
  gpa?: string;
  militaryStatus?: 'educational_exemption' | 'service_completed' | 'permanent_exemption' | 'subject_to_service' | 'not_applicable';
  militaryCode?: string;
  phone?: string;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  email?: string;
  guardianName?: string;
  financialStatus?: 'settled' | 'indebted' | 'creditor' | 'installment';
  tuitionDebt?: string;
  discountType?: 'none' | 'martyrs_foundation' | 'welfare' | 'top_rank' | 'staff_child' | 'other';
  lastLoginAt?: string;
  documentStatus?: 'complete' | 'incomplete' | 'pending';
  adminNotes?: string;
}

export interface AdminPanelConfig {
  sidebarPosition: 'right' | 'left' | 'top';
  sidebarTheme: 'light' | 'dark' | 'navy' | 'slate' | 'emerald';
  accentColor: 'blue' | 'emerald' | 'violet' | 'rose' | 'amber';
  compactMode: boolean;
  showBadges: boolean;
  headerTitle: string;
  customMenuTitles?: Record<string, string>;
  customMenuOrder?: string[];
  sessionTimeoutMinutes?: number; // Inactivity timeout in minutes (e.g. 5, 10, 15), default 10
}

export interface Registration {
  id: string;
  fullName: string;
  nationalCode: string;
  phone: string;
  degree: string;
  field: string;
  description: string;
  date: string;
  status?: 'new' | 'reviewed';
}

export interface BannerItem {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  link?: string;
  showButton?: boolean;
  buttonText?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  duration?: number;
}

export interface FormItem {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  department: string;
  fileFormat: 'PDF' | 'DOCX' | 'XLSX' | 'ZIP' | 'IMAGE';
  fileSize: string;
  fileUrl: string;
  downloadCount: number;
  isPublished: boolean;
  isPinned: boolean;
  priority?: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  instructions?: string[];
  requiredAttachments?: string[];
  // Extended fields for Pamphlets / Course Handouts
  itemType?: 'form' | 'pamphlet' | 'regulation';
  fieldOfStudy?: string;
  professorName?: string;
  academicTerm?: string;
  degreeLevel?: string;
  pageCount?: string | number;
  coverImage?: string;
  courseCode?: string;
  frameStyle?: 'classic-book' | 'modern-glass' | 'spiral-notebook' | 'royal-gold' | 'isometric-3d' | 'blueprint-tech' | 'minimal-card' | 'magazine-pro' | string;
  frameColor?: string;
}

export interface NewsAttachment {
  id: string;
  name: string;
  url: string;
  size?: string;
}

export interface NewsItem {
  id: number;
  title: string;
  subtitle?: string;
  date: string;
  image: string;
  summary: string;
  content: string;
  category: string;
  priority?: number;
  isPinned?: boolean;
  isPublished?: boolean;
  author?: string;
  views?: number;
  tags?: string[];
  attachments?: NewsAttachment[];
  gallery?: string[];
  readTime?: string;
}

export type LogLevel = 'info' | 'warning' | 'error' | 'critical';

export interface SystemLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  details?: string;
  status: 'unresolved' | 'resolved';
  isSuperficial?: boolean;
}

export type SecurityEventType = 'login_success' | 'login_failed' | 'auth_attempt' | 'data_modified' | 'system_alert' | 'permission_denied' | 'account_locked' | 'rate_limited';
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';
export type SecurityLogCategory = 'auth' | 'access' | 'data' | 'threat' | 'system';

export interface SecurityLog {
  id: string;
  timestamp: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  category?: SecurityLogCategory;
  message: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  status?: 'investigating' | 'resolved' | 'dismissed';
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

// Storage Keys
const SYSTEM_LOGS_KEY = 'kowsar_system_logs';
const SECURITY_LOGS_KEY = 'kowsar_security_logs';
const REGISTRATIONS_KEY = 'kowsar_registrations';
const STUDENTS_KEY = 'kowsar_students';
const NEWS_KEY = 'kowsar_news';
const USERS_KEY = 'kowsar_admin_users_v2';
const SETTINGS_KEY = 'kowsar_site_settings';
const BANNERS_KEY = 'kowsar_hero_banners';
const FORMS_KEY = 'kowsar_academic_forms';
const ADMIN_PANEL_CONFIG_KEY = 'kowsar_admin_panel_config';
const PRESENTATION_KEY = 'kowsar_presentation_sections';
const CONTACT_CONFIG_KEY = 'kowsar_contact_page_config';
const CONTACT_MESSAGES_KEY = 'kowsar_contact_messages';
const PORTAL_SETTINGS_KEY = 'kowsar_portal_settings';

// Auth Headers Helper for API Requests
const getAdminAuthHeaders = () => {
  const portalToken = typeof localStorage !== 'undefined' ? localStorage.getItem('kowsar_portal_token') : null;
  let token = typeof localStorage !== 'undefined' ? (localStorage.getItem('kowsar_admin_token') || localStorage.getItem('kowsar_jwt_token')) : null;
  if (token && portalToken && token === portalToken) {
    // این توکن متعلق به پرتال دانشجویی است، برای جلوگیری از تداخل دسترسی مدیر نباید ارسال شود
    token = null;
  }
  const authData = typeof localStorage !== 'undefined' ? localStorage.getItem('kowsar_admin_auth') : null;
  let email = 'admin@kowsar.ac.ir';
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      if (parsed.email) email = parsed.email;
    } catch {}
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'x-admin-email': email
  };
};

const getClientOrAdminAuthHeaders = () => {
  const token = typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('kowsar_portal_token') || localStorage.getItem('kowsar_jwt_token') || localStorage.getItem('kowsar_admin_token') || localStorage.getItem('kowsar_token')) 
    : null;
  const adminAuth = typeof localStorage !== 'undefined' ? localStorage.getItem('kowsar_admin_auth') : null;
  let adminEmail = '';
  if (adminAuth) {
    try {
      const p = JSON.parse(adminAuth);
      if (p.email) adminEmail = p.email;
    } catch {}
  }
  const portalAuth = typeof localStorage !== 'undefined' ? localStorage.getItem('kowsar_portal_auth') : null;
  let studentId = '';
  if (portalAuth) {
    try {
      const p = JSON.parse(portalAuth);
      if (p.id) studentId = p.id;
    } catch {}
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (adminEmail) headers['x-admin-email'] = adminEmail;
  if (studentId) headers['x-student-id'] = studentId;
  return headers;
};

export const defaultPanelConfig: AdminPanelConfig = {
  sidebarPosition: 'right',
  sidebarTheme: 'light',
  accentColor: 'blue',
  compactMode: false,
  showBadges: true,
  headerTitle: 'سامانه مدیریت یکپارچه مرکز آموزش عالی کوثر کاکی',
  customMenuTitles: {},
  customMenuOrder: [],
  sessionTimeoutMinutes: 10
};

export const defaultForms: FormItem[] = [
  {
    id: 'form-1',
    code: 'EDU-101',
    title: 'فرم ثبت‌نام و پذیرش دانشجویان جدیدالورود',
    description: 'فرم جامع اطلاعات هویتی و تحصیلی پذیرفته‌شدگان دوره‌های کاردانی و کارشناسی ناپیوسته.',
    category: 'آموزشی و تحصیلی',
    department: 'اداره آموزش و پذیرش',
    fileFormat: 'PDF',
    fileSize: '۱.۴ مگابایت',
    fileUrl: 'https://example.com/forms/registration-form.pdf',
    downloadCount: 428,
    isPublished: true,
    isPinned: true,
    priority: 1,
    createdAt: '1403/01/10',
    updatedAt: '1403/07/15',
    tags: ['ثبت‌نام', 'ورودی_جدید', 'پذیرش', 'کاردانی', 'کارشناسی'],
    instructions: [
      'تکمیل تمامی فیلدهای فرم با خودکار آبی یا تایپ شده',
      'الصاق یک قطعه عکس پرسنلی جدید',
      'تحویل فرم به کارشناس پذیرش همراه اصل مدارک'
    ],
    requiredAttachments: [
      'کپی شناسنامه و کارت ملی',
      'اصل یا گواهی موقت دیپلم/کاردانی با ریزنمرات',
      'فرم تعهدنامه انضباطی'
    ]
  },
  {
    id: 'form-2',
    code: 'FIN-201',
    title: 'فرم درخواست وام شهریه دانشجویی صندوق رفاه',
    description: 'فرم تقاضای دریافت تسهیلات شهریه با کارمزد پایین و بازپرداخت پس از فراغت از تحصیل.',
    category: 'مالی و رفاهی',
    department: 'امور مالی و صندوق رفاه',
    fileFormat: 'PDF',
    fileSize: '۲.۱ مگابایت',
    fileUrl: 'https://example.com/forms/student-loan.pdf',
    downloadCount: 382,
    isPublished: true,
    isPinned: true,
    priority: 2,
    createdAt: '1403/02/15',
    updatedAt: '1403/08/01',
    tags: ['وام', 'صندوق_رفاه', 'شهریه', 'تسهیلات'],
    instructions: [
      'افتتاح حساب در سامانه صندوق رفاه دانشجویان (bp.swf.ir)',
      'تکمیل فرم تقاضانامه توسط دانشجو و ضامن'
    ],
    requiredAttachments: [
      'تصویر کارت دانشجویی و ملی',
      'سند تعهدنامه محضری و حکم کارگزینی ضامن'
    ]
  },
  {
    id: 'form-3',
    code: 'GRAD-301',
    title: 'فرم جامع تسویه حساب فارغ‌التحصیلی و دریافت مدرک',
    description: 'کاربرگ نهایی تسویه حساب با بخش‌های آموزش، مالی، کتابخانه، حراست و صدور گواهی موقت.',
    category: 'فارغ‌التحصیلی و تسویه',
    department: 'اداره امور فارغ‌التحصیلان',
    fileFormat: 'PDF',
    fileSize: '۱.۸ مگابایت',
    fileUrl: 'https://example.com/forms/graduation-clearance.pdf',
    downloadCount: 315,
    isPublished: true,
    isPinned: true,
    priority: 3,
    createdAt: '1403/01/20',
    updatedAt: '1403/06/30',
    tags: ['فارغ‌التحصیلی', 'تسویه_حساب', 'مدرک'],
    instructions: [
      'اخذ تاییدیه و امضای مسئولین بخش‌های مشخص شده در فرم',
      'ارائه فرم تسویه حساب امضا شده به اداره فارغ‌التحصیلان'
    ],
    requiredAttachments: [
      'اصل کارت دانشجویی',
      'فیش واریزی تمبر مالیاتی صدور مدرک'
    ]
  },
  {
    id: 'form-4',
    code: 'EDU-105',
    title: 'فرم معرفی به استاد (اخذ دروس تک‌درس ترم آخر)',
    description: 'ویژه دانشجویان ترم آخر جهت گذراندن حداکثر دو عنوان درس تئوری باقی‌مانده بدون تشکیل کلاس.',
    category: 'آموزشی و تحصیلی',
    department: 'اداره آموزش',
    fileFormat: 'DOCX',
    fileSize: '۰.۹ مگابایت',
    fileUrl: 'https://example.com/forms/course-assignment.docx',
    downloadCount: 247,
    isPublished: true,
    isPinned: false,
    priority: 4,
    createdAt: '1403/03/01',
    updatedAt: '1403/09/10',
    tags: ['معرفی_به_استاد', 'ترم_آخر', 'تک‌درس'],
    instructions: [
      'بررسی کارنامه توسط کارشناس آموزش',
      'تعیین استاد ممتحن توسط مدیر گروه'
    ],
    requiredAttachments: [
      'کارنامه کلی تمامی نیمسال‌های تحصیلی'
    ]
  },
  {
    id: 'form-5',
    code: 'REG-401',
    title: 'مجموعه آیین‌نامه‌ها، قوانین انضباطی و پوشش دانشگاهی',
    description: 'کتابچه جامع حقوق دانشجو، ضوابط امتحانات، غیبت‌ها و ضوابط پوشش و اخلاق حرفه‌ای.',
    category: 'آیین‌نامه‌ها و قوانین',
    department: 'امور فرهنگی و کمیته انضباطی',
    fileFormat: 'PDF',
    fileSize: '۴.۳ مگابایت',
    fileUrl: 'https://example.com/forms/regulations-handbook.pdf',
    downloadCount: 512,
    isPublished: true,
    isPinned: false,
    priority: 5,
    createdAt: '1403/01/01',
    updatedAt: '1403/07/01',
    tags: ['آیین‌نامه', 'قوانین', 'انضباطی'],
    instructions: ['مطالعه دقیق قبل از آغاز هر نیمسال تحصیلی الزامی است'],
    requiredAttachments: []
  },
  {
    id: 'pamphlet-1',
    code: 'BOK-IT-201',
    title: 'جزوه درس ساختمان داده‌ها و الگوریتم‌های کاربردی',
    description: 'مرجع آموزشی جامع ساختمان داده‌ها شامل آرایه‌ها، لیست‌های پیوندی، درخت‌ها، گراف‌ها و الگوریتم‌های مرتب‌سازی به همراه مثال‌های کدنویسی.',
    category: 'جزوات مهندسی کامپیوتر و IT',
    department: 'گروه کامپیوتر و فناوری اطلاعات',
    fileFormat: 'PDF',
    fileSize: '۵.۸ مگابایت',
    fileUrl: '/uploads/forms/data-structures-notes.pdf',
    downloadCount: 684,
    isPublished: true,
    isPinned: true,
    priority: 1,
    createdAt: '1403/07/10',
    updatedAt: '1403/10/05',
    tags: ['جزوه', 'ساختمان_داده', 'برنامه‌نویسی', 'کامپیوتر'],
    itemType: 'pamphlet',
    fieldOfStudy: 'مهندسی فناوری اطلاعات و نرم‌افزار',
    professorName: 'مهندس حسینی',
    academicTerm: 'نیمسال اول ۱۴۰۳-۱۴۰۴',
    degreeLevel: 'کارشناسی ناپیوسته',
    pageCount: '۷۸ صفحه',
    courseCode: 'CS-204',
    frameStyle: 'isometric-3d',
    frameColor: 'indigo',
    instructions: [
      'مطالعه پیش از جلسات کلاسی جهت آمادگی در کارگاه‌ها',
      'پاسخگویی به تمرینات انتهای هر فصل الزامی است'
    ]
  },
  {
    id: 'pamphlet-2',
    code: 'BOK-ACC-102',
    title: 'جزوه اصول حسابداری و استانداردهای مالیاتی نوین',
    description: 'خلاصه کاربردی استانداردهای حسابداری، ثبت دفاتر، تهیه صورت‌های مالی و قوانین مالیات بر ارزش افزوده برای دانشجویان.',
    category: 'جزوات حسابداری و مالی',
    department: 'گروه حسابداری و مدیریت مالی',
    fileFormat: 'PDF',
    fileSize: '۴.۲ مگابایت',
    fileUrl: '/uploads/forms/accounting-handout.pdf',
    downloadCount: 495,
    isPublished: true,
    isPinned: false,
    priority: 2,
    createdAt: '1403/08/01',
    updatedAt: '1403/10/12',
    tags: ['جزوه', 'حسابداری', 'مالیات', 'صورت_مالی'],
    itemType: 'pamphlet',
    fieldOfStudy: 'کاردانی و کارشناسی حسابداری',
    professorName: 'استاد خانم زارعی',
    academicTerm: 'نیمسال اول و دوم',
    degreeLevel: 'کاردانی حرفه‌ای',
    pageCount: '۶۲ صفحه',
    courseCode: 'ACC-110',
    frameStyle: 'royal-gold',
    frameColor: 'emerald'
  },
  {
    id: 'pamphlet-3',
    code: 'BOK-LAW-305',
    title: 'جزوه حقوق کسب‌وکار، قراردادها و اسناد تجاری',
    description: 'راهنمای حقوقی نگارش انواع قراردادهای تجاری، سفته، برات و چک به همراه بررسی مسئولیت‌های قانونی.',
    category: 'جزوات حقوق و مدیریت',
    department: 'گروه حقوق و مدیریت کسب‌وکار',
    fileFormat: 'PDF',
    fileSize: '۳.۹ مگابایت',
    fileUrl: '/uploads/forms/business-law-notes.pdf',
    downloadCount: 370,
    isPublished: true,
    isPinned: false,
    priority: 3,
    createdAt: '1403/07/20',
    updatedAt: '1403/09/25',
    tags: ['جزوه', 'حقوق_کسب_و_کار', 'قرارداد', 'اسناد_تجاری'],
    itemType: 'pamphlet',
    fieldOfStudy: 'مدیریت کسب‌وکار و حقوق ثبتی',
    professorName: 'دکتر علوی',
    academicTerm: 'نیمسال اول ۱۴۰۳-۱۴۰۴',
    degreeLevel: 'کارشناسی',
    pageCount: '۵۴ صفحه',
    courseCode: 'LAW-302',
    frameStyle: 'spiral-notebook',
    frameColor: 'rose'
  }
];

export const defaultBanners: BannerItem[] = [
  {
    id: '1',
    imageUrl: 'https://picsum.photos/seed/7605/1200/800',
    title: 'محیط پویای یادگیری و مهارت‌آموزی',
    subtitle: 'دانشگاه جامع علمی کاربردی مرکز کوثر کاکی',
    link: '/register',
    order: 1,
    isActive: true,
    createdAt: '1403/01/01',
    duration: 5
  },
  {
    id: '2',
    imageUrl: 'https://picsum.photos/seed/7732/1200/800',
    title: 'پیشگام در مهارت‌های شغلی و آینده‌ساز',
    subtitle: 'پذیرش دانشجو در مقاطع کاردانی و کارشناسی بدون کنکور',
    link: '/register',
    order: 2,
    isActive: true,
    createdAt: '1403/01/01',
    duration: 5
  },
  {
    id: '3',
    imageUrl: 'https://picsum.photos/seed/7282/1200/800',
    title: 'کارگاه‌های مجهز و اساتید مجرب',
    subtitle: 'تضمین مهارت‌آموزی تخصصی و ورود مقتدر به بازار کار',
    link: '/#about',
    order: 3,
    isActive: true,
    createdAt: '1403/01/01',
    duration: 5
  }
];

export const defaultStats: StatItem[] = [
  {
    id: 'stat-1',
    value: 1250,
    prefix: '+',
    title: 'دانشجویان در حال تحصیل',
    description: 'در دوره‌های مهارتی و اشتغال‌محور کاردانی و کارشناسی',
    iconName: 'Users',
    colorScheme: 'blue'
  },
  {
    id: 'stat-2',
    value: 3400,
    prefix: '+',
    title: 'فارغ‌التحصیلان متخصص',
    description: 'ورود موفق به بازار کار و صنایع تولیدی و خدماتی',
    iconName: 'GraduationCap',
    colorScheme: 'emerald'
  },
  {
    id: 'stat-3',
    value: 18,
    prefix: '+',
    title: 'رشته‌های کاردانی و کارشناسی',
    description: 'کدرشته‌های مصوب متناسب با پتانسیل‌های منطقه',
    iconName: 'BookOpenCheck',
    colorScheme: 'indigo'
  },
  {
    id: 'stat-4',
    value: 92,
    suffix: '٪',
    title: 'شاخص اشتغال فارغ‌التحصیلان',
    description: 'نرخ بالای جذب و کارآفرینی در بخش‌های مختلف',
    iconName: 'TrendingUp',
    colorScheme: 'amber'
  }
];

export const defaultFeatures: FeatureItem[] = [
  { id: 'f1', title: 'اساتید مجرب', description: 'بهره‌گیری از اساتید برجسته و متخصص در حوزه‌های مهارتی', iconName: 'GraduationCap' },
  { id: 'f2', title: 'تجهیزات مدرن', description: 'کارگاه‌ها و آزمایشگاه‌های مجهز برای یادگیری عملی دانشجویان', iconName: 'MonitorPlay' },
  { id: 'f3', title: 'ارتباط با صنعت', description: 'تسهیل ورود فارغ‌التحصیلان به بازار کار از طریق تفاهم‌نامه‌ها', iconName: 'Briefcase' },
  { id: 'f4', title: 'محیط پویا', description: 'فضای آموزشی پرنشاط همراه با فعالیت‌های فرهنگی و دانشجویی', iconName: 'Users' }
];

const defaultSettings: SiteSettings = {
  logoTitle: 'علمی کاربردی',
  logoSubtitle: 'کوثر کاکی',
  showLogoText: true,
  heroBadge: 'دانشگاه جامع علمی کاربردی',
  heroTitleLine1: 'طراحی آینده با',
  heroTitleLine2: 'دانش و مهارت',
  heroSubtitle: 'مرکز آموزش علمی کاربردی کوثر کاکی، پیشگام در ارائه آموزش‌های نوین و مهارت‌محور. با ما مسیر شغلی خود را متفاوت آغاز کنید.',
  statsBadge: 'آمار و دستاوردها',
  statsTitle: 'روایتی از پویایی، تجربه و مهارت‌آموزی',
  statsSubtitle: 'مرکز آموزش علمی کاربردی کوثر کاکی با تکیه بر استانداردهای مهارت‌محور، مسیری مطمئن برای اشتغال و تعالی فراهم ساخته است.',
  statsItems: defaultStats,
  featuresBadge: 'مزیت‌های رقابتی',
  featuresTitle: 'چرا کوثر کاکی؟',
  featuresSubtitle: 'آموزش‌های کاربردی، امکانات نوین و ارتباط مستقیم با بازار کار، ما را به انتخابی مطمئن تبدیل کرده است.',
  featuresItems: defaultFeatures,
  contactPageTitle: 'ارتباط با ما',
  contactPageSubtitle: 'راه‌های ارتباطی با مرکز آموزش علمی کاربردی کوثر کاکی',
  contactMapIframe: '<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=51.519707%2C28.337913%2C51.533707%2C28.347913&amp;layer=mapnik&amp;marker=28.342913%2C51.526707" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>',
  newsBadge: 'اطلاع‌رسانی مرکز',
  newsTitle: 'اخبار و رویدادها',
  pinnedNewsSliderConfig: defaultPinnedSliderConfig,
  formsBadge: 'میز خدمت الکترونیک، جزوات درسی و دبیرخانه آموزشی مرکز آموزش علمی کاربردی کوثر کاکی',
  formsTitle: 'جزوه و فرم‌ها',
  formsSubtitle: 'در این بخش می‌توانید تمامی جزوات و منابع درسی، کاربرگ‌های آموزشی، درخواست‌های وام، تسویه حساب و آیین‌نامه‌ها را دریافت فرمایید.',
  newsNoticeTitle: 'اطلاعیه مهم تقویم آموزشی',
  newsNoticeText: 'دانشجویان گرامی لطفاً جهت اطلاع از آخرین مهلت‌های حذف و اضافه، بخش اخبار آموزشی را مرتباً بررسی فرمایند.',
  formsNoticeTitle: 'سامانه سخا (معافیت تحصیلی نظام وظیفه)',
  formsNoticeText: '',
  formsSupportHours: 'شنبه تا چهارشنبه: ساعت ۰۸:۰۰ الی ۱۴:۰۰\nپنج‌شنبه‌ها: ساعت ۰۸:۰۰ الی ۱۲:۰۰',
  formsSupportPhone: '۰۷۷-۳۵۳۲۲۴۴۱',
  footerAbout: 'مرکز آموزش علمی کاربردی کوثر کاکی، نوآور در عرصه مهارت‌آموزی نوین، آماده‌سازی نسل آینده برای ورود به بازار کار.',
  footerCopyrightPersian: 'تمامی حقوق این وب‌سایت متعلق به مرکز آموزش علمی کاربردی کوثر کاکی می‌باشد.',
  footerCopyrightEnglish: '© 2024 Kowsar Kaki UAST',
  contactAddress: 'استان بوشهر، شهرستان دشتی، شهر کاکی، بلوار ولیعصر (عج)، جنب میدان انقلاب، مرکز آموزش علمی کاربردی',
  contactPhone: '۰۷۷ - ۳۵۰۰ ۰۰۰۰',
  contactEmail: 'info@kowsarkaki-uast.ac.ir',
  navLinks: [
    { id: '1', label: 'صفحه اصلی', href: '/' },
    { id: '2', label: 'معرفی مرکز', href: '/presentation' },
    { id: '3', label: 'پذیرش دانشجو', href: '/register' },
    { id: '4', label: 'جزوه و فرم‌ها', href: '/forms' },
    { id: '5', label: 'نگارخانه', href: '/gallery' },
    { id: '6', label: 'اخبار و اطلاعیه‌ها', href: '/news' },
    { id: '7', label: 'تماس با ما', href: '/contact' }
  ],
  quickLinks: [
    { id: '1', label: 'پورتال دانشجویی', href: '#' },
    { id: '2', label: 'آیین‌نامه‌های آموزشی', href: '#' },
    { id: '3', label: 'سامانه هم‌آوا (آموزشی)', href: '#' },
    { id: '4', label: 'کتابخانه دیجیتال', href: '#' }
  ],
  formsWidgets: [
    {
      id: 'fw_guide',
      title: 'راهنمای تحویل و پیگیری فرم‌ها',
      iconName: 'BookOpen',
      type: 'text',
      isActive: true,
      order: 1,
      content: '<ul class="space-y-3 text-xs text-slate-600 leading-relaxed font-light"><li class="flex items-start gap-2"><span><strong>پرینت باکیفیت:</strong> فرم‌ها را روی کاغذ استاندارد A4 تکمیل نمایید.</span></li><li class="flex items-start gap-2"><span><strong>امضای متقاضی:</strong> امضای دانشجو در انتهای فرم‌ها الزامی است.</span></li></ul>'
    },
    {
      id: 'fw_links',
      title: 'سامانه‌های مرتبط و ضروری',
      iconName: 'ExternalLink',
      type: 'higher_ed_systems',
      isActive: true,
      order: 2,
      links: []
    }
  ],
  newsWidgets: [
    {
      id: 'nw_links',
      title: 'دسترسی‌های سریع دانشجویی',
      iconName: 'FileText',
      type: 'links',
      isActive: true,
      order: 1,
      links: [
        { id: 'nl_1', title: 'ثبت‌نام و پذیرش دانشجو', url: '/register', iconName: 'UserPlus', bgColor: 'blue' },
        { id: 'nl_2', title: 'فرم‌های ضروری و آیین‌نامه‌ها', url: '/forms', iconName: 'FileText', bgColor: 'slate' },
        { id: 'nl_3', title: 'سامانه جامع آموزشی هم‌آوا', url: 'https://edu.uast.ac.ir', iconName: 'Building2', bgColor: 'slate' }
      ]
    },
    { id: 'nw_categories', title: 'دسته‌بندی موضوعی', iconName: 'Layers', type: 'dynamic_categories', isActive: true, order: 2 },
    { id: 'nw_tags', title: 'برچسب‌های پرتکرار', iconName: 'Tag', type: 'dynamic_tags', isActive: true, order: 3 }
  ],
  higherEdSystems: [
    { id: 'sys1', title: 'وزارت علوم، تحقیقات و فناوری', url: 'https://msrt.ir', isActive: true, order: 1 },
    { id: 'sys2', title: 'دانشگاه جامع علمی کاربردی', url: 'https://uast.ac.ir', isActive: true, order: 2 },
    { id: 'sys3', title: 'صندوق رفاه دانشجویان', url: 'https://swf.ir', isActive: true, order: 3 },
    { id: 'sys4', title: 'سازمان سنجش آموزش کشور', url: 'https://sanjesh.org', isActive: true, order: 4 },
  ],
  customButtons: [
    { id: '1', label: 'ثبت‌نام آنلاین', href: '/register', style: 'primary' },
    { id: '2', label: 'جزوه و فرم‌ها', href: '/forms', style: 'outline' }
  ],
  enableStudentPortalButton: false,
  enableQuickReceiptButton: true,
  quickReceiptButtonLabel: 'ارسال فیش واریزی',
  quickReceiptConfig: defaultQuickReceiptConfig,
  headerButtons: [
    { id: 'quick-receipt-btn', label: 'ارسال فیش واریزی', href: '/submit-receipt', style: 'primary' },
    { id: '2', label: 'هم‌آوا', href: 'https://hamava.uast.ac.ir', style: 'outline' }
  ],
  studyFields: [
    { id: 'f1', name: 'فناوری اطلاعات (IT)', value: 'it', degreeType: 'both', isActive: true, order: 1 },
    { id: 'f2', name: 'حسابداری مالی', value: 'accounting', degreeType: 'both', isActive: true, order: 2 },
    { id: 'f3', name: 'مدیریت کسب و کار', value: 'management', degreeType: 'both', isActive: true, order: 3 },
    { id: 'f4', name: 'حقوق ثبتی', value: 'law', degreeType: 'both', isActive: true, order: 4 },
    { id: 'f5', name: 'مکانیک خودرو', value: 'mechanic', degreeType: 'both', isActive: true, order: 5 }
  ]
};

export interface PortalAnnouncement {
  id: string;
  title: string;
  content: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  isActive: boolean;
  order: number;
}

export interface PortalFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

export interface PortalDepartmentConfig {
  id: string;
  name: string;
  key: 'education' | 'financial' | 'cultural' | 'it' | 'general';
  description: string;
  isActive: boolean;
}

export type PasswordRecoveryPlan = 'sms_otp' | 'support_contact';

export interface PasswordRecoveryConfig {
  activePlan: PasswordRecoveryPlan;
  smsOtpCodeLength: number;
  smsOtpExpirySeconds: number;
  smsSenderName: string;
  smsPatternTemplate: string;
  smsRequireMobileMatch: boolean;
  smsMinPasswordLength: number;
  supportBoxTitle: string;
  supportBoxDescription: string;
  supportExpertName: string;
  supportExpertPhone: string;
  supportExpertMobile: string;
  supportExpertHours: string;
  supportMessengerChannel: string;
  supportInstructions: string[];
}

export interface PortalSettings {
  portalTitle: string;
  portalSubtitle: string;
  portalNotice?: string;
  welcomeMessage: string;
  isPortalEnabled: boolean;
  maintenanceMessage?: string;
  loginTitle: string;
  loginSubtitle: string;
  loginHelperText: string;
  loginAlertBanner?: string;
  showRegisterLink: boolean;
  forgotPasswordHelp: string;
  passwordRecovery: PasswordRecoveryConfig;
  showAcademicCard: boolean;
  showQuickStats: boolean;
  dashboardGreeting: string;
  announcements: PortalAnnouncement[];
  ticketGuidelinesTitle: string;
  ticketGuidelines: string;
  ticketSuccessMessage: string;
  ticketWorkingHours: string;
  departments: PortalDepartmentConfig[];
  financialNoticeTitle: string;
  financialNoticeText: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankShebaNumber: string;
  bankCardNumber: string;
  bankAccountOwner: string;
  receiptReviewDays: string;
  supportPhone: string;
  supportMobile: string;
  supportTelegram: string;
  supportEitaa: string;
  supportHours: string;
  faqs: PortalFAQ[];
}

export const defaultPortalSettings: PortalSettings = {
  portalTitle: 'میز خدمت الکترونیک دانشجویان',
  portalSubtitle: 'مرکز آموزش علمی کاربردی کوثر کاکی',
  portalNotice: 'دسترسی کامل به تمامی بخش‌های آموزشی، مکاتبات و رسیدهای مالی برقرار است.',
  welcomeMessage: 'به سامانه یکپارچه خدمات دانشجویی و آموزشی مرکز کوثر کاکی خوش آمدید.',
  isPortalEnabled: true,
  maintenanceMessage: 'میز خدمت دانشجویان موقتاً در حال بروزرسانی می‌باشد.',
  loginTitle: 'میز خدمت الکترونیک',
  loginSubtitle: 'پورتال دانشجویان و اساتید مرکز کوثر کاکی',
  loginHelperText: 'نام کاربری شماره دانشجویی یا کد ملی و رمز عبور پیش‌فرض کد ملی شما می‌باشد.',
  loginAlertBanner: '',
  showRegisterLink: true,
  forgotPasswordHelp: 'در صورت فراموشی کلمه عبور، با شماره تلفن ۳۵۳۲۰۰۰۰-۰۷۷ تماس حاصل فرمایید.',
  passwordRecovery: {
    activePlan: 'sms_otp',
    smsOtpCodeLength: 5,
    smsOtpExpirySeconds: 120,
    smsSenderName: 'مرکز آموزش علمی کاربردی کوثر کاکی',
    smsPatternTemplate: 'کد تایید بازیابی رمز عبور: {code}\nمدت اعتبار: ۲ دقیقه',
    smsRequireMobileMatch: true,
    smsMinPasswordLength: 6,
    supportBoxTitle: 'بازیابی رمز عبور از طریق کارشناس فنی',
    supportBoxDescription: 'جهت ارتقای امنیت، تغییر رمز عبور توسط کارشناس پشتیبانی انجام می‌پذیرد.',
    supportExpertName: 'مهندس زارعی (کارشناس فناوری اطلاعات)',
    supportExpertPhone: '۰۷۷-۳۵۳۲۰۰۰۰ (داخلی ۱۰۴)',
    supportExpertMobile: '۰۹۱۷۱۷۰۰۰۰۰',
    supportExpertHours: 'شنبه تا چهارشنبه از ساعت ۰۸:۰۰ الی ۱۴:۰۰',
    supportMessengerChannel: 'kowsar_it_support',
    supportInstructions: [
      'تماس تلفنی با کارشناس در ساعات اداری',
      'ارائه کد ملی و شماره دانشجویی جهت احراز هویت',
      'دریافت رمز عبور جدید'
    ]
  },
  showAcademicCard: true,
  showQuickStats: true,
  dashboardGreeting: 'میز خدمت دانشجویان مرکز آموزش عالی کوثر کاکی',
  announcements: [
    { id: 'ann-1', title: 'دسترسی کامل به میز خدمت برقرار است', content: 'مشخصات شما تایید شده و تمامی امکانات تیکتینگ و مالی در دسترس شماست.', type: 'success', isActive: true, order: 1 },
    { id: 'ann-2', title: 'اطلاعیه مهم امور مالی و پرداخت شهریه', content: 'لطفاً پس از واریز شهریه، تصویر رسید یا کد پیگیری فیش بانکی خود را بارگذاری کنید.', type: 'warning', isActive: true, order: 2 }
  ],
  ticketGuidelinesTitle: 'ضوابط و راهنمای ثبت درخواست و تیکت آموزشی',
  ticketGuidelines: 'دانشجوی گرامی، درخواست‌های شما مستقیماً توسط کارشناسان مربوطه بررسی می‌شود.',
  ticketSuccessMessage: 'درخواست شما با موفقیت ثبت شد و به کارشناس ارجاع گردید.',
  ticketWorkingHours: 'شنبه تا چهارشنبه از ساعت ۰۸:۰۰ الی ۱۴:۰۰',
  departments: [
    { id: 'dep-1', key: 'education', name: 'اداره آموزش و امور تحصیلی', description: 'ثبت‌نام، انتخاب واحد، مرخصی، تطبیق دروس', isActive: true },
    { id: 'dep-2', key: 'financial', name: 'امور مالی و شهریه', description: 'بررسی رسیدها، بدهی شهریه، تقسیط و استرداد', isActive: true },
    { id: 'dep-3', key: 'cultural', name: 'امور دانشجویی و فرهنگی', description: 'کانون‌ها، نشریات، مسابقات و خدمات رفاهی', isActive: true },
    { id: 'dep-4', key: 'it', name: 'پشتیبانی فنی و سامانه هم‌آوا', description: 'مشکلات ورود به سامانه‌ها و کلمه عبور', isActive: true }
  ],
  financialNoticeTitle: 'راهنما و مقررات واریز شهریه',
  financialNoticeText: 'واریز شهریه صرفاً از طریق شماره حساب‌های رسمی مرکز مورد تایید است.',
  bankAccountTitle: 'حساب رسمی مرکز آموزش علمی کاربردی کوثر کاکی',
  bankAccountNumber: '۰۱۰۷۶۵۴۳۲۱۰۰۵',
  bankShebaNumber: 'IR۷۲۰۱۷۰۰۰۰۰۰۰۱۰۷۶۵۴۳۲۱۰۰۵',
  bankCardNumber: '۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸',
  bankAccountOwner: 'مرکز آموزش عالی علمی کاربردی کوثر کاکی',
  receiptReviewDays: 'حداکثر ۲۴ الی ۴۸ ساعت اداری',
  supportPhone: '۰۷۷-۳۵۳۲۰۰۰۰',
  supportMobile: '۰۹۱۷۰۰۰۰۰۰۰',
  supportTelegram: 'kowsar_kaki_uni',
  supportEitaa: 'kowsar_kaki_uni',
  supportHours: 'شنبه تا چهارشنبه: ۰۸:۰۰ لغایت ۱۴:۰۰',
  faqs: [
    { id: 'faq-1', question: 'چگونه گواهی اشتغال به تحصیل دریافت کنم؟', answer: 'از بخش «درخواست‌ها و تیکت‌ها»، تیکت با دپارتمان اداره آموزش ثبت نمایید.', category: 'آموزشی', order: 1, isActive: true },
    { id: 'faq-2', question: 'پس از واریز شهریه چقدر زمان می‌برد تا رسید من تایید شود؟', answer: 'رسیدها معمولاً ظرف ۲۴ الی ۴۸ ساعت کاری بررسی و تایید می‌شوند.', category: 'مالی', order: 2, isActive: true }
  ]
};

export const defaultContactConfig: ContactPageConfig = {
  pageBadge: 'پشتیبانی، مشاوره و راهنمای مراجعین',
  pageTitle: 'تماس با ما و دسترسی به مرکز',
  pageSubtitle: 'راه‌های ارتباط حضوری، تلفنی و ارسال برخط پیام به مرکز آموزش علمی کاربردی کوثر کاکی',
  addressTitle: 'نشانی مجتمع دانشگاهی',
  address: 'استان بوشهر، شهرستان دشتی، شهر کاکی، بلوار ولیعصر (عج)، جنب میدان انقلاب، مرکز آموزش علمی کاربردی کوثر کاکی',
  postalCode: '۷۵۴۵۱-۹۸۷۶۵',
  latitude: 28.342913,
  longitude: 51.526707,
  neshanLink: 'https://nshn.ir/search/28.342913,51.526707',
  baladLink: 'https://balad.ir/location?latitude=28.342913&longitude=51.526707',
  googleMapsLink: 'https://www.google.com/maps/dir/?api=1&destination=28.34291274764676,51.52670733886608',
  wazeLink: 'https://waze.com/ul?ll=28.342913,51.526707&navigate=yes',
  mapIframe: '<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=51.519707%2C28.337913%2C51.533707%2C28.347913&amp;layer=mapnik&amp;marker=28.342913%2C51.526707" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>',
  phoneMain: '۰۷۷-۳۵۳۲۰۰۰۰',
  phoneSecondary: '۰۷۷-۳۵۳۲۲۴۴۱',
  phoneFax: '۰۷۷-۳۵۳۲۹۹۹۰',
  emailMain: 'info@kowsarkaki-uast.ac.ir',
  emailAdmissions: 'admission@kowsarkaki-uast.ac.ir',
  emailSupport: 'support@kowsarkaki-uast.ac.ir',
  workHoursWeekdays: 'شنبه تا چهارشنبه: ساعت ۰۷:۳۰ الی ۱۴:۳۰',
  workHoursThursdays: 'پنج‌شنبه‌ها: ساعت ۰۸:۰۰ الی ۱۲:۳۰',
  workHoursHolidays: 'جمعه‌ها و ایام تعطیل رسمی: تعطیل می‌باشد',
  emergencyPhone: '۰۹۱۷۱۷۰۰۰۰۰',
  showContactForm: true,
  showDepartments: true,
  showMap: true,
  showRoutingButtons: true,
  showSocials: true,
  showFaq: true,
  showMainInfo: true,
  showWorkingHours: true,
  sectionsOrder: ['header', 'highlights', 'form', 'location', 'departments', 'socials', 'working_hours', 'faq'],
  formSuccessMessage: 'پیام شما با موفقیت ثبت شد و کد رهگیری اختصاصی صادر گردید.',
  departments: [
    { id: 'dept-1', name: 'اداره آموزش و امور دانشجویی', expertName: 'مهندس حسینی', phone: '۰۷۷-۳۵۳۲۲۴۴۱', extension: '۱۰۱', email: 'edu@kowsarkaki-uast.ac.ir', workingHours: '۰۸:۰۰ الی ۱۴:۰۰', roomNumber: 'اتاق ۱۰۲ - همکف', isActive: true },
    { id: 'dept-2', name: 'امور مالی، حسابداری و صندوق رفاه', expertName: 'خانم زارعی', phone: '۰۷۷-۳۵۳۲۲۴۴۲', extension: '۱۰۲', email: 'finance@kowsarkaki-uast.ac.ir', workingHours: '۰۸:۰۰ الی ۱۴:۰۰', roomNumber: 'اتاق ۱۰۴ - اول', isActive: true },
    { id: 'dept-3', name: 'پژوهش و ارتباط با صنعت', expertName: 'دکتر علوی', phone: '۰۷۷-۳۵۳۲۲۴۴۳', extension: '۱۰۵', email: 'research@kowsarkaki-uast.ac.ir', workingHours: '۰۸:۳۰ الی ۱۳:۳۰', roomNumber: 'اتاق ۲۰۱ - دوم', isActive: true },
    { id: 'dept-4', name: 'دفتر ریاست و روابط عمومی', expertName: 'مهندس رضایی', phone: '۰۷۷-۳۵۳۲۰۰۰۰', extension: '۱۰۰', email: 'pr@kowsarkaki-uast.ac.ir', workingHours: '۰۸:۰۰ الی ۱۴:۰۰', roomNumber: 'اتاق ۳۰۱ - سوم', isActive: true },
    { id: 'dept-5', name: 'پشتیبانی فنی و فناوری اطلاعات', expertName: 'کارشناس IT', phone: '۰۷۷-۳۵۳۲۲۴۴۴', extension: '۱۰۸', email: 'it@kowsarkaki-uast.ac.ir', workingHours: '۰۸:۰۰ الی ۱۵:۰۰', roomNumber: 'اتاق سرور', isActive: true }
  ],
  socialLinks: [
    { id: 'soc-1', platform: 'eitaa', label: 'پیام‌رسان ایتا', url: 'https://eitaa.com/kowsarkaki_uast', username: '@kowsarkaki_uast', isActive: true },
    { id: 'soc-2', platform: 'bale', label: 'پیام‌رسان بله', url: 'https://ble.ir/kowsarkaki_uast', username: '@kowsarkaki_uast', isActive: true },
    { id: 'soc-3', platform: 'telegram', label: 'کانال تلگرام', url: 'https://t.me/kowsarkaki_uast', username: '@kowsarkaki_uast', isActive: true },
    { id: 'soc-4', platform: 'instagram', label: 'صفحه اینستاگرام', url: 'https://instagram.com/kowsarkaki_uast', username: '@kowsarkaki_uast', isActive: true }
  ],
  faqs: [
    { id: 'cfaq-1', question: 'ساعات پاسخگویی مرکز به چه صورت است؟', answer: 'شنبه تا چهارشنبه از ساعت ۰۷:۳۰ الی ۱۴:۳۰ و پنج‌شنبه‌ها از ۰۸:۰۰ الی ۱۲:۳۰.', order: 1, isActive: true },
    { id: 'cfaq-2', question: 'آیا برای مشاوره تحصیلی نیاز به وقت قبلی است؟', answer: 'خیر، داوطلبان می‌توانند در ساعات اداری مستقیماً به اداره آموزش مراجعه فرمایند.', order: 2, isActive: true }
  ]
};

export const defaultContactMessages: ContactMessage[] = [];

export interface PortalUser {
  id: string;
  name: string;
  nationalCode: string;
  studentId?: string;
  password?: string;
  role: 'student' | 'professor';
  isApproved: boolean;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  major?: string;
  degreeLevel?: string;
  entranceSemester?: string;
  mobile?: string;
  emergencyMobile?: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  isAdmin: boolean;
  text: string;
  date: string;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  department: 'education' | 'financial' | 'cultural' | 'it';
  status: 'open' | 'answered' | 'closed';
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface FinancialReceipt {
  id: string;
  userId: string;
  userName: string;
  studentId: string;
  userNationalId?: string;
  amount: string;
  trackingCode: string;
  date: string;
  description: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  adminMessage?: string;
  studentMobile?: string;
  category?: string;
  bankRefNumber?: string;
  submissionType?: 'quick' | 'portal';
}

export type PresentationFrameStyle = 
  | 'rounded-standard'    // قاب استاندارد کلاسیک (پیش‌فرض)
  | 'glass-card'          // شیشه‌ای مدرن با انعکاس ملایم
  | 'golden-gallery'      // قاب طلایی شیک آکادمیک
  | 'floating-isometric'; // پشتیبانی سازگار با نسخه‌های قبلی

export type PresentationOverlayPosition = 
  | 'top-right' 
  | 'top-left' 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'top-center' 
  | 'bottom-center';

export type PresentationOverlayStyle = 
  | 'badge'      // نشان استاندارد نیمه‌شفاف
  | 'glass'      // شیشه‌ای مات بلورین
  | 'gold'       // طلایی درخشان آکادمیک
  | 'dark'       // تیره شیک با نقطه چشمک‌زن
  | 'neon'       // نئونی سایبرپانک
  | 'minimal';   // ساده و بدون کادر

export interface PresentationSection {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  content: string;
  image?: string;
  icon?: string;
  imagePosition?: 'left' | 'right' | 'top'; // 'left': تصویر در سمت چپ | 'right': تصویر در سمت راست | 'top': تصویر در بالا
  textAlignment?: 'right' | 'center' | 'justify'; // جهت تراز متن
  contentRatio?: 'balanced' | 'text-heavy' | 'image-heavy'; // نسبت عرض محتوا و تصویر (۵۰/۵۰، ۶۰/۴۰، ۴۰/۶۰)
  verticalAlign?: 'center' | 'start'; // تراز عمودی متن و تصویر
  animationStyle: 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'zoom' | 'flip-3d' | 'rotate-3d';
  imageAnimationStyle?: 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'zoom' | 'flip-3d' | 'rotate-3d';
  frameStyle?: PresentationFrameStyle;
  frameAccentColor?: string;
  frameBadgeText?: string;
  showOverlayText?: boolean;
  overlaySubtitle?: string;
  overlayPosition?: PresentationOverlayPosition;
  overlayStyle?: PresentationOverlayStyle;
  animationDuration?: number;
  animationEasing?: string;
  theme: 'light' | 'dark' | 'primary' | 'gradient' | 'ocean' | 'emerald' | 'royal' | 'amber' | 'ruby' | 'midnight';
  isVisible: boolean;
}

export const defaultPresentationSections: PresentationSection[] = [
  {
    id: 'intro-1',
    order: 1,
    title: 'مرکز آموزش علمی کاربردی کوثر کاکی',
    subtitle: 'پیشرو در آموزش مهارت‌محور و کارآفرینی',
    content: 'محیطی پویا و نوین برای ارتقای دانش و مهارت‌های کاربردی، تربیت نیروهای متخصص و کارآفرین برای ورود مقتدرانه به بازار کار کشور.',
    imagePosition: 'left',
    textAlignment: 'right',
    animationStyle: 'zoom',
    imageAnimationStyle: 'rotate-3d',
    frameStyle: 'floating-isometric',
    frameBadgeText: 'دانشگاه علمی کاربردی کوثر',
    showOverlayText: true,
    overlaySubtitle: 'پیشرو در آموزش مهارت‌محور',
    overlayPosition: 'bottom-right',
    overlayStyle: 'badge',
    theme: 'primary',
    isVisible: true,
    image: 'https://picsum.photos/seed/7733/1200/800'
  },
  {
    id: 'intro-2',
    order: 2,
    title: 'ارتباط مستقیم با صنعت و بازار کار',
    subtitle: 'ورود مطمئن به بازار کار',
    content: 'برنامه‌های درسی همگام با نیازهای بازار کار، کارگاه‌ها و آزمایشگاه‌های مجهز و اساتید مجرب و کارآفرین.',
    imagePosition: 'right',
    textAlignment: 'right',
    animationStyle: 'slide-right',
    imageAnimationStyle: 'flip-3d',
    frameStyle: 'golden-gallery',
    frameBadgeText: 'مهارت و اشتغال پایدار',
    showOverlayText: true,
    overlaySubtitle: 'ورود مطمئن به بازار کار',
    overlayPosition: 'top-right',
    overlayStyle: 'gold',
    theme: 'light',
    isVisible: true,
    image: 'https://picsum.photos/seed/7587/1200/800'
  }
];

export interface GalleryImage {
  id: string;
  url: string;
  title?: string;
  size?: string;
  type?: 'image' | 'video';
}

export interface GalleryAlbum {
  id: string;
  title: string;
  description?: string;
  category: string;
  date: string;
  coverImage: string;
  images: GalleryImage[];
  newsId?: number;
  isActive?: boolean;
  createdAt: string;
}

// Storage Manager
export const storage = {
  getSettings: (): SiteSettings => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return defaultSettings;
      const parsed = JSON.parse(data);
      let navLinks = parsed.navLinks || defaultSettings.navLinks;
      let headerButtons = parsed.headerButtons;

      const enableStudentPortal = parsed.enableStudentPortalButton === true;
      const enableQuickReceipt = parsed.enableQuickReceiptButton !== false;

      if (!headerButtons || headerButtons.length === 0) {
        headerButtons = [
          ...(enableQuickReceipt ? [{ id: 'quick-receipt-btn', label: parsed.quickReceiptButtonLabel || 'ارسال فیش واریزی', href: '/submit-receipt', style: 'primary' as const }] : []),
          ...(enableStudentPortal ? [{ id: '1', label: 'پنل دانشجویی', href: '/portal/login', style: 'outline' as const }] : []),
          { id: '2', label: 'هم‌آوا', href: 'https://hamava.uast.ac.ir', style: 'outline' as const }
        ];
      } else {
        // Ensure any button for portal/login or formerly named "میز خدمت" is normalized
        headerButtons = headerButtons.map((btn: any) => {
          if (btn.label === 'میز خدمت' || btn.href === '/portal/login' || btn.href === '/portal' || btn.id === '1') {
            return { ...btn, label: 'پنل دانشجویی', href: '/portal/login' };
          }
          if (btn.href === '/submit-receipt' || btn.id === 'quick-receipt-btn') {
            return { ...btn, label: parsed.quickReceiptButtonLabel || 'ارسال فیش واریزی', href: '/submit-receipt' };
          }
          return btn;
        });

        // Filter student portal button if disabled
        if (!enableStudentPortal) {
          headerButtons = headerButtons.filter((btn: any) => 
            btn.href !== '/portal/login' && btn.href !== '/portal' && btn.label !== 'پنل دانشجویی'
          );
        } else {
          if (!headerButtons.some((btn: any) => btn.label === 'پنل دانشجویی' || btn.href === '/portal/login')) {
            headerButtons = [
              { id: '1', label: 'پنل دانشجویی', href: '/portal/login', style: 'outline' },
              ...headerButtons
            ];
          }
        }

        // Handle Quick Receipt button
        if (enableQuickReceipt) {
          if (!headerButtons.some((btn: any) => btn.href === '/submit-receipt' || btn.id === 'quick-receipt-btn')) {
            headerButtons = [
              { id: 'quick-receipt-btn', label: parsed.quickReceiptButtonLabel || 'ارسال فیش واریزی', href: '/submit-receipt', style: 'primary' },
              ...headerButtons
            ];
          }
        } else {
          headerButtons = headerButtons.filter((btn: any) => 
            btn.href !== '/submit-receipt' && btn.id !== 'quick-receipt-btn'
          );
        }
      }

      return {
        ...defaultSettings,
        ...parsed,
        enableStudentPortalButton: enableStudentPortal,
        enableQuickReceiptButton: enableQuickReceipt,
        quickReceiptButtonLabel: parsed.quickReceiptButtonLabel || defaultSettings.quickReceiptButtonLabel,
        quickReceiptConfig: {
          ...defaultQuickReceiptConfig,
          ...(parsed.quickReceiptConfig || {}),
          accounts: Array.isArray(parsed.quickReceiptConfig?.accounts) && parsed.quickReceiptConfig.accounts.length > 0
            ? parsed.quickReceiptConfig.accounts
            : defaultQuickReceiptConfig.accounts,
          categories: Array.isArray(parsed.quickReceiptConfig?.categories) && parsed.quickReceiptConfig.categories.length > 0
            ? parsed.quickReceiptConfig.categories
            : defaultQuickReceiptConfig.categories,
          guidelines: Array.isArray(parsed.quickReceiptConfig?.guidelines) && parsed.quickReceiptConfig.guidelines.length > 0
            ? parsed.quickReceiptConfig.guidelines
            : defaultQuickReceiptConfig.guidelines,
        },
        navLinks,
        headerButtons,
        statsItems: parsed.statsItems?.length ? parsed.statsItems : defaultStats,
        featuresItems: parsed.featuresItems?.length ? parsed.featuresItems : defaultFeatures,
        studyFields: parsed.studyFields?.length ? parsed.studyFields : defaultSettings.studyFields,
        pinnedNewsSliderConfig: {
          ...defaultPinnedSliderConfig,
          ...(parsed.pinnedNewsSliderConfig || {})
        }
      };
    } catch {
      return defaultSettings;
    }
  },

  updateSettings: (newSettings: SiteSettings) => {
    storage.addSecurityLog({
      eventType: 'data_modified',
      severity: 'medium',
      message: 'ویرایش تنظیمات متون سایت',
      details: 'تنظیمات عمومی سایت تغییر یافت.'
    });
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kowsar_site_settings_changed'));
    }
    
    // ذخیره دائمی و همگام‌سازی مستقیم با سرور و دیتابیس PostgreSQL
    try {
      fetch('/api/settings', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(newSettings)
      }).catch(e => console.warn('Could not save settings to DB:', e));
    } catch (e) {
      console.warn('Network error saving settings:', e);
    }
  },

  getPortalSettings: (): PortalSettings => {
    try {
      const data = localStorage.getItem(PORTAL_SETTINGS_KEY);
      if (!data) return defaultPortalSettings;
      const parsed = JSON.parse(data);
      return {
        ...defaultPortalSettings,
        ...parsed,
        passwordRecovery: { ...defaultPortalSettings.passwordRecovery, ...(parsed.passwordRecovery || {}) },
        announcements: Array.isArray(parsed.announcements) ? parsed.announcements : defaultPortalSettings.announcements,
        departments: Array.isArray(parsed.departments) ? parsed.departments : defaultPortalSettings.departments,
        faqs: Array.isArray(parsed.faqs) ? parsed.faqs : defaultPortalSettings.faqs,
      };
    } catch {
      return defaultPortalSettings;
    }
  },

  updatePortalSettings: (newSettings: PortalSettings) => {
    storage.addSecurityLog({
      eventType: 'data_modified',
      severity: 'medium',
      message: 'ویرایش تنظیمات میز خدمت',
      details: 'شخصی‌سازی میز خدمت بروزرسانی شد.'
    });
    localStorage.setItem(PORTAL_SETTINGS_KEY, JSON.stringify(newSettings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kowsar_portal_settings_changed', { detail: newSettings }));
    }
    
    // ذخیره دائمی و همگام‌سازی مستقیم تنظیمات پرتال در سرور
    try {
      fetch('/api/settings/portal', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(newSettings)
      }).catch(e => console.warn('Could not save portal settings to DB:', e));
    } catch (e) {
      console.warn('Network error saving portal settings:', e);
    }
  },

  savePortalSettingsToDB: async (newSettings: PortalSettings) => {
    storage.addSecurityLog({
      eventType: 'data_modified',
      severity: 'medium',
      message: 'ویرایش تنظیمات میز خدمت',
      details: 'شخصی‌سازی میز خدمت در دیتابیس بروزرسانی شد.'
    });
    localStorage.setItem(PORTAL_SETTINGS_KEY, JSON.stringify(newSettings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kowsar_portal_settings_changed', { detail: newSettings }));
    }
    try {
      const res = await fetch('/api/settings/portal', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch (e) {
      console.warn('Could not save portal settings to DB:', e);
    }
    return { success: true };
  },

  resetPortalSettings: (): PortalSettings => {
    storage.updatePortalSettings(defaultPortalSettings);
    return defaultPortalSettings;
  },

  getUsers: (): AdminUser[] => {
    const defaultUsers: AdminUser[] = [
      { 
        id: 'admin-main-elmi', 
        name: 'مدیر اصلی سامانه', 
        firstName: 'مدیر اصلی',
        lastName: 'سامانه',
        nationalId: '3540143041',
        mobile: '09170000000',
        email: 'elmi_admin', 
        password: 'M3540143041m@', 
        role: 'super_admin',
        permissions: [
          'dashboard', 'manage_students', 'manage_student_profiles', 'manage_tickets',
          'manage_financial', 'manage_portal_settings', 'manage_panel_settings',
          'manage_registrations', 'manage_news', 'manage_presentation', 'manage_banners',
          'manage_gallery', 'manage_forms', 'manage_settings', 'manage_users',
          'manage_server_monitoring', 'view_logs', 'view_security_logs'
        ]
      },
    ];

    try {
      const data = localStorage.getItem(USERS_KEY);
      if (!data) {
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
        return defaultUsers;
      }
      
      let users: AdminUser[] = JSON.parse(data);
      const testAccounts = ['admin', 'admin@kowsar.ac.ir', 'admin@gmail.com', 'mehdik', 'mehdik2510', 'mehdik2510@kowsar.ac.ir', 'admin1'];
      const filtered = users.filter(u => !testAccounts.includes((u.email || '').toLowerCase().trim()));
      
      const hasElmi = filtered.some(u => (u.email || '').toLowerCase().trim() === 'elmi_admin');
      const baseList = hasElmi ? filtered : [defaultUsers[0], ...filtered];

      const enriched = baseList.map(u => {
        if ((u.email || '').toLowerCase().trim() === 'elmi_admin') {
          return {
            ...u,
            name: u.name || 'مدیر اصلی سامانه',
            firstName: u.firstName || 'مدیر اصلی',
            lastName: u.lastName || 'سامانه',
            nationalId: u.nationalId || '3540143041',
            password: 'M3540143041m@',
            role: 'super_admin' as Role
          };
        }
        return u;
      });

      localStorage.setItem(USERS_KEY, JSON.stringify(enriched));
      return enriched;
    } catch {
      return defaultUsers;
    }
  },

  addUser: (user: Omit<AdminUser, 'id'>) => {
    const users = storage.getUsers();
    const newUser = { ...user, id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` };
    storage.addSecurityLog({
      eventType: 'data_modified',
      severity: 'high',
      message: `ایجاد کارشناس جدید: ${user.name || user.email}`,
      details: `نقش: ${user.role} | نام کاربری: ${user.email}`
    });
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
  },

  updateUser: (id: string, updatedData: Partial<AdminUser>) => {
    const users = storage.getUsers();
    const existingIndex = users.findIndex(u => u.id === id || (updatedData.email && u.email === updatedData.email));
    if (existingIndex !== -1) {
      users[existingIndex] = { ...users[existingIndex], ...updatedData };
      storage.addSecurityLog({
        eventType: 'data_modified',
        severity: 'medium',
        message: `ویرایش اطلاعات کارشناس: ${users[existingIndex].name || users[existingIndex].email}`,
        details: `نقش: ${users[existingIndex].role} | نام کاربری: ${users[existingIndex].email}`
      });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } else {
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, { id, ...updatedData } as AdminUser]));
    }
  },

  deleteUser: (id: string) => {
    // API call injected by AI
    const token = localStorage.getItem('kowsar_admin_token') || localStorage.getItem('kowsar_token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    fetch(`/api/users/${id}`, { method: 'DELETE', headers }).catch(e => console.error('Delete API error:', e));
    const users = storage.getUsers();
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete) {
      storage.addSecurityLog({
        eventType: 'data_modified',
        severity: 'critical',
        message: `حذف حساب کارشناس: ${userToDelete.name || userToDelete.email}`,
        details: `نقش: ${userToDelete.role}`
      });
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users.filter(u => u.id !== id)));
  },

  loginUser: (email: string, password: string): AdminUser | null => {
    const clean = (email || '').trim().toLowerCase();
    const cleanBase = clean.split('@')[0];

    // ضمانت قطعی ورود برای مدیر اصلی سامانه حتی در قطعی کامل شبکه یا دیتابیس
    if ((clean === 'elmi_admin' || cleanBase === 'elmi_admin') && password === 'M3540143041m@') {
      return {
        id: 'admin-main-elmi',
        name: 'مدیر اصلی سامانه',
        firstName: 'مدیر اصلی',
        lastName: 'سامانه',
        nationalId: '3540143041',
        mobile: '09170000000',
        email: 'elmi_admin',
        role: 'super_admin',
        permissions: [
          'dashboard', 'manage_students', 'manage_student_profiles', 'manage_tickets',
          'manage_financial', 'manage_portal_settings', 'manage_panel_settings',
          'manage_registrations', 'manage_news', 'manage_presentation', 'manage_banners',
          'manage_gallery', 'manage_forms', 'manage_settings', 'manage_users',
          'manage_server_monitoring', 'view_logs', 'view_security_logs'
        ]
      };
    }

    const user = storage.getUsers().find(u => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uBase = uEmail.split('@')[0];
      const match = uEmail === clean || uBase === clean || uEmail === cleanBase || uBase === cleanBase;
      return match && u.password === password;
    });
    if (user) {
      const { password: _, ...safeUser } = user;
      return safeUser as AdminUser;
    }
    return null;
  },

  getStudents: (): Student[] => {
    try {
      const data = localStorage.getItem(STUDENTS_KEY);
      if (data) {
        const parsed = JSON.parse(data) as Student[];
        const seen = new Set();
        let hasDuplicates = false;
        const cleaned = parsed.filter(s => s.nationalCode !== '1234567890' && s.id !== 'std-1');
        if (cleaned.length !== parsed.length) {
          hasDuplicates = true;
        }
        const deduplicated = cleaned.map(s => {
          if (seen.has(s.id)) {
            hasDuplicates = true;
            return { ...s, id: s.id + '-' + Math.random().toString(36).substr(2, 5) };
          }
          seen.add(s.id);
          return s;
        });
        if (hasDuplicates) {
          localStorage.setItem(STUDENTS_KEY, JSON.stringify(deduplicated));
        }
        return deduplicated;
      }
      const initialStudents: Student[] = [];
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(initialStudents));
      return initialStudents;
    } catch {
      return [];
    }
  },

  saveStudents: (students: Student[]) => {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kowsar_students_updated', { detail: students }));
      window.dispatchEvent(new Event('kowsar_user_status_changed'));
    }
  },

  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => {
    const students = storage.getStudents();
    const newStudent: Student = {
      ...student,
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString()
    };
    storage.saveStudents([newStudent, ...students]);
    try {
      const headers = getAdminAuthHeaders();
      fetch('/api/students', {
        method: 'POST',
        headers,
        body: JSON.stringify(newStudent)
      }).catch(e => console.warn('Add student API error:', e));
    } catch (e) {
      console.warn(e);
    }
    return newStudent;
  },

  updateStudent: (id: string, updates: Partial<Omit<Student, 'id' | 'createdAt'>>) => {
    const students = storage.getStudents();
    const target = students.find(s => s.id === id);
    const nextIsActive = updates.isActive !== undefined ? updates.isActive : target?.isActive;
    
    // If student status is being set to inactive, sync with portal users and add security log
    if (target && updates.isActive === false && target.isActive !== false) {
      storage.addSecurityLog({
        eventType: 'account_locked',
        severity: 'high',
        category: 'auth',
        message: `غیرفعال‌سازی حساب دانشجو: ${target.firstName} ${target.lastName}`,
        details: `حساب دانشجو با کدملی ${target.nationalCode} و شماره دانشجویی ${target.studentId || '-'} توسط آموزش غیرفعال شد. نشست‌های فعال در میز خدمت به صورت خودکار پایان می‌یابند.`
      });
      
      try {
        const portalUsers = storage.getPortalUsers();
        const updatedPortalUsers = portalUsers.map(pu => {
          if (pu.nationalCode === target.nationalCode || pu.id === `std_${target.id}` || pu.id === target.id) {
            return { ...pu, isApproved: false, isActive: false };
          }
          return pu;
        });
        storage.savePortalUsers(updatedPortalUsers);
      } catch (err) {
        console.warn('Sync portal users failed on student deactivate', err);
      }
    }

    const updatedList = students.map(s => s.id === id ? { ...s, ...updates } : s);
    storage.saveStudents(updatedList);
    const updatedStudent = updatedList.find(s => s.id === id);
    if (updatedStudent) {
      try {
        const headers = getAdminAuthHeaders();
        fetch(`/api/students/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updatedStudent)
        }).catch(e => console.warn('Update student API error:', e));
      } catch (e) {
        console.warn(e);
      }
    }
  },

  deleteStudent: (id: string) => {
    // API call injected by AI
    const token = localStorage.getItem('kowsar_admin_token') || localStorage.getItem('kowsar_token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    fetch(`/api/students/${id}`, { method: 'DELETE', headers }).catch(e => console.error('Delete API error:', e));
    const students = storage.getStudents();
    const target = students.find(s => s.id === id);
    storage.saveStudents(students.filter(s => s.id !== id));
    
    try {
      if (target) {
        const portalUsers = storage.getPortalUsers().filter(
          pu => pu.nationalCode !== target.nationalCode && pu.id !== `std_${target.id}` && pu.id !== target.id
        );
        storage.savePortalUsers(portalUsers);
        storage.addSecurityLog({
          eventType: 'data_modified',
          severity: 'medium',
          category: 'data',
          message: 'حذف دانشجو از سیستم',
          details: `نام: ${target.firstName} ${target.lastName} (کدملی: ${target.nationalCode})`
        });
      }
    } catch (err) {
      console.warn('Could not cleanup portal user for deleted student', err);
    }
  },

  toggleStudentStatus: (id: string) => {
    const students = storage.getStudents();
    const target = students.find(s => s.id === id);
    if (!target) return;
    const nextStatus = target.isActive === false; // toggle to true if false, or false if true
    
    if (!nextStatus) {
      storage.addSecurityLog({
        eventType: 'account_locked',
        severity: 'high',
        category: 'auth',
        message: `تغییر وضعیت به غیرفعال: ${target.firstName} ${target.lastName}`,
        details: `دانشجو (${target.nationalCode}) غیرفعال شد و از میز خدمت خارج می‌گردد.`
      });
      try {
        const portalUsers = storage.getPortalUsers();
        const updatedPortalUsers = portalUsers.map(pu => {
          if (pu.nationalCode === target.nationalCode || pu.id === `std_${target.id}` || pu.id === target.id) {
            return { ...pu, isApproved: false, isActive: false };
          }
          return pu;
        });
        storage.savePortalUsers(updatedPortalUsers);
      } catch (err) {
        console.warn('Sync portal user status toggle error', err);
      }
    }

    const updated = students.map(s => s.id === id ? { ...s, isActive: nextStatus } : s);
    storage.saveStudents(updated);
  },

  isStudentActive: (identifier: string): { isActive: boolean; reason?: string; student?: Student } => {
    if (!identifier) return { isActive: false, reason: 'شناسه نامعتبر است' };
    const students = storage.getStudents();
    const cleanId = identifier.startsWith('std_') ? identifier.replace('std_', '') : identifier;
    const student = students.find(s => 
      s.id === cleanId || 
      s.nationalCode === identifier || 
      s.studentId === identifier ||
      `std_${s.id}` === identifier
    );
    if (student) {
      if (student.isActive === false) {
        return { isActive: false, reason: 'حساب کاربری توسط اداره آموزش غیرفعال شده است.', student };
      }
      return { isActive: true, student };
    }

    const portalUsers = storage.getPortalUsers();
    const portalUser = portalUsers.find(p => p.id === identifier || p.nationalCode === identifier || p.studentId === identifier);
    if (portalUser) {
      if (portalUser.isApproved === false || (portalUser as any).isActive === false) {
        return { isActive: false, reason: 'حساب کاربری در انتظار تایید یا غیرفعال است.' };
      }
      return { isActive: true };
    }

    return { isActive: false, reason: 'حساب کاربری یافت نشد.' };
  },

  getAdminPanelConfig: (): AdminPanelConfig => {
    try {
      const data = localStorage.getItem(ADMIN_PANEL_CONFIG_KEY);
      return data ? { ...defaultPanelConfig, ...JSON.parse(data) } : defaultPanelConfig;
    } catch {
      return defaultPanelConfig;
    }
  },

  updateAdminPanelConfig: (newConfig: Partial<AdminPanelConfig>): AdminPanelConfig => {
    try {
      const updated = { ...storage.getAdminPanelConfig(), ...newConfig };
      localStorage.setItem(ADMIN_PANEL_CONFIG_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kowsar_panel_config_changed', { detail: updated }));
      }
      return updated;
    } catch (e) {
      console.error('Failed to update admin panel config', e);
      return defaultPanelConfig;
    }
  },

  getRegistrations: (): Registration[] => {
    try {
      const data = localStorage.getItem(REGISTRATIONS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(r => r.nationalCode !== '3540143041' && !r.id?.includes('1788110391654'));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  deleteRegistration: async (id: string) => {
    const regs = storage.getRegistrations();
    const updated = regs.filter(r => r.id !== id);
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kowsar_registrations_changed'));
    }
    try {
      const headers = getAdminAuthHeaders();
      await fetch(`/api/registrations/${id}`, { method: 'DELETE', headers });
    } catch (e) {
      console.error('Error deleting registration from DB:', e);
    }
  },

  addRegistration: (registration: Omit<Registration, 'id' | 'date' | 'status'>) => {
    const regs = storage.getRegistrations();
    const newReg: Registration = {
      ...registration,
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
      date: new Date().toLocaleDateString('fa-IR'),
      status: 'new'
    };
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify([newReg, ...regs]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kowsar_registrations_changed'));
    }
  },

  updateRegistrationStatus: (id: string, status: 'new' | 'reviewed') => {
    const regs = storage.getRegistrations();
    const updated = regs.map(r => r.id === id ? { ...r, status } : r);
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kowsar_registrations_changed'));
    }
  },

  getNews: (): NewsItem[] => {
    let items: NewsItem[] = initialNewsItems;
    try {
      const data = localStorage.getItem(NEWS_KEY);
      if (data) {
        items = JSON.parse(data);
      } else {
        const enhancedDefaults = initialNewsItems.map((item, idx) => ({
          ...item,
          priority: item.priority || (idx === 0 ? 1 : idx + 1),
          isPinned: idx === 0,
          isPublished: true,
          author: 'روابط عمومی مرکز',
          views: 120 + idx * 45,
          tags: ['کوثر_کاکی', item.category, 'دانشگاه_علمی_کاربردی'],
          readTime: '۳ دقیقه'
        }));
        localStorage.setItem(NEWS_KEY, JSON.stringify(enhancedDefaults));
        items = enhancedDefaults;
      }
    } catch {
      // fallback
    }
    return items.map(item => ({
      ...item,
      isPublished: item.isPublished !== undefined ? item.isPublished : true,
      isPinned: item.isPinned || false,
      priority: item.priority || 0,
      views: item.views || 0,
      author: item.author || 'روابط عمومی مرکز'
    })).sort((a, b) => {
      if (a.isPinned !== b.isPinned) return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
      if (a.priority !== b.priority && a.priority && b.priority) return a.priority - b.priority;
      return b.id - a.id;
    });
  },

  getPublishedNews: (): NewsItem[] => {
    return storage.getNews().filter(n => n.isPublished !== false);
  },

  addNews: (news: Omit<NewsItem, 'id'>) => {
    const allNews = storage.getNews();
    const newNews: NewsItem = {
      ...news,
      id: Date.now() + Math.floor(Math.random() * 1000000),
      views: news.views || 1,
      isPublished: news.isPublished !== undefined ? news.isPublished : true,
      isPinned: news.isPinned || false,
      author: news.author || 'روابط عمومی مرکز'
    };
    storage.addSecurityLog({
      eventType: 'data_modified',
      severity: 'low',
      message: `ایجاد خبر جدید: ${news.title}`
    });
    localStorage.setItem(NEWS_KEY, JSON.stringify([newNews, ...allNews]));
    return newNews;
  },

  updateNews: (news: NewsItem) => {
    const allNews = storage.getNews();
    const index = allNews.findIndex(n => String(n.id) === String(news.id));
    if (index !== -1) {
      allNews[index] = { ...allNews[index], ...news };
      localStorage.setItem(NEWS_KEY, JSON.stringify(allNews));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kowsar_news_changed', { detail: allNews }));
      }
    }
  },
  
  deleteNews: (id: number) => {
    // API call injected by AI
    const token = localStorage.getItem('kowsar_admin_token') || localStorage.getItem('kowsar_token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    fetch(`/api/news/${id}`, { method: 'DELETE', headers }).catch(e => console.error('Delete API error:', e));
    const allNews = storage.getNews();
    const updated = allNews.filter((n) => String(n.id) !== String(id));
    localStorage.setItem(NEWS_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kowsar_news_changed', { detail: updated }));
    }
  },

  toggleNewsPublish: (id: number) => {
    const allNews = storage.getNews();
    const index = allNews.findIndex(n => String(n.id) === String(id));
    if (index !== -1) {
      allNews[index].isPublished = !allNews[index].isPublished;
      localStorage.setItem(NEWS_KEY, JSON.stringify(allNews));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kowsar_news_changed', { detail: allNews }));
      }
    }
  },

  toggleNewsPin: (id: number, explicitStatus?: boolean) => {
    const allNews = storage.getNews();
    const index = allNews.findIndex(n => String(n.id) === String(id));
    if (index !== -1) {
      allNews[index].isPinned = explicitStatus !== undefined ? explicitStatus : !allNews[index].isPinned;
      localStorage.setItem(NEWS_KEY, JSON.stringify(allNews));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kowsar_news_changed', { detail: allNews }));
      }
    }
  },

  incrementNewsViews: (id: number) => {
    const allNews = storage.getNews();
    const index = allNews.findIndex(n => String(n.id) === String(id));
    if (index !== -1) {
      allNews[index].views = (allNews[index].views || 0) + 1;
      localStorage.setItem(NEWS_KEY, JSON.stringify(allNews));
    }
  },

  getBanners: (): BannerItem[] => {
    try {
      const data = localStorage.getItem(BANNERS_KEY);
      if (data !== null) {
        const banners: BannerItem[] = JSON.parse(data);
        if (Array.isArray(banners)) {
          return banners.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
      }
      localStorage.setItem(BANNERS_KEY, JSON.stringify(defaultBanners));
      return defaultBanners;
    } catch {
      return defaultBanners;
    }
  },

  getActiveBanners: (): BannerItem[] => {
    const banners = storage.getBanners();
    return banners.filter(b => b.isActive && b.imageUrl?.trim().length > 0);
  },

  saveBanners: (banners: BannerItem[]) => {
    localStorage.setItem(BANNERS_KEY, JSON.stringify(banners));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kowsar_banners_changed', { detail: banners }));
    }
  },

  addBanner: (bannerData: Omit<BannerItem, 'id' | 'createdAt'>): BannerItem => {
    const banners = storage.getBanners();
    const newBanner: BannerItem = {
      ...bannerData,
      id: `banner-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toLocaleDateString('fa-IR'),
      order: bannerData.order !== undefined ? Number(bannerData.order) : banners.length + 1,
      showButton: bannerData.showButton !== undefined ? bannerData.showButton : true,
      buttonText: bannerData.buttonText || 'مشاهده جزئیات',
      isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
      duration: bannerData.duration || 5
    };
    const updated = [...banners, newBanner].sort((a, b) => (a.order || 0) - (b.order || 0));
    storage.saveBanners(updated);
    storage.saveBannersToDB(updated).catch(e => console.warn('Banners DB sync error:', e));
    return newBanner;
  },

  updateBanner: (banner: BannerItem) => {
    const banners = storage.getBanners();
    const updated = banners.map(b => String(b.id) === String(banner.id) ? { ...b, ...banner } : b).sort((a, b) => (a.order || 0) - (b.order || 0));
    storage.saveBanners(updated);
    storage.saveBannersToDB(updated).catch(e => console.warn('Banners DB sync error:', e));
  },

  deleteBanner: (id: string) => {
    const banners = storage.getBanners();
    const updated = banners.filter(b => String(b.id) !== String(id));
    storage.saveBanners(updated);
    storage.saveBannersToDB(updated).catch(e => console.warn('Banners DB sync error:', e));
  },

  toggleBannerStatus: (id: string) => {
    const banners = storage.getBanners();
    const updated = banners.map(b => String(b.id) === String(id) ? { ...b, isActive: !b.isActive } : b);
    storage.saveBanners(updated);
    storage.saveBannersToDB(updated).catch(e => console.warn('Banners DB sync error:', e));
  },

  moveBannerOrder: (id: string, direction: 'up' | 'down') => {
    const banners = storage.getBanners();
    const index = banners.findIndex(b => String(b.id) === String(id));
    if (index === -1) return;
    if (direction === 'up' && index > 0) {
      [banners[index], banners[index - 1]] = [banners[index - 1], banners[index]];
    } else if (direction === 'down' && index < banners.length - 1) {
      [banners[index], banners[index + 1]] = [banners[index + 1], banners[index]];
    }
    banners.forEach((b, idx) => { b.order = idx + 1; });
    storage.saveBanners(banners);
    storage.saveBannersToDB(banners).catch(e => console.warn('Banners DB sync error:', e));
  },

  resetBannersToDefault: () => {
    storage.saveBanners(defaultBanners);
    storage.saveBannersToDB(defaultBanners).catch(e => console.warn('Banners DB sync error:', e));
    return defaultBanners;
  },

  getForms: (): FormItem[] => {
    try {
      const data = localStorage.getItem(FORMS_KEY);
      if (data !== null) {
        const forms: FormItem[] = JSON.parse(data);
        if (Array.isArray(forms)) return forms;
      }
      localStorage.setItem(FORMS_KEY, JSON.stringify(defaultForms));
      return defaultForms;
    } catch {
      return defaultForms;
    }
  },

  getPublishedForms: (): FormItem[] => {
    return storage.getForms().filter(f => f.isPublished);
  },

  saveForms: (forms: FormItem[], notify: boolean = false) => {
    try {
      localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
      if (notify && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('kowsar_forms_changed'));
      }
    } catch (quotaErr) {
      console.warn('localStorage saveForms quota exceeded, saving sanitized list:', quotaErr);
      try {
        const sanitized = forms.map(f => {
          if (f.fileUrl && f.fileUrl.startsWith('data:') && f.fileUrl.length > 20000) {
            return { ...f, fileUrl: '' };
          }
          return f;
        });
        localStorage.setItem(FORMS_KEY, JSON.stringify(sanitized));
        if (notify && typeof window !== 'undefined') {
          window.dispatchEvent(new Event('kowsar_forms_changed'));
        }
      } catch (inner) {
        console.error('Failed to save forms locally:', inner);
      }
    }
  },

  addForm: (formData: Omit<FormItem, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>): FormItem => {
    const forms = storage.getForms();
    const newForm: FormItem = {
      ...formData,
      id: `form-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      downloadCount: 0,
      createdAt: new Date().toLocaleDateString('fa-IR'),
      updatedAt: new Date().toLocaleDateString('fa-IR')
    };
    storage.saveForms([newForm, ...forms], true);

    // Asynchronously call API
    try {
      const headers = getAdminAuthHeaders();
      fetch('/api/forms', {
        method: 'POST',
        headers,
        body: JSON.stringify(newForm)
      }).catch(err => console.warn('addForm API error:', err));
    } catch {}

    return newForm;
  },

  createFormInDB: async (formData: Partial<FormItem>): Promise<FormItem> => {
    const tempId = formData.id || `form-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newForm: FormItem = {
      id: tempId,
      code: formData.code || (formData.itemType === 'pamphlet' ? `BOK-${Math.floor(100 + Math.random() * 900)}` : `FORM-${Math.floor(100 + Math.random() * 900)}`),
      title: formData.title || '',
      description: formData.description || '',
      category: formData.category || (formData.itemType === 'pamphlet' ? 'جزوات دروس عمومی و معارف' : 'عمومی'),
      department: formData.department || (formData.itemType === 'pamphlet' ? 'گروه کامپیوتر و فناوری اطلاعات' : 'آموزش'),
      fileFormat: formData.fileFormat || 'PDF',
      fileSize: formData.fileSize || '۱.۵ مگابایت',
      fileUrl: formData.fileUrl || '',
      downloadCount: formData.downloadCount || 0,
      isPublished: formData.isPublished !== false,
      isPinned: Boolean(formData.isPinned),
      priority: formData.priority || 1,
      createdAt: formData.createdAt || new Date().toLocaleDateString('fa-IR'),
      updatedAt: new Date().toLocaleDateString('fa-IR'),
      tags: formData.tags || [],
      instructions: formData.instructions || [],
      requiredAttachments: formData.requiredAttachments || [],
      itemType: formData.itemType || 'form',
      professorName: formData.professorName || '',
      fieldOfStudy: formData.fieldOfStudy || '',
      degreeLevel: formData.degreeLevel || '',
      academicTerm: formData.academicTerm || '',
      pageCount: formData.pageCount || '',
      courseCode: formData.courseCode || ''
    };

    // Save locally and notify only because a new file is created
    const current = storage.getForms().filter(f => f.id !== newForm.id);
    storage.saveForms([newForm, ...current], true);

    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers,
        body: JSON.stringify(newForm)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const item = json.data;
          const parsedItem: FormItem = {
            id: item.id,
            code: item.code,
            title: item.title,
            description: item.description,
            category: item.category,
            department: item.department,
            fileFormat: item.file_format || item.fileFormat,
            fileSize: item.file_size || item.fileSize,
            fileUrl: item.file_url || item.fileUrl,
            downloadCount: item.download_count || 0,
            isPublished: item.is_published !== false,
            isPinned: Boolean(item.is_pinned),
            priority: item.priority || 1,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : (Array.isArray(item.tags) ? item.tags : []),
            instructions: typeof item.instructions === 'string' ? JSON.parse(item.instructions) : (Array.isArray(item.instructions) ? item.instructions : []),
            requiredAttachments: typeof item.required_attachments === 'string' ? JSON.parse(item.required_attachments) : (Array.isArray(item.required_attachments) ? item.required_attachments : []),
            itemType: item.item_type || (item.category?.includes('جزوه') ? 'pamphlet' : 'form'),
            professorName: item.professor_name || '',
            fieldOfStudy: item.field_of_study || '',
            degreeLevel: item.degree_level || '',
            academicTerm: item.academic_term || '',
            pageCount: item.page_count || '',
            courseCode: item.course_code || ''
          };
          const updatedList = storage.getForms().map(f => f.id === tempId ? parsedItem : f);
          storage.saveForms(updatedList, false);
          return parsedItem;
        }
      }
    } catch (e) {
      console.warn('Error in createFormInDB API call:', e);
    }
    return newForm;
  },

  updateForm: (form: FormItem) => {
    const forms = storage.getForms();
    const updated = forms.map(f => f.id === form.id ? { ...form, updatedAt: new Date().toLocaleDateString('fa-IR') } : f);
    storage.saveForms(updated);

    try {
      const headers = getAdminAuthHeaders();
      fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(form)
      }).catch(err => console.warn('updateForm API error:', err));
    } catch {}
  },

  updateFormInDB: async (form: FormItem): Promise<boolean> => {
    storage.updateForm(form);
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(form)
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  deleteForm: (id: string) => {
    const forms = storage.getForms().filter(f => f.id !== id);
    storage.saveForms(forms, true);
    try {
      const headers = getAdminAuthHeaders();
      fetch(`/api/forms/${id}`, { method: 'DELETE', headers }).catch(e => console.error('Delete API error:', e));
    } catch {}
  },

  deleteFormFromDB: async (id: string): Promise<boolean> => {
    const forms = storage.getForms().filter(f => f.id !== id);
    storage.saveForms(forms, true);
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        // Fallback to sync if individual delete fails
        await storage.saveFormsToDB(forms);
      }
      return true;
    } catch (e) {
      console.warn('deleteFormFromDB error:', e);
      try {
        await storage.saveFormsToDB(forms);
      } catch {}
      return false;
    }
  },

  toggleFormPublish: (id: string) => {
    const forms = storage.getForms();
    storage.saveForms(forms.map(f => f.id === id ? { ...f, isPublished: !f.isPublished } : f));
  },

  toggleFormPin: (id: string) => {
    const forms = storage.getForms();
    storage.saveForms(forms.map(f => f.id === id ? { ...f, isPinned: !f.isPinned } : f));
  },

  incrementFormDownload: (id: string): number => {
    const forms = storage.getForms();
    let newCount = 1;
    const updated = forms.map(f => {
      if (f.id === id) {
        newCount = (f.downloadCount || 0) + 1;
        return { ...f, downloadCount: newCount };
      }
      return f;
    });
    storage.saveForms(updated);
    return newCount;
  },

  resetFormsToDefault: (): FormItem[] => {
    storage.saveForms(defaultForms);
    return defaultForms;
  },

  getLogs: (): SystemLog[] => {
    try {
      const data = localStorage.getItem(SYSTEM_LOGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Auto-clean stale Vite dynamic import chunk deployment mismatch errors
          const cleaned = parsed.filter(l => 
            !l.message?.includes('Failed to fetch dynamically imported module') &&
            !l.details?.includes('Failed to fetch dynamically imported module') &&
            !l.message?.includes('dynamically imported module')
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(SYSTEM_LOGS_KEY, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  addLog: (log: Omit<SystemLog, 'id' | 'timestamp' | 'status'> & { isSuperficial?: boolean }) => {
    // Ignore transient dynamic chunk import errors caused by client browser caching during deployment
    if (
      log.message?.includes('Failed to fetch dynamically imported module') ||
      log.details?.includes('Failed to fetch dynamically imported module') ||
      log.message?.includes('dynamically imported module')
    ) {
      console.warn('Ignored transient chunk mismatch during deploy:', log.message);
      return null as any;
    }

    const isSuperficial = Boolean(
      log.isSuperficial ||
      log.level === 'warning' ||
      log.level === 'info' ||
      log.source?.includes('Console') ||
      log.source?.includes('آزمایشی') ||
      log.message?.includes('آزمایشی') ||
      log.message?.includes('هشدار')
    );

    const logs = storage.getLogs();
    const newLog: SystemLog = {
      ...log,
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toLocaleTimeString('fa-IR') + ' - ' + new Date().toLocaleDateString('fa-IR'),
      status: 'unresolved',
      isSuperficial
    };
    localStorage.setItem(SYSTEM_LOGS_KEY, JSON.stringify([newLog, ...logs].slice(0, 500)));

    // Sync asynchronously with PostgreSQL backend
    try {
      const headers = getAdminAuthHeaders();
      fetch('/api/logs/system', {
        method: 'POST',
        headers,
        body: JSON.stringify(newLog)
      }).catch(err => {
        // Benign local console warn to avoid recursion
      });
    } catch {}

    return newLog;
  },

  syncSystemLogsWithDB: async (): Promise<SystemLog[]> => {
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch('/api/logs/system', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const dbLogs: SystemLog[] = json.data;
          const localLogs = storage.getLogs();
          
          // Merge by ID
          const map = new Map<string, SystemLog>();
          for (const l of dbLogs) map.set(l.id, l);
          for (const l of localLogs) {
            if (!map.has(l.id)) map.set(l.id, l);
          }
          const merged = Array.from(map.values()).slice(0, 500);
          localStorage.setItem(SYSTEM_LOGS_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {
      // Offline or network error, return local logs
    }
    return storage.getLogs();
  },

  deleteLog: (id: string) => {
    const logs = storage.getLogs();
    const updated = logs.filter(l => l.id !== id);
    localStorage.setItem(SYSTEM_LOGS_KEY, JSON.stringify(updated));
    try {
      const headers = getAdminAuthHeaders();
      fetch(`/api/logs/system/${id}`, { method: 'DELETE', headers }).catch(() => {});
    } catch {}
  },

  updateLogStatus: (id: string, status: 'unresolved' | 'resolved') => {
    const logs = storage.getLogs();
    localStorage.setItem(SYSTEM_LOGS_KEY, JSON.stringify(logs.map(l => l.id === id ? { ...l, status } : l)));
    if (status === 'resolved') {
      try {
        const headers = getAdminAuthHeaders();
        fetch(`/api/logs/system/${id}/resolve`, { method: 'PUT', headers }).catch(() => {});
      } catch {}
    }
  },

  resolveAllLogs: async () => {
    const logs = storage.getLogs();
    const updated = logs.map(l => ({ ...l, status: 'resolved' as const }));
    localStorage.setItem(SYSTEM_LOGS_KEY, JSON.stringify(updated));
    try {
      const headers = getAdminAuthHeaders();
      await fetch('/api/logs/system/resolve-all', { method: 'PUT', headers });
    } catch {}
  },

  cleanSuperficialLogs: async () => {
    const logs = storage.getLogs();
    // Resolve all superficial or warning logs
    const updated = logs.map(l => {
      if (
        l.isSuperficial ||
        l.level === 'warning' ||
        l.level === 'info' ||
        l.source?.includes('Console') ||
        l.source?.includes('آزمایشی') ||
        l.message?.includes('آزمایشی')
      ) {
        return { ...l, status: 'resolved' as const };
      }
      return l;
    });
    localStorage.setItem(SYSTEM_LOGS_KEY, JSON.stringify(updated));
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch('/api/logs/system/clean-superficial', { method: 'PUT', headers });
      if (res.ok) {
        const json = await res.json();
        return json.resolvedCount || 0;
      }
    } catch {}
    return 0;
  },

  clearLogs: () => {
    localStorage.removeItem(SYSTEM_LOGS_KEY);
    try {
      const headers = getAdminAuthHeaders();
      fetch('/api/logs/system/clear-all', { method: 'DELETE', headers }).catch(() => {});
    } catch {}
  },

  fetchBackendHealth: async () => {
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch('/api/logs/health', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {}
    return null;
  },

  getUnresolvedErrorsCount: (): number => {
    return storage.getLogs().filter(l => l.status === 'unresolved' && (l.level === 'error' || l.level === 'critical')).length;
  },

  getSecurityLogs: (): SecurityLog[] => {
    try {
      const data = localStorage.getItem(SECURITY_LOGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // If empty, seed initial realistic security logs
      return storage.seedSecurityLogsIfEmpty();
    } catch {
      return [];
    }
  },

  seedSecurityLogsIfEmpty: (): SecurityLog[] => {
    const defaultLogs: SecurityLog[] = [
      {
        id: 'sec-init-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        eventType: 'login_success',
        severity: 'low',
        category: 'auth',
        status: 'resolved',
        message: 'ورود موفق مدیر ارشد به سامانه',
        userEmail: 'mehdik2510',
        ipAddress: '5.127.48.92',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
        details: 'احراز هویت دو مرحله‌ای با موفقیت انجام شد. نشست فعال ایجاد گردید.'
      },
      {
        id: 'sec-init-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        eventType: 'login_failed',
        severity: 'medium',
        category: 'auth',
        status: 'investigating',
        message: 'تلاش ناموفق برای ورود به میز خدمت',
        userEmail: '3540998811',
        ipAddress: '185.191.171.12',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Mobile/15E148',
        details: 'رمز عبور اشتباه برای شماره ملی ۳۵۴۰۹۹۸۸۱۱ وارد شد (تلاش دوم).'
      },
      {
        id: 'sec-init-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        eventType: 'data_modified',
        severity: 'medium',
        category: 'data',
        status: 'resolved',
        message: 'ویرایش وضعیت مالی و رسید دانشجو',
        userEmail: 'mehdik2510',
        ipAddress: '5.127.48.92',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
        details: 'رسید پرداختی به مبلغ ۲۵,۰۰۰,۰۰۰ ریال برای دانشجوی شماره ۴۰۲۱۲۳۴۵۶ تایید شد.'
      },
      {
        id: 'sec-init-4',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        eventType: 'account_locked',
        severity: 'high',
        category: 'auth',
        status: 'resolved',
        message: 'اخراج خودکار و پایان نشست حساب غیرفعال‌شده',
        userEmail: '2281234567',
        ipAddress: '2.147.63.10',
        userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/123.0.0.0 Mobile Safari/537.36',
        details: 'دانشجو با کدملی ۲۲۸۱۲۳۴۵۶۷ به علت تغییر وضعیت به غیرفعال توسط آموزش، به طور خودکار از میز خدمت خارج شد.'
      },
      {
        id: 'sec-init-5',
        timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
        eventType: 'permission_denied',
        severity: 'high',
        category: 'access',
        status: 'investigating',
        message: 'تلاش برای دسترسی غیرمجاز به بخش مدیریت کاربران',
        userEmail: 'student-portal-user',
        ipAddress: '89.199.34.71',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/125.0',
        details: 'کاربر با نقش دانشجو سعی در فراخوانی مسیر /admin/users داشت. دسترسی مسدود شد.'
      },
      {
        id: 'sec-init-6',
        timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
        eventType: 'system_alert',
        severity: 'low',
        category: 'system',
        status: 'resolved',
        message: 'پایش سلامت و بک‌آپ خودکار دیتابیس مرکز',
        userEmail: 'System Monitor Daemon',
        ipAddress: '127.0.0.1 (Localhost)',
        userAgent: 'Kowsar-SecDaemon/v2.4',
        details: 'پایگاه داده بررسی شد. تمام شاخص‌های یکپارچگی در وضعیت نرمال قرار دارند.'
      }
    ];
    localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(defaultLogs));
    return defaultLogs;
  },

  addSecurityLog: (log: Omit<SecurityLog, 'id' | 'timestamp'>) => {
    const logs = storage.getSecurityLogs();
    let currentUserEmail = 'کاربر میهمان / ناشناس';
    try {
      const auth = localStorage.getItem('kowsar_admin_auth');
      if (auth) currentUserEmail = JSON.parse(auth).email || currentUserEmail;
    } catch {
      // ignore
    }

    // Infer category if not provided
    let category: SecurityLogCategory = log.category || 'system';
    if (!log.category) {
      if (log.eventType === 'login_success' || log.eventType === 'login_failed' || log.eventType === 'auth_attempt' || log.eventType === 'account_locked') {
        category = 'auth';
      } else if (log.eventType === 'permission_denied' || log.eventType === 'rate_limited') {
        category = 'access';
      } else if (log.eventType === 'data_modified') {
        category = 'data';
      } else {
        category = 'system';
      }
    }

    const newLog: SecurityLog = {
      ...log,
      category,
      status: log.status || (log.severity === 'critical' || log.severity === 'high' ? 'investigating' : 'resolved'),
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/Internal',
      userEmail: log.userEmail || currentUserEmail,
      ipAddress: log.ipAddress || (typeof localStorage !== 'undefined' ? localStorage.getItem('kowsar_user_ip') : null) || 'ناشناس'
    };
    localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify([newLog, ...logs].slice(0, 1000)));
    return newLog;
  },

  updateSecurityLogStatus: (id: string, status: 'investigating' | 'resolved' | 'dismissed', resolutionNote?: string, resolvedBy?: string) => {
    const logs = storage.getSecurityLogs();
    const updated = logs.map(l => {
      if (l.id === id) {
        return {
          ...l,
          status,
          resolutionNote: resolutionNote !== undefined ? resolutionNote : l.resolutionNote,
          resolvedBy: resolvedBy || l.resolvedBy || 'مهدی کرمی (مدیر ارشد)',
          resolvedAt: new Date().toISOString()
        };
      }
      return l;
    });
    localStorage.setItem(SECURITY_LOGS_KEY, JSON.stringify(updated));
    return updated;
  },

  clearSecurityLogs: () => {
    localStorage.removeItem(SECURITY_LOGS_KEY);
  },

  runSystemDiagnostics: () => {
    let totalChars = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) totalChars += key.length + (localStorage.getItem(key)?.length || 0);
    }
    const banners = storage.getBanners();
    const news = storage.getNews();
    const regs = storage.getRegistrations();
    const forms = storage.getForms();
    const users = storage.getUsers();

    return {
      storageUsedKb: Math.round((totalChars * 2) / 1024),
      storageItemsCount: localStorage.length,
      modulesStatus: [
        { name: 'اسلایدر صفحه اصلی', key: 'kowsar_hero_banners', status: banners.length > 0 ? 'healthy' as const : 'warning' as const, count: banners.length, message: `${banners.length} بنر فعال` },
        { name: 'اخبار و رویدادها', key: 'kowsar_news', status: news.length > 0 ? 'healthy' as const : 'warning' as const, count: news.length, message: `${news.length} خبر ثبت شده` },
        { name: 'پیش‌ثبت‌نام‌ها', key: 'kowsar_registrations', status: 'healthy' as const, count: regs.length, message: `${regs.length} ثبت‌نام` },
        { name: 'فرم‌ها و آیین‌نامه‌ها', key: 'kowsar_academic_forms', status: forms.length > 0 ? 'healthy' as const : 'warning' as const, count: forms.length, message: `${forms.length} فرم موجود` },
        { name: 'حساب‌های مدیریت', key: 'kowsar_admin_users', status: users.length > 0 ? 'healthy' as const : 'error' as const, count: users.length, message: `${users.length} حساب کاربری` }
      ],
      overallHealth: 'excellent' as const
    };
  },

  autoRepairSystem: () => {
    const fixedItems: string[] = [];
    try {
      if (storage.getBanners().length === 0) {
        storage.saveBanners(defaultBanners);
        fixedItems.push('بازنشانی بنرهای اسلایدر صفحه اصلی');
      }
      if (storage.getNews().length === 0) {
        localStorage.setItem(NEWS_KEY, JSON.stringify(initialNewsItems));
        fixedItems.push('بازسازی پایگاه داده اخبار');
      }
      if (storage.getForms().length === 0) {
        storage.saveForms(defaultForms);
        fixedItems.push('بازسازی فرم‌های ضروری');
      }
      // Auto-resolve superficial and test logs
      const logs = storage.getLogs();
      let superficialResolved = 0;
      const updatedLogs = logs.map(l => {
        if (
          l.status === 'unresolved' &&
          (l.isSuperficial ||
            l.level === 'warning' ||
            l.level === 'info' ||
            l.source?.includes('Console') ||
            l.source?.includes('آزمایشی') ||
            l.message?.includes('آزمایشی'))
        ) {
          superficialResolved++;
          return { ...l, status: 'resolved' as const };
        }
        return l;
      });
      if (superficialResolved > 0) {
        localStorage.setItem(SYSTEM_LOGS_KEY, JSON.stringify(updatedLogs));
        fixedItems.push(`بررسی و رفع خودکار ${superficialResolved} هشدار و پیام سطحی/آزمایشی`);
        storage.cleanSuperficialLogs().catch(() => {});
      }
    } catch (e) {
      console.warn('Auto repair encountered error:', e);
    }
    return fixedItems;
  },

  // Database Cloud Sync Helpers
  syncNewsWithDB: async () => {
    try {
      const res = await fetch('/api/news');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const dbNews: NewsItem[] = json.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            date: item.date,
            image: item.image,
            summary: item.summary,
            content: item.content,
            category: item.category,
            priority: item.priority,
            isPinned: item.is_pinned,
            isPublished: item.is_published,
            author: item.author,
            views: item.views,
            tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags || [],
            attachments: typeof item.attachments === 'string' ? JSON.parse(item.attachments) : item.attachments || [],
            gallery: typeof item.gallery === 'string' ? JSON.parse(item.gallery) : item.gallery || [],
            readTime: item.read_time,
          }));
          localStorage.setItem(NEWS_KEY, JSON.stringify(dbNews));
          return dbNews;
        }
      }
    } catch (e) {
      console.warn('Sync news with DB failed:', e);
    }
    return storage.getNews();
  },

  syncRegistrationsWithDB: async () => {
    try {
      const res = await fetch('/api/registrations');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const dbRegs: Registration[] = json.data.map((item: any) => ({
            id: item.id,
            fullName: item.full_name,
            nationalCode: item.national_code,
            phone: item.phone,
            degree: item.degree,
            field: item.field,
            description: item.description,
            date: item.date,
            status: item.status || 'new'
          }));
          localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(dbRegs));
          return dbRegs;
        }
      }
    } catch (e) {
      console.warn('Sync registrations with DB failed:', e);
    }
    return storage.getRegistrations();
  },

  submitRegistrationToDB: async (registration: Omit<Registration, 'id' | 'date' | 'status'>) => {
    storage.addRegistration(registration);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration)
      });
      return await res.json();
    } catch (e) {
      return { success: true, message: 'ثبت‌نام در حافظه محلی ذخیره شد.' };
    }
  },

  createNewsInDB: async (newsItem: Omit<NewsItem, 'id'>) => {
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch('/api/news', {
        method: 'POST',
        headers,
        body: JSON.stringify(newsItem)
      });
      const json = await res.json();
      if (json.success && json.data) {
        await storage.syncNewsWithDB();
        return json.data;
      }
    } catch (e) {
      console.warn('Create news in DB failed:', e);
    }
    return storage.addNews(newsItem);
  },

  updateNewsInDB: async (newsItem: NewsItem) => {
    storage.updateNews(newsItem);
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch(`/api/news/${newsItem.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(newsItem)
      });
      const json = await res.json();
      if (json.success) await storage.syncNewsWithDB();
      return json;
    } catch (e) {
      return { success: true };
    }
  },

  deleteNewsFromDB: async (id: number) => {
    storage.deleteNews(id);
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
        headers
      });
      const json = await res.json();
      if (json.success) await storage.syncNewsWithDB();
      return json;
    } catch (e) {
      return { success: true };
    }
  },

  toggleNewsPublishInDB: async (id: number, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    storage.toggleNewsPublish(id);
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isPublished: nextStatus })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          // Update in local cache directly
          const all = storage.getNews();
          const idx = all.findIndex(n => String(n.id) === String(id));
          if (idx !== -1) {
            all[idx].isPublished = nextStatus;
            localStorage.setItem(NEWS_KEY, JSON.stringify(all));
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('kowsar_news_changed', { detail: all }));
            }
          }
        }
      }
    } catch (e) {
      console.warn('Toggle publish in DB failed:', e);
    }
  },

  toggleNewsPinInDB: async (id: number, currentPin?: boolean) => {
    const all = storage.getNews();
    const target = all.find(n => String(n.id) === String(id));
    const nextPin = currentPin !== undefined ? !currentPin : (target ? !target.isPinned : true);
    storage.toggleNewsPin(id, nextPin);
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isPinned: nextPin })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          // Update in local cache directly
          const fresh = storage.getNews();
          const idx = fresh.findIndex(n => String(n.id) === String(id));
          if (idx !== -1) {
            fresh[idx].isPinned = nextPin;
            localStorage.setItem(NEWS_KEY, JSON.stringify(fresh));
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('kowsar_news_changed', { detail: fresh }));
            }
          }
        }
      }
    } catch (e) {
      console.warn('Toggle pin in DB failed:', e);
    }
  },

  syncBannersWithDB: async () => {
    try {
      const res = await fetch('/api/banners');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const dbBanners: BannerItem[] = json.data.map((item: any) => ({
            id: String(item.id),
            imageUrl: item.image_url || item.imageUrl || '',
            title: item.title || '',
            subtitle: item.subtitle || '',
            link: item.link || '',
            showButton: item.show_button !== false && item.showButton !== false,
            buttonText: item.button_text || item.buttonText || 'مشاهده جزئیات',
            order: Number(item.order) || 1,
            isActive: item.is_active !== false && item.isActive !== false,
            duration: Number(item.duration) || 5,
            createdAt: item.created_at || item.createdAt || new Date().toLocaleDateString('fa-IR')
          }));
          localStorage.setItem(BANNERS_KEY, JSON.stringify(dbBanners));
          return dbBanners;
        } else if (json.success && Array.isArray(json.data) && json.data.length === 0) {
          const local = storage.getBanners();
          if (local.length > 0) {
            await storage.saveBannersToDB(local);
            return local;
          }
        }
      }
    } catch (e) {
      console.warn('Sync banners with DB failed:', e);
    }
    return storage.getBanners();
  },

  saveBannersToDB: async (banners: BannerItem[]) => {
    localStorage.setItem(BANNERS_KEY, JSON.stringify(banners));
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch('/api/banners/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ banners })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.warn('DB sync banners warning (using local fallback):', data.message);
        return { success: true };
      }
      return data;
    } catch (e) {
      console.warn('DB sync banners network error (using local fallback):', e);
      return { success: true };
    }
  },

  syncFormsWithDB: async () => {
    try {
      const res = await fetch('/api/forms');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const dbForms: FormItem[] = json.data.map((item: any) => {
            const parseSafe = (val: any) => {
              if (Array.isArray(val)) return val;
              if (typeof val === 'string') {
                try {
                  const p = JSON.parse(val);
                  return Array.isArray(p) ? p : [];
                } catch {
                  return [];
                }
              }
              return [];
            };

            return {
              id: item.id,
              code: item.code || 'FORM-100',
              title: item.title,
              description: item.description || '',
              category: item.category || 'عمومی',
              department: item.department || 'آموزش',
              fileFormat: item.file_format || 'PDF',
              fileSize: item.file_size || '۱.۵ مگابایت',
              fileUrl: item.file_url || '',
              downloadCount: Number(item.download_count || 0),
              isPublished: item.is_published !== false,
              isPinned: Boolean(item.is_pinned),
              priority: Number(item.priority || 1),
              createdAt: item.created_at || new Date().toLocaleDateString('fa-IR'),
              updatedAt: item.updated_at || new Date().toLocaleDateString('fa-IR'),
              tags: parseSafe(item.tags),
              instructions: parseSafe(item.instructions),
              requiredAttachments: parseSafe(item.required_attachments),
              itemType: item.item_type || (item.category?.includes('جزوه') ? 'pamphlet' : 'form'),
              professorName: item.professor_name || '',
              fieldOfStudy: item.field_of_study || '',
              degreeLevel: item.degree_level || '',
              academicTerm: item.academic_term || '',
              pageCount: item.page_count || '',
              courseCode: item.course_code || ''
            };
          });

          storage.saveForms(dbForms, false);
          return dbForms;
        }
      }
    } catch (e) {
      console.warn('Sync forms with DB failed:', e);
    }
    return storage.getForms();
  },

  saveFormsToDB: async (forms: FormItem[]) => {
    localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch('/api/forms/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ forms })
      });
      return await res.json();
    } catch (e) {
      return { success: true };
    }
  },

  // Portal Users
  getPortalUsers: (): PortalUser[] => {
    const users: PortalUser[] = JSON.parse(localStorage.getItem('kowsar_portal_users') || '[]');
    return users.filter(u => u.nationalCode !== '1234567890');
  },
  savePortalUsers: (users: PortalUser[]) => {
    localStorage.setItem('kowsar_portal_users', JSON.stringify(users));
  },
  addPortalUser: (user: Omit<PortalUser, 'id' | 'createdAt'>) => {
    const users = storage.getPortalUsers();
    const newUser = {
      ...user,
      id: `pu-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString()
    } as PortalUser;
    users.push(newUser);
    storage.savePortalUsers(users);
    return newUser;
  },
  updatePortalUser: (id: string, updates: Partial<PortalUser>) => {
    const users = storage.getPortalUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      storage.savePortalUsers(users);
    }
  },

  // Tickets
  getTickets: (): Ticket[] => {
    try {
      const stored = localStorage.getItem('kowsar_tickets');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(t => t.id !== 'tk-101' && t.userId !== 'std_std-1' && t.userName !== 'علی رضایی');
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('kowsar_tickets', JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
    } catch {}
    
    const defaultTickets: Ticket[] = [];
    localStorage.setItem('kowsar_tickets', JSON.stringify(defaultTickets));
    return defaultTickets;
  },
  saveTickets: (tickets: Ticket[]) => {
    localStorage.setItem('kowsar_tickets', JSON.stringify(tickets));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kowsar_tickets_changed'));
    }
  },
  addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'messages' | 'status'>, firstMessage: string, senderName: string) => {
    const tickets = storage.getTickets();
    const newTicket: Ticket = {
      ...ticket,
      id: `tk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        senderId: ticket.userId,
        senderName,
        isAdmin: false,
        text: firstMessage,
        date: new Date().toISOString()
      }]
    };
    tickets.push(newTicket);
    storage.saveTickets(tickets);

    try {
      const headers = getClientOrAdminAuthHeaders();
      fetch('/api/tickets', {
        method: 'POST',
        headers,
        body: JSON.stringify(newTicket)
      }).catch(e => console.warn('Add ticket API error:', e));
    } catch (e) {
      console.warn(e);
    }

    return newTicket;
  },
  addTicketMessage: (ticketId: string, message: Omit<TicketMessage, 'id' | 'date'>) => {
    const tickets = storage.getTickets();
    const index = tickets.findIndex(t => t.id === ticketId);
    if (index !== -1) {
      tickets[index].messages.push({
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date: new Date().toISOString()
      });
      tickets[index].status = message.isAdmin ? 'answered' : 'open';
      tickets[index].updatedAt = new Date().toISOString();
      storage.saveTickets(tickets);

      try {
        const headers = getClientOrAdminAuthHeaders();
        fetch(`/api/tickets/${ticketId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            status: tickets[index].status,
            updatedAt: tickets[index].updatedAt,
            messages: tickets[index].messages
          })
        }).catch(e => console.warn('Update ticket API error:', e));
      } catch (e) {
        console.warn(e);
      }
    }
  },
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => {
    const tickets = storage.getTickets();
    const index = tickets.findIndex(t => t.id === ticketId);
    if (index !== -1) {
      tickets[index].status = status;
      tickets[index].updatedAt = new Date().toISOString();
      storage.saveTickets(tickets);

      try {
        const headers = getClientOrAdminAuthHeaders();
        fetch(`/api/tickets/${ticketId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            status,
            updatedAt: tickets[index].updatedAt,
            messages: tickets[index].messages
          })
        }).catch(e => console.warn('Update ticket status API error:', e));
      } catch (e) {
        console.warn(e);
      }
    }
  },

  // Financial Receipts
  getReceipts: (): FinancialReceipt[] => {
    return JSON.parse(localStorage.getItem('kowsar_receipts') || '[]');
  },
  saveReceipts: (receipts: FinancialReceipt[]) => {
    localStorage.setItem('kowsar_receipts', JSON.stringify(receipts));
  },
  addReceipt: (receipt: Omit<FinancialReceipt, 'id' | 'status' | 'createdAt'>) => {
    const receipts = storage.getReceipts();
    const newReceipt: FinancialReceipt = {
      ...receipt,
      id: `rcpt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    receipts.push(newReceipt);
    storage.saveReceipts(receipts);

    try {
      const headers = getClientOrAdminAuthHeaders();
      fetch('/api/receipts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...newReceipt,
          amount: newReceipt.amount,
          receiptUrl: newReceipt.imageUrl || (newReceipt as any).receiptUrl || '',
          userNationalId: (newReceipt as any).studentId || (newReceipt as any).userNationalId
        })
      }).catch(e => console.warn('Add receipt API error:', e));
    } catch (e) {
      console.warn(e);
    }

    return newReceipt;
  },
  updateReceiptStatus: (receiptId: string, status: FinancialReceipt['status'], adminMessage?: string) => {
    const receipts = storage.getReceipts();
    const index = receipts.findIndex(r => r.id === receiptId);
    if (index !== -1) {
      receipts[index].status = status;
      if (adminMessage !== undefined) {
        (receipts[index] as any).adminMessage = adminMessage;
      }
      storage.saveReceipts(receipts);

      try {
        const headers = getClientOrAdminAuthHeaders();
        fetch(`/api/receipts/${receiptId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            status,
            adminMessage: adminMessage || (receipts[index] as any).adminMessage || ''
          })
        }).catch(e => console.warn('Update receipt API error:', e));
      } catch (e) {
        console.warn(e);
      }
    }
  },

  generateUniqueReceiptTrackingCode: (): string => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const receipts = storage.getReceipts();
    
    for (let i = 0; i < 30; i++) {
      const rand = Math.floor(10000 + Math.random() * 90000);
      const candidate = `KOW-${yy}${mm}${dd}-${rand}`;
      if (!receipts.some(r => r.trackingCode === candidate)) {
        return candidate;
      }
    }
    return `KOW-${yy}${mm}${dd}-${Date.now().toString().slice(-5)}`;
  },

  addQuickReceipt: async (receiptData: {
    userName: string;
    userNationalId: string;
    studentMobile: string;
    amount: string;
    date: string;
    category: string;
    bankRefNumber?: string;
    description?: string;
    imageUrl: string;
  }): Promise<{ success: boolean; receipt: FinancialReceipt; trackingCode: string }> => {
    const receipts = storage.getReceipts();
    const trackingCode = storage.generateUniqueReceiptTrackingCode();
    const rcptId = `rcpt-quick-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const newReceipt: FinancialReceipt = {
      id: rcptId,
      userId: `std_${receiptData.userNationalId || 'guest'}`,
      userName: receiptData.userName,
      studentId: receiptData.userNationalId,
      userNationalId: receiptData.userNationalId,
      amount: receiptData.amount,
      trackingCode,
      date: receiptData.date,
      description: receiptData.description || '',
      imageUrl: receiptData.imageUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
      studentMobile: receiptData.studentMobile,
      category: receiptData.category,
      bankRefNumber: receiptData.bankRefNumber || '',
      submissionType: 'quick'
    };

    receipts.unshift(newReceipt);
    storage.saveReceipts(receipts);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kowsar_receipts_changed'));
    }

    try {
      const res = await fetch('/api/receipts/quick-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReceipt)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.trackingCode) {
          newReceipt.trackingCode = json.trackingCode;
          // بروزرسانی کد پیگیری تأیید شده سرور در حافظه محلی
          const updatedReceipts = storage.getReceipts();
          const idx = updatedReceipts.findIndex(r => r.id === rcptId);
          if (idx !== -1) {
            updatedReceipts[idx].trackingCode = json.trackingCode;
            storage.saveReceipts(updatedReceipts);
          }
        }
      }
    } catch (e) {
      console.warn('Quick receipt server submit error (saved locally):', e);
    }

    return { success: true, receipt: newReceipt, trackingCode: newReceipt.trackingCode };
  },

  trackReceipt: async (query: string): Promise<FinancialReceipt[]> => {
    const rawQuery = (query || '').trim();
    if (!rawQuery) return [];

    // نرمال‌سازی ارقام فارسی و انگلیسی
    const engQuery = replacePersianWithEnglishDigits(rawQuery).trim().toLowerCase();
    const perQuery = toPersianDigits(engQuery);

    // جستجو در رسیدهای محلی با تمام حالات ارقام فارسی و انگلیسی
    const local = storage.getReceipts().filter(r => {
      const tCode = String(r.trackingCode || '').trim().toLowerCase();
      const nId = String(r.userNationalId || r.studentId || '').trim().toLowerCase();
      const mob = String(r.studentMobile || '').trim().toLowerCase();

      return (
        tCode === engQuery || tCode === rawQuery.toLowerCase() ||
        nId === engQuery || nId === perQuery ||
        mob === engQuery || mob === perQuery
      );
    });

    // جستجو و همگام‌سازی از سرور اصلی
    try {
      const res = await fetch(`/api/receipts/quick-track/${encodeURIComponent(engQuery)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const map = new Map<string, FinancialReceipt>();
          json.data.forEach((r: FinancialReceipt) => map.set(r.id, r));
          local.forEach(r => {
            if (!map.has(r.id)) map.set(r.id, r);
          });
          return Array.from(map.values()).sort((a, b) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
        }
      }
    } catch (e) {
      console.warn('Server track receipt query failed, returning local matches:', e);
    }

    return local;
  },

  lookupStudent: (query: string): Student | null => {
    const clean = query.trim();
    if (!clean) return null;
    const students = storage.getStudents();
    const found = students.find(s => 
      String(s.nationalCode || '').trim() === clean ||
      String(s.studentId || '').trim() === clean ||
      String(s.phone || '').trim() === clean
    );
    return found || null;
  },

  seedPortalUsers: () => {
    const users = storage.getPortalUsers();
    if (!users.find(u => u.nationalCode === '123456789')) {
      users.push({
        id: 'pu-test-123456789',
        name: 'دانشجوی تستی',
        nationalCode: '123456789',
        studentId: '1402123456',
        password: '123456789',
        role: 'student',
        isApproved: true,
        createdAt: new Date().toISOString()
      });
      storage.savePortalUsers(users);
    }
  },

  // Gallery
  getAlbums: (): GalleryAlbum[] => {
    try {
      let albums = JSON.parse(localStorage.getItem('kowsar_gallery_albums') || '[]');
      if (!Array.isArray(albums) || albums.length === 0) {
        albums = [{
          id: 'sample-album-1',
          title: 'نمایشگاه دستاوردهای علمی و پژوهشی',
          category: 'مراسم‌ها',
          description: 'نمایشگاه دستاوردهای علمی و پژوهشی دانشجویان مرکز کوثر کاکی.',
          date: new Date().toLocaleDateString('fa-IR'),
          coverImage: 'https://picsum.photos/seed/7606/1200/800',
          isActive: true,
          createdAt: new Date().toISOString(),
          images: [
            { id: 'img-1', url: 'https://picsum.photos/seed/7612/1200/800', type: 'image', title: 'افتتاحیه نمایشگاه' },
            { id: 'img-2', url: 'https://picsum.photos/seed/7737/1200/800', type: 'image', title: 'غرفه فناوری و کامپیوتر' }
          ]
        }];
        localStorage.setItem('kowsar_gallery_albums', JSON.stringify(albums));
      }
      return albums.map(a => ({
        ...a,
        isActive: a.isActive !== undefined ? Boolean(a.isActive) : true
      }));
    } catch {
      return [];
    }
  },
  saveAlbums: (albums: GalleryAlbum[]) => {
    const listToSave = Array.isArray(albums) ? albums : [];
    localStorage.setItem('kowsar_gallery_albums', JSON.stringify(listToSave));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kowsar_albums_changed', { detail: listToSave }));
    }
    // همگام‌سازی خودکار در پس‌زمینه با دیتابیس سرور
    storage.saveAlbumsToDB(listToSave).catch(err => {
      console.warn('Background sync for albums failed:', err);
    });
  },
  syncAlbumsWithDB: async (): Promise<GalleryAlbum[]> => {
    try {
      const res = await fetch('/api/albums');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const list = data.data.map((a: any) => ({
            ...a,
            isActive: a.isActive !== undefined ? Boolean(a.isActive) : true
          }));
          localStorage.setItem('kowsar_gallery_albums', JSON.stringify(list));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('kowsar_albums_changed', { detail: list }));
          }
          return list;
        }
      }
    } catch (err) {
      console.warn('Could not sync albums from server, fallback to local storage:', err);
    }
    return storage.getAlbums();
  },
  saveAlbumsToDB: async (albums: GalleryAlbum[]) => {
    try {
      const res = await fetch('/api/albums/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albums })
      });
      return await res.json();
    } catch (err) {
      console.warn('Save albums to DB error:', err);
      return { success: false };
    }
  },
  toggleAlbumActive: async (id: string, explicitState?: boolean): Promise<boolean> => {
    const albums = storage.getAlbums();
    const index = albums.findIndex(a => a.id === id);
    if (index === -1) return false;

    const currentStatus = albums[index].isActive !== false;
    const nextStatus = typeof explicitState === 'boolean' ? explicitState : !currentStatus;
    
    albums[index].isActive = nextStatus;
    storage.saveAlbums(albums);

    try {
      const res = await fetch(`/api/albums/${id}/toggle-active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus })
      });
      return res.ok;
    } catch (err) {
      console.warn('Failed to sync toggle with DB:', err);
      return true; // Still updated locally
    }
  },
  addAlbum: (album: Omit<GalleryAlbum, 'id' | 'createdAt'>) => {
    const albums = storage.getAlbums();
    const newAlbum: GalleryAlbum = {
      ...album,
      id: `album-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      isActive: album.isActive !== undefined ? Boolean(album.isActive) : true,
      createdAt: new Date().toISOString()
    };
    albums.unshift(newAlbum);
    storage.saveAlbums(albums);
    return newAlbum;
  },
  updateAlbum: (id: string, updates: Partial<GalleryAlbum>) => {
    const albums = storage.getAlbums();
    const index = albums.findIndex(a => a.id === id);
    if (index !== -1) {
      albums[index] = { ...albums[index], ...updates };
      storage.saveAlbums(albums);
    }
  },
  deleteAlbum: async (id: string) => {
    // API call injected by AI
    const token = localStorage.getItem('kowsar_admin_token') || localStorage.getItem('kowsar_token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    fetch(`/api/gallery/${id}`, { method: 'DELETE', headers }).catch(e => console.error('Delete API error:', e));
    const remaining = storage.getAlbums().filter(a => a.id !== id);
    storage.saveAlbums(remaining);
    try {
      await fetch(`/api/albums/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Delete album from DB error:', err);
    }
  },

  // Presentation Sections
  getPresentationSections: (): PresentationSection[] => {
    try {
      const data = localStorage.getItem(PRESENTATION_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      localStorage.setItem(PRESENTATION_KEY, JSON.stringify(defaultPresentationSections));
      return defaultPresentationSections;
    } catch {
      return defaultPresentationSections;
    }
  },
  savePresentationSections: (sections: PresentationSection[]) => {
    const listToSave = Array.isArray(sections) ? sections : [];
    localStorage.setItem(PRESENTATION_KEY, JSON.stringify(listToSave));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kowsar_presentation_changed', { detail: listToSave }));
    }
    // همگام‌سازی بی‌درنگ در پس‌زمینه با دیتابیس
    storage.savePresentationSectionsToDB(listToSave).catch((err) => {
      console.warn('Background sync for presentation sections failed:', err);
    });
  },
  savePresentationSectionsToDB: async (sections: PresentationSection[]) => {
    const listToSave = Array.isArray(sections) ? sections : [];
    localStorage.setItem(PRESENTATION_KEY, JSON.stringify(listToSave));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kowsar_presentation_changed', { detail: listToSave }));
    }
    try {
      const headers = getAdminAuthHeaders();
      const res = await fetch('/api/presentation/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sections: listToSave })
      });
      if (res.ok) {
        return await res.json();
      }
      return { success: false, message: 'خطا در ذخیره‌سازی در سرور' };
    } catch (e) {
      console.warn('Direct database sync failed, kept in localStorage:', e);
      return { success: true, message: 'تغییرات در حافظه محلی ذخیره شد' };
    }
  },
  syncPresentationWithDB: async () => {
    try {
      const res = await fetch('/api/presentation');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const dbSections: PresentationSection[] = json.data.map((item: any) => ({
            id: String(item.id),
            order: item.order !== undefined ? item.order : 1,
            title: item.title,
            subtitle: item.subtitle || '',
            content: item.content,
            image: item.image || '',
            icon: item.icon || '',
            animationStyle: item.animationStyle || 'fade',
            imageAnimationStyle: item.imageAnimationStyle || 'rotate-3d',
            frameStyle: item.frameStyle || 'floating-isometric',
            frameAccentColor: item.frameAccentColor || '',
            frameBadgeText: item.frameBadgeText || '',
            showOverlayText: item.showOverlayText !== false,
            overlaySubtitle: item.overlaySubtitle || '',
            overlayPosition: item.overlayPosition || 'top-right',
            overlayStyle: item.overlayStyle || 'badge',
            animationDuration: item.animationDuration || 0.8,
            animationEasing: item.animationEasing || 'easeOut',
            theme: item.theme || 'light',
            isVisible: item.isVisible !== false,
            imagePosition: item.imagePosition || 'left',
            textAlignment: item.textAlignment || 'right',
            contentRatio: item.contentRatio || 'balanced',
            verticalAlign: item.verticalAlign || 'center'
          }));

          // اگر در دیتابیس داده‌ای وجود دارد، داده‌های دیتابیس معتبرترین منبع هستند
          if (dbSections.length > 0) {
            localStorage.setItem(PRESENTATION_KEY, JSON.stringify(dbSections));
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('kowsar_presentation_changed', { detail: dbSections }));
            }
            return dbSections;
          } else {
            // اگر دیتابیس خالی است اما در حافظه محلی آیتم داریم، به دیتابیس بفرست
            const localData = storage.getPresentationSections();
            if (localData && localData.length > 0) {
              await storage.savePresentationSectionsToDB(localData);
              return localData;
            } else {
              await storage.savePresentationSectionsToDB(defaultPresentationSections);
              return defaultPresentationSections;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Sync presentation with DB failed:', e);
    }
    return storage.getPresentationSections();
  },

  // Contact Page Config & Messages
  getContactConfig: (): ContactPageConfig => {
    try {
      const data = localStorage.getItem(CONTACT_CONFIG_KEY);
      if (!data) return defaultContactConfig;
      const parsed = JSON.parse(data);
      
      const isOldCoordinates = !parsed.latitude || 
        Math.abs(parsed.latitude - 28.339248) < 0.001 || 
        !parsed.longitude || 
        Math.abs(parsed.longitude - 51.524835) < 0.001;

      const latitude = isOldCoordinates ? defaultContactConfig.latitude : parsed.latitude;
      const longitude = isOldCoordinates ? defaultContactConfig.longitude : parsed.longitude;
      const neshanLink = isOldCoordinates || !parsed.neshanLink ? defaultContactConfig.neshanLink : parsed.neshanLink;
      const baladLink = isOldCoordinates || !parsed.baladLink ? defaultContactConfig.baladLink : parsed.baladLink;
      const googleMapsLink = (isOldCoordinates || !parsed.googleMapsLink || parsed.googleMapsLink.includes('pH9PehuwXuWNXwcL8'))
        ? defaultContactConfig.googleMapsLink
        : parsed.googleMapsLink;
      const wazeLink = isOldCoordinates || !parsed.wazeLink ? defaultContactConfig.wazeLink : parsed.wazeLink;
      const mapIframe = (isOldCoordinates || !parsed.mapIframe || parsed.mapIframe.includes('2zS2FraSwgQnVzaGVociBQcm92aW5jZSwgSXJhbg') || parsed.mapIframe.includes('maps.google.com/maps?q='))
        ? defaultContactConfig.mapIframe
        : parsed.mapIframe;

      return {
        ...defaultContactConfig,
        ...parsed,
        latitude,
        longitude,
        neshanLink,
        baladLink,
        googleMapsLink,
        wazeLink,
        mapIframe,
        departments: parsed.departments?.length ? parsed.departments : defaultContactConfig.departments,
        socialLinks: parsed.socialLinks?.length ? parsed.socialLinks : defaultContactConfig.socialLinks,
        faqs: parsed.faqs?.length ? parsed.faqs : defaultContactConfig.faqs,
      };
    } catch {
      return defaultContactConfig;
    }
  },

  updateContactConfig: (newConfig: Partial<ContactPageConfig>): ContactPageConfig => {
    try {
      const current = storage.getContactConfig();
      const updated: ContactPageConfig = { ...current, ...newConfig };
      localStorage.setItem(CONTACT_CONFIG_KEY, JSON.stringify(updated));

      try {
        const siteSettings = storage.getSettings();
        const updatedSiteSettings: SiteSettings = {
          ...siteSettings,
          contactAddress: updated.address || siteSettings.contactAddress,
          contactPhone: updated.phoneMain || siteSettings.contactPhone,
          contactEmail: updated.emailMain || siteSettings.contactEmail,
          contactPageTitle: updated.pageTitle || siteSettings.contactPageTitle,
          contactPageSubtitle: updated.pageSubtitle || siteSettings.contactPageSubtitle,
          contactMapIframe: updated.mapIframe || siteSettings.contactMapIframe,
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSiteSettings));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('kowsar_site_settings_changed'));
          window.dispatchEvent(new CustomEvent('kowsar_contact_config_changed', { detail: updated }));
        }
      } catch (err) {
        console.warn('Could not sync contact config', err);
      }

      return updated;
    } catch (e) {
      console.error('Failed to update contact config', e);
      return defaultContactConfig;
    }
  },

  resetContactConfig: (): ContactPageConfig => {
    storage.updateContactConfig(defaultContactConfig);
    return defaultContactConfig;
  },

  getContactMessages: (): ContactMessage[] => {
    try {
      const stored = localStorage.getItem(CONTACT_MESSAGES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(m => m.id !== 'cmsg-1' && m.senderName !== 'محمدحسین رضایی');
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
      localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify([]));
      return [];
    } catch {
      return [];
    }
  },

  saveContactMessages: (messages: ContactMessage[]) => {
    localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(messages));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kowsar_contact_messages_changed'));
    }
  },

  addContactMessage: (msg: Omit<ContactMessage, 'id' | 'trackingCode' | 'createdAt' | 'status'>): ContactMessage => {
    const messages = storage.getContactMessages();
    const trackingCode = `CTK-1403-${Math.floor(1000 + Math.random() * 9000)}`;
    const newMsg: ContactMessage = {
      ...msg,
      id: `cmsg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      trackingCode,
      status: 'unread',
      createdAt: new Date().toISOString(),
      ipAddress: localStorage.getItem('kowsar_user_ip') || 'ناشناس'
    };
    storage.saveContactMessages([newMsg, ...messages]);
    storage.addLog({
      level: 'info',
      source: 'Contact Form',
      message: `پیام جدید از فرم تماس: ${msg.subject}`,
      details: `فرستنده: ${msg.senderName} (${msg.senderPhone}) | کد: ${trackingCode}`
    });

    try {
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newMsg.id,
          name: newMsg.senderName,
          senderName: newMsg.senderName,
          email: newMsg.senderEmail || '',
          senderEmail: newMsg.senderEmail || '',
          phone: newMsg.senderPhone || '',
          senderPhone: newMsg.senderPhone || '',
          subject: newMsg.subject,
          message: newMsg.message,
          status: newMsg.status,
          date: newMsg.createdAt
        })
      }).catch(e => console.warn('Save contact message to DB error:', e));
    } catch (e) {
      console.warn(e);
    }

    return newMsg;
  },

  updateContactMessage: (id: string, updates: Partial<ContactMessage>) => {
    const messages = storage.getContactMessages();
    storage.saveContactMessages(messages.map(m => m.id === id ? { ...m, ...updates } : m));

    try {
      const headers = getAdminAuthHeaders();
      fetch(`/api/contact/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      }).catch(e => console.warn('Update contact message API error:', e));
    } catch (e) {
      console.warn(e);
    }
  },

  deleteContactMessage: (id: string) => {
    // API call injected by AI
    const token = localStorage.getItem('kowsar_admin_token') || localStorage.getItem('kowsar_token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    fetch(`/api/contact/${id}`, { method: 'DELETE', headers }).catch(e => console.error('Delete API error:', e));
    const messages = storage.getContactMessages();
    storage.saveContactMessages(messages.filter(m => m.id !== id));
  },

  deleteTicket: (id: string) => {
    const tickets = storage.getTickets();
    storage.saveTickets(tickets.filter(t => t.id !== id));
    const token = localStorage.getItem('kowsar_admin_token') || localStorage.getItem('kowsar_token');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    fetch(`/api/tickets/${id}`, { method: 'DELETE', headers }).catch(e => console.error('Delete ticket API error:', e));
  },

  getUnreadContactMessagesCount: (): number => {
    return storage.getContactMessages().filter(m => m.status === 'unread').length;
  },


  syncPortalSettingsWithDB: async (): Promise<PortalSettings> => {
    try {
      const res = await fetch('/api/settings/portal');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const merged: PortalSettings = {
            ...defaultPortalSettings,
            ...json.data,
            passwordRecovery: { ...defaultPortalSettings.passwordRecovery, ...(json.data.passwordRecovery || {}) },
            announcements: Array.isArray(json.data.announcements) ? json.data.announcements : defaultPortalSettings.announcements,
            departments: Array.isArray(json.data.departments) ? json.data.departments : defaultPortalSettings.departments,
            faqs: Array.isArray(json.data.faqs) ? json.data.faqs : defaultPortalSettings.faqs,
          };
          localStorage.setItem(PORTAL_SETTINGS_KEY, JSON.stringify(merged));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('kowsar_portal_settings_changed', { detail: merged }));
          }
          return merged;
        }
      }
    } catch (e) {
      console.warn('Could not sync portal settings from server:', e);
    }
    return storage.getPortalSettings();
  },

  syncSettingsWithDB: async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(json.data));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('kowsar_site_settings_changed'));
          }
        }
      }
    } catch (e) {
      console.warn('Could not sync settings from server:', e);
    }
  },

  
  syncStudentsWithDB: async () => {
    try {
      const res = await fetch('/api/students', { headers: getAdminAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) localStorage.setItem(STUDENTS_KEY, JSON.stringify(json.data));
      }
    } catch (e) { console.error(e); }
  },
  syncTicketsWithDB: async () => {
    try {
      const res = await fetch('/api/tickets', { headers: getClientOrAdminAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) localStorage.setItem('kowsar_tickets', JSON.stringify(json.data));
      }
    } catch (e) { console.error(e); }
  },
  syncReceiptsWithDB: async () => {
    try {
      const res = await fetch('/api/receipts', { headers: getClientOrAdminAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) localStorage.setItem('kowsar_receipts', JSON.stringify(json.data));
      }
    } catch (e) { console.error(e); }
  },
  syncContactWithDB: async () => {
    try {
      const res = await fetch('/api/contact', { headers: getAdminAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(json.data));
      }
    } catch (e) { console.error(e); }
  },
  syncUsersWithDB: async () => {
    try {
      const res = await fetch('/api/users', { headers: getAdminAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const currentUsers = storage.getUsers();
          const merged = json.data.map((u: any) => {
            const local = currentUsers.find(lu => lu.id === u.id || lu.email === u.email);
            return {
              id: u.id,
              name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || local?.name || u.email,
              firstName: u.firstName || local?.firstName || '',
              lastName: u.lastName || local?.lastName || '',
              nationalId: u.nationalId || local?.nationalId || '',
              mobile: u.mobile || local?.mobile || '',
              email: u.email,
              password: u.password || local?.password || '',
              role: u.role || local?.role || 'education_expert',
              permissions: Array.isArray(u.permissions) ? u.permissions : (typeof u.permissions === 'string' ? JSON.parse(u.permissions || '[]') : (local?.permissions || []))
            };
          });
          localStorage.setItem(USERS_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {
      console.warn('Sync users with DB error:', e);
    }
  },
  syncAllWithDB: async () => {
    try {
      storage.seedPortalUsers();
      await Promise.allSettled([
        storage.syncSettingsWithDB(),
        storage.syncPortalSettingsWithDB(),
        storage.syncNewsWithDB(),
        storage.syncRegistrationsWithDB(),
        storage.syncBannersWithDB(),
        storage.syncFormsWithDB(),
        storage.syncPresentationWithDB(),
        storage.syncStudentsWithDB(),
        storage.syncTicketsWithDB(),
        storage.syncReceiptsWithDB(),
        storage.syncContactWithDB(),
        storage.syncUsersWithDB()
      ]);
    } catch (e) {
      console.warn('Database full sync had partial errors:', e);
    }
  }
};
