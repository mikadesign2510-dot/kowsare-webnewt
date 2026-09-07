import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Navigation } from 'lucide-react';
import { storage, ContactPageConfig, defaultContactConfig } from '../lib/storage';

export default function ContactLocation() {
  const [config, setConfig] = useState<ContactPageConfig>(defaultContactConfig);

  useEffect(() => {
    setConfig(storage.getContactConfig());
    const handleSettingsChange = () => setConfig(storage.getContactConfig());
    window.addEventListener('kowsar_contact_config_changed', handleSettingsChange);
    return () => window.removeEventListener('kowsar_contact_config_changed', handleSettingsChange);
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-3xl p-6 md:p-10 border border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Info */}
            <div className="space-y-6">
              <div>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold inline-block mb-3">
                  {config.pageBadge}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-3">
                  ارتباط با ما و موقعیت مکانی
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {config.pageSubtitle}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{config.addressTitle}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">{config.address}</p>
                    <div className="text-xs text-slate-500 mt-1 font-en" dir="ltr">{config.postalCode} :کد پستی</div>
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-3">
                <a
                  href={config.googleMapsLink || 'https://maps.app.goo.gl/pH9PehuwXuWNXwcL8'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-red-300 hover:text-red-600 hover:shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4 text-red-500" />
                  مسیریابی در گوگل‌مپ (Google Maps)
                </a>
                <a
                  href={config.neshanLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4 text-blue-500" />
                  مسیریابی با نشان
                </a>
                <a
                  href={config.baladLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4 text-emerald-500" />
                  مسیریابی با بلد
                </a>
              </div>
            </div>

            {/* Map */}
            <div className="h-[350px] w-full rounded-2xl overflow-hidden bg-slate-200 border-4 border-white shadow-lg relative relative z-10">
              {config.mapIframe ? (
                <div 
                  className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
                  dangerouslySetInnerHTML={{ __html: config.mapIframe }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  نقشه موقعیت مکانی
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
