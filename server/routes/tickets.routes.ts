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
        'SELECT * FROM tickets WHERE user_id = $1 OR user_id = $2 OR user_national_id = $3 ORDER BY updated_at DESC',
        [stdId, rawId, natId]
      );
    } else {
      result = await pool.query('SELECT * FROM tickets ORDER BY updated_at DESC');
    }

    res.json({ success: true, data: result.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userNationalId: r.user_national_id,
      subject: r.subject,
      category: r.category,
      department: r.category,
      priority: r.priority,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      messages: r.messages
    })) });
  } catch (error) {
    console.error('Fetch tickets error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت تیکت‌ها' });
  }
});

router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const items = req.body;
    if (Array.isArray(items)) {
      for (const t of items) {
        await pool.query(
          `INSERT INTO tickets (id, user_id, user_name, user_national_id, subject, category, priority, status, created_at, updated_at, messages)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             status = $8, updated_at = $10, messages = $11`,
          [t.id, t.userId, t.userName, t.userNationalId || '-', t.subject, t.category || t.department || 'general', t.priority || 'medium', t.status, t.createdAt, t.updatedAt, JSON.stringify(t.messages || [])]
        );
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Tickets sync error:', error);
    res.status(500).json({ success: false, message: 'خطا در همگام‌سازی تیکت‌ها' });
  }
});

router.post('/', requireAuth, async (req: any, res: Response) => {
  try {
    const t = req.body;
    const ticketId = t.id || `tk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const userId = t.userId || req.user?.id || 'std_unknown';
    const userName = t.userName || req.user?.name || 'دانشجو';
    const userNationalId = t.userNationalId || req.user?.nationalId || req.user?.email || '-';
    const category = t.category || t.department || 'آموزش';
    const priority = t.priority || 'medium';
    const status = t.status || 'open';
    const createdAt = t.createdAt || new Date().toISOString();
    const updatedAt = t.updatedAt || new Date().toISOString();
    const messages = t.messages || [];

    await pool.query(
      `INSERT INTO tickets (id, user_id, user_name, user_national_id, subject, category, priority, status, created_at, updated_at, messages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         status = $8, updated_at = $10, messages = $11`,
      [ticketId, userId, userName, userNationalId, t.subject, category, priority, status, createdAt, updatedAt, JSON.stringify(messages)]
    );
    res.json({ success: true, id: ticketId });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت تیکت' });
  }
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const t = req.body;
    await pool.query(
      `UPDATE tickets SET status = COALESCE($1, status), updated_at = $2, messages = $3 WHERE id = $4`,
      [t.status, t.updatedAt || new Date().toISOString(), JSON.stringify(t.messages || []), req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ success: false, message: 'خطا در ویرایش تیکت' });
  }
});


router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM tickets WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در حذف' });
  }
});

export default router;
