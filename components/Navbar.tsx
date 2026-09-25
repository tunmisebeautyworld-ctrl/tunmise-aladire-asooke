'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { getStoreSettings } from '@/lib/firestore';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch } from 'react-icons/fi';
import CartDrawer from './cart/CartDrawer';

const emptySubscribe = () => () => {};

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const itemCount = useCart((s) => s.itemCount());
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [beadsStatus, setBeadsStatus] = useState<'coming_soon' | 'active'>('coming_soon');
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    getStoreSettings().then((s) => setBeadsStatus(s.beadsAccessoriesStatus));

    const handleUpdate = () => {
      getStoreSettings().then((s) => setBeadsStatus(s.beadsAccessoriesStatus));
    };
    window.addEventListener('store_settings_updated', handleUpdate);

    const handleScroll = () => {
      const top = window.scrollY;
      setScrolled(top > 15);
      const totalDoc = document.documentElement.scrollHeight - window.innerHeight;
      if (totalDoc > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (top / totalDoc) * 100)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('store_settings_updated', handleUpdate);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { href: '/products', label: 'All Collections' },
    { href: '/products?category=asooke', label: 'Asooke' },
    { href: '/products?category=adire', label: 'Adire' },
    {
      href: '/products?category=beads-and-accessories',
      label: 'Beads & Accessories',
      badge: beadsStatus === 'coming_soon' ? 'Soon' : undefined,
    },
  ];

  return (
    <>
      {/* Main Navbar with Scroll Animation & Glassmorphism */}
      <nav
        className={`sticky top-0 z-40 text-[#18181b] transition-all duration-300 ${
          scrolled
            ? 'bg-[#faf8f5]/95 backdrop-blur-md shadow-sm border-b border-black/5'
            : 'bg-[#faf8f5] border-b border-black/5'
        }`}
      >
        {/* Animated High-Visibility Scroll Progress Bar */}
        <div
          className="absolute top-0 left-0 h-[3.5px] bg-gradient-to-r from-[#c2410c] to-[#ea580c] transition-all duration-100 ease-out z-50"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-20'}`}>
            
            {/* Left Column: Logo */}
            <div className="flex-1 flex justify-start">
              <Link href="/" className="flex-shrink-0 focus:outline-none group">
                <div>
                  <span className="font-serif text-[#18181b] text-base sm:text-lg font-bold leading-none block group-hover:text-[#c2410c] transition-colors">
                    Tunmise Aladire
                  </span>
                  <span className="text-[10px] tracking-[0.25em] text-[#c2410c] uppercase font-semibold block mt-0.5">
                    Asooke
                  </span>
                </div>
              </Link>
            </div>

            {/* Center Column: Centered Nav Links */}
            <div className="hidden md:flex items-center justify-center space-x-8">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-xs sm:text-sm font-semibold tracking-wider text-[#18181b]/80 hover:text-[#c2410c] transition-all uppercase inline-flex items-center gap-1.5"
                >
                  <span>{l.label}</span>
                  {l.badge && (
                    <span className="text-[9px] bg-[#c2410c] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-normal">
                      {l.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Column: Actions (Search, Cart, Account, Mobile Menu) */}
            <div className="flex-grow flex items-center justify-end space-x-5 flex-1">
              {/* Search */}
              <Link 
                href="/products" 
                aria-label="Search items" 
                className="text-[#18181b]/80 hover:text-[#c2410c] transition-colors p-1"
              >
                <FiSearch size={19} />
              </Link>

              {/* Shopping Cart */}
              <button
                onClick={() => setCartOpen(true)}
                aria-label="Open shopping bag"
                className="relative text-[#18181b]/80 hover:text-[#c2410c] transition-colors p-1 cursor-pointer"
              >
                <FiShoppingCart size={19} />
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#c2410c] text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-sm">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* User Account */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label="User account"
                  className="text-[#18181b]/80 hover:text-[#c2410c] transition-colors p-1 cursor-pointer"
                >
                  <FiUser size={19} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-black/5 py-1 z-50">
                    {user ? (
                      <>
                        <Link
                          href="/orders"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                        {profile?.role === 'admin' && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2.5 text-sm text-[#c2410c] hover:bg-gray-50 font-semibold transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/signup"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle navigation menu"
                className="md:hidden text-[#18181b]/80 hover:text-[#c2410c] transition-colors p-1 cursor-pointer"
              >
                {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {menuOpen && (
          <div className="md:hidden bg-[#faf8f5] border-t border-black/5 py-3">
            <div className="px-4 space-y-2">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between text-[#18181b]/85 hover:text-[#c2410c] py-2 font-semibold text-sm tracking-wide uppercase transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{l.label}</span>
                  {l.badge && (
                    <span className="text-[9px] bg-[#c2410c] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-normal">
                      {l.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
