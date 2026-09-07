import { Router, Request, Response } from 'express';
import { pool } from '../db.js';

const router = Router();

// دریافت لیست کامل بنرها
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM banners ORDER BY "order" ASC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت بنرها' });
  }
});

// ایجاد یا به‌روزرسانی کلی لیست بنرها (UPSERT Safe Sync)
router.post('/sync', async (req: Request, res: Response) => {
  const { banners } = req.body;
  if (!Array.isArray(banners)) {
    return res.status(400).json({ success: false, message: 'لیست بنرها نامعتبر است' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query('DELETE FROM banners');

    for (let i = 0; i < banners.length; i++) {
      const b = banners[i];
      const bannerId = String(b.id || `banner-${Date.now()}-${i}`);
      const showButton = b.showButton !== false && b.showButton !== 'false';
      const isActive = b.isActive !== false && b.isActive !== 'false';
      const order = Number(b.order) || (i + 1);
      const duration = Number(b.duration) || 5;

      await client.query(
        `INSERT INTO banners (id, image_url, title, subtitle, link, show_button, button_text, "order", is_active, duration, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          bannerId,
          b.imageUrl || b.image_url || '',
          b.title || null,
          b.subtitle || null,
          b.link || null,
          showButton,
          b.buttonText || b.button_text || 'مشاهده جزئیات',
          order,
          isActive,
          duration,
          b.createdAt || b.created_at || new Date().toLocaleDateString('fa-IR')
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'بنرها با موفقیت در دیتابیس ذخیره شدند' });
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch {}
    }
    console.error('Error syncing banners:', error);
    res.status(500).json({ success: false, message: 'خطا در ذخیره بنرها' });
  } finally {
    if (client) {
      try { client.release(); } catch {}
    }
  }
});

// ایجاد یا ویرایش یک بنر تکی
router.post('/', async (req: Request, res: Response) => {
  try {
    const b = req.body;
    const bannerId = String(b.id || `banner-${Date.now()}`);
    const showButton = b.showButton !== false && b.showButton !== 'false';
    const isActive = b.isActive !== false && b.isActive !== 'false';
    const order = Number(b.order) || 1;
    const duration = Number(b.duration) || 5;

    const result = await pool.query(
      `INSERT INTO banners (id, image_url, title, subtitle, link, show_button, button_text, "order", is_active, duration, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         image_url = EXCLUDED.image_url,
         title = EXCLUDED.title,
         subtitle = EXCLUDED.subtitle,
         link = EXCLUDED.link,
         show_button = EXCLUDED.show_button,
         button_text = EXCLUDED.button_text,
         "order" = EXCLUDED."order",
         is_active = EXCLUDED.is_active,
         duration = EXCLUDED.duration
       RETURNING *`,
      [
        bannerId,
        b.imageUrl || b.image_url || '',
        b.title || null,
        b.subtitle || null,
        b.link || null,
        showButton,
        b.buttonText || b.button_text || 'مشاهده جزئیات',
        order,
        isActive,
        duration,
        b.createdAt || b.created_at || new Date().toLocaleDateString('fa-IR')
      ]
    );

    res.json({ success: true, data: result.rows[0], message: 'بنر با موفقیت ذخیره شد' });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ success: false, message: 'خطا در ذخیره بنر' });
  }
});

// ویرایش یک بنر تکی
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const b = req.body;
    const showButton = b.showButton !== undefined ? (b.showButton !== false && b.showButton !== 'false') : undefined;
    const isActive = b.isActive !== undefined ? (b.isActive !== false && b.isActive !== 'false') : undefined;

    const result = await pool.query(
      `UPDATE banners SET
         image_url = COALESCE($1, image_url),
         title = COALESCE($2, title),
         subtitle = COALESCE($3, subtitle),
         link = COALESCE($4, link),
         show_button = COALESCE($5, show_button),
         button_text = COALESCE($6, button_text),
         "order" = COALESCE($7, "order"),
         is_active = COALESCE($8, is_active),
         duration = COALESCE($9, duration)
       WHERE id = $10
       RETURNING *`,
      [
        b.imageUrl || b.image_url,
        b.title,
        b.subtitle,
        b.link,
        showButton,
        b.buttonText || b.button_text,
        b.order !== undefined ? Number(b.order) : undefined,
        isActive,
        b.duration !== undefined ? Number(b.duration) : undefined,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'بنر مورد نظر یافت نشد' });
    }

    res.json({ success: true, data: result.rows[0], message: 'بنر با موفقیت به‌روزرسانی شد' });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ success: false, message: 'خطا در ویرایش بنر' });
  }
});

// حذف بنر
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM banners WHERE id = $1', [id]);
    res.json({ success: true, message: 'بنر با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف بنر' });
  }
});

export default router;
