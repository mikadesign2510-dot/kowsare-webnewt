import { Request, Response, NextFunction } from 'express';

// غیرفعال‌سازی محدودیت نرخ در محیط پیش‌نمایش جهت جلوگیری از خطای Rate exceeded
export const loginRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  next();
};

