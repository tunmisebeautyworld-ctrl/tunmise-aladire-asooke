'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getOrdersByUser } from '@/lib/firestore';
import type { Order } from '@/types';
import { useRouter } from 'next/navigation';
import { FiPackage, FiArrowRight } from 'react-icons/fi';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100   text-blue-800',
  shipped:   'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100  text-green-800',
  cancelled: 'bg-red-100    text-red-800',
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) {
      getOrdersByUser(user.uid)
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (loading || authLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl h-32" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-brand-indigo">My Orders</h1>
        <Link href="/products" className="text-brand-gold hover:text-brand-gold-light text-sm flex items-center gap-1">
          Shop More <FiArrowRight size={14} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <FiPackage size={56} className="mx-auto text-brand-indigo/20 mb-4" />
          <p className="text-brand-indigo/50 text-lg font-medium">No orders yet</p>
          <p className="text-brand-indigo/30 text-sm mt-1 mb-6">Your order history will appear here</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-brand-indigo text-brand-cream px-6 py-3 rounded-full font-medium text-sm hover:bg-brand-indigo-light transition-colors"
          >
            Start Shopping <FiArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const orderDate = order.createdAt
              ? new Date((order.createdAt as unknown as { toDate?: () => Date }).toDate?.() ?? order.createdAt).toLocaleDateString('en-NG', { dateStyle: 'long' })
              : 'N/A';

            return (
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-brand-indigo/40 font-mono">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-brand-indigo/60 mt-0.5">{orderDate}</p>
                    <p className="text-sm text-brand-indigo/50 mt-1">
                      {order.customerInfo?.city}, {order.customerInfo?.state}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize flex items-center gap-1 ${statusColors[order.status] || 'bg-gray-100'}`}>
                    {order.status}
                  </span>
                </div>

                <ul className="space-y-2 mb-4 text-sm text-brand-indigo/70">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span>
                        {item.product.name}{' '}
                        <span className="text-brand-indigo/40">× {item.quantity}</span>
                        <span className="text-brand-indigo/40 text-xs ml-1">({item.selectedSize} / {item.selectedColor})</span>
                      </span>
                      <span className="font-medium text-brand-indigo">
                        ₦{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-brand-indigo/10 pt-3 flex justify-between">
                  <span className="text-sm text-brand-indigo/50">Order Total</span>
                  <span className="font-bold text-brand-terracotta text-lg">₦{order.total.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
