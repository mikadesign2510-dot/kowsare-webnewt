import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// دریافت تمامی بخش‌های معرفی مرکز
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM presentation_sections ORDER BY "order" ASC, created_at ASC'
    );
    
    const sections = result.rows.map(row => ({
      id: row.id,
      order: row.order,
      title: row.title,
      subtitle: row.subtitle || '',
      content: row.content,
      image: row.image || '',
      icon: row.icon || '',
      animationStyle: row.animation_style || 'fade',
      imageAnimationStyle: row.image_animation_style || 'rotate-3d',
      frameStyle: row.frame_style || 'floating-isometric',
      frameAccentColor: row.frame_accent_color || '',
      frameBadgeText: row.frame_badge_text || '',
      showOverlayText: row.show_overlay_text !== false,
      overlaySubtitle: row.overlay_subtitle || '',
      overlayPosition: row.overlay_position || 'top-right',
      overlayStyle: row.overlay_style || 'badge',
      animationDuration: parseFloat(row.animation_duration) || 0.8,
      animationEasing: row.animation_easing || 'easeOut',
      theme: row.theme || 'light',
      isVisible: row.is_visible !== false,
      imagePosition: row.image_position || 'left',
      textAlignment: row.text_alignment || 'right',
      contentRatio: row.content_ratio || 'balanced',
      verticalAlign: row.vertical_align || 'center'
    }));

    res.json({ success: true, data: sections });
  } catch (error) {
    console.error('Error fetching presentation sections:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت بخش‌های معرفی مرکز' });
  }
});

