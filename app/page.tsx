import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/firestore';
import ProductCard from '@/components/product/ProductCard';
import ScrollReveal from '@/components/ui/ScrollReveal';
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
      image: '/images/asooke_short.jpg',
    },
    {
      name: 'Adire',
      description: 'Tie-dye artistry reimagined',
      href: '/products?category=adire',
      image: '/images/green_pink_set.jpg',
    },
    {
      name: 'Beads & Accessories',
      description: 'Royal coral beads & adornments',
      href: '/products?category=beads-and-accessories',
      image: '/images/yellow_green_wrap.jpg',
      badge: 'Coming Soon',
    },
  ];

  return (
    <div className="bg-[#faf8f5]">
      {/* Hero Section - Inspired by Gaia's multi-panel layout with dynamic motion */}
      <section className="relative h-[80vh] sm:h-[85vh] flex items-center justify-center overflow-hidden bg-[#18181b]">
        {/* 4-Panel Background Image Grid with cinematic motion */}
        <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 w-full h-full">
          {[
            { img: '/images/green_pink_set.jpg', delay: '0s' },
            { img: '/images/terracotta_coord.jpg', delay: '-4s' },
            { img: '/images/red_layered_skirt.jpg', delay: '-8s' },
            { img: '/images/yellow_green_wrap.jpg', delay: '-12s' },
          ].map((item, idx) => (
            <div key={idx} className="relative w-full h-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.img}
                alt="Tunmise Fashion Collection"
                style={{ animationDelay: item.delay }}
                className="w-full h-full object-cover object-center animate-ken-burns scale-105"
              />
            </div>
          ))}
        </div>

        {/* Dark editorial overlay for optimal text contrast */}
        <div className="absolute inset-0 bg-black/55 backdrop-brightness-[0.8] shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />

        {/* Centered Typography & CTA Overlay */}
        <div className="relative z-10 text-center max-w-2xl px-4 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-4 animate-fade-in-up shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#c2410c] animate-pulse" />
            Handcrafted Adire &amp; Asooke
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl text-white font-medium tracking-widest uppercase mb-4 drop-shadow-md animate-fade-in-up">
            TUNMISE
          </h1>

          <p className="text-white/90 text-sm sm:text-base md:text-lg mb-8 max-w-md font-sans tracking-wide leading-relaxed drop-shadow animate-fade-in-up">
            Every piece made to order in Nigeria.
            <br />
            Elevating tradition. Styled for today.
          </p>

          <div className="flex flex-wrap gap-3.5 justify-center animate-fade-in-up">
            <Link
              href="#featured-pieces"
              className="inline-flex items-center gap-2 bg-[#c2410c] hover:bg-[#ea580c] text-white font-bold py-3.5 px-7 rounded-xl tracking-widest text-xs sm:text-sm uppercase transition-all shadow-lg hover:shadow-[#c2410c]/30 hover:-translate-y-0.5 active:scale-95 cursor-pointer btn-shimmer"
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
        <section id="featured-pieces" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 scroll-mt-20">
          <ScrollReveal direction="up">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
              <div>
                <span className="text-xs font-bold tracking-[0.25em] text-[#c2410c] uppercase block mb-1">
                  The Collection
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#18181b]">Featured Pieces</h2>
                <p className="text-[#18181b]/60 text-xs sm:text-sm mt-1">
                  Signature Asooke sets, Adire silhouettes, and modern Nigerian tailoring
                </p>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#c2410c] hover:text-[#ea580c] transition-colors py-1 group"
              >
                <span>View All Collection</span>
                <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 items-stretch">
            {featured.slice(0, 8).map((p, idx) => (
              <ScrollReveal key={p.id} delay={idx * 60} direction="up" className="h-full">
                <ProductCard product={p} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* Editorial Category Section - Luxury Photo Cards */}
      <section className="bg-black/[0.02] py-14 sm:py-20 border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up">
            <div className="text-center mb-10">
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#c2410c] uppercase block mb-1">
                Curated Lines
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#18181b]">Explore by Category</h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
            {categories.map((cat, idx) => (
              <ScrollReveal key={cat.name} delay={idx * 100} direction="up">
                <Link
                  href={cat.href}
                  className="group relative block rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[4/3] luxury-card-hover shadow-sm"
                >
                  {/* Category Photo with zoom on hover */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Dark gradient overlay for legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

                  {/* Text Content */}
                  <div className="relative z-10 p-6 sm:p-7 h-full flex flex-col justify-between text-white">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-wide">{cat.name}</h3>
                      {cat.badge && (
                        <span className="bg-[#c2410c] text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                          {cat.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-end justify-between mt-4">
                      <p className="text-xs text-white/80 max-w-[200px] leading-relaxed">{cat.description}</p>
                      <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center group-hover:bg-[#c2410c] group-hover:text-white transition-all">
                        <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story Editorial Banner */}
      <section className="bg-[#18181b] text-[#faf8f5] relative overflow-hidden py-16 sm:py-24">
        <ScrollReveal direction="up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <p className="text-[#c2410c] text-xs tracking-[0.4em] uppercase mb-4 font-bold">Our Heritage</p>
            <h2 className="font-serif text-3xl sm:text-5xl mb-6 leading-tight">
              Woven with Heritage,
              <br />
              <span className="text-[#c2410c]">Styled for Today</span>
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
              Tunmise Aladire Asooke celebrates the rich textile traditions of the Yoruba people —
              bringing the beauty of handwoven Asooke and vibrant Adire tie-dye into modern wardrobes.
              Every piece tells a story of craft, culture, and contemporary elegance.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#c2410c] hover:bg-[#ea580c] text-white font-bold px-8 py-3.5 rounded-xl transition-all text-xs sm:text-sm uppercase tracking-wider cursor-pointer active:scale-95 shadow-lg btn-shimmer"
            >
              Explore the Collection <FiArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
