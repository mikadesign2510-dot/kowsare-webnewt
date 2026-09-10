import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage, FinancialReceipt } from '../../lib/storage';
import { 
  Receipt, 
  Check, 
  X, 
  Search, 
  Image as ImageIcon, 
  ExternalLink, 
  FileText, 
  Coins, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Eye,
  Settings,
  Phone,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import { 
  toPersianDigits, 
  toEnglishDigits, 
  formatPersianDigitSeparators, 
  formatRialToWords 
} from '../../lib/persianNumberHelper';

export default function AdminFinancialManager() {
  const [receipts, setReceipts] = useState<FinancialReceipt[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<FinancialReceipt | null>(null);
  const [modalAdminNote, setModalAdminNote] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = () => {
    setReceipts(storage.getReceipts());
  };

  const handleOpenReceipt = (receipt: FinancialReceipt) => {
    setSelectedReceipt(receipt);
    setModalAdminNote((receipt as any).adminMessage || '');
  };

  const handleUpdateStatus = (id: string, status: FinancialReceipt['status'], customNote?: string) => {
    const target = receipts.find(r => r.id === id);
    const noteToSave = customNote !== undefined ? customNote : modalAdminNote;
    storage.updateReceiptStatus(id, status, noteToSave);
    
    // Add audit log
    storage.addSecurityLog({
      eventType: 'data_modified',
      severity: 'medium',
      category: 'data',
      message: `تغییر وضعیت رسید مالی (${status === 'approved' ? 'تایید شد' : status === 'rejected' ? 'رد شد' : 'در انتظار'})`,
      details: `دانشجو: ${target?.userName || '-'} (مبلغ: ${formatPersianDigitSeparators(target?.amount)} ریال)${noteToSave ? ` - پیام: ${noteToSave}` : ''}`
    });

    loadReceipts();
    if (selectedReceipt?.id === id) {
      setSelectedReceipt(prev => prev ? { ...prev, status, adminMessage: noteToSave } as any : null);
    }
  };

  const filteredReceipts = receipts.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    if (!matchesFilter) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const cleanAmount = toEnglishDigits(r.amount);
    return (
      (r.userName && r.userName.toLowerCase().includes(term)) ||
      (r.studentId && r.studentId.includes(term)) ||
      (r.trackingCode && r.trackingCode.includes(term)) ||
      (r.description && r.description.toLowerCase().includes(term)) ||
      cleanAmount.includes(toEnglishDigits(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Coins className="w-7 h-7 text-emerald-600" />
            امور مالی و بررسی فیش‌های واریزی
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            بررسی، استعلام و تعیین وضعیت مبالغ واریزی دانشجویان با تفکیک سرفصل‌ها و رسیدهای مستقیم
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/settings?tab=quickReceipt"
            className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Settings className="w-4 h-4" />
            <span>تنظیمات حساب‌ها و سامانه فیش</span>
          </Link>
          <Link
            to="/submit-receipt"
            target="_blank"
            className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>صفحه ارسال فیش</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filter === 'pending' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            در انتظار بررسی ({toPersianDigits(receipts.filter(r => r.status === 'pending').length)})
          </button>
          <button 
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filter === 'approved' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            تایید شده ({toPersianDigits(receipts.filter(r => r.status === 'approved').length)})
          </button>
          <button 
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filter === 'rejected' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            رد شده ({toPersianDigits(receipts.filter(r => r.status === 'rejected').length)})
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${filter === 'all' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            همه ({toPersianDigits(receipts.length)})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input 
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="جستجو در رسیدها بر اساس نام دانشجو، شماره دانشجویی، کد پیگیری فیش یا مبلغ..."
          className="w-full bg-transparent text-sm focus:outline-none text-slate-800 placeholder-slate-400"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')} 
            className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2"
          >
            پاکسازی
          </button>
        )}
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredReceipts.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <Receipt className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-bold text-base text-slate-600">رسیدی مطابق فیلتر انتخاب شده یافت نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-black">
                <tr>
                  <th className="p-4">مشخصات دانشجو و سرفصل</th>
                  <th className="p-4">کد ملی / شناسه</th>
                  <th className="p-4">مبلغ واریزی (ریال)</th>
                  <th className="p-4">معادل به تومان</th>
                  <th className="p-4">کد پیگیری فیش</th>
                  <th className="p-4">تاریخ پرداخت</th>
                  <th className="p-4 text-center">تصویر</th>
                  <th className="p-4 text-center">وضعیت</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredReceipts.map(receipt => {
                  const clean = toEnglishDigits(receipt.amount);
                  const rialFormatted = formatPersianDigitSeparators(clean, '،');
                  const tomanBig = clean ? BigInt(clean) / 10n : 0n;
                  const tomanFormatted = formatPersianDigitSeparators(tomanBig.toString(), '،');

                  return (
                    <tr key={receipt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800 text-sm">{receipt.userName}</span>
                            {receipt.submissionType === 'quick' && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/60">
                                ارسال مستقیم
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {receipt.category && (
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                {receipt.category}
                              </span>
                            )}
                            {receipt.studentMobile && (
                              <span className="text-slate-400 font-mono text-[11px]" dir="ltr">
                                {toPersianDigits(receipt.studentMobile)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-700 font-bold text-xs font-mono">
                        {toPersianDigits(receipt.userNationalId || receipt.studentId) || '-'}
                      </td>
                      
                      <td className="p-4 font-black text-emerald-700 text-sm">
                        {rialFormatted} <span className="text-xs text-slate-400 font-normal">ریال</span>
                      </td>

                      <td className="p-4 text-slate-700 font-bold text-xs">
                        {tomanFormatted} تومان
                      </td>

                      <td className="p-4 font-bold text-slate-700 text-xs font-mono select-all" dir="ltr">{receipt.trackingCode}</td>
                      <td className="p-4 text-slate-500 text-xs font-medium">{toPersianDigits(receipt.date)}</td>
                      
                      <td className="p-4 text-center">
                        {receipt.imageUrl ? (
                          <button
                            onClick={() => handleOpenReceipt(receipt)}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors"
                            title="مشاهده فیش"
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span>فیش</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">بدون عکس</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {receipt.status === 'pending' ? (
                          <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-xl">
                            در انتظار
                          </span>
                        ) : receipt.status === 'approved' ? (
                          <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl">
                            تایید شده
                          </span>
                        ) : (
                          <span className="text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl">
                            رد شده
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => handleUpdateStatus(receipt.id, 'approved')}
                            className={`p-2 rounded-xl transition-all ${receipt.status === 'approved' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                            title="تایید رسید مالی"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(receipt.id, 'rejected')}
                            className={`p-2 rounded-xl transition-all ${receipt.status === 'rejected' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                            title="رد رسید مالی"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenReceipt(receipt)}
                            className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-2 rounded-xl transition-colors"
                            title="مشاهده جزئیات کامل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details & Image Preview Modal */}
      {selectedReceipt && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedReceipt(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-800 text-base">جزئیات فیش واریزی</h3>
                    {selectedReceipt.submissionType === 'quick' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        سامانه سریع
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5" dir="ltr">کد رهگیری: <span className="font-bold text-slate-700 select-all">{selectedReceipt.trackingCode}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calculations Box */}
            {(() => {
              const calc = formatRialToWords(selectedReceipt.amount);
              return (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-sm font-black text-emerald-950">
                    <span>مبلغ به ریال:</span>
                    <span className="text-base text-emerald-700 font-black">{calc.rialFormatted} ریال</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-slate-700 pt-2 border-t border-emerald-200/50">
                    <span>معادل به تومان:</span>
                    <span className="text-emerald-900 font-bold">{calc.tomanFormatted} تومان</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200/50 space-y-1">
                    <p className="text-emerald-900 font-bold">به حروف: <span className="font-black">{calc.tomanWords}</span></p>
                  </div>
                </div>
              );
            })()}

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">نام واریز کننده:</span>
                <span className="font-black text-slate-800">{selectedReceipt.userName}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">کد ملی / دانشجویی:</span>
                <span className="font-black text-slate-800 font-mono">{toPersianDigits(selectedReceipt.userNationalId || selectedReceipt.studentId) || '-'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">شماره همراه:</span>
                <span className="font-black text-slate-800 font-mono" dir="ltr">{toPersianDigits(selectedReceipt.studentMobile) || '-'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">بابت / سرفصل:</span>
                <span className="font-black text-blue-700">{selectedReceipt.category || 'شهریه'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">شماره ارجاع / پیگیری بانکی:</span>
                <span className="font-black text-slate-800 font-mono">{toPersianDigits(selectedReceipt.bankRefNumber) || '-'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">تاریخ پرداخت:</span>
                <span className="font-black text-slate-800">{toPersianDigits(selectedReceipt.date)}</span>
              </div>
            </div>

            {/* Description */}
            {selectedReceipt.description && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-400 block mb-1 font-bold">توضیحات واریز کننده:</span>
                <p className="text-slate-700 leading-relaxed">{selectedReceipt.description}</p>
              </div>
            )}

            {/* Admin Message / Feedback Note for Student */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 space-y-2 text-xs">
              <label className="font-bold text-blue-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>پیام و توضیحات امور مالی برای دانشجو (در صفحه پیگیری نمایش داده می‌شود):</span>
              </label>
              <textarea
                rows={2}
                value={modalAdminNote}
                onChange={e => setModalAdminNote(e.target.value)}
                placeholder="مثال: فیش تایید گردید و در حساب شهریه اعمال شد. / شماره ارجاع ناخواناست، مجدداً بارگذاری کنید."
                className="w-full bg-white border border-blue-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedReceipt.id, selectedReceipt.status, modalAdminNote)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
                >
                  ذخیره یادداشت
                </button>
              </div>
            </div>

            {/* Image Preview */}
            {selectedReceipt.imageUrl && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">تصویر رسید:</span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center max-h-72">
                  <img 
                    src={selectedReceipt.imageUrl} 
                    alt="تصویر فیش" 
                    className="max-h-72 w-auto object-contain"
                  />
                </div>
                <div className="text-left">
                  <button 
                    onClick={() => setFullScreenImage(selectedReceipt.imageUrl)}
                    className="text-xs text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    مشاهده تصویر فیش در اندازه اصلی
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons inside modal */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleUpdateStatus(selectedReceipt.id, 'approved', modalAdminNote)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                تایید رسید با پیام
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedReceipt.id, 'rejected', modalAdminNote)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
                رد رسید با پیام
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center">
            <button 
              onClick={() => setFullScreenImage(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors"
              title="بستن"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={fullScreenImage} 
              alt="تصویر فیش در اندازه اصلی" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
