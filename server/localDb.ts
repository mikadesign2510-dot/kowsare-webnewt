import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

// مسیر ذخیره‌سازی دائمی اطلاعات در سرور محلی
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db_store.json');

// بررسی و ساخت پوشه data در صورت عدم وجود
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

export interface LocalDatabaseSchema {
  site_settings: any[];
  presentation_sections: any[];
  news: any[];
  banners: any[];
  forms: any[];
  gallery_albums: any[];
  gallery_images: any[];
  users: any[];
  students: any[];
  registrations: any[];
  tickets: any[];
  financial_receipts: any[];
  contact_messages: any[];
  system_logs: any[];
  security_logs: any[];
  uploaded_files: any[];
}

// داده‌های اولیه پیش‌فرض
function getInitialData(): LocalDatabaseSchema {
  const realPassword = 'M3540143041m@';
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(realPassword, salt);

  const defaultSiteSettings = {
    site_title: 'مرکز آموزش علمی کاربردی کوثر کاکی',
    site_subtitle: 'وابسته به دانشگاه جامع علمی کاربردی',
    logo_url: '',
    phone: '۰۷۷-۳۵۳۲۰۰۰۰',
    email: 'info@kowsar.ac.ir',
    address: 'بوشهر، کاکی، دانشگاه جامع علمی کاربردی مرکز کوثر کاکی',
    working_hours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۰۰',
    hero_title: 'آینده تحصیلی و شغلی خود را با مهارت‌آموزی بسازید',
    hero_subtitle: 'پذیرش دانشجو در مقاطع کاردانی و کارشناسی بدون کنکور بر اساس سوابق تحصیلی',
    hero_cta_text: 'پیش‌ثبت‌نام آنلاین',
    hero_cta_link: '/register',
    announcement_text: 'ثبت‌نام و پذیرش دوره‌های کاردانی و کارشناسی آغاز شد.',
    announcement_active: true,
    social_links: {
      telegram: 'https://t.me/kowsar_ac',
      eitaa: 'https://eitaa.com/kowsar_ac',
      instagram: 'https://instagram.com/kowsar_ac',
      bale: 'https://ble.ir/kowsar_ac'
    }
  };

  const defaultPortalSettings = {
    portal_name: 'سامانه یکپارچه دانشجویی کوثر',
    academic_term: 'نیم‌سال اول ۱۴۰۳ - ۱۴۰۴',
    registration_active: true,
    course_selection_active: false,
    tuition_payment_active: true,
    exam_schedule_active: false,
    support_phone: '۰۷۷-۳۵۳۲۰۰۰۱',
    telegram_channel: 'https://t.me/kowsar_students'
  };

  const seedPresentation = [
    {
      id: 'intro-1',
      order: 1,
      title: 'مرکز آموزش علمی کاربردی کوثر کاکی',
      subtitle: 'پیشرو در آموزش مهارت‌محور',
      content: 'محیطی پویا و نوین برای ارتقای دانش و مهارت‌های کاربردی، تربیت نیروهای متخصص و کارآفرین برای ورود مقتدرانه به بازار کار.',
      image: 'https://picsum.photos/seed/7733/1200/800',
      icon: '',
      animation_style: 'zoom',
      image_animation_style: 'rotate-3d',
      frame_style: 'floating-isometric',
      frame_accent_color: '',
      frame_badge_text: 'دانشگاه علمی کاربردی کوثر',
      show_overlay_text: true,
      overlay_subtitle: '',
      overlay_position: 'top-right',
      overlay_style: 'badge',
      animation_duration: 0.8,
      animation_easing: 'easeOut',
      theme: 'primary',
      is_visible: true,
      image_position: 'left',
      text_alignment: 'right',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'intro-2',
      order: 2,
      title: 'ارتباط مستقیم با صنعت و بازار کار',
      subtitle: 'ورود مطمئن به بازار کار',
      content: 'برنامه‌های درسی همگام با نیازهای بازار کار، کارگاه‌ها و آزمایشگاه‌های مجهز و اساتید مجرب و کارآفرین.',
      image: 'https://picsum.photos/seed/7587/1200/800',
      icon: '',
      animation_style: 'slide-right',
      image_animation_style: 'flip-3d',
      frame_style: 'golden-gallery',
      frame_accent_color: '',
      frame_badge_text: 'مهارت و اشتغال پایدار',
      show_overlay_text: true,
      overlay_subtitle: '',
      overlay_position: 'top-right',
      overlay_style: 'badge',
      animation_duration: 0.8,
      animation_easing: 'easeOut',
      theme: 'light',
      is_visible: true,
      image_position: 'left',
      text_alignment: 'right',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const seedBanners = [
    {
      id: '1',
      image_url: 'https://picsum.photos/seed/7605/1200/800',
      title: 'محیط پویای یادگیری و مهارت‌آموزی',
      subtitle: 'دانشگاه جامع علمی کاربردی مرکز کوثر کاکی',
      link: '/register',
      show_button: true,
      button_text: 'مشاهده جزئیات',
      order: 1,
      is_active: true,
      duration: 5,
      created_at: '1403/01/01'
    },
    {
      id: '2',
      image_url: 'https://picsum.photos/seed/7732/1200/800',
      title: 'پیشگام در مهارت‌های شغلی و آینده‌ساز',
      subtitle: 'پذیرش دانشجو در مقاطع کاردانی و کارشناسی بدون کنکور',
      link: '/register',
      show_button: true,
      button_text: 'مشاهده جزئیات',
      order: 2,
      is_active: true,
      duration: 5,
      created_at: '1403/01/01'
    }
  ];

  const seedNews = [
    {
      id: 1,
      title: 'آغاز ثبت‌نام دوره‌های کاردانی و کارشناسی ترم جدید',
      subtitle: 'پذیرش بر اساس سوابق تحصیلی',
      date: '۱۵ مهر ۱۴۰۳',
      image: 'https://picsum.photos/seed/7569/1200/800',
      summary: 'ثبت‌نام بدون کنکور در رشته‌های متنوع مهارتی و کاربردی آغاز شد.',
      content: 'با حمد و سپاس به درگاه خداوند متعال، به اطلاع تمامی علاقه‌مندان به تحصیل در مقاطع کاردانی و کارشناسی می‌رساند که ثبت‌نام ترم جدید مرکز آموزش علمی کاربردی کوثر کاکی آغاز شده است.',
      category: 'آموزشی',
      priority: 1,
      is_pinned: true,
      is_published: true,
      author: 'روابط عمومی مرکز',
      views: 1420,
      tags: ['ثبت_نام', 'کاردانی', 'کارشناسی'],
      attachments: [],
      gallery: [],
      read_time: '۳ دقیقه',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'برگزاری همایش کارآفرینی و مهارت‌آموزی',
      subtitle: 'ویژه دانشجویان و فارغ‌التحصیلان',
      date: '۱۰ آبان ۱۴۰۳',
      image: 'https://picsum.photos/seed/7625/1200/800',
      summary: 'این همایش با حضور اساتید برجسته و کارآفرینان موفق منطقه در سالن آمفی‌تئاتر مرکز برگزار خواهد شد.',
      content: 'در راستای تحقق اهداف دانشگاه جامع علمی کاربردی مبنی بر تربیت نیروی متخصص و کارآفرین، همایش بزرگ «کارآفرینی و مهارت‌آموزی در عصر دیجیتال» در مرکز کوثر کاکی برگزار می‌شود.',
      category: 'رویدادها',
      priority: 2,
      is_pinned: false,
      is_published: true,
      author: 'واحد پژوهش و کارآفرینی',
      views: 890,
      tags: ['کارآفرینی', 'مهارت'],
      attachments: [],
      gallery: [],
      read_time: '۴ دقیقه',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const seedForms = [
    {
      id: 'form-1',
      code: 'EDU-101',
      title: 'فرم ثبت‌نام و پذیرش دانشجویان جدیدالورود',
      description: 'فرم جامع اطلاعات هویتی و تحصیلی پذیرفته‌شدگان دوره‌های کاردانی و کارشناسی ناپیوسته.',
      category: 'آموزشی و تحصیلی',
      department: 'اداره آموزش و پذیرش',
      file_format: 'PDF',
      file_size: '۱.۴ مگابایت',
      file_url: 'https://example.com/forms/registration-form.pdf',
      download_count: 428,
      is_published: true,
      is_pinned: true,
      priority: 1,
      created_at: '1403/01/10',
      updated_at: '1403/07/15',
      tags: ['ثبت‌نام', 'ورودی_جدید', 'پذیرش'],
      instructions: ['تکمیل تمامی فیلدهای فرم'],
      required_attachments: ['کپی شناسنامه و کارت ملی'],
      item_type: 'form'
    },
    {
      id: 'form-2',
      code: 'FIN-201',
      title: 'فرم درخواست وام شهریه دانشجویی صندوق رفاه',
      description: 'فرم تقاضای دریافت تسهیلات شهریه با کارمزد پایین و بازپرداخت پس از فراغت از تحصیل.',
      category: 'مالی و رفاهی',
      department: 'امور مالی و صندوق رفاه',
      file_format: 'PDF',
      file_size: '۲.۱ مگابایت',
      file_url: 'https://example.com/forms/student-loan.pdf',
      download_count: 382,
      is_published: true,
      is_pinned: true,
      priority: 2,
      created_at: '1403/02/15',
      updated_at: '1403/08/01',
      tags: ['وام', 'صندوق_رفاه'],
      instructions: ['افتتاح حساب در سامانه یکپارچه'],
      required_attachments: ['تصویر کارت دانشجویی'],
      item_type: 'form'
    }
  ];

  const allPermissions = [
    'dashboard', 'manage_students', 'manage_student_profiles', 'manage_tickets',
    'manage_financial', 'manage_portal_settings', 'manage_panel_settings',
    'manage_registrations', 'manage_news', 'manage_presentation', 'manage_banners',
    'manage_gallery', 'manage_forms', 'manage_settings', 'manage_users',
    'manage_server_monitoring', 'view_logs', 'view_security_logs'
  ];

  const seedUsers = [
    {
      id: 'admin-main-elmi',
      name: 'مدیر اصلی سامانه',
      first_name: 'مدیر اصلی',
      last_name: 'سامانه',
      national_id: '3540143041',
      mobile: '09170000000',
      raw_password: realPassword,
      permissions: allPermissions,
      email: 'elmi_admin',
      password_hash: hash,
      role: 'super_admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'admin-main-elmi-email',
      name: 'مدیر اصلی سامانه',
      first_name: 'مدیر اصلی',
      last_name: 'سامانه',
      national_id: '3540143041',
      mobile: '09170000000',
      raw_password: realPassword,
      permissions: allPermissions,
      email: 'elmi_admin@kowsar.ac.ir',
      password_hash: hash,
      role: 'super_admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  return {
    site_settings: [
      { id: 1, settings: defaultSiteSettings, updated_at: new Date().toISOString() },
      { id: 2, settings: defaultPortalSettings, updated_at: new Date().toISOString() }
    ],
    presentation_sections: seedPresentation,
    news: seedNews,
    banners: seedBanners,
    forms: seedForms,
    gallery_albums: [
      {
        id: 'album-1',
        title: 'فضای آموزشی و کارگاه‌ها',
        description: 'تصاویر کارگاه‌ها، آزمایشگاه‌ها و فضاهای عمومی دانشگاه',
        cover_image: 'https://picsum.photos/seed/7733/800/600',
        image_count: 1,
        created_at: '1403/01/01',
        updated_at: '1403/01/01'
      }
    ],
    gallery_images: [
      {
        id: 'img-1',
        album_id: 'album-1',
        title: 'کارگاه شبکه‌های کامپیوتری',
        url: 'https://picsum.photos/seed/7733/800/600',
        created_at: '1403/01/01'
      }
    ],
    users: seedUsers,
    students: [],
    registrations: [],
    tickets: [],
    financial_receipts: [],
    contact_messages: [],
    system_logs: [],
    security_logs: [],
    uploaded_files: []
  };
}

class LocalDatabaseManager {
  private data: LocalDatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): LocalDatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        // ادغام با اسکلت اولیه در صورت نبود بعضی جدول‌ها
        const initial = getInitialData();
        return { ...initial, ...parsed };
      }
    } catch (e) {
      console.warn('⚠️ خطا در خواندن دیتابیس فایل محلی، ایجاد نسخه نو:', e);
    }
    const fresh = getInitialData();
    this.persist(fresh);
    return fresh;
  }

  public persist(overrideData?: LocalDatabaseSchema) {
    try {
      const toSave = overrideData || this.data;
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf8');
    } catch (e) {
      console.error('❌ خطا در نوشتن روی دیسک محلی db_store.json:', e);
    }
  }

  public scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.persist();
    }, 100);
  }

  public getTable(tableName: string): any[] {
    const key = tableName.toLowerCase().trim() as keyof LocalDatabaseSchema;
    if (!(key in this.data)) {
      (this.data as any)[key] = [];
    }
    return (this.data as any)[key];
  }

  /**
   * شبیه‌ساز کوئری‌های SQL برای پایگاه‌داده محلی
   */
  public async query(sql: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    // تراکنش‌ها
    if (
      upper.startsWith('BEGIN') ||
      upper.startsWith('COMMIT') ||
      upper.startsWith('ROLLBACK') ||
      upper.includes('PG_ADVISORY_XACT_LOCK')
    ) {
      return { rows: [], rowCount: 0 };
    }

    // تست یا اطلاعات سرور
    if (upper.startsWith('SELECT NOW()') || upper.startsWith('SELECT 1')) {
      return {
        rows: [{ now: new Date().toISOString(), db_time: new Date().toISOString(), db_name: 'kowsar_local_db' }],
        rowCount: 1
      };
    }
    if (upper.includes('SELECT VERSION()') || upper.includes('PG_DATABASE_SIZE')) {
      return {
        rows: [
          {
            version: 'PostgreSQL 15.0 (Local Resilient Engine)',
            current_database: 'kowsar_local_db',
            current_user: 'kowsar_user',
            db_size: 1048576,
            is_replica: false
          }
        ],
        rowCount: 1
      };
    }

    // کوئری‌های SELECT
    if (upper.startsWith('SELECT')) {
      return this.handleSelect(trimmed, params);
    }

    // کوئری‌های INSERT
    if (upper.startsWith('INSERT')) {
      return this.handleInsert(trimmed, params);
    }

    // کوئری‌های UPDATE
    if (upper.startsWith('UPDATE')) {
      return this.handleUpdate(trimmed, params);
    }

    // کوئری‌های DELETE
    if (upper.startsWith('DELETE')) {
      return this.handleDelete(trimmed, params);
    }

    return { rows: [], rowCount: 0 };
  }

  private handleSelect(sql: string, params: any[]): { rows: any[]; rowCount: number } {
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_"]+)/i);
    if (!fromMatch) {
      return { rows: [], rowCount: 0 };
    }

    const rawTable = fromMatch[1].replace(/"/g, '');
    const table = this.getTable(rawTable);

    // بررسی COUNT
    if (/SELECT\s+COUNT\s*\(/i.test(sql)) {
      let filtered = table;
      // شرط‌های ساده
      if (/WHERE\s+is_published\s*=\s*true/i.test(sql)) {
        filtered = filtered.filter(r => r.is_published === true);
      } else if (/WHERE\s+is_active\s*=\s*true/i.test(sql)) {
        filtered = filtered.filter(r => r.is_active === true);
      } else if (/WHERE\s+status\s*=\s*'pending'/i.test(sql)) {
        filtered = filtered.filter(r => r.status === 'pending');
      } else if (/WHERE\s+status\s*=\s*'unresolved'/i.test(sql)) {
        filtered = filtered.filter(r => r.status === 'unresolved');
      }
      return { rows: [{ count: filtered.length.toString() }], rowCount: 1 };
    }

    // بررسی SUM
    if (/SELECT\s+COALESCE\s*\(\s*SUM\s*\(/i.test(sql)) {
      if (/views/i.test(sql)) {
        const sum = table.reduce((acc, r) => acc + (Number(r.views) || 0), 0);
        return { rows: [{ total_views: sum }], rowCount: 1 };
      }
      if (/download_count/i.test(sql)) {
        const sum = table.reduce((acc, r) => acc + (Number(r.download_count) || 0), 0);
        return { rows: [{ total_downloads: sum }], rowCount: 1 };
      }
    }

    // تنظیمات سایت: site_settings
    if (rawTable === 'site_settings') {
      const idMatch = sql.match(/id\s*=\s*(\d+|\$\d+)/i);
      let targetId = 1;
      if (idMatch) {
        if (idMatch[1].startsWith('$')) {
          const pIdx = parseInt(idMatch[1].slice(1), 10) - 1;
          targetId = Number(params[pIdx]) || 1;
        } else {
          targetId = Number(idMatch[1]) || 1;
        }
      }
      const found = table.find(r => Number(r.id) === targetId);
      if (found) {
        return { rows: [{ settings: found.settings }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // فیلتر کردن ردیف‌ها
    let rows = [...table];

    // شرط WHERE
    if (/WHERE\s+/i.test(sql)) {
      const wherePart = sql.split(/WHERE\s+/i)[1].split(/ORDER\s+BY|LIMIT|GROUP\s+BY/i)[0].trim();

      // id = $1
      if (/id\s*=\s*\$1/i.test(wherePart) && params.length > 0) {
        const idVal = params[0];
        rows = rows.filter(r => String(r.id) === String(idVal));
      }
      // email = $1 OR ...
      else if (/email\s*=\s*\$1/i.test(wherePart) && params.length > 0) {
        const emailVal = String(params[0]).trim().toLowerCase();
        rows = rows.filter(r => String(r.email).trim().toLowerCase() === emailVal);
      }
      // national_code = $1
      else if (/national_code\s*=\s*\$1/i.test(wherePart) && params.length > 0) {
        const codeVal = String(params[0]).trim();
        rows = rows.filter(r => String(r.national_code).trim() === codeVal);
      }
      // user_id = $1
      else if (/user_id\s*=\s*\$1/i.test(wherePart) && params.length > 0) {
        const uidVal = String(params[0]).trim();
        rows = rows.filter(r => String(r.user_id).trim() === uidVal);
      }
      // album_id = $1
      else if (/album_id\s*=\s*\$1/i.test(wherePart) && params.length > 0) {
        const aidVal = String(params[0]).trim();
        rows = rows.filter(r => String(r.album_id).trim() === aidVal);
      }
    }

    // مرتب‌سازی ORDER BY
    if (/ORDER\s+BY\s+/i.test(sql)) {
      if (/is_pinned/i.test(sql)) {
        rows.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          const prioA = Number(a.priority) || 1;
          const prioB = Number(b.priority) || 1;
          return prioA - prioB;
        });
      } else if (/"order"/i.test(sql) || /order\s+ASC/i.test(sql)) {
        rows.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      } else if (/created_at\s+DESC/i.test(sql)) {
        rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      }
    }

    // محدودیت LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      const count = parseInt(limitMatch[1], 10);
      rows = rows.slice(0, count);
    }

    return { rows, rowCount: rows.length };
  }

  private handleInsert(sql: string, params: any[]): { rows: any[]; rowCount: number } {
    const intoMatch = sql.match(/INTO\s+([a-zA-Z0-9_"]+)/i);
    if (!intoMatch) return { rows: [], rowCount: 0 };

    const rawTable = intoMatch[1].replace(/"/g, '');
    const table = this.getTable(rawTable);

    // حالت خاص site_settings با ON CONFLICT
    if (rawTable === 'site_settings') {
      const idMatch = sql.match(/VALUES\s*\(\s*(\d+|\$\d+)/i);
      let targetId = 1;
      let settingsData = params[0];

      if (idMatch && !idMatch[1].startsWith('$')) {
        targetId = parseInt(idMatch[1], 10);
      } else if (params.length > 1) {
        targetId = Number(params[0]) || 1;
        settingsData = params[1];
      }

      if (typeof settingsData === 'string') {
        try {
          settingsData = JSON.parse(settingsData);
        } catch {}
      }

      const existingIdx = table.findIndex(r => Number(r.id) === targetId);
      if (existingIdx >= 0) {
        table[existingIdx].settings = settingsData;
        table[existingIdx].updated_at = new Date().toISOString();
      } else {
        table.push({ id: targetId, settings: settingsData, updated_at: new Date().toISOString() });
      }

      this.scheduleSave();
      return { rows: [{ id: targetId }], rowCount: 1 };
    }

    // استخراج ستون‌ها
    const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    if (colsMatch) {
      const cols = colsMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
      const newRow: any = {
        id: (rawTable === 'news' || rawTable === 'security_logs') ? Date.now() : `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      cols.forEach((col, idx) => {
        let val = params[idx];
        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
          try {
            val = JSON.parse(val);
          } catch {}
        }
        newRow[col] = val;
      });

      // بررسی تکراری در صورت ON CONFLICT
      if (/ON\s+CONFLICT\s*\(\s*([a-zA-Z0-9_]+)\s*\)/i.test(sql)) {
        const confMatch = sql.match(/ON\s+CONFLICT\s*\(\s*([a-zA-Z0-9_]+)\s*\)/i);
        const confCol = confMatch ? confMatch[1] : 'id';
        const existIdx = table.findIndex(r => String(r[confCol]) === String(newRow[confCol]));
        if (existIdx >= 0) {
          if (/DO\s+UPDATE/i.test(sql)) {
            table[existIdx] = { ...table[existIdx], ...newRow, updated_at: new Date().toISOString() };
          }
          this.scheduleSave();
          return { rows: [table[existIdx]], rowCount: 1 };
        }
      }

      table.push(newRow);
      this.scheduleSave();
      return { rows: [newRow], rowCount: 1 };
    }

    return { rows: [], rowCount: 0 };
  }

  private handleUpdate(sql: string, params: any[]): { rows: any[]; rowCount: number } {
    const updateMatch = sql.match(/UPDATE\s+([a-zA-Z0-9_"]+)/i);
    if (!updateMatch) return { rows: [], rowCount: 0 };

    const rawTable = updateMatch[1].replace(/"/g, '');
    const table = this.getTable(rawTable);

    // افزایش شمارنده‌ها مثل views = views + 1
    if (/SET\s+views\s*=\s*views\s*\+\s*1/i.test(sql)) {
      const idVal = params[0];
      const found = table.find(r => String(r.id) === String(idVal));
      if (found) {
        found.views = (Number(found.views) || 0) + 1;
        this.scheduleSave();
        return { rows: [found], rowCount: 1 };
      }
    }

    if (/SET\s+download_count\s*=\s*download_count\s*\+\s*1/i.test(sql)) {
      const idVal = params[0];
      const found = table.find(r => String(r.id) === String(idVal));
      if (found) {
        found.download_count = (Number(found.download_count) || 0) + 1;
        this.scheduleSave();
        return { rows: [{ download_count: found.download_count }], rowCount: 1 };
      }
    }

    // به‌روزرسانی بر اساس id
    const whereMatch = sql.match(/WHERE\s+id\s*=\s*\$(\d+)/i);
    if (whereMatch) {
      const idParamIdx = parseInt(whereMatch[1], 10) - 1;
      const targetId = params[idParamIdx];
      const found = table.find(r => String(r.id) === String(targetId));

      if (found) {
        // استخراج فیلدها از SET
        const setClause = sql.split(/SET\s+/i)[1].split(/WHERE/i)[0];
        const assignments = setClause.split(',');
        assignments.forEach(assign => {
          const parts = assign.split('=');
          if (parts.length === 2) {
            const field = parts[0].trim().replace(/"/g, '');
            const valRef = parts[1].trim();
            const pMatch = valRef.match(/\$(\d+)/);
            if (pMatch) {
              const pIdx = parseInt(pMatch[1], 10) - 1;
              let val = params[pIdx];
              if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                try {
                  val = JSON.parse(val);
                } catch {}
              }
              found[field] = val;
            }
          }
        });
        found.updated_at = new Date().toISOString();
        this.scheduleSave();
        return { rows: [found], rowCount: 1 };
      }
    }

    return { rows: [], rowCount: 0 };
  }

  private handleDelete(sql: string, params: any[]): { rows: any[]; rowCount: number } {
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_"]+)/i);
    if (!fromMatch) return { rows: [], rowCount: 0 };

    const rawTable = fromMatch[1].replace(/"/g, '');
    const table = this.getTable(rawTable);

    // حذف کامل بدون شرط WHERE (مثل سینک مجدد presentation_sections یا banners)
    if (!/WHERE\s+/i.test(sql)) {
      const count = table.length;
      table.length = 0;
      this.scheduleSave();
      return { rows: [], rowCount: count };
    }

    // حذف با id = $1
    if (/WHERE\s+id\s*=\s*\$1/i.test(sql) && params.length > 0) {
      const idVal = params[0];
      const idx = table.findIndex(r => String(r.id) === String(idVal));
      if (idx >= 0) {
        const removed = table.splice(idx, 1)[0];
        this.scheduleSave();
        return { rows: [removed], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // حذف با NOT (id = ANY($1))
    if (/WHERE\s+NOT\s*\(\s*id\s*=\s*ANY\(\$1\)\s*\)/i.test(sql) && params.length > 0) {
      const keepIds = Array.isArray(params[0]) ? params[0].map(String) : [];
      const beforeLen = table.length;
      const filtered = table.filter(r => keepIds.includes(String(r.id)));
      (this.data as any)[rawTable] = filtered;
      this.scheduleSave();
      return { rows: [], rowCount: beforeLen - filtered.length };
    }

    return { rows: [], rowCount: 0 };
  }
}

export const localDb = new LocalDatabaseManager();
