import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Lock, AlertCircle, ArrowLeft, ShieldCheck, GraduationCap } from 'lucide-react';
import { storage } from '../../lib/storage';

export default function PortalRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    nationalCode: '',
    studentId: '',
    password: '',
    role: 'student' as const
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.nationalCode.length !== 10) {
      setError('کد ملی باید 10 رقم باشد.');
      return;
    }
    
    const users = storage.getPortalUsers();
    if (users.find(u => u.nationalCode === formData.nationalCode)) {
      setError('این کد ملی قبلاً ثبت شده است.');
      return;
    }

    storage.addPortalUser({
      ...formData,
      isApproved: true
    });

    setSuccess('ثبت‌نام با موفقیت انجام شد. اکنون می‌توانید وارد سامانه شوید.');
    setTimeout(() => {
      navigate('/portal/login');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/portal/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          بازگشت به صفحه ورود
        </Link>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-800 mb-2">ثبت‌نام در میز خدمت</h1>
            <p className="text-slate-500 text-sm font-medium">لطفاً مشخصات خود را دقیق وارد کنید</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 mb-6 border border-red-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 mb-6 border border-emerald-100">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              {success}
            </div>
          )}

          {!success && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-2 text-sm">نام و نام خانوادگی</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pr-12 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2 text-sm">کد ملی (10 رقم)</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={formData.nationalCode}
                    onChange={(e) => setFormData({...formData, nationalCode: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pr-12 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2 text-sm">شماره دانشجویی</label>
                <div className="relative">
                  <GraduationCap className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pr-12 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2 text-sm">رمز عبور دلخواه</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pr-12 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-colors mt-4 shadow-md"
              >
                ثبت‌نام در سامانه
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
