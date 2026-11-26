import React, { useState } from 'react';
import { CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { FIELD_LIMITS, Order, OrderItem, Product } from '../types';

export interface CartEntry {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartEntry[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  isAuthenticated: boolean;
  defaultName?: string;
  defaultPhone?: string;
  defaultAddress?: string;
  bkashNumber?: string;
  whatsappNumber?: string;
  onRequireSignIn: () => void;
  onPlaceOrder: (payload: {
    customerName: string;
    phone: string;
    address: string;
    paymentMethod: Order['paymentMethod'];
    items: OrderItem[];
    totalAmount: number;
  }) => Promise<void>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  isAuthenticated,
  defaultName,
  defaultPhone,
  defaultAddress,
  bkashNumber = '01711480987',
  whatsappNumber = '01754149749',
  onRequireSignIn,
  onPlaceOrder,
}) => {
  const [customerName, setCustomerName] = useState(defaultName || '');
  const [phone, setPhone] = useState(defaultPhone || '');
  const [address, setAddress] = useState(defaultAddress || '');
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!isAuthenticated) {
      onRequireSignIn();
      return;
    }
    if (items.length === 0) return;
    if (customerName.trim().length < 2 || phone.trim().length < 6 || address.trim().length < 4) {
      setErr('অনুগ্রহ করে নাম, মোবাইল নম্বর এবং ডেলিভারি ঠিকানা সঠিকভাবে লিখুন।');
      return;
    }

    setSubmitting(true);
    try {
      await onPlaceOrder({
        customerName: customerName.trim().slice(0, FIELD_LIMITS.NAME_MAX),
        phone: phone.trim().slice(0, FIELD_LIMITS.PHONE_MAX),
        address: address.trim().slice(0, FIELD_LIMITS.ADDRESS_MAX),
        paymentMethod,
        items: items.map((i) => ({
          productId: i.product.id,
          nameBn: i.product.nameBn,
          price: 0,
          quantity: i.quantity,
        })),
        totalAmount: 0,
      });
      onClearCart();
      setOrderDone(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'অনুরোধ সম্পন্ন করা যায়নি।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col border-l border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#2D89C8]" />
            <h3 className="text-base font-bold text-[#1D2B53] dark:text-white">
              আপনার পণ্যের তালিকা ({totalQty})
            </h3>
          </div>
          <button
            onClick={() => {
              setOrderDone(false);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {orderDone ? (
            <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#2DA94F] mx-auto" />
              <h4 className="text-base font-bold text-[#1D2B53] dark:text-white">
                আপনার অর্ডার অনুরোধ সফলভাবে গৃহীত হয়েছে!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                আমাদের প্রতিনিধি শীঘ্রই WhatsApp (<span className="font-mono-num font-bold">{whatsappNumber}</span>) বা ফোনে আপনার সাথে যোগাযোগ করবেন।
              </p>
              <button
                onClick={() => {
                  setOrderDone(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-[#2D89C8] text-white text-xs font-semibold"
              >
                ঠিক আছে
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
              আপনার তালিকায় এখনো কোনো যন্ত্রপাতি যোগ করা হয়নি।
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((entry) => (
                  <div key={entry.product.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1D2B53] dark:text-white truncate">
                        {entry.product.nameBn}
                      </p>
                      <p className="font-mono-num text-xs text-slate-500 dark:text-slate-400">
                        পরিমাণ: {entry.quantity} টি
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateQty(entry.product.id, -1)}
                        className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono-num text-xs font-bold w-6 text-center">
                        {entry.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQty(entry.product.id, 1)}
                        className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(entry.product.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCheckout} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>মোট নির্বাচিত যন্ত্র</span>
                  <span className="font-mono-num text-sm font-bold text-[#2D89C8]">
                    {totalQty} টি
                  </span>
                </div>

                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.NAME_MAX}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="গ্রাহকের পূর্ণ নাম *"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />
                <input
                  type="tel"
                  required
                  maxLength={FIELD_LIMITS.PHONE_MAX}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="মোবাইল নম্বর *"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono-num"
                />
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.ADDRESS_MAX}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ডেলিভারি ঠিকানা *"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                />

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as Order['paymentMethod'])}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
                >
                  <option value="cod">ক্যাশ অন ডেলিভারি (COD)</option>
                  <option value="bkash">বিকাশ পেমেন্ট ({bkashNumber})</option>
                  <option value="card">কার্ড / ব্যাংক ট্রান্সফার</option>
                </select>

                {paymentMethod === 'bkash' && (
                  <p className="p-2.5 rounded-lg bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900 text-xs text-slate-700 dark:text-slate-200">
                    বিকাশ নম্বর: <strong className="font-mono-num">{bkashNumber}</strong> · বিস্তারিত জানতে WhatsApp: <strong className="font-mono-num">{whatsappNumber}</strong>
                  </p>
                )}

                {err && <p className="text-xs text-rose-600 font-medium">{err}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {submitting
                    ? 'অনুরোধ প্রসেস হচ্ছে...'
                    : isAuthenticated
                      ? 'অর্ডার অনুরোধ পাঠান'
                      : 'সাইন ইন করে পাঠান'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
