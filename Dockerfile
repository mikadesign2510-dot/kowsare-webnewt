# مرحله اول: ساخت برنامه (Build Stage)
FROM node:22-alpine AS builder

WORKDIR /app

# کپی فایل‌های پکیج و نصب وابستگی‌ها
COPY package*.json ./
RUN npm ci

# کپی کل سورس کد و بیلد کردن نسخه پروداکشن
COPY . .
RUN npm run build

# مرحله دوم: محیط اجرایی نهایی (Production Stage)
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# کپی فایل‌های بیلد شده و پکیج
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/ecosystem.config.cjs ./

# نصب فقط وابستگی‌های پروداکشن
RUN npm ci --omit=dev && npm cache clean --force

# ایجاد دایرکتوری آپلودها با مجوز مناسب
RUN mkdir -p /app/uploads && chmod -R 777 /app/uploads

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
