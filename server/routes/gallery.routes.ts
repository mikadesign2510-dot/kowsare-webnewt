import { Router, Request, Response } from 'express';
import { pool } from '../db.js';

const router = Router();

// Helper to map DB row to client GalleryAlbum object
function mapDbToAlbum(row: any) {
  let images = [];
  try {
    images = typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || []);
  } catch (e) {
    images = [];
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category,
    date: row.date,
    coverImage: row.cover_image,
    images: Array.isArray(images) ? images : [],
    newsId: row.news_id ? Number(row.news_id) : undefined,
    isActive: row.is_active !== false,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
  };
}

// ۱. دریافت تمام آلبوم‌ها
router.get('/', async (req: Request, res: Response) => {
  try {
    const { activeOnly } = req.query;
    let query = 'SELECT * FROM gallery_albums ORDER BY created_at DESC';
    if (activeOnly === 'true') {
      query = 'SELECT * FROM gallery_albums WHERE is_active = TRUE ORDER BY created_at DESC';
    }
    const result = await pool.query(query);
    const albums = result.rows.map(mapDbToAlbum);
    res.json({ success: true, data: albums });
  } catch (error) {
    console.error('Error fetching gallery albums:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت آلبوم‌های نگارخانه' });
  }
});

// ۲. همگام‌سازی کامل دسته‌ای (Bulk Sync)
router.post('/sync', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { albums } = req.body;
    if (!Array.isArray(albums)) {
      return res.status(400).json({ success: false, message: 'لیست آلبوم‌ها نامعتبر است' });
    }

    await client.query('BEGIN');
    
    // شناسه‌های موجود در درخواست
    const incomingIds = albums.map(a => String(a.id)).filter(Boolean);
    
    // اگر لیست خالی نیست، رکوردهای حذف‌شده را پاک کن
    if (incomingIds.length > 0) {
      await client.query('DELETE FROM gallery_albums WHERE NOT (id = ANY($1))', [incomingIds]);
    } else {
      await client.query('DELETE FROM gallery_albums');
    }

    for (let i = 0; i < albums.length; i++) {
      const a = albums[i];
      const albumId = String(a.id || `album-${Date.now()}-${i}`);
      const imagesJson = JSON.stringify(Array.isArray(a.images) ? a.images : []);
      const isActive = a.isActive !== undefined ? Boolean(a.isActive) : true;

      await client.query(
        `INSERT INTO gallery_albums (id, title, description, category, date, cover_image, images, news_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           date = EXCLUDED.date,
           cover_image = EXCLUDED.cover_image,
           images = EXCLUDED.images,
           news_id = EXCLUDED.news_id,
           is_active = EXCLUDED.is_active,
           updated_at = CURRENT_TIMESTAMP`,
        [
          albumId,
          a.title || 'بدون عنوان',
          a.description || '',
          a.category || 'عمومی',
          a.date || new Date().toLocaleDateString('fa-IR'),
          a.coverImage || '',
          imagesJson,
          a.newsId ? parseInt(String(a.newsId), 10) : null,
          isActive,
          a.createdAt ? new Date(a.createdAt) : new Date()
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'آلبوم‌های نگارخانه با موفقیت در دیتابیس همگام‌سازی شدند' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error syncing gallery albums:', error);
    res.status(500).json({ success: false, message: 'خطا در ذخیره‌سازی آلبوم‌ها در دیتابیس' });
  } finally {
    client.release();
  }
});

// ۳. ایجاد یا ویرایش یک آلبوم تکی
router.post('/', async (req: Request, res: Response) => {
  try {
    const a = req.body;
    if (!a.title || !a.title.trim()) {
      return res.status(400).json({ success: false, message: 'عنوان آلبوم الزامی است' });
    }

    const albumId = String(a.id || `album-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
    const imagesJson = JSON.stringify(Array.isArray(a.images) ? a.images : []);
    const isActive = a.isActive !== undefined ? Boolean(a.isActive) : true;

    const result = await pool.query(
      `INSERT INTO gallery_albums (id, title, description, category, date, cover_image, images, news_id, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         category = EXCLUDED.category,
         date = EXCLUDED.date,
         cover_image = EXCLUDED.cover_image,
         images = EXCLUDED.images,
         news_id = EXCLUDED.news_id,
         is_active = EXCLUDED.is_active,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        albumId,
        a.title.trim(),
        (a.description || '').trim(),
        (a.category || 'عمومی').trim(),
        a.date || new Date().toLocaleDateString('fa-IR'),
        a.coverImage || '',
        imagesJson,
        a.newsId ? parseInt(String(a.newsId), 10) : null,
        isActive
      ]
    );

    res.json({ success: true, data: mapDbToAlbum(result.rows[0]), message: 'آلبوم با موفقیت ثبت گردید' });
  } catch (error) {
    console.error('Error saving single gallery album:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت آلبوم' });
  }
});

// ۴. کلید تغییر سریع وضعیت فعال/غیرفعال آلبوم
router.put('/:id/toggle-active', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    let result;
    if (typeof isActive === 'boolean') {
      result = await pool.query(
        'UPDATE gallery_albums SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [isActive, id]
      );
    } else {
      result = await pool.query(
        'UPDATE gallery_albums SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'آلبوم یافت نشد' });
    }

    const updated = mapDbToAlbum(result.rows[0]);
    res.json({ 
      success: true, 
      data: updated, 
      message: `آلبوم با موفقیت ${updated.isActive ? 'فعال و نمایان در سایت' : 'غیرفعال و مخفی'} گردید.` 
    });
  } catch (error) {
    console.error('Error toggling album status:', error);
    res.status(500).json({ success: false, message: 'خطا در تغییر وضعیت آلبوم' });
  }
});

// ۵. حذف آلبوم
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM gallery_albums WHERE id = $1', [id]);
    res.json({ success: true, message: 'آلبوم با موفقیت حذف گردید' });
  } catch (error) {
    console.error('Error deleting gallery album:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف آلبوم' });
  }
});

export default router;
