import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Cloud,
  CloudUpload,
  HardDrive,
  KeyRound,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import {
  Appointment,
  FIELD_LIMITS,
  Order,
  UserProfile,
  UserTwoFactor,
} from '../types';
import {
  checkBackupExists,
  deleteBackupFromDrive,
  downloadBackupFromDrive,
  DriveBackupPayload,
  DriveFileMeta,
  listDriveBackups,
} from '../lib/googleDrive';
import { createTotpSetup, TotpSetupBundle, verifyTotpCode } from '../lib/totp';

interface UserDashboardProps {
  profile: UserProfile | null;
  twoFactor: UserTwoFactor | null;
  appointments: Appointment[];
  orders: Order[];
  hasDriveToken: boolean;
  isOnline: boolean;
  onReconnectDrive: () => Promise<void>;
  onUpdateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  onCancelAppointment: (id: string) => Promise<void>;
  onCancelOrder: (id: string) => Promise<void>;
  onBackupNow: () => Promise<DriveFileMeta>;
  onEnableTwoFactor: (secret: string, backupCodes: string[]) => Promise<void>;
  onDisableTwoFactor: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  profile,
  twoFactor,
  appointments,
  orders,
  hasDriveToken,
  isOnline,
  onReconnectDrive,
  onUpdateProfile,
  onCancelAppointment,
  onCancelOrder,
  onBackupNow,
  onEnableTwoFactor,
  onDisableTwoFactor,
  onLogout,
}) => {
  const [tab, setTab] = useState<'overview' | 'drive' | 'security'>('overview');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [profile]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFileMeta[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveMsg, setDriveMsg] = useState('');
  const [driveErr, setDriveErr] = useState('');
  const [confirmAction, setConfirmAction] = useState<
    | { type: 'overwrite-backup'; existingFile: DriveFileMeta }
    | { type: 'delete-drive-file'; file: DriveFileMeta }
    | { type: 'restore-drive-file'; file: DriveFileMeta }
    | null
  >(null);
  const [restoredPreview, setRestoredPreview] = useState<DriveBackupPayload | null>(null);

  // 2FA state
  const [totpBundle, setTotpBundle] = useState<TotpSetupBundle | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [totpErr, setTotpErr] = useState('');
  const [totpSuccess, setTotpSuccess] = useState('');

  if (!profile) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      await onUpdateProfile({
        displayName: displayName.trim().slice(0, FIELD_LIMITS.NAME_MAX),
        phone: phone.trim().slice(0, FIELD_LIMITS.PHONE_MAX),
        address: address.trim().slice(0, FIELD_LIMITS.ADDRESS_MAX),
      });
      setProfileMsg('আপনার প্রোফাইল তথ্য সংরক্ষিত হয়েছে ও অফলাইন ক্যাশে সিঙ্ক হয়েছে।');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLoadDriveFiles = async () => {
    setDriveErr('');
    setDriveLoading(true);
    try {
      const files = await listDriveBackups();
      setDriveFiles(files);
    } catch (e) {
      setDriveErr(
        e instanceof Error && e.message === 'NO_DRIVE_TOKEN'
          ? 'Google Drive অ্যাক্সেস টোকেন সক্রিয় করতে পুনরায় Google দিয়ে সাইন ইন করুন।'
          : e instanceof Error
            ? e.message
            : 'Google Drive ফাইল লোড করা যায়নি।'
      );
    } finally {
      setDriveLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    setDriveErr('');
    setDriveMsg('');
    setDriveLoading(true);
    try {
      const existing = await checkBackupExists();
      if (existing) {
        setConfirmAction({ type: 'overwrite-backup', existingFile: existing });
        setDriveLoading(false);
        return;
      }
      const meta = await onBackupNow();
      setDriveMsg(`সফলভাবে Google Drive-এ সংরক্ষিত হয়েছে (${meta.name})`);
      await handleLoadDriveFiles();
    } catch (e) {
      setDriveErr(e instanceof Error ? e.message : 'ব্যাকআপ ব্যর্থ হয়েছে।');
      setDriveLoading(false);
    }
  };

  const executeConfirmedDriveAction = async () => {
    if (!confirmAction) return;
    setDriveLoading(true);
    setDriveErr('');
    setDriveMsg('');
    try {
      if (confirmAction.type === 'overwrite-backup') {
        const meta = await onBackupNow();
        setDriveMsg(`Google Drive ব্যাকআপ ফাইল হালনাগাদ হয়েছে (${meta.name})`);
        await handleLoadDriveFiles();
      } else if (confirmAction.type === 'delete-drive-file') {
        await deleteBackupFromDrive(confirmAction.file.id);
        setDriveMsg(`"${confirmAction.file.name}" Google Drive থেকে মুছে ফেলা হয়েছে।`);
        await handleLoadDriveFiles();
      } else if (confirmAction.type === 'restore-drive-file') {
        const data = await downloadBackupFromDrive(confirmAction.file.id);
        setRestoredPreview(data);
        if (data.user) {
          await onUpdateProfile({
            displayName: data.user.displayName || profile.displayName,
            phone: data.user.phone || profile.phone || '',
            address: data.user.address || profile.address || '',
          });
        }
        setDriveMsg(`Google Drive ব্যাকআপ (${data.exportedAt}) থেকে তথ্য পুনরুদ্ধার হয়েছে।`);
      }
    } catch (e) {
      setDriveErr(e instanceof Error ? e.message : 'Google Drive অপারেশন ব্যর্থ হয়েছে।');
    } finally {
      setConfirmAction(null);
      setDriveLoading(false);
    }
  };

  const handleStart2FASetup = async () => {
    setTotpErr('');
    setTotpSuccess('');
    const bundle = await createTotpSetup(profile.email || profile.displayName);
    setTotpBundle(bundle);
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpBundle) return;
    setTotpErr('');
    if (!verifyTotpCode(totpBundle.secret, totpVerifyCode)) {
      setTotpErr('ভুল কোড! অনুগ্রহ করে Authenticator অ্যাপ থেকে বর্তমান ৬-ডিজিট কোড দিন।');
      return;
    }
    await onEnableTwoFactor(totpBundle.secret, totpBundle.backupCodes);
    setTotpBundle(null);
    setTotpVerifyCode('');
    setTotpSuccess('টু-ফ্যাক্টর অথেন্টিকেশন (2FA) সফলভাবে চালু হয়েছে!');
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Dashboard Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#2D89C8]/15 text-[#2D89C8] flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1D2B53] dark:text-white">
                {profile.displayName} — ব্যবহারকারী ড্যাশবোর্ড
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {profile.email} · {isOnline ? 'অনলাইন সিঙ্ক সক্রিয়' : 'অফলাইন ক্যাশ মোড'} ·{' '}
                {twoFactor?.enabled ? '2FA সুরক্ষিত' : '2FA চালু নেই'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                onClick={() => setTab('overview')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                  tab === 'overview'
                    ? 'bg-white dark:bg-slate-900 text-[#1D2B53] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                তথ্য ও বুকিং
              </button>
              <button
                onClick={() => {
                  setTab('drive');
                  if (hasDriveToken) handleLoadDriveFiles();
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                  tab === 'drive'
                    ? 'bg-white dark:bg-slate-900 text-[#1D2B53] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                গুগল ড্রাইভ ব্যাকআপ
              </button>
              <button
                onClick={() => setTab('security')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                  tab === 'security'
                    ? 'bg-white dark:bg-slate-900 text-[#1D2B53] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                2FA নিরাপত্তা
              </button>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              লগআউট
            </button>
          </div>
        </div>

        {/* Tab 1: Overview, Profile, Appointments, Orders */}
        {tab === 'overview' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-bold text-[#1D2B53] dark:text-white">
                ব্যক্তিগত তথ্য ও ঠিকানা
              </h3>
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 17XX-XXXXXX"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    ডেলিভারি / বাসার ঠিকানা
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm"
                  />
                </div>
                {profileMsg && (
                  <p className="text-xs text-[#2DA94F] font-medium">{profileMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs font-semibold"
                >
                  {savingProfile ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল সংরক্ষণ করুন'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#1D2B53] dark:text-white mb-3">
                  <Calendar className="w-4 h-4 text-[#2DA94F]" />
                  <span>আমার অ্যাপয়েন্টমেন্ট ({appointments.length})</span>
                </h3>
                {appointments.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    এখনো কোনো অ্যাপয়েন্টমেন্ট বুক করা হয়নি।
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#1D2B53] dark:text-white">
                            {apt.serviceType} · <span className="font-mono-num">{apt.preferredDate}</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {apt.preferredSlot} · {apt.address}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#2D89C8]">
                            {apt.status}
                          </span>
                          {apt.status === 'pending' && (
                            <button
                              onClick={() => onCancelAppointment(apt.id)}
                              className="px-2.5 py-1 rounded-md border border-rose-200 text-rose-600 text-[11px] hover:bg-rose-50"
                            >
                              বাতিল
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#1D2B53] dark:text-white mb-3">
                  <ShoppingBag className="w-4 h-4 text-[#2D89C8]" />
                  <span>আমার অর্ডার ({orders.length})</span>
                </h3>
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    এখনো কোনো যন্ত্রপাতি অর্ডার করা হয়নি।
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#1D2B53] dark:text-white">
                            {ord.items.map((i) => `${i.nameBn} (×${i.quantity})`).join(', ')}
                          </p>
                          <p className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                            মোট পণ্য: {ord.items.reduce((s, i) => s + i.quantity, 0)} টি · {ord.paymentMethod.toUpperCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#2DA94F]">
                            {ord.status}
                          </span>
                          {ord.status === 'pending' && (
                            <button
                              onClick={() => onCancelOrder(ord.id)}
                              className="px-2.5 py-1 rounded-md border border-rose-200 text-rose-600 text-[11px] hover:bg-rose-50"
                            >
                              বাতিল
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Google Drive Backup & Offline Sync */}
        {tab === 'drive' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-[#1D2B53] dark:text-white">
                  <Cloud className="w-5 h-5 text-[#2D89C8]" />
                  <span>Google Drive স্বয়ংক্রিয় ব্যাকআপ ও অফলাইন সিঙ্ক</span>
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  আপনার ব্যক্তিগত তথ্য, অ্যাপয়েন্টমেন্ট ও অর্ডার রেকর্ড আপনার নিজের Google Drive-এর{' '}
                  <strong>"lifecircle.bd Backups"</strong> ফোল্ডারে সংরক্ষিত থাকে।
                </p>
                {profile.lastDriveSyncAt && (
                  <p className="mt-1 font-mono-num text-xs text-[#2DA94F]">
                    সর্বশেষ ড্রাইভ সিঙ্ক: {new Date(profile.lastDriveSyncAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.driveBackupEnabled}
                    onChange={(e) =>
                      onUpdateProfile({ driveBackupEnabled: e.target.checked })
                    }
                    className="rounded border-slate-300 text-[#2DA94F] focus:ring-[#2DA94F]"
                  />
                  <span>স্বয়ংক্রিয় ব্যাকআপ চালু</span>
                </label>

                {!hasDriveToken ? (
                  <button
                    onClick={onReconnectDrive}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs font-semibold"
                  >
                    <HardDrive className="w-4 h-4" />
                    Google Drive সংযুক্ত করুন
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTriggerBackup}
                      disabled={driveLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] disabled:opacity-50 text-white text-xs font-semibold"
                    >
                      <CloudUpload className="w-4 h-4" />
                      এখনই ব্যাকআপ নিন
                    </button>
                    <button
                      onClick={handleLoadDriveFiles}
                      disabled={driveLoading}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                      title="রিফ্রেশ"
                    >
                      <RefreshCw className={`w-4 h-4 ${driveLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {driveErr && (
              <p className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
                {driveErr}
              </p>
            )}
            {driveMsg && (
              <p className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{driveMsg}</span>
              </p>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Google Drive-এ সংরক্ষিত ব্যাকআপ ফাইলসমূহ
              </h4>
              {driveFiles.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  {hasDriveToken
                    ? 'কোনো ব্যাকআপ ফাইল পাওয়া যায়নি। "এখনই ব্যাকআপ নিন" বাটনে ক্লিক করুন।'
                    : 'ফাইল দেখতে উপরের "Google Drive সংযুক্ত করুন" বাটনে ক্লিক করুন।'}
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {driveFiles.map((f) => (
                    <div key={f.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#1D2B53] dark:text-white">
                          {f.name}
                        </p>
                        <p className="font-mono-num text-[11px] text-slate-500">
                          আপডেট: {f.modifiedTime ? new Date(f.modifiedTime).toLocaleString() : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setConfirmAction({ type: 'restore-drive-file', file: f })}
                          className="px-3 py-1.5 rounded-lg border border-[#2D89C8] text-[#2D89C8] text-xs font-semibold hover:bg-sky-50 dark:hover:bg-sky-950/30"
                        >
                          রিস্টোর করুন
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'delete-drive-file', file: f })}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {restoredPreview && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <p className="font-bold text-[#1D2B53] dark:text-white">
                  রিস্টোরকৃত ব্যাকআপ সারসংক্ষেপ ({restoredPreview.exportedAt}):
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  অ্যাপয়েন্টমেন্ট: {restoredPreview.appointments.length}টি · অর্ডার: {restoredPreview.orders.length}টি · ফিডব্যাক: {restoredPreview.feedback.length}টি
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Two-Factor Authentication (2FA) */}
        {tab === 'security' && (
          <div className="p-6 max-w-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-[#1D2B53] dark:text-white">
                  <ShieldCheck className="w-5 h-5 text-[#2DA94F]" />
                  <span>টু-ফ্যাক্টর অথেন্টিকেশন (TOTP 2FA)</span>
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Google Authenticator বা Authy অ্যাপের মাধ্যমে আপনার অ্যাকাউন্টে অতিরিক্ত নিরাপত্তা স্তর যুক্ত করুন।
                </p>
              </div>
              <span
                className={`text-xs font-bold ${
                  twoFactor?.enabled ? 'text-[#2DA94F]' : 'text-amber-600'
                }`}
              >
                {twoFactor?.enabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
              </span>
            </div>

            {totpSuccess && (
              <p className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                {totpSuccess}
              </p>
            )}

            {twoFactor?.enabled ? (
              <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4">
                <p className="text-sm font-semibold text-[#1D2B53] dark:text-white">
                  আপনার অ্যাকাউন্ট ২FA দিয়ে সুরক্ষিত রয়েছে।
                </p>
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                    জরুরি ব্যাকআপ রিকভারি কোডসমূহ (নিরাপদ স্থানে লিখে রাখুন):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {twoFactor.backupCodes.map((c) => (
                      <code
                        key={c}
                        className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono-num text-xs text-center"
                      >
                        {c}
                      </code>
                    ))}
                  </div>
                </div>
                <button
                  onClick={onDisableTwoFactor}
                  className="px-4 py-2 rounded-lg border border-rose-300 text-rose-600 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  2FA বন্ধ করুন
                </button>
              </div>
            ) : !totpBundle ? (
              <button
                onClick={handleStart2FASetup}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs sm:text-sm font-semibold"
              >
                <KeyRound className="w-4 h-4" />
                2FA সেটআপ শুরু করুন
              </button>
            ) : (
              <form
                onSubmit={handleConfirm2FA}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-4"
              >
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium">
                  ১. Google Authenticator বা Authy অ্যাপ দিয়ে নিচের QR কোডটি স্ক্যান করুন:
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <img
                    src={totpBundle.qrDataUrl}
                    alt="2FA QR Code"
                    className="w-44 h-44 rounded-xl bg-white p-2 border border-slate-200"
                  />
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-500">অথবা ম্যানুয়াল সেটআপ কী ব্যবহার করুন:</p>
                    <code className="block p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono-num break-all">
                      {totpBundle.secret}
                    </code>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    ২. অ্যাপে দেখানো ৬-ডিজিট কোড লিখুন:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={totpVerifyCode}
                    onChange={(e) => setTotpVerifyCode(e.target.value)}
                    placeholder="123456"
                    className="w-48 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono-num text-sm tracking-widest"
                  />
                </div>

                {totpErr && <p className="text-xs text-rose-600">{totpErr}</p>}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] text-white text-xs font-semibold"
                  >
                    যাচাই করে 2FA চালু করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => setTotpBundle(null)}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium"
                  >
                    বাতিল
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Explicit Confirmation Dialog for Google Drive Mutations (Mandatory per Workspace Skill) */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-[#1D2B53] dark:text-white">
              Google Drive অপারেশন নিশ্চিত করুন
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmAction.type === 'overwrite-backup' &&
                `আপনার Google Drive-এ ইতিমধ্যে "${confirmAction.existingFile.name}" ব্যাকআপ ফাইল রয়েছে। আপনি কি এটি নতুন ডেটা দিয়ে হালনাগাদ (Overwrite) করতে চান?`}
              {confirmAction.type === 'delete-drive-file' &&
                `আপনি কি নিশ্চিত যে Google Drive থেকে "${confirmAction.file.name}" ফাইলটি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`}
              {confirmAction.type === 'restore-drive-file' &&
                `আপনি কি "${confirmAction.file.name}" ব্যাকআপ ফাইল থেকে আপনার প্রোফাইল তথ্য রিস্টোর করতে চান?`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                onClick={executeConfirmedDriveAction}
                disabled={driveLoading}
                className={`px-4 py-2 rounded-lg text-white text-xs font-semibold ${
                  confirmAction.type === 'delete-drive-file'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#2DA94F] hover:bg-[#248E41]'
                }`}
              >
                {driveLoading ? 'প্রসেস হচ্ছে...' : 'নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
