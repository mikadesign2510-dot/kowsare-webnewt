import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { localDb } from './localDb.js';

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_ZQhKTfr2n5cq@ep-solitary-tree-ax2d4o3c.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

const realPool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

let isPostgresAvailable = false;
let hasCheckedPostgres = false;

function isQuotaOrConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = String(err?.message || err);
  return (
    msg.includes('quota') ||
    msg.includes('exceeded') ||
    msg.includes('data transfer quota') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('Connection terminated')
  );
}

// جلوگیری از کرش کردن سرور هنگام بسته شدن اتصالات معلق نئون
realPool.on('error', (err: Error) => {
  console.warn('⚠️ PostgreSQL Pool idle client notice (non-fatal, auto-reconnecting):', err.message);
  if (isQuotaOrConnectionError(err)) {
    isPostgresAvailable = false;
  }
});

export const pool = {
  async query(sql: any, params?: any[]) {
    if (!isPostgresAvailable && hasCheckedPostgres) {
      return localDb.query(sql, params);
    }
    try {
      return await realPool.query(sql, params);
    } catch (err: any) {
      if (isQuotaOrConnectionError(err)) {
        if (isPostgresAvailable || !hasCheckedPostgres) {
          console.warn('⚠️ پایگاه‌داده ریموت با محدودیت سهمیه (Quota Exceeded) یا قطعی مواجه شد. سامانه به ذخیره‌ساز محلی پایدار سوئیچ کرد.');
          isPostgresAvailable = false;
          hasCheckedPostgres = true;
        }
        return localDb.query(sql, params);
      }
      throw err;
    }
  },

  async connect() {
    if (!isPostgresAvailable && hasCheckedPostgres) {
      return {
        query: (sql: string, params?: any[]) => localDb.query(sql, params),
        release: () => {}
      };
    }
    try {
      const client = await realPool.connect();
      const originalQuery = client.query.bind(client);
      (client as any).query = async (sql: any, params?: any[]) => {
        try {
          return await originalQuery(sql, params);
        } catch (err: any) {
          if (isQuotaOrConnectionError(err)) {
            console.warn('⚠️ تراکنش ریموت با محدودیت سهمیه مواجه شد، سوئیچ به موتور محلی.');
            isPostgresAvailable = false;
            return localDb.query(sql, params);
          }
          throw err;
        }
      };
      return client;
    } catch (err: any) {
      if (isQuotaOrConnectionError(err)) {
        isPostgresAvailable = false;
        hasCheckedPostgres = true;
        return {
          query: (sql: string, params?: any[]) => localDb.query(sql, params),
          release: () => {}
        };
      }
      throw err;
    }
  },

  on: realPool.on.bind(realPool),
  end: realPool.end.bind(realPool),
  totalCount: 0,
  idleCount: 0,
  waitingCount: 0
};

/**
 * ایجاد و آماده‌سازی خودکار جداول پایگاه داده در نئون (PostgreSQL)
 */
