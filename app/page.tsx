import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/firestore';
import ProductCard from '@/components/product/ProductCard';
import { FiArrowRight } from 'react-icons/fi';
import { DEMO_PRODUCTS } from '@/lib/demoData';
import type { Product } from '@/types';

export default async function HomePage() {
  let featured: Product[] = [];
  try {
    featured = await getFeaturedProducts();
  } catch {
    // Firebase not yet configured
  }

  // Fallback to beautiful default demo products using user's uploaded images
  if (featured.length === 0) {
    featured = DEMO_PRODUCTS.filter((p) => p.featured);
  }

  const categories = [
    {
      name: 'Asooke',
      description: 'Traditional woven elegance',
      href: '/products?category=asooke',
      color: 'from-brand-indigo to-brand-indigo-light',
    },
    {
      name: 'Adire',
      description: 'Tie-dye artistry reimagined',
      href: '/products?category=adire',
      color: 'from-brand-terracotta to-brand-terracotta-light',
    },
    {
      name: 'Beads & Accessories',
      description: 'Royal coral beads & adornments',
      href: '/products?category=beads-and-accessories',
      color: 'from-[#d97706] to-[#b45309]',
      badge: 'Coming Soon',
    },
  ];

  return (
    <div>
      {/* Hero Section - Inspired by Gaia's multi-panel layout */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-[#1e1b4b]">
        {/* 4-Panel Background Image Grid */}
        <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 w-full h-full">
          {[
            '/images/green_pink_set.jpg',
            '/images/terracotta_coord.jpg',
            '/images/red_layered_skirt.jpg',
            '/images/yellow_green_wrap.jpg',
          ].map((imgUrl, idx) => (
            <div key={idx} className="relative w-full h-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt="Tunmise Fashion Collection"
                className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-1000"
              />
            </div>
          ))}
        </div>

        {/* Dark elegant overlay for contrast */}
        <div className="absolute inset-0 bg-black/40 backdrop-brightness-[0.85] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />

        {/* Centered Typography & CTA Overlay */}
        <div className="relative z-10 text-center max-w-2xl px-4 flex flex-col items-center">
          <p className="text-[#d97706] text-xs sm:text-sm tracking-[0.3em] font-bold uppercase mb-4 drop-shadow-sm">
            Handcrafted Adire & Asooke
          </p>
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl text-white font-medium tracking-widest uppercase mb-5 drop-shadow-md">
            TUNMISE
          </h1>
          <p className="text-white/90 text-sm sm:text-base md:text-lg mb-9 max-w-md font-sans tracking-wide leading-relaxed drop-shadow">
            Every piece made to order, in Nigeria.
            <br />
            Elevating tradition. Styled for today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#c2410c] hover:bg-[#ea580c] text-white font-bold py-4 px-8 rounded-lg tracking-widest text-xs sm:text-sm uppercase transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Browse the Shop <FiArrowRight size={15} />
            </Link>
            <Link
              href="/products?category=beads-and-accessories"
              className="inline-flex items-center gap-2 border-2 border-white/40 hover:border-white text-white font-bold py-4 px-8 rounded-lg tracking-widest text-xs sm:text-sm uppercase transition-all active:scale-95 cursor-pointer"
            >
              Beads & Accessories
            </Link>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl text-brand-indigo mb-2">Our Collections</h2>
          <p className="text-brand-indigo/50">Curated categories for every occasion</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {categories.map((cat) => (
            <Link key={cat.name} href={cat.href} className="group">
              <div
                className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${cat.color} p-8 text-white text-center hover:scale-105 transition-transform duration-300 aspect-square flex flex-col items-center justify-center shadow-md`}
              >
                <div className="absolute inset-0 tie-dye-bg opacity-30" />
                {cat.badge && (
                  <span className="absolute top-4 right-4 bg-[#1e1b4b] text-[#fefce8] text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm z-10 border border-[#d97706]/40">
                    {cat.badge}
                  </span>
                )}
                <h3 className="relative font-serif text-2xl font-bold mb-1">{cat.name}</h3>
                <p className="relative text-xs text-white/75 max-w-[200px]">{cat.description}</p>
                <FiArrowRight size={16} className="relative mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-3xl text-brand-indigo">Featured Pieces</h2>
              <p className="text-brand-indigo/50 mt-1">Handpicked for the season</p>
            </div>
            <Link href="/products" className="text-brand-gold hover:text-brand-gold-light font-medium text-sm flex items-center gap-1">
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
            {featured.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Brand Story Banner */}
      <section className="bg-brand-indigo text-brand-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-brand-gold/70 text-xs tracking-[0.4em] uppercase mb-4">Our Story</p>
          <h2 className="font-serif text-4xl sm:text-5xl mb-6 leading-tight">
            Woven with Heritage,
            <br />
            <span className="brand-gradient-text">Styled for Today</span>
          </h2>
          <p className="text-brand-cream/60 max-w-2xl mx-auto text-lg leading-relaxed mb-8">
            Tunmise Aladire Asooke celebrates the rich textile traditions of the Yoruba people —
            bringing the beauty of handwoven Asooke and vibrant Adire tie-dye into modern wardrobes.
            Every piece tells a story of craft, culture, and contemporary elegance.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-indigo font-semibold px-8 py-3 rounded-full transition-all text-sm"
          >
            Explore the Collection <FiArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
