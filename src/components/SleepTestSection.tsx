import React from 'react';
import { Activity, CalendarCheck, CheckCircle2, Home, MoonStar } from 'lucide-react';
import { SiteSettings } from '../types';

interface SleepTestSectionProps {
  settings: SiteSettings;
  onBookSleepTest: (serviceType: 'home-sleep-test' | 'clinic-sleep-test') => void;
}

export const SleepTestSection: React.FC<SleepTestSectionProps> = ({
  settings,
  onBookSleepTest,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-5 relative min-h-[260px]">
          <img
            src="/src/assets/images/banner_sleep_clinic_1795362639911.jpg"
            alt="lifecircle.bd স্লিপ টেস্ট ক্লিনিক"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1D2B53]/80 via-transparent to-transparent flex items-end p-6">
            <div className="text-white">
              <p className="text-xs text-sky-200 font-medium">Polysomnography & HSAT</p>
              <p className="text-lg font-bold">স্লিপ অ্যাপনিয়া ডায়াগনস্টিক সেন্টার</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2D89C8]">
              <MoonStar className="w-4 h-4" />
              <span>হোম ও ক্লিনিক স্লিপ টেস্ট (Sleep Study)</span>
            </div>

            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#1D2B53] dark:text-white">
              নাক ডাকা ও ঘুমের মধ্যে শ্বাসকষ্ট? আজই স্লিপ টেস্ট করুন
            </h2>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {settings.sleepLabNote}
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1D2B53] dark:text-white">
                  <Home className="w-4 h-4 text-[#2DA94F]" />
                  <span>হোম স্লিপ টেস্ট (Level 3 HSAT)</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  টেকনিশিয়ান বাসায় গিয়ে যন্ত্র সেট করবেন। নিজের বিছানায় স্বাভাবিকভাবে ঘুমিয়ে নিরাপদ ও নির্ভুল পরীক্ষা।
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-2 text-sm font-bold text-[#1D2B53] dark:text-white">
                  <Activity className="w-4 h-4 text-[#2D89C8]" />
                  <span>ক্লিনিক পলিসমনোগ্রাফি (Level 1)</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  পূর্ণাঙ্গ EEG, ECG, SpO2 এবং CPAP/BiPAP টাইট্রেশন সহ বিশেষজ্ঞের তত্ত্বাবধানে টেস্ট।
                </p>
              </div>
            </div>

            <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2DA94F] shrink-0" />
                <span>২৪ ঘণ্টার মধ্যে ডিজিটাল রিপোর্ট ও সুরক্ষিত কপি</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2DA94F] shrink-0" />
                <span>রিপোর্ট অনুযায়ী CPAP/BiPAP ও NPV মাস্ক সেটআপ সাপোর্ট</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3">
            <button
              onClick={() => onBookSleepTest('home-sleep-test')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <CalendarCheck className="w-4 h-4" />
              হোম স্লিপ টেস্ট বুক করুন
            </button>
            <button
              onClick={() => onBookSleepTest('clinic-sleep-test')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#2D89C8] text-xs sm:text-sm font-semibold transition-colors"
            >
              ক্লিনিক স্লিপ টেস্ট বুক করুন
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
