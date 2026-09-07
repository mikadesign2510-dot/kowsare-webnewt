import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// دریافت لیست پیش‌ثبت‌نام‌ها برای پنل مدیریت (نیازمند لاگین)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM registrations ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت لیست ثبت‌نام‌ها' });
  }
});

// ثبت نام جدید از سمت متقاضی (عمومی)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { fullName, nationalCode, phone, degree, field, description } = req.body;

    if (!fullName || !nationalCode || !phone || !degree || !field) {
      return res.status(400).json({
        success: false,
        message: 'لطفاً تمامی فیلدهای الزامی فرم را پر نمایید.'
      });
    }

    const id = `reg-${Date.now()}`;
    const date = new Date().toLocaleDateString('fa-IR');

    const result = await pool.query(
      `INSERT INTO registrations (id, full_name, national_code, phone, degree, field, description, date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, fullName, nationalCode, phone, degree, field, description || '', date, 'pending']
    );

    res.status(201).json({
      success: true,
      message: 'پیش‌ثبت‌نام شما با موفقیت در سامانه ثبت گردید.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error submitting registration:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت پیش‌ثبت‌نام' });
  }
});

// به‌روزرسانی وضعیت ثبت‌نام (مثلاً تغییر به تأیید شده، رد شده و...)
router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE registrations SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'مورد ثبت‌نام یافت نشد' });
    }

    res.json({ success: true, message: 'وضعیت با موفقیت تغییر یافت', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: 'خطا در تغییر وضعیت' });
  }
});

// حذف درخواست ثبت‌نام
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM registrations WHERE id = $1', [id]);
    res.json({ success: true, message: 'درخواست با موفقیت حذف گردید' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف ثبت‌نام' });
  }
});

export default router;
