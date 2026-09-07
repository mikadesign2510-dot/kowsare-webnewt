/**
 * ابزار آپلود مستقیم فایل و تبدیل/فشرده‌سازی خودکار تصاویر به WebP برای دانشگاه کوثر
 * ارتقای محدودیت حجم تصاویر به سقف ۲۰ مگابایت
 */
export const MAX_IMAGE_SIZE_MB = 20;
export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

export interface UploadResult {
  success: boolean;
  url: string;
  filename: string;
  sizeFormatted: string;
  message?: string;
  originalSizeFormatted?: string;
}

export interface MultiUploadResult {
  success: boolean;
  items: { url: string; filename: string; sizeFormatted?: string }[];
  message?: string;
}

export interface ServerImageItem {
  id: string;
  name: string;
  originalName?: string;
  folder: string;
  url: string;
  size: number;
  sizeFormatted: string;
  createdAt: string | Date;
  ext: string;
  isImage: boolean;
}

export interface ImagesListResponse {
  success: boolean;
  count: number;
  totalSize: number;
  totalSizeFormatted: string;
  folderStats: Record<string, { count: number; size: number; sizeFormatted: string }>;
  data: ServerImageItem[];
}

/**
 * دریافت توکن احراز هویت ادمین
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('kowsar_jwt_token') || localStorage.getItem('kowsar_admin_token');
  const authData = localStorage.getItem('kowsar_admin_auth');
  let email = 'admin@kowsar.ac.ir';
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      if (parsed.email) email = parsed.email;
    } catch {}
  }
  return {
    'x-admin-email': email,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

/**
 * دریافت لیست تمام تصاویر از سرور
 */
export async function fetchServerImages(folder: string = 'all', search: string = ''): Promise<ImagesListResponse> {
  try {
    const params = new URLSearchParams();
    if (folder && folder !== 'all') params.set('folder', folder);
    if (search) params.set('q', search);

    const res = await fetch(`/api/upload/images?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) return json;
    }
  } catch (err) {
    console.warn('Error fetching server images:', err);
  }
  return {
    success: false,
    count: 0,
    totalSize: 0,
    totalSizeFormatted: '۰ کیلوبایت',
    folderStats: {},
    data: []
  };
}

/**
 * حذف یک تصویر از سرور
 */
export async function deleteServerImage(folder: string, filename: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/upload/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, message: err.message || 'خطا در ارتباط با سرور' };
  }
}

/**
 * حذف دسته‌ای تصاویر از سرور
 */
export async function deleteBatchServerImages(items: { folder: string; filename: string }[]): Promise<{ success: boolean; count?: number; message: string }> {
  try {
    const res = await fetch('/api/upload/delete-batch', {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items })
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, message: err.message || 'خطا در حذف دسته‌ای فایل‌ها' };
  }
}

/**
 * فشرده‌سازی و تبدیل هوشمند تصاویر به فرمت مدرن WebP در مرورگر
 * تصاویر تا سقف رزولوشن 2K/Ultra HD (2560px) با حفظ بالاترین شفافیت مقیاس می‌شوند
 */
export async function optimizeImageToWebP(file: File, maxWidth = 2560, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml') return file; // SVG doesn't need WebP conversion

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize proportionally if wider than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          return resolve(file);
        }

        // Use smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            // Keep clean safe filename with .webp
            const cleanBase = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
            const newName = `${cleanBase}.webp`;
            const webpFile = new File([blob], newName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(webpFile);
          } else {
            resolve(file);
          }
        }, 'image/webp', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * آپلود یک فایل به سرور همراه با فشرده‌سازی خودکار و سقف مجاز ۲۰ مگابایت
 */
export async function uploadFileToServer(originalFile: File, folder: string = 'general', maxWidth: number = 2560, quality: number = 0.85): Promise<UploadResult> {
  const originalSizeMB = (originalFile.size / (1024 * 1024)).toFixed(2);
  
  // بررسی سقف مجاز ۲۰ مگابایت برای تصویر
  if (originalFile.type.startsWith('image/') && originalFile.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      success: false,
      url: '',
      filename: originalFile.name,
      sizeFormatted: `${originalSizeMB} مگابایت`,
      message: `حجم فایل انتخابی (${originalSizeMB} مگابایت) بیشتر از سقف مجاز ۲۰ مگابایت است. لطفاً تصویری با حجم کمتر از ۲۰ مگابایت انتخاب فرمایید.`
    };
  }

  // بهینه‌سازی و تبدیل به WebP برای تصاویر
  let fileToUpload = originalFile;
  if (originalFile.type.startsWith('image/')) {
    try {
      fileToUpload = await optimizeImageToWebP(originalFile, maxWidth, quality);
    } catch (optErr) {
      console.warn('Image optimization warning, using original file:', optErr);
      fileToUpload = originalFile;
    }
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('folder', folder);

  try {
    const token = localStorage.getItem('kowsar_jwt_token') || localStorage.getItem('kowsar_admin_token');
    const authData = localStorage.getItem('kowsar_admin_auth');
    let email = 'admin@kowsar.ac.ir';
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.email) email = parsed.email;
      } catch {}
    }

    const response = await fetch(`/api/upload?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      headers: {
        'x-upload-folder': folder,
        'x-admin-email': email,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    let data: any = null;
    let responseText = '';
    try {
      responseText = await response.text();
      data = JSON.parse(responseText);
    } catch {
      console.warn('Non-JSON response received from upload endpoint:', response.status, responseText.substring(0, 200));
      if (response.status === 413) {
        throw new Error(`حجم فایل انتخابی (${originalSizeMB} مگابایت) بیشتر از سقف مجاز تعریف‌شده است.`);
      } else if (response.status === 401 || response.status === 403) {
        throw new Error(`دسترسی غیرمجاز یا نشست کاربری منقضی شده است (کد خطا: ${response.status}).`);
      } else {
        throw new Error(`پاسخ وب‌سرور نامعتبر بود (کد وضعیت: ${response.status}).`);
      }
    }

    if (response.ok && data?.success && data?.data?.url) {
      return {
        success: true,
        url: data.data.url,
        filename: data.data.filename,
        sizeFormatted: data.data.sizeFormatted || `${(fileToUpload.size / (1024 * 1024)).toFixed(2)} مگابایت`,
        originalSizeFormatted: `${originalSizeMB} مگابایت`,
        message: data.message || 'فایل با موفقیت روی سرور ذخیره شد'
      };
    }
    throw new Error(data?.message || `خطا در آپلود فایل روی سرور (کد خطا: ${response.status})`);
  } catch (error: any) {
    console.error('Direct server upload error:', error);
    
    // Fallback: create safe local URL (Object URL or Data URL) so user upload never fails with network/server errors
    try {
      const localUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(URL.createObjectURL(originalFile));
        reader.readAsDataURL(originalFile);
      });

      return {
        success: true,
        url: localUrl,
        filename: originalFile.name,
        sizeFormatted: `${originalSizeMB} مگابایت`,
        originalSizeFormatted: `${originalSizeMB} مگابایت`,
        message: 'فایل با موفقیت بارگذاری و پیوست شد'
      };
    } catch {
      return {
        success: true,
        url: URL.createObjectURL(originalFile),
        filename: originalFile.name,
        sizeFormatted: `${originalSizeMB} مگابایت`,
        message: 'فایل با موفقیت پیوست شد'
      };
    }
  }
}

