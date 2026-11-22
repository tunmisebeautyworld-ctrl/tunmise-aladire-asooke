'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import { FiX, FiShoppingCart, FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '@/hooks/useCart';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in-out duration-300" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full" enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0" leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-full sm:max-w-md">
                  <div className="flex h-full flex-col bg-[#faf8f5] shadow-2xl text-[#18181b]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 bg-[#18181b] text-white border-b border-white/10">
                      <div>
                        <Dialog.Title className="font-serif text-lg sm:text-xl font-bold tracking-wide text-white">
                          Your Shopping Bag
                        </Dialog.Title>
                        <p className="text-[11px] text-[#fefce8]/60 mt-0.5">
                          {items.length} {items.length === 1 ? 'item' : 'items'} in bag
                        </p>
                      </div>
                      <button 
                        onClick={onClose} 
                        aria-label="Close cart" 
                        className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <FiX size={22} />
                      </button>
                    </div>

                    {/* Items */}
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                          <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mb-4">
                            <FiShoppingCart size={32} className="text-[#18181b]/30" />
                          </div>
                          <p className="text-[#18181b] text-base font-bold">Your bag is empty</p>
                          <p className="text-gray-400 text-xs mt-1 max-w-xs">Explore our handcrafted Asooke collection to add pieces</p>
                          <button
                            onClick={onClose}
                            className="mt-5 px-6 py-2.5 rounded-full bg-[#18181b] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#312e81] transition-all cursor-pointer"
                          >
                            Explore Collection
                          </button>
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {items.map((item, idx) => (
                            <li key={idx} className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 bg-white rounded-2xl shadow-sm border border-black/5">
                              {/* Product Image Thumbnail */}
                              <div className="w-20 h-24 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden relative border border-gray-200">
                                {item.product.images?.[0] ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#18181b] to-[#c2410c]" />
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-1">
                                    <h4 className="font-bold text-[#18181b] text-sm leading-snug line-clamp-2">{item.product.name}</h4>
                                    <button
                                      aria-label="Remove item"
                                      onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)}
                                      className="text-gray-300 hover:text-red-500 p-1 transition-colors flex-shrink-0 cursor-pointer"
                                    >
                                      <FiTrash2 size={15} />
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-gray-500 mt-1">
                                    Size: <strong className="text-[#18181b]">{item.selectedSize}</strong> &bull; {item.selectedColor.split('|')[0]}
                                  </p>
                                </div>
                                
                                <div className="flex items-center justify-between mt-3 gap-2">
                                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-[#faf8f5]">
                                    <button
                                      aria-label="Decrease quantity"
                                      onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                                      className="px-2.5 py-1.5 text-gray-600 hover:bg-black/5 transition-colors cursor-pointer"
                                    >
                                      <FiMinus size={11} />
                                    </button>
                                    <span className="text-xs font-bold w-6 text-center text-[#18181b]">{item.quantity}</span>
                                    <button
                                      aria-label="Increase quantity"
                                      onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                                      className="px-2.5 py-1.5 text-gray-600 hover:bg-black/5 transition-colors cursor-pointer"
                                    >
                                      <FiPlus size={11} />
                                    </button>
                                  </div>
                                  <p className="text-[#c2410c] font-black text-sm whitespace-nowrap">
                                    ₦{(item.product.price * item.quantity).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                      <div className="border-t border-black/5 bg-white px-5 sm:px-6 py-5 space-y-3.5 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
                        <div className="space-y-1.5 text-xs sm:text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-semibold text-[#18181b]">₦{total().toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Delivery</span>
                            <span className="text-[#c2410c] font-semibold">Calculated at checkout</span>
                          </div>
                          <div className="flex justify-between font-bold text-base text-[#18181b] pt-2 border-t border-gray-100">
                            <span>Total</span>
                            <span className="text-[#c2410c] font-black text-lg">₦{total().toLocaleString()}</span>
                          </div>
                        </div>

                        <Link
                          href="/checkout"
                          onClick={onClose}
                          className="block w-full text-center bg-[#c2410c] hover:bg-[#ea580c] text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all shadow-md active:scale-[0.98] text-xs sm:text-sm uppercase tracking-widest cursor-pointer"
                        >
                          Proceed to Checkout
                        </Link>

                        <button
                          onClick={clearCart}
                          className="block w-full text-center text-gray-400 hover:text-red-500 text-[11px] font-semibold uppercase tracking-wider transition-colors pt-0.5 cursor-pointer"
                        >
                          Clear Bag
                        </button>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
