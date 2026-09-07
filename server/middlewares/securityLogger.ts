import { Request, Response, NextFunction } from 'express';

// میدلور لاگر امنیتی هوشمند (Smart Security Logger)
// ثبت ساختاریافته‌ی درخواست‌های ناموفق و 403 جهت ارسال به API هوش مصنوعی
export const smartSecurityLogger = (req: Request, res: Response, next: NextFunction) => {
  // ذخیره تابع اصلی ارسال پاسخ
  const originalSend = res.send;

  res.send = function (body: any) {
    // بررسی کدهای وضعیت خطا (مثلاً 401، 403 یا 429)
    if (res.statusCode >= 400) {
      const securityLog = {
        timestamp: new Date().toISOString(),
        ip: req.ip || req.socket.remoteAddress,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent') || 'Unknown',
        // در صورت نیاز به حریم خصوصی، از ثبت پسوردها خودداری می‌کنیم
        payload: req.body ? { ...req.body, password: '[REDACTED]' } : {},
      };

      // در اینجا می‌توان لاگ را در دیتابیس یا فایل ذخیره کرد یا به API هوش مصنوعی فرستاد
      console.warn('[SECURITY LOG]:', JSON.stringify(securityLog));
    }
    
    // فراخوانی تابع اصلی
    return originalSend.call(this, body);
  };

  next();
};
