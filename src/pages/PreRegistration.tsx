import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Phone, BookOpen, GraduationCap, CheckCircle2 } from 'lucide-react';
import { storage } from '../lib/storage';

export default function PreRegistration() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const settings = storage.getSettings();
  const studyFields = (settings.studyFields || []).filter(f => f.isActive).sort((a, b) => a.order - b.order);

  const [formData, setFormData] = useState({
    fullName: '',
    nationalCode: '',
    phone: '',
    degree: '',
    field: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await storage.submitRegistrationToDB(formData);
    setIsSubmitted(true);
    setFormData({
      fullName: '',
      nationalCode: '',
      phone: '',
      degree: '',
      field: '',
      description: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="bg-white rounded-[3rem] shadow-[0_20px_60px_rgba(37,99,235,0.08)] border border-blue-50 overflow-hidden p-8 lg:p-12"
      >
        <div className="text-center mb-10">
          <span className="inline-block py-1.5 px-4 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-4">فرم ثبت‌نام</span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">پیش ثبت‌نام دانشجویان جدید</h1>
          <p className="text-slate-500 text-lg font-light">لطفاً اطلاعات خود را با دقت وارد کنید. مشاوران ما در اسرع وقت با شما تماس خواهند گرفت.</p>
        </div>

        {isSubmitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 border border-emerald-100 rounded-3xl p-10 text-center flex flex-col items-center"
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">ثبت‌نام با موفقیت انجام شد!</h2>
            <p className="text-emerald-700">اطلاعات شما در سیستم ثبت گردید. به زودی جهت تکمیل فرآیند ثبت‌نام با شما تماس می‌گیریم.</p>
            <button 
              onClick={() => setIsSubmitted(false)}
              className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl transition-all"
            >
              ثبت‌نام فرد جدید
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  نام و نام خانوادگی
                </label>
                <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="مثال: علی احمدی" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  کد ملی
                </label>
                <input 
                  type="text" 
                  name="nationalCode"
                  value={formData.nationalCode}
                  onChange={handleChange}
                  required
                  placeholder="مثال: 1234567890" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-left" dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-500" />
                  شماره موبایل
                </label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="0912 345 6789" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-left" dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  آخرین مدرک تحصیلی
                </label>
                <select required name="degree" value={formData.degree} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer">
                  <option value="" disabled>انتخاب کنید...</option>
                  <option value="diploma">دیپلم (تمامی رشته‌ها)</option>
                  <option value="associate">کاردانی (فوق دیپلم)</option>
                  <option value="bachelor">کارشناسی (لیسانس)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                رشته تحصیلی مورد علاقه
              </label>
              <select required name="field" value={formData.field} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer">
                <option value="" disabled>انتخاب کنید...</option>
                {studyFields.some(f => f.degreeType === 'associate' || f.degreeType === 'both') && (
                  <optgroup label="مقطع کاردانی">
                    {studyFields.filter(f => f.degreeType === 'associate' || f.degreeType === 'both').map(field => (
                      <option key={`assoc-${field.id}`} value={field.value}>{field.name}</option>
                    ))}
                  </optgroup>
                )}
                {studyFields.some(f => f.degreeType === 'bachelor' || f.degreeType === 'both') && (
                  <optgroup label="مقطع کارشناسی">
                    {studyFields.filter(f => f.degreeType === 'bachelor' || f.degreeType === 'both').map(field => (
                      <option key={`bach-${field.id}`} value={field.value}>{field.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">توضیحات تکمیلی (اختیاری)</label>
              <textarea 
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="اگر سوال یا نکته‌ای دارید اینجا بنویسید..." 
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
              ></textarea>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-[0_8px_25px_rgba(37,99,235,0.3)] hover:-translate-y-1 text-lg">
              ارسال اطلاعات و ثبت‌نام
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
