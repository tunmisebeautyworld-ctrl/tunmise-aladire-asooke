'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getProducts, getStoreSettings } from '@/lib/firestore';
import ProductGrid from '@/components/product/ProductGrid';
import type { Product } from '@/types';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { DEMO_PRODUCTS } from '@/lib/demoData';
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
          data = DEMO_PRODUCTS;
        }
        setProducts(data);
      } catch {
        setProducts(DEMO_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-brand-indigo">Collections</h1>
        <p className="text-brand-indigo/50 mt-1">{filtered.length} pieces available</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24 space-y-6">
            <h2 className="font-semibold text-brand-indigo flex items-center gap-2">
              <FiFilter size={16} /> Filters
            </h2>

            {/* Search */}
            <div className="relative">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-indigo/40" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-brand-indigo/20 rounded-lg focus:outline-none focus:border-brand-gold"
              />
            </div>

            {/* Category */}
            <div>
              <p className="text-xs font-semibold text-brand-indigo/50 uppercase tracking-wider mb-3">Category</p>
              <div className="space-y-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`w-full flex items-center justify-between text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      category === c.value
                        ? 'bg-brand-indigo text-brand-cream'
                        : 'text-brand-indigo hover:bg-brand-indigo/5'
                    }`}
                  >
                    <span>{c.label}</span>
                    {c.value === 'beads-and-accessories' && beadsStatus === 'coming_soon' && (
                      <span className="text-[9px] bg-[#d97706] text-[#1e1b4b] px-1.5 py-0.5 rounded-full font-bold uppercase">
                        Soon
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <p className="text-xs font-semibold text-brand-indigo/50 uppercase tracking-wider mb-3">Size</p>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(selectedSize === s ? '' : s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      selectedSize === s
                        ? 'bg-brand-gold border-brand-gold text-brand-indigo font-semibold'
                        : 'border-brand-indigo/20 text-brand-indigo hover:border-brand-gold'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <p className="text-xs font-semibold text-brand-indigo/50 uppercase tracking-wider mb-3">
                Max Price: ₦{maxPrice.toLocaleString()}
              </p>
              <input
                type="range"
                min={5000}
                max={500000}
                step={5000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-gold"
              />
              <div className="flex justify-between text-xs text-brand-indigo/40 mt-1">
                <span>₦5k</span><span>₦500k</span>
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => { setSearch(''); setCategory(''); setSelectedSize(''); setMaxPrice(500000); }}
              className="w-full text-sm text-brand-indigo/50 hover:text-brand-terracotta"
            >
              Reset Filters
            </button>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Category quick-tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`flex-shrink-0 text-sm px-4 py-2 rounded-full transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                  category === c.value
                    ? 'bg-brand-indigo text-brand-cream'
                    : 'bg-white text-brand-indigo border border-brand-indigo/20 hover:border-brand-gold'
                }`}
              >
                <span>{c.label}</span>
                {c.value === 'beads-and-accessories' && beadsStatus === 'coming_soon' && (
                  <span className="text-[9px] bg-[#d97706] text-[#1e1b4b] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-normal">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>

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
                  Beads & Accessories
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
                      toast.success('Thank you! You will be the first to know when Beads & Accessories launches.');
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      className="flex-1 px-4 py-3 rounded-xl bg-white/90 text-[#1e1b4b] placeholder:text-gray-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#d97706]"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#d97706] hover:bg-[#f59e0b] text-[#1e1b4b] font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
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
                    &larr; Browse All Available Clothes & Collections
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
          ) : (
            <ProductGrid products={filtered} />
          )}
        </div>
      </div>
    </div>
  );
}
