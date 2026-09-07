# راهنمای جامع استقرار و آپلود پورتال دانشگاه علمی کاربردی کوثر کاکی روی سرور

این مستند راهنمای گام‌به‌گام راه‌اندازی و استقرار این پروژه روی سرورهای واقعی (سرور مجازی لینوکس VPS، داکر Docker، یا سرویس‌های ابری نظیر لیارا) است.

---

## 📋 نیازمندی‌های سیستم
- **سیستم‌عامل سرور:** Ubuntu 20.04 / 22.04 / 24.04 LTS یا هر توزیع دیگر لینوکس
- **Node.js:** نسخه 20 به بالا (توصیه می‌شود v22.x LTS)
- **پایگاه داده:** پایگاه داده PostgreSQL (نسخه 14 یا بالاتر، یا دیتابیس‌های ابری مانند Neon / ابر آروان / لیارا)
- **وب‌سرور معکوس (Reverse Proxy):** Nginx + گواهی SSL رایگان Let's Encrypt (Certbot)
- **ابزار مدیریت فرآیند:** PM2 یا Docker

---

## 🔑 متغیرهای محیطی مورد نیاز (فایل `.env`)
قبل از اجرای برنامه روی سرور، فایل `.env` را در ریشه پروژه بسازید یا تنظیم کنید:

```env
# پایگاه داده PostgreSQL
DATABASE_URL="postgresql://username:password@host:5432/dbname?sslmode=require"

# کلید امنیتی توکن‌های احراز هویت (JWT)
JWT_SECRET="یک_رشته_طولانی_و_تصادفی_برای_امنیت_توکن‌ها"

# آدرس دامنه پورتال
APP_URL="https://your-domain.ac.ir"

# کلید هوش مصنوعی جمنای (اختیاری)
GEMINI_API_KEY=""

# حالت اجرای محیط
NODE_ENV="production"
```

---

## 🚀 روش اول: راه‌اندازی مستقیم با PM2 و Nginx (روش استاندارد VPS)

### گام ۱: آماده‌سازی سرور و نصب ابزارها
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
```

### گام ۲: دریافت پروژه و ساخت نسخه پروداکشن
```bash
# رفتن به پوشه وب‌سایت
cd /var/www
# انتقال کدها (یا کلون کردن از گیت‌هاب)
# git clone <YOUR_REPO_URL> kowsar-portal
cd kowsar-portal

# نصب وابستگی‌ها
npm install

# ساخت بیلد نهایی پروژه
npm run build
```

### گام ۳: راه‌اندازی با PM2
فایل پیکربندی `ecosystem.config.cjs` در پروژه آماده است:
```bash
# شروع سرویس با PM2
pm2 start ecosystem.config.cjs

# فعال‌سازی اجرای خودکار پس از ریستارت سرور
pm2 save
pm2 startup
```

### گام ۴: پیکربندی Nginx و SSL
یک فایل کانفیگ در `/etc/nginx/sites-available/kowsar` ایجاد کنید:

```nginx
server {
    server_name your-domain.ac.ir www.your-domain.ac.ir;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

سپس فعال‌سازی و دریافت گواهی SSL:
```bash
sudo ln -s /etc/nginx/sites-available/kowsar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# دریافت SSL رایگان
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.ac.ir -d www.your-domain.ac.ir
```

---

## 🐳 روش دوم: استقرار با Docker و Docker Compose

اگر سرور شما دارای Docker است:

```bash
# ایجاد فایل .env با مقادیر واقعی
nano .env

# ساخت ایمیج و اجرای کانتینر
docker compose up -d --build
```
کانتینر به طور خودکار روی پورت ۳۰۰۰ بالا آمده و فایل‌های آپلود شده روی Volume محلی ذخیره می‌شوند.

---

## ☁️ روش سوم: استقرار در سرویس‌های ابری (لیارا Liara / چابکان)
1. در پنل لیارا یک برنامه از نوع **Node.js** ایجاد کنید.
2. یک دیتابیس **PostgreSQL** ایجاد و مقدار `DATABASE_URL` را در بخش متغیرها تنظیم کنید.
3. در تنظیمات متغیرهای محیطی برنامه، موارد زیر را وارد کنید:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`
4. پورت خروجی برنامه را روی `3000` قرار دهید.
5. دستور شروع (Start Command) را روی `npm run start` قرار دهید.
6. با استفاده از Liara CLI دستور `liara deploy` را اجرا نمایید.

---

## 👤 حساب کاربری اصلی مدیر پس از استقرار
هنگام اتصال به دیتابیس، سیستم جداول را به صورت خودکار ایجاد و حساب مدیر اصلی را در دیتابیس ثبت می‌کند:
- **نام کاربری:** `elmi_admin` (یا `elmi_admin@kowsar.ac.ir`)
- **رمز عبور:** `M3540143041m@`
- **سطح دسترسی:** مدیر ارشد سامانه (Super Admin با دسترسی کامل به کلیه بخش‌ها)
