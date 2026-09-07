import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, AuthenticatedRequest } from '../middlewares/auth.js';
import { pool } from '../db.js';

const router = Router();

// Ensure the uploads directory exists on the server
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Pre-create known section subdirectories
// پوشه‌های اختصاصی جزوات، درسنامه‌ها و فرم‌های دانشگاهی در سرور
const DEFAULT_FOLDERS = [
  'pamphlets', // پوشه اختصاصی جزوات، درسنامه‌ها و کتب آموزشی دانشگاه
  'forms',     // پوشه اختصاصی فرم‌ها و کاربرگ‌های اداری و مالی
  'banners', 
  'gallery', 
  'videos', 
  'news', 
  'settings', 
  'portal', 
  'avatars', 
  'general'
];

DEFAULT_FOLDERS.forEach(sub => {
  const p = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
});

// Helper to determine and create safe subfolder
const getTargetDir = (folderParam?: any) => {
  const rawFolder = String(folderParam || 'general').toLowerCase().trim();
  const safeFolder = rawFolder.replace(/[^a-z0-9_-]/g, '') || 'general';
  const targetDir = path.join(UPLOADS_DIR, safeFolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return { targetDir, safeFolder };
};

// Allowed extensions and mimetypes - شامل تمام پسوندهای اسناد، ارائه‌ها، جزوات و فشرده‌سازی
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.jfif', '.bmp', '.tiff', '.tif', '.heic', '.heif', '.avif',
  '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.pptx', '.ppt', '.txt', '.rtf',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.odt', '.ods', '.odp',
  '.epub', '.djvu', '.mobi',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav'
]);

// پسوندهای بالقوه خطرناک اجرایی که نباید روی سرور آپلود شوند
const BLOCKED_EXECUTABLES = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs', '.ps1', '.jar', '.com', '.scr', '.pif'
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.query.folder || req.headers['x-upload-folder'] || (req as any).body?.folder;
    const { targetDir } = getTargetDir(folder);
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // بازگردانی کاراکترهای فارسی در صورت انکود غیراستاندارد latin1 توسط مرورگر/busboy
    let originalName = file.originalname;
    try {
      originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch {}

    const ext = path.extname(originalName).toLowerCase();
    const rawBase = path.basename(originalName, ext);
    // مجاز شمردن حروف فارسی، انگلیسی، اعداد و خط فاصله
    const sanitizedBase = rawBase
      .replace(/[^a-zA-Z0-9_\u0600-\u06FF\s-]/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 60);

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
    cb(null, `${uniqueSuffix}-${sanitizedBase || 'file'}${ext || '.pdf'}`);
  }
});

// بدون محدودیت حجم برای جزوات و فرم‌ها (حداکثر تا ۱۰ گیگابایت برای فایل‌های بسیار حجیم، کتاب‌ها و پکیج‌های آموزشی)
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // ۱۰ گیگابایت (بدون محدودیت واقعی برای فایل‌های حجیم و جزوات)
    fieldSize: 500 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    let originalName = file.originalname;
    try {
      originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch {}

    const ext = path.extname(originalName).toLowerCase();

    // مسدودسازی فایل‌های اجرایی خطرناک
    if (ext && BLOCKED_EXECUTABLES.has(ext)) {
      return cb(new Error('بارگذاری فایل‌های اجرایی و اسکریپتی (.exe, .bat, .sh, ...) مجاز نمی‌باشد.'));
    }

    // برای تمامی فایل‌های اسنادی، آموزشی، جزوات و فرم‌ها بدون محدودیت مجاز است
    cb(null, true);
  }
});

