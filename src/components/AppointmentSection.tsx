import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, LogIn } from 'lucide-react';
import { Appointment, FIELD_LIMITS } from '../types';

interface AppointmentSectionProps {
  defaultServiceType: Appointment['serviceType'];
  userEmail?: string | null;
  userName?: string | null;
  userPhone?: string;
  userAddress?: string;
  isAuthenticated: boolean;
  onRequireSignIn: () => void;
  onCreateAppointment: (
    data: Omit<Appointment, 'id' | 'ownerUid' | 'status' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
}

export const AppointmentSection: React.FC<AppointmentSectionProps> = ({
  defaultServiceType,
  userEmail,
  userName,
  userPhone,
  userAddress,
  isAuthenticated,
  onRequireSignIn,
  onCreateAppointment,
}) => {
  const [patientName, setPatientName] = useState(userName || '');
  const [phone, setPhone] = useState(userPhone || '');
  const [email, setEmail] = useState(userEmail || '');
  const [serviceType, setServiceType] =
    useState<Appointment['serviceType']>(defaultServiceType);
  const [preferredDate, setPreferredDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [preferredSlot, setPreferredSlot] = useState('সকাল ১০:০০ - ১২:০০');
  const [address, setAddress] = useState(userAddress || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isAuthenticated) {
      onRequireSignIn();
      return;
    }

    if (patientName.trim().length < 2 || phone.trim().length < 6 || address.trim().length < 3) {
      setErrorMsg('অনুগ্রহ করে রোগীর নাম, সঠিক ফোন নম্বর এবং ঠিকানা লিখুন।');
      return;
    }

    setSubmitting(true);
    try {
      await onCreateAppointment({
        patientName: patientName.trim().slice(0, FIELD_LIMITS.NAME_MAX),
        phone: phone.trim().slice(0, FIELD_LIMITS.PHONE_MAX),
        email: email.trim().slice(0, FIELD_LIMITS.EMAIL_MAX),
        serviceType,
        preferredDate,
        preferredSlot,
        address: address.trim().slice(0, FIELD_LIMITS.ADDRESS_MAX),
        notes: notes.trim().slice(0, FIELD_LIMITS.NOTES_MAX),
      });
      setSuccessMsg(
        'আপনার অনলাইন অ্যাপয়েন্টমেন্ট সফলভাবে বুক হয়েছে! ড্যাশবোর্ডে স্ট্যাটাস দেখতে পারবেন।'
      );
      setNotes('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'অ্যাপয়েন্টমেন্ট সংরক্ষণ করা যায়নি।'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <p className="text-xs font-semibold text-[#2DA94F]">অনলাইন অ্যাপয়েন্টমেন্ট সিস্টেম</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#1D2B53] dark:text-white">
            স্লিপ টেস্ট বা মেডিকেল যন্ত্র সেটআপের সময় বুক করুন
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
            ফর্ম পূরণ করলে আপনার অ্যাকাউন্ট ও গুগল ড্রাইভে অ্যাপয়েন্টমেন্ট রেকর্ড সংরক্ষিত থাকবে এবং রিয়েল-টাইম নোটিফিকেশন পাবেন।
          </p>
        </div>

        {!isAuthenticated && (
          <div className="mt-6 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              অ্যাপয়েন্টমেন্ট সংরক্ষণ এবং রিয়েল-টাইম আপডেট পেতে অনুগ্রহ করে সাইন ইন করুন।
            </p>
            <button
              type="button"
              onClick={onRequireSignIn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs font-semibold"
            >
              <LogIn className="w-4 h-4" />
              অ্যাকাউন্টে সাইন ইন করুন
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                রোগীর পূর্ণ নাম *
              </label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.NAME_MAX}
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D89C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                মোবাইল নম্বর *
              </label>
              <input
                type="tel"
                required
                maxLength={FIELD_LIMITS.PHONE_MAX}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 17XX-XXXXXX"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D89C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                সেবার ধরন *
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as Appointment['serviceType'])}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D89C8]"
              >
                <option value="home-sleep-test">হোম স্লিপ টেস্ট (বাসায় এসে টেস্ট)</option>
                <option value="clinic-sleep-test">ক্লিনিক স্লিপ টেস্ট (Polysomnography)</option>
                <option value="cpap-bipap-setup">CPAP / BiPAP মেশিন হোম সেটআপ</option>
                <option value="device-demo">মেডিকেল যন্ত্র ডেমো ও পরামর্শ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                ইমেইল (ঐচ্ছিক)
              </label>
              <input
                type="email"
                maxLength={FIELD_LIMITS.EMAIL_MAX}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D89C8]"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#2D89C8]" />
                <span>পছন্দের তারিখ *</span>
              </label>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-mono-num text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D89C8]"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-[#2DA94F]" />
                <span>সময় স্লট *</span>
              </label>
              <select
                value={preferredSlot}
                onChange={(e) => setPreferredSlot(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D89C8]"
              >
                <option value="সকাল ১০:০০ - ১২:০০">সকাল ১০:০০ - ১২:০০</option>
                <option value="দুপুর ০২:০০ - ০৪:০০">দুপুর ০২:০০ - ০৪:০০</option>
                <option value="সন্ধ্যা ০৬:০০ - ০৮:০০">সন্ধ্যা ০৬:০০ - ০৮:০০</option>
                <option value="রাত ০৯:০০ (স্লিপ টেস্ট সেটআপ)">রাত ০৯:০০ (স্লিপ টেস্ট সেটআপ)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              সম্পূর্ণ ঠিকানা *
            </label>
            <input
              type="text"
              required
              maxLength={FIELD_LIMITS.ADDRESS_MAX}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="বাসা/ফ্ল্যাট নং, রোড, এলাকা ও জেলা"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D89C8]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              রোগীর অবস্থা বা বিশেষ নোট (ঐচ্ছিক)
            </label>
            <textarea
              rows={3}
              maxLength={FIELD_LIMITS.NOTES_MAX}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: নাক ডাকা ও রাতে শ্বাস আটকে যাওয়ার সমস্যা..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D89C8]"
            />
          </div>

          {errorMsg && (
            <p className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {submitting ? 'সংরক্ষণ হচ্ছে...' : 'অ্যাপয়েন্টমেন্ট নিশ্চিত করুন'}
          </button>
        </form>
      </div>
    </section>
  );
};
