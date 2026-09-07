import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { requireAuth, requirePermission } from '../middlewares/auth.js';

const router = Router();

// دریافت لیست کامل فرم‌ها و جزوات
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM forms ORDER BY is_pinned DESC, priority ASC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت فرم‌ها و جزوات' });
  }
});

// ایجاد فرم یا جزوه جدید
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const f = req.body;
    if (!f || !f.title) {
      return res.status(400).json({ success: false, message: 'عنوان فرم یا جزوه الزامی است.' });
    }

    const id = f.id || `form-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const code = f.code || (f.itemType === 'pamphlet' ? `BOK-${Math.floor(100 + Math.random() * 900)}` : `FORM-${Math.floor(100 + Math.random() * 900)}`);
    const title = f.title.trim();
    const description = f.description || '';
    const category = f.category || (f.itemType === 'pamphlet' ? 'جزوات دروس عمومی و معارف' : 'عمومی');
    const department = f.department || (f.itemType === 'pamphlet' ? 'گروه کامپیوتر و فناوری اطلاعات' : 'آموزش');
    const fileFormat = f.fileFormat || f.file_format || 'PDF';
    const fileSize = f.fileSize || f.file_size || '۱.۵ مگابایت';
    const fileUrl = f.fileUrl || f.file_url || '';
    const downloadCount = Number(f.downloadCount || f.download_count || 0);
    const isPublished = f.isPublished !== undefined ? Boolean(f.isPublished) : (f.is_published !== undefined ? Boolean(f.is_published) : true);
    const isPinned = f.isPinned !== undefined ? Boolean(f.isPinned) : (f.is_pinned !== undefined ? Boolean(f.is_pinned) : false);
    const priority = Number(f.priority || 1);
    const createdAt = f.createdAt || f.created_at || new Date().toLocaleDateString('fa-IR');
    const updatedAt = f.updatedAt || f.updated_at || new Date().toLocaleDateString('fa-IR');

    const tagsJson = Array.isArray(f.tags) ? JSON.stringify(f.tags) : (typeof f.tags === 'string' ? f.tags : '[]');
    const instructionsJson = Array.isArray(f.instructions) ? JSON.stringify(f.instructions) : (typeof f.instructions === 'string' ? f.instructions : '[]');
    const attachmentsJson = Array.isArray(f.requiredAttachments) ? JSON.stringify(f.requiredAttachments) : (Array.isArray(f.required_attachments) ? JSON.stringify(f.required_attachments) : '[]');

    const itemType = f.itemType || f.item_type || (category.includes('جزوه') ? 'pamphlet' : 'form');
    const professorName = f.professorName || f.professor_name || null;
    const fieldOfStudy = f.fieldOfStudy || f.field_of_study || null;
    const degreeLevel = f.degreeLevel || f.degree_level || null;
    const academicTerm = f.academicTerm || f.academic_term || null;
    const pageCount = f.pageCount || f.page_count || null;
    const courseCode = f.courseCode || f.course_code || null;

    const insertResult = await pool.query(
      `INSERT INTO forms (
        id, code, title, description, category, department,
        file_format, file_size, file_url, download_count,
        is_published, is_pinned, priority, created_at, updated_at,
        tags, instructions, required_attachments,
        item_type, professor_name, field_of_study, degree_level,
        academic_term, page_count, course_code
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16::jsonb, $17::jsonb, $18::jsonb, $19, $20, $21, $22, $23, $24, $25
      )
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        department = EXCLUDED.department,
        file_format = EXCLUDED.file_format,
        file_size = EXCLUDED.file_size,
        file_url = EXCLUDED.file_url,
        download_count = EXCLUDED.download_count,
        is_published = EXCLUDED.is_published,
        is_pinned = EXCLUDED.is_pinned,
        priority = EXCLUDED.priority,
        updated_at = EXCLUDED.updated_at,
        tags = EXCLUDED.tags,
        instructions = EXCLUDED.instructions,
        required_attachments = EXCLUDED.required_attachments,
        item_type = EXCLUDED.item_type,
        professor_name = EXCLUDED.professor_name,
        field_of_study = EXCLUDED.field_of_study,
        degree_level = EXCLUDED.degree_level,
        academic_term = EXCLUDED.academic_term,
        page_count = EXCLUDED.page_count,
        course_code = EXCLUDED.course_code
      RETURNING *`,
      [
        id, code, title, description, category, department,
        fileFormat, fileSize, fileUrl, downloadCount,
        isPublished, isPinned, priority, createdAt, updatedAt,
        tagsJson, instructionsJson, attachmentsJson,
        itemType, professorName, fieldOfStudy, degreeLevel,
        academicTerm, pageCount, courseCode
      ]
    );

    res.status(201).json({
      success: true,
      message: itemType === 'pamphlet' ? 'جزوه آموزشی با موفقیت ثبت شد' : 'فرم با موفقیت ثبت شد',
      data: insertResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating form/pamphlet:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت اطلاعات در دیتابیس' });
  }
});

// ویرایش فرم یا جزوه
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const f = req.body;

    const check = await pool.query('SELECT * FROM forms WHERE id = $1', [id]);
    const current = check.rows[0] || {};

    const code = f.code ?? (current.code || (f.itemType === 'pamphlet' ? `BOK-${Math.floor(100 + Math.random() * 900)}` : `FORM-${Math.floor(100 + Math.random() * 900)}`));
    const title = f.title ? f.title.trim() : (current.title || 'عنوان');
    const description = f.description !== undefined ? f.description : (current.description || '');
    const category = f.category ?? (current.category || (f.itemType === 'pamphlet' ? 'جزوات درسی' : 'عمومی'));
    const department = f.department ?? (current.department || 'آموزش');
    const fileFormat = f.fileFormat || f.file_format || current.file_format || 'PDF';
    const fileSize = f.fileSize || f.file_size || current.file_size || '۱.۵ مگابایت';
    const fileUrl = f.fileUrl !== undefined ? f.fileUrl : (f.file_url !== undefined ? f.file_url : (current.file_url || ''));
    const downloadCount = f.downloadCount !== undefined ? Number(f.downloadCount) : (current.download_count || 0);
    const isPublished = f.isPublished !== undefined ? Boolean(f.isPublished) : (f.is_published !== undefined ? Boolean(f.is_published) : (current.is_published !== false));
    const isPinned = f.isPinned !== undefined ? Boolean(f.isPinned) : (f.is_pinned !== undefined ? Boolean(f.is_pinned) : Boolean(current.is_pinned));
    const priority = f.priority !== undefined ? Number(f.priority) : (current.priority || 1);
    const createdAt = current.created_at || f.createdAt || new Date().toLocaleDateString('fa-IR');
    const updatedAt = new Date().toLocaleDateString('fa-IR');

    const tagsJson = f.tags !== undefined ? (Array.isArray(f.tags) ? JSON.stringify(f.tags) : String(f.tags)) : JSON.stringify(current.tags || []);
    const instructionsJson = f.instructions !== undefined ? (Array.isArray(f.instructions) ? JSON.stringify(f.instructions) : String(f.instructions)) : JSON.stringify(current.instructions || []);
    const attachmentsJson = f.requiredAttachments !== undefined ? (Array.isArray(f.requiredAttachments) ? JSON.stringify(f.requiredAttachments) : String(f.requiredAttachments)) : (f.required_attachments !== undefined ? JSON.stringify(f.required_attachments) : JSON.stringify(current.required_attachments || []));

    const itemType = f.itemType || f.item_type || current.item_type || (category.includes('جزوه') ? 'pamphlet' : 'form');
    const professorName = f.professorName !== undefined ? f.professorName : (f.professor_name !== undefined ? f.professor_name : (current.professor_name || null));
    const fieldOfStudy = f.fieldOfStudy !== undefined ? f.fieldOfStudy : (f.field_of_study !== undefined ? f.field_of_study : (current.field_of_study || null));
    const degreeLevel = f.degreeLevel !== undefined ? f.degreeLevel : (f.degree_level !== undefined ? f.degree_level : (current.degree_level || null));
    const academicTerm = f.academicTerm !== undefined ? f.academicTerm : (f.academic_term !== undefined ? f.academic_term : (current.academic_term || null));
    const pageCount = f.pageCount !== undefined ? f.pageCount : (f.page_count !== undefined ? f.page_count : (current.page_count || null));
    const courseCode = f.courseCode !== undefined ? f.courseCode : (f.course_code !== undefined ? f.course_code : (current.course_code || null));

    const upsertResult = await pool.query(
      `INSERT INTO forms (
        id, code, title, description, category, department,
        file_format, file_size, file_url, download_count,
        is_published, is_pinned, priority, created_at, updated_at,
        tags, instructions, required_attachments,
        item_type, professor_name, field_of_study, degree_level,
        academic_term, page_count, course_code
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16::jsonb, $17::jsonb, $18::jsonb, $19, $20, $21, $22, $23, $24, $25
      )
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        department = EXCLUDED.department,
        file_format = EXCLUDED.file_format,
        file_size = EXCLUDED.file_size,
        file_url = EXCLUDED.file_url,
        download_count = EXCLUDED.download_count,
        is_published = EXCLUDED.is_published,
        is_pinned = EXCLUDED.is_pinned,
        priority = EXCLUDED.priority,
        updated_at = EXCLUDED.updated_at,
        tags = EXCLUDED.tags,
        instructions = EXCLUDED.instructions,
        required_attachments = EXCLUDED.required_attachments,
        item_type = EXCLUDED.item_type,
        professor_name = EXCLUDED.professor_name,
        field_of_study = EXCLUDED.field_of_study,
        degree_level = EXCLUDED.degree_level,
        academic_term = EXCLUDED.academic_term,
        page_count = EXCLUDED.page_count,
        course_code = EXCLUDED.course_code
      RETURNING *`,
      [
        id, code, title, description, category, department,
        fileFormat, fileSize, fileUrl, downloadCount,
        isPublished, isPinned, priority, createdAt, updatedAt,
        tagsJson, instructionsJson, attachmentsJson,
        itemType, professorName, fieldOfStudy, degreeLevel,
        academicTerm, pageCount, courseCode
      ]
    );

    res.json({
      success: true,
      message: 'تغییرات با موفقیت ذخیره شد.',
      data: upsertResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating form/pamphlet:', error);
    res.status(500).json({ success: false, message: 'خطا در ویرایش اطلاعات' });
  }
});

// حذف فرم یا جزوه
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM forms WHERE id = $1 RETURNING id, item_type, title', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'مورد پیدا نشد یا قبلاً حذف شده است.' });
    }

    const item = result.rows[0];
    res.json({
      success: true,
      message: item.item_type === 'pamphlet' ? `جزوه «${item.title}» با موفقیت حذف گردید.` : `فرم «${item.title}» با موفقیت حذف گردید.`
    });
  } catch (error) {
    console.error('Error deleting form/pamphlet:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف از پایگاه داده' });
  }
});

// همگام‌سازی کامل فرم‌ها و جزوات (Transaction Safe)
router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { forms } = req.body;
    if (!Array.isArray(forms)) {
      client.release();
      return res.status(400).json({ success: false, message: 'اطلاعات نامعتبر است' });
    }

    await client.query('BEGIN');
    await client.query('DELETE FROM forms');

    for (const f of forms) {
      if (!f || !f.title) continue;

      const id = f.id || `form-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const code = f.code || (f.itemType === 'pamphlet' ? `BOK-${Math.floor(100 + Math.random() * 900)}` : `FORM-${Math.floor(100 + Math.random() * 900)}`);
      const title = f.title.trim();
      const description = f.description || '';
      const category = f.category || (f.itemType === 'pamphlet' ? 'جزوات دروس عمومی و معارف' : 'عمومی');
      const department = f.department || (f.itemType === 'pamphlet' ? 'گروه کامپیوتر و فناوری اطلاعات' : 'آموزش');
      const fileFormat = f.fileFormat || f.file_format || 'PDF';
      const fileSize = f.fileSize || f.file_size || '۱.۵ مگابایت';
      const fileUrl = f.fileUrl || f.file_url || '';
      const downloadCount = Number(f.downloadCount || f.download_count || 0);
      const isPublished = f.isPublished !== undefined ? Boolean(f.isPublished) : (f.is_published !== undefined ? Boolean(f.is_published) : true);
      const isPinned = f.isPinned !== undefined ? Boolean(f.isPinned) : (f.is_pinned !== undefined ? Boolean(f.is_pinned) : false);
      const priority = Number(f.priority || 1);
      const createdAt = f.createdAt || f.created_at || new Date().toLocaleDateString('fa-IR');
      const updatedAt = f.updatedAt || f.updated_at || new Date().toLocaleDateString('fa-IR');

      const tagsJson = Array.isArray(f.tags) ? JSON.stringify(f.tags) : (typeof f.tags === 'string' ? f.tags : '[]');
      const instructionsJson = Array.isArray(f.instructions) ? JSON.stringify(f.instructions) : (typeof f.instructions === 'string' ? f.instructions : '[]');
      const attachmentsJson = Array.isArray(f.requiredAttachments) ? JSON.stringify(f.requiredAttachments) : (Array.isArray(f.required_attachments) ? JSON.stringify(f.required_attachments) : '[]');

      const itemType = f.itemType || f.item_type || (category.includes('جزوه') ? 'pamphlet' : 'form');
      const professorName = f.professorName || f.professor_name || null;
      const fieldOfStudy = f.fieldOfStudy || f.field_of_study || null;
      const degreeLevel = f.degreeLevel || f.degree_level || null;
      const academicTerm = f.academicTerm || f.academic_term || null;
      const pageCount = f.pageCount || f.page_count || null;
      const courseCode = f.courseCode || f.course_code || null;

      await client.query(
        `INSERT INTO forms (
          id, code, title, description, category, department,
          file_format, file_size, file_url, download_count,
          is_published, is_pinned, priority, created_at, updated_at,
          tags, instructions, required_attachments,
          item_type, professor_name, field_of_study, degree_level,
          academic_term, page_count, course_code
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16::jsonb, $17::jsonb, $18::jsonb, $19, $20, $21, $22, $23, $24, $25
        )`,
        [
          id, code, title, description, category, department,
          fileFormat, fileSize, fileUrl, downloadCount,
          isPublished, isPinned, priority, createdAt, updatedAt,
          tagsJson, instructionsJson, attachmentsJson,
          itemType, professorName, fieldOfStudy, degreeLevel,
          academicTerm, pageCount, courseCode
        ]
      );
    }

    await client.query('COMMIT');
    client.release();

    res.json({ success: true, message: 'فرم‌ها و جزوات با موفقیت در دیتابیس ثبت شدند' });
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Error syncing forms:', error);
    res.status(500).json({ success: false, message: 'خطا در ذخیره فرم‌ها و جزوات' });
  }
});

// افزایش شمارنده دانلود فرم یا جزوه
router.post('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('UPDATE forms SET download_count = download_count + 1 WHERE id = $1 RETURNING download_count', [id]);
    res.json({ success: true, downloadCount: result.rows[0]?.download_count || 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در ثبت دانلود' });
  }
});

export default router;
