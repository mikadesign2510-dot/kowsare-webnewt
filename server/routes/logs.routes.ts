import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import fs from 'fs';
import path from 'path';

const router = Router();

// دریافت لاگ‌های امنیتی (فقط مدیر ارشد)
router.get('/', requireAuth, requireRole(['super_admin']), async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 150');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching security logs:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت لاگ‌های امنیتی' });
  }
});

// دریافت لاگ‌های سیستمی
router.get('/system', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, level, source, message, details, status, 
        is_superficial,
        to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at_iso,
        created_at
      FROM system_logs 
      ORDER BY created_at DESC 
      LIMIT 300
    `);

    const formatted = result.rows.map(row => ({
      id: row.id,
      level: row.level,
      source: row.source,
      message: row.message,
      details: row.details || '',
      status: row.status,
      isSuperficial: Boolean(row.is_superficial),
      timestamp: row.created_at_iso || row.created_at
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت لاگ‌های سیستمی' });
  }
});

// ثبت لاگ سیستمی جدید
router.post('/system', async (req: Request, res: Response) => {
  try {
    const { level = 'error', source = 'Unknown', message = '', details = '', isSuperficial = false } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'پیام خطا الزامی است' });
    }

    const id = req.body.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // تشخیص خودکار سطحی بودن خطا
    const isSuperficialDetected = Boolean(
      isSuperficial ||
      source.includes('آزمایشی') ||
      source.includes('Simulation') ||
      source.includes('Console') ||
      message.includes('آزمایشی') ||
      message.includes('Warning') ||
      level === 'warning' ||
      level === 'info'
    );

    const insertRes = await pool.query(`
      INSERT INTO system_logs (id, level, source, message, details, status, is_superficial)
      VALUES ($1, $2, $3, $4, $5, 'unresolved', $6)
      ON CONFLICT (id) DO UPDATE SET
        level = EXCLUDED.level,
        source = EXCLUDED.source,
        message = EXCLUDED.message,
        details = EXCLUDED.details,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [id, level, source, message, details, isSuperficialDetected]);

    res.status(201).json({ success: true, data: insertRes.rows[0] });
  } catch (error) {
    console.error('Error logging system event:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت لاگ' });
  }
});

// تغییر وضعیت یک لاگ به حل شده
router.put('/system/:id/resolve', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      UPDATE system_logs 
      SET status = 'resolved', updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'لاگ مورد نظر یافت نشد.' });
    }

    res.json({ success: true, message: 'وضعیت خطا به حل شده تغییر یافت.', data: result.rows[0] });
  } catch (error) {
    console.error('Error resolving log:', error);
    res.status(500).json({ success: false, message: 'خطا در تغییر وضعیت لاگ' });
  }
});

// تغییر وضعیت تمامی خطاهای حل‌نشده به حل شده (Resolve All)
router.put('/system/resolve-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      UPDATE system_logs 
      SET status = 'resolved', updated_at = CURRENT_TIMESTAMP 
      WHERE status = 'unresolved'
      RETURNING id
    `);

    res.json({ 
      success: true, 
      message: `تعداد ${result.rowCount} خطای حل‌نشده به وضعیت بررسی و حل شده تغییر یافتند.`,
      resolvedCount: result.rowCount 
    });
  } catch (error) {
    console.error('Error resolving all logs:', error);
    res.status(500).json({ success: false, message: 'خطا در حل دسته‌ای لاگ‌ها' });
  }
});

// پاکسازی یا حل خودکار خطاهای سطحی و هشدارهای آزمایشی
router.put('/system/clean-superficial', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      UPDATE system_logs 
      SET status = 'resolved', updated_at = CURRENT_TIMESTAMP 
      WHERE status = 'unresolved' 
      AND (
        is_superficial = TRUE 
        OR level IN ('warning', 'info') 
        OR source LIKE '%آزمایشی%' 
        OR source LIKE '%Console%'
        OR message LIKE '%آزمایشی%'
      )
      RETURNING id
    `);

    res.json({ 
      success: true, 
      message: `تعداد ${result.rowCount} خطای سطحی و هشدار موقت بررسی و رفع گردیدند.`,
      resolvedCount: result.rowCount 
    });
  } catch (error) {
    console.error('Error cleaning superficial logs:', error);
    res.status(500).json({ success: false, message: 'خطا در پاکسازی خطاهای سطحی' });
  }
});

