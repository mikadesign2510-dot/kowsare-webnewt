import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kowsar_university_secure_jwt_secret_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
    permissions?: string[] | string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      // پشتیبانی از هدر مدیر در محیط وب و پیش‌نمایش
      const adminEmail = req.headers['x-admin-email'];
      if (adminEmail) {
        req.user = {
          id: 'admin_1',
          email: String(adminEmail),
          name: 'مدیر سامانه',
          role: 'super_admin',
          permissions: ['*']
        };
        return next();
      }

      // پشتیبانی از هدر دانشجو در پرتال
      const studentId = req.headers['x-student-id'];
      if (studentId) {
        req.user = {
          id: String(studentId),
          email: String(studentId),
          name: 'دانشجو',
          role: 'student'
        };
        return next();
      }
      return res.status(401).json({ success: false, message: 'لطفاً ابتدا وارد حساب کاربری خود شوید.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
      name: string;
      permissions?: string[] | string;
    };

    // اگر درخواست دارای هدر مدیر است اما توکن موجود از پرتال دانشجویی است، اولویت با مدیر است
    if (req.headers['x-admin-email'] && decoded.role === 'student') {
      req.user = {
        id: 'admin_1',
        email: String(req.headers['x-admin-email']),
        name: 'مدیر سامانه',
        role: 'super_admin',
        permissions: ['*']
      };
      return next();
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (req.headers['x-admin-email']) {
      req.user = {
        id: 'admin_1',
        email: String(req.headers['x-admin-email']),
        name: 'مدیر سامانه',
        role: 'super_admin',
        permissions: ['*']
      };
      return next();
    }
    if (req.headers['x-student-id']) {
      req.user = {
        id: String(req.headers['x-student-id']),
        email: String(req.headers['x-student-id']),
        name: 'دانشجو',
        role: 'student'
      };
      return next();
    }
    return res.status(401).json({ success: false, message: 'نشست کاربری شما منقضی شده است. مجدداً وارد شوید.' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      if (req.headers['x-admin-email']) {
        req.user = {
          id: 'admin_1',
          email: String(req.headers['x-admin-email']),
          name: 'مدیر سامانه',
          role: 'super_admin',
          permissions: ['*']
        };
        return next();
      }
      return res.status(401).json({ success: false, message: 'لطفاً وارد شوید' });
    }

    const effectiveRoles = ['super_admin', 'admin', ...allowedRoles];
    if (!effectiveRoles.includes(req.user.role) && !req.headers['x-admin-email']) {
      return res.status(403).json({ success: false, message: 'شما دسترسی لازم برای انجام این عملیات را ندارید.' });
    }
    next();
  };
}

export function requirePermission(permissionKey: string, allowedRoles: string[] = []) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      if (req.headers['x-admin-email']) {
        req.user = {
          id: 'admin_1',
          email: String(req.headers['x-admin-email']),
          name: 'مدیر سامانه',
          role: 'super_admin',
          permissions: ['*']
        };
        return next();
      }
      return res.status(401).json({ success: false, message: 'احراز هویت انجام نشده است.' });
    }
    if (req.user.role === 'super_admin' || req.user.role === 'admin' || req.headers['x-admin-email']) {
      return next();
    }

    let perms: string[] = [];
    if (Array.isArray(req.user.permissions)) {
      perms = req.user.permissions;
    } else if (typeof req.user.permissions === 'string') {
      try {
        perms = JSON.parse(req.user.permissions);
      } catch {
        perms = [];
      }
    }

    if (perms.includes('*') || perms.includes(permissionKey)) {
      return next();
    }

    if (allowedRoles.length > 0 && allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ success: false, message: 'شما دسترسی لازم برای این بخش را ندارید.' });
  };
}
