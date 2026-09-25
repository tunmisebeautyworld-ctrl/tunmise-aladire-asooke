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

  useEffect(() => {
    getStoreSettings().then((s) => setBeadsStatus(s.beadsAccessoriesStatus));

    const handleUpdate = () => {
      getStoreSettings().then((s) => setBeadsStatus(s.beadsAccessoriesStatus));
    };
    window.addEventListener('store_settings_updated', handleUpdate);
    return () => window.removeEventListener('store_settings_updated', handleUpdate);
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
      {/* Announcement Bar - Physical Studio & Hours */}
      <div className="bg-[#2e1b12] text-[#fefce8] text-[9px] sm:text-xs tracking-[0.16em] font-semibold py-2 px-4 text-center uppercase border-b border-[#d97706]/10 flex items-center justify-center gap-2 flex-wrap">
        <span>LAGOS STUDIO: SHOP FF29 & K-KLAMP 7&8, LKJ HUB, IGANDO</span>
        <span className="hidden sm:inline text-[#d97706]">✦</span>
        <span>OPEN 9AM - 7PM (MON - SAT) ONLINE & WALK-IN</span>
      </div>

      {/* Main Navbar */}
      <nav className="sticky top-0 z-40 bg-[#fefce8]/95 backdrop-blur-md text-[#1e1b4b] border-b border-[#d97706]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Column: Logo */}
            <div className="flex-1 flex justify-start">
              <Link href="/" className="flex-shrink-0 focus:outline-none group">
                <div>
                  <span className="font-serif text-[#1e1b4b] text-base sm:text-lg font-bold leading-none block group-hover:text-[#c2410c] transition-colors">
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
                  className="text-xs sm:text-sm font-semibold tracking-wider text-[#1e1b4b]/80 hover:text-[#c2410c] transition-all uppercase inline-flex items-center gap-1.5"
                >
                  <span>{l.label}</span>
                  {l.badge && (
                    <span className="text-[9px] bg-[#d97706] text-[#1e1b4b] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-normal">
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
                className="text-[#1e1b4b]/80 hover:text-[#c2410c] transition-colors p-1"
              >
                <FiSearch size={19} />
              </Link>

              {/* Shopping Cart */}
              <button
                onClick={() => setCartOpen(true)}
                aria-label="Open shopping bag"
                className="relative text-[#1e1b4b]/80 hover:text-[#c2410c] transition-colors p-1 cursor-pointer"
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
                  className="text-[#1e1b4b]/80 hover:text-[#c2410c] transition-colors p-1 cursor-pointer"
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
                className="md:hidden text-[#1e1b4b]/80 hover:text-[#c2410c] transition-colors p-1 cursor-pointer"
              >
                {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {menuOpen && (
          <div className="md:hidden bg-[#fefce8] border-t border-[#d97706]/15 py-3">
            <div className="px-4 space-y-2">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between text-[#1e1b4b]/85 hover:text-[#c2410c] py-2 font-semibold text-sm tracking-wide uppercase transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{l.label}</span>
                  {l.badge && (
                    <span className="text-[9px] bg-[#d97706] text-[#1e1b4b] px-2 py-0.5 rounded-full font-bold uppercase tracking-normal">
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
