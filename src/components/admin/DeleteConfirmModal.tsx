import React from 'react';
import { AlertTriangle, Trash2, Loader2, X, AlertCircle } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  message?: React.ReactNode;
  details?: Array<{ label: string; value: React.ReactNode }> | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
  itemCount?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأیید حذف',
  itemName,
  message,
  details,
  confirmText = 'بله، حذف شود',
  cancelText = 'انصراف',
  isLoading = false,
  variant = 'danger',
  itemCount,
  icon: CustomIcon,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600 ring-8 ring-amber-50',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 focus:ring-amber-500',
          defaultIcon: AlertCircle,
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 text-blue-600 ring-8 ring-blue-50',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 focus:ring-blue-500',
          defaultIcon: AlertCircle,
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-red-100 text-red-600 ring-8 ring-red-50',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 focus:ring-red-500',
          defaultIcon: AlertTriangle,
        };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = CustomIcon || styles.defaultIcon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div 
        className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 text-right"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="بستن"
          className="absolute top-5 left-5 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 ${styles.iconBg}`}>
            <IconComponent className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 id="modal-headline" className="text-lg font-black text-slate-800">
              {title}
            </h3>
            
            {message ? (
              <div className="text-sm text-slate-500 leading-relaxed font-medium">
                {message}
              </div>
            ) : itemCount !== undefined ? (
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                آیا از حذف کامل <strong className="text-red-600 font-black">{itemCount}</strong> مورد انتخاب شده اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
              </p>
            ) : (
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                آیا از حذف{' '}
                {itemName ? (
                  <strong className="text-slate-800 font-bold block mt-1 line-clamp-2 px-2 py-1 bg-slate-50 rounded-xl border border-slate-100">
                    «{itemName}»
                  </strong>
                ) : (
                  'این آیتم'
                )}{' '}
                اطمینان کامل دارید؟ این عملیات غیرقابل بازگشت است.
              </p>
            )}
          </div>
        </div>

        {/* Additional Details (Optional) */}
        {details && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 text-xs">
            {Array.isArray(details) ? (
              details.map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-slate-600">
                  <span className="text-slate-400">{d.label}:</span>
                  <span className="font-bold text-slate-800 truncate">{d.value}</span>
                </div>
              ))
            ) : (
              details
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 font-bold text-sm transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${styles.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال حذف...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
