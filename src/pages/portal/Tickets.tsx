import React, { useState, useEffect } from 'react';
import { storage, PortalUser, Ticket, PortalSettings, defaultPortalSettings } from '../../lib/storage';
import { MessageSquare, Plus, ArrowLeft, Send, Clock, Info, CheckCircle2 } from 'lucide-react';

export default function PortalTickets() {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'view'>('list');
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [portalSettings, setPortalSettings] = useState<PortalSettings>(storage.getPortalSettings());
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // form state
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState<string>('education');
  const [firstMessage, setFirstMessage] = useState('');

  useEffect(() => {
    const authData = localStorage.getItem('kowsar_portal_auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      setUser(parsed);
      loadTickets(parsed.id);
    }
    const handleSettingsUpdate = (e: any) => {
      setPortalSettings(e.detail || storage.getPortalSettings());
    };
    window.addEventListener('kowsar_portal_settings_changed', handleSettingsUpdate);
    return () => {
      window.removeEventListener('kowsar_portal_settings_changed', handleSettingsUpdate);
    };
  }, []);

  const loadTickets = (userId: string) => {
    setTickets(storage.getTickets().filter(t => t.userId === userId));
  };

  const getDepartmentName = (deptId: string) => {
    const found = portalSettings.departments?.find(d => d.id === deptId);
    if (found) return found.name;
    const defaults: Record<string, string> = {
      education: 'امور آموزشی',
      financial: 'امور مالی و شهریه',
      cultural: 'امور فرهنگی و دانشجویی',
      it: 'فناوری اطلاعات و سامانه'
    };
    return defaults[deptId] || deptId;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    storage.addTicket({
      userId: user.id,
      userName: user.name,
      subject,
      department: department as any
    }, firstMessage, user.name);

    loadTickets(user.id);
    setViewMode('list');
    setSubject('');
    setFirstMessage('');
    setSubmitSuccess(portalSettings.ticketSuccessMessage || 'درخواست شما با موفقیت ثبت شد و در صف بررسی کارشناسان قرار گرفت.');
    setTimeout(() => setSubmitSuccess(null), 6000);
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeTicket || !newMessage.trim()) return;

    storage.addTicketMessage(activeTicket.id, {
      senderId: user.id,
      senderName: user.name,
      isAdmin: false,
      text: newMessage
    });

    const updated = storage.getTickets().find(t => t.id === activeTicket.id) || null;
    setActiveTicket(updated);
    loadTickets(user.id);
    setNewMessage('');
  };

  if (!user) return null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-black text-slate-800">درخواست‌ها و تیکت‌ها</h1>
        {viewMode === 'list' ? (
          <button 
            onClick={() => setViewMode('create')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            ثبت درخواست جدید
          </button>
        ) : (
          <button 
            onClick={() => setViewMode('list')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
            بازگشت به لیست
          </button>
        )}
      </div>

      {/* Success Notification */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* Ticket Guidelines Banner from Portal Customization */}
      {(portalSettings.ticketGuidelines || portalSettings.ticketWorkingHours) && (
        <div className="mb-6 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>{portalSettings.ticketGuidelinesTitle || 'راهنما و مقررات ثبت تیکت'}</span>
            </div>
            {portalSettings.ticketWorkingHours && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl">
                <Clock className="w-3.5 h-3.5" />
                ساعات پاسخگویی: {portalSettings.ticketWorkingHours}
              </span>
            )}
          </div>
          {portalSettings.ticketGuidelines && (
            <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line">
              {portalSettings.ticketGuidelines}
            </p>
          )}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="font-bold">تا کنون درخواستی ثبت نکرده‌اید.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                  <tr>
                    <th className="p-4 font-bold text-sm">موضوع</th>
                    <th className="p-4 font-bold text-sm">بخش مربوطه</th>
                    <th className="p-4 font-bold text-sm">وضعیت</th>
                    <th className="p-4 font-bold text-sm">تاریخ آخرین بروزرسانی</th>
                    <th className="p-4 font-bold text-sm">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-slate-50">
                      <td className="p-4 text-sm font-bold text-slate-800">{ticket.subject}</td>
                      <td className="p-4 text-sm text-slate-600 font-medium">
                        {getDepartmentName(ticket.department)}
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          ticket.status === 'open' ? 'bg-amber-100 text-amber-700' :
                          ticket.status === 'answered' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {ticket.status === 'open' ? 'در انتظار پاسخ' :
                           ticket.status === 'answered' ? 'پاسخ داده شده' : 'بسته شده'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500" dir="ltr">
                        {new Date(ticket.updatedAt).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => { setActiveTicket(ticket); setViewMode('view'); }}
                          className="text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100"
                        >
                          مشاهده و پیگیری
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {viewMode === 'create' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-2xl">
          <h2 className="text-lg font-bold text-slate-800 mb-6">ثبت درخواست جدید</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-slate-700 font-bold mb-2 text-sm">موضوع درخواست</label>
              <input 
                type="text" 
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-2 text-sm">بخش مربوطه</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              >
                {portalSettings.departments && portalSettings.departments.filter(d => d.isActive).length > 0 ? (
                  portalSettings.departments.filter(d => d.isActive).map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} {dept.description ? `— ${dept.description}` : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="education">امور آموزشی</option>
                    <option value="financial">امور مالی و شهریه</option>
                    <option value="cultural">امور فرهنگی و دانشجویی</option>
                    <option value="it">فناوری اطلاعات و سامانه</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-2 text-sm">متن درخواست</label>
              <textarea 
                required
                rows={4}
                value={firstMessage}
                onChange={e => setFirstMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              ></textarea>
            </div>
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              ارسال درخواست
            </button>
          </form>
        </div>
      )}

      {viewMode === 'view' && activeTicket && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[600px] max-w-4xl">
          <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-3xl flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800">{activeTicket.subject}</h2>
              <p className="text-xs text-slate-500">کد رهگیری: {activeTicket.id}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              activeTicket.status === 'open' ? 'bg-amber-100 text-amber-700' :
              activeTicket.status === 'answered' ? 'bg-emerald-100 text-emerald-700' :
              'bg-slate-200 text-slate-700'
            }`}>
              {activeTicket.status === 'open' ? 'در انتظار پاسخ' :
               activeTicket.status === 'answered' ? 'پاسخ داده شده' : 'بسته شده'}
            </span>
          </div>

          <div className="flex-grow p-6 overflow-y-auto space-y-6">
            {activeTicket.messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.isAdmin ? 'bg-slate-100 text-slate-800 rounded-tr-none' : 'bg-indigo-100 text-indigo-900 rounded-tl-none'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-xs">{msg.senderName}</span>
                    <span className="text-[10px] opacity-70" dir="ltr">{new Date(msg.date).toLocaleString('fa-IR')}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {activeTicket.status !== 'closed' ? (
            <div className="p-4 border-t border-slate-100 bg-white rounded-b-3xl">
              <form onSubmit={handleReply} className="flex gap-2">
                <textarea
                  required
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="پاسخ خود را بنویسید..."
                  className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-12"
                />
                <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors shrink-0">
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </div>
          ) : (
            <div className="p-4 border-t border-slate-100 text-center text-slate-500 font-bold bg-slate-50 rounded-b-3xl">
              این درخواست بسته شده است و امکان ارسال پیام جدید وجود ندارد.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