// Single file upload endpoint
router.post('/', (req: Request, res: Response) => {
  upload.single('file')(req, res, async (err: any) => {
    if (err) {
      console.error('File upload middleware error:', err);
      return res.status(400).json({
        success: false,
        message: err instanceof multer.MulterError ? `خطای آپلود: ${err.message}` : (err.message || 'خطا در بارگذاری فایل')
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'هیچ فایلی برای بارگذاری ارسال نشده است'
        });
      }

      const folder = req.query.folder || req.headers['x-upload-folder'] || req.body?.folder;
      const { safeFolder, targetDir } = getTargetDir(folder);
      const fileUrl = `/uploads/${safeFolder}/${req.file.filename}`;
      const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);

      // ذخیره‌سازی دائمی فایل در پایگاه‌داده PostgreSQL (جهت تضمین عدم مفقودی پس از ریستارت یا تغییرات سرور)
      try {
        const filePath = path.join(targetDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const base64Data = fileBuffer.toString('base64');
          await pool.query(
            `INSERT INTO uploaded_files (filename, folder, original_name, mimetype, size, file_data)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (filename) DO UPDATE SET
               folder = EXCLUDED.folder,
               original_name = EXCLUDED.original_name,
               mimetype = EXCLUDED.mimetype,
               size = EXCLUDED.size,
               file_data = EXCLUDED.file_data,
               created_at = CURRENT_TIMESTAMP`,
            [
              req.file.filename,
              safeFolder,
              req.file.originalname,
              req.file.mimetype,
              req.file.size,
              base64Data
            ]
          );
        }
      } catch (dbBackupErr) {
        console.warn('⚠️ اخطار بکاپ دیتابیس فایل آپلود شده (فایل روی دیسک ذخیره شده است):', dbBackupErr);
      }

      res.json({
        success: true,
        message: 'فایل با موفقیت در سرور و پایگاه داده دائمی ذخیره گردید',
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          sizeFormatted: `${fileSizeMB} مگابایت`,
          mimetype: req.file.mimetype,
          folder: safeFolder,
          url: fileUrl
        }
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'خطا در ذخیره‌سازی فایل'
      });
    }
  });
});

// Multiple files upload endpoint (for gallery or multi attachments)
router.post('/multiple', (req: Request, res: Response) => {
  upload.array('files', 30)(req, res, async (err: any) => {
    if (err) {
      console.error('Multiple upload middleware error:', err);
      return res.status(400).json({
        success: false,
        message: err instanceof multer.MulterError ? `خطای آپلود گروهی: ${err.message}` : (err.message || 'خطا در بارگذاری فایل‌ها')
      });
    }

    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'هیچ فایلی برای بارگذاری ارسال نشده است'
        });
      }

      const folder = req.query.folder || req.headers['x-upload-folder'] || req.body?.folder;
      const { safeFolder, targetDir } = getTargetDir(folder);

      // ذخیره‌سازی دائمی تمام فایل‌ها در پایگاه‌داده
      for (const f of files) {
        try {
          const filePath = path.join(targetDir, f.filename);
          if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            const base64Data = fileBuffer.toString('base64');
            await pool.query(
              `INSERT INTO uploaded_files (filename, folder, original_name, mimetype, size, file_data)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (filename) DO UPDATE SET
                 folder = EXCLUDED.folder,
                 original_name = EXCLUDED.original_name,
                 mimetype = EXCLUDED.mimetype,
                 size = EXCLUDED.size,
                 file_data = EXCLUDED.file_data,
                 created_at = CURRENT_TIMESTAMP`,
              [f.filename, safeFolder, f.originalname, f.mimetype, f.size, base64Data]
            );
          }
        } catch (dbErr) {
          console.warn('⚠️ اخطار ذخیره‌سازی فایل گروهی در دیتابیس:', dbErr);
        }
      }

      const uploadedFiles = files.map(f => ({
        filename: f.filename,
        originalName: f.originalname,
        size: f.size,
        sizeFormatted: `${(f.size / (1024 * 1024)).toFixed(2)} مگابایت`,
        mimetype: f.mimetype,
        folder: safeFolder,
        url: `/uploads/${safeFolder}/${f.filename}`
      }));

      res.json({
        success: true,
        message: `${uploadedFiles.length} فایل با موفقیت در پوشه ${safeFolder} و پایگاه‌داده دائمی ذخیره شدند`,
        data: uploadedFiles
      });
    } catch (error: any) {
      console.error('Multiple file upload error:', error);
      res.status(500).json({
        success: false,
        message: error?.message || 'خطا در پردازش فایل‌ها'
      });
    }
  });
});

