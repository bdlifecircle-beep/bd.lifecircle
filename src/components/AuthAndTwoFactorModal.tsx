import React, { useState } from 'react';
import { KeyRound, Lock, Mail, Phone, ShieldCheck, X } from 'lucide-react';
import { verifyTotpCode } from '../lib/totp';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onGoogleDriveSignIn: () => Promise<void>;
  onEmailSignUp: (name: string, email: string, phone: string, password: string) => Promise<void>;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  onGoogleDriveSignIn,
  onEmailSignUp,
  onEmailSignIn,
}) => {
  const [mode, setMode] = useState<'google' | 'email-login' | 'email-signup'>('google');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  if (!open) return null;

  const handleGoogle = async () => {
    setErr('');
    setLoading(true);
    try {
      await onGoogleDriveSignIn();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'গুগল সাইন-ইন সম্পন্ন করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'email-signup') {
        await onEmailSignUp(name, email, phone, password);
        setInfo(
          'অ্যাকাউন্ট তৈরি হয়েছে! আপনার ইমেইলে একটি ভেরিফিকেশন লিংক পাঠানো হয়েছে। লিংকটি কনফার্ম করার পর ড্যাশবোর্ডে সব সুবিধা ব্যবহার করতে পারবেন।'
        );
      } else {
        await onEmailSignIn(email, password);
        onClose();
      }
    } catch (e2: unknown) {
      const msg = e2 instanceof Error ? e2.message : String(e2);
      if (msg.includes('operation-not-allowed')) {
        setErr(
          'Firebase Console-এ Email/Password Sign-In চালু নেই। অনুগ্রহ করে Firebase Console > Authentication > Sign-in method থেকে Email/Password চালু করুন, অথবা উপরের "Sign in with Google" বাটন ব্যবহার করুন।'
        );
      } else {
        setErr(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/lifecircle-logo.png"
              alt="lifecircle.bd"
              referrerPolicy="no-referrer"
              className="w-7 h-7 object-contain rounded bg-white p-0.5"
            />
            <h3 className="text-base font-bold text-[#1D2B53] dark:text-white">
              lifecircle.bd অ্যাকাউন্ট
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Official Sign in with Google button (with Google Drive backup scope) */}
          <div className="space-y-2.5">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              আপনার সব তথ্য সংরক্ষণ ও সরাসরি <strong>Google Drive</strong>-এ স্বয়ংক্রিয় ব্যাকআপ রাখতে গুগল দিয়ে সাইন ইন করুন:
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100 shadow-xs transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>Sign in with Google (Drive ব্যাকআপ সহ)</span>
            </button>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="mx-3 text-xs text-slate-400">অথবা ইমেইল ও মোবাইল নম্বর দিয়ে</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('email-login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md ${
                mode === 'email-login'
                  ? 'bg-white dark:bg-slate-900 text-[#1D2B53] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              ইমেইল লগইন
            </button>
            <button
              type="button"
              onClick={() => setMode('email-signup')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md ${
                mode === 'email-signup'
                  ? 'bg-white dark:bg-slate-900 text-[#1D2B53] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              নতুন অ্যাকাউন্ট খুলুন
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === 'email-signup' && (
              <>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="আপনার পূর্ণ নাম"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="মোবাইল নম্বর (+880 17...)"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-mono-num"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ইমেইল ঠিকানা"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>

            {err && (
              <p className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs">
                {err}
              </p>
            )}
            {info && (
              <p className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-sm font-semibold transition-colors"
            >
              {loading
                ? 'অপেক্ষা করুন...'
                : mode === 'email-signup'
                  ? 'অ্যাকাউন্ট তৈরি করুন'
                  : 'ইমেইল দিয়ে প্রবেশ করুন'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

interface TwoFactorChallengeModalProps {
  open: boolean;
  secret: string;
  backupCodes: string[];
  onVerified: (usedBackupCode?: string) => void;
  onLogout: () => void;
}

export const TwoFactorChallengeModal: React.FC<TwoFactorChallengeModalProps> = ({
  open,
  secret,
  backupCodes,
  onVerified,
  onLogout,
}) => {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  if (!open) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    const cleaned = code.trim().toUpperCase();

    if (verifyTotpCode(secret, cleaned)) {
      onVerified();
      return;
    }

    if (backupCodes.includes(cleaned)) {
      onVerified(cleaned);
      return;
    }

    setErr('ভুল কোড! আপনার Authenticator অ্যাপের ৬-ডিজিট কোড বা রিকভারি কোড দিন।');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-[#2D89C8]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1D2B53] dark:text-white">
              টু-ফ্যাক্টর যাচাইকরণ (2FA)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              অ্যাকাউন্ট সুরক্ষার জন্য ৬-ডিজিট কোড দিন
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-3">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="৬-ডিজিট কোড বা XXXX-XXXX"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono-num text-sm tracking-widest"
            />
          </div>

          {err && <p className="text-xs text-rose-600 font-medium">{err}</p>}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] text-white text-sm font-semibold"
          >
            যাচাই করে প্রবেশ করুন
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            অন্য অ্যাকাউন্ট দিয়ে লগইন করুন (লগআউট)
          </button>
        </form>
      </div>
    </div>
  );
};

interface HiddenAdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onAdminAuthenticated: (token: string, identifier: string) => void;
}

export const HiddenAdminLoginModal: React.FC<HiddenAdminLoginModalProps> = ({
  open,
  onClose,
  onAdminAuthenticated,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  React.useEffect(() => {
    if (!open) return;
    setErr('');
    fetch('/api/admin/status')
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => setConfigured(!!d.configured))
      .catch(() => setConfigured(true));
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const endpoint =
        configured === false ? '/api/admin/bootstrap-secret' : '/api/admin/verify-secret';
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          secretCode: secretCode.trim(),
        }),
      });
      const data = (await resp.json()) as {
        token?: string;
        identifier?: string;
        error?: string;
      };
      if (!resp.ok || !data.token) {
        setErr(data.error || 'অ্যাডমিন যাচাই সম্পন্ন হয়নি।');
        return;
      }
      setSecretCode('');
      onAdminAuthenticated(data.token, data.identifier || identifier.trim());
      onClose();
    } catch {
      setErr('সার্ভারের সাথে সংযোগ করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-[#1D2B53] text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2DA94F]" />
            <h3 className="text-sm font-bold">গোপন অ্যাডমিন প্রবেশ (Admin Access)</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {configured === false && (
            <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              প্রথমবার সেটআপ: আপনার অনুমোদিত Gmail বা মোবাইল নম্বর এবং নতুন সিক্রেট কোড (কমপক্ষে ৬ অক্ষর) সেট করে প্রবেশ করুন।
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              অ্যাডমিন Gmail বা মোবাইল নম্বর *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Gmail অথবা মোবাইল নম্বর"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              সিক্রেট কোড (Secret Code) *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              placeholder="সিক্রেট কোড লিখুন"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-mono-num"
            />
          </div>

          {err && (
            <p className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-medium">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] disabled:opacity-60 text-white text-sm font-semibold"
          >
            {loading
              ? 'যাচাই হচ্ছে...'
              : configured === false
                ? 'সিক্রেট কোড সেট ও প্রবেশ করুন'
                : 'অ্যাডমিন প্যানেলে প্রবেশ করুন'}
          </button>
        </form>
      </div>
    </div>
  );
};

interface RegistrationNoticePopupProps {
  open: boolean;
  onRegister: () => void;
  onDismiss: () => void;
}

export const RegistrationNoticePopup: React.FC<RegistrationNoticePopupProps> = ({
  open,
  onRegister,
  onDismiss,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <button
          type="button"
          onClick={onDismiss}
          aria-label="নোটিশ বন্ধ করুন"
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <img
            src="/lifecircle-logo.png"
            alt="lifecircle.bd"
            referrerPolicy="no-referrer"
            className="w-10 h-10 object-contain rounded-lg bg-white p-0.5 border border-slate-200 dark:border-slate-700"
          />
          <div>
            <p className="text-xs font-semibold text-[#2DA94F]">lifecircle.bd</p>
            <h3 className="text-base sm:text-lg font-bold text-[#1D2B53] dark:text-white">
              আপনার তথ্য সংরক্ষণ করতে রেজিস্ট্রেশন করুন
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          To save your info, please register. আপনার অ্যাপয়েন্টমেন্ট, পণ্যের তালিকা এবং স্বাস্থ্য তথ্য নিরাপদে সংরক্ষণ করতে একটি অ্যাকাউন্ট তৈরি করুন।
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onRegister}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs sm:text-sm font-semibold"
          >
            রেজিস্টার করুন (Register)
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

