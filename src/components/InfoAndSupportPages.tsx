import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  ExternalLink,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { FaqItem, FeedbackItem, FIELD_LIMITS, SiteSettings } from '../types';

export function buildWhatsAppLink(phone: string, text?: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  const intl = digits.startsWith('880')
    ? digits
    : digits.startsWith('0')
      ? `88${digits}`
      : `880${digits}`;
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${intl}${query}`;
}

export const AboutSection: React.FC<{ settings: SiteSettings }> = ({ settings }) => {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <img
            src="/lifecircle-logo.png"
            alt="lifecircle.bd লোগো"
            referrerPolicy="no-referrer"
            className="w-12 h-12 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1"
          />
          <div>
            <p className="text-xs font-semibold text-[#2DA94F]">আমাদের সম্পর্কে (About Us)</p>
            <h2 className="text-2xl font-bold text-[#1D2B53] dark:text-white">
              {settings.aboutTitle || settings.companyName}
            </h2>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          {settings.aboutDescription}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <p className="font-mono-num text-2xl font-bold text-[#2D89C8]">১০০%</p>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              অফিসিয়াল ওয়ারেন্টি ও অথেনটিক মেডিকেল ডিভাইস
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <p className="font-mono-num text-2xl font-bold text-[#2DA94F]">৬৪ জেলা</p>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              সারা বাংলাদেশে ডেলিভারি ও টেকনিক্যাল সাপোর্ট
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <p className="font-mono-num text-2xl font-bold text-[#1D2B53] dark:text-sky-300">
              ২৪/৭
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              সরাসরি মানব-সাপোর্ট (কোনো AI চ্যাটবট নয়)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const FaqSection: React.FC<{ faqs: FaqItem[]; whatsapp?: string }> = ({
  faqs,
  whatsapp = '01754149749',
}) => {
  const sorted = [...faqs].sort((a, b) => a.order - b.order);
  const [openId, setOpenId] = useState<string>(sorted[0]?.id || '');
  const [highlightedId, setHighlightedId] = useState<string>('');
  const [askInput, setAskInput] = useState('');
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const jumpToQuestion = (id: string) => {
    setOpenId(id);
    setHighlightedId(id);
    window.setTimeout(() => {
      itemRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    window.setTimeout(() => {
      setHighlightedId((prev) => (prev === id ? '' : prev));
    }, 2400);
  };

  const handleAskJump = (e: React.FormEvent) => {
    e.preventDefault();
    const q = askInput.trim().toLowerCase();
    if (!q) return;
    const match = sorted.find(
      (item) =>
        item.questionBn.toLowerCase().includes(q) ||
        item.answerBn.toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
    );
    if (match) {
      jumpToQuestion(match.id);
    } else if (sorted[0]) {
      jumpToQuestion(sorted[0].id);
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <p className="text-xs font-semibold text-[#2D89C8]">জিজ্ঞাসা ও উত্তর (FAQ)</p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#1D2B53] dark:text-white">
          সাধারণ প্রশ্নোত্তর — প্রশ্ন নির্বাচন করলেই সরাসরি উত্তরে নিয়ে যাবে
        </h2>
      </div>

      {/* Quick Question Finder & Jump Buttons */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <form onSubmit={handleAskJump} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              placeholder="আপনার প্রশ্ন লিখুন (যেমন: স্লিপ টেস্ট, BiPAP, NPV মাস্ক, 2FA)..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs sm:text-sm font-semibold whitespace-nowrap"
          >
            উত্তর দেখুন
          </button>
        </form>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#2DA94F]" />
            <span>যেকোনো প্রশ্নে ক্লিক করলে সরাসরি উত্তরে নিয়ে যাবে:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sorted.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => jumpToQuestion(item.id)}
                className={`protected-question text-left px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  openId === item.id
                    ? 'bg-[#1D2B53] text-white border-[#1D2B53]'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2D89C8]'
                }`}
              >
                {idx + 1}. {item.questionBn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Answer List */}
      <div className="space-y-3">
        {sorted.map((item, idx) => {
          const isOpen = openId === item.id;
          const isHighlighted = highlightedId === item.id;
          return (
            <div
              key={item.id}
              id={`faq-answer-${item.id}`}
              ref={(el) => {
                itemRefs.current[item.id] = el;
              }}
              className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden transition-all ${
                isHighlighted
                  ? 'border-[#2DA94F] ring-2 ring-[#2DA94F]/40'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <button
                onClick={() => setOpenId(isOpen ? '' : item.id)}
                className="protected-question w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
              >
                <span className="text-sm sm:text-base font-semibold text-[#1D2B53] dark:text-white">
                  {idx + 1}. {item.questionBn}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="protected-question px-5 pb-4 pt-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed border-t border-slate-100 dark:border-slate-800 bg-sky-50/40 dark:bg-sky-950/20">
                  {item.answerBn}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ask Directly on WhatsApp if not answered */}
      <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#1D2B53] dark:text-white">
            আপনার নির্দিষ্ট প্রশ্নটি খুঁজে পাননি?
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            সরাসরি আমাদের WhatsApp (<span className="font-mono-num font-bold">{whatsapp}</span>)-এ প্রশ্ন পাঠান; সাথে সাথে নোটিফিকেশন পৌঁছে যাবে।
          </p>
        </div>
        <a
          href={buildWhatsAppLink(
            whatsapp,
            askInput.trim()
              ? `আসসালামু আলাইকুম lifecircle.bd, আমার প্রশ্ন: ${askInput.trim()}`
              : 'আসসালামু আলাইকুম lifecircle.bd, আমার একটি প্রশ্ন আছে।'
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] text-white text-xs font-semibold"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp-এ প্রশ্ন করুন
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  );
};

interface ContactAndFeedbackProps {
  settings: SiteSettings;
  isAuthenticated: boolean;
  userName?: string | null;
  onRequireSignIn: () => void;
  onOpenChat: () => void;
  onSubmitFeedback: (
    data: Omit<FeedbackItem, 'id' | 'ownerUid' | 'status' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
}

export const ContactAndFeedbackSection: React.FC<ContactAndFeedbackProps> = ({
  settings,
  isAuthenticated,
  userName,
  onRequireSignIn,
  onOpenChat,
  onSubmitFeedback,
}) => {
  const [name, setName] = useState(userName || '');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<FeedbackItem['category']>('product');
  const [message, setMessage] = useState('');
  const [waQuestion, setWaQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState('');

  const whatsappNum = settings.whatsapp || settings.phonePrimary || '01754149749';
  const bkashNum = settings.bkash || '01711480987';
  const allAddresses = [
    ...(settings.address && settings.address.trim() ? [settings.address.trim()] : []),
    ...(settings.addresses || []).filter((a) => a && a.trim() && a.trim() !== settings.address?.trim()),
  ];

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSubmitted(false);
    if (!isAuthenticated) {
      onRequireSignIn();
      return;
    }
    if (name.trim().length < 1 || message.trim().length < 3) {
      setErr('অনুগ্রহ করে আপনার নাম ও মতামত লিখুন।');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmitFeedback({
        name: name.trim().slice(0, FIELD_LIMITS.NAME_MAX),
        phone: phone.trim().slice(0, FIELD_LIMITS.PHONE_MAX),
        rating,
        category,
        message: message.trim().slice(0, FIELD_LIMITS.MESSAGE_MAX),
      });
      setSubmitted(true);
      setMessage('');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'মতামত পাঠানো যায়নি।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Details (Live Editable from Admin Dashboard) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
          <div>
            <p className="text-xs font-semibold text-[#2DA94F]">আমাদের সাথে যোগাযোগ</p>
            <h2 className="mt-1 text-2xl font-bold text-[#1D2B53] dark:text-white">
              {settings.companyName} অফিস ও স্লিপ সেন্টার
            </h2>
          </div>

          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#2D89C8] shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  ঠিকানা (Address)
                </span>
                {allAddresses.length === 0 ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ঢাকা, বাংলাদেশ (হোম ডেলিভারি ও হোম স্লিপ টেস্ট সারা দেশে)
                  </span>
                ) : (
                  <ul className="space-y-1 mt-0.5">
                    {allAddresses.map((addr, idx) => (
                      <li key={idx} className="text-sm">
                        {addr}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-[#2DA94F] shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  WhatsApp ও হটলাইন নম্বর
                </span>
                <a
                  href={`tel:${whatsappNum.replace(/[^\d+]/g, '')}`}
                  className="font-mono-num font-bold text-[#1D2B53] dark:text-white hover:underline"
                >
                  {whatsappNum}
                </a>
                <div className="mt-1">
                  <a
                    href={buildWhatsAppLink(whatsappNum)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2DA94F] hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp-এ সরাসরি মেসেজ করুন ({whatsappNum})</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  বিকাশ নম্বর (bKash)
                </span>
                <span className="font-mono-num font-bold text-[#1D2B53] dark:text-white">
                  {bkashNum}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-[#2D89C8] shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  ইমেইল
                </span>
                <a
                  href={`mailto:${settings.email}`}
                  className="font-medium text-[#2D89C8] hover:underline"
                >
                  {settings.email}
                </a>
              </div>
            </div>

            {settings.hours && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#2DA94F] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    সেবার সময়সূচি
                  </span>
                  <span>{settings.hours}</span>
                </div>
              </div>
            )}
          </div>

          {/* Direct WhatsApp Question Box */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2.5">
            <p className="text-xs font-bold text-[#1D2B53] dark:text-white">
              তাৎক্ষণিক প্রশ্ন WhatsApp-এ পাঠান
            </p>
            <input
              type="text"
              value={waQuestion}
              onChange={(e) => setWaQuestion(e.target.value)}
              placeholder="আপনার প্রশ্ন লিখুন..."
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
            />
            <a
              href={buildWhatsAppLink(
                whatsappNum,
                waQuestion.trim()
                  ? `lifecircle.bd ওয়েবসাইট থেকে প্রশ্ন: ${waQuestion.trim()}`
                  : 'আসসালামু আলাইকুম lifecircle.bd, আমার একটি প্রশ্ন আছে।'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] text-white text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              WhatsApp ({whatsappNum})-এ পাঠান
            </a>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onOpenChat}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D2B53] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#2DA94F]" />
              সরাসরি আমাদের প্রতিনিধির সাথে লাইভ চ্যাট করুন
            </button>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2DA94F]" />
              <span>১০০% মানব-সাপোর্ট (কোনো AI চ্যাটবট নয়)</span>
            </p>
          </div>
        </div>

        {/* User Feedback Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          <p className="text-xs font-semibold text-[#2D89C8]">মতামত ও মূল্যায়ন</p>
          <h3 className="mt-1 text-xl sm:text-2xl font-bold text-[#1D2B53] dark:text-white">
            ব্যবহারকারী ফিডব্যাক ফর্ম
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            আমাদের যন্ত্রপাতি, স্লিপ টেস্ট বা সেবার মান সম্পর্কে আপনার অভিজ্ঞতা জানান।
          </p>

          <form onSubmit={handleFeedback} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  আপনার নাম *
                </label>
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.NAME_MAX}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  মোবাইল নম্বর (ঐচ্ছিক)
                </label>
                <input
                  type="tel"
                  maxLength={FIELD_LIMITS.PHONE_MAX}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-mono-num text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  বিষয়
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FeedbackItem['category'])}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                >
                  <option value="product">মেডিকেল যন্ত্রপাতি</option>
                  <option value="sleep-test">স্লিপ টেস্ট সেবা</option>
                  <option value="support">কাস্টমার সাপোর্ট</option>
                  <option value="website">ওয়েবসাইট অভিজ্ঞতা</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  রেটিং
                </label>
                <div className="flex items-center gap-1.5 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`${star} স্টার`}
                      className="p-1"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                আপনার মতামত *
              </label>
              <textarea
                rows={4}
                required
                maxLength={FIELD_LIMITS.MESSAGE_MAX}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="আপনার অভিজ্ঞতা বা পরামর্শ বিস্তারিত লিখুন..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>

            {err && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{err}</p>
            )}
            {submitted && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>ধন্যবাদ! আপনার মতামত অ্যাডমিনের কাছে পাঠানো হয়েছে।</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              {submitting ? 'পাঠানো হচ্ছে...' : isAuthenticated ? 'মতামত পাঠান' : 'সাইন ইন করে মতামত দিন'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
