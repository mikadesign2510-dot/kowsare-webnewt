import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { pool } from '../db.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

// تضمین وجود پوشه‌های فیش‌ها و داده‌ها روی هاست سرور
const RECEIPTS_DIR = path.join(process.cwd(), 'uploads', 'receipts');
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const RECEIPTS_FILE = path.join(DATA_DIR, 'financial_receipts.json');

// خواندن و نوشتن امن رسیدها در فایل پشتیبان دیسک هاست
function getDiskReceipts(): any[] {
  try {
    if (fs.existsSync(RECEIPTS_FILE)) {
      const content = fs.readFileSync(RECEIPTS_FILE, 'utf8');
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.warn('Error reading receipts from disk:', e);
  }
  return [];
}

function saveReceiptToDisk(receipt: any) {
  try {
    const list = getDiskReceipts();
    const idx = list.findIndex(r => r.id === receipt.id || (r.tracking_code && r.tracking_code === receipt.tracking_code));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...receipt };
    } else {
      list.unshift(receipt);
    }
    fs.writeFileSync(RECEIPTS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.warn('Error saving receipt to disk:', e);
  }
}

// تبدیل ارقام فارسی و عربی به انگلیسی
function normalizeDigits(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim();
}

// تولید کد پیگیری تضمین‌شده منحصر‌به‌فرد و غیرتکراری
async function generateUniqueTrackingCode(): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const diskList = getDiskReceipts();

  for (let attempt = 0; attempt < 30; attempt++) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000); // 5 رقمی با آنتروپی بالا
    const candidate = `KOW-${yy}${mm}${dd}-${randomSuffix}`;

    // بررسی عدم تکراری بودن در دیسک
    const inDisk = diskList.some(r => r.tracking_code === candidate || r.trackingCode === candidate);
    if (inDisk) continue;

    // بررسی عدم تکراری بودن در دیتابیس
    try {
      const check = await pool.query('SELECT 1 FROM financial_receipts WHERE tracking_code = $1 LIMIT 1', [candidate]);
      if (check.rows.length === 0) {
        return candidate;
      }
    } catch {
      return candidate;
    }
  }

  return `KOW-${yy}${mm}${dd}-${Date.now().toString().slice(-6)}`;
}

// ذخیره‌سازی تصویر فیش (در صورت ارسال به صورت Base64) مستقیماً در دیسک هاست
function saveBase64ReceiptFile(dataUrl: string, trackingCode: string): string {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return dataUrl || '';
  }
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      let ext = '.jpg';
      if (mimeType.includes('png')) ext = '.png';
      else if (mimeType.includes('webp')) ext = '.webp';
      else if (mimeType.includes('pdf')) ext = '.pdf';

      const fileName = `receipt-${trackingCode.replace(/[^a-zA-Z0-9_-]/g, '')}-${Date.now()}${ext}`;
      const filePath = path.join(RECEIPTS_DIR, fileName);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      return `/uploads/receipts/${fileName}`;
    }
  } catch (err) {
    console.warn('Failed to save base64 receipt to disk:', err);
  }
  return dataUrl;
}

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

    const map = new Map<string, any>();
    // اضافه کردن داده‌های دیتابیس
    result.rows.forEach(r => map.set(r.id, {
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
      studentMobile: r.student_mobile || '',
      submissionType: r.submission_type || 'portal',
      category: r.category || '',
      bankRefNumber: r.bank_ref_number || '',
      createdAt: r.created_at
    }));

    // ادغام رسیدهای موجود در دیسک هاست
    const diskReceipts = getDiskReceipts();
    diskReceipts.forEach(r => {
      if (!map.has(r.id)) {
        map.set(r.id, {
          id: r.id,
          userId: r.user_id || r.userId,
          userName: r.user_name || r.userName,
          userNationalId: r.user_national_id || r.userNationalId || r.studentId,
          studentId: r.user_national_id || r.userNationalId || r.studentId,
          amount: String(r.amount),
          date: r.date,
          trackingCode: r.tracking_code || r.trackingCode,
          description: r.description || '',
          status: r.status || 'pending',
          adminMessage: r.admin_message || r.adminMessage || '',
          receiptUrl: r.receipt_url || r.receiptUrl || r.imageUrl,
          imageUrl: r.receipt_url || r.receiptUrl || r.imageUrl,
          studentMobile: r.student_mobile || r.studentMobile || '',
          submissionType: r.submission_type || r.submissionType || 'quick',
          category: r.category || '',
          bankRefNumber: r.bank_ref_number || r.bankRefNumber || '',
          createdAt: r.created_at || r.createdAt
        });
      }
    });

    const list = Array.from(map.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Fetch receipts error:', error);
    // بازگردانی از دیسک در صورت بروز خطا در دیتابیس
    const diskList = getDiskReceipts();
    res.json({ success: true, data: diskList });
  }
});

