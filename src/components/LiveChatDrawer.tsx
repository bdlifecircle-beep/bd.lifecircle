import React, { useEffect, useRef, useState } from 'react';
import { LogIn, MessageSquare, Send, ShieldCheck, X } from 'lucide-react';
import { ChatMessage, FIELD_LIMITS } from '../types';

interface LiveChatDrawerProps {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  currentUid?: string;
  messages: ChatMessage[];
  onRequireSignIn: () => void;
  onSendMessage: (text: string) => Promise<void>;
}

export const LiveChatDrawer: React.FC<LiveChatDrawerProps> = ({
  open,
  onClose,
  isAuthenticated,
  currentUid,
  messages,
  onRequireSignIn,
  onSendMessage,
}) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages.length]);

  if (!open) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSendMessage(text.trim().slice(0, FIELD_LIMITS.MESSAGE_MAX));
      setText('');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'মেসেজ পাঠানো যায়নি।');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[82vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-[#1D2B53] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#2DA94F]" />
          <div>
            <p className="text-sm font-bold leading-tight">লাইভ কাস্টমার সাপোর্ট</p>
            <p className="text-[11px] text-sky-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#2DA94F]" />
              <span>সরাসরি মানব প্রতিনিধি (কোনো AI চ্যাট নয়)</span>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="চ্যাট বন্ধ করুন"
          className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
        {!isAuthenticated ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              আমাদের সাপোর্ট প্রতিনিধির সাথে সরাসরি লাইভ চ্যাট করতে এবং চ্যাট হিস্টোরি সংরক্ষিত রাখতে অনুগ্রহ করে সাইন ইন করুন।
            </p>
            <button
              onClick={onRequireSignIn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs font-semibold"
            >
              <LogIn className="w-4 h-4" />
              সাইন ইন করুন
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 px-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              স্বাগতম! যন্ত্রপাতি, স্লিপ টেস্ট কিংবা ডেলিভারি সম্পর্কে আপনার প্রশ্ন লিখুন। আমাদের সাপোর্ট টিম সরাসরি এখানে উত্তর দেবেন।
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.senderUid === currentUid && m.senderRole === 'customer';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 px-1">
                  {m.senderRole === 'admin' ? `${m.senderName} (প্রতিনিধি)` : m.senderName}
                </span>
                <div
                  className={`max-w-[82%] rounded-xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed ${
                    isMine
                      ? 'bg-[#2D89C8] text-white rounded-br-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {isAuthenticated && (
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        >
          {err && <p className="text-[11px] text-rose-600 mb-1.5">{err}</p>}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              maxLength={FIELD_LIMITS.MESSAGE_MAX}
              onChange={(e) => setText(e.target.value)}
              placeholder="আপনার বার্তা লিখুন..."
              className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D89C8]"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              aria-label="বার্তা পাঠান"
              className="p-2.5 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] disabled:opacity-50 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
