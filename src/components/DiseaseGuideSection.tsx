import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Pill,
  Sun,
} from 'lucide-react';
import { DAILY_HEALTH_ADVICES } from '../data/seedData';
import { DiseaseGuide, ProductCategory } from '../types';

interface DiseaseGuideSectionProps {
  diseases: DiseaseGuide[];
  searchQuery: string;
  onJumpToCategory: (cat: ProductCategory) => void;
}

const CAT_NAME: Record<ProductCategory, string> = {
  bp: 'বিপি মেশিন',
  diabetes: 'ডায়াবেটিস মিটার',
  thermometer: 'থার্মোমিটার',
  oxygen: 'অক্সিজেন কনসেন্ট্রেটর',
  bipap: 'বাইপ্যাপ মেশিন',
  cpap: 'সি-প্যাপ মেশিন',
  mask: 'সিঙ্গেল এনপিভি মাস্ক',
  'sleep-test': 'স্লিপ টেস্ট',
};

export const DiseaseGuideSection: React.FC<DiseaseGuideSectionProps> = ({
  diseases,
  searchQuery,
  onJumpToCategory,
}) => {
  const [selectedId, setSelectedId] = useState<string>(diseases[0]?.id || '');

  const q = searchQuery.trim().toLowerCase();
  const filtered = diseases.filter((d) => {
    if (!q) return true;
    const text = [
      d.nameBn,
      d.nameEn,
      d.overviewBn,
      d.treatmentBn,
      ...d.symptoms,
      ...d.immediateActions,
    ]
      .join(' ')
      .toLowerCase();
    return text.includes(q);
  });

  const active =
    filtered.find((d) => d.id === selectedId) || filtered[0] || null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <div>
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <p className="text-xs font-semibold text-[#2D89C8]">
            রোগ সচেতনতা, ডায়াবেটিস নিয়ন্ত্রণ ও প্রাথমিক স্বাস্থ্য নির্দেশিকা
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#1D2B53] dark:text-white">
            বিভিন্ন রোগের বিস্তারিত বর্ণনা, লক্ষণ, করণীয় ও চিকিৎসা
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            উপরে সার্চ বারে রোগের নাম বা লক্ষণ লিখে খুঁজুন অথবা নিচের তালিকা থেকে ডায়াবেটিস, উচ্চ রক্তচাপ, স্লিপ অ্যাপনিয়া বা শ্বাসকষ্ট নির্বাচন করে বিস্তারিত জানুন।
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
            "{searchQuery}" সম্পর্কিত কোনো রোগের তথ্য পাওয়া যায়নি।
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Disease Selector Sidebar */}
            <div className="lg:col-span-4 space-y-2">
              {filtered.map((d) => {
                const isSelected = active?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors ${
                      isSelected
                        ? 'bg-[#1D2B53] text-white border-[#1D2B53]'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-[#2D89C8]'
                    }`}
                  >
                    <p className="text-sm font-bold">{d.nameBn}</p>
                    <p
                      className={`mt-0.5 text-xs ${
                        isSelected ? 'text-sky-200' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {d.nameEn}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Detailed Disease Content */}
            {active && (
              <article className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
                <div>
                  <p className="text-xs font-medium text-[#2DA94F]">{active.nameEn}</p>
                  <h3 className="mt-1 text-xl sm:text-2xl font-bold text-[#1D2B53] dark:text-white">
                    {active.nameBn}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                    {active.overviewBn}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-[#1D2B53] dark:text-white mb-3">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>সাধারণ লক্ষণসমূহ (Symptoms)</span>
                    </h4>
                    <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                      {active.symptoms.map((sym, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-mono-num text-xs font-semibold text-[#2D89C8] mt-0.5">
                            0{i + 1}.
                          </span>
                          <span>{sym}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-[#1D2B53] dark:text-white mb-3">
                      <Activity className="w-4 h-4 text-[#2DA94F]" />
                      <span>নিয়ন্ত্রণ ও তাৎক্ষণিক করণীয়</span>
                    </h4>
                    <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                      {active.immediateActions.map((act, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-mono-num text-xs font-semibold text-[#2DA94F] mt-0.5">
                            0{i + 1}.
                          </span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-[#1D2B53] dark:text-white mb-2">
                    <Pill className="w-4 h-4 text-[#2D89C8]" />
                    <span>চিকিৎসা ও প্রতিরোধ পরামর্শ</span>
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {active.treatmentBn}
                  </p>
                </div>

                {active.recommendedCategories && active.recommendedCategories.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <HeartPulse className="w-4 h-4 text-[#2DA94F]" />
                      <span>সহায়ক মেডিকেল যন্ত্র ও সেবা:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {active.recommendedCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => onJumpToCategory(cat)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs font-semibold transition-colors"
                        >
                          <span>{CAT_NAME[cat] || cat} দেখুন</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )}
          </div>
        )}
      </div>

      {/* Daily Health Advice Section */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2DA94F]">
            <Sun className="w-4 h-4" />
            <span>দৈনন্দিন সুস্থ জীবনযাপন গাইড</span>
          </div>
          <h3 className="mt-1 text-xl sm:text-2xl font-bold text-[#1D2B53] dark:text-white">
            প্রতিদিনের সুস্থতার জন্য জরুরি স্বাস্থ্য পরামর্শ (Daily Health Advice)
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            ডায়াবেটিস, উচ্চ রক্তচাপ ও শ্বাসযন্ত্রের সুস্থতা বজায় রাখতে প্রতিদিন নিচের ৪টি অভ্যাস অনুসরণ করুন।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {DAILY_HEALTH_ADVICES.map((advice, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-base font-bold text-[#1D2B53] dark:text-white">
                  {advice.title}
                </h4>
                <span className="font-mono-num text-xs font-bold text-[#2D89C8]">
                  0{idx + 1}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {advice.summary}
              </p>
              <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {advice.points.map((pt, pIdx) => (
                  <li
                    key={pIdx}
                    className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#2DA94F] shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