// ارسال سریع فیش واریزی توسط دانشجو بدون نیاز به لاگین
router.post('/quick-submit', async (req: Request, res: Response) => {
  try {
    const r = req.body;
    const rcptId = r.id || `rcpt-quick-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const rawNatId = String(r.userNationalId || r.studentId || '').trim();
    const natId = normalizeDigits(rawNatId);
    const userId = r.userId || (natId ? `std_${natId}` : 'quick_user');
    const userName = (r.userName || 'دانشجو').trim();
    const rawAmountStr = normalizeDigits(String(r.amount || 0));
    const numAmount = parseInt(rawAmountStr.replace(/\D/g, ''), 10) || 0;
    
    // تولید یا اعتبارسنجی کد پیگیری یکتا
    let trackingCode = r.trackingCode ? normalizeDigits(r.trackingCode) : '';
    if (!trackingCode || trackingCode.length < 5) {
      trackingCode = await generateUniqueTrackingCode();
    }

    // ذخیره تصویر فیش روی دیسک هاست
    const rawImgUrl = r.receiptUrl || r.imageUrl || '';
    const finalReceiptUrl = saveBase64ReceiptFile(rawImgUrl, trackingCode);

    const date = r.date || new Date().toLocaleDateString('fa-IR');
    const status = 'pending';
    const studentMobile = normalizeDigits(String(r.studentMobile || '').trim());
    const category = String(r.category || 'شهریه').trim();
    const bankRefNumber = normalizeDigits(String(r.bankRefNumber || '').trim());
    const description = String(r.description || '').trim();
    const createdAt = new Date().toISOString();

    const recordData = {
      id: rcptId,
      user_id: userId,
      user_name: userName,
      user_national_id: natId,
      amount: numAmount,
      date,
      tracking_code: trackingCode,
      description,
      status,
      admin_message: '',
      receipt_url: finalReceiptUrl,
      student_mobile: studentMobile,
      submission_type: 'quick',
      category,
      bank_ref_number: bankRefNumber,
      created_at: createdAt
    };

    // ذخیره آنی در دیسک هاست (data/financial_receipts.json) جهت اطمینان دائمی
    saveReceiptToDisk(recordData);

    // ذخیره در جدول PostgreSQL
    try {
      await pool.query(
        `INSERT INTO financial_receipts (
          id, user_id, user_name, user_national_id, amount, date, tracking_code, 
          description, status, admin_message, receipt_url, student_mobile, submission_type, category, bank_ref_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          status = $9, 
          admin_message = $10,
          amount = $5,
          receipt_url = $11`,
        [
          rcptId, userId, userName, natId, numAmount, date, trackingCode, 
          description, status, '', finalReceiptUrl, studentMobile, 'quick', category, bankRefNumber
        ]
      );
    } catch (dbErr) {
      console.warn('Database insert warning (saved on disk):', dbErr);
    }

    res.json({ 
      success: true, 
      id: rcptId, 
      trackingCode,
      receiptUrl: finalReceiptUrl,
      message: 'فیش واریزی با موفقیت در سرور ثبت شد' 
    });
  } catch (error) {
    console.error('Quick submit receipt error:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت سریع فیش واریزی' });
  }
});

// پیگیری وضعیت فیش بدون لاگین از طریق کد پیگیری، کد ملی یا شماره همراه
router.get(['/quick-track', '/quick-track/:query'], async (req: Request, res: Response) => {
  try {
    const rawQ = String(req.params.query || req.query.q || '').trim();
    if (!rawQ) {
      return res.status(400).json({ success: false, message: 'کد پیگیری یا کد ملی الزامی است' });
    }

    const normQ = normalizeDigits(rawQ);
    const upperQ = normQ.toUpperCase();
    const map = new Map<string, any>();

    // ۱. جستجو در پایگاه‌داده
    try {
      const result = await pool.query(
        `SELECT * FROM financial_receipts 
         WHERE tracking_code ILIKE $1 
            OR tracking_code ILIKE $2
            OR user_national_id = $1 
            OR user_national_id = $3
            OR student_mobile = $1
            OR student_mobile = $3
         ORDER BY created_at DESC LIMIT 25`,
        [`%${normQ}%`, `%${upperQ}%`, normQ]
      );

      result.rows.forEach(r => {
        map.set(r.id, {
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
          studentMobile: r.student_mobile || '',
          submissionType: r.submission_type || 'quick',
          category: r.category || '',
          bankRefNumber: r.bank_ref_number || '',
          createdAt: r.created_at
        });
      });
    } catch (dbErr) {
      console.warn('DB quick track query error:', dbErr);
    }

    // ۲. جستجو در دیسک هاست
    const diskReceipts = getDiskReceipts();
    diskReceipts.forEach(r => {
      const rTrack = String(r.tracking_code || r.trackingCode || '').toUpperCase();
      const rNat = normalizeDigits(String(r.user_national_id || r.userNationalId || r.studentId || ''));
      const rMob = normalizeDigits(String(r.student_mobile || r.studentMobile || ''));

      if (
        rTrack.includes(upperQ) ||
        rNat === normQ ||
        rMob === normQ
      ) {
        if (!map.has(r.id)) {
          map.set(r.id, {
            id: r.id,
            userId: r.user_id || r.userId,
            userName: r.user_name || r.userName,
            userNationalId: r.user_national_id || r.userNationalId,
            studentId: r.user_national_id || r.userNationalId,
            amount: String(r.amount),
            date: r.date,
            trackingCode: r.tracking_code || r.trackingCode,
            description: r.description || '',
            status: r.status || 'pending',
            adminMessage: r.admin_message || r.adminMessage || '',
            receiptUrl: r.receipt_url || r.receiptUrl || r.imageUrl,
            imageUrl: r.receipt_url || r.receiptUrl || r.imageUrl,
            studentMobile: r.student_mobile || r.studentMobile || '',
            submissionType: r.submission_type || r.submissionType || 'quick',
            category: r.category || '',
            bankRefNumber: r.bank_ref_number || r.bankRefNumber || '',
            createdAt: r.created_at || r.createdAt
          });
        }
      }
    });

    const list = Array.from(map.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    res.json({
      success: true,
      data: list
    });
  } catch (error) {
    console.error('Quick track receipt error:', error);
    res.status(500).json({ success: false, message: 'خطا در پیگیری رسید' });
  }
});

router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    const items = req.body;
    if (Array.isArray(items)) {
      for (const r of items) {
        const rawAmountStr = normalizeDigits(String(r.amount || 0));
        const numAmount = parseInt(rawAmountStr.replace(/\D/g, ''), 10) || 0;
        const imgUrl = r.receiptUrl || r.imageUrl || '';
        const natId = normalizeDigits(String(r.userNationalId || r.studentId || '-'));
        const trackingCode = r.trackingCode || r.id;

        saveReceiptToDisk({
          id: r.id,
          user_id: r.userId,
          user_name: r.userName,
          user_national_id: natId,
          amount: numAmount,
          date: r.date,
          tracking_code: trackingCode,
          description: r.description || '',
          status: r.status || 'pending',
          admin_message: r.adminMessage || '',
          receipt_url: imgUrl,
          student_mobile: r.studentMobile || '',
          submission_type: r.submissionType || 'portal',
          category: r.category || '',
          bank_ref_number: r.bankRefNumber || '',
          created_at: r.createdAt || new Date().toISOString()
        });

        try {
          await pool.query(
            `INSERT INTO financial_receipts (
              id, user_id, user_name, user_national_id, amount, date, tracking_code, 
              description, status, admin_message, receipt_url, student_mobile, submission_type, category, bank_ref_number
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO UPDATE SET
              status = $9, admin_message = $10`,
            [
              r.id, r.userId, r.userName, natId, numAmount, r.date, trackingCode, 
              r.description || '', r.status || 'pending', r.adminMessage || '', imgUrl,
              r.studentMobile || '', r.submissionType || 'portal', r.category || '', r.bankRefNumber || ''
            ]
          );
        } catch (dbErr) {
          console.warn('Sync DB insert error:', dbErr);
        }
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
    const natId = normalizeDigits(String(r.userNationalId || r.studentId || req.user?.nationalId || req.user?.email || '-'));
    const numAmount = parseInt(String(r.amount || 0).replace(/\D/g, ''), 10) || 0;
    const trackingCode = r.trackingCode || (await generateUniqueTrackingCode());
    const rawImgUrl = r.receiptUrl || r.imageUrl || '';
    const finalReceiptUrl = saveBase64ReceiptFile(rawImgUrl, trackingCode);
    const date = r.date || new Date().toLocaleDateString('fa-IR');
    const status = r.status || 'pending';
    const category = r.category || 'شهریه';
    const bankRefNumber = r.bankRefNumber || '';

    saveReceiptToDisk({
      id: rcptId,
      user_id: userId,
      user_name: userName,
      user_national_id: natId,
      amount: numAmount,
      date,
      tracking_code: trackingCode,
      description: r.description || '',
      status,
      admin_message: r.adminMessage || '',
      receipt_url: finalReceiptUrl,
      student_mobile: r.studentMobile || '',
      submission_type: 'portal',
      category,
      bank_ref_number: bankRefNumber,
      created_at: new Date().toISOString()
    });

    try {
      await pool.query(
        `INSERT INTO financial_receipts (id, user_id, user_name, user_national_id, amount, date, tracking_code, description, status, admin_message, receipt_url, category, bank_ref_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           status = $9, admin_message = $10, receipt_url = $11`,
        [rcptId, userId, userName, natId, numAmount, date, trackingCode, r.description || '', status, r.adminMessage || '', finalReceiptUrl, category, bankRefNumber]
      );
    } catch (dbErr) {
      console.warn('DB insert error:', dbErr);
    }

    res.json({ success: true, id: rcptId, trackingCode });
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ success: false, message: 'خطا در ثبت رسید' });
  }
});

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const r = req.body;
    const diskList = getDiskReceipts();
    const idx = diskList.findIndex(item => item.id === req.params.id);
    if (idx !== -1) {
      if (r.status !== undefined) diskList[idx].status = r.status;
      if (r.adminMessage !== undefined) diskList[idx].admin_message = r.adminMessage;
      fs.writeFileSync(RECEIPTS_FILE, JSON.stringify(diskList, null, 2), 'utf8');
    }

    try {
      await pool.query(
        `UPDATE financial_receipts SET status = COALESCE($1, status), admin_message = COALESCE($2, admin_message) WHERE id = $3`,
        [r.status, r.adminMessage, req.params.id]
      );
    } catch (dbErr) {
      console.warn('DB update error:', dbErr);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update receipt error:', error);
    res.status(500).json({ success: false, message: 'خطا در ویرایش رسید' });
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const diskList = getDiskReceipts().filter(item => item.id !== req.params.id);
    fs.writeFileSync(RECEIPTS_FILE, JSON.stringify(diskList, null, 2), 'utf8');

    try {
      await pool.query('DELETE FROM financial_receipts WHERE id = $1', [req.params.id]);
    } catch (dbErr) {
      console.warn('DB delete error:', dbErr);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطا در حذف' });
  }
});

export default router;
