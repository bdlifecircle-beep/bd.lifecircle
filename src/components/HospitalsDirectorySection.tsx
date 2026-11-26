import React, { useState } from 'react';
import { Building2, MapPin, Phone, PhoneCall } from 'lucide-react';
import { Hospital } from '../types';

interface HospitalsDirectorySectionProps {
  hospitals: Hospital[];
  searchQuery: string;
}

export const HospitalsDirectorySection: React.FC<HospitalsDirectorySectionProps> = ({
  hospitals,
  searchQuery,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'government' | 'autonomous'>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');

  const divisions = Array.from(new Set(hospitals.map((h) => h.division)));
  const q = searchQuery.trim().toLowerCase();

  const filtered = hospitals.filter((h) => {
    if (typeFilter !== 'all' && h.type !== typeFilter) return false;
    if (divisionFilter !== 'all' && h.division !== divisionFilter) return false;
    if (!q) return true;
    const text = [
      h.nameBn,
      h.nameEn,
      h.locationBn,
      h.division,
      h.emergencyPhone,
      h.specialties || '',
    ]
      .join(' ')
      .toLowerCase();
    return text.includes(q);
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <p className="text-xs font-semibold text-[#2DA94F]">
            জরুরি স্বাস্থ্যসেবা নেটওয়ার্ক · বাংলাদেশ
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#1D2B53] dark:text-white">
            বাংলাদেশের সরকারি ও স্বায়ত্তশাসিত হাসপাতালের তালিকা
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            হাসপাতালের নাম, লোকেশন ও জরুরি যোগাযোগ নম্বরসহ দ্রুত কল করার সুবিধা।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {[
              { id: 'all', label: 'সকল' },
              { id: 'government', label: 'সরকারি' },
              { id: 'autonomous', label: 'স্বায়ত্তশাসিত' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id as 'all' | 'government' | 'autonomous')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  typeFilter === t.id
                    ? 'bg-white dark:bg-slate-800 text-[#1D2B53] dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            aria-label="বিভাগ অনুযায়ী ফিল্টার"
            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2D89C8]"
          >
            <option value="all">সকল বিভাগ ({hospitals.length})</option>
            {divisions.map((div) => (
              <option key={div} value={div}>
                {div}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
          এই ফিল্টার অনুযায়ী কোনো হাসপাতাল পাওয়া যায়নি।
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((h) => (
            <article
              key={h.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-[#2D89C8]" />
                  <span>{h.type === 'government' ? 'সরকারি হাসপাতাল' : 'স্বায়ত্তশাসিত প্রতিষ্ঠান'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{h.division}</span>
                </div>

                <h3 className="mt-1.5 text-base font-bold text-[#1D2B53] dark:text-white leading-snug">
                  {h.nameBn}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{h.nameEn}</p>

                <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-[#2DA94F] shrink-0 mt-0.5" />
                  <span>{h.locationBn}</span>
                </div>

                {h.specialties && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    সেবা: {h.specialties}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    জরুরি যোগাযোগ
                  </span>
                  <span className="font-mono-num text-sm font-bold text-[#1D2B53] dark:text-white">
                    {h.emergencyPhone}
                  </span>
                  {h.generalPhone && (
                    <span className="block font-mono-num text-[11px] text-slate-500 dark:text-slate-400">
                      সাধারণ: {h.generalPhone}
                    </span>
                  )}
                </div>

                <a
                  href={`tel:${h.emergencyPhone.replace(/[^\d+]/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  জরুরি কল
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Quick National Helpline Banner */}
      <div className="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-sky-50/70 dark:bg-sky-950/30 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-[#2D89C8] shrink-0" />
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
            জরুরি অ্যাম্বুলেন্স ও ২৪/৭ সরকারি চিকিৎসক পরামর্শের জন্য কল করুন{' '}
            <strong className="font-mono-num text-[#1D2B53] dark:text-white">999</strong> অথবা{' '}
            <strong className="font-mono-num text-[#1D2B53] dark:text-white">16263</strong>।
          </p>
        </div>
        <a
          href="tel:16263"
          className="px-4 py-2 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs font-semibold"
        >
          স্বাস্থ্য বাতায়ন (16263)
        </a>
      </div>
    </section>
  );
};
