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
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full" enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0" leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-[#fefce8] border-l border-[#1e1b4b]/10 shadow-2xl text-[#1e1b4b]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 bg-[#1e1b4b] text-[#fefce8]">
                      <Dialog.Title className="font-serif text-xl font-bold tracking-wide text-[#d97706]">
                        Your Shopping Bag
                      </Dialog.Title>
                      <button 
                        onClick={onClose} 
                        aria-label="Close cart" 
                        className="text-[#fefce8]/80 hover:text-[#d97706] transition-colors p-1"
                      >
                        <FiX size={24} />
                      </button>
                    </div>

                    {/* Items */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                          <FiShoppingCart size={64} className="text-[#1e1b4b]/20 mb-4" />
                          <p className="text-[#1e1b4b]/50 text-lg font-medium">Your bag is empty</p>
                          <button
                            onClick={onClose}
                            className="mt-4 text-[#d97706] hover:text-[#f59e0b] font-bold underline"
                          >
                            Continue Shopping
                          </button>
                        </div>
                      ) : (
                        <ul className="space-y-4">
                          {items.map((item, idx) => (
                            <li key={idx} className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-[#1e1b4b]/5">
                              {/* Product Image Thumbnail */}
                              <div className="w-20 h-24 bg-[#1e1b4b]/5 rounded-xl flex-shrink-0 overflow-hidden relative border border-[#1e1b4b]/5">
                                {item.product.images?.[0] ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#1e1b4b] to-[#c2410c] tie-dye-bg opacity-40" />
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-semibold text-[#1e1b4b] text-sm leading-tight truncate">{item.product.name}</h4>
                                  <p className="text-xs text-[#1e1b4b]/60 mt-1 font-medium">
                                    Size: {item.selectedSize} &middot; {item.selectedColor}
                                  </p>
                                </div>
                                
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-2 border border-[#1e1b4b]/15 rounded-lg overflow-hidden bg-[#fefce8]/50">
                                    <button
                                      aria-label="Decrease quantity"
                                      onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                                      className="px-2.5 py-1 text-[#1e1b4b]/70 hover:bg-[#1e1b4b]/5 hover:text-[#1e1b4b] transition-colors"
                                    >
                                      <FiMinus size={11} />
                                    </button>
                                    <span className="text-xs font-semibold w-5 text-center">{item.quantity}</span>
                                    <button
                                      aria-label="Increase quantity"
                                      onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                                      className="px-2.5 py-1 text-[#1e1b4b]/70 hover:bg-[#1e1b4b]/5 hover:text-[#1e1b4b] transition-colors"
                                    >
                                      <FiPlus size={11} />
                                    </button>
                                  </div>
                                  <p className="text-[#c2410c] font-bold text-sm">
                                    ₦{(item.product.price * item.quantity).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* Remove Button */}
                              <button
                                aria-label="Remove item"
                                onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)}
                                className="text-[#1e1b4b]/30 hover:text-[#c2410c] self-start p-1 transition-colors"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Footer */}
                    {items.length > 0 && (
                      <div className="border-t border-[#1e1b4b]/10 bg-white px-6 py-6 space-y-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-sm text-[#1e1b4b]/75">
                            <span>Subtotal</span>
                            <span className="font-medium">₦{total().toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm text-[#1e1b4b]/75">
                            <span>Shipping</span>
                            <span className="text-[#c2410c] font-medium">Calculated at checkout</span>
                          </div>
                          <div className="flex justify-between font-bold text-base text-[#1e1b4b] pt-2.5 border-t border-[#1e1b4b]/5">
                            <span>Total (Est.)</span>
                            <span className="text-[#c2410c] text-lg">₦{total().toLocaleString()}</span>
                          </div>
                        </div>

                        <Link
                          href="/checkout"
                          onClick={onClose}
                          className="block w-full text-center bg-[#c2410c] hover:bg-[#ea580c] text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-95 text-sm uppercase tracking-wider cursor-pointer btn-shimmer"
                        >
                          Proceed to Checkout & Pay
                        </Link>

                        <button
                          onClick={clearCart}
                          className="block w-full text-center text-[#1e1b4b]/40 hover:text-[#c2410c] text-xs font-semibold uppercase tracking-wider transition-colors pt-1 cursor-pointer"
                        >
                          Empty Shopping Bag
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
