import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { 
  Users, 
  GraduationCap, 
  BookOpenCheck, 
  TrendingUp, 
  Award, 
  Briefcase, 
  BookOpen, 
  Building2, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { storage, StatItem } from '../lib/storage';

// Helper to convert English digits to Persian digits
const toPersianDigits = (num: number | string): string => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/[0-9]/g, (w) => farsiDigits[+w]);
};

// Formats number with commas and Persian digits
const formatPersianNumber = (num: number): string => {
  const formatted = Math.round(num).toLocaleString('en-US');
  return toPersianDigits(formatted);
};

// Map of available icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  GraduationCap,
  BookOpenCheck,
  TrendingUp,
  Award,
  Briefcase,
  BookOpen,
  Building2,
  Sparkles
};

// Animated Number Counter Component
function AnimatedNumber({ 
  value, 
  duration = 2.2, 
  isInView 
}: { 
  value: number; 
  duration?: number; 
  isInView: boolean; 
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    // Quartic ease-out curve for satisfying natural deceleration
    const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      
      const current = Math.floor(easedProgress * value);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isInView, value, duration]);

  return <span>{formatPersianNumber(displayValue)}</span>;
}

export default function StatsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.25 });
  const [settings, setSettings] = useState(storage.getSettings());

  useEffect(() => {
    setSettings(storage.getSettings());
    const handleSettingsUpdate = () => setSettings(storage.getSettings());
    window.addEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    return () => window.removeEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
  }, []);

  const statsItems: StatItem[] = settings.statsItems && settings.statsItems.length > 0 
    ? settings.statsItems 
    : [
        {
          id: 'stat-1',
          value: 1250,
          prefix: '+',
          title: 'دانشجویان در حال تحصیل',
          description: 'در دوره‌های مهارتی و اشتغال‌محور کاردانی و کارشناسی',
          iconName: 'Users',
          colorScheme: 'blue'
        },
        {
          id: 'stat-2',
          value: 3400,
          prefix: '+',
          title: 'فارغ‌التحصیلان متخصص',
          description: 'ورود موفق به بازار کار و صنایع تولیدی، خدماتی و مهندسی',
          iconName: 'GraduationCap',
          colorScheme: 'emerald'
        },
        {
          id: 'stat-3',
          value: 18,
          prefix: '+',
          title: 'رشته‌های کاردانی و کارشناسی',
          description: 'کدرشته‌های مصوب متناسب با پتانسیل‌های بومی و صنعتی منطقه',
          iconName: 'BookOpenCheck',
          colorScheme: 'indigo'
        },
        {
          id: 'stat-4',
          value: 92,
          suffix: '٪',
          title: 'شاخص اشتغال فارغ‌التحصیلان',
          description: 'نرخ بالای جذب و کارآفرینی در بخش‌های دولتی و خصوصی',
          iconName: 'TrendingUp',
          colorScheme: 'amber'
        }
      ];

  const colorStyles: Record<string, {
    borderTop: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeColor: string;
    numberGradient: string;
    glowBg: string;
    lightRing: string;
  }> = {
    blue: {
      borderTop: 'from-blue-500 to-cyan-400',
      iconBg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-50/80 border-blue-100/80 text-blue-700',
      badgeColor: 'text-blue-600',
      numberGradient: 'from-blue-700 via-blue-600 to-cyan-600',
      glowBg: 'bg-blue-500/10',
      lightRing: 'group-hover:ring-blue-500/20'
    },
    emerald: {
      borderTop: 'from-emerald-500 to-teal-400',
      iconBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
      iconColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50/80 border-emerald-100/80 text-emerald-700',
      badgeColor: 'text-emerald-600',
      numberGradient: 'from-emerald-700 via-emerald-600 to-teal-600',
      glowBg: 'bg-emerald-500/10',
      lightRing: 'group-hover:ring-emerald-500/20'
    },
    indigo: {
      borderTop: 'from-indigo-500 to-purple-400',
      iconBg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
      iconColor: 'text-indigo-600',
      badgeBg: 'bg-indigo-50/80 border-indigo-100/80 text-indigo-700',
      badgeColor: 'text-indigo-600',
      numberGradient: 'from-indigo-700 via-indigo-600 to-purple-600',
      glowBg: 'bg-indigo-500/10',
      lightRing: 'group-hover:ring-indigo-500/20'
    },
    amber: {
      borderTop: 'from-amber-500 to-orange-400',
      iconBg: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-50/80 border-amber-100/80 text-amber-700',
      badgeColor: 'text-amber-600',
      numberGradient: 'from-amber-700 via-orange-600 to-amber-500',
      glowBg: 'bg-amber-500/10',
      lightRing: 'group-hover:ring-amber-500/20'
    }
  };

  return (
    <section 
      ref={containerRef} 
      id="stats" 
      className="py-10 md:py-16 relative overflow-hidden bg-gradient-to-b from-slate-50/60 via-white to-blue-50/30"
    >
      {/* Decorative background blurs */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -ml-32"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none -mr-32"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Title with Badge */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 py-1.5 px-3.5 sm:px-4 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs md:text-sm font-bold mb-3 sm:mb-4 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
            <span>{settings.statsBadge || 'آمار و دستاوردهای درخشان'}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 mb-3 sm:mb-5 tracking-tight"
          >
            {settings.statsTitle || 'روایتی از پویایی، تجربه و مهارت‌آموزی'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-500 text-xs sm:text-base md:text-lg leading-relaxed font-light"
          >
            {settings.statsSubtitle || 'مرکز آموزش علمی کاربردی کوثر کاکی با تکیه بر استانداردهای مهارت‌محور، بستری برای اشتغال پایدار و تربیت نیروی متخصص فراهم ساخته است.'}
          </motion.p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {statsItems.map((item, index) => {
            const Icon = iconMap[item.iconName] || HelpCircle;
            const style = colorStyles[item.colorScheme] || colorStyles.blue;

            return (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 35, scale: 0.95 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.12,
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className={`group relative bg-white rounded-2xl sm:rounded-[2.2rem] p-5 sm:p-7 md:p-8 border border-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_50px_rgba(37,99,235,0.1)] transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between overflow-hidden ring-1 ring-slate-100 ${style.lightRing}`}
              >
                {/* Top Animated Progress Accent Border */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-100 overflow-hidden">
                  <motion.div 
                    initial={{ width: '0%' }}
                    animate={isInView ? { width: '100%' } : {}}
                    transition={{ duration: 1.2, delay: 0.3 + index * 0.15, ease: 'easeOut' }}
                    className={`h-full bg-gradient-to-l ${style.borderTop}`}
                  />
                </div>

                {/* Soft ambient inner glow on hover */}
                <div className={`absolute top-0 right-0 w-36 h-36 ${style.glowBg} rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100 duration-500 pointer-events-none`} />

                <div>
                  {/* Icon & Mini Badge Header */}
                  <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${style.iconBg} flex items-center justify-center transition-all duration-300 shadow-sm group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>

                    <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border ${style.badgeBg}`}>
                      شاخص معتبر
                    </span>
                  </div>

                  {/* Big Animated Number Counter */}
                  <div className="relative z-10 mb-2 sm:mb-3 flex items-baseline gap-1 font-black">
                    {item.prefix && (
                      <span className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${style.numberGradient}`}>
                        {item.prefix}
                      </span>
                    )}
                    
                    <span className={`text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r ${style.numberGradient}`}>
                      <AnimatedNumber 
                        value={item.value} 
                        duration={2.0 + index * 0.2} 
                        isInView={isInView} 
                      />
                    </span>

                    {item.suffix && (
                      <span className={`text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${style.numberGradient}`}>
                        {item.suffix}
                      </span>
                    )}
                  </div>

                  {/* Metric Title */}
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2 leading-snug group-hover:text-blue-600 transition-colors duration-300">
                    {item.title}
                  </h3>
                </div>

                {/* Metric Description */}
                <p className="text-xs md:text-sm text-slate-500 font-light leading-relaxed pt-2.5 sm:pt-3 border-t border-slate-100 mt-3 sm:mt-4">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Assurance Note / Trust Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 sm:mt-14 pt-6 sm:pt-8 border-t border-slate-200/70 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 text-center md:text-right text-xs md:text-sm text-slate-500"
        >
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>آمار استخراج شده از بانک اطلاعاتی فارغ‌التحصیلان و سامانه آموزشی هم‌آوا</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 font-bold text-slate-700">
            <span className="hover:text-blue-600 transition-colors">تضمین کیفیت آموزش</span>
            <span className="text-slate-300">•</span>
            <span className="hover:text-blue-600 transition-colors">مدرک رسمی و مورد تایید وزارت علوم</span>
            <span className="text-slate-300">•</span>
            <span className="hover:text-blue-600 transition-colors">تسهیلات اشتغال‌زایی</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