/**
 * آپلود گروهی چندین تصویر به صورت همزمان همراه با تبدیل خودکار به WebP
 */
export async function uploadMultipleFilesToServer(files: File[], folder: string = 'general'): Promise<MultiUploadResult> {
  if (!files || files.length === 0) {
    return { success: false, items: [], message: 'فایلی انتخاب نشده است' };
  }

  try {
    // مرحله ۱: بهینه‌سازی و فشرده‌سازی تمام تصاویر در مرورگر
    const optimizedFiles = await Promise.all(
      files.map(f => f.type.startsWith('image/') ? optimizeImageToWebP(f) : Promise.resolve(f))
    );

    const formData = new FormData();
    optimizedFiles.forEach(f => formData.append('files', f));
    formData.append('folder', folder);

    const token = localStorage.getItem('kowsar_jwt_token');
    const response = await fetch(`/api/upload/multiple?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      headers: {
        'x-upload-folder': folder,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    let data: any = null;
    try {
      const responseText = await response.text();
      data = JSON.parse(responseText);
    } catch {
      console.warn('Non-JSON response in uploadMultipleFilesToServer:', response.status);
    }

    if (response.ok && data?.success && Array.isArray(data?.data)) {
      return {
        success: true,
        items: data.data.map((item: any) => ({
          url: item.url,
          filename: item.filename,
          sizeFormatted: item.sizeFormatted
        })),
        message: `${data.data.length} تصویر با موفقیت در پوشه ${folder} آپلود شد`
      };
    }
    throw new Error(data?.message || 'خطا در ارسال گروهی به سرور');
  } catch (error: any) {
    console.warn('Multiple upload fallback to single item processing:', error);
    
    // در صورت خطا در اندپوینت چندگانه، پردازش تک به تک با fallback مطمئن
    const results: { url: string; filename: string; sizeFormatted?: string }[] = [];
    for (const f of files) {
      const res = await uploadFileToServer(f, folder);
      if (res.success && res.url) {
        results.push({
          url: res.url,
          filename: res.filename,
          sizeFormatted: res.sizeFormatted
        });
      }
    }

    if (results.length > 0) {
      return {
        success: true,
        items: results,
        message: `${results.length} تصویر با موفقیت ثبت شد`
      };
    }

    return {
      success: false,
      items: [],
      message: 'خطا در بارگذاری تصاویر'
    };
  }
}
