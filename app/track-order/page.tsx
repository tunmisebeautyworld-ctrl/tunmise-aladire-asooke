'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getOrderById } from '@/lib/firestore';
import type { Order } from '@/types';
import {
  FiSearch,
  FiPackage,
  FiCheck,
  FiTruck,
  FiClock,
  FiMapPin,
  FiPhone,
  FiMail,
  FiArrowRight,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';

const STAGES = [
  {
    key: 'confirmed',
    title: 'Order Confirmed',
    description: 'Payment verified and fabrics prepared for atelier queue',
  },
  {
    key: 'in_production',
    title: 'Atelier Tailoring',
    description: 'Artisans hand-cutting and sewing your traditional garments',
  },
  {
    key: 'packaged',
    title: 'Quality Check & Packed',
    description: 'Garments inspected, steamed, and boxed with care',
  },
  {
    key: 'shipped',
    title: 'Dispatched for Delivery',
    description: 'Package handed over to courier for transit',
  },
  {
    key: 'delivered',
    title: 'Delivered',
    description: 'Package delivered safely to your address',
  },
];

function getStageIndex(status: Order['status']): number {
  switch (status) {
    case 'pending':
      return 0;
    case 'confirmed':
      return 1;
    case 'in_production':
      return 2;
    case 'shipped':
      return 4;
    case 'delivered':
      return 5;
    case 'cancelled':
      return -1;
    default:
      return 1;
  }
}

function OrderTrackerContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  const [searchId, setSearchId] = useState(initialOrderId);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const performLookup = async (id: string) => {
    const query = id.trim();
    if (!query) return;

    setLoading(true);
    setErrorMsg('');
    setHasSearched(true);

    try {
      const found = await getOrderById(query);
      if (found) {
        setOrder(found);
      } else {
        setOrder(null);
        setErrorMsg(`No order found matching "${query}". Please check your order ID or reference.`);
      }
    } catch {
      setErrorMsg('An unexpected error occurred while looking up your order. Please try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      performLookup(initialOrderId);
    }
  }, [initialOrderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(searchId);
  };

  const currentStageIdx = order ? getStageIndex(order.status) : 0;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#18181b] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header Banner */}
        <div className="text-center space-y-3">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#c2410c] bg-[#c2410c]/10 px-3.5 py-1 rounded-full inline-block">
            Real-Time Logistics & Atelier Tracker
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#18181b] tracking-tight">
            Track Your Order
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Enter your order reference number to follow the craftsmanship and dispatch journey of your Tunmise Aladire Asooke garments.
          </p>
        </div>

        {/* Lookup Search Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-black/5">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <FiSearch size={18} />
              </div>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Order # (e.g. ORD-89421 or full ID)"
                className="w-full pl-11 pr-4 py-3.5 bg-[#faf8f5] border border-black/10 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchId.trim()}
              className="bg-[#18181b] hover:bg-[#312e81] text-white px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 flex-shrink-0"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Locating...
                </>
              ) : (
                <>
                  Track Order <FiArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Prompt / Helper text */}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
            <FiInfo size={13} className="text-[#c2410c] flex-shrink-0" />
            <span>
              Your order reference was included in your confirmation email and Paystack receipt.
            </span>
          </div>
        </div>

        {/* Error message card */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-2xl flex items-start gap-3 animate-fadeIn">
            <FiAlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-bold">Order Not Found</p>
              <p className="text-red-700">{errorMsg}</p>
              <p className="text-gray-500 pt-1">
                Need immediate help? Contact our atelier concierge at{' '}
                <Link href="/contact" className="underline font-semibold text-red-800">
                  Customer Concierge
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        {/* Order Tracking Dashboard when order is located */}
        {order && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Order Overview Banner */}
            <div className="bg-gradient-to-r from-[#18181b] to-[#27272a] text-white rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#d97706] block mb-1">
                    Order Tracking Status
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
                    Order #{order.id.slice(0, 10).toUpperCase()}
                  </h2>
                  <p className="text-xs text-white/60 mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })} &bull; Paystack Ref: {order.paystackRef || 'Verified'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.status === 'delivered'
                        ? 'bg-emerald-500 text-white'
                        : order.status === 'shipped'
                        ? 'bg-purple-500 text-white'
                        : order.status === 'in_production'
                        ? 'bg-[#c2410c] text-white'
                        : order.status === 'cancelled'
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-400 text-black'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Progress Milestones */}
              {isCancelled ? (
                <div className="pt-6 text-center text-sm text-red-300">
                  This order has been marked as cancelled. Please reach out to customer care if you have questions.
                </div>
              ) : (
                <div className="pt-8">
                  <div className="relative">
                    {/* Connecting Bar */}
                    <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-white/20 -z-0">
                      <div
                        className="h-full bg-gradient-to-r from-[#d97706] to-[#c2410c] transition-all duration-700"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((currentStageIdx - 0.5) / 4) * 100))}%`,
                        }}
                      />
                    </div>

                    {/* Step Nodes */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative z-10">
                      {STAGES.map((stage, idx) => {
                        const isDone = currentStageIdx > idx;
                        const isCurrent = currentStageIdx === idx + 1;

                        return (
                          <div key={stage.key} className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-2">
                            {/* Circle Indicator */}
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all flex-shrink-0 ${
                                isDone
                                  ? 'bg-[#c2410c] text-white shadow-md'
                                  : isCurrent
                                  ? 'bg-[#d97706] text-black ring-4 ring-[#d97706]/30 animate-pulse'
                                  : 'bg-white/10 text-white/40 border border-white/10'
                              }`}
                            >
                              {isDone ? <FiCheck size={16} /> : idx + 1}
                            </div>

                            {/* Label */}
                            <div className="sm:space-y-0.5">
                              <p
                                className={`text-xs font-bold leading-tight ${
                                  isDone || isCurrent ? 'text-white' : 'text-white/40'
                                }`}
                              >
                                {stage.title}
                              </p>
                              <p className="text-[11px] text-white/50 hidden lg:block leading-tight">
                                {stage.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Courier & Dispatch Notes (If Available) */}
            {order.deliveryNotes && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 sm:p-7 space-y-2">
                <div className="flex items-center gap-2 text-amber-800">
                  <FiTruck size={18} />
                  <h3 className="font-bold text-xs uppercase tracking-widest">
                    Dispatch & Courier Update
                  </h3>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed font-medium bg-white/70 p-4 rounded-2xl border border-amber-100">
                  &ldquo;{order.deliveryNotes}&rdquo;
                </p>
              </div>
            )}

            {/* Order Details & Delivery Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Delivery Destination */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-black/5 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <FiMapPin className="text-[#c2410c]" size={18} />
                  <h3 className="font-serif text-base font-bold">Delivery Address</h3>
                </div>

                <div className="text-xs sm:text-sm space-y-1.5 text-gray-600 leading-relaxed">
                  <p className="font-bold text-[#18181b] text-base">{order.customerInfo.name}</p>
                  <p>{order.customerInfo.address}</p>
                  <p className="font-semibold text-gray-800">
                    {order.customerInfo.city}, {order.customerInfo.state}
                  </p>
                  <div className="pt-3 border-t border-gray-100 space-y-1 text-xs">
                    <p className="flex items-center gap-2 text-gray-500">
                      <FiPhone size={13} /> {order.customerInfo.phone}
                    </p>
                    <p className="flex items-center gap-2 text-gray-500">
                      <FiMail size={13} /> {order.customerInfo.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Garments Ordered */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-black/5 md:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FiPackage className="text-[#c2410c]" size={18} />
                    <h3 className="font-serif text-base font-bold">Garments in This Order</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-semibold">
                    {order.items.length} {order.items.length === 1 ? 'piece' : 'pieces'}
                  </span>
                </div>

                <div className="divide-y divide-gray-100 space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 bg-[#faf8f5] rounded-xl overflow-hidden border border-black/5 flex-shrink-0">
                          {item.product.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#18181b]/10 flex items-center justify-center text-xs">
                              Tunmise
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-[#18181b] truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Size: <span className="font-bold text-gray-700">{item.selectedSize}</span> &bull; Color: <span className="font-bold text-gray-700">{item.selectedColor.split('|')[0]}</span> &bull; Qty: {item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-sm text-[#c2410c]">
                          ₦{(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Total */}
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-500">Total Paid (Paystack):</span>
                  <span className="font-extrabold text-xl text-[#c2410c]">
                    ₦{order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Atelier Contact & Help card */}
            <div className="bg-[#faf8f5] border border-black/5 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2 text-[#c2410c]">
                  <FiClock size={16} />
                  <h4 className="font-serif font-bold text-base text-[#18181b]">
                    Need Help With Your Delivery?
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Our customer concierge and master tailors are available Monday through Saturday (9:00 AM – 7:00 PM) at our Lagos Studio.
                </p>
              </div>

              <Link
                href="/contact"
                className="bg-[#18181b] hover:bg-[#312e81] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 flex-shrink-0"
              >
                Contact Concierge
              </Link>
            </div>
          </div>
        )}

        {/* Empty State / Initial Instructions */}
        {!order && !loading && !hasSearched && (
          <div className="bg-white rounded-3xl p-10 text-center border border-black/5 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-[#c2410c]/10 text-[#c2410c] rounded-2xl flex items-center justify-center mx-auto">
              <FiPackage size={30} />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#18181b]">
              Ready to Track Your Order
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              Paste your order number into the search field above to view real-time atelier tailoring status, dispatch timeline, and courier notes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderTrackerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#c2410c] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Loading Order Tracker...
            </p>
          </div>
        </div>
      }
    >
      <OrderTrackerContent />
    </Suspense>
  );
}
