import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  Moon,
  Phone,
  Search,
  ShoppingCart,
  Sun,
  X,
} from 'lucide-react';
import { AppNotification, PageRoute } from '../types';
import { PWAInstallButton } from './PWAComponents';

interface WorkspaceBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenChat: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNavigate: (page: PageRoute) => void;
}

export const WorkspaceBar: React.FC<WorkspaceBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  darkMode,
  onToggleDark,
  cartCount,
  onOpenCart,
  onOpenChat,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigate,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-slate-100/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Global Device & Disease Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
          className="relative flex-1 min-w-[220px] max-w-xl"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="যন্ত্রপাতি, রোগের নাম (যেমন: বিপি, ডায়াবেটিস, স্লিপ) বা হাসপাতাল খুঁজুন..."
            className="w-full pl-9 pr-20 py-2 text-xs sm:text-sm rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D89C8]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="সার্চ মুছুন"
              className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs font-medium transition-colors"
          >
            খুঁজুন
          </button>
        </form>

        {/* Functional Utility Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('appointments')}
            className="px-3 py-1.5 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            অ্যাপয়েন্টমেন্ট বুকিং
          </button>

          <button
            onClick={() => onNavigate('contact')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-[#2D89C8] text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <Phone className="w-3.5 h-3.5 text-[#2DA94F]" />
            <span>যোগাযোগ</span>
          </button>

          <button
            onClick={onOpenChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-[#2D89C8] text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#2D89C8]" />
            <span>লাইভ চ্যাট</span>
          </button>

          <button
            onClick={onOpenCart}
            aria-label="অনুরোধ তালিকা"
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-[#2D89C8] text-xs font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#2D89C8]" />
            <span>কার্ট</span>
            {cartCount > 0 && (
              <span className="font-mono-num text-xs font-bold text-[#2DA94F]">
                ({cartCount})
              </span>
            )}
          </button>

          {/* Real-Time Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="রিয়েল-টাইম নোটিফিকেশন"
              className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-[#2D89C8] text-xs font-medium transition-colors"
            >
              <Bell className="w-4 h-4 text-[#2D89C8]" />
              {unreadCount > 0 && (
                <span className="font-mono-num text-xs font-bold text-rose-600 dark:text-rose-400">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    রিয়েল-টাইম নোটিফিকেশন
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="inline-flex items-center gap-1 text-[11px] text-[#2D89C8] hover:underline"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      সব পঠিত
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-xs text-slate-500 dark:text-slate-400 text-center">
                      এখনো কোনো নোটিফিকেশন নেই।
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                          !n.read ? 'bg-sky-50/70 dark:bg-sky-950/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="text-[10px] font-semibold text-[#2D89C8]">
                              নতুন
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {n.message}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onToggleDark}
            aria-label={darkMode ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:border-[#2D89C8] transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#1D2B53]" />}
          </button>

          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
};
