import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT data FROM students ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows.map(r => r.data) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در دریافت لیست دانشجویان' });
  }
});

router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const students = req.body;
    if (Array.isArray(students)) {
      for (const st of students) {
        if (!st.nationalCode) continue;
        await pool.query(
          `INSERT INTO students (id, national_code, student_id, password, data)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (national_code) DO UPDATE SET
             student_id = $3, password = $4, data = $5`,
          [st.id || `std-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, st.nationalCode, st.studentId || '', st.password || st.nationalCode, JSON.stringify(st)]
        );
      }
    }
    res.json({ success: true, message: 'همگام‌سازی دانشجویان انجام شد' });
  } catch (error) {
    console.error('Students sync error:', error);
    res.status(500).json({ success: false, message: 'خطا در همگام‌سازی دانشجویان' });
  }
});

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const st = req.body;
    if (!st.nationalCode) {
      return res.status(400).json({ success: false, message: 'کد ملی الزامی است' });
    }
    const studentId = st.id || `std-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const studentData = { ...st, id: studentId };

    await pool.query(
      `INSERT INTO students (id, national_code, student_id, password, data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (national_code) DO UPDATE SET
         student_id = $3, password = $4, data = $5`,
      [studentId, st.nationalCode, st.studentId || '', st.password || st.nationalCode, JSON.stringify(studentData)]
    );
    res.json({ success: true, data: studentData });
  } catch (error) {
    console.error('Add student DB error:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت دانشجو' });
  }
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const st = req.body;
    const existing = await pool.query('SELECT data, password, national_code, student_id FROM students WHERE id = $1', [id]);
    const existingRow = existing.rows[0];
    const mergedData = existingRow ? { ...existingRow.data, ...st } : st;
    const natCode = mergedData.nationalCode || existingRow?.national_code || '';
    const stdId = mergedData.studentId || existingRow?.student_id || '';
    const pass = mergedData.password || existingRow?.password || natCode;

    await pool.query(
      `UPDATE students SET national_code = $1, student_id = $2, password = $3, data = $4
       WHERE id = $5`,
      [natCode, stdId, pass, JSON.stringify(mergedData), id]
    );
    res.json({ success: true, data: mergedData });
  } catch (error) {
    console.error('Update student DB error:', error);
    res.status(500).json({ success: false, message: 'خطا در ویرایش دانشجو' });
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در حذف دانشجو' });
  }
});

export default router;
