'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [liked, setLiked] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.sizes.length > 0 && product.colors.length > 0) {
      addItem(product, 1, product.sizes[0], product.colors[0]);
      toast.success(`${product.name} added to cart!`);
    }
  };

  const categoryColors: Record<string, string> = {
    asooke: 'bg-brand-indigo text-brand-cream',
    adire: 'bg-brand-terracotta text-white',
    bespoke: 'bg-brand-gold text-brand-indigo',
    accessories: 'bg-green-700 text-white',
    'beads-and-accessories': 'bg-[#d97706] text-[#1e1b4b]',
  };

  return (
    <Link href={`/products/${product.id}`} className="group flex flex-col h-full">
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 flex flex-col h-full border border-gray-100/80">
        {/* Image */}
        <div className="relative aspect-[3/4] w-full bg-gradient-to-br from-brand-indigo/10 to-brand-terracotta/10 overflow-hidden flex-shrink-0">
          {product.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-indigo to-brand-terracotta opacity-30 tie-dye-bg" />
          )}

          {/* Category badge */}
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full capitalize ${categoryColors[product.category] || 'bg-gray-200'}`}>
            {product.category === 'beads-and-accessories' ? 'Beads & Accessories' : product.category}
          </span>

          {/* Quick add overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
            <button
              onClick={handleQuickAdd}
              className="flex items-center gap-1.5 bg-white text-brand-indigo text-xs font-semibold px-3 py-2 rounded-full hover:bg-brand-gold transition-colors shadow-sm cursor-pointer"
            >
              <FiShoppingCart size={13} /> Quick Add
            </button>
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
            aria-label="Add to wishlist"
            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors cursor-pointer"
          >
            <FiHeart
              size={15}
              className={liked ? 'fill-brand-terracotta text-brand-terracotta' : 'text-brand-indigo/50'}
            />
          </button>
        </div>

        {/* Info - equalized height flex layout */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-medium text-brand-indigo text-sm leading-snug group-hover:text-brand-terracotta transition-colors line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
            {product.colors.length > 0 ? (
              <p className="text-xs text-brand-indigo/50 mt-1 truncate">{product.colors.slice(0, 3).join(' · ')}</p>
            ) : (
              <p className="text-xs text-transparent mt-1 select-none">&nbsp;</p>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
            <span className="font-bold text-brand-terracotta text-sm">₦{product.price.toLocaleString()}</span>
            {product.sizes.length > 0 && (
              <span className="text-xs text-brand-indigo/40">{product.sizes.length} sizes</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
