'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { createOrder } from '@/lib/firestore';
import { PAYSTACK_PUBLIC_KEY, formatAmount, generateRef } from '@/lib/paystack';
import toast from 'react-hot-toast';
import Script from 'next/script';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePaystack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Your cart is empty'); return; }
    setLoading(true);

    const ref = generateRef();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PaystackPop = (window as any).PaystackPop;
    if (!PaystackPop) {
      toast.error('Paystack is not loaded. Please refresh and try again.');
      setLoading(false);
      return;
    }

    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: form.email,
      amount: formatAmount(total()),
      currency: 'NGN',
      ref,
      metadata: {
        custom_fields: [
          { display_name: 'Customer Name', variable_name: 'name', value: form.name },
          { display_name: 'Phone', variable_name: 'phone', value: form.phone },
        ],
      },
      onClose: () => {
        setLoading(false);
        toast.error('Payment cancelled');
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: async (response: any) => {
        try {
          const orderId = await createOrder({
            userId: user?.uid || 'guest',
            items,
            total: total(),
            status: 'confirmed',
            customerInfo: form,
            paystackRef: response.reference,
          });

          // Dispatch transactional order confirmation & atelier alert
          fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'order_confirmation',
              order: {
                id: orderId,
                userId: user?.uid || 'guest',
                items,
                total: total(),
                status: 'confirmed',
                customerInfo: form,
                paystackRef: response.reference,
                createdAt: new Date(),
              },
            }),
          }).catch((e) => console.error('Email notification error:', e));

          clearCart();
          toast.success('Order placed successfully! Live tracker opened and receipt emailed.');
          router.push(`/track-order?orderId=${orderId}`);
        } catch {
          toast.error('Order save failed. Please contact support with ref: ' + response.reference);
        } finally {
          setLoading(false);
        }
      },
    });
    handler.openIframe();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Load Paystack script asynchronously */}
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

      <h1 className="font-serif text-3xl text-brand-indigo mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Delivery Form */}
        <form onSubmit={handlePaystack} className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-brand-indigo mb-4">Delivery Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Chioma Adeyemi', col: 1 },
                { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', col: 1 },
                { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+234 800 000 0000', col: 1 },
                { name: 'address', label: 'Street Address', type: 'text', placeholder: '12 Asooke Close, Victoria Island', col: 2 },
                { name: 'city', label: 'City', type: 'text', placeholder: 'Lagos Island', col: 1 },
              ].map((f) => (
                <div key={f.name} className={f.col === 2 ? 'sm:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-brand-indigo mb-1">{f.label}</label>
                  <input
                    name={f.name} type={f.type} required
                    placeholder={f.placeholder}
                    value={(form as Record<string, string>)[f.name]}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-brand-indigo/10 rounded-xl text-sm focus:outline-none focus:border-brand-gold"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-brand-indigo mb-1">State</label>
                <select
                  name="state" required value={form.state} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-brand-indigo/10 rounded-xl text-sm focus:outline-none focus:border-brand-gold bg-white"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full bg-brand-terracotta hover:bg-brand-terracotta-light text-white font-bold py-4 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </>
            ) : (
              `Pay ₦${total().toLocaleString()} with Paystack`
            )}
          </button>

          <p className="text-center text-xs text-brand-indigo/40">
            Secured by Paystack. Your payment info is safe and encrypted.
          </p>
        </form>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
            <h2 className="font-semibold text-brand-indigo mb-4">Order Summary</h2>
            {items.length === 0 ? (
              <p className="text-brand-indigo/40 text-sm">Your cart is empty</p>
            ) : (
              <>
                <ul className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium text-brand-indigo">{item.product.name}</p>
                        <p className="text-brand-indigo/50 text-xs">
                          {item.selectedSize} · {item.selectedColor} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-brand-indigo">
                        ₦{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-brand-indigo/10 pt-4">
                  <div className="flex justify-between font-bold text-brand-indigo">
                    <span>Total</span>
                    <span className="text-brand-terracotta text-xl">₦{total().toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-brand-indigo/40 mt-2">Delivery fees calculated at fulfilment</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
