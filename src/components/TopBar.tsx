import React, { useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PageRoute } from '../types';

interface TopBarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  isAuthenticated: boolean;
  onSecretAdminTrigger: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentPage,
  onNavigate,
  isAuthenticated,
  onSecretAdminTrigger,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<number | null>(null);

  const navItems: { id: PageRoute; label: string }[] = [
    { id: 'products', label: 'যন্ত্রপাতি' },
    { id: 'sleep-test', label: 'স্লিপ টেস্ট' },
    { id: 'diseases', label: 'রোগ ও স্বাস্থ্য' },
    { id: 'hospitals', label: 'হাসপাতাল' },
    { id: 'faq', label: 'FAQ' },
  ];

  const handleNav = (id: PageRoute) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    logoTapCount.current += 1;
    if (logoTapTimer.current) window.clearTimeout(logoTapTimer.current);
    if (logoTapCount.current >= 5) {
      logoTapCount.current = 0;
      onSecretAdminTrigger();
      return;
    }
    logoTapTimer.current = window.setTimeout(() => {
      logoTapCount.current = 0;
    }, 1500);
    handleNav('home');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Title */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#1D2B53] dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#2D89C8] rounded-md"
        >
          <img
            src="/assets/aistudio/lc_logo_0e7c6a28.png"
            alt="lifecircle.bd লোগো"
            referrerPolicy="no-referrer"
            className="w-8 h-8 object-contain rounded-md bg-white p-0.5 border border-slate-200 dark:border-slate-700"
          />
          <span>
            lifecircle<span className="text-[#2DA94F]">.bd</span>
          </span>
        </button>

        {/* Zone 2: 5 concise single-line text nav links including FAQ */}
        <nav
          aria-label="প্রধান নেভিগেশন"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                currentPage === item.id
                  ? 'border-[#2D89C8] text-[#1D2B53] dark:text-white font-semibold'
                  : 'border-transparent hover:text-[#2D89C8] dark:hover:text-sky-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Menu Trigger (No Admin button exposed) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleNav('dashboard')}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#2D89C8] hover:bg-[#236FA3] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {isAuthenticated ? 'ড্যাশবোর্ড' : 'লগইন / অ্যাকাউন্ট'}
          </button>

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="মেনু খুলুন"
            className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentPage === item.id
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-[#2D89C8] dark:text-sky-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleNav('about')}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
            >
              আমাদের সম্পর্কে
            </button>
            <button
              onClick={() => handleNav('contact')}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
            >
              যোগাযোগ ও সাপোর্ট
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
