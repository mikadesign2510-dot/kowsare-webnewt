import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// دریافت تنظیمات سایت
router.get(['/', '/site'], async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT settings FROM site_settings WHERE id = 1');
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: result.rows[0].settings });
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت تنظیمات سایت' });
  }
});

// ذخیره تنظیمات سایت (نیازمند لاگین)
router.post(['/', '/site'], requireAuth, async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    await pool.query(
      `INSERT INTO site_settings (id, settings, updated_at)
       VALUES (1, $1, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET settings = $1, updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(settings)]
    );
    res.json({ success: true, message: 'تنظیمات با موفقیت در پایگاه داده ذخیره شد' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ success: false, message: 'خطا در ذخیره تنظیمات در دیتابیس' });
  }
});


// دریافت تنظیمات پورتال
router.get('/portal', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT settings FROM site_settings WHERE id = 2');
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: result.rows[0].settings });
  } catch (error) {
    console.error('Error fetching portal settings:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت تنظیمات پورتال' });
  }
});

// ذخیره تنظیمات پورتال (نیازمند لاگین)
router.post('/portal', requireAuth, async (req: Request, res: Response) => {
  try {
    const settings = req.body;
    await pool.query(
      `INSERT INTO site_settings (id, settings, updated_at) 
       VALUES (2, $1, CURRENT_TIMESTAMP) 
       ON CONFLICT (id) DO UPDATE SET settings = $1, updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(settings)]
    );
    res.json({ success: true, message: 'تنظیمات پورتال با موفقیت ذخیره شد' });
  } catch (error) {
    console.error('Error saving portal settings:', error);
    res.status(500).json({ success: false, message: 'خطا در ذخیره تنظیمات پورتال' });
  }
});

export default router;
