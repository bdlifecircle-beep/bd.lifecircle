import React, { useEffect, useState } from 'react';
import {
  Building,
  Calendar,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  FileArchive,
  HelpCircle,
  ImagePlus,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  UploadCloud,
  Users,
} from 'lucide-react';
import {
  AdminRole,
  Appointment,
  Banner,
  ChatMessage,
  ChatThread,
  DiseaseGuide,
  FaqItem,
  FeedbackItem,
  FIELD_LIMITS,
  Hospital,
  Order,
  Product,
  ProductCategory,
  SiteSettings,
  UserProfile,
} from '../types';
import {
  generateGutenbergBlockHtml,
  generateStandaloneHtml,
  generateWordPressFreeHtml,
  generateWordPressFreeStepBlocks,
  generateWordPressPluginZip,
} from '../lib/wordpressExport';

interface AdminDashboardProps {
  settings: SiteSettings;
  banners: Banner[];
  products: Product[];
  diseases: DiseaseGuide[];
  hospitals: Hospital[];
  faqs: FaqItem[];
  appointments: Appointment[];
  orders: Order[];
  chatThreads: ChatThread[];
  activeThreadId: string | null;
  activeThreadMessages: ChatMessage[];
  feedbackList: FeedbackItem[];
  usersList: UserProfile[];
  adminRoles: AdminRole[];
  isSuperAdmin: boolean;
  adminToken: string | null;
  adminIdentifier: string | null;
  onConnectCloudAdmin: () => Promise<void>;
  onExitAdminPanel: () => void;
  onSelectChatThread: (threadId: string) => void;
  onSendAdminChatReply: (threadId: string, ownerUid: string, text: string) => Promise<void>;
  onSaveSettings: (s: SiteSettings) => Promise<void>;
  onAddBanner: (b: Omit<Banner, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteBanner: (id: string) => Promise<void>;
  onToggleBannerActive: (b: Banner) => Promise<void>;
  onSaveProduct: (p: Omit<Product, 'id' | 'updatedAt'>, existingId?: string) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAddHospital: (h: Omit<Hospital, 'id' | 'updatedAt'>) => Promise<void>;
  onDeleteHospital: (id: string) => Promise<void>;
  onAddFaq: (f: Omit<FaqItem, 'id' | 'updatedAt'>) => Promise<void>;
  onDeleteFaq: (id: string) => Promise<void>;
  onUpdateAppointmentStatus: (apt: Appointment, status: Appointment['status']) => Promise<void>;
  onUpdateOrderStatus: (ord: Order, status: Order['status']) => Promise<void>;
  onReplyFeedback: (fb: FeedbackItem, reply: string) => Promise<void>;
  onGrantRole: (uid: string, email: string, name: string, role: 'admin' | 'staff') => Promise<void>;
  onRevokeRole: (uid: string) => Promise<void>;
}

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1200;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unavailable'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.76);
        if (dataUrl.length > FIELD_LIMITS.IMAGE_URL_MAX) {
          reject(new Error('ছবিটি অনেক বড়। অনুগ্রহ করে ছোট ছবি নির্বাচন করুন।'));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => reject(new Error('ছবি লোড করা যায়নি।'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('ফাইল পড়া যায়নি।'));
    reader.readAsDataURL(file);
  });
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  banners,
  products,
  diseases,
  hospitals,
  faqs,
  appointments,
  orders,
  chatThreads,
  activeThreadId,
  activeThreadMessages,
  feedbackList,
  usersList,
  adminRoles,
  isSuperAdmin,
  adminToken,
  adminIdentifier,
  onConnectCloudAdmin,
  onExitAdminPanel,
  onSelectChatThread,
  onSendAdminChatReply,
  onSaveSettings,
  onAddBanner,
  onDeleteBanner,
  onToggleBannerActive,
  onSaveProduct,
  onDeleteProduct,
  onAddHospital,
  onDeleteHospital,
  onAddFaq,
  onDeleteFaq,
  onUpdateAppointmentStatus,
  onUpdateOrderStatus,
  onReplyFeedback,
  onGrantRole,
  onRevokeRole,
}) => {
  const [tab, setTab] = useState<
    | 'product-upload'
    | 'settings'
    | 'faqs'
    | 'banners'
    | 'bookings'
    | 'chat'
    | 'hospitals'
    | 'users'
    | 'ask-ai'
    | 'wordpress'
  >('product-upload');

  // Settings & Address Bar State
  const [formSettings, setFormSettings] = useState<SiteSettings>(settings);
  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);
  const [newAddressInput, setNewAddressInput] = useState('');
  const [settingsSaved, setSettingsSaved] = useState('');

  // Product Upload Form State (Zero Price Field)
  const [prodNameBn, setProdNameBn] = useState('');
  const [prodNameEn, setProdNameEn] = useState('');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('bp');
  const [prodWarranty, setProdWarranty] = useState('অফিসিয়াল ওয়ারেন্টি সহ');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImg, setProdImg] = useState('/src/assets/images/product_bp_monitor_1795362638946.jpg');
  const [prodUploadErr, setProdUploadErr] = useState('');
  const [prodSavedMsg, setProdSavedMsg] = useState('');

  // Banner Form State
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerCtaText, setBannerCtaText] = useState('বিস্তারিত দেখুন');
  const [bannerCtaTarget, setBannerCtaTarget] =
    useState<Banner['ctaTarget']>('products');
  const [bannerImage, setBannerImage] = useState(
    '/src/assets/images/banner_medical_devices_1795362638813.jpg'
  );
  const [bannerErr, setBannerErr] = useState('');

  // FAQ Form State
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState('সাধারণ');

  // Hospital Form State
  const [hospNameBn, setHospNameBn] = useState('');
  const [hospNameEn, setHospNameEn] = useState('');
  const [hospType, setHospType] = useState<'government' | 'autonomous'>('government');
  const [hospDiv, setHospDiv] = useState('ঢাকা');
  const [hospLoc, setHospLoc] = useState('');
  const [hospPhone, setHospPhone] = useState('');

  // Chat & Feedback state
  const [chatReply, setChatReply] = useState('');
  const [fbReplyMap, setFbReplyMap] = useState<Record<string, string>>({});

  // Role grant state
  const [roleUid, setRoleUid] = useState('');
  const [roleEmail, setRoleEmail] = useState('');
  const [roleName, setRoleName] = useState('');
  const [roleType, setRoleType] = useState<'admin' | 'staff'>('staff');

  // Admin-Only Ask AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr, setAiErr] = useState('');

  // WordPress Export state
  const [wpFreeCopied, setWpFreeCopied] = useState(false);
  const [wpStepMode, setWpStepMode] = useState<'native' | 'custom-html' | 'gutenberg'>('native');
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null);
  const [gutenbergCopied, setGutenbergCopied] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

  const handleAddAddressClick = () => {
    const trimmed = newAddressInput.trim();
    if (!trimmed) return;
    const currentList = formSettings.addresses || [];
    const updatedList = [...currentList, trimmed];
    setFormSettings({
      ...formSettings,
      address: formSettings.address?.trim() ? formSettings.address : trimmed,
      addresses: updatedList,
    });
    setNewAddressInput('');
  };

  const handleRemoveAddress = (idx: number) => {
    const updatedList = (formSettings.addresses || []).filter((_, i) => i !== idx);
    setFormSettings({
      ...formSettings,
      addresses: updatedList,
      address: updatedList[0] || '',
    });
  };

  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved('');
    await onSaveSettings(formSettings);
    setSettingsSaved('ঠিকানা, হোয়াটসঅ্যাপ, বিকাশ ও প্রতিষ্ঠানের তথ্য সফলভাবে হালনাগাদ হয়েছে!');
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerErr('');
    try {
      const compressed = await compressImageFile(file);
      setBannerImage(compressed);
    } catch (err) {
      setBannerErr(err instanceof Error ? err.message : 'ছবি প্রসেস করা যায়নি।');
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProdUploadErr('');
    try {
      const compressed = await compressImageFile(file);
      setProdImg(compressed);
    } catch (err) {
      setProdUploadErr(err instanceof Error ? err.message : 'ছবি আপলোড করা যায়নি।');
    }
  };

  const handleAddBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerErr('');
    if (!bannerTitle.trim() || !bannerSubtitle.trim() || !bannerImage.trim()) {
      setBannerErr('শিরোনাম, বিবরণ এবং ব্যানার ছবি আবশ্যক।');
      return;
    }
    await onAddBanner({
      title: bannerTitle.trim().slice(0, FIELD_LIMITS.TITLE_MAX),
      subtitle: bannerSubtitle.trim().slice(0, FIELD_LIMITS.SUBTITLE_MAX),
      ctaText: bannerCtaText.trim().slice(0, 60),
      ctaTarget: bannerCtaTarget,
      imageUrl: bannerImage,
      order: banners.length + 1,
      active: true,
    });
    setBannerTitle('');
    setBannerSubtitle('');
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdUploadErr('');
    setProdSavedMsg('');
    if (!prodNameBn.trim() || !prodDesc.trim()) {
      setProdUploadErr('পণ্যের নাম এবং বিবরণ লিখুন।');
      return;
    }
    await onSaveProduct({
      nameBn: prodNameBn.trim(),
      nameEn: prodNameEn.trim() || prodNameBn.trim(),
      category: prodCategory,
      warranty: prodWarranty.trim() || 'অফিসিয়াল ওয়ারেন্টি সহ',
      inStock: true,
      descriptionBn: prodDesc.trim(),
      imageUrl: prodImg,
      features: [],
      relatedDiseases: [],
    });
    setProdNameBn('');
    setProdNameEn('');
    setProdDesc('');
    setProdSavedMsg('নতুন পণ্য ছবি ও বিবরণসহ সফলভাবে যোগ হয়েছে!');
  };

  const handleAddFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    await onAddFaq({
      questionBn: faqQuestion.trim(),
      answerBn: faqAnswer.trim(),
      category: faqCategory.trim() || 'সাধারণ',
      order: faqs.length + 1,
    });
    setFaqQuestion('');
    setFaqAnswer('');
  };

  const handleAddHospitalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddHospital({
      nameBn: hospNameBn.trim(),
      nameEn: hospNameEn.trim(),
      type: hospType,
      division: hospDiv,
      locationBn: hospLoc.trim(),
      emergencyPhone: hospPhone.trim(),
    });
    setHospNameBn('');
    setHospNameEn('');
    setHospLoc('');
    setHospPhone('');
  };

  const handleAskAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiErr('');
    setAiReply('');
    if (!adminToken) {
      setAiErr('Ask AI ব্যবহার করতে প্রথমে গোপন অ্যাডমিন কোড দিয়ে লগইন করুন।');
      return;
    }
    if (aiPrompt.trim().length < 2) {
      setAiErr('অনুগ্রহ করে আপনার প্রশ্ন বা নির্দেশনা লিখুন।');
      return;
    }
    setAiLoading(true);
    try {
      const resp = await fetch('/api/admin/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      const data = (await resp.json()) as { reply?: string; error?: string };
      if (!resp.ok) {
        setAiErr(data.error || 'AI উত্তর পাওয়া যায়নি।');
        return;
      }
      setAiReply(data.reply || '');
    } catch {
      setAiErr('সার্ভারের সাথে যোগাযোগ করা যায়নি।');
    } finally {
      setAiLoading(false);
    }
  };

  const exportPayload = { settings: formSettings, products, diseases, hospitals, faqs };
  const activeThread = chatThreads.find((t) => t.id === activeThreadId) || null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-[#1D2B53] text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#2DA94F]" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                lifecircle.bd গোপন অ্যাডমিন কন্ট্রোল প্যানেল
              </h2>
              <p className="text-xs text-sky-200">
                {adminIdentifier ? `যাচাইকৃত অ্যাডমিন: ${adminIdentifier}` : 'অপারেশন ও কন্টেন্ট ম্যানেজার'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!isSuperAdmin && (
              <button
                type="button"
                onClick={onConnectCloudAdmin}
                className="px-3 py-1.5 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs font-semibold"
              >
                ক্লাউড সিঙ্ক (Google Admin) যুক্ত করুন
              </button>
            )}
            <button
              type="button"
              onClick={onExitAdminPanel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              অ্যাডমিন বন্ধ করুন
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'product-upload', label: 'Product Upload', icon: UploadCloud },
            { id: 'settings', label: 'ঠিকানা ও নম্বর', icon: Settings },
            { id: 'faqs', label: 'FAQ ম্যানেজার', icon: HelpCircle },
            { id: 'banners', label: 'স্লাইডবার ব্যানার', icon: ImagePlus },
            { id: 'bookings', label: 'অ্যাপয়েন্টমেন্ট ও অর্ডার', icon: Calendar },
            { id: 'chat', label: 'লাইভ চ্যাট', icon: MessageSquare },
            { id: 'hospitals', label: 'হাসপাতাল', icon: Building },
            { id: 'users', label: 'ইউজার ও ফিডব্যাক', icon: Users },
            { id: 'wordpress', label: 'WordPress & HTML', icon: Code2 },
            { id: 'ask-ai', label: 'Ask AI', icon: Sparkles },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  tab === t.id
                    ? 'bg-[#2D89C8] text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Product Upload (Picture + Description Box Beneath Image, Zero Price) */}
        {tab === 'product-upload' && (
          <div className="p-6 space-y-6">
            <form
              onSubmit={handleAddProductSubmit}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-4"
            >
              <div>
                <h3 className="text-base font-bold text-[#1D2B53] dark:text-white">
                  Product Upload — ছবি আপলোড ও ছবির নিচে বিবরণ লিখুন
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  এখানে পণ্যের ছবি আপলোড করে নিচের বিবরণ বক্সে লিখলে তা সরাসরি ছবির নিচে প্রদর্শিত হবে। কোনো মূল্য যুক্ত করা হয় না।
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Live Picture + Description Beneath Preview */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={prodImg}
                      alt="পণ্যের প্রিভিউ"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-1.5 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-[#1D2B53] dark:text-white">
                      {prodNameBn.trim() || 'পণ্যের বাংলা নাম এখানে দেখাবে'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {prodDesc.trim() || 'আপনি নিচের বিবরণ বক্সে যা লিখবেন, তা এখানে ছবির ঠিক নিচে দেখাবে।'}
                    </p>
                  </div>
                </div>

                {/* Upload & Description Form */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={prodNameBn}
                      onChange={(e) => setProdNameBn(e.target.value)}
                      placeholder="পণ্যের নাম (বাংলা) *"
                      className="px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                    />
                    <input
                      type="text"
                      value={prodNameEn}
                      onChange={(e) => setProdNameEn(e.target.value)}
                      placeholder="Product Name (English)"
                      className="px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                    />
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                      className="px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                    >
                      <option value="bp">বিপি মেশিন</option>
                      <option value="diabetes">ডায়াবেটিস মিটার</option>
                      <option value="thermometer">থার্মোমিটার (ডিজিটাল/অ্যানালগ)</option>
                      <option value="oxygen">অক্সিজেন কনসেন্ট্রেটর</option>
                      <option value="bipap">বাইপ্যাপ মেশিন</option>
                      <option value="cpap">সি-প্যাপ মেশিন</option>
                      <option value="mask">সিঙ্গেল এনপিভি মাস্ক</option>
                    </select>
                    <input
                      type="text"
                      value={prodWarranty}
                      onChange={(e) => setProdWarranty(e.target.value)}
                      placeholder="ওয়ারেন্টি / মান তথ্য"
                      className="px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                    />
                  </div>

                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-[#2D89C8] bg-white dark:bg-slate-900 text-xs font-semibold text-[#2D89C8] cursor-pointer hover:bg-sky-50 dark:hover:bg-slate-800">
                    <ImagePlus className="w-4 h-4" />
                    <span>পণ্যের ছবি আপলোড করুন (Computer / Mobile)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </label>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      পণ্যের বিবরণ বক্স (ছবির ঠিক নিচে দেখাবে) *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="এই পণ্য সম্পর্কে বিস্তারিত লিখুন—যা পণ্যের ছবির নিচে প্রদর্শিত হবে..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                    />
                  </div>

                  {prodUploadErr && <p className="text-xs text-rose-600">{prodUploadErr}</p>}
                  {prodSavedMsg && (
                    <p className="text-xs text-[#2DA94F] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{prodSavedMsg}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] text-white text-xs sm:text-sm font-semibold"
                  >
                    <Package className="w-4 h-4" />
                    পণ্য ও বিবরণ প্রকাশ করুন
                  </button>
                </div>
              </div>
            </form>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              {products.map((p) => (
                <div key={p.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt={p.nameBn}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1D2B53] dark:text-white truncate">
                        {p.nameBn}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {p.category} · {p.inStock ? 'উপলব্ধ' : 'স্টক নেই'} · {p.descriptionBn}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSaveProduct({ ...p, inStock: !p.inStock }, p.id)}
                      className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium"
                    >
                      {p.inStock ? 'স্টক আউট করুন' : 'স্টকে আনুন'}
                    </button>
                    <button
                      onClick={() => onDeleteProduct(p.id)}
                      aria-label="পণ্য মুছুন"
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Address Bar ("Add New Address") & Contact Numbers (WhatsApp, bKash) */}
        {tab === 'settings' && (
          <form onSubmit={handleSaveSettingsSubmit} className="p-6 space-y-6 max-w-4xl">
            <h3 className="text-base font-bold text-[#1D2B53] dark:text-white">
              ঠিকানা, WhatsApp, bKash ও প্রতিষ্ঠানের তথ্য পরিবর্তন
            </h3>

            {/* Dedicated Add New Address Bar */}
            <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 space-y-3">
              <label className="flex items-center gap-1.5 text-xs font-bold text-[#1D2B53] dark:text-white">
                <MapPin className="w-4 h-4 text-[#2D89C8]" />
                <span>অ্যাড্রেস বার — আপনার ঠিকানা নিজে যুক্ত করুন</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newAddressInput}
                  onChange={(e) => setNewAddressInput(e.target.value)}
                  placeholder="নতুন ঠিকানা লিখুন (যেমন: বাড়ি নং..., রোড..., ঢাকা)..."
                  className="flex-1 px-3.5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddAddressClick}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs sm:text-sm font-semibold whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Add New Address
                </button>
              </div>

              {(formSettings.addresses || []).length > 0 && (
                <ul className="space-y-2 pt-2">
                  {(formSettings.addresses || []).map((addr, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm"
                    >
                      <span>{addr}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAddress(idx)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">প্রতিষ্ঠানের নাম</label>
                <input
                  type="text"
                  required
                  value={formSettings.companyName}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, companyName: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">পাবলিক সাপোর্ট ইমেইল</label>
                <input
                  type="email"
                  required
                  value={formSettings.email}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">WhatsApp নম্বর</label>
                <input
                  type="text"
                  required
                  value={formSettings.whatsapp || formSettings.phonePrimary}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      whatsapp: e.target.value,
                      phonePrimary: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">বিকাশ নম্বর (bKash)</label>
                <input
                  type="text"
                  value={formSettings.bkash || '01711480987'}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, bkash: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm font-mono-num"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">প্রধান ঠিকানা (ঐচ্ছিক)</label>
              <input
                type="text"
                value={formSettings.address}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, address: e.target.value })
                }
                placeholder="উপরে Add New Address দিয়ে অথবা সরাসরি এখানে লিখুন"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">খোলা থাকার সময়সূচি</label>
              <input
                type="text"
                value={formSettings.hours || ''}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, hours: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm"
              />
            </div>

            {settingsSaved && (
              <p className="text-xs text-[#2DA94F] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{settingsSaved}</span>
              </p>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] text-white text-xs sm:text-sm font-semibold"
            >
              সব পরিবর্তন সংরক্ষণ করুন
            </button>
          </form>
        )}

        {/* TAB 3: FAQ Manager */}
        {tab === 'faqs' && (
          <div className="p-6 space-y-6 max-w-4xl">
            <form
              onSubmit={handleAddFaqSubmit}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3"
            >
              <h3 className="text-sm font-bold text-[#1D2B53] dark:text-white">
                নতুন FAQ প্রশ্ন ও উত্তর যোগ করুন
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  placeholder="প্রশ্ন লিখুন *"
                  className="sm:col-span-2 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <input
                  type="text"
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value)}
                  placeholder="ক্যাটাগরি (যেমন: স্লিপ টেস্ট)"
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
              <textarea
                rows={3}
                required
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="প্রশ্নের উত্তর বিস্তারিত লিখুন *"
                className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2DA94F] text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                FAQ যোগ করুন
              </button>
            </form>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              {faqs.map((f) => (
                <div key={f.id} className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#1D2B53] dark:text-white">
                      {f.questionBn}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {f.answerBn}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteFaq(f.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Banner Slidebar Manager */}
        {tab === 'banners' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-[#1D2B53] dark:text-white">
                স্লাইডবার ব্যানার ও ছবি ব্যবস্থাপনা (শুধুমাত্র অ্যাডমিন)
              </h3>
            </div>

            <form
              onSubmit={handleAddBannerSubmit}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="ব্যানার শিরোনাম *"
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <input
                  type="text"
                  required
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="ব্যানার বিবরণ / লেখা *"
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <input
                  type="text"
                  value={bannerCtaText}
                  onChange={(e) => setBannerCtaText(e.target.value)}
                  placeholder="বাটন লেখা"
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <select
                  value={bannerCtaTarget}
                  onChange={(e) =>
                    setBannerCtaTarget(e.target.value as Banner['ctaTarget'])
                  }
                  className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                >
                  <option value="products">যন্ত্রপাতি পাতা</option>
                  <option value="sleep-test">স্লিপ টেস্ট পাতা</option>
                  <option value="diseases">রোগ নির্দেশিকা</option>
                  <option value="hospitals">হাসপাতাল তালিকা</option>
                  <option value="appointments">অ্যাপয়েন্টমেন্ট বুকিং</option>
                  <option value="contact">যোগাযোগ পাতা</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer hover:border-[#2D89C8]">
                  <ImagePlus className="w-4 h-4 text-[#2D89C8]" />
                  <span>কম্পিউটার থেকে ছবি আপলোড করুন</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={bannerImage.startsWith('data:') ? '(আপলোডকৃত ছবি প্রস্তুত)' : bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="অথবা ছবির URL দিন"
                  className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              {bannerErr && <p className="text-xs text-rose-600">{bannerErr}</p>}

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                নতুন ব্যানার যুক্ত করুন
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col"
                >
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-40 object-cover bg-slate-100"
                  />
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#1D2B53] dark:text-white">
                        {b.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {b.subtitle}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => onToggleBannerActive(b)}
                        className={`text-xs font-semibold ${
                          b.active ? 'text-[#2DA94F]' : 'text-amber-600'
                        }`}
                      >
                        {b.active ? 'সক্রিয় (লুকাতে ক্লিক করুন)' : 'নিষ্ক্রিয় (প্রকাশ করুন)'}
                      </button>
                      <button
                        onClick={() => onDeleteBanner(b.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        মুছুন
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Appointments & Orders (No Prices Displayed) */}
        {tab === 'bookings' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#1D2B53] dark:text-white">
                <Calendar className="w-4 h-4 text-[#2DA94F]" />
                <span>সকল অ্যাপয়েন্টমেন্ট ({appointments.length})</span>
              </h3>
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-bold text-[#1D2B53] dark:text-white">
                      {apt.patientName} ({apt.phone})
                    </span>
                    <span className="font-mono-num text-xs text-[#2D89C8] font-semibold">
                      {apt.preferredDate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    সেবা: {apt.serviceType} · স্লট: {apt.preferredSlot}
                  </p>
                  <p className="text-xs text-slate-500">ঠিকানা: {apt.address}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <select
                      value={apt.status}
                      onChange={(e) =>
                        onUpdateAppointmentStatus(apt, e.target.value as Appointment['status'])
                      }
                      className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                    >
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#1D2B53] dark:text-white">
                <ShoppingBag className="w-4 h-4 text-[#2D89C8]" />
                <span>সকল অর্ডার অনুরোধ ({orders.length})</span>
              </h3>
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-bold text-[#1D2B53] dark:text-white">
                      {ord.customerName} ({ord.phone})
                    </span>
                    <span className="font-mono-num text-xs font-bold text-[#2DA94F]">
                      {ord.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {ord.items.map((i) => `${i.nameBn} ×${i.quantity}`).join(', ')}
                  </p>
                  <p className="text-xs text-slate-500">ঠিকানা: {ord.address}</p>
                  <select
                    value={ord.status}
                    onChange={(e) =>
                      onUpdateOrderStatus(ord, e.target.value as Order['status'])
                    }
                    className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                  >
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: Live Human Support Chat Inbox */}
        {tab === 'chat' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[420px]">
            <div className="lg:col-span-4 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
                গ্রাহক চ্যাট তালিকা ({chatThreads.length})
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                {chatThreads.length === 0 ? (
                  <p className="p-4 text-xs text-slate-500">কোনো চ্যাট মেসেজ নেই।</p>
                ) : (
                  chatThreads.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onSelectChatThread(t.id)}
                      className={`w-full text-left p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        activeThreadId === t.id ? 'bg-sky-50 dark:bg-sky-950/40' : ''
                      }`}
                    >
                      <p className="text-xs font-bold text-[#1D2B53] dark:text-white">
                        {t.customerName}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{t.lastMessage}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-8 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden">
              {!activeThread ? (
                <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-500">
                  বাম পাশ থেকে একটি গ্রাহকের চ্যাট নির্বাচন করে সরাসরি উত্তর দিন।
                </div>
              ) : (
                <>
                  <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                    <span className="text-sm font-bold text-[#1D2B53] dark:text-white">
                      {activeThread.customerName}
                    </span>
                    <span className="text-xs text-[#2DA94F] font-medium">মানব-সাপোর্ট (NO AI)</span>
                  </div>

                  <div className="flex-1 p-4 space-y-2.5 overflow-y-auto max-h-80">
                    {activeThreadMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.senderRole === 'admin' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <span className="text-[10px] text-slate-400 mb-0.5">
                          {m.senderName} ({m.senderRole})
                        </span>
                        <div
                          className={`px-3.5 py-2 rounded-xl text-xs max-w-[80%] ${
                            m.senderRole === 'admin'
                              ? 'bg-[#1D2B53] text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!chatReply.trim()) return;
                      await onSendAdminChatReply(
                        activeThread.id,
                        activeThread.ownerUid,
                        chatReply.trim()
                      );
                      setChatReply('');
                    }}
                    className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2"
                  >
                    <input
                      type="text"
                      value={chatReply}
                      onChange={(e) => setChatReply(e.target.value)}
                      placeholder="গ্রাহককে সরাসরি উত্তর লিখুন..."
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#2DA94F] text-white text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      পাঠান
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: Hospitals Directory Manager */}
        {tab === 'hospitals' && (
          <div className="p-6 space-y-6">
            <form
              onSubmit={handleAddHospitalSubmit}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <input
                type="text"
                required
                value={hospNameBn}
                onChange={(e) => setHospNameBn(e.target.value)}
                placeholder="হাসপাতালের নাম (বাংলা) *"
                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <input
                type="text"
                required
                value={hospNameEn}
                onChange={(e) => setHospNameEn(e.target.value)}
                placeholder="Hospital Name (English) *"
                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <select
                value={hospType}
                onChange={(e) =>
                  setHospType(e.target.value as 'government' | 'autonomous')
                }
                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="government">সরকারি হাসপাতাল</option>
                <option value="autonomous">স্বায়ত্তশাসিত প্রতিষ্ঠান</option>
              </select>
              <input
                type="text"
                required
                value={hospDiv}
                onChange={(e) => setHospDiv(e.target.value)}
                placeholder="বিভাগ *"
                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <input
                type="text"
                required
                value={hospLoc}
                onChange={(e) => setHospLoc(e.target.value)}
                placeholder="ঠিকানা / লোকেশন *"
                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <input
                type="text"
                required
                value={hospPhone}
                onChange={(e) => setHospPhone(e.target.value)}
                placeholder="জরুরি ফোন নম্বর *"
                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono-num"
              />
              <button
                type="submit"
                className="sm:col-span-3 justify-self-start px-4 py-2 rounded-lg bg-[#2D89C8] text-white text-xs font-semibold"
              >
                হাসপাতাল যুক্ত করুন
              </button>
            </form>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl max-h-96 overflow-y-auto">
              {hospitals.map((h) => (
                <div key={h.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#1D2B53] dark:text-white">
                      {h.nameBn}
                    </p>
                    <p className="text-xs text-slate-500">
                      {h.division} · {h.locationBn} · <span className="font-mono-num">{h.emergencyPhone}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteHospital(h.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: Multi-User Roles & Customer Feedback */}
        {tab === 'users' && (
          <div className="p-6 space-y-8">
            {isSuperAdmin && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#1D2B53] dark:text-white">
                  মাল্টি-ইউজার অ্যাডমিন ও সাপোর্ট স্টাফ রোল ব্যবস্থাপনা
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!roleUid.trim() || !roleEmail.trim()) return;
                    await onGrantRole(
                      roleUid.trim(),
                      roleEmail.trim(),
                      roleName.trim(),
                      roleType
                    );
                    setRoleUid('');
                    setRoleEmail('');
                    setRoleName('');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                >
                  <input
                    type="text"
                    required
                    value={roleUid}
                    onChange={(e) => setRoleUid(e.target.value)}
                    placeholder="User UID *"
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono-num"
                  />
                  <input
                    type="email"
                    required
                    value={roleEmail}
                    onChange={(e) => setRoleEmail(e.target.value)}
                    placeholder="Email *"
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="নাম"
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <select
                    value={roleType}
                    onChange={(e) => setRoleType(e.target.value as 'admin' | 'staff')}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="staff">Staff (চ্যাট ও বুকিং)</option>
                    <option value="admin">Admin (পূর্ণ নিয়ন্ত্রণ)</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-[#2D89C8] text-white text-xs font-semibold"
                  >
                    রোল যুক্ত করুন
                  </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {adminRoles.map((r) => (
                    <div
                      key={r.uid}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1D2B53] dark:text-white truncate">
                          {r.name || r.email} ({r.role})
                        </p>
                        <p className="font-mono-num text-[11px] text-slate-500 truncate">
                          UID: {r.uid}
                        </p>
                      </div>
                      <button
                        onClick={() => onRevokeRole(r.uid)}
                        className="text-xs text-rose-600 hover:underline shrink-0"
                      >
                        অপসারণ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-[#1D2B53] dark:text-white mb-3">
                  নিবন্ধিত ব্যবহারকারী ({usersList.length})
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl max-h-80 overflow-y-auto">
                  {usersList.map((u) => (
                    <div key={u.uid} className="p-3 text-xs space-y-0.5">
                      <p className="font-bold text-[#1D2B53] dark:text-white">
                        {u.displayName} · {u.email}
                      </p>
                      <p className="font-mono-num text-slate-500">
                        {u.phone ? `ফোন: ${u.phone}` : 'ফোন নেই'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#1D2B53] dark:text-white mb-3">
                  গ্রাহক ফিডব্যাক ({feedbackList.length})
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {feedbackList.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex justify-between text-xs font-bold">
                        <span>{fb.name} ({fb.category})</span>
                        <span className="font-mono-num text-amber-500">{fb.rating}/5 ★</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{fb.message}</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={fbReplyMap[fb.id] ?? fb.adminReply ?? ''}
                          onChange={(e) =>
                            setFbReplyMap((prev) => ({ ...prev, [fb.id]: e.target.value }))
                          }
                          placeholder="অ্যাডমিন উত্তর..."
                          className="flex-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs"
                        />
                        <button
                          onClick={() =>
                            onReplyFeedback(fb, fbReplyMap[fb.id] ?? fb.adminReply ?? '')
                          }
                          className="px-3 py-1 rounded bg-[#2DA94F] text-white text-xs font-semibold"
                        >
                          উত্তর দিন
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: WordPress Step-by-Step Free Blocks, ZIP Plugin, Gutenberg HTML & Standalone HTML */}
        {tab === 'wordpress' && (
          <div className="p-6 space-y-8 max-w-5xl">
            {/* Step-by-step Modular Free WordPress Builder */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#1D2B53] dark:text-white">
                    Free WordPress ধাপে ধাপে ছোট ছোট ব্লক (Step-by-Step Custom &amp; Gutenberg)
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    পুরো সাইট একসাথে না দিয়ে ছোট ছোট ৭টি অংশে ভাগ করা হয়েছে। প্রতিটি ধাপ কপি করে WordPress পেজে বসান—এতে কোনো &lt;script&gt; ব্লক হবে না এবং Google Drive বা API ID থাকবে না।
                  </p>
                </div>

                <div className="inline-flex flex-wrap rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-1 shrink-0 self-start">
                  <button
                    type="button"
                    onClick={() => setWpStepMode('native')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      wpStepMode === 'native'
                        ? 'bg-[#2DA94F] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Native Visual Gutenberg (সবচেয়ে সহজ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWpStepMode('custom-html')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      wpStepMode === 'custom-html'
                        ? 'bg-[#2D89C8] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Custom HTML ব্লক
                  </button>
                  <button
                    type="button"
                    onClick={() => setWpStepMode('gutenberg')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      wpStepMode === 'gutenberg'
                        ? 'bg-[#1D2B53] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    HTML Wrapper (&lt;!-- wp:html --&gt;)
                  </button>
                </div>
              </div>

              {/* Clear visual guide on WHERE to paste in Free WordPress */}
              <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 text-xs sm:text-sm text-slate-700 dark:text-slate-200 space-y-1.5 leading-relaxed">
                <p className="font-bold text-[#1D2B53] dark:text-white">
                  Free WordPress-এ কোথায় এবং কীভাবে পেস্ট করবেন:
                </p>
                {wpStepMode === 'native' ? (
                  <p>
                    ১. WordPress পেজ এডিটরের ওপরে ডানকোণায় <strong>⋮ (Options) → Code editor</strong> খুলুন (অথবা Visual এডিটরের যেকোনো খালি লাইনে সরাসরি পেস্ট করুন)। ২. ধাপ ১ থেকে ৭ কপি করে পেস্ট করুন। ৩. <strong>Exit code editor</strong> ক্লিক করলে সব কার্ড, কলাম, ছবি, FAQ ও বাটন সরাসরি <strong>ভিজ্যুয়াল ব্লক</strong> হয়ে যাবে—আপনি সরাসরি ছবি আপলোড ও লেখা এডিট করতে পারবেন (কোনো কোড দেখা যাবে না)!
                  </p>
                ) : wpStepMode === 'custom-html' ? (
                  <p>
                    ১. WordPress ড্যাশবোর্ডে গিয়ে <strong>Pages → Add New</strong> খুলুন। ২. এডিটরে <strong>+ (Add Block)</strong> বাটনে ক্লিক করে সার্চ দিন <strong>"Custom HTML"</strong> (ভুলেও <em>Code</em> ব্লক নেবেন না)। ৩. নিচের প্রতিটি ধাপ কপি করে আলাদা আলাদা <strong>Custom HTML</strong> ব্লকে পেস্ট করুন এবং ওপরে ডানদিকে <strong>Preview</strong> / <strong>Publish</strong> করুন।
                  </p>
                ) : (
                  <p>
                    ১. WordPress পেজ এডিটরের একদম ওপরে ডানকোণায় <strong>⋮ (Options)</strong> থেকে <strong>Code editor</strong> বেছে নিন। ২. নিচের <strong>&lt;!-- wp:html --&gt;</strong> কোডগুলো ধাপ ১ থেকে ধাপ ৭ পর্যন্ত পরপর পেস্ট করে <strong>Exit code editor</strong> ও <strong>Preview</strong> ক্লিক করুন।
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {generateWordPressFreeStepBlocks(exportPayload).map((step) => {
                  const codeText =
                    wpStepMode === 'native'
                      ? step.nativeGutenbergHtml
                      : wpStepMode === 'gutenberg'
                        ? step.gutenbergHtml
                        : step.customHtml;
                  const isCopied = copiedStepId === step.id;
                  return (
                    <div
                      key={step.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-[#1D2B53] dark:text-white">
                            {step.titleBn}
                          </h4>
                          <p className="text-xs text-[#2DA94F] font-medium mt-0.5">
                            কোথায় বসাবেন: {step.whereToPasteBn}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(codeText);
                            setCopiedStepId(step.id);
                            window.setTimeout(() => setCopiedStepId(null), 2200);
                          }}
                          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                            isCopied
                              ? 'bg-[#2DA94F] text-white'
                              : 'bg-[#2D89C8] hover:bg-[#236FA3] text-white'
                          }`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {isCopied ? `ধাপ ${step.stepNumber} কপি হয়েছে!` : `ধাপ ${step.stepNumber} কপি করুন`}
                        </button>
                      </div>
                      <textarea
                        readOnly
                        rows={3}
                        value={codeText}
                        onFocus={(e) => e.currentTarget.select()}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 allow-select"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secondary All-in-One & Self-Hosted Export Options */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-[#1D2B53] dark:text-white">
                বিকল্প পূর্ণ প্যাকেজ (All-in-One / Self-Hosted WordPress.org / অফলাইন ব্রাউজার)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#1D2B53] dark:text-white">
                      All-in-One Free WordPress (সব ধাপ একসাথে)
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      ১ থেকে ৭ সব ধাপ একটি মাত্র Custom HTML ব্লকে চাইলে এখান থেকে কপি করুন।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const snippet = generateWordPressFreeHtml(exportPayload);
                      await navigator.clipboard.writeText(snippet);
                      setWpFreeCopied(true);
                      window.setTimeout(() => setWpFreeCopied(false), 2500);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs font-semibold"
                  >
                    <Copy className="w-4 h-4" />
                    {wpFreeCopied ? 'সবগুলো একসাথে কপি হয়েছে!' : 'All-in-One Free HTML কপি করুন'}
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#1D2B53] dark:text-white">
                      WordPress প্লাগইন ZIP (Self-Hosted WordPress.org)
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      নিজস্ব হোস্টিং বা পেইড WordPress প্ল্যানের জন্য (পূর্ণ কপি প্রোটেকশন ও [lifecircle_bd] শর্টকোড সহ)।
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={zipLoading}
                    onClick={async () => {
                      setZipLoading(true);
                      try {
                        const zipBlob = await generateWordPressPluginZip(exportPayload);
                        triggerBlobDownload(zipBlob, 'lifecircle-bd-wp-plugin.zip');
                      } finally {
                        setZipLoading(false);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] disabled:opacity-50 text-white text-xs font-semibold"
                  >
                    <FileArchive className="w-4 h-4" />
                    {zipLoading ? 'তৈরি হচ্ছে...' : 'WordPress ZIP ডাউনলোড'}
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#1D2B53] dark:text-white">
                      Full Gutenberg Script HTML (Self-Hosted Only)
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      মিনিফাইড JS, কপি প্রোটেকশন ও পপআপসহ—শুধু Self-Hosted WordPress.org সাইটের Custom HTML ব্লকের জন্য।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const snippet = generateGutenbergBlockHtml(exportPayload);
                      await navigator.clipboard.writeText(snippet);
                      setGutenbergCopied(true);
                      window.setTimeout(() => setGutenbergCopied(false), 2500);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1D2B53] hover:bg-slate-800 text-white text-xs font-semibold"
                  >
                    <Copy className="w-4 h-4" />
                    {gutenbergCopied ? 'কপি হয়েছে!' : 'Full Gutenberg কোড কপি করুন'}
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#1D2B53] dark:text-white">
                      ব্রাউজারে টেস্ট HTML ফাইল (অফলাইন টেস্ট)
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      যেকোনো ব্রাউজারে (Chrome/Edge/Firefox) ডাবল-ক্লিক করে সরাসরি অফলাইনে সব ফিচার টেস্ট করুন।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const html = generateStandaloneHtml(exportPayload);
                      triggerBlobDownload(
                        new Blob([html], { type: 'text/html;charset=utf-8' }),
                        'lifecircle-bd-standalone.html'
                      );
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    HTML ডাউনলোড করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: Admin-Only "Ask AI" Panel (Strictly Inaccessible to Regular Users) */}
        {tab === 'ask-ai' && (
          <div className="p-6 max-w-3xl space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2D89C8]">
                <Sparkles className="w-4 h-4" />
                <span>অ্যাডমিন-এক্সক্লুসিভ সহায়তা (Admin Only)</span>
              </div>
              <h3 className="mt-1 text-base font-bold text-[#1D2B53] dark:text-white">
                Ask AI — শুধুমাত্র অ্যাডমিনের জন্য পণ্যের বিবরণ বা FAQ খসড়া তৈরি
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                সাধারণ ব্যবহারকারীরা কোনোভাবেই AI কল করতে পারবেন না। শুধুমাত্র সার্ভার-যাচাইকৃত অ্যাডমিন এখানে "Ask AI" বাটন ব্যবহার করতে পারবেন।
              </p>
            </div>

            <form onSubmit={handleAskAiSubmit} className="space-y-3">
              <textarea
                rows={4}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="যেমন: অ্যানালগ থার্মোমিটারের জন্য বাংলা পণ্যের বিবরণ অথবা ডায়াবেটিস সচেতনতার একটি FAQ খসড়া লিখে দাও..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm"
              />
              {aiErr && (
                <p className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs">
                  {aiErr}
                </p>
              )}
              <button
                type="submit"
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D2B53] hover:bg-slate-800 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold"
              >
                <Sparkles className="w-4 h-4 text-[#2DA94F]" />
                {aiLoading ? 'প্রস্তুত হচ্ছে...' : 'Ask AI'}
              </button>
            </form>

            {aiReply && (
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <p className="text-xs font-bold text-[#2DA94F]">AI উত্তর (অ্যাডমিন প্রিভিউ):</p>
                <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed allow-select">
                  {aiReply}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
