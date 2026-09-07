import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kowsar_university_secure_jwt_secret_2026';

router.post('/login', async (req: Request, res: Response) => {
  const { nationalId, password } = req.body;
  try {
    const cleanId = String(nationalId || '').trim();
    const cleanPass = String(password || '').trim();

    const stResult = await pool.query(
      'SELECT data, password FROM students WHERE national_code = $1 OR student_id = $1',
      [cleanId]
    );
    if (stResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'کد ملی / شماره دانشجویی یا رمز عبور اشتباه است' });
    }
    
    const studentDb = stResult.rows[0];
    const student = studentDb.data || {};
    
    // Check if account is deactivated
    if (student.isActive === false) {
      return res.status(403).json({ success: false, message: 'حساب کاربری شما توسط آموزش غیرفعال شده است.' });
    }

    const dbPassword = studentDb.password || student.password || student.nationalCode;
    
    if (dbPassword !== cleanPass) {
      return res.status(401).json({ success: false, message: 'کد ملی / شماره دانشجویی یا رمز عبور اشتباه است' });
    }
    
    // Create token
    const token = jwt.sign(
      { 
        id: `std_${student.id || cleanId}`, 
        email: student.nationalCode || cleanId, 
        nationalId: student.nationalCode || cleanId, 
        role: 'student', 
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'دانشجو' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      data: student
    });
  } catch (error) {
    console.error('Portal auth login error:', error);
    res.status(500).json({ success: false, message: 'خطا در سیستم احراز هویت' });
  }
});

// Check if student exists (for password recovery & validation)
router.post('/check-student', async (req: Request, res: Response) => {
  const { nationalId } = req.body;
  try {
    const cleanId = String(nationalId || '').trim();
    const stResult = await pool.query(
      'SELECT data FROM students WHERE national_code = $1 OR student_id = $1',
      [cleanId]
    );
    if (stResult.rows.length === 0) {
      return res.json({ success: false, exists: false, message: 'دانشجویی با این کد ملی یافت نشد' });
    }
    const student = stResult.rows[0].data || {};
    res.json({
      success: true,
      exists: true,
      student: {
        id: student.id,
        nationalCode: student.nationalCode,
        studentId: student.studentId,
        mobile: student.mobile,
        emergencyMobile: student.emergencyMobile,
        firstName: student.firstName,
        lastName: student.lastName,
        isActive: student.isActive
      }
    });
  } catch (error) {
    console.error('Portal check-student error:', error);
    res.status(500).json({ success: false, message: 'خطا در بررسی مشخصات دانشجو' });
  }
});

// Reset password in database
router.post('/reset-password', async (req: Request, res: Response) => {
  const { nationalId, newPassword } = req.body;
  if (!nationalId || !newPassword) {
    return res.status(400).json({ success: false, message: 'کد ملی و رمز عبور جدید الزامی هستند' });
  }
  try {
    const cleanId = String(nationalId).trim();
    const cleanPass = String(newPassword).trim();
    
    const stResult = await pool.query(
      'SELECT id, data FROM students WHERE national_code = $1 OR student_id = $1',
      [cleanId]
    );
    if (stResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'دانشجویی با این مشخصات یافت نشد' });
    }
    
    const row = stResult.rows[0];
    const updatedData = { ...row.data, password: cleanPass };
    
    await pool.query(
      'UPDATE students SET password = $1, data = $2 WHERE id = $3',
      [cleanPass, JSON.stringify(updatedData), row.id]
    );
    
    res.json({ success: true, message: 'رمز عبور با موفقیت در پایگاه داده بروزرسانی شد' });
  } catch (error) {
    console.error('Reset password DB error:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت رمز عبور در پایگاه داده' });
  }
});

export default router;
