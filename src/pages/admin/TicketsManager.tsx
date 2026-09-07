import React, { useState, useEffect } from 'react';
import { storage, Ticket } from '../../lib/storage';
import { MessageSquare, X, Search, Send, User, Trash2 } from 'lucide-react';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';

export default function AdminTicketsManager() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const authData = localStorage.getItem('kowsar_admin_auth');
    if (authData) {
      setCurrentUser(JSON.parse(authData));
    }
    loadTickets();
  }, []);

  const loadTickets = () => {
    setTickets(storage.getTickets());
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyMessage.trim() || !currentUser) return;

    storage.addTicketMessage(activeTicket.id, {
      senderId: currentUser.id,
      senderName: 'کارشناس ' + (currentUser.name || 'آموزش'),
      isAdmin: true,
      text: replyMessage
    });

    const updated = storage.getTickets().find(t => t.id === activeTicket.id) || null;
    setActiveTicket(updated);
    loadTickets();
    setReplyMessage('');
  };

  const closeTicket = () => {
    if (!activeTicket) return;
    storage.updateTicketStatus(activeTicket.id, 'closed');
    const updated = storage.getTickets().find(t => t.id === activeTicket.id) || null;
    setActiveTicket(updated);
    loadTickets();
  };

  const executeDeleteTicket = () => {
    if (!activeTicket) return;
    storage.deleteTicket(activeTicket.id);
    setActiveTicket(null);
    setShowDeleteConfirm(false);
    loadTickets();
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'open') return t.status === 'open';
    if (filter === 'closed') return t.status === 'closed' || t.status === 'answered';
    return true;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">مدیریت تیکت‌ها و درخواست‌ها</h1>
          <p className="text-slate-500 text-sm mt-1">پاسخگویی به درخواست‌های دانشجویان و اساتید</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'open' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            در انتظار پاسخ
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            همه تیکت‌ها
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
        {/* Ticket List */}
        <div className="w-full lg:w-1/3 bg-white rounded-3xl border border-slate-200 flex flex-col overflow-hidden shadow-sm h-full">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="جستجو در موضوع یا نام..."
                className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400">تیکتی یافت نشد.</div>
            ) : (
              filteredTickets.map(ticket => (
                <div 
                  key={ticket.id}
                  onClick={() => setActiveTicket(ticket)}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${activeTicket?.id === ticket.id ? 'bg-blue-50 border-blue-100' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-sm text-slate-800 line-clamp-1">{ticket.subject}</h3>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${ticket.status === 'open' ? 'bg-amber-500' : ticket.status === 'answered' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span className="flex items-center gap-1"><User className="w-3 h-3"/> {ticket.userName}</span>
                    <span dir="ltr">{new Date(ticket.updatedAt).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="w-full lg:w-2/3 bg-white rounded-3xl border border-slate-200 flex flex-col overflow-hidden shadow-sm h-full">
          {activeTicket ? (
            <>
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">{activeTicket.subject}</h2>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span className="bg-white px-2 py-1 rounded-md border border-slate-200">
                      بخش: {activeTicket.department === 'education' ? 'آموزش' : activeTicket.department === 'financial' ? 'مالی' : activeTicket.department === 'cultural' ? 'فرهنگی' : 'فناوری اطلاعات'}
                    </span>
                    <span className="bg-white px-2 py-1 rounded-md border border-slate-200">
                      کد: {activeTicket.id}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeTicket.status !== 'closed' && (
                    <button 
                      onClick={closeTicket}
                      className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 border border-amber-200/60"
                      title="بستن تیکت"
                    >
                      <X className="w-4 h-4" />
                      بستن تیکت
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 border border-red-200/60"
                    title="حذف کامل تیکت"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف تیکت
                  </button>
                </div>
              </div>

              <div className="flex-grow p-6 overflow-y-auto space-y-6">
                {activeTicket.messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.isAdmin ? 'bg-blue-100 text-blue-900 rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'
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
                <div className="p-3 sm:p-4 border-t border-slate-100 bg-white">
                  <form onSubmit={handleReply} className="flex flex-col sm:flex-row gap-2.5">
                    <textarea
                      required
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      placeholder="پاسخ خود را بنویسید..."
                      className="w-full flex-grow bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 focus:outline-none focus:border-blue-500 min-h-[70px] sm:min-h-[56px] text-sm leading-relaxed"
                    />
                    <button type="submit" className="bg-blue-600 text-white py-3 sm:py-0 px-5 rounded-xl hover:bg-blue-700 transition-colors shrink-0 flex items-center justify-center font-bold text-sm">
                      <Send className="w-4 h-4 ml-2" />
                      ارسال پاسخ
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 border-t border-slate-100 text-center text-slate-500 font-bold bg-slate-50">
                  این تیکت بسته شده است.
                </div>
              )}
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center flex-col text-slate-400 p-8 text-center">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-bold text-lg text-slate-500">تیکتی انتخاب نشده است</p>
              <p className="text-sm mt-2">برای مشاهده و پاسخگویی، یک درخواست را از لیست سمت راست انتخاب کنید.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Ticket Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDeleteTicket}
        title="حذف تیکت پشتیبانی"
        itemName={activeTicket?.subject}
        details={activeTicket ? [
          { label: 'فرستنده', value: activeTicket.userName },
          { label: 'بخش', value: activeTicket.department || 'آموزش' }
        ] : undefined}
      />
    </div>
  );
}
