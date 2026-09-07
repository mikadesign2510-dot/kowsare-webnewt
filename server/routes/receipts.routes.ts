import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: any, res: Response) => {
  try {
    let result;
    if (req.user && req.user.role === 'student') {
      const stdId = String(req.user.id || '');
      const rawId = stdId.replace(/^std_/, '');
      const natId = String(req.user.nationalId || req.user.email || '');
      result = await pool.query(
        'SELECT * FROM financial_receipts WHERE user_id = $1 OR user_id = $2 OR user_national_id = $3 ORDER BY created_at DESC',
        [stdId, rawId, natId]
      );
    } else {
      result = await pool.query('SELECT * FROM financial_receipts ORDER BY created_at DESC');
    }

    res.json({ success: true, data: result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userNationalId: r.user_national_id,
      studentId: r.user_national_id,
      amount: String(r.amount),
      date: r.date,
      trackingCode: r.tracking_code,
      description: r.description || '',
      status: r.status,
      adminMessage: r.admin_message || '',
      receiptUrl: r.receipt_url,
      imageUrl: r.receipt_url,
      createdAt: r.created_at
    })) });
  } catch (error) {
    console.error('Fetch receipts error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت رسیدها' });
  }
});

router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const items = req.body;
    if (Array.isArray(items)) {
      for (const r of items) {
        const numAmount = parseInt(String(r.amount || 0).replace(/\D/g, ''), 10) || 0;
        const imgUrl = r.receiptUrl || r.imageUrl || '';
        const natId = r.userNationalId || r.studentId || '-';
        await pool.query(
          `INSERT INTO financial_receipts (id, user_id, user_name, user_national_id, amount, date, tracking_code, description, status, admin_message, receipt_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             status = $9, admin_message = $10`,
          [r.id, r.userId, r.userName, natId, numAmount, r.date, r.trackingCode || r.id, r.description || '', r.status || 'pending', r.adminMessage || '', imgUrl]
        );
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Receipts sync error:', error);
    res.status(500).json({ success: false, message: 'خطا در همگام‌سازی رسیدها' });
  }
});

router.post('/', requireAuth, async (req: any, res: Response) => {
  try {
    const r = req.body;
    const rcptId = r.id || `rcpt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const userId = r.userId || req.user?.id || 'std_unknown';
    const userName = r.userName || req.user?.name || 'دانشجو';
    const natId = r.userNationalId || r.studentId || req.user?.nationalId || req.user?.email || '-';
    const numAmount = parseInt(String(r.amount || 0).replace(/\D/g, ''), 10) || 0;
    const imgUrl = r.receiptUrl || r.imageUrl || '';
    const date = r.date || new Date().toLocaleDateString('fa-IR');
    const trackingCode = r.trackingCode || rcptId;
    const status = r.status || 'pending';

    await pool.query(
      `INSERT INTO financial_receipts (id, user_id, user_name, user_national_id, amount, date, tracking_code, description, status, admin_message, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         status = $9, admin_message = $10`,
      [rcptId, userId, userName, natId, numAmount, date, trackingCode, r.description || '', status, r.adminMessage || '', imgUrl]
    );
    res.json({ success: true, id: rcptId });
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت رسید' });
  }
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const r = req.body;
    await pool.query(
      `UPDATE financial_receipts SET status = COALESCE($1, status), admin_message = COALESCE($2, admin_message) WHERE id = $3`,
      [r.status, r.adminMessage, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Update receipt error:', error);
    res.status(500).json({ success: false, message: 'خطا در ویرایش رسید' });
  }
});


router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM financial_receipts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در حذف' });
  }
});

export default router;
