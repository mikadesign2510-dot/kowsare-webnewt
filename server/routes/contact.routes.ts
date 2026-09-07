import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows.map(r => ({
      id: r.id,
      name: r.name,
      senderName: r.name,
      email: r.email,
      senderEmail: r.email,
      phone: r.phone,
      senderPhone: r.phone,
      subject: r.subject,
      message: r.message,
      status: r.status,
      date: r.date,
      createdAt: r.date,
      trackingCode: r.id
    })) });
  } catch (error) {
    console.error('Fetch contact messages error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت پیام‌ها' });
  }
});

router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const items = req.body;
    if (Array.isArray(items)) {
      for (const c of items) {
        const msgId = c.id || `cmsg-${Date.now()}`;
        const name = c.senderName || c.name || 'ناشناس';
        const email = c.senderEmail || c.email || '-';
        const phone = c.senderPhone || c.phone || '-';
        const subject = c.subject || 'بدون موضوع';
        const message = c.message || '';
        const status = c.status || 'unread';
        const date = c.createdAt || c.date || new Date().toISOString();

        await pool.query(
          `INSERT INTO contact_messages (id, name, email, phone, subject, message, status, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET status = $7`,
          [msgId, name, email, phone, subject, message, status, date]
        );
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Sync contact messages error:', error);
    res.status(500).json({ success: false, message: 'خطا در همگام‌سازی پیام‌ها' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const c = req.body;
    const msgId = c.id || `cmsg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const name = c.senderName || c.name || 'ناشناس';
    const email = c.senderEmail || c.email || '-';
    const phone = c.senderPhone || c.phone || '-';
    const subject = c.subject || 'بدون موضوع';
    const message = c.message || '';
    const status = c.status || 'unread';
    const date = c.createdAt || c.date || new Date().toISOString();

    await pool.query(
      `INSERT INTO contact_messages (id, name, email, phone, subject, message, status, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET status = $7`,
      [msgId, name, email, phone, subject, message, status, date]
    );
    res.json({ success: true, id: msgId });
  } catch (error) {
    console.error('Post contact message error:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت پیام' });
  }
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const c = req.body;
    await pool.query(
      `UPDATE contact_messages SET status = $1 WHERE id = $2`,
      [c.status, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در ویرایش پیام' });
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM contact_messages WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در حذف پیام' });
  }
});

export default router;
