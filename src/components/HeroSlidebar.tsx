import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, ShieldCheck } from 'lucide-react';
import { Banner, PageRoute } from '../types';

interface HeroSlidebarProps {
  banners: Banner[];
  onNavigate: (page: PageRoute) => void;
}

export const HeroSlidebar: React.FC<HeroSlidebarProps> = ({ banners, onNavigate }) => {
  const activeBanners = banners.filter((b) => b.active).sort((a, b) => a.order - b.order);
  const [index, setIndex] = useState(0);
  const [imgErrorIds, setImgErrorIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  useEffect(() => {
    if (index >= activeBanners.length) setIndex(0);
  }, [activeBanners.length, index]);

  if (activeBanners.length === 0) return null;

  const current = activeBanners[index] ?? activeBanners[0];
  const hasImgError = !!imgErrorIds[current.id];

  return (
    <section aria-label="প্রধান স্লাইডবার ব্যানার" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#1D2B53] min-h-[300px] sm:min-h-[380px] lg:min-h-[420px] flex items-center">
        {/* Background Media with Fallback */}
        {!hasImgError && current.imageUrl ? (
          <img
            src={current.imageUrl}
            alt={current.title}
            referrerPolicy="no-referrer"
            onError={() =>
              setImgErrorIds((prev) => ({ ...prev, [current.id]: true }))
            }
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1D2B53] via-[#2D89C8] to-[#2DA94F]" />
        )}

        {/* Measured Contrast Scrim */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1D2B53]/95 via-[#1D2B53]/75 to-[#1D2B53]/25" />

        {/* Content */}
        <div className="relative z-10 max-w-2xl p-6 sm:p-10 lg:p-14 text-white">
          <div className="flex items-center gap-2 text-xs text-sky-200 font-medium mb-3">
            <ShieldCheck className="w-4 h-4 text-[#2DA94F]" />
            <span>lifecircle.bd</span>
            <span aria-hidden="true">·</span>
            <span>অ্যাডমিন অনুমোদিত স্বাস্থ্যসেবা প্যানেল</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-white">
            {current.title}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl">
            {current.subtitle}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate(current.ctaTarget || 'products')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <span>{current.ctaText || 'বিস্তারিত দেখুন'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('appointments')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/25 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              অনলাইন অ্যাপয়েন্টমেন্ট
            </button>
          </div>
        </div>

        {/* Slidebar Controls */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={() =>
                setIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
              }
              aria-label="পূর্ববর্তী ব্যানার"
              className="hidden sm:flex absolute right-14 bottom-4 z-10 w-9 h-9 items-center justify-center rounded-lg bg-black/40 hover:bg-black/60 text-white border border-white/20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIndex((prev) => (prev + 1) % activeBanners.length)}
              aria-label="পরবর্তী ব্যানার"
              className="hidden sm:flex absolute right-4 bottom-4 z-10 w-9 h-9 items-center justify-center rounded-lg bg-black/40 hover:bg-black/60 text-white border border-white/20 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="absolute left-6 sm:left-10 bottom-4 z-10 flex items-center gap-2">
              {activeBanners.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => setIndex(i)}
                  aria-label={`ব্যানার ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-7 bg-[#2DA94F]' : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
