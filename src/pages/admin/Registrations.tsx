import { useState, useEffect } from 'react';
import { storage, Registration } from '../../lib/storage';
import { Download, Trash2 } from 'lucide-react';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  useEffect(() => {
    storage.syncRegistrationsWithDB().then(regs => {
      if (regs) {
        setRegistrations(regs);
        
        // Mark all as reviewed
        const newRegs = regs.filter(r => r.status === 'new');
        if (newRegs.length > 0) {
          newRegs.forEach(r => storage.updateRegistrationStatus(r.id, 'reviewed'));
          window.dispatchEvent(new Event('kowsar_registrations_changed'));
        }
      }
    });
  }, []);

  const translateDegree = (degree: string) => {
    switch (degree) {
      case 'diploma': return 'دیپلم';
      case 'associate': return 'کاردانی';
      case 'bachelor': return 'کارشناسی';
      default: return degree;
    }
  };

  const translateField = (field: string) => {
    const settings = storage.getSettings();
    const found = settings.studyFields?.find(f => f.value === field);
    return found ? found.name : field;
  };

  const executeDeleteRegistration = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await storage.deleteRegistration(id);
    setRegistrations(prev => prev.filter(r => r.id !== id));
  };

  const executeClearAll = async () => {
    setShowClearAllConfirm(false);
    for (const reg of registrations) {
      await storage.deleteRegistration(reg.id);
    }
    setRegistrations([]);
  };

  const exportCSV = () => {
    const headers = ['نام و نام خانوادگی', 'کد ملی', 'شماره موبایل', 'مدرک', 'رشته درخواستی', 'تاریخ ثبت‌نام'];
    const rows = registrations.map(reg => [
      reg.fullName,
      reg.nationalCode,
      reg.phone,
      translateDegree(reg.degree),
      translateField(reg.field),
      reg.date
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "registrations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">لیست پیش‌ثبت‌نام‌ها</h1>
          <p className="text-sm text-slate-500 mt-1">مشاهده و مدیریت درخواست‌های ثبت‌نام ورودی مرکز</p>
        </div>
        <div className="flex items-center gap-3">
          {registrations.length > 0 && (
            <button 
              type="button"
              onClick={() => setShowClearAllConfirm(true)}
              className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-4 py-3 rounded-xl transition-all border border-red-200/70 flex items-center gap-2 text-sm"
              title="پاکسازی تمام ثبت‌نام‌ها"
            >
              <Trash2 className="w-4 h-4" />
              حذف همه
            </button>
          )}
          <button 
            onClick={exportCSV}
            disabled={registrations.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)] flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            خروجی اکسل (CSV)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {registrations.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Download className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-black text-lg text-slate-700 mb-1">هیچ ثبت‌نامی یافت نشد</p>
            <p className="text-sm text-slate-400">تاکنون متقاضی جدیدی در بخش پیش‌ثبت‌نام آنلاین ثبت نشده است.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-bold text-sm">نام و نام خانوادگی</th>
                  <th className="px-6 py-4 font-bold text-sm">کد ملی</th>
                  <th className="px-6 py-4 font-bold text-sm">شماره موبایل</th>
                  <th className="px-6 py-4 font-bold text-sm">مدرک فعلی</th>
                  <th className="px-6 py-4 font-bold text-sm">رشته درخواستی</th>
                  <th className="px-6 py-4 font-bold text-sm">تاریخ</th>
                  <th className="px-6 py-4 font-bold text-sm text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{reg.fullName}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono" dir="ltr">{reg.nationalCode}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono" dir="ltr">{reg.phone}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                        {translateDegree(reg.degree)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                        {translateField(reg.field)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{reg.date}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(reg)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="حذف پیش‌ثبت‌نام"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Single Registration Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDeleteRegistration}
        title="حذف درخواست پیش‌ثبت‌نام"
        itemName={deleteTarget?.fullName}
        details={deleteTarget ? [
          { label: 'کد ملی', value: deleteTarget.nationalCode },
          { label: 'شماره تماس', value: deleteTarget.phone },
          { label: 'رشته درخواستی', value: translateField(deleteTarget.field) }
        ] : undefined}
      />

      {/* Clear All Registrations Modal */}
      <DeleteConfirmModal
        isOpen={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        onConfirm={executeClearAll}
        title="حذف کامل تمامی درخواست‌های پیش‌ثبت‌نام"
        itemCount={registrations.length}
        confirmText="بله، همه حذف شوند"
      />
    </div>
  );
}