// List uploaded files (for admin dashboard / storage monitoring / dedicated folder browser)
router.get('/list', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const folderParam = req.query.folder ? String(req.query.folder).trim() : null;
    
    if (folderParam) {
      const safeFolder = folderParam.replace(/[^a-z0-9_-]/gi, '') || 'general';
      const targetDir = path.join(UPLOADS_DIR, safeFolder);
      if (!fs.existsSync(targetDir)) {
        return res.json({ success: true, count: 0, folder: safeFolder, data: [] });
      }
      const fileNames = fs.readdirSync(targetDir);
      const files = fileNames.filter(name => !name.startsWith('.')).map(name => {
        const filePath = path.join(targetDir, name);
        const stat = fs.statSync(filePath);
        const ext = path.extname(name).toLowerCase();
        return {
          name,
          folder: safeFolder,
          url: `/uploads/${safeFolder}/${name}`,
          size: stat.size,
          sizeFormatted: stat.size >= 1024 * 1024 
            ? `${(stat.size / (1024 * 1024)).toFixed(2)} مگابایت` 
            : `${(stat.size / 1024).toFixed(1)} کیلوبایت`,
          createdAt: stat.birthtime,
          ext
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.json({
        success: true,
        folder: safeFolder,
        count: files.length,
        data: files
      });
    }

    // Default: scan all default folders (pamphlets, forms, etc.)
    const allFiles: any[] = [];
    DEFAULT_FOLDERS.forEach(folder => {
      const folderDir = path.join(UPLOADS_DIR, folder);
      if (fs.existsSync(folderDir)) {
        const names = fs.readdirSync(folderDir);
        names.forEach(name => {
          if (name.startsWith('.')) return;
          const filePath = path.join(folderDir, name);
          try {
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              allFiles.push({
                name,
                folder,
                url: `/uploads/${folder}/${name}`,
                size: stat.size,
                sizeFormatted: stat.size >= 1024 * 1024 
                  ? `${(stat.size / (1024 * 1024)).toFixed(2)} مگابایت` 
                  : `${(stat.size / 1024).toFixed(1)} کیلوبایت`,
                createdAt: stat.birthtime,
                ext: path.extname(name).toLowerCase()
              });
            }
          } catch {}
        });
      }
    });

    allFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      count: allFiles.length,
      data: allFiles
    });
  } catch (error: any) {
    console.error('List uploads error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت لیست فایل‌ها' });
  }
});

// Endpoint to list files in dedicated folders (e.g. pamphlets or forms)
router.get('/files', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const folder = String(req.query.folder || 'pamphlets').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const folderDir = path.join(UPLOADS_DIR, folder);
    if (!fs.existsSync(folderDir)) {
      fs.mkdirSync(folderDir, { recursive: true });
    }

    const fileNames = fs.readdirSync(folderDir).filter(f => !f.startsWith('.'));
    const files = fileNames.map(name => {
      const filePath = path.join(folderDir, name);
      try {
        const stat = fs.statSync(filePath);
        return {
          name,
          folder,
          url: `/uploads/${folder}/${name}`,
          size: stat.size,
          sizeFormatted: stat.size >= 1024 * 1024 
            ? `${(stat.size / (1024 * 1024)).toFixed(2)} مگابایت` 
            : `${(stat.size / 1024).toFixed(1)} کیلوبایت`,
          createdAt: stat.birthtime,
          ext: path.extname(name).toLowerCase()
        };
      } catch {
        return null;
      }
    }).filter(Boolean).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      folder,
      count: files.length,
      data: files
    });
  } catch (error: any) {
    console.error('Get folder files error:', error);
    res.status(500).json({ success: false, message: 'خطا در واکشی فایل‌های پوشه' });
  }
});

