import React, { useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWA';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-[#1D2B53] dark:text-sky-200 text-xs font-medium hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5 text-[#2D89C8]" />
        অ্যাপ ইনস্টল
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          iOS অ্যাপ
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  iPhone / iPad-এ ইনস্টল করুন
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                ১. Safari ব্রাউজারের নিচে <strong>Share</strong> আইকনে ট্যাপ করুন।
                <br />
                ২. নিচে স্ক্রল করে <strong>Add to Home Screen</strong> নির্বাচন করুন।
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-[#2D89C8] py-2 text-sm font-medium text-white hover:bg-[#236FA3]"
              >
                বুঝেছি
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg bg-amber-600 text-white px-3.5 py-2 text-xs font-medium shadow-lg"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>অফলাইন মোড — সংরক্ষিত ক্যাশ ডেটা ব্যবহৃত হচ্ছে; অনলাইনে ফিরলে স্বয়ংক্রিয় সিঙ্ক হবে।</span>
    </div>
  );
};
