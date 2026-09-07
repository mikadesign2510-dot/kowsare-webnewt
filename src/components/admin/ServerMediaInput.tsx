import React, { useState, useRef } from 'react';
import { 
  HardDrive, 
  Upload, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  X, 
  Crop, 
  ExternalLink,
  CheckCircle2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import ServerImagePickerModal from './ServerImagePickerModal';
import ImageCropperModal from './ImageCropperModal';
import { uploadFileToServer, MAX_IMAGE_SIZE_MB } from '../../lib/uploadHelper';

interface ServerMediaInputProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  folder?: string;
  enableCrop?: boolean;
  aspectRatio?: number;
  placeholder?: string;
  helpText?: string;
  className?: string;
}

export default function ServerMediaInput({
  value,
  onChange,
  label = 'تصویر',
  required = false,
  folder = 'general',
  enableCrop = true,
  aspectRatio,
  placeholder = 'https://... یا /uploads/...',
  helpText,
  className = ''
}: ServerMediaInputProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [tempImageForCrop, setTempImageForCrop] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isServerStored = value?.startsWith('/uploads/') || value?.startsWith('http') && value?.includes('/uploads/');

  // Handle direct file upload to server
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (enableCrop) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImageForCrop(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await uploadFileToServer(file, folder);
      if (res.success && res.url) {
        onChange(res.url);
      } else {
        setUploadError(res.message || 'خطا در بارگذاری تصویر در سرور');
      }
    } catch (err: any) {
      setUploadError(err.message || 'خطا در آپلود');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle crop completion & upload to server
  const handleCropComplete = async (croppedFile: File, previewUrl: string, uploadResult?: any) => {
    setIsCropperOpen(false);
    if (uploadResult?.url) {
      onChange(uploadResult.url);
    } else if (previewUrl) {
      onChange(previewUrl);
    }
  };

  return (
    <div className={`space-y-2 ${className}`} dir="rtl">
      {/* Label and Status */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
          {isServerStored && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <HardDrive className="w-3 h-3" />
              ذخیره در سرور پارس‌پک
            </span>
          )}
        </label>

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            حذف تصویر
          </button>
        )}
      </div>

      {/* Main Input Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* URL Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-left font-mono transition-all"
            dir="ltr"
          />
          <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Pick from Server Storage */}
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 hover:shadow"
            title="انتخاب تصویر از حافظه سرور یا آپلود جدید"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>مخزن سرور</span>
          </button>

          {/* Direct Upload File */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 hover:shadow-blue-500/20"
            title="آپلود مستقیم از کامپیوتر یا گوشی در سرور"
          >
            {isUploading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>آپلود در سرور</span>
          </button>

          {/* Crop Button if image exists */}
          {enableCrop && value && (
            <button
              type="button"
              onClick={() => {
                setTempImageForCrop(value);
                setIsCropperOpen(true);
              }}
              className="p-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              title="برش و کادربندی تصویر"
            >
              <Crop className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Error or Help text */}
      {uploadError && (
        <p className="text-[11px] text-red-600 font-medium">{uploadError}</p>
      )}
      {helpText && !uploadError && (
        <p className="text-[11px] text-slate-400">{helpText}</p>
      )}

      {/* Preview Box */}
      {value && (
        <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2 group max-h-48">
          <img
            src={value}
            alt="پیش‌نمایش"
            className="max-h-44 object-contain rounded-lg shadow-sm group-hover:scale-[1.02] transition-transform duration-200"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors"
              title="مشاهده تصویر در اندازه اصلی"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Server Image Picker Modal */}
      <ServerImagePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(url) => onChange(url)}
        currentValue={value}
        defaultFolder={folder}
      />

      {/* Image Cropper Modal */}
      {isCropperOpen && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          imageSrc={tempImageForCrop}
          onClose={() => setIsCropperOpen(false)}
          onCropComplete={handleCropComplete}
          initialAspectRatio={aspectRatio}
          targetFolder={folder}
        />
      )}
    </div>
  );
}
