import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// دریافت لیست اخبار (با قابلیت فیلتر، صفحه‌بندی و جستجو)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search, published } = req.query;
    let query = 'SELECT * FROM news WHERE 1=1';
    const params: any[] = [];

    if (published !== undefined && published !== 'all') {
      params.push(published === 'true');
      query += ` AND is_published = $${params.length}`;
    }

    if (category && category !== 'all') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR summary ILIKE $${params.length} OR content ILIKE $${params.length})`;
    }

    query += ' ORDER BY is_pinned DESC, priority ASC, id DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت لیست اخبار' });
  }
});

// دریافت یک خبر بر اساس شناسه (ID) و افزایش خودکار تعداد بازدید (Views)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM news WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'خبر مورد نظر یافت نشد' });
    }

    // افزایش شمارنده بازدید
    await pool.query('UPDATE news SET views = views + 1 WHERE id = $1', [id]);

    const newsItem = result.rows[0];
    newsItem.views += 1;

    res.json({ success: true, data: newsItem });
  } catch (error) {
    console.error('Error fetching news item:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت خبر' });
  }
});

// ایجاد خبر جدید (نیازمند لاگین)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      title,
      subtitle,
      date,
      image,
      summary,
      content,
      category,
      priority = 1,
      isPinned = false,
      isPublished = true,
      author = 'روابط عمومی مرکز',
      tags = [],
      attachments = [],
      gallery = [],
      readTime = '۳ دقیقه'
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'عنوان خبر الزامی است' });
    }

    const finalSummary = summary?.trim() || content?.trim()?.slice(0, 180) || title;
    const finalContent = content?.trim() || summary?.trim() || title;
    const finalCategory = category?.trim() || 'آموزشی';

    const result = await pool.query(
      `INSERT INTO news (
        title, subtitle, date, image, summary, content, category,
        priority, is_pinned, is_published, author, tags, attachments, gallery, read_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        title.trim(),
        subtitle?.trim() || null,
        date || new Date().toLocaleDateString('fa-IR'),
        image || null,
        finalSummary,
        finalContent,
        finalCategory,
        Number(priority) || 1,
        Boolean(isPinned),
        isPublished !== false,
        author || 'روابط عمومی مرکز',
        JSON.stringify(tags || []),
        JSON.stringify(attachments || []),
        JSON.stringify(gallery || []),
        readTime || '۳ دقیقه'
      ]
    );

    res.status(201).json({ success: true, message: 'خبر با موفقیت در دیتابیس ثبت شد', data: result.rows[0] });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد خبر در دیتابیس' });
  }
});

// ویرایش خبر (نیازمند لاگین یا دسترسی ادمین)
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const fields: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) {
      values.push(body.title.trim());
      fields.push(`title = $${values.length}`);
    }
    if (body.subtitle !== undefined) {
      values.push(body.subtitle ? body.subtitle.trim() : null);
      fields.push(`subtitle = $${values.length}`);
    }
    if (body.date !== undefined) {
      values.push(body.date);
      fields.push(`date = $${values.length}`);
    }
    if (body.image !== undefined) {
      values.push(body.image);
      fields.push(`image = $${values.length}`);
    }
    if (body.summary !== undefined) {
      values.push(body.summary.trim());
      fields.push(`summary = $${values.length}`);
    }
    if (body.content !== undefined) {
      values.push(body.content.trim());
      fields.push(`content = $${values.length}`);
    }
    if (body.category !== undefined) {
      values.push(body.category.trim());
      fields.push(`category = $${values.length}`);
    }
    if (body.priority !== undefined) {
      values.push(Number(body.priority) || 1);
      fields.push(`priority = $${values.length}`);
    }
    if (body.isPinned !== undefined || body.is_pinned !== undefined) {
      const pinVal = body.isPinned !== undefined ? body.isPinned : body.is_pinned;
      values.push(Boolean(pinVal));
      fields.push(`is_pinned = $${values.length}`);
    }
    if (body.isPublished !== undefined || body.is_published !== undefined) {
      const pubVal = body.isPublished !== undefined ? body.isPublished : body.is_published;
      values.push(Boolean(pubVal));
      fields.push(`is_published = $${values.length}`);
    }
    if (body.author !== undefined) {
      values.push(body.author ? body.author.trim() : 'روابط عمومی مرکز');
      fields.push(`author = $${values.length}`);
    }
    if (body.views !== undefined) {
      values.push(Number(body.views) || 0);
      fields.push(`views = $${values.length}`);
    }
    if (body.tags !== undefined) {
      values.push(JSON.stringify(Array.isArray(body.tags) ? body.tags : []));
      fields.push(`tags = $${values.length}`);
    }
    if (body.attachments !== undefined) {
      values.push(JSON.stringify(Array.isArray(body.attachments) ? body.attachments : []));
      fields.push(`attachments = $${values.length}`);
    }
    if (body.gallery !== undefined) {
      values.push(JSON.stringify(Array.isArray(body.gallery) ? body.gallery : []));
      fields.push(`gallery = $${values.length}`);
    }
    if (body.readTime !== undefined || body.read_time !== undefined) {
      values.push(body.readTime || body.read_time || '۳ دقیقه');
      fields.push(`read_time = $${values.length}`);
    }

    if (fields.length === 0) {
      return res.json({ success: true, message: 'بدون تغییر' });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    const query = `UPDATE news SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;
    
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'خبر جهت ویرایش یافت نشد' });
    }

    res.json({ success: true, message: 'خبر با موفقیت به‌روزرسانی شد', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ success: false, message: 'خطا در ویرایش خبر' });
  }
});

// حذف خبر (نیازمند لاگین)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM news WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'خبر مورد نظر برای حذف یافت نشد' });
    }

    res.json({ success: true, message: 'خبر با موفقیت حذف گردید' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف خبر' });
  }
});

export default router;