// Folders status summary endpoint
router.get('/folders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const foldersInfo = DEFAULT_FOLDERS.map(f => {
      const dir = path.join(UPLOADS_DIR, f);
      let count = 0;
      let totalSize = 0;
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          try {
            const stat = fs.statSync(path.join(dir, file));
            if (stat.isFile()) {
              count++;
              totalSize += stat.size;
            }
          } catch {}
        });
      }
      return {
        id: f,
        name: f === 'pamphlets' ? 'پوشه اختصاصی جزوات درسی' : (f === 'forms' ? 'پوشه اختصاصی فرم‌های اداری' : f),
        count,
        totalSize,
        totalSizeFormatted: totalSize >= 1024 * 1024 
          ? `${(totalSize / (1024 * 1024)).toFixed(2)} مگابایت` 
          : `${(totalSize / 1024).toFixed(1)} کیلوبایت`
      };
    });

    res.json({
      success: true,
      data: foldersInfo
    });
  } catch (error: any) {
    console.error('Get folders error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت وضعیت پوشه‌ها' });
  }
});


// Endpoint to list all uploaded images with stats and folder grouping
router.get('/images', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const folderParam = req.query.folder ? String(req.query.folder).trim() : null;
    const searchParam = req.query.q ? String(req.query.q).toLowerCase().trim() : null;
    const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.avif']);

    const foldersToScan = folderParam && folderParam !== 'all'
      ? [folderParam.replace(/[^a-z0-9_-]/gi, '') || 'general']
      : DEFAULT_FOLDERS;

    const filesMap = new Map<string, any>();

    // 1. Scan filesystem
    for (const folder of foldersToScan) {
      const folderDir = path.join(UPLOADS_DIR, folder);
      if (fs.existsSync(folderDir)) {
        let names: string[] = [];
        try {
          names = fs.readdirSync(folderDir);
        } catch {}

        for (const name of names) {
          if (name.startsWith('.')) continue;
          const ext = path.extname(name).toLowerCase();
          if (!IMAGE_EXTS.has(ext)) continue;

          if (searchParam && !name.toLowerCase().includes(searchParam)) {
            continue;
          }

          const filePath = path.join(folderDir, name);
          try {
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              const key = `${folder}/${name}`;
              filesMap.set(key, {
                id: key,
                name,
                folder,
                url: `/uploads/${folder}/${name}`,
                size: stat.size,
                sizeFormatted: stat.size >= 1024 * 1024 
                  ? `${(stat.size / (1024 * 1024)).toFixed(2)} مگابایت` 
                  : `${(stat.size / 1024).toFixed(1)} کیلوبایت`,
                createdAt: stat.birthtime || stat.mtime,
                ext,
                isImage: true
              });
            }
          } catch {}
        }
      }
    }

    // 2. Scan DB uploaded_files to guarantee sync
    try {
      let dbQuery = 'SELECT filename, folder, original_name, mimetype, size, created_at FROM uploaded_files';
      const dbParams: any[] = [];
      if (folderParam && folderParam !== 'all') {
        dbQuery += ' WHERE folder = $1';
        dbParams.push(folderParam.replace(/[^a-z0-9_-]/gi, ''));
      }
      const dbResult = await pool.query(dbQuery, dbParams);

      for (const row of dbResult.rows) {
        const ext = path.extname(row.filename || '').toLowerCase();
        const isImg = IMAGE_EXTS.has(ext) || (row.mimetype && String(row.mimetype).startsWith('image/'));
        if (!isImg) continue;

        const folder = row.folder || 'general';
        const name = row.filename;
        const key = `${folder}/${name}`;

        if (searchParam && !name.toLowerCase().includes(searchParam) && !(row.original_name && String(row.original_name).toLowerCase().includes(searchParam))) {
          continue;
        }

        if (!filesMap.has(key)) {
          const numSize = Number(row.size) || 0;
          filesMap.set(key, {
            id: key,
            name,
            originalName: row.original_name || name,
            folder,
            url: `/uploads/${folder}/${name}`,
            size: numSize,
            sizeFormatted: numSize >= 1024 * 1024 
              ? `${(numSize / (1024 * 1024)).toFixed(2)} مگابایت` 
              : `${(numSize / 1024).toFixed(1)} کیلوبایت`,
            createdAt: row.created_at || new Date(),
            ext,
            isImage: true
          });
        }
      }
    } catch (e) {
      console.warn('Could not query uploaded_files in /images:', e);
    }

    const images = Array.from(filesMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const totalSize = images.reduce((acc, img) => acc + (img.size || 0), 0);
    const totalSizeFormatted = totalSize >= 1024 * 1024 * 1024
      ? `${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} گیگابایت`
      : totalSize >= 1024 * 1024
      ? `${(totalSize / (1024 * 1024)).toFixed(2)} مگابایت`
      : `${(totalSize / 1024).toFixed(1)} کیلوبایت`;

    // Folder counts
    const folderStats: Record<string, { count: number; size: number; sizeFormatted: string }> = {};
    for (const img of images) {
      if (!folderStats[img.folder]) {
        folderStats[img.folder] = { count: 0, size: 0, sizeFormatted: '0 کیلوبایت' };
      }
      folderStats[img.folder].count++;
      folderStats[img.folder].size += img.size || 0;
    }
    for (const f of Object.keys(folderStats)) {
      const s = folderStats[f].size;
      folderStats[f].sizeFormatted = s >= 1024 * 1024 
        ? `${(s / (1024 * 1024)).toFixed(2)} مگابایت` 
        : `${(s / 1024).toFixed(1)} کیلوبایت`;
    }

    res.json({
      success: true,
      count: images.length,
      totalSize,
      totalSizeFormatted,
      folderStats,
      data: images
    });
  } catch (error: any) {
    console.error('Get images error:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت لیست تصاویر' });
  }
});

