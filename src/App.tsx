import React, { useCallback, useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  Activity,
  Building2,
  HeartPulse,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react';
import {
  db,
  getDriveAccessToken,
  handleFirestoreError,
  logoutUser,
  OperationType,
  signInWithEmail,
  signInWithGoogleDrive,
  signUpWithEmail,
  subscribeToAuth,
  testFirestoreConnection,
} from './lib/firebase';
import { uploadBackupToDrive } from './lib/googleDrive';
import {
  DEFAULT_BANNERS,
  DEFAULT_DISEASES,
  DEFAULT_FAQS,
  DEFAULT_HOSPITALS,
  DEFAULT_PRODUCTS,
  DEFAULT_SITE_SETTINGS,
} from './data/seedData';
import {
  AdminRole,
  AppNotification,
  Appointment,
  Banner,
  ChatMessage,
  ChatThread,
  DiseaseGuide,
  FaqItem,
  FeedbackItem,
  Hospital,
  Order,
  OrderItem,
  PageRoute,
  Product,
  ProductCategory,
  SiteSettings,
  UserProfile,
  UserTwoFactor,
} from './types';
import { TopBar } from './components/TopBar';
import { WorkspaceBar } from './components/WorkspaceBar';
import { HeroSlidebar } from './components/HeroSlidebar';
import { CatalogSection } from './components/CatalogSection';
import { SleepTestSection } from './components/SleepTestSection';
import { DiseaseGuideSection } from './components/DiseaseGuideSection';
import { HospitalsDirectorySection } from './components/HospitalsDirectorySection';
import { AppointmentSection } from './components/AppointmentSection';
import {
  AboutSection,
  ContactAndFeedbackSection,
  FaqSection,
} from './components/InfoAndSupportPages';
import { CartDrawer, CartEntry } from './components/CartDrawer';
import { LiveChatDrawer } from './components/LiveChatDrawer';
import {
  AuthModal,
  HiddenAdminLoginModal,
  RegistrationNoticePopup,
  TwoFactorChallengeModal,
} from './components/AuthAndTwoFactorModal';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { OfflineIndicator } from './components/PWAComponents';
import { useOnlineStatus } from './hooks/usePWA';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function App() {
  const isOnline = useOnlineStatus();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lc_theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [defaultServiceType, setDefaultServiceType] =
    useState<Appointment['serviceType']>('home-sleep-test');

  // Auth & Role State
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasDriveToken, setHasDriveToken] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userTwoFactor, setUserTwoFactor] = useState<UserTwoFactor | null>(null);
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const [staffRole, setStaffRole] = useState<'admin' | 'staff' | null>(null);

  // Public Storefront Data
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [diseases, setDiseases] = useState<DiseaseGuide[]>(DEFAULT_DISEASES);
  const [hospitals, setHospitals] = useState<Hospital[]>(DEFAULT_HOSPITALS);
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);

  // Private / User / Admin Operational Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);

  // Live Human Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [customerMessages, setCustomerMessages] = useState<ChatMessage[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [adminActiveThreadId, setAdminActiveThreadId] = useState<string | null>(null);
  const [adminThreadMessages, setAdminThreadMessages] = useState<ChatMessage[]>([]);

  // Shopping Cart State
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartEntry[]>([]);

  // Hidden Admin Auth (kept strictly in React memory, never localStorage)
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminIdentifier, setAdminIdentifier] = useState<string | null>(null);

  // Registration Notice Popup for unregistered browsing visitors
  const [regPopupOpen, setRegPopupOpen] = useState(false);
  const [regPopupDismissed, setRegPopupDismissed] = useState(false);

  const isBootstrappedAdmin =
    !!currentUser &&
    currentUser.email === 'bd.lifecircle@gmail.com' &&
    currentUser.emailVerified;
  const isSuperAdmin = isBootstrappedAdmin || staffRole === 'admin';
  const isStaffOrAdmin = isSuperAdmin || staffRole === 'staff';
  const isAdminPanelUnlocked = !!adminToken || isStaffOrAdmin;

  // Sync theme class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem('lc_theme', darkMode ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [darkMode]);

  // Sync page-level SEO, canonical URL, and Open Graph tags dynamically
  useEffect(() => {
    const pageMeta: Record<PageRoute, { title: string; description: string }> = {
      home: {
        title: 'lifecircle.bd — মেডিকেল যন্ত্রপাতি ও স্লিপ টেস্ট',
        description:
          'বাংলাদেশের নির্ভরযোগ্য মেডিকেল যন্ত্রপাতি, স্লিপ টেস্ট, রোগ বিষয়ক নির্দেশিকা, সরকারি হাসপাতাল ডিরেক্টরি ও গুগল ড্রাইভ ব্যাকআপ সমৃদ্ধ স্বাস্থ্যসেবা প্ল্যাটফর্ম।',
      },
      products: {
        title: 'মেডিকেল যন্ত্রপাতি — lifecircle.bd',
        description:
          'বিপি মেশিন, ডায়াবেটিস মিটার, অক্সিজেন কনসেন্ট্রেটর, বাইপ্যাপ ও সিপ্যাপ সহ প্রয়োজনীয় মেডিকেল যন্ত্রপাতির তালিকা।',
      },
      'sleep-test': {
        title: 'হোম ও ক্লিনিক স্লিপ টেস্ট — lifecircle.bd',
        description:
          'ঘরে বসে বা ক্লিনিকে নিরাপদ স্লিপ অ্যাপনিয়া ও ঘুমের পরীক্ষা এবং সিপ্যাপ/বাইপ্যাপ সেটআপ সেবা।',
      },
      diseases: {
        title: 'রোগ ও স্বাস্থ্য নির্দেশিকা — lifecircle.bd',
        description:
          'ডায়াবেটিস, উচ্চ রক্তচাপ, স্লিপ অ্যাপনিয়া ও শ্বাসকষ্টের লক্ষণ, প্রাথমিক করণীয় ও সঠিক যন্ত্রপাতি ব্যবহারের নির্দেশিকা।',
      },
      hospitals: {
        title: 'সরকারি ও স্বায়ত্তশাসিত হাসপাতাল ডিরেক্টরি — lifecircle.bd',
        description:
          'বাংলাদেশের বিভাগভিত্তিক সরকারি ও স্বায়ত্তশাসিত হাসপাতালের জরুরি ও সাধারণ যোগাযোগ নম্বর।',
      },
      appointments: {
        title: 'অ্যাপয়েন্টমেন্ট বুকিং — lifecircle.bd',
        description:
          'স্লিপ টেস্ট বা মেডিকেল ডিভাইস ডেমো ও সেটআপের জন্য সহজ অনলাইন অ্যাপয়েন্টমেন্ট বুকিং।',
      },
      about: {
        title: 'আমাদের সম্পর্কে — lifecircle.bd',
        description:
          'lifecircle.bd এর লক্ষ্য, মেডিকেল যন্ত্রপাতি সেবা ও রোগী-সহায়ক তথ্য প্ল্যাটফর্ম সম্পর্কে বিস্তারিত।',
      },
      faq: {
        title: 'সচরাচর জিজ্ঞাসা (FAQ) — lifecircle.bd',
        description:
          'মেডিকেল যন্ত্রপাতি, স্লিপ টেস্ট, অ্যাপয়েন্টমেন্ট ও স্বাস্থ্যসেবা সংক্রান্ত সাধারণ প্রশ্নের উত্তর।',
      },
      contact: {
        title: 'যোগাযোগ — lifecircle.bd',
        description:
          'lifecircle.bd হেল্পলাইন, হোয়াটসঅ্যাপ ও সরাসরি পরামর্শের জন্য যোগাযোগের ঠিকানা।',
      },
      dashboard: {
        title: 'ইউজার ড্যাশবোর্ড — lifecircle.bd',
        description:
          'ব্যক্তিগত অ্যাপয়েন্টমেন্ট, অর্ডার ও গুগল ড্রাইভ ব্যাকআপ পরিচালনা করুন।',
      },
      admin: {
        title: 'অ্যাডমিন প্যানেল — lifecircle.bd',
        description: 'lifecircle.bd প্রশাসনিক ড্যাশবোর্ড।',
      },
    };

    const meta = pageMeta[currentPage] || pageMeta.home;
    const canonicalUrl = window.location.origin + window.location.pathname;
    const ogImageUrl = `${window.location.origin}/og-image.png`;

    document.title = meta.title;

    const setMetaTag = (attr: 'name' | 'property', key: string, value: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    setMetaTag('name', 'description', meta.description);
    setMetaTag('property', 'og:title', meta.title);
    setMetaTag('property', 'og:description', meta.description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', ogImageUrl);
    setMetaTag('property', 'og:image:secure_url', ogImageUrl);
    setMetaTag('name', 'twitter:title', meta.title);
    setMetaTag('name', 'twitter:description', meta.description);
    setMetaTag('name', 'twitter:image', ogImageUrl);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  }, [currentPage]);

  // Global Copy Protection & Secret Admin Shortcut (Ctrl+Shift+A / #admin)
  useEffect(() => {
    const isEditable = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (!isEditable(e.target)) {
        e.preventDefault();
      }
    };

    const handleCopyOrCut = (e: ClipboardEvent) => {
      if (!isEditable(e.target)) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = (e.key || '').toLowerCase();
      // Secret Admin shortcut: Ctrl+Shift+A (or Cmd+Shift+A)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === 'a') {
        e.preventDefault();
        setAdminLoginOpen(true);
        return;
      }
      // Block F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S, and Ctrl+C outside editable fields
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) ||
        ((e.ctrlKey || e.metaKey) && (k === 'u' || k === 's')) ||
        ((e.ctrlKey || e.metaKey) && k === 'c' && !isEditable(e.target))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyOrCut);
    document.addEventListener('cut', handleCopyOrCut);
    document.addEventListener('keydown', handleKeyDown);

    // Check URL hash/query for hidden admin entry (#admin or ?admin=1)
    const params = new URLSearchParams(window.location.search);
    if (window.location.hash === '#admin' || params.get('admin') === '1') {
      setAdminLoginOpen(true);
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyOrCut);
      document.removeEventListener('cut', handleCopyOrCut);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Show Registration Notice Popup when an unregistered visitor scrolls/browses
  useEffect(() => {
    if (!authReady || currentUser || regPopupDismissed || currentPage === 'admin') return;
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setRegPopupOpen(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [authReady, currentUser, regPopupDismissed, currentPage]);

  // Initial Firestore connection check
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Auth subscription
  useEffect(() => {
    const unsub = subscribeToAuth((user, driveTokenPresent) => {
      setCurrentUser(user);
      setHasDriveToken(driveTokenPresent);
      setAuthReady(true);
      if (!user) {
        setUserProfile(null);
        setUserTwoFactor(null);
        setTwoFactorVerified(false);
        setStaffRole(null);
        setAppointments([]);
        setOrders([]);
        setNotifications([]);
        setFeedbackList([]);
        setCustomerMessages([]);
        setChatThreads([]);
        setUsersList([]);
        setAdminRoles([]);
      }
    });
    return () => unsub();
  }, []);

  // Public Storefront Firestore Listeners
  useEffect(() => {
    const unsubSettings = onSnapshot(
      doc(db, 'siteSettings', 'main'),
      (snap) => {
        if (snap.exists()) {
          setSettings(snap.data() as SiteSettings);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'siteSettings/main')
    );

    const unsubBanners = onSnapshot(
      query(collection(db, 'banners'), orderBy('order', 'asc')),
      (snap) => {
        if (!snap.empty) {
          setBanners(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Banner));
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'banners')
    );

    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        if (!snap.empty) {
          setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'products')
    );

    const unsubDiseases = onSnapshot(
      collection(db, 'diseases'),
      (snap) => {
        if (!snap.empty) {
          setDiseases(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DiseaseGuide));
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'diseases')
    );

    const unsubHospitals = onSnapshot(
      collection(db, 'hospitals'),
      (snap) => {
        if (!snap.empty) {
          setHospitals(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Hospital));
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'hospitals')
    );

    const unsubFaqs = onSnapshot(
      query(collection(db, 'faqs'), orderBy('order', 'asc')),
      (snap) => {
        if (!snap.empty) {
          setFaqs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FaqItem));
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'faqs')
    );

    return () => {
      unsubSettings();
      unsubBanners();
      unsubProducts();
      unsubDiseases();
      unsubHospitals();
      unsubFaqs();
    };
  }, []);

  // Ensure User Profile & Admin Seed on Sign-In
  useEffect(() => {
    if (!authReady || !currentUser || !currentUser.emailVerified) return;
    const uid = currentUser.uid;

    const unsubAdminRole = onSnapshot(
      doc(db, 'admins', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AdminRole;
          setStaffRole(data.role);
        } else {
          setStaffRole(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `admins/${uid}`)
    );

    const unsubProfile = onSnapshot(
      doc(db, 'users', uid),
      async (snap) => {
        if (snap.exists()) {
          setUserProfile(snap.data() as UserProfile);
        } else {
          let pendingPhone = '';
          try {
            pendingPhone = localStorage.getItem(`lc_pending_phone_${uid}`) || '';
            if (pendingPhone) localStorage.removeItem(`lc_pending_phone_${uid}`);
          } catch {
            // ignore
          }
          const initialProfile: UserProfile = {
            uid,
            displayName: currentUser.displayName || 'lifecircle ব্যবহারকারী',
            email: currentUser.email || '',
            phone: pendingPhone,
            address: '',
            twoFactorEnabled: false,
            driveBackupEnabled: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(doc(db, 'users', uid), initialProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    const unsub2FA = onSnapshot(
      doc(db, 'users', uid, 'security', 'totp'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserTwoFactor;
          setUserTwoFactor(data);
          if (!data.enabled) setTwoFactorVerified(true);
        } else {
          setUserTwoFactor(null);
          setTwoFactorVerified(true);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/security/totp`)
    );

    return () => {
      unsubAdminRole();
      unsubProfile();
      unsub2FA();
    };
  }, [authReady, currentUser]);

  // Seed default collections automatically when Super Admin connects
  useEffect(() => {
    if (!authReady || !isSuperAdmin) return;
    const seedIfEmpty = async () => {
      try {
        const settingsSnap = await getDocs(collection(db, 'siteSettings'));
        if (settingsSnap.empty) {
          await setDoc(doc(db, 'siteSettings', 'main'), {
            ...DEFAULT_SITE_SETTINGS,
            updatedAt: serverTimestamp(),
            updatedBy: currentUser?.uid || 'system',
          });
        }

        const bannersSnap = await getDocs(collection(db, 'banners'));
        if (bannersSnap.empty) {
          const batch = writeBatch(db);
          DEFAULT_BANNERS.forEach((b) => {
            batch.set(doc(db, 'banners', b.id), {
              ...b,
              createdBy: currentUser?.uid || 'system',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }

        const productsSnap = await getDocs(collection(db, 'products'));
        if (productsSnap.empty) {
          const batch = writeBatch(db);
          DEFAULT_PRODUCTS.forEach((p) => {
            batch.set(doc(db, 'products', p.id), {
              ...p,
              updatedAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }

        const diseasesSnap = await getDocs(collection(db, 'diseases'));
        if (diseasesSnap.empty) {
          const batch = writeBatch(db);
          DEFAULT_DISEASES.forEach((d) => {
            batch.set(doc(db, 'diseases', d.id), {
              ...d,
              updatedAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }

        const hospitalsSnap = await getDocs(collection(db, 'hospitals'));
        if (hospitalsSnap.empty) {
          const batch = writeBatch(db);
          DEFAULT_HOSPITALS.forEach((h) => {
            batch.set(doc(db, 'hospitals', h.id), {
              ...h,
              updatedAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }

        const faqsSnap = await getDocs(collection(db, 'faqs'));
        if (faqsSnap.empty) {
          const batch = writeBatch(db);
          DEFAULT_FAQS.forEach((f) => {
            batch.set(doc(db, 'faqs', f.id), {
              ...f,
              updatedAt: serverTimestamp(),
            });
          });
          await batch.commit();
        }
      } catch (err) {
        console.warn('Seed check notice:', err);
      }
    };
    seedIfEmpty();
  }, [authReady, isSuperAdmin, currentUser?.uid]);

  // Authenticated Private Listeners (Appointments, Orders, Notifications, Chat, Admin Lists)
  useEffect(() => {
    if (!authReady || !currentUser) return;
    const uid = currentUser.uid;

    const aptQ = isStaffOrAdmin
      ? query(collection(db, 'appointments'))
      : query(collection(db, 'appointments'), where('ownerUid', '==', uid));
    const unsubApt = onSnapshot(
      aptQ,
      (snap) => {
        setAppointments(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Appointment)
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'appointments')
    );

    const ordQ = isStaffOrAdmin
      ? query(collection(db, 'orders'))
      : query(collection(db, 'orders'), where('ownerUid', '==', uid));
    const unsubOrd = onSnapshot(
      ordQ,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const notifQ = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', uid)
    );
    const unsubNotif = onSnapshot(
      notifQ,
      (snap) => {
        setNotifications(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as AppNotification)
            .reverse()
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    const msgQ = query(
      collection(db, 'chatThreads', uid, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubCustChat = onSnapshot(
      msgQ,
      (snap) => {
        setCustomerMessages(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage)
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `chatThreads/${uid}/messages`)
    );

    let unsubThreads = () => {};
    let unsubFeedback = () => {};
    let unsubUsers = () => {};
    let unsubAdmins = () => {};

    if (isStaffOrAdmin) {
      unsubThreads = onSnapshot(
        collection(db, 'chatThreads'),
        (snap) => {
          setChatThreads(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatThread)
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'chatThreads')
      );

      unsubFeedback = onSnapshot(
        collection(db, 'feedback'),
        (snap) => {
          setFeedbackList(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FeedbackItem)
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'feedback')
      );

      unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snap) => {
          setUsersList(snap.docs.map((d) => d.data() as UserProfile));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'users')
      );

      unsubAdmins = onSnapshot(
        collection(db, 'admins'),
        (snap) => {
          setAdminRoles(snap.docs.map((d) => d.data() as AdminRole));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'admins')
      );
    }

    return () => {
      unsubApt();
      unsubOrd();
      unsubNotif();
      unsubCustChat();
      unsubThreads();
      unsubFeedback();
      unsubUsers();
      unsubAdmins();
    };
  }, [authReady, currentUser, isStaffOrAdmin]);

  // Admin active chat thread messages listener
  useEffect(() => {
    if (!authReady || !isStaffOrAdmin || !adminActiveThreadId) {
      setAdminThreadMessages([]);
      return;
    }
    const q = query(
      collection(db, 'chatThreads', adminActiveThreadId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAdminThreadMessages(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage)
        );
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          `chatThreads/${adminActiveThreadId}/messages`
        )
    );
    return () => unsub();
  }, [authReady, isStaffOrAdmin, adminActiveThreadId]);

  // Google Drive Backup Helper
  const performDriveBackup = useCallback(
    async (silent = false) => {
      if (!currentUser || !userProfile) {
        throw new Error('প্রথমে লগইন করুন।');
      }
      if (!getDriveAccessToken()) {
        if (silent) return null;
        throw new Error('NO_DRIVE_TOKEN');
      }
      const payload = {
        app: 'lifecircle.bd' as const,
        exportedAt: new Date().toISOString(),
        user: {
          uid: currentUser.uid,
          displayName: userProfile.displayName,
          email: userProfile.email,
          phone: userProfile.phone || '',
          address: userProfile.address || '',
        },
        appointments,
        orders,
        feedback: feedbackList.filter((f) => f.ownerUid === currentUser.uid),
        savedProductIds: cart.map((c) => c.product.id),
      };
      const meta = await uploadBackupToDrive(payload);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        lastDriveSyncAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
      return meta;
    },
    [currentUser, userProfile, appointments, orders, feedbackList, cart]
  );

  const createNotification = async (
    recipientUid: string,
    title: string,
    message: string,
    type: AppNotification['type']
  ) => {
    const id = makeId('notif');
    try {
      await setDoc(doc(db, 'notifications', id), {
        recipientUid,
        title: title.slice(0, 140),
        message: message.slice(0, 400),
        type,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${id}`);
    }
  };

  // --- Action Handlers ---
  const handleCreateAppointment = async (
    data: Omit<Appointment, 'id' | 'ownerUid' | 'status' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!currentUser) throw new Error('অ্যাপয়েন্টমেন্ট বুক করতে লগইন করুন।');
    const id = makeId('apt');
    try {
      await setDoc(doc(db, 'appointments', id), {
        ...data,
        ownerUid: currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await createNotification(
        currentUser.uid,
        'অ্যাপয়েন্টমেন্ট গৃহীত হয়েছে',
        `${data.preferredDate} (${data.preferredSlot}) তারিখে আপনার বুকিং নথিভুক্ত হয়েছে।`,
        'appointment'
      );
      if (userProfile?.driveBackupEnabled) {
        performDriveBackup(true).catch(() => {});
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `appointments/${id}`);
    }
  };

  const handlePlaceOrder = async (payload: {
    customerName: string;
    phone: string;
    address: string;
    paymentMethod: Order['paymentMethod'];
    items: OrderItem[];
    totalAmount: number;
  }) => {
    if (!currentUser) throw new Error('অর্ডার করতে লগইন করুন।');
    const id = makeId('ord');
    try {
      await setDoc(doc(db, 'orders', id), {
        ...payload,
        ownerUid: currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await createNotification(
        currentUser.uid,
        'অর্ডার অনুরোধ গৃহীত',
        `${payload.items.reduce((s, i) => s + i.quantity, 0)}টি পণ্যের অনুরোধ প্রক্রিয়াধীন রয়েছে।`,
        'order'
      );
      if (userProfile?.driveBackupEnabled) {
        performDriveBackup(true).catch(() => {});
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `orders/${id}`);
    }
  };

  const handleSendCustomerChat = async (text: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const threadRef = doc(db, 'chatThreads', uid);
    const existingThread = chatThreads.find((t) => t.id === uid);
    try {
      if (!existingThread && customerMessages.length === 0) {
        await setDoc(
          threadRef,
          {
            ownerUid: uid,
            customerName: userProfile?.displayName || currentUser.displayName || 'গ্রাহক',
            customerEmail: currentUser.email || '',
            lastMessage: text.slice(0, 500),
            unreadByAdmin: 1,
            unreadByUser: 0,
            status: 'open',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await updateDoc(threadRef, {
          lastMessage: text.slice(0, 500),
          unreadByAdmin: (existingThread?.unreadByAdmin || 0) + 1,
          updatedAt: serverTimestamp(),
        });
      }

      const msgId = makeId('msg');
      await setDoc(doc(db, 'chatThreads', uid, 'messages', msgId), {
        threadOwnerUid: uid,
        senderUid: uid,
        senderName: userProfile?.displayName || currentUser.displayName || 'গ্রাহক',
        senderRole: 'customer',
        text,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chatThreads/${uid}`);
    }
  };

  const handleSendAdminChatReply = async (
    threadId: string,
    ownerUid: string,
    text: string
  ) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'chatThreads', threadId), {
        lastMessage: text.slice(0, 500),
        unreadByUser: 1,
        unreadByAdmin: 0,
        updatedAt: serverTimestamp(),
      });
      const msgId = makeId('msg');
      await setDoc(doc(db, 'chatThreads', threadId, 'messages', msgId), {
        threadOwnerUid: ownerUid,
        senderUid: currentUser.uid,
        senderName: userProfile?.displayName || 'lifecircle সাপোর্ট',
        senderRole: 'admin',
        text,
        createdAt: serverTimestamp(),
      });
      await createNotification(
        ownerUid,
        'সাপোর্ট থেকে নতুন উত্তর এসেছে',
        text.slice(0, 200),
        'chat'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chatThreads/${threadId}`);
    }
  };

  const handleSubmitFeedback = async (
    data: Omit<FeedbackItem, 'id' | 'ownerUid' | 'status' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!currentUser) return;
    const id = makeId('fb');
    try {
      await setDoc(doc(db, 'feedback', id), {
        ...data,
        ownerUid: currentUser.uid,
        status: 'new',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `feedback/${id}`);
    }
  };

  // Search results summary helper
  const q = searchQuery.trim().toLowerCase();
  const matchingProductsCount = q
    ? products.filter((p) =>
        [p.nameBn, p.nameEn, p.descriptionBn, ...(p.relatedDiseases || [])]
          .join(' ')
          .toLowerCase()
          .includes(q)
      ).length
    : 0;
  const matchingDiseasesCount = q
    ? diseases.filter((d) =>
        [d.nameBn, d.nameEn, d.overviewBn, ...d.symptoms]
          .join(' ')
          .toLowerCase()
          .includes(q)
      ).length
    : 0;
  const matchingHospitalsCount = q
    ? hospitals.filter((h) =>
        [h.nameBn, h.nameEn, h.locationBn, h.division]
          .join(' ')
          .toLowerCase()
          .includes(q)
      ).length
    : 0;

  const needs2FAChallenge =
    !!currentUser &&
    !!userTwoFactor?.enabled &&
    !twoFactorVerified &&
    (currentPage === 'dashboard' || currentPage === 'admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <TopBar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isAuthenticated={!!currentUser}
        onSecretAdminTrigger={() => setAdminLoginOpen(true)}
      />

      <WorkspaceBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => {
          if (currentPage === 'dashboard' || currentPage === 'admin') {
            setCurrentPage('home');
          }
        }}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenChat={() => setChatOpen(true)}
        notifications={notifications}
        onMarkNotificationRead={async (id) => {
          try {
            await updateDoc(doc(db, 'notifications', id), { read: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `notifications/${id}`);
          }
        }}
        onMarkAllNotificationsRead={async () => {
          const unread = notifications.filter((n) => !n.read);
          await Promise.all(
            unread.map((n) =>
              updateDoc(doc(db, 'notifications', n.id), { read: true })
            )
          );
        }}
        onNavigate={setCurrentPage}
      />

      {/* Instant Cross-Catalog Search Summary Strip */}
      {q.length > 0 && (
        <div className="bg-sky-50 dark:bg-sky-950/40 border-b border-sky-200 dark:border-sky-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-700 dark:text-slate-200">
              <strong>"{searchQuery}"</strong> অনুসন্ধানের ফলাফল:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentPage('products')}
                className="px-3 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-[#2D89C8]"
              >
                যন্ত্রপাতি ({matchingProductsCount})
              </button>
              <button
                onClick={() => setCurrentPage('diseases')}
                className="px-3 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-[#2DA94F]"
              >
                রোগ নির্দেশিকা ({matchingDiseasesCount})
              </button>
              <button
                onClick={() => setCurrentPage('hospitals')}
                className="px-3 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-[#1D2B53] dark:text-sky-300"
              >
                হাসপাতাল ({matchingHospitalsCount})
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {currentPage === 'home' && (
          <>
            <HeroSlidebar
              banners={banners}
              onNavigate={(p) => setCurrentPage(p)}
            />

            <CatalogSection
              products={products}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onAddToCart={(product) => {
                setCart((prev) => {
                  const found = prev.find((c) => c.product.id === product.id);
                  if (found) {
                    return prev.map((c) =>
                      c.product.id === product.id
                        ? { ...c, quantity: c.quantity + 1 }
                        : c
                    );
                  }
                  return [...prev, { product, quantity: 1 }];
                });
                setCartOpen(true);
              }}
              onBookProductDemo={(p) => {
                setDefaultServiceType(
                  p.category === 'cpap' || p.category === 'bipap'
                    ? 'cpap-bipap-setup'
                    : 'device-demo'
                );
                setCurrentPage('appointments');
              }}
            />

            <SleepTestSection
              settings={settings}
              onBookSleepTest={(type) => {
                setDefaultServiceType(type);
                setCurrentPage('appointments');
              }}
            />

            {/* Quick Navigation Cards to Disease Guide & Government Hospitals Directory */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#2D89C8]">
                      <HeartPulse className="w-4 h-4" />
                      <span>সচেতনতা ও প্রাথমিক চিকিৎসা</span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-[#1D2B53] dark:text-white">
                      রোগের বিস্তারিত বর্ণনা, লক্ষণ ও করণীয়
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      উচ্চ রক্তচাপ, ডায়াবেটিস, স্লিপ অ্যাপনিয়া, সিওপিডি ও জ্বরের লক্ষণ এবং করণীয় সম্পর্কে সহজ বাংলায় জানুন।
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentPage('diseases')}
                    className="self-start px-4 py-2 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-xs font-semibold"
                  >
                    রোগ নির্দেশিকা দেখুন
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#2DA94F]">
                      <Building2 className="w-4 h-4" />
                      <span>বাংলাদেশ হেলথ ডিরেক্টরি</span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-[#1D2B53] dark:text-white">
                      সরকারি ও স্বায়ত্তশাসিত হাসপাতালের জরুরি নম্বর
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      ঢাকা মেডিকেল, বিএসএমএমইউ, বক্ষব্যাধি, বারডেমসহ দেশের ৮ বিভাগের সব প্রধান সরকারি ও স্বায়ত্তশাসিত হাসপাতালের ঠিকানা ও জরুরি কল।
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentPage('hospitals')}
                    className="self-start px-4 py-2 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] text-white text-xs font-semibold"
                  >
                    হাসপাতাল তালিকা দেখুন
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {currentPage === 'products' && (
          <CatalogSection
            products={products}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onAddToCart={(product) => {
              setCart((prev) => {
                const found = prev.find((c) => c.product.id === product.id);
                if (found) {
                  return prev.map((c) =>
                    c.product.id === product.id
                      ? { ...c, quantity: c.quantity + 1 }
                      : c
                  );
                }
                return [...prev, { product, quantity: 1 }];
              });
              setCartOpen(true);
            }}
            onBookProductDemo={(p) => {
              setDefaultServiceType(
                p.category === 'cpap' || p.category === 'bipap'
                  ? 'cpap-bipap-setup'
                  : 'device-demo'
              );
              setCurrentPage('appointments');
            }}
          />
        )}

        {currentPage === 'sleep-test' && (
          <SleepTestSection
            settings={settings}
            onBookSleepTest={(type) => {
              setDefaultServiceType(type);
              setCurrentPage('appointments');
            }}
          />
        )}

        {currentPage === 'diseases' && (
          <DiseaseGuideSection
            diseases={diseases}
            searchQuery={searchQuery}
            onJumpToCategory={(cat) => {
              if (cat === 'sleep-test') {
                setCurrentPage('sleep-test');
              } else {
                setSelectedCategory(cat);
                setCurrentPage('products');
              }
            }}
          />
        )}

        {currentPage === 'hospitals' && (
          <HospitalsDirectorySection
            hospitals={hospitals}
            searchQuery={searchQuery}
          />
        )}

        {currentPage === 'appointments' && (
          <AppointmentSection
            defaultServiceType={defaultServiceType}
            userEmail={currentUser?.email}
            userName={userProfile?.displayName || currentUser?.displayName}
            userPhone={userProfile?.phone}
            userAddress={userProfile?.address}
            isAuthenticated={!!currentUser}
            onRequireSignIn={() => setAuthModalOpen(true)}
            onCreateAppointment={handleCreateAppointment}
          />
        )}

        {currentPage === 'about' && <AboutSection settings={settings} />}
        {currentPage === 'faq' && (
          <FaqSection faqs={faqs} whatsapp={settings.whatsapp || settings.phonePrimary || '01754149749'} />
        )}
        {currentPage === 'contact' && (
          <ContactAndFeedbackSection
            settings={settings}
            isAuthenticated={!!currentUser}
            userName={userProfile?.displayName || currentUser?.displayName}
            onRequireSignIn={() => setAuthModalOpen(true)}
            onOpenChat={() => setChatOpen(true)}
            onSubmitFeedback={handleSubmitFeedback}
          />
        )}

        {currentPage === 'dashboard' &&
          (!currentUser ? (
            <section className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-4">
                <ShieldCheck className="w-10 h-10 text-[#2D89C8] mx-auto" />
                <h2 className="text-xl font-bold text-[#1D2B53] dark:text-white">
                  আপনার ব্যক্তিগত স্বাস্থ্য ও ব্যাকআপ ড্যাশবোর্ড
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  গুগল ড্রাইভে স্বয়ংক্রিয় ব্যাকআপ, ২FA নিরাপত্তা এবং অ্যাপয়েন্টমেন্ট ট্র্যাকিং ব্যবহার করতে সাইন ইন করুন।
                </p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-5 py-2.5 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] text-white text-sm font-semibold"
                >
                  লগইন / অ্যাকাউন্ট খুলুন
                </button>
              </div>
            </section>
          ) : (
            <UserDashboard
              profile={userProfile}
              twoFactor={userTwoFactor}
              appointments={appointments.filter((a) => a.ownerUid === currentUser.uid)}
              orders={orders.filter((o) => o.ownerUid === currentUser.uid)}
              hasDriveToken={hasDriveToken}
              isOnline={isOnline}
              onReconnectDrive={async () => {
                const res = await signInWithGoogleDrive();
                setHasDriveToken(!!res.accessToken);
              }}
              onUpdateProfile={async (patch) => {
                try {
                  await updateDoc(doc(db, 'users', currentUser.uid), {
                    ...patch,
                    updatedAt: serverTimestamp(),
                  });
                } catch (err) {
                  handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
                }
              }}
              onCancelAppointment={async (id) => {
                try {
                  await updateDoc(doc(db, 'appointments', id), {
                    status: 'cancelled',
                    updatedAt: serverTimestamp(),
                  });
                } catch (err) {
                  handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
                }
              }}
              onCancelOrder={async (id) => {
                try {
                  await updateDoc(doc(db, 'orders', id), {
                    status: 'cancelled',
                    updatedAt: serverTimestamp(),
                  });
                } catch (err) {
                  handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
                }
              }}
              onBackupNow={async () => {
                const meta = await performDriveBackup(false);
                if (!meta) throw new Error('NO_DRIVE_TOKEN');
                await createNotification(
                  currentUser.uid,
                  'Google Drive ব্যাকআপ সম্পন্ন',
                  'আপনার সব তথ্য নিরাপদে Google Drive-এ সংরক্ষিত হয়েছে।',
                  'backup'
                );
                return meta;
              }}
              onEnableTwoFactor={async (secret, backupCodes) => {
                try {
                  await setDoc(doc(db, 'users', currentUser.uid, 'security', 'totp'), {
                    uid: currentUser.uid,
                    secret,
                    enabled: true,
                    backupCodes,
                    updatedAt: serverTimestamp(),
                  });
                  await updateDoc(doc(db, 'users', currentUser.uid), {
                    twoFactorEnabled: true,
                    updatedAt: serverTimestamp(),
                  });
                  setTwoFactorVerified(true);
                } catch (err) {
                  handleFirestoreError(
                    err,
                    OperationType.WRITE,
                    `users/${currentUser.uid}/security/totp`
                  );
                }
              }}
              onDisableTwoFactor={async () => {
                try {
                  await deleteDoc(doc(db, 'users', currentUser.uid, 'security', 'totp'));
                  await updateDoc(doc(db, 'users', currentUser.uid), {
                    twoFactorEnabled: false,
                    updatedAt: serverTimestamp(),
                  });
                } catch (err) {
                  handleFirestoreError(
                    err,
                    OperationType.DELETE,
                    `users/${currentUser.uid}/security/totp`
                  );
                }
              }}
              onLogout={async () => {
                await logoutUser();
                setCurrentPage('home');
              }}
            />
          ))}

        {currentPage === 'admin' && isAdminPanelUnlocked && (
          <AdminDashboard
            settings={settings}
            banners={banners}
            products={products}
            diseases={diseases}
            hospitals={hospitals}
            faqs={faqs}
            appointments={appointments}
            orders={orders}
            chatThreads={chatThreads}
            activeThreadId={adminActiveThreadId}
            activeThreadMessages={adminThreadMessages}
            feedbackList={feedbackList}
            usersList={usersList}
            adminRoles={adminRoles}
            isSuperAdmin={isSuperAdmin}
            adminToken={adminToken}
            adminIdentifier={adminIdentifier}
            onConnectCloudAdmin={async () => {
              const res = await signInWithGoogleDrive();
              setHasDriveToken(!!res.accessToken);
            }}
            onExitAdminPanel={() => {
              setAdminToken(null);
              setAdminIdentifier(null);
              setCurrentPage('home');
            }}
            onSelectChatThread={(tid) => setAdminActiveThreadId(tid)}
            onSendAdminChatReply={handleSendAdminChatReply}
            onSaveSettings={async (s) => {
              setSettings(s);
              if (!isSuperAdmin || !currentUser) return;
              try {
                await setDoc(doc(db, 'siteSettings', 'main'), {
                  ...s,
                  updatedAt: serverTimestamp(),
                  updatedBy: currentUser.uid,
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, 'siteSettings/main');
              }
            }}
            onAddBanner={async (b) => {
              const id = makeId('banner');
              const nextBanner: Banner = { ...b, id, createdBy: currentUser?.uid || 'admin' };
              setBanners((prev) => [...prev, nextBanner]);
              if (!isSuperAdmin || !currentUser) return;
              try {
                await setDoc(doc(db, 'banners', id), {
                  ...b,
                  createdBy: currentUser.uid,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, `banners/${id}`);
              }
            }}
            onDeleteBanner={async (id) => {
              setBanners((prev) => prev.filter((b) => b.id !== id));
              if (!isSuperAdmin) return;
              try {
                await deleteDoc(doc(db, 'banners', id));
              } catch (err) {
                handleFirestoreError(err, OperationType.DELETE, `banners/${id}`);
              }
            }}
            onToggleBannerActive={async (b) => {
              setBanners((prev) =>
                prev.map((item) => (item.id === b.id ? { ...item, active: !item.active } : item))
              );
              if (!isSuperAdmin) return;
              try {
                await updateDoc(doc(db, 'banners', b.id), {
                  active: !b.active,
                  updatedAt: serverTimestamp(),
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.UPDATE, `banners/${b.id}`);
              }
            }}
            onSaveProduct={async (p, existingId) => {
              const id = existingId || makeId('prod');
              setProducts((prev) => {
                const exists = prev.some((item) => item.id === id);
                return exists
                  ? prev.map((item) => (item.id === id ? { ...p, id } : item))
                  : [{ ...p, id }, ...prev];
              });
              if (!isSuperAdmin) return;
              try {
                await setDoc(doc(db, 'products', id), {
                  ...p,
                  updatedAt: serverTimestamp(),
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
              }
            }}
            onDeleteProduct={async (id) => {
              setProducts((prev) => prev.filter((p) => p.id !== id));
              if (!isSuperAdmin) return;
              try {
                await deleteDoc(doc(db, 'products', id));
              } catch (err) {
                handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
              }
            }}
            onAddHospital={async (h) => {
              const id = makeId('hosp');
              setHospitals((prev) => [...prev, { ...h, id }]);
              if (!isSuperAdmin) return;
              try {
                await setDoc(doc(db, 'hospitals', id), {
                  ...h,
                  updatedAt: serverTimestamp(),
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, `hospitals/${id}`);
              }
            }}
            onDeleteHospital={async (id) => {
              setHospitals((prev) => prev.filter((h) => h.id !== id));
              if (!isSuperAdmin) return;
              try {
                await deleteDoc(doc(db, 'hospitals', id));
              } catch (err) {
                handleFirestoreError(err, OperationType.DELETE, `hospitals/${id}`);
              }
            }}
            onAddFaq={async (f) => {
              const id = makeId('faq');
              setFaqs((prev) => [...prev, { ...f, id }]);
              if (!isSuperAdmin) return;
              try {
                await setDoc(doc(db, 'faqs', id), {
                  ...f,
                  updatedAt: serverTimestamp(),
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, `faqs/${id}`);
              }
            }}
            onDeleteFaq={async (id) => {
              setFaqs((prev) => prev.filter((f) => f.id !== id));
              if (!isSuperAdmin) return;
              try {
                await deleteDoc(doc(db, 'faqs', id));
              } catch (err) {
                handleFirestoreError(err, OperationType.DELETE, `faqs/${id}`);
              }
            }}
            onUpdateAppointmentStatus={async (apt, status) => {
              if (!isStaffOrAdmin) return;
              try {
                await updateDoc(doc(db, 'appointments', apt.id), {
                  status,
                  updatedAt: serverTimestamp(),
                });
                await createNotification(
                  apt.ownerUid,
                  'অ্যাপয়েন্টমেন্ট আপডেট',
                  `আপনার ${apt.preferredDate} তারিখের অ্যাপয়েন্টমেন্টের অবস্থা "${status}" করা হয়েছে।`,
                  'appointment'
                );
              } catch (err) {
                handleFirestoreError(err, OperationType.UPDATE, `appointments/${apt.id}`);
              }
            }}
            onUpdateOrderStatus={async (ord, status) => {
              if (!isStaffOrAdmin) return;
              try {
                await updateDoc(doc(db, 'orders', ord.id), {
                  status,
                  updatedAt: serverTimestamp(),
                });
                await createNotification(
                  ord.ownerUid,
                  'অর্ডার আপডেট',
                  `আপনার অর্ডারের অবস্থা এখন "${status}"।`,
                  'order'
                );
              } catch (err) {
                handleFirestoreError(err, OperationType.UPDATE, `orders/${ord.id}`);
              }
            }}
            onReplyFeedback={async (fb, reply) => {
              if (!isStaffOrAdmin) return;
              try {
                await updateDoc(doc(db, 'feedback', fb.id), {
                  status: 'reviewed',
                  adminReply: reply,
                  updatedAt: serverTimestamp(),
                });
                await createNotification(
                  fb.ownerUid,
                  'আপনার ফিডব্যাকের উত্তর',
                  reply.slice(0, 200),
                  'system'
                );
              } catch (err) {
                handleFirestoreError(err, OperationType.UPDATE, `feedback/${fb.id}`);
              }
            }}
            onGrantRole={async (uid, email, name, role) => {
              if (!isSuperAdmin || !currentUser) return;
              try {
                await setDoc(doc(db, 'admins', uid), {
                  uid,
                  email,
                  name,
                  role,
                  addedBy: currentUser.uid,
                  createdAt: serverTimestamp(),
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, `admins/${uid}`);
              }
            }}
            onRevokeRole={async (uid) => {
              if (!isSuperAdmin) return;
              try {
                await deleteDoc(doc(db, 'admins', uid));
              } catch (err) {
                handleFirestoreError(err, OperationType.DELETE, `admins/${uid}`);
              }
            }}
          />
        )}
      </main>

      {/* Clean Brand Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img
                src="/lifecircle-logo.png"
                alt="lifecircle.bd"
                referrerPolicy="no-referrer"
                className="w-8 h-8 object-contain rounded bg-white p-0.5 border border-slate-200"
              />
              <span className="text-base font-bold text-[#1D2B53] dark:text-white">
                lifecircle<span className="text-[#2DA94F]">.bd</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {settings.tagline}
            </p>
            {settings.address && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {settings.address}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#1D2B53] dark:text-white mb-3">
              সেবা ও পণ্য
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => setCurrentPage('products')} className="hover:text-[#2D89C8]">
                  মেডিকেল যন্ত্রপাতি ক্যাটালগ
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('sleep-test')} className="hover:text-[#2D89C8]">
                  হোম ও ক্লিনিক স্লিপ টেস্ট
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('appointments')} className="hover:text-[#2D89C8]">
                  অনলাইন অ্যাপয়েন্টমেন্ট
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('diseases')} className="hover:text-[#2D89C8]">
                  রোগ ও ডায়াবেটিস নির্দেশিকা
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#1D2B53] dark:text-white mb-3">
              তথ্য ও সহায়তা
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => setCurrentPage('hospitals')} className="hover:text-[#2D89C8]">
                  সরকারি হাসপাতালের তালিকা
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('about')} className="hover:text-[#2D89C8]">
                  আমাদের সম্পর্কে (About Us)
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('faq')} className="hover:text-[#2D89C8]">
                  সাধারণ প্রশ্নোত্তর (FAQ)
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('contact')} className="hover:text-[#2D89C8]">
                  যোগাযোগ ও ফিডব্যাক ফর্ম
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <h4 className="text-xs font-bold text-[#1D2B53] dark:text-white mb-3">
              তাৎক্ষণিক যোগাযোগ
            </h4>
            <p className="flex items-center gap-2 font-mono-num font-semibold text-[#1D2B53] dark:text-white">
              <PhoneCall className="w-3.5 h-3.5 text-[#2DA94F]" />
              <span>WhatsApp: {settings.whatsapp || settings.phonePrimary || '01754149749'}</span>
            </p>
            <p className="font-mono-num font-semibold text-pink-600 dark:text-pink-400">
              bKash: {settings.bkash || '01711480987'}
            </p>
            <p>{settings.email}</p>
            <p className="flex items-center gap-1.5 text-[#2DA94F]">
              <Activity className="w-3.5 h-3.5" />
              <span>অফলাইন অ্যাক্সেস ও ২FA নিরাপত্তা</span>
            </p>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 py-4 px-4 sm:px-6 text-center text-xs text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} {settings.companyName} · সর্বস্বত্ব সংরক্ষিত।
        </div>
      </footer>

      {/* Drawers & Modals */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQty={(pid, delta) => {
          setCart((prev) =>
            prev
              .map((c) =>
                c.product.id === pid ? { ...c, quantity: c.quantity + delta } : c
              )
              .filter((c) => c.quantity > 0)
          );
        }}
        onRemoveItem={(pid) =>
          setCart((prev) => prev.filter((c) => c.product.id !== pid))
        }
        onClearCart={() => setCart([])}
        isAuthenticated={!!currentUser}
        defaultName={userProfile?.displayName || currentUser?.displayName || ''}
        defaultPhone={userProfile?.phone || ''}
        defaultAddress={userProfile?.address || ''}
        bkashNumber={settings.bkash || '01711480987'}
        whatsappNumber={settings.whatsapp || settings.phonePrimary || '01754149749'}
        onRequireSignIn={() => {
          setCartOpen(false);
          setAuthModalOpen(true);
        }}
        onPlaceOrder={handlePlaceOrder}
      />

      <LiveChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        isAuthenticated={!!currentUser}
        currentUid={currentUser?.uid}
        messages={customerMessages}
        onRequireSignIn={() => {
          setChatOpen(false);
          setAuthModalOpen(true);
        }}
        onSendMessage={handleSendCustomerChat}
      />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onGoogleDriveSignIn={async () => {
          const res = await signInWithGoogleDrive();
          setHasDriveToken(!!res.accessToken);
        }}
        onEmailSignUp={async (name, email, phone, password) => {
          const user = await signUpWithEmail(name, email, password);
          if (phone.trim()) {
            try {
              localStorage.setItem(`lc_pending_phone_${user.uid}`, phone.trim());
            } catch {
              // ignore
            }
          }
        }}
        onEmailSignIn={async (email, password) => {
          await signInWithEmail(email, password);
        }}
      />

      {userTwoFactor && (
        <TwoFactorChallengeModal
          open={needs2FAChallenge}
          secret={userTwoFactor.secret}
          backupCodes={userTwoFactor.backupCodes}
          onVerified={async (usedBackup) => {
            setTwoFactorVerified(true);
            if (usedBackup && currentUser) {
              const remaining = userTwoFactor.backupCodes.filter(
                (c) => c !== usedBackup
              );
              await updateDoc(doc(db, 'users', currentUser.uid, 'security', 'totp'), {
                backupCodes: remaining,
                updatedAt: serverTimestamp(),
              });
            }
          }}
          onLogout={async () => {
            await logoutUser();
            setCurrentPage('home');
          }}
        />
      )}

      <HiddenAdminLoginModal
        open={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        onAdminAuthenticated={(token, identifier) => {
          setAdminToken(token);
          setAdminIdentifier(identifier);
          setCurrentPage('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <RegistrationNoticePopup
        open={regPopupOpen && !currentUser}
        onRegister={() => {
          setRegPopupOpen(false);
          setRegPopupDismissed(true);
          setAuthModalOpen(true);
        }}
        onDismiss={() => {
          setRegPopupOpen(false);
          setRegPopupDismissed(true);
        }}
      />

      <OfflineIndicator />
    </div>
  );
}
