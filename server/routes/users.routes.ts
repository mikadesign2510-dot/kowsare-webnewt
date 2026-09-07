import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import { requireAuth, requireRole, requirePermission, AuthenticatedRequest } from '../middlewares/auth.js';

const router = Router();

// دریافت لیست کاربران ادمین (مدیر ارشد سامانه یا کارشناس دارای دسترسی manage_users)
router.get('/', requireAuth, requirePermission('manage_users', ['super_admin']), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        first_name AS "firstName", 
        last_name AS "lastName", 
        national_id AS "nationalId", 
        mobile, 
        email, 
        raw_password AS "password", 
        role, 
        permissions, 
        created_at 
      FROM users 
      ORDER BY created_at ASC
    `);
    const formatted = result.rows.map(u => {
      let perms = [];
      if (Array.isArray(u.permissions)) {
        perms = u.permissions;
      } else if (typeof u.permissions === 'string') {
        try { perms = JSON.parse(u.permissions || '[]'); } catch { perms = []; }
      }
      return {
        ...u,
        permissions: perms
      };
    });
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت کاربران' });
  }
});

// ایجاد کاربر ادمین جدید
router.post('/', requireAuth, requirePermission('manage_users', ['super_admin']), async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      firstName = '', 
      lastName = '', 
      nationalId = '', 
      mobile = '', 
      email, 
      password, 
      role = 'education_expert',
      permissions = [] 
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'نام کاربری/ایمیل و رمز عبور الزامی است' });
    }

    const check = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'کاربری با این شناسه از قبل وجود دارد' });
    }

    const hash = await bcrypt.hash(password, 10);
    const id = `user-${Date.now()}`;
    const fullName = (firstName && lastName ? `${firstName} ${lastName}` : name) || email;

    const cleanPermissions = Array.isArray(permissions) 
      ? JSON.stringify(permissions) 
      : (typeof permissions === 'string' ? permissions : '[]');

    const result = await pool.query(
      `INSERT INTO users (
        id, name, first_name, last_name, national_id, mobile, raw_password, email, password_hash, role, permissions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, name, first_name AS "firstName", last_name AS "lastName", national_id AS "nationalId", mobile, email, raw_password AS "password", role, permissions, created_at`,
      [
        id, 
        fullName, 
        firstName, 
        lastName, 
        nationalId, 
        mobile, 
        password, 
        email.trim().toLowerCase(), 
        hash, 
        role, 
        cleanPermissions
      ]
    );

    res.status(201).json({ success: true, message: 'کاربر جدید با موفقیت ایجاد شد', data: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد کاربر' });
  }
});

// ویرایش اطلاعات کاربر (نقش، نام، ایمیل، کد ملی، شماره همراه، دسترسی‌ها و اختیاری رمز عبور)
router.put('/:id', requireAuth, requirePermission('manage_users', ['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, firstName = '', lastName = '', nationalId = '', mobile = '', email, role, password, permissions = [] } = req.body;

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'کاربر یافت نشد' });
    }

    const current = existing.rows[0];
    
    // کارشناسان عادی نمی‌توانند حساب سوپر ادمین را دستکاری کنند
    if (current.role === 'super_admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'امکان ویرایش حساب مدیر ارشد توسط سایر کاربران وجود ندارد' });
    }

    const fullName = (firstName && lastName ? `${firstName} ${lastName}` : name) || current.name;
    const cleanEmail = email ? email.trim().toLowerCase() : current.email;
    const cleanRole = role || current.role;
    const cleanPermissions = Array.isArray(permissions) 
      ? JSON.stringify(permissions) 
      : (typeof permissions === 'string' ? permissions : (current.permissions || '[]'));

    if (password && password.trim().length >= 6) {
      const hash = await bcrypt.hash(password.trim(), 10);
      await pool.query(
        `UPDATE users SET 
          name = $1, 
          first_name = $2, 
          last_name = $3, 
          national_id = $4, 
          mobile = $5, 
          raw_password = $6, 
          email = $7, 
          role = $8, 
          permissions = $9, 
          password_hash = $10, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $11`,
        [fullName, firstName, lastName, nationalId, mobile, password.trim(), cleanEmail, cleanRole, cleanPermissions, hash, id]
      );
    } else {
      await pool.query(
        `UPDATE users SET 
          name = $1, 
          first_name = $2, 
          last_name = $3, 
          national_id = $4, 
          mobile = $5, 
          email = $6, 
          role = $7, 
          permissions = $8, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $9`,
        [fullName, firstName, lastName, nationalId, mobile, cleanEmail, cleanRole, cleanPermissions, id]
      );
    }

    res.json({ success: true, message: 'اطلاعات کاربر با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی اطلاعات کاربر' });
  }
});

// تغییر رمز عبور کاربر
router.patch('/:id/password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    let userPerms: string[] = [];
    if (Array.isArray(req.user?.permissions)) {
      userPerms = req.user.permissions;
    } else if (typeof req.user?.permissions === 'string') {
      try { userPerms = JSON.parse(req.user.permissions || '[]'); } catch {}
    }
    const canManage = req.user?.role === 'super_admin' || userPerms.includes('*') || userPerms.includes('manage_users');

    // فقط خود کاربر یا مدیر دارای دسترسی می‌تواند رمز را عوض کند
    if (req.user?.id !== id && !canManage) {
      return res.status(403).json({ success: false, message: 'دسترسی غیرمجاز' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hash, id]);

    res.json({ success: true, message: 'رمز عبور با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, message: 'خطا در تغییر رمز عبور' });
  }
});

// حذف کاربر
router.delete('/:id', requireAuth, requirePermission('manage_users', ['super_admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user?.id === id) {
      return res.status(400).json({ success: false, message: 'امکان حذف حساب کاربری خودتان وجود ندارد' });
    }
    
    const existing = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (existing.rows.length > 0 && existing.rows[0].role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'امکان حذف مدیر ارشد سامانه وجود ندارد' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true, message: 'کاربر با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف کاربر' });
  }
});

export default router;