// ذخیره دسته‌جمعی و همگام‌سازی بخش‌های معرفی مرکز
router.post('/sync', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { sections } = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ success: false, message: 'داده‌های ارسالی نامعتبر هستند' });
    }

    await client.query('BEGIN');
    
    // پاک کردن رکوردهای قبلی و جایگزینی با ردیف‌های جدید جهت تضمین ترتیب و یکپارچگی
    await client.query('DELETE FROM presentation_sections');

    const seenIds = new Set<string>();

    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      let sectionId = (s.id && typeof s.id === 'string' && s.id.trim() !== '') ? s.id.trim() : `section-${Date.now()}-${i}`;
      
      // در صورت وجود شناسه‌های تکراری در آرایه ارسالی، یک شناسه یکتا اختصاص داده می‌شود
      if (seenIds.has(sectionId)) {
        sectionId = `section-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
      }
      seenIds.add(sectionId);

      await client.query(
        `INSERT INTO presentation_sections (
          id, "order", title, subtitle, content, image, icon,
          animation_style, image_animation_style, frame_style,
          frame_accent_color, frame_badge_text,
          show_overlay_text, overlay_subtitle, overlay_position, overlay_style,
          animation_duration, animation_easing, theme, is_visible,
          image_position, text_alignment, content_ratio, vertical_align, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          "order" = EXCLUDED."order",
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          content = EXCLUDED.content,
          image = EXCLUDED.image,
          icon = EXCLUDED.icon,
          animation_style = EXCLUDED.animation_style,
          image_animation_style = EXCLUDED.image_animation_style,
          frame_style = EXCLUDED.frame_style,
          frame_accent_color = EXCLUDED.frame_accent_color,
          frame_badge_text = EXCLUDED.frame_badge_text,
          show_overlay_text = EXCLUDED.show_overlay_text,
          overlay_subtitle = EXCLUDED.overlay_subtitle,
          overlay_position = EXCLUDED.overlay_position,
          overlay_style = EXCLUDED.overlay_style,
          animation_duration = EXCLUDED.animation_duration,
          animation_easing = EXCLUDED.animation_easing,
          theme = EXCLUDED.theme,
          is_visible = EXCLUDED.is_visible,
          image_position = EXCLUDED.image_position,
          text_alignment = EXCLUDED.text_alignment,
          content_ratio = EXCLUDED.content_ratio,
          vertical_align = EXCLUDED.vertical_align,
          updated_at = CURRENT_TIMESTAMP`,
        [
          sectionId,
          s.order !== undefined ? s.order : i + 1,
          s.title || '',
          s.subtitle || '',
          s.content || '',
          s.image || '',
          s.icon || '',
          s.animationStyle || 'fade',
          s.imageAnimationStyle || 'rotate-3d',
          s.frameStyle || 'floating-isometric',
          s.frameAccentColor || '',
          s.frameBadgeText || '',
          s.showOverlayText !== false,
          s.overlaySubtitle || '',
          s.overlayPosition || 'top-right',
          s.overlayStyle || 'badge',
          s.animationDuration || 0.8,
          s.animationEasing || 'easeOut',
          s.theme || 'light',
          s.isVisible !== false,
          s.imagePosition || 'left',
          s.textAlignment || 'right',
          s.contentRatio || 'balanced',
          s.verticalAlign || 'center'
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'بخش‌های معرفی مرکز با موفقیت در پایگاه داده ذخیره شدند' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error syncing presentation sections:', error);
    res.status(500).json({ success: false, message: 'خطا در ذخیره‌سازی بخش‌های معرفی مرکز در پایگاه داده' });
  } finally {
    client.release();
  }
});

// افزودن یا ویرایش یک بخش خاص
router.post('/', async (req: Request, res: Response) => {
  try {
    const s = req.body;
    const result = await pool.query(
      `INSERT INTO presentation_sections (
        id, "order", title, subtitle, content, image, icon,
        animation_style, image_animation_style, frame_style,
        frame_accent_color, frame_badge_text,
        show_overlay_text, overlay_subtitle, overlay_position, overlay_style,
        animation_duration, animation_easing, theme, is_visible,
        image_position, text_alignment, content_ratio, vertical_align, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        "order" = EXCLUDED."order",
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        content = EXCLUDED.content,
        image = EXCLUDED.image,
        icon = EXCLUDED.icon,
        animation_style = EXCLUDED.animation_style,
        image_animation_style = EXCLUDED.image_animation_style,
        frame_style = EXCLUDED.frame_style,
        frame_accent_color = EXCLUDED.frame_accent_color,
        frame_badge_text = EXCLUDED.frame_badge_text,
        show_overlay_text = EXCLUDED.show_overlay_text,
        overlay_subtitle = EXCLUDED.overlay_subtitle,
        overlay_position = EXCLUDED.overlay_position,
        overlay_style = EXCLUDED.overlay_style,
        animation_duration = EXCLUDED.animation_duration,
        animation_easing = EXCLUDED.animation_easing,
        theme = EXCLUDED.theme,
        is_visible = EXCLUDED.is_visible,
        image_position = EXCLUDED.image_position,
        text_alignment = EXCLUDED.text_alignment,
        content_ratio = EXCLUDED.content_ratio,
        vertical_align = EXCLUDED.vertical_align,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        s.id || `section-${Date.now()}`,
        s.order || 1,
        s.title || '',
        s.subtitle || '',
        s.content || '',
        s.image || '',
        s.icon || '',
        s.animationStyle || 'fade',
        s.imageAnimationStyle || 'rotate-3d',
        s.frameStyle || 'floating-isometric',
        s.frameAccentColor || '',
        s.frameBadgeText || '',
        s.showOverlayText !== false,
        s.overlaySubtitle || '',
        s.overlayPosition || 'top-right',
        s.overlayStyle || 'badge',
        s.animationDuration || 0.8,
        s.animationEasing || 'easeOut',
        s.theme || 'light',
        s.isVisible !== false,
        s.imagePosition || 'left',
        s.textAlignment || 'right',
        s.contentRatio || 'balanced',
        s.verticalAlign || 'center'
      ]
    );

    res.json({ success: true, data: result.rows[0], message: 'بخش با موفقیت ذخیره شد' });
  } catch (error) {
    console.error('Error saving presentation section:', error);
    res.status(500).json({ success: false, message: 'خطا در ذخیره بخش معرفی مرکز' });
  }
});

// حذف یک بخش
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM presentation_sections WHERE id = $1', [id]);
    res.json({ success: true, message: 'بخش با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting presentation section:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف بخش' });
  }
});

export default router;
