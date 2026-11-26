export type Language = 'bn' | 'en';

export type PageRoute =
  | 'home'
  | 'products'
  | 'sleep-test'
  | 'diseases'
  | 'hospitals'
  | 'appointments'
  | 'dashboard'
  | 'admin'
  | 'about'
  | 'faq'
  | 'contact';

export type ProductCategory =
  | 'bp'
  | 'diabetes'
  | 'thermometer'
  | 'oxygen'
  | 'bipap'
  | 'cpap'
  | 'mask'
  | 'sleep-test';

export interface SiteSettings {
  companyName: string;
  tagline?: string;
  address: string;
  addresses?: string[];
  city?: string;
  phonePrimary: string;
  phoneEmergency?: string;
  whatsapp?: string;
  bkash?: string;
  email: string;
  hours?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  sleepLabNote?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaTarget?: 'products' | 'sleep-test' | 'diseases' | 'hospitals' | 'appointments' | 'contact';
  imageUrl: string;
  order: number;
  active: boolean;
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  nameBn: string;
  nameEn: string;
  category: ProductCategory;
  price?: number;
  warranty?: string;
  inStock: boolean;
  descriptionBn: string;
  features?: string[];
  relatedDiseases?: string[];
  imageUrl?: string;
  updatedAt?: unknown;
}

export interface DiseaseGuide {
  id: string;
  nameBn: string;
  nameEn: string;
  overviewBn: string;
  symptoms: string[];
  immediateActions: string[];
  treatmentBn: string;
  recommendedCategories?: ProductCategory[];
  updatedAt?: unknown;
}

export interface Hospital {
  id: string;
  nameBn: string;
  nameEn: string;
  type: 'government' | 'autonomous';
  division: string;
  locationBn: string;
  emergencyPhone: string;
  generalPhone?: string;
  specialties?: string;
  updatedAt?: unknown;
}

export interface FaqItem {
  id: string;
  questionBn: string;
  answerBn: string;
  category?: string;
  order: number;
  updatedAt?: unknown;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  address?: string;
  twoFactorEnabled: boolean;
  driveBackupEnabled: boolean;
  lastDriveSyncAt?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserTwoFactor {
  uid: string;
  secret: string;
  enabled: boolean;
  backupCodes: string[];
  updatedAt?: unknown;
}

export interface AdminRole {
  uid: string;
  email: string;
  name?: string;
  role: 'admin' | 'staff';
  addedBy: string;
  createdAt?: unknown;
}

export interface Appointment {
  id: string;
  ownerUid: string;
  patientName: string;
  phone: string;
  email?: string;
  serviceType: 'home-sleep-test' | 'clinic-sleep-test' | 'cpap-bipap-setup' | 'device-demo';
  preferredDate: string;
  preferredSlot: string;
  address: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OrderItem {
  productId: string;
  nameBn: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  ownerUid: string;
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'cod' | 'bkash' | 'card';
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatThread {
  id: string;
  ownerUid: string;
  customerName: string;
  customerEmail?: string;
  lastMessage: string;
  unreadByAdmin?: number;
  unreadByUser?: number;
  status: 'open' | 'resolved';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  threadOwnerUid: string;
  senderUid: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  text: string;
  createdAt?: unknown;
}

export interface AppNotification {
  id: string;
  recipientUid: string;
  title: string;
  message: string;
  type: 'appointment' | 'order' | 'chat' | 'backup' | 'system';
  read: boolean;
  createdAt?: unknown;
}

export interface FeedbackItem {
  id: string;
  ownerUid: string;
  name: string;
  phone?: string;
  rating: number;
  category: 'product' | 'sleep-test' | 'support' | 'website';
  message: string;
  status: 'new' | 'reviewed';
  adminReply?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const FIELD_LIMITS = {
  TITLE_MAX: 140,
  SUBTITLE_MAX: 320,
  NAME_MAX: 120,
  PHONE_MAX: 30,
  EMAIL_MAX: 140,
  ADDRESS_MAX: 300,
  NOTES_MAX: 600,
  MESSAGE_MAX: 1500,
  IMAGE_URL_MAX: 500000,
} as const;
