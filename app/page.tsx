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
      <section className="relative h-[80vh] sm:h-[85vh] flex items-center justify-center overflow-hidden bg-[#1e1b4b]">
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
        <div className="absolute inset-0 bg-black/45 backdrop-brightness-[0.85] shadow-[inset_0_0_100px_rgba(0,0,0,0.6)]" />

        {/* Centered Typography & CTA Overlay */}
        <div className="relative z-10 text-center max-w-2xl px-4 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[#fefce8] text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-4 animate-fade-in-up shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />
            Handcrafted Adire &amp; Asooke
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl text-white font-medium tracking-widest uppercase mb-4 drop-shadow-md animate-fade-in-up">
            TUNMISE
          </h1>

          <p className="text-white/90 text-sm sm:text-base md:text-lg mb-8 max-w-md font-sans tracking-wide leading-relaxed drop-shadow">
            Every piece made to order in Nigeria.
            <br />
            Elevating tradition. Styled for today.
          </p>

          <div className="flex flex-wrap gap-3.5 justify-center">
            <Link
              href="#featured-pieces"
              className="inline-flex items-center gap-2 bg-[#c2410c] hover:bg-[#ea580c] text-white font-bold py-3.5 px-7 rounded-xl tracking-widest text-xs sm:text-sm uppercase transition-all shadow-lg hover:shadow-[#c2410c]/30 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              Shop The Pieces <FiArrowRight size={15} />
            </Link>
            <Link
              href="/products?category=beads-and-accessories"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold py-3.5 px-6 rounded-xl tracking-widest text-xs sm:text-sm uppercase transition-all active:scale-95 cursor-pointer"
            >
              Beads &amp; Accessories
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products - FRONT AND CENTER FIRST */}
      {featured.length > 0 && (
        <section id="featured-pieces" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold tracking-[0.25em] text-[#c2410c] uppercase block mb-1">
                The Collection
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1e1b4b]">Featured Pieces</h2>
              <p className="text-[#1e1b4b]/60 text-xs sm:text-sm mt-1">
                Signature Asooke sets, Adire silhouettes, and modern Nigerian tailoring
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#d97706] hover:text-[#c2410c] transition-colors py-1 group"
            >
              <span>View All Collection</span>
              <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 items-stretch">
            {featured.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Streamlined Category Section - Below Featured Products */}
      <section className="bg-[#1e1b4b]/5 py-12 sm:py-16 border-y border-[#1e1b4b]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-[11px] font-bold tracking-[0.25em] text-[#d97706] uppercase block mb-1">
              Curated Lines
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1e1b4b]">Explore by Category</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {categories.map((cat) => (
              <Link key={cat.name} href={cat.href} className="group">
                <div
                  className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${cat.color} p-6 sm:p-7 text-white text-left luxury-card-hover min-h-[140px] sm:min-h-[170px] flex flex-col justify-between shadow-sm`}
                >
                  <div className="absolute inset-0 tie-dye-bg opacity-30" />
                  <div className="relative z-10 flex items-start justify-between gap-2">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold">{cat.name}</h3>
                    {cat.badge && (
                      <span className="bg-[#1e1b4b] text-[#fefce8] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider border border-[#d97706]/40 flex-shrink-0">
                        {cat.badge}
                      </span>
                    )}
                  </div>
                  <div className="relative z-10 flex items-end justify-between mt-4">
                    <p className="text-xs text-white/80 max-w-[200px] leading-relaxed">{cat.description}</p>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-[#1e1b4b] transition-all">
                      <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story Banner */}
      <section className="bg-brand-indigo text-brand-cream relative overflow-hidden">
        <div className="absolute inset-0 tie-dye-bg opacity-20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center relative z-10">
          <p className="text-brand-gold/70 text-xs tracking-[0.4em] uppercase mb-4 font-bold">Our Heritage</p>
          <h2 className="font-serif text-3xl sm:text-5xl mb-6 leading-tight">
            Woven with Heritage,
            <br />
            <span className="brand-gradient-text">Styled for Today</span>
          </h2>
          <p className="text-brand-cream/70 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
            Tunmise Aladire Asooke celebrates the rich textile traditions of the Yoruba people —
            bringing the beauty of handwoven Asooke and vibrant Adire tie-dye into modern wardrobes.
            Every piece tells a story of craft, culture, and contemporary elegance.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-indigo font-bold px-8 py-3.5 rounded-xl transition-all text-xs sm:text-sm uppercase tracking-wider cursor-pointer active:scale-95"
          >
            Explore the Collection <FiArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
