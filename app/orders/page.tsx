'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getOrdersByUser } from '@/lib/firestore';
import type { Order } from '@/types';
import { useRouter } from 'next/navigation';
import { FiPackage, FiArrowRight, FiExternalLink, FiCreditCard } from 'react-icons/fi';
import Link from 'next/link';

const STATUS_PILLS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900 border border-amber-300',
  confirmed: 'bg-blue-100 text-blue-900 border border-blue-300',
  in_production: 'bg-purple-100 text-purple-900 border border-purple-300',
  shipped: 'bg-indigo-100 text-indigo-900 border border-indigo-300',
  delivered: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
  cancelled: 'bg-red-100 text-red-900 border border-red-300',
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      getOrdersByUser(user.uid)
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-36 border border-black/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#18181b]">My Orders</h1>
            <p className="text-xs text-gray-500 mt-0.5">Track your custom tailoring and dispatch status</p>
          </div>
          <Link
            href="/products"
            className="text-xs sm:text-sm font-bold text-[#c2410c] hover:text-[#ea580c] flex items-center gap-1 transition-colors"
          >
            Explore Catalog <FiArrowRight size={14} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-black/5 px-6">
            <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4">
              <FiPackage size={32} className="text-[#18181b]/30" />
            </div>
            <p className="text-[#18181b] text-lg font-bold">No orders placed yet</p>
            <p className="text-gray-400 text-xs mt-1 mb-6 max-w-sm mx-auto">
              Once you complete an order, its production progress and courier details will appear here.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#18181b] text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-[#312e81] transition-all"
            >
              Start Shopping <FiArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderDate = order.createdAt
                ? new Date(
                    (order.createdAt as unknown as { toDate?: () => Date }).toDate?.() ?? order.createdAt
                  ).toLocaleDateString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
                : 'Recent';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-black/5 hover:shadow-md transition-shadow"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-[#18181b] bg-[#faf8f5] px-2.5 py-1 rounded-md border border-gray-200">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">{orderDate}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Delivering to: {order.customerInfo?.city}, {order.customerInfo?.state}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          STATUS_PILLS[order.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="py-3 divide-y divide-gray-50">
                    {order.items.map((item, i) => (
                      <div key={i} className="py-2.5 first:pt-0 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.product.id}`}
                            className="font-semibold text-xs sm:text-sm text-[#18181b] hover:text-[#c2410c] transition-colors truncate block"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Qty: <strong className="text-[#18181b]">{item.quantity}</strong> &bull; Size:{' '}
                            <strong className="text-[#18181b]">{item.selectedSize}</strong> &bull; Colour:{' '}
                            <strong className="text-[#18181b]">{item.selectedColor.split('|')[0]}</strong>
                          </p>
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-[#18181b] whitespace-nowrap">
                          ₦{(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Payment Details Pill if Bank Transfer */}
                  {order.paymentMethod === 'bank_transfer' && (
                    <div className="my-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs flex items-center justify-between flex-wrap gap-2">
                      <span className="text-amber-900 font-semibold flex items-center gap-1.5 text-[11px]">
                        <FiCreditCard size={12} />
                        Direct Bank Transfer ({order.paymentDetails?.senderBank || 'Lotus Bank'})
                      </span>
                      <span className="text-[10px] text-amber-800 font-mono">
                        Ref: {order.paymentDetails?.transferReference || order.id.slice(0, 8)}
                      </span>
                    </div>
                  )}

                  {/* Card Bottom: Total & Track Button */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold">Total Paid</span>
                      <span className="font-black text-base sm:text-lg text-[#c2410c]">
                        ₦{order.total.toLocaleString()}
                      </span>
                    </div>

                    <Link
                      href={`/track-order?orderId=${order.id}`}
                      className="inline-flex items-center gap-1.5 bg-[#18181b] hover:bg-[#312e81] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      <FiExternalLink size={13} /> Track Atelier Progress
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
