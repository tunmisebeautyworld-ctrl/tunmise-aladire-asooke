'use client';

import { useState, Fragment } from 'react';
import Link from 'next/link';
import { FiInstagram, FiTwitter, FiFacebook, FiX } from 'react-icons/fi';
import { Dialog, Transition } from '@headlessui/react';

export default function Footer() {
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);

  return (
    <footer className="bg-[#1e1b4b] text-[#fefce8]/80 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h3 className="font-serif text-[#d97706] text-xl mb-2 font-bold">Tunmise Aladire</h3>
            <p className="text-[10px] tracking-widest text-[#fefce8]/50 uppercase mb-4 font-bold">Asooke</p>
            <p className="text-sm leading-relaxed">
              Elevating Tradition. Embracing Modernity. Authentic African fashion crafted with love.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" aria-label="Instagram" className="hover:text-[#d97706] transition-colors"><FiInstagram size={20} /></a>
              <a href="#" aria-label="Twitter" className="hover:text-[#d97706] transition-colors"><FiTwitter size={20} /></a>
              <a href="#" aria-label="Facebook" className="hover:text-[#d97706] transition-colors"><FiFacebook size={20} /></a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-[#fefce8] mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products?category=asooke" className="hover:text-[#d97706]">Asooke</Link></li>
              <li><Link href="/products?category=adire" className="hover:text-[#d97706]">Adire</Link></li>
              <li><Link href="/products?category=beads-and-accessories" className="hover:text-[#d97706]">Beads & Accessories</Link></li>
              <li><Link href="/products" className="hover:text-[#d97706]">All Collections</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-[#fefce8] mb-4">Customer Care</h4>
            <ul className="space-y-2 text-sm text-[#fefce8]/70">
              <li>
                <button onClick={() => setSizeGuideOpen(true)} className="hover:text-[#d97706] transition-colors text-left cursor-pointer">
                  Size Guide
                </button>
              </li>
              <li>
                <button onClick={() => setShippingOpen(true)} className="hover:text-[#d97706] transition-colors text-left cursor-pointer">
                  Shipping & Returns
                </button>
              </li>
              <li>
                <button onClick={() => setCareOpen(true)} className="hover:text-[#d97706] transition-colors text-left cursor-pointer">
                  Care Instructions
                </button>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#d97706] transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Lagos Physical Studio */}
          <div>
            <h4 className="font-semibold text-[#fefce8] mb-4">Lagos Studio & Hours</h4>
            <div className="space-y-2 text-xs text-[#fefce8]/75 leading-relaxed">
              <p className="font-medium text-white">
                Shop FF29 & K-KLAMP 7&8 (Upstairs & Downstairs)
              </p>
              <p>
                LKJ BUSINESS HUB, NYSC BUS STOP, IGANDO, LAGOS.
              </p>
              <p className="pt-1">
                <span className="font-bold text-[#d97706]">9:00 AM – 7:00 PM</span>
                <br />
                Monday – Saturday
              </p>
              <div className="pt-1">
                <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                  We are Open! Online & Walk-In
                </span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-[#fefce8] mb-4">Newsletter</h4>
            <p className="text-sm mb-4">Join our community for exclusive drops and style inspiration.</p>
            <form className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 text-sm bg-white/10 border border-[#d97706]/30 rounded-l-md text-[#fefce8] placeholder:text-[#fefce8]/40 focus:outline-none focus:border-[#d97706]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#d97706] text-[#1e1b4b] text-sm font-semibold rounded-r-md hover:bg-[#f59e0b] transition-colors cursor-pointer"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-[#fefce8]/10 mt-8 pt-8 text-center text-xs text-[#fefce8]/40">
          <p>© {new Date().getFullYear()} Tunmise Aladire Asooke. All rights reserved.</p>
          <p className="mt-1">Handcrafted with passion in Nigeria</p>
        </div>
      </div>

      {/* ─── SIZE GUIDE MODAL ─── */}
      <PolicyModal isOpen={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} title="Size Guide & Conversions">
        <div className="space-y-4 text-[#1e1b4b] text-sm">
          <p>We reconcile letter sizing with UK/Nigerian standard dress sizes below:</p>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1e1b4b]/20 font-bold">
                <th className="py-2">Letter Size</th>
                <th className="py-2">UK Size</th>
                <th className="py-2">Bust / Chest</th>
                <th className="py-2">Waist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><td className="py-2 font-semibold">XS</td><td className="py-2">UK 6 - 8</td><td className="py-2">30 - 32 in</td><td className="py-2">24 - 26 in</td></tr>
              <tr><td className="py-2 font-semibold">S</td><td className="py-2">UK 8 - 10</td><td className="py-2">32 - 34 in</td><td className="py-2">26 - 28 in</td></tr>
              <tr><td className="py-2 font-semibold">M</td><td className="py-2">UK 10 - 12</td><td className="py-2">34 - 36 in</td><td className="py-2">28 - 30 in</td></tr>
              <tr><td className="py-2 font-semibold">L</td><td className="py-2">UK 12 - 14</td><td className="py-2">36 - 38 in</td><td className="py-2">30 - 32 in</td></tr>
              <tr><td className="py-2 font-semibold">XL</td><td className="py-2">UK 14 - 16</td><td className="py-2">38 - 40 in</td><td className="py-2">32 - 34 in</td></tr>
              <tr><td className="py-2 font-semibold">XXL</td><td className="py-2">UK 16 - 18</td><td className="py-2">40 - 42 in</td><td className="py-2">34 - 36 in</td></tr>
              <tr><td className="py-2 font-semibold">3XL</td><td className="py-2">UK 18 - 20</td><td className="py-2">42 - 44 in</td><td className="py-2">36 - 38 in</td></tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-500 italic mt-3">
            Note: If you fall between sizes or want custom tailoring, reach out via our **Contact** page or submit your custom measurements on supported items!
          </p>
        </div>
      </PolicyModal>

      {/* ─── SHIPPING & RETURNS MODAL ─── */}
      <PolicyModal isOpen={shippingOpen} onClose={() => setShippingOpen(false)} title="Shipping & Returns Policies">
        <div className="space-y-4 text-[#1e1b4b] text-sm">
          <div>
            <h4 className="font-bold text-base text-[#c2410c] mb-1">Domestic Nigerian Shipping</h4>
            <p className="leading-relaxed">
              * **Lagos Delivery:** 1 - 2 business days (₦2,500 base rate).
              <br />
              * **Abuja / Port Harcourt / Interstate:** 3 - 5 business days (₦4,500 base rate).
            </p>
          </div>
          <div>
            <h4 className="font-bold text-base text-[#c2410c] mb-1">International Shipping</h4>
            <p className="leading-relaxed">
              * Shipped via DHL Express (5 - 8 business days worldwide). Rates calculated dynamically at checkout based on weight and country.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-base text-[#c2410c] mb-1">Returns & Adjustments</h4>
            <p className="leading-relaxed">
              * Since our traditional pieces and custom collections are hand-tailored to order, we do not accept general returns. However, we offer **free alterations** within 14 days of delivery if your clothing sizing requires adjustments.
            </p>
          </div>
        </div>
      </PolicyModal>

      {/* ─── CARE INSTRUCTIONS MODAL ─── */}
      <PolicyModal isOpen={careOpen} onClose={() => setCareOpen(false)} title="Traditional Fabric Care Guide">
        <div className="space-y-4 text-[#1e1b4b] text-sm">
          <div>
            <h4 className="font-bold text-base text-[#c2410c] mb-1">Indigo & Crepe Adire Care</h4>
            <p className="leading-relaxed">
              * Adire tie-dye uses rich natural dyes. To prevent fading, **hand wash cold separately** with mild detergent. 
              <br />
              * Do not bleach. Air dry in the shade (avoid direct hot sunlight). Iron on low heat on the reverse side.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-base text-[#c2410c] mb-1">Handwoven Asooke Care</h4>
            <p className="leading-relaxed">
              * Woven Asooke fabric with metallic gold/silver thread detailing should be **dry cleaned only**. 
              <br />
              * Store folded flat in a dry wardrobe, wrapped in acid-free tissue paper or a cotton garment bag to protect metallic fibers from tarnishing.
            </p>
          </div>
        </div>
      </PolicyModal>
    </footer>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function PolicyModal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 text-[#1e1b4b]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md p-6 border border-[#d97706]/10">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                  <Dialog.Title as="h3" className="font-serif text-lg font-bold text-brand-indigo">
                    {title}
                  </Dialog.Title>
                  <button onClick={onClose} aria-label="Close modal" className="text-gray-400 hover:text-brand-indigo p-1 cursor-pointer">
                    <FiX size={18} />
                  </button>
                </div>

                {/* Content */}
                <div>
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
