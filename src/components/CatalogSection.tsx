import React, { useState } from 'react';
import { Check, Info, ShoppingBag, Stethoscope, X } from 'lucide-react';
import { Product, ProductCategory } from '../types';

interface CatalogSectionProps {
  products: Product[];
  searchQuery: string;
  selectedCategory: ProductCategory | 'all';
  onSelectCategory: (cat: ProductCategory | 'all') => void;
  onAddToCart: (product: Product) => void;
  onBookProductDemo: (product: Product) => void;
}

const CATEGORY_LABELS: { id: ProductCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'সব যন্ত্রপাতি' },
  { id: 'bp', label: 'বিপি মেশিন' },
  { id: 'diabetes', label: 'ডায়াবেটিস মেশিন' },
  { id: 'thermometer', label: 'থার্মোমিটার' },
  { id: 'oxygen', label: 'অক্সিজেন কনসেন্ট্রেটর' },
  { id: 'bipap', label: 'বাইপ্যাপ মেশিন' },
  { id: 'cpap', label: 'সি-প্যাপ মেশিন' },
  { id: 'mask', label: 'সিঙ্গেল এনপিভি মাস্ক' },
];

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  products,
  searchQuery,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onBookProductDemo,
}) => {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [brokenImgs, setBrokenImgs] = useState<Record<string, boolean>>({});

  const q = searchQuery.trim().toLowerCase();
  const filtered = products.filter((p) => {
    const catMatch = selectedCategory === 'all' || p.category === selectedCategory;
    if (!catMatch) return false;
    if (!q) return true;
    const haystack = [
      p.nameBn,
      p.nameEn,
      p.descriptionBn,
      p.category,
      ...(p.relatedDiseases || []),
      ...(p.features || []),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <p className="text-xs font-semibold text-[#2DA94F] tracking-wide">
            অথেনটিক মেডিকেল ইকুইপমেন্ট ক্যাটালগ
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#1D2B53] dark:text-white">
            প্রয়োজনীয় মেডিকেল যন্ত্রপাতিসমূহ
          </h2>
        </div>

        {/* Interactive Category Segmented Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORY_LABELS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-[#2D89C8] text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#2D89C8]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            আপনার খোঁজা "{searchQuery}" অনুযায়ী কোনো যন্ত্রপাতি পাওয়া যায়নি।
          </p>
          <button
            onClick={() => onSelectCategory('all')}
            className="mt-3 px-4 py-2 rounded-lg bg-[#2D89C8] text-white text-xs font-semibold"
          >
            সব যন্ত্রপাতি দেখুন
          </button>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => {
            const imgBroken = !product.imageUrl || !!brokenImgs[product.id];
            return (
              <article
                key={product.id}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {!imgBroken ? (
                    <img
                      src={product.imageUrl}
                      alt={product.nameBn}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImgs((prev) => ({ ...prev, [product.id]: true }))
                      }
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900 text-[#2D89C8]">
                      <Stethoscope className="w-10 h-10 mb-2" />
                      <span className="text-xs font-medium px-4 text-center">
                        {product.nameBn}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Name & Description Directly Beneath the Picture (Zero Price Tags) */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{product.nameEn}</span>
                      <span aria-hidden="true">·</span>
                      <span className={product.inStock ? 'text-[#2DA94F] font-medium' : 'text-rose-600'}>
                        {product.inStock ? 'উপলব্ধ' : 'স্টক শেষ'}
                      </span>
                    </div>

                    <h3 className="mt-1.5 text-base font-bold text-[#1D2B53] dark:text-white leading-snug">
                      {product.nameBn}
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {product.descriptionBn}
                    </p>

                    {product.relatedDiseases && product.relatedDiseases.length > 0 && (
                      <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                        ব্যবহার: {product.relatedDiseases.slice(0, 3).join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1D2B53] dark:text-sky-300">
                        {product.warranty || 'অফিসিয়াল ওয়ারেন্টি ও হোম সাপোর্ট'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setActiveProduct(product)}
                        aria-label={`${product.nameBn} বিস্তারিত`}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#2D89C8] hover:text-[#2D89C8]"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onAddToCart(product)}
                        disabled={!product.inStock}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2D89C8] hover:bg-[#236FA3] disabled:opacity-50 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        তালিকায় যোগ করুন
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal (No Price Shown) */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeProduct.nameEn}
                </p>
                <h3 className="text-lg font-bold text-[#1D2B53] dark:text-white">
                  {activeProduct.nameBn}
                </h3>
              </div>
              <button
                onClick={() => setActiveProduct(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {activeProduct.imageUrl && !brokenImgs[activeProduct.id] && (
                <img
                  src={activeProduct.imageUrl}
                  alt={activeProduct.nameBn}
                  referrerPolicy="no-referrer"
                  className="w-full h-60 object-cover rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              )}

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeProduct.descriptionBn}
              </p>

              {activeProduct.features && activeProduct.features.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[#1D2B53] dark:text-white mb-2">
                    প্রধান বৈশিষ্ট্যসমূহ
                  </h4>
                  <ul className="space-y-2">
                    {activeProduct.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <Check className="w-4 h-4 text-[#2DA94F] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#2DA94F]">
                    {activeProduct.warranty || 'অফিসিয়াল ওয়ারেন্টি সহ'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    হোম সেটআপ ও টেকনিশিয়ান পরামর্শ সুবিধা
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const p = activeProduct;
                      setActiveProduct(null);
                      onBookProductDemo(p);
                    }}
                    className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    ডেমো / সেটআপ বুক করুন
                  </button>
                  <button
                    onClick={() => {
                      onAddToCart(activeProduct);
                      setActiveProduct(null);
                    }}
                    className="px-5 py-2.5 rounded-lg bg-[#2DA94F] hover:bg-[#248E41] text-white text-xs font-semibold"
                  >
                    তালিকায় যোগ করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