// Batch delete endpoint for images / files
router.post('/delete-batch', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = req.body; // array of { folder: string, filename: string }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'هیچ فایلی برای حذف انتخاب نشده است' });
    }

    let deletedCount = 0;
    for (const item of items) {
      const folder = String(item.folder || '').replace(/[^a-z0-9_-]/g, '');
      const filename = String(item.filename || item.name || '').replace(/[^a-zA-Z0-9_\u0600-\u06FF.-]/g, '');
      if (!folder || !filename || folder.includes('..') || filename.includes('..')) continue;

      const filePath = path.join(UPLOADS_DIR, folder, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }

      try {
        await pool.query('DELETE FROM uploaded_files WHERE filename = $1 AND (folder = $2 OR folder IS NULL)', [filename, folder]);
      } catch {}
      deletedCount++;
    }

    res.json({
      success: true,
      count: deletedCount,
      message: `${deletedCount} تصویر با موفقیت از سرور و پایگاه‌داده حذف شدند`
    });
  } catch (error: any) {
    console.error('Batch delete error:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف دسته‌ای فایل‌ها' });
  }
});

// Delete file endpoint
router.delete('/:folder/:filename', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const folder = String(req.params.folder || '');
    const filename = String(req.params.filename || '');
    // Basic security check to prevent directory traversal
    if (folder.includes('..') || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ success: false, message: 'مسیر نامعتبر است' });
    }
    const safeFolder = folder.replace(/[^a-z0-9_-]/g, '');
    const filePath = path.join(UPLOADS_DIR, safeFolder, filename);

    let found = false;
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        found = true;
      } catch {}
    }

    // Delete from DB as well
    try {
      const dbDel = await pool.query(
        'DELETE FROM uploaded_files WHERE filename = $1 AND (folder = $2 OR folder IS NULL)', 
        [filename, safeFolder]
      );
      if (dbDel.rowCount && dbDel.rowCount > 0) {
        found = true;
      }
    } catch {}

    if (found) {
      res.json({ success: true, message: 'فایل با موفقیت حذف شد' });
    } else {
      res.status(404).json({ success: false, message: 'فایل یافت نشد' });
    }
  } catch (error: any) {
    console.error('Delete file error:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف فایل' });
  }
});

export default router;