export async function initializeDatabase() {
  let client;
  try {
    try {
      client = await realPool.connect();
      await client.query('SELECT 1');
      isPostgresAvailable = true;
      hasCheckedPostgres = true;
      console.log('✅ با موفقیت به پایگاه داده PostgreSQL متصل شد.');
    } catch (connErr: any) {
      hasCheckedPostgres = true;
      isPostgresAvailable = false;
      console.log('📦 پایگاه داده ریموت به دلیل سقف سهمیه انتقال داده (Quota Exceeded) یا عدم دسترسی، در دسترس نیست.');
      console.log('💎 موتور پایدار محلی سرور (Local Persistent DB Engine) با موفقیت فعال شد. داده‌های شما روی دیسک سرور ذخیره و نگهداری می‌شوند.');
      localDb.persist();
      return;
    }

    // ۱. جدول کاربران ادمین
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        national_id VARCHAR(20),
        mobile VARCHAR(30),
        raw_password VARCHAR(255),
        permissions JSONB DEFAULT '[]'::jsonb,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'super_admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(20);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(30);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS raw_password VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
    `);

    // ۲. جدول اخبار و اطلاعیه‌ها
    await client.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        subtitle VARCHAR(500),
        date VARCHAR(50) NOT NULL,
        image TEXT,
        summary TEXT,
        content TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        priority INT DEFAULT 1,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_published BOOLEAN DEFAULT TRUE,
        author VARCHAR(255) DEFAULT 'روابط عمومی مرکز',
        views INT DEFAULT 0,
        tags JSONB DEFAULT '[]'::jsonb,
        attachments JSONB DEFAULT '[]'::jsonb,
        gallery JSONB DEFAULT '[]'::jsonb,
        read_time VARCHAR(50) DEFAULT '۳ دقیقه',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ۳. جدول پیش‌ثبت‌نام دانشجویان
    await client.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id VARCHAR(64) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        national_code VARCHAR(20) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        degree VARCHAR(100) NOT NULL,
        field VARCHAR(200) NOT NULL,
        description TEXT,
        date VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ۴. جدول اسلایدر و بنرها
    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(64) PRIMARY KEY,
        image_url TEXT NOT NULL,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        link TEXT,
        show_button BOOLEAN DEFAULT TRUE,
        button_text VARCHAR(100) DEFAULT 'مشاهده جزئیات',
        "order" INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        duration INT DEFAULT 5,
        created_at VARCHAR(50) NOT NULL
      );
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS show_button BOOLEAN DEFAULT TRUE;
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_text VARCHAR(100) DEFAULT 'مشاهده جزئیات';
    `);

    // ۵. جدول فرم‌ها و بخشنامه‌های دانلودی
    await client.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        department VARCHAR(100),
        file_format VARCHAR(20),
        file_size VARCHAR(50),
        file_url TEXT,
        download_count INT DEFAULT 0,
        is_published BOOLEAN DEFAULT TRUE,
        is_pinned BOOLEAN DEFAULT FALSE,
        priority INT DEFAULT 1,
        created_at VARCHAR(50),
        updated_at VARCHAR(50),
        tags JSONB DEFAULT '[]'::jsonb,
        instructions JSONB DEFAULT '[]'::jsonb,
        required_attachments JSONB DEFAULT '[]'::jsonb,
        item_type VARCHAR(50) DEFAULT 'form',
        professor_name VARCHAR(255),
        field_of_study VARCHAR(255),
        degree_level VARCHAR(100),
        academic_term VARCHAR(100),
        page_count VARCHAR(50),
        course_code VARCHAR(50)
      );
      ALTER TABLE forms ADD COLUMN IF NOT EXISTS item_type VARCHAR(50) DEFAULT 'form';
      ALTER TABLE forms ADD COLUMN IF NOT EXISTS professor_name VARCHAR(255);
      ALTER TABLE forms ADD COLUMN IF NOT EXISTS field_of_study VARCHAR(255);
      ALTER TABLE forms ADD COLUMN IF NOT EXISTS degree_level VARCHAR(100);
      ALTER TABLE forms ADD COLUMN IF NOT EXISTS academic_term VARCHAR(100);
      ALTER TABLE forms ADD COLUMN IF NOT EXISTS page_count VARCHAR(50);
      ALTER TABLE forms ADD COLUMN IF NOT EXISTS course_code VARCHAR(50);
      ALTER TABLE forms ALTER COLUMN file_url DROP NOT NULL;
      ALTER TABLE forms ALTER COLUMN file_format DROP NOT NULL;
      ALTER TABLE forms ALTER COLUMN file_size DROP NOT NULL;
      ALTER TABLE forms ALTER COLUMN department DROP NOT NULL;
      ALTER TABLE forms ALTER COLUMN category DROP NOT NULL;
      ALTER TABLE forms ALTER COLUMN code DROP NOT NULL;
      ALTER TABLE forms ALTER COLUMN created_at DROP NOT NULL;
      ALTER TABLE forms ALTER COLUMN updated_at DROP NOT NULL;
    `);

    // ۶. جدول تنظیمات کلی سایت
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT PRIMARY KEY DEFAULT 1,
        settings JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ۷. جدول لاگ‌های امنیتی و حسابرسی
    await client.query(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        ip_address VARCHAR(60),
        user_agent TEXT,
        details JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_logs (
        id VARCHAR(64) PRIMARY KEY,
        level VARCHAR(30) NOT NULL DEFAULT 'error',
        source VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        details TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'unresolved',
        is_superficial BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS is_superficial BOOLEAN DEFAULT FALSE;
    `);

    // ۸. جدول بخش‌های معرفی مرکز
    await client.query(`
      CREATE TABLE IF NOT EXISTS presentation_sections (
        id VARCHAR(64) PRIMARY KEY,
        "order" INT DEFAULT 1,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        content TEXT NOT NULL,
        image TEXT,
        icon VARCHAR(100),
        animation_style VARCHAR(50) DEFAULT 'fade',
        image_animation_style VARCHAR(50) DEFAULT 'rotate-3d',
        frame_style VARCHAR(50) DEFAULT 'floating-isometric',
        frame_accent_color VARCHAR(50),
        frame_badge_text VARCHAR(100),
        animation_duration NUMERIC DEFAULT 0.8,
        animation_easing VARCHAR(50) DEFAULT 'easeOut',
        theme VARCHAR(50) DEFAULT 'light',
        is_visible BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS "order" INT DEFAULT 1;
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255);
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS image TEXT;
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS icon VARCHAR(100);
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS animation_style VARCHAR(50) DEFAULT 'fade';
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS image_animation_style VARCHAR(50) DEFAULT 'rotate-3d';
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS frame_style VARCHAR(50) DEFAULT 'floating-isometric';
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS frame_accent_color VARCHAR(50);
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS frame_badge_text VARCHAR(100);
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS show_overlay_text BOOLEAN DEFAULT TRUE;
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS overlay_subtitle VARCHAR(255);
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS overlay_position VARCHAR(50) DEFAULT 'top-right';
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS overlay_style VARCHAR(50) DEFAULT 'badge';
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS animation_duration NUMERIC DEFAULT 0.8;
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS animation_easing VARCHAR(50) DEFAULT 'easeOut';
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'light';
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS image_position VARCHAR(50) DEFAULT 'left';
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS text_alignment VARCHAR(50) DEFAULT 'right';
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS content_ratio VARCHAR(50) DEFAULT 'balanced';
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS vertical_align VARCHAR(50) DEFAULT 'center';
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE presentation_sections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // ۹. جدول آلبوم‌ها و نگارخانه تصاویر دانشگاه
    await client.query(`
      CREATE TABLE IF NOT EXISTS gallery_albums (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        date VARCHAR(50) NOT NULL,
        cover_image TEXT NOT NULL,
        images JSONB DEFAULT '[]'::jsonb,
        news_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE gallery_albums ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
      ALTER TABLE gallery_albums ADD COLUMN IF NOT EXISTS news_id INT;
      ALTER TABLE gallery_albums ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_metadata (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const seedFlag = await client.query(`SELECT value FROM system_metadata WHERE key = 'initial_seed_completed'`);
    const isFirstTimeBoot = seedFlag.rows.length === 0;

    // بررسی و ایجاد آلبوم نمونه اولیه در صورت اولین راه‌اندازی
    const albumCheck = await client.query('SELECT COUNT(*) FROM gallery_albums');
    if (isFirstTimeBoot && parseInt(albumCheck.rows[0].count, 10) === 0) {
      const seedAlbums = [
        {
          id: 'sample-album-1',
          title: 'نمایشگاه دستاوردهای علمی و پژوهشی',
          category: 'مراسم‌ها',
          description: 'نمایشگاه دستاوردهای علمی و پژوهشی دانشجویان مرکز کوثر کاکی.',
          date: '۱۴۰۳/۰۸/۱۵',
          cover_image: 'https://picsum.photos/seed/7606/1200/800',
          images: JSON.stringify([
            { id: 'img-1', url: 'https://picsum.photos/seed/7612/1200/800', type: 'image', title: 'افتتاحیه نمایشگاه' },
            { id: 'img-2', url: 'https://picsum.photos/seed/7737/1200/800', type: 'image', title: 'غرفه فناوری و کامپیوتر' }
          ]),
          is_active: true
        }
      ];

      for (const item of seedAlbums) {
        await client.query(
          `INSERT INTO gallery_albums (id, title, category, description, date, cover_image, images, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [item.id, item.title, item.category, item.description, item.date, item.cover_image, item.images, item.is_active]
        );
      }
      console.log('🖼️ آلبوم‌های اولیه نگارخانه با موفقیت در پایگاه داده ثبت شدند.');
    }

    // ایجاد بخش‌های اولیه معرفی مرکز در صورت خالی بودن
    const presCheck = await client.query('SELECT COUNT(*) FROM presentation_sections');
    if (parseInt(presCheck.rows[0].count, 10) === 0) {
      const seedPresentation = [
        {
          id: 'intro-1',
          order: 1,
          title: 'مرکز آموزش علمی کاربردی کوثر کاکی',
          subtitle: 'پیشرو در آموزش مهارت‌محور',
          content: 'محیطی پویا و نوین برای ارتقای دانش و مهارت‌های کاربردی، تربیت نیروهای متخصص و کارآفرین برای ورود مقتدرانه به بازار کار.',
          animation_style: 'zoom',
          image_animation_style: 'rotate-3d',
          frame_style: 'floating-isometric',
          frame_badge_text: 'دانشگاه علمی کاربردی کوثر',
          theme: 'primary',
          is_visible: true,
          image: 'https://picsum.photos/seed/7733/1200/800'
        },
        {
          id: 'intro-2',
          order: 2,
          title: 'ارتباط مستقیم با صنعت و بازار کار',
          subtitle: 'ورود مطمئن به بازار کار',
          content: 'برنامه‌های درسی همگام با نیازهای بازار کار، کارگاه‌ها و آزمایشگاه‌های مجهز و اساتید مجرب و کارآفرین.',
          animation_style: 'slide-right',
          image_animation_style: 'flip-3d',
          frame_style: 'golden-gallery',
          frame_badge_text: 'مهارت و اشتغال پایدار',
          theme: 'light',
          is_visible: true,
          image: 'https://picsum.photos/seed/7587/1200/800'
        }
      ];

      for (const item of seedPresentation) {
        await client.query(
          `INSERT INTO presentation_sections (
            id, "order", title, subtitle, content, animation_style, image_animation_style,
            frame_style, frame_badge_text, theme, is_visible, image
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING`,
          [
            item.id, item.order, item.title, item.subtitle, item.content,
            item.animation_style, item.image_animation_style, item.frame_style,
            item.frame_badge_text, item.theme, item.is_visible, item.image
          ]
        );
      }
      console.log('🏛️ بخش‌های اولیه معرفی مرکز با موفقیت در پایگاه داده ثبت شدند.');
    }

    // پاکسازی کاربران تستی قدیمی
    await client.query(`DELETE FROM users WHERE email IN ('admin@kowsar.ac.ir', 'admin', 'admin@gmail.com', 'mehdik', 'admin1', 'mehdik2510', 'mehdik2510@kowsar.ac.ir')`);

    // اطمینان از وجود حساب مدیر ارشد واقعی elmi_admin
    const elmiCheck = await client.query(`SELECT id FROM users WHERE email = 'elmi_admin' OR email = 'elmi_admin@kowsar.ac.ir'`);
    if (elmiCheck.rows.length === 0) {
      const realPassword = 'M3540143041m@';
      const hash = await bcrypt.hash(realPassword, 10);
      const allPermissions = [
        'dashboard', 'manage_students', 'manage_student_profiles', 'manage_tickets',
        'manage_financial', 'manage_portal_settings', 'manage_panel_settings',
        'manage_registrations', 'manage_news', 'manage_presentation', 'manage_banners',
        'manage_gallery', 'manage_forms', 'manage_settings', 'manage_users',
        'manage_server_monitoring', 'view_logs', 'view_security_logs'
      ];
      await client.query(
        `INSERT INTO users (
          id, name, first_name, last_name, national_id, mobile, raw_password, permissions, email, password_hash, role
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          'admin-main-elmi',
          'مدیر اصلی سامانه',
          'مدیر اصلی',
          'سامانه',
          '3540143041',
          '09170000000',
          realPassword,
          JSON.stringify(allPermissions),
          'elmi_admin',
          hash,
          'super_admin'
        ]
      );
      console.log('👤 حساب مدیر ارشد اصلی در دیتابیس با موفقیت ایجاد شد (نام کاربری: elmi_admin)');
    }

    // ایجاد اخبار پیش‌فرض در صورت اولین راه‌اندازی
    const newsCheck = await client.query('SELECT COUNT(*) FROM news');
    if (isFirstTimeBoot && parseInt(newsCheck.rows[0].count, 10) === 0) {
      const seedNews = [
        {
          title: 'آغاز ثبت‌نام دوره‌های کاردانی و کارشناسی ترم جدید',
          date: '۱۵ مهر ۱۴۰۳',
          image: 'https://picsum.photos/seed/7569/1200/800',
          summary: 'ثبت‌نام بدون کنکور در رشته‌های متنوع مهارتی و کاربردی آغاز شد.',
          content: 'با حمد و سپاس به درگاه خداوند متعال، به اطلاع تمامی علاقه‌مندان به تحصیل در مقاطع کاردانی و کارشناسی می‌رساند که ثبت‌نام ترم جدید مرکز آموزش علمی کاربردی کوثر کاکی آغاز شده است.',
          category: 'آموزشی',
          is_pinned: true,
          author: 'روابط عمومی مرکز',
          views: 1420
        },
        {
          title: 'برگزاری همایش کارآفرینی و مهارت‌آموزی',
          date: '۱۰ آبان ۱۴۰۳',
          image: 'https://picsum.photos/seed/7625/1200/800',
          summary: 'این همایش با حضور اساتید برجسته و کارآفرینان موفق منطقه در سالن آمفی‌تئاتر مرکز برگزار خواهد شد.',
          content: 'در راستای تحقق اهداف دانشگاه جامع علمی کاربردی مبنی بر تربیت نیروی متخصص و کارآفرین، همایش بزرگ «کارآفرینی و مهارت‌آموزی در عصر دیجیتال» در مرکز کوثر کاکی برگزار می‌شود.',
          category: 'رویدادها',
          is_pinned: false,
          author: 'واحد پژوهش و کارآفرینی',
          views: 890
        },
        {
          title: 'افتتاح آزمایشگاه جدید شبکه‌های کامپیوتری',
          date: '۲۲ آبان ۱۴۰۳',
          image: 'https://picsum.photos/seed/7362/1200/800',
          summary: 'در راستای ارتقای کیفیت آموزشی، آزمایشگاه مجهز شبکه‌های کامپیوتری با حضور ریاست دانشگاه افتتاح گردید.',
          content: 'امروز طی مراسمی باشکوه و با حضور ریاست محترم دانشگاه، فرماندار شهرستان و جمعی از مسئولین محلی، آزمایشگاه تخصصی شبکه‌های کامپیوتری و امنیت اطلاعات در مرکز آموزش علمی کاربردی کوثر کاکی به بهره‌برداری رسید.',
          category: 'امکانات',
          is_pinned: false,
          author: 'گروه فناوری اطلاعات',
          views: 650
        }
      ];

      for (const item of seedNews) {
        await client.query(
          `INSERT INTO news (title, date, image, summary, content, category, is_pinned, author, views)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [item.title, item.date, item.image, item.summary, item.content, item.category, item.is_pinned, item.author, item.views]
        );
      }
      console.log('📰 اخبار اولیه با موفقیت در دیتابیس ثبت شدند.');
    }

    // ایجاد بنرهای اسلایدر صفحه اصلی در صورت اولین راه‌اندازی
    const bannerCheck = await client.query('SELECT COUNT(*) FROM banners');
    if (isFirstTimeBoot && parseInt(bannerCheck.rows[0].count, 10) === 0) {
      const seedBanners = [
        {
          id: '1',
          image_url: 'https://picsum.photos/seed/7605/1200/800',
          title: 'محیط پویای یادگیری و مهارت‌آموزی',
          subtitle: 'دانشگاه جامع علمی کاربردی مرکز کوثر کاکی',
          link: '/register',
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
          order: 2,
          is_active: true,
          duration: 5,
          created_at: '1403/01/01'
        },
        {
          id: '3',
          image_url: 'https://picsum.photos/seed/7282/1200/800',
          title: 'کارگاه‌های مجهز و اساتید مجرب',
          subtitle: 'تضمین مهارت‌آموزی تخصصی و ورود مقتدر به بازار کار',
          link: '/#about',
          order: 3,
          is_active: true,
          duration: 5,
          created_at: '1403/01/01'
        }
      ];

      for (const b of seedBanners) {
        await client.query(
          `INSERT INTO banners (id, image_url, title, subtitle, link, "order", is_active, duration, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [b.id, b.image_url, b.title, b.subtitle, b.link, b.order, b.is_active, b.duration, b.created_at]
        );
      }
      console.log('🖼️ بنرهای اسلایدر صفحه اصلی در دیتابیس ثبت شدند.');
    }

    // ایجاد فرم‌ها و آیین‌نامه‌ها در صورت اولین راه‌اندازی
    const formCheck = await client.query('SELECT COUNT(*) FROM forms');
    if (isFirstTimeBoot && parseInt(formCheck.rows[0].count, 10) === 0) {
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
          tags: JSON.stringify(['ثبت‌نام', 'ورودی_جدید', 'پذیرش']),
          instructions: JSON.stringify(['تکمیل تمامی فیلدهای فرم']),
          required_attachments: JSON.stringify(['کپی شناسنامه و کارت ملی'])
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
          tags: JSON.stringify(['وام', 'صندوق_رفاه']),
          instructions: JSON.stringify(['افتتاح حساب در سامانه یکپارچه']),
          required_attachments: JSON.stringify(['تصویر کارت دانشجویی'])
        }
      ];

      for (const f of seedForms) {
        await client.query(
          `INSERT INTO forms (id, code, title, description, category, department, file_format, file_size, file_url, download_count, is_published, is_pinned, priority, created_at, updated_at, tags, instructions, required_attachments)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
          [f.id, f.code, f.title, f.description, f.category, f.department, f.file_format, f.file_size, f.file_url, f.download_count, f.is_published, f.is_pinned, f.priority, f.created_at, f.updated_at, f.tags, f.instructions, f.required_attachments]
        );
      }
      console.log('📋 فرم‌های اولیه در دیتابیس ثبت شدند.');
    }

    // علامت‌گذاری اتمام راه‌اندازی اولیه جهت عدم بازگشت مجدد داده‌های پاک‌شده توسط کاربر
    await client.query(`INSERT INTO system_metadata (key, value) VALUES ('initial_seed_completed', 'true') ON CONFLICT (key) DO NOTHING`);

    
    // جدول دانشجویان (پرتال)
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(64) PRIMARY KEY,
        national_code VARCHAR(50) UNIQUE,
        student_id VARCHAR(50),
        password VARCHAR(255),
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // جدول تیکت‌های پشتیبانی
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_national_id VARCHAR(20) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        category VARCHAR(100) NOT NULL,
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'open',
        created_at VARCHAR(50) NOT NULL,
        updated_at VARCHAR(50) NOT NULL,
        messages JSONB DEFAULT '[]'::jsonb
      );
    `);

    // جدول رسیدهای مالی
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_receipts (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        user_national_id VARCHAR(20) NOT NULL,
        amount INT NOT NULL,
        date VARCHAR(50) NOT NULL,
        tracking_code VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        admin_message TEXT,
        receipt_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // جدول پیام‌های تماس با ما
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'unread',
        date VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      await client.query(`ALTER TABLE contact_messages ALTER COLUMN email DROP NOT NULL;`);
    } catch {}

    // ۱۰. جدول ذخیره‌سازی دائمی فایل‌ها و تصاویر آپلودشده در دیتابیس (ماندگاری کامل در سرور)
    await client.query(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        folder VARCHAR(100) NOT NULL,
        original_name VARCHAR(255),
        mimetype VARCHAR(100),
        size INT,
        file_data TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_filename ON uploaded_files(filename);
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_folder ON uploaded_files(folder);
    `);

    console.log('🚀 آماده‌سازی ساختار پایگاه داده با موفقیت به اتمام رسید.');

    // بازخوانی و همگام‌سازی فایل‌های سرور
    await restoreUploadedFilesFromDB();
    await seedExistingDiskFilesToDB();
  } catch (error: any) {
    if (isQuotaOrConnectionError(error)) {
      hasCheckedPostgres = true;
      isPostgresAvailable = false;
      console.log('📦 محدودیت سهمیه دیتابیس در حین مقداردهی اولیه، انتقال خودکار به موتور محلی سرور.');
      localDb.persist();
    } else {
      console.error('❌ خطا در اتصال یا آماده‌سازی پایگاه داده:', error);
    }
  } finally {
    if (client) {
      try { client.release(); } catch {}
    }
  }
}

/**
 * بازیابی فایل‌ها از پایگاه‌داده PostgreSQL به پوشه دیسک uploads
 */
export async function restoreUploadedFilesFromDB() {
  try {
    const result = await pool.query('SELECT filename, folder, file_data FROM uploaded_files');
    if (result.rows.length > 0) {
      console.log(`🔄 بازخوانی و همگام‌سازی ${result.rows.length} فایل آپلودشده از پایگاه‌داده به دیسک...`);
      for (const row of result.rows) {
        const folderPath = path.join(process.cwd(), 'uploads', row.folder || 'general');
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        const filePath = path.join(folderPath, row.filename);
        if (!fs.existsSync(filePath)) {
          const buffer = Buffer.from(row.file_data, 'base64');
          fs.writeFileSync(filePath, buffer);
        }
      }
      console.log('✅ فایل‌های آپلودشده از سرور دیتابیس با موفقیت آماده به کار شدند.');
    }
  } catch (e) {
    console.warn('⚠️ عدم امکان بازیابی فایل‌ها از دیتابیس در زمان راه‌اندازی:', e);
  }
}

/**
 * ذخیره فایل‌های موجود روی دیسک در پایگاه‌داده دیتابیس تا هیچ‌گاه پاک نشوند
 */
export async function seedExistingDiskFilesToDB() {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) return;

    const walk = (dir: string): { filePath: string; folder: string; filename: string }[] => {
      let results: { filePath: string; folder: string; filename: string }[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(walk(fullPath));
        } else {
          const relativeFolder = path.relative(uploadsDir, path.dirname(fullPath)) || 'general';
          results.push({ filePath: fullPath, folder: relativeFolder, filename: file });
        }
      });
      return results;
    };

    const files = walk(uploadsDir);
    for (const f of files) {
      const buffer = fs.readFileSync(f.filePath);
      const base64 = buffer.toString('base64');
      const ext = path.extname(f.filename).toLowerCase();
      let mimetype = 'application/octet-stream';
      if (['.jpg', '.jpeg'].includes(ext)) mimetype = 'image/jpeg';
      else if (ext === '.png') mimetype = 'image/png';
      else if (ext === '.webp') mimetype = 'image/webp';
      else if (ext === '.svg') mimetype = 'image/svg+xml';
      else if (ext === '.pdf') mimetype = 'application/pdf';

      await pool.query(
        `INSERT INTO uploaded_files (filename, folder, original_name, mimetype, size, file_data)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (filename) DO NOTHING`,
        [f.filename, f.folder, f.filename, mimetype, buffer.length, base64]
      );
    }
  } catch (err) {
    console.warn('⚠️ همگام‌سازی فایل‌های فعلی با دیتابیس با خطا مواجه شد:', err);
  }
}
