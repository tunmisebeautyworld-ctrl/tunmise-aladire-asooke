'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getProductById } from '@/lib/firestore';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';
import { FiShoppingCart, FiArrowLeft, FiShare2, FiMaximize2, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { STORE_PRODUCTS } from '@/lib/demoData';
import BespokeModal from '@/components/product/BespokeModal';

const COLOR_MAP: Record<string, string> = {
  'Terracotta Red': '#c2410c',
  'Terracotta': '#c2410c',
  'Green & Pink': 'linear-gradient(135deg, #15803d 0%, #15803d 50%, #ec4899 50%, #ec4899 100%)',
  'Red & White': 'linear-gradient(135deg, #dc2626 0%, #dc2626 50%, #ffffff 50%, #ffffff 100%)',
  'Yellow & Green': 'linear-gradient(135deg, #eab308 0%, #eab308 50%, #15803d 50%, #15803d 100%)',
  'Burgundy & White': 'linear-gradient(135deg, #800020 0%, #800020 50%, #ffffff 50%, #ffffff 100%)',
  'Orange & White': 'linear-gradient(135deg, #f97316 0%, #f97316 50%, #ffffff 50%, #ffffff 100%)',
  'Pink & White': 'linear-gradient(135deg, #db2777 0%, #db2777 50%, #ffffff 50%, #ffffff 100%)',
  'Midnight Blue & Gold Thread': 'linear-gradient(135deg, #1e3a8a 0%, #1e3a8a 50%, #d97706 50%, #d97706 100%)',
  'Teal & Rose Gold': 'linear-gradient(135deg, #0d9488 0%, #0d9488 50%, #fda4af 50%, #fda4af 100%)',
  'Navy & Burgundy Stripe': 'linear-gradient(135deg, #1e1b4b 0%, #1e1b4b 40%, #800020 40%, #800020 70%, #fefce8 70%, #fefce8 100%)',
};

function getHexFromName(name: string): string {
  const lower = name.toLowerCase().trim();
  if (lower === 'red') return '#dc2626';
  if (lower === 'blue') return '#1d4ed8';
  if (lower === 'green') return '#15803d';
  if (lower === 'yellow') return '#eab308';
  if (lower === 'orange') return '#f97316';
  if (lower === 'pink') return '#db2777';
  if (lower === 'purple') return '#a855f7';
  if (lower === 'terracotta') return '#c2410c';
  if (lower === 'indigo') return '#1e1b4b';
  if (lower === 'gold') return '#d97706';
  if (lower === 'white') return '#ffffff';
  if (lower === 'teal') return '#0d9488';
  if (lower === 'burgundy') return '#800020';
  return '#cbd5e1'; // Fallback
}

function getColorBackground(colorName: string): string {
  const normalized = colorName.trim();
  if (COLOR_MAP[normalized]) return COLOR_MAP[normalized];
  
  if (normalized.includes('&')) {
    const parts = normalized.split('&').map(p => p.trim());
    const c1 = getHexFromName(parts[0]);
    const c2 = getHexFromName(parts[1]);
    return `linear-gradient(135deg, ${c1} 0%, ${c1} 50%, ${c2} 50%, ${c2} 100%)`;
  }
  
  return getHexFromName(normalized);
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showBespokeModal, setShowBespokeModal] = useState(false);

  // Get active images based on color specific mapping or product images
  const activeImages = (() => {
    if (!product) return [];
    if (selectedColor && product.colorImages?.[selectedColor] && product.colorImages[selectedColor].length > 0) {
      return product.colorImages[selectedColor];
    }
    return product.images || [];
  })();

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const minSwipeDistance = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (distance > minSwipeDistance && activeImages.length > 1) {
      setSelectedImage((prev) => (prev + 1) % activeImages.length);
    } else if (distance < -minSwipeDistance && activeImages.length > 1) {
      setSelectedImage((prev) => (prev - 1 + activeImages.length) % activeImages.length);
    }
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight' && activeImages.length > 1) {
        setSelectedImage((prev) => (prev + 1) % activeImages.length);
      }
      if (e.key === 'ArrowLeft' && activeImages.length > 1) {
        setSelectedImage((prev) => (prev - 1 + activeImages.length) % activeImages.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = origOverflow;
    };
  }, [lightboxOpen, activeImages.length]);



  useEffect(() => {
    async function load() {
      try {
        const p = await getProductById(id);
        setProduct(p);
        if (p) {
          setSelectedSize(p.sizes[0] || '');
          setSelectedColor(p.colors[0] ? p.colors[0].split('|')[0] : '');
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) { toast.error('Please select a size'); return; }
    if (!selectedColor) { toast.error('Please select a color'); return; }
    addItem(product, quantity, selectedSize, selectedColor);
    toast.success('Added to cart!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product?.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10 animate-pulse">
        <div className="aspect-square bg-brand-indigo/10 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-brand-indigo/10 rounded w-3/4" />
          <div className="h-6 bg-brand-indigo/10 rounded w-1/4" />
          <div className="h-4 bg-brand-indigo/10 rounded" />
          <div className="h-4 bg-brand-indigo/10 rounded w-5/6" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <p className="text-brand-indigo/50 text-xl">Product not found</p>
      <Link href="/products" className="mt-4 text-brand-gold inline-block">← Back to collections</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/products" className="inline-flex items-center gap-2 text-brand-indigo/50 hover:text-brand-indigo mb-6 text-sm">
        <FiArrowLeft size={14} /> Back to Collections
      </Link>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Images Column */}
        <div className="space-y-3">
          <div
            className="group relative aspect-square rounded-3xl overflow-hidden bg-brand-indigo/5 cursor-pointer shadow-sm border border-black/5"
            onClick={() => setLightboxOpen(true)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {activeImages[selectedImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 select-none"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-indigo to-brand-terracotta tie-dye-bg" />
            )}

            {/* Tap to expand badge */}
            <div className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-md pointer-events-none">
              <FiMaximize2 size={12} />
              <span>{selectedImage + 1} / {activeImages.length}</span>
            </div>

            {/* In-image Next/Prev Chevrons (if multiple images) */}
            {activeImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) => (prev - 1 + activeImages.length) % activeImages.length);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer shadow-md opacity-80 group-hover:opacity-100"
                  aria-label="Previous photo"
                >
                  <FiChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((prev) => (prev + 1) % activeImages.length);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all cursor-pointer shadow-md opacity-80 group-hover:opacity-100"
                  aria-label="Next photo"
                >
                  <FiChevronRight size={18} />
                </button>
              </>
            )}

            {/* Mobile swipe pagination dots */}
            {activeImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
                {activeImages.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      selectedImage === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails row */}
          {activeImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              {activeImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                    selectedImage === i
                      ? 'border-[#c2410c] shadow-sm scale-95'
                      : 'border-black/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-semibold text-brand-terracotta uppercase tracking-wider">{product.category}</span>
            <h1 className="font-serif text-3xl text-brand-indigo mt-1">{product.name}</h1>
            <p className="text-3xl font-bold text-brand-terracotta mt-3">₦{product.price.toLocaleString()}</p>
          </div>

          <p className="text-brand-indigo/70 leading-relaxed">{product.description}</p>

          {/* Colors */}
          {product.colors.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[#1e1b4b] mb-3">
                Color: <span className="font-normal text-[#1e1b4b]/60">{selectedColor}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c) => {
                  const [colorName, colorVal] = c.split('|');
                  const bgVal = colorVal || getColorBackground(colorName);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedColor(colorName);
                        setSelectedImage(0);
                      }}
                      title={colorName}
                      className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer relative ${
                        selectedColor === colorName
                          ? 'border-[#1e1b4b] ring-2 ring-[#d97706] scale-110 shadow-sm'
                          : 'border-[#1e1b4b]/20 hover:scale-105 hover:border-[#1e1b4b]'
                      }`}
                      style={{ background: bgVal }}
                      aria-label={`Select color ${colorName}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-brand-indigo mb-2">
                Size: <span className="font-normal text-brand-indigo/60">{selectedSize}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`w-12 h-12 rounded-xl text-sm border-2 font-medium transition-colors ${
                      selectedSize === s
                        ? 'border-brand-gold bg-brand-gold text-brand-indigo'
                        : 'border-brand-indigo/20 text-brand-indigo hover:border-brand-gold'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowSizeGuide(!showSizeGuide)}
                className="text-xs text-brand-gold hover:text-brand-gold-light underline mt-2 block font-medium"
              >
                {showSizeGuide ? 'Hide Size Guide' : 'View Size Guide & Chart'}
              </button>

              {showSizeGuide && (
                <div className="mt-3 p-4 bg-white rounded-xl border border-brand-indigo/10 text-xs space-y-2 max-w-sm">
                  <p className="font-semibold text-brand-indigo mb-1">Size Conversion Chart</p>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-brand-indigo/10 text-brand-indigo/50">
                        <th className="pb-1">Letter</th>
                        <th className="pb-1">UK/Nig Size</th>
                        <th className="pb-1">Bust/Chest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-indigo/5 text-brand-indigo/80">
                      <tr><td className="py-1 font-semibold">XS</td><td className="py-1">UK 6 - 8</td><td className="py-1">30 - 32 in</td></tr>
                      <tr><td className="py-1 font-semibold">S</td><td className="py-1">UK 8 - 10</td><td className="py-1">32 - 34 in</td></tr>
                      <tr><td className="py-1 font-semibold">M</td><td className="py-1">UK 10 - 12</td><td className="py-1">34 - 36 in</td></tr>
                      <tr><td className="py-1 font-semibold">L</td><td className="py-1">UK 12 - 14</td><td className="py-1">36 - 38 in</td></tr>
                      <tr><td className="py-1 font-semibold">XL</td><td className="py-1">UK 14 - 16</td><td className="py-1">38 - 40 in</td></tr>
                      <tr><td className="py-1 font-semibold">XXL</td><td className="py-1">UK 16 - 18</td><td className="py-1">40 - 42 in</td></tr>
                      <tr><td className="py-1 font-semibold">3XL</td><td className="py-1">UK 18 - 20</td><td className="py-1">42 - 44 in</td></tr>
                    </tbody>
                  </table>
                  <p className="text-brand-indigo/40 mt-1 italic leading-relaxed">
                    Note: Our co-ords and boubous are crafted using premium Adire crepe fabric, tailored for a relaxed, flowy, and modern silhouette.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-brand-indigo">Quantity:</p>
            <div className="flex items-center border-2 border-brand-indigo/20 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-brand-indigo/5 text-xl"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 hover:bg-brand-indigo/5 text-xl"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-3">
            {product.category === 'bespoke' && (
              <button
                type="button"
                onClick={() => setShowBespokeModal(true)}
                className="w-full bg-[#c2410c] hover:bg-[#ea580c] text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                Submit Custom Measurements
              </button>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-3 bg-[#1e1b4b] hover:bg-[#312e81] text-[#fefce8] font-bold py-4 px-6 rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
              >
                <FiShoppingCart size={18} /> Add to Cart
              </button>
              <button
                onClick={handleShare}
                aria-label="Share product"
                className="p-4 border-2 border-[#1e1b4b]/20 hover:border-brand-gold rounded-2xl transition-colors cursor-pointer"
              >
                <FiShare2 size={18} className="text-[#1e1b4b]/50" />
              </button>
            </div>
          </div>

          {/* Stock warning */}
          {product.stock > 0 && product.stock < 10 && (
            <p className="text-brand-terracotta text-sm">Only {product.stock} pieces left in stock</p>
          )}
          {product.stock === 0 && (
            <p className="text-red-500 text-sm font-semibold">Out of Stock</p>
          )}
        </div>
      </div>

      <BespokeModal
        isOpen={showBespokeModal}
        onClose={() => setShowBespokeModal(false)}
        product={product}
      />

      {/* Fullscreen Swipeable Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white z-20">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#d97706] font-bold">
                {product.category}
              </p>
              <h3 className="font-serif text-sm sm:text-base text-white font-medium line-clamp-1">
                {product.name}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {activeImages.length > 1 && (
                <span className="text-xs text-white/70 bg-white/10 px-3 py-1 rounded-full font-mono">
                  {selectedImage + 1} / {activeImages.length}
                </span>
              )}
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close image viewer"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Center Main Stage (Touch Swipeable) */}
          <div
            className="relative flex-1 flex items-center justify-center my-4 overflow-hidden select-none"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Prev chevron */}
            {activeImages.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedImage((prev) => (prev - 1 + activeImages.length) % activeImages.length)}
                className="absolute left-2 sm:left-6 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                aria-label="Previous image"
              >
                <FiChevronLeft size={22} />
              </button>
            )}

            {/* Image */}
            <div className="max-h-[75vh] max-w-[90vw] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImages[selectedImage]}
                alt={product.name}
                className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl transition-all duration-300 animate-fadeIn"
              />
            </div>

            {/* Next chevron */}
            {activeImages.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedImage((prev) => (prev + 1) % activeImages.length)}
                className="absolute right-2 sm:right-6 z-20 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                aria-label="Next image"
              >
                <FiChevronRight size={22} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {activeImages.length > 1 && (
            <div
              className="flex items-center justify-center gap-2 overflow-x-auto pb-2 z-20 no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {activeImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${
                    selectedImage === i
                      ? 'border-[#f59e0b] scale-105 shadow-md'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
