import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  MonitorPlay,
  Briefcase,
  Users,
  BookOpenCheck,
  TrendingUp,
  Star,
  Award,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  Calendar,
  Layers,
  Heart,
  Lightbulb,
  Target
} from 'lucide-react';
import { storage } from '../lib/storage';

const featureIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  MonitorPlay,
  Briefcase,
  Users,
  BookOpenCheck,
  TrendingUp,
  Star,
  Award,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  Calendar,
  Layers,
  Heart,
  Lightbulb,
  Target
};

export default function Features() {
  const [settings, setSettings] = useState(storage.getSettings());

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setSettings(storage.getSettings());
    };
    window.addEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    return () => {
      window.removeEventListener('kowsar_site_settings_changed', handleSettingsUpdate);
    };
  }, []);

  const featuresList = settings.featuresItems || [];

  return (
    <section id="about" className="py-8 md:py-12 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
          {settings.featuresBadge && (
            <span className="text-blue-600 font-bold tracking-wider text-xs sm:text-sm mb-1 sm:mb-2 block">
              {settings.featuresBadge}
            </span>
          )}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-2 sm:mb-3 tracking-tight leading-tight">
            {settings.featuresTitle || 'چرا کوثر کاکی؟'}
          </h2>
          {settings.featuresSubtitle && (
            <p className="text-slate-500 text-xs sm:text-sm md:text-base leading-relaxed font-normal">
              {settings.featuresSubtitle}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {featuresList.map((feature, index) => {
            const Icon = featureIconMap[feature.iconName] || HelpCircle;
            return (
              <motion.div
                key={feature.id || index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-slate-50/50 hover:bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.25rem] border border-slate-100 hover:border-blue-100 shadow-sm hover:shadow-[0_8px_25px_rgba(37,99,235,0.08)] transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden flex items-start gap-3.5 sm:gap-4"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/60 rounded-full blur-2xl -mr-12 -mt-12 transition-opacity opacity-0 group-hover:opacity-100 z-0"></div>
                
                <div className="relative z-10 shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors duration-300 shadow-sm">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="relative z-10 pt-0.5">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed font-normal text-[11px] sm:text-xs">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
