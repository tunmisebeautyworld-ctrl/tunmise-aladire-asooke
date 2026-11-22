'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProducts, getStoreSettings } from '@/lib/firestore';
import ProductGrid from '@/components/product/ProductGrid';
import type { Product } from '@/types';
import { FiSearch, FiFilter, FiX, FiSliders } from 'react-icons/fi';
import { STORE_PRODUCTS } from '@/lib/demoData';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: '', label: 'All Collections' },
  { value: 'asooke', label: 'Asooke' },
  { value: 'adire', label: 'Adire' },
  { value: 'beads-and-accessories', label: 'Beads & Accessories' },
];

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('category') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(urlCategory);
  const [prevUrlCategory, setPrevUrlCategory] = useState(urlCategory);
  const [selectedSize, setSelectedSize] = useState('');
  const [maxPrice, setMaxPrice] = useState(500000);
  const [beadsStatus, setBeadsStatus] = useState<'coming_soon' | 'active'>('coming_soon');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Sync category state when URL search parameters change
  if (urlCategory !== prevUrlCategory) {
    setPrevUrlCategory(urlCategory);
    setCategory(urlCategory);
  }

  useEffect(() => {
    getStoreSettings().then((s) => setBeadsStatus(s.beadsAccessoriesStatus));
    const handleUpdate = () => {
      getStoreSettings().then((s) => setBeadsStatus(s.beadsAccessoriesStatus));
    };
    window.addEventListener('store_settings_updated', handleUpdate);
    return () => window.removeEventListener('store_settings_updated', handleUpdate);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        let data = await getProducts();
        if (!data || data.length === 0) {
          data = STORE_PRODUCTS;
        }
        setProducts(data);
      } catch {
        setProducts(STORE_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);


  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (selectedSize) count++;
    if (maxPrice < 500000) count++;
    return count;
  }, [search, selectedSize, maxPrice]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (category) {
      if (category === 'beads-and-accessories' || category === 'accessories') {
        result = result.filter(
          (p) => p.category === 'beads-and-accessories' || p.category === 'accessories'
        );
      } else {
        result = result.filter((p) => p.category === category);
      }
    }
    if (selectedSize) result = result.filter((p) => p.sizes.includes(selectedSize));
    if (search) result = result.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    result = result.filter((p) => p.price <= maxPrice);
    return result;
  }, [products, category, selectedSize, search, maxPrice]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSize('');
    setMaxPrice(500000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#18181b] font-medium">Collections</h1>
        </div>

        {/* Active filter pills summary on desktop/tablet if any */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-orange-50 text-[#c2410c] border border-orange-200 px-2.5 py-1 rounded-full font-medium">
                &ldquo;{search}&rdquo;
                <button onClick={() => setSearch('')} className="hover:text-red-600"><FiX size={11} /></button>
              </span>
            )}
            {selectedSize && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-orange-50 text-[#c2410c] border border-orange-200 px-2.5 py-1 rounded-full font-medium">
                Size {selectedSize}
                <button onClick={() => setSelectedSize('')} className="hover:text-red-600"><FiX size={11} /></button>
              </span>
            )}
            {maxPrice < 500000 && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-orange-50 text-[#c2410c] border border-orange-200 px-2.5 py-1 rounded-full font-medium">
                Under ₦{maxPrice.toLocaleString()}
                <button onClick={() => setMaxPrice(500000)} className="hover:text-red-600"><FiX size={11} /></button>
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-gray-500 hover:text-red-600 underline cursor-pointer ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Top Bar: Clean Collection Pills + Filter Toggle Button */}
      <div className="flex items-center justify-between gap-3 pb-4 mb-6 border-b border-gray-100 overflow-x-auto no-scrollbar">
        {/* Collection Pills (clean, no numbers) */}
        <div className="flex items-center gap-2 flex-nowrap sm:flex-wrap">
          {CATEGORIES.map((c) => {
            const isSelected = category === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex-shrink-0 text-xs sm:text-sm px-4 py-2 rounded-full transition-all inline-flex items-center gap-1.5 font-medium cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-[#18181b] text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-black/30 hover:bg-gray-50'
                }`}
              >
                <span>{c.label}</span>
                {c.value === 'beads-and-accessories' && beadsStatus === 'coming_soon' && (
                  <span className="text-[10px] bg-[#d97706] text-[#1e1b4b] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter Toggle Button (Not open by default, opens only on click) */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className={`flex-shrink-0 text-xs sm:text-sm px-4 py-2 rounded-full transition-all inline-flex items-center gap-2 font-semibold cursor-pointer border active:scale-95 ${
              filtersOpen || activeFiltersCount > 0
                ? 'bg-[#c2410c] text-white border-[#c2410c] shadow-sm'
                : 'bg-white text-[#18181b] border-gray-200 hover:border-[#18181b]'
            }`}
          >
            <FiSliders size={13} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-white text-[#c2410c] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Filter Options Panel - Appears only when user clicks 'Filters' */}
      {filtersOpen && (
        <div className="mb-8 p-6 bg-white rounded-3xl border border-gray-200/80 shadow-md animate-fadeIn transition-all">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FiFilter size={16} className="text-[#c2410c]" />
              <h3 className="font-bold text-sm text-[#18181b] uppercase tracking-wider">
                Filter &amp; Refine Collection
              </h3>
            </div>
            <button
              onClick={() => setFiltersOpen(false)}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close filters"
            >
              <FiX size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search by name/style */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Search Style
              </label>
              <div className="relative">
                <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. Boubou, Agbada, Peplum..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-[#faf8f5] border border-gray-200 rounded-xl focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter by Size */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Size
              </label>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(selectedSize === s ? '' : s)}
                    className={`text-xs px-3.5 py-2 rounded-xl border font-medium transition-all cursor-pointer ${
                      selectedSize === s
                        ? 'bg-[#c2410c] border-[#c2410c] text-white font-bold shadow-xs'
                        : 'bg-[#faf8f5] border-gray-200 text-gray-700 hover:border-black/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Maximum Price */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Max Price
                </label>
                <span className="text-xs font-bold text-[#c2410c]">
                  ₦{maxPrice.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={5000}
                max={500000}
                step={5000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#c2410c] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1 font-mono">
                <span>₦5,000</span>
                <span>₦500,000</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 mt-6 border-t border-gray-100">
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-gray-500 hover:text-red-600 cursor-pointer"
            >
              Reset All Filters
            </button>
            <button
              onClick={() => setFiltersOpen(false)}
              className="bg-[#18181b] hover:bg-[#312e81] text-white text-xs font-bold px-5 py-2 rounded-xl transition-all cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area: Products Grid or Coming Soon Showcase */}
      <div>
        {/* If Beads & Accessories is selected and set to Coming Soon, show dedicated Coming Soon Showcase */}
        {(category === 'beads-and-accessories' || category === 'accessories') && beadsStatus === 'coming_soon' ? (
          <div className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#7c2d12] text-[#fefce8] rounded-3xl p-8 sm:p-12 text-center shadow-xl border border-[#d97706]/30 relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-[#d97706]/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-[#c2410c]/20 rounded-full blur-2xl" />

            <div className="relative z-10 max-w-xl mx-auto space-y-6">
              <span className="inline-block bg-[#c2410c] text-white text-[11px] font-extrabold uppercase px-4 py-1 rounded-full tracking-[0.2em] shadow-sm">
                Coming Soon
              </span>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wide text-white">
                Beads &amp; Accessories
              </h2>

              <p className="text-white/85 text-sm sm:text-base leading-relaxed">
                Our master artisans are currently curating and handcrafting our debut line of royal coral beads, bridal neckpieces, woven accessories, and traditional African adornments.
              </p>

              {/* VIP Launch Notification Box */}
              <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-left space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#d97706]">
                  Get VIP Early Access When We Launch
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formEl = e.currentTarget;
                    const input = formEl.elements.namedItem('vipEmail') as HTMLInputElement;
                    const emailVal = input?.value || '';
                    if (emailVal) {
                      fetch('/api/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'beads_vip_waitlist', email: emailVal }),
                      }).catch((err) => console.error('VIP email error:', err));
                      toast.success('VIP access confirmed! A confirmation has been sent to your email.');
                      formEl.reset();
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <input
                    name="vipEmail"
                    type="email"
                    required
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 rounded-xl bg-white/90 text-[#18181b] placeholder:text-gray-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#c2410c]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#c2410c] hover:bg-[#ea580c] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap btn-shimmer"
                  >
                    Notify Me
                  </button>
                </form>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setCategory('')}
                  className="text-xs text-white/80 hover:text-[#d97706] underline underline-offset-4 cursor-pointer"
                >
                  &larr; Browse All Available Clothes &amp; Collections
                </button>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-brand-indigo/10" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-brand-indigo/10 rounded" />
                  <div className="h-3 bg-brand-indigo/5 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8">
            <p className="text-base font-semibold text-gray-700">No pieces match your selected filters</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting the size or price range filter</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 bg-[#18181b] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer hover:bg-[#312e81] transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <ProductGrid products={filtered} />
        )}
      </div>
    </div>
  );
}
