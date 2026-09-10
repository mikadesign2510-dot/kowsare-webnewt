import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Share2, ExternalLink, Code } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VideoShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  dedicatedPath: string; // e.g. /gallery/video/:albumId/:videoId
  albumTitle?: string;
}

export default function VideoShareModal({
  isOpen,
  onClose,
  videoTitle,
  dedicatedPath,
  albumTitle,
}: VideoShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const fullShareUrl = `${origin}${dedicatedPath}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const embedCode = `<iframe src="${fullShareUrl}" width="100%" height="450" frameborder="0" allowfullscreen title="${videoTitle}"></iframe>`;

  const handleCopyEmbed = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2500);
    }
  };

  const getSocialShare = (platform: 'eitaa' | 'bale' | 'telegram' | 'whatsapp') => {
    const url = encodeURIComponent(fullShareUrl);
    const text = encodeURIComponent(
      `${videoTitle}${albumTitle ? ` - ${albumTitle}` : ''}\nمرکز آموزش علمی کاربردی کوثر کاکی`
    );

    switch (platform) {
      case 'eitaa':
        return `https://eitaa.com/share/url?url=${url}&text=${text}`;
      case 'bale':
        return `https://ble.ir/share/url?url=${url}&text=${text}`;
      case 'telegram':
        return `https://t.me/share/url?url=${url}&text=${text}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${text}%20${url}`;
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: videoTitle,
          text: albumTitle || 'مشاهده ویدئو در نگارخانه مرکز آموزش علمی کاربردی کوثر کاکی',
          url: fullShareUrl,
        });
      } catch {
        // Ignored if cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-white z-10 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">اشتراک‌گذاری ویدئو</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video Title Summary */}
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <p className="text-xs text-rose-300 font-bold mb-0.5">ویدئو انتخابی:</p>
            <p className="text-sm text-white font-bold line-clamp-1">{videoTitle}</p>
          </div>

          {/* Copy Link Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              لینک صفحه اختصاصی ویدئو:
            </label>
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-700">
              <input
                type="text"
                readOnly
                value={fullShareUrl}
                className="flex-1 bg-transparent text-xs text-slate-300 font-mono focus:outline-none px-2 text-left"
                dir="ltr"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی لینک</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Messengers Grid */}
          <div className="space-y-2">
            <span className="block text-xs font-bold text-slate-300">ارسال به پیام‌رسان‌ها:</span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={getSocialShare('eitaa')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#e06a1c]/15 hover:bg-[#e06a1c] text-[#fca369] hover:text-white border border-[#e06a1c]/30 font-bold text-xs transition-all"
              >
                <span>ایتا</span>
              </a>

              <a
                href={getSocialShare('bale')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#2ea879]/15 hover:bg-[#2ea879] text-[#55e0ac] hover:text-white border border-[#2ea879]/30 font-bold text-xs transition-all"
              >
                <span>بله</span>
              </a>

              <a
                href={getSocialShare('telegram')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#229ed9]/15 hover:bg-[#229ed9] text-[#71ccf8] hover:text-white border border-[#229ed9]/30 font-bold text-xs transition-all"
              >
                <span>تلگرام</span>
              </a>

              <a
                href={getSocialShare('whatsapp')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#25d366]/15 hover:bg-[#25d366] text-[#69f79b] hover:text-white border border-[#25d366]/30 font-bold text-xs transition-all"
              >
                <span>واتساپ</span>
              </a>
            </div>
          </div>

          {/* Action Row: Open Dedicated Page & Native Share */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <Link
              to={dedicatedPath}
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/30"
            >
              <ExternalLink className="w-4 h-4" />
              <span>باز کردن در صفحه اختصاصی ویدئو</span>
            </Link>

            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>اشتراک در سایر برنامه‌های گوشی</span>
            </button>
          </div>

          {/* Embed Code Dropdown */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowEmbed(!showEmbed)}
              className="w-full text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-blue-400" />
                <span>دریافت کد آی‌فریم (Embed)</span>
              </span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
                {showEmbed ? 'بستن' : 'کد امبد'}
              </span>
            </button>

            {showEmbed && (
              <div className="mt-2 space-y-2">
                <textarea
                  readOnly
                  rows={2}
                  value={embedCode}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-[10px] font-mono text-slate-400 text-left focus:outline-none resize-none"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleCopyEmbed}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5"
                >
                  {copiedEmbed ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>کپی کد امبد</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