// حذف یک لاگ خاص
router.delete('/system/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM system_logs WHERE id = $1', [id]);
    res.json({ success: true, message: 'لاگ با موفقیت حذف گردید.' });
  } catch (error) {
    console.error('Error deleting log:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف لاگ' });
  }
});

// پاکسازی تمامی لاگ‌های سیستم
router.delete('/system/clear-all', requireAuth, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM system_logs');
    res.json({ success: true, message: 'تمامی لاگ‌های سیستم با موفقیت پاکسازی شدند.' });
  } catch (error) {
    console.error('Error clearing system logs:', error);
    res.status(500).json({ success: false, message: 'خطا در پاکسازی کلی لاگ‌ها' });
  }
});

// بررسی سلامت جامع سیستم، سرور و پایگاه داده (Health Diagnostic Endpoint)
router.get('/health', requireAuth, async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // تست اتصال دیتابیس و اندازه‌گیری زمان پاسخ
    const dbTest = await pool.query('SELECT NOW() as db_time, current_database() as db_name');
    const dbLatencyMs = Date.now() - startTime;

    // شمارش رکوردهای جداول اصلی
    const [
      newsCount,
      bannersCount,
      formsCount,
      regsCount,
      usersCount,
      logsCount,
      unresolvedLogsCount
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM news').then(r => parseInt(r.rows[0].count, 10)).catch(() => 0),
      pool.query('SELECT COUNT(*) FROM banners').then(r => parseInt(r.rows[0].count, 10)).catch(() => 0),
      pool.query('SELECT COUNT(*) FROM forms').then(r => parseInt(r.rows[0].count, 10)).catch(() => 0),
      pool.query('SELECT COUNT(*) FROM registrations').then(r => parseInt(r.rows[0].count, 10)).catch(() => 0),
      pool.query('SELECT COUNT(*) FROM users').then(r => parseInt(r.rows[0].count, 10)).catch(() => 0),
      pool.query('SELECT COUNT(*) FROM system_logs').then(r => parseInt(r.rows[0].count, 10)).catch(() => 0),
      pool.query("SELECT COUNT(*) FROM system_logs WHERE status = 'unresolved'").then(r => parseInt(r.rows[0].count, 10)).catch(() => 0),
    ]);

    // بررسی پوشه‌های ذخیره‌سازی
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const pamphletsDir = path.join(uploadsDir, 'pamphlets');
    const formsDir = path.join(uploadsDir, 'forms');

    const checkDir = (dir: string) => {
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.accessSync(dir, fs.constants.W_OK);
        return { exists: true, writable: true, filesCount: fs.readdirSync(dir).length };
      } catch {
        return { exists: false, writable: false, filesCount: 0 };
      }
    };

    const memory = process.memoryUsage();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          latencyMs: dbLatencyMs,
          databaseName: dbTest.rows[0]?.db_name || 'neondb',
          time: dbTest.rows[0]?.db_time
        },
        counts: {
          news: newsCount,
          banners: bannersCount,
          forms: formsCount,
          registrations: regsCount,
          users: usersCount,
          totalLogs: logsCount,
          unresolvedLogs: unresolvedLogsCount
        },
        storageFolders: {
          uploads: checkDir(uploadsDir),
          pamphlets: checkDir(pamphletsDir),
          forms: checkDir(formsDir)
        },
        server: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryUsageMb: {
            rss: Math.round(memory.rss / (1024 * 1024)),
            heapUsed: Math.round(memory.heapUsed / (1024 * 1024)),
            heapTotal: Math.round(memory.heapTotal / (1024 * 1024))
          }
        }
      }
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در بررسی سلامت سرور',
      error: error?.message || String(error)
    });
  }
});

export default router;

