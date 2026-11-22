'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { createOrder, getStoreSettings, DEFAULT_BANK_DETAILS } from '@/lib/firestore';
import type { BankDetails } from '@/types';
import toast from 'react-hot-toast';
import {
  FiCopy,
  FiCheck,
  FiShield,
  FiArrowRight,
  FiArrowLeft,
  FiInfo,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const POPULAR_BANKS = [
  'Lotus Bank',
  'Moniepoint MFB',
  'OPay',
  'Palmpay',
  'GTBank (Guaranty Trust Bank)',
  'Access Bank',
  'Zenith Bank',
  'Kuda Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Stanbic IBTC Bank',
  'Sterling Bank',
  'Fidelity Bank',
  'Wema / ALAT',
  'Other Bank',
];

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Wizard Step State: 1 = Delivery, 2 = Bank Transfer Details, 3 = Confirmation Form
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [loading, setLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>(DEFAULT_BANK_DETAILS);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Delivery Information Form
  const [form, setForm] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
  });

  // "I Have Paid" Transfer Confirmation Form
  const [senderName, setSenderName] = useState('');
  const [amountPaid, setAmountPaid] = useState<number | string>('');
  const [senderBank, setSenderBank] = useState('');
  const [otherBank, setOtherBank] = useState('');
  const [transferReference, setTransferReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    getStoreSettings().then((s) => {
      if (s?.bankDetails) {
        setBankDetails(s.bankDetails);
      }
    });
  }, []);

  // Pre-fill sender name and amount paid when delivery form or total changes
  useEffect(() => {
    if (form.name && !senderName) {
      setSenderName(form.name);
    }
  }, [form.name, senderName]);

  useEffect(() => {
    if (total() > 0 && !amountPaid) {
      setAmountPaid(total());
    }
  }, [total, amountPaid]);

  const handleDeliveryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'name' && (!senderName || senderName === form.name)) {
      setSenderName(value);
    }
  };

  const handleCopy = (text: string, type: 'account' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
      toast.success('Account number copied to clipboard');
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
      toast.success('Amount copied to clipboard');
    }
  };

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Your bag is empty');
      return;
    }
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.state.trim()
    ) {
      toast.error('Please fill in all delivery details to continue');
      return;
    }
    if (!senderName) {
      setSenderName(form.name);
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToStep3 = () => {
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Validate delivery fields
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.state.trim()
    ) {
      toast.error('Please fill out all delivery information fields');
      setCurrentStep(1);
      return;
    }

    // Validate bank payment fields
    const finalSender = (senderName || form.name).trim();
    if (!finalSender) {
      toast.error('Please provide the account name you transferred from');
      return;
    }

    const finalAmount = Number(amountPaid) || total();
    if (finalAmount <= 0) {
      toast.error('Please specify a valid amount paid');
      return;
    }

    const finalBank = senderBank === 'Other Bank' ? otherBank.trim() : senderBank;
    if (!finalBank) {
      toast.error('Please select the bank transferred from');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        userId: user?.uid || 'guest',
        items,
        total: total(),
        status: 'pending' as const,
        paymentMethod: 'bank_transfer' as const,
        paymentDetails: {
          senderName: finalSender,
          amountPaid: finalAmount,
          senderBank: finalBank,
          transferReference: transferReference.trim() || undefined,
          paymentNotes: paymentNotes.trim() || undefined,
          paymentDate: new Date().toISOString(),
        },
        customerInfo: form,
      };

      const orderId = await createOrder(orderData);

      const createdOrderWithId = {
        ...orderData,
        id: orderId,
        createdAt: new Date(),
      };

      // 1. Dispatch immediate alert to Store Admin
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bank_transfer_admin_alert',
          order: createdOrderWithId,
        }),
      }).catch((e) => console.error('Admin notification error:', e));

      // 2. Dispatch acknowledgment to customer
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bank_transfer_customer_ack',
          order: createdOrderWithId,
        }),
      }).catch((e) => console.error('Customer acknowledgment error:', e));

      clearCart();
      toast.success('Transfer submitted! Redirecting to your live order tracker...');
      router.push(`/track-order?orderId=${orderId}`);
    } catch {
      toast.error('Failed to submit order. Please contact atelier support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#18181b] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="text-center space-y-2">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#c2410c] bg-[#c2410c]/10 px-3.5 py-1 rounded-full inline-block">
            Direct Nigerian Bank Transfer Checkout
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#18181b]">
            Complete Your Order
          </h1>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Follow the 3 easy steps below to place your bespoke order. We verify transfers in under 5 minutes.
          </p>
        </div>

        {/* ── 3-Step Wizard Navigation Indicator ── */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-black/5">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-8 right-8 h-1 bg-gray-200 -translate-y-1/2 -z-0" />
            <div
              className="absolute top-1/2 left-8 h-1 bg-[#c2410c] -translate-y-1/2 transition-all duration-500 -z-0"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
              }}
            />

            {[
              { step: 1, label: 'Delivery Address' },
              { step: 2, label: 'Bank Transfer' },
              { step: 3, label: 'I Have Paid' },
            ].map((s) => {
              const isDone = currentStep > s.step;
              const isCurrent = currentStep === s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  disabled={currentStep < s.step}
                  onClick={() => {
                    if (currentStep > s.step) {
                      setCurrentStep(s.step as 1 | 2 | 3);
                    }
                  }}
                  className={`relative z-10 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-[#18181b] text-white hover:bg-[#312e81] cursor-pointer'
                      : isCurrent
                      ? 'bg-[#c2410c] text-white ring-4 ring-[#c2410c]/25 shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black bg-white/20">
                    {isDone ? <FiCheck size={12} /> : s.step}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Step Content + Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols): Active Step View */}
          <div className="lg:col-span-2 space-y-6">

            {/* ══════════════════════════════════════════════════════════════════
                STEP 1: Delivery Information Form
            ══════════════════════════════════════════════════════════════════ */}
            {currentStep === 1 && (
              <form onSubmit={handleProceedToStep2} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-black/5 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#18181b] text-white flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-[#18181b]">
                      Delivery Information
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-[#c2410c] uppercase tracking-wider">
                    Step 1 of 3
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { name: 'name', label: 'Full Name *', type: 'text', placeholder: 'e.g. Babatunde Lawal', col: 1 },
                    { name: 'email', label: 'Email Address (for order receipt & tracking) *', type: 'email', placeholder: 'you@example.com', col: 1 },
                    { name: 'phone', label: 'Phone Number (for courier contact) *', type: 'tel', placeholder: '+234 800 000 0000', col: 1 },
                    { name: 'address', label: 'Street Delivery Address *', type: 'text', placeholder: 'e.g. 5 John Street, Massallacin, Ilupeju', col: 2 },
                    { name: 'city', label: 'City / District *', type: 'text', placeholder: 'e.g. Ikeja / Lagos Island', col: 1 },
                  ].map((f) => (
                    <div key={f.name} className={f.col === 2 ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                        {f.label}
                      </label>
                      <input
                        name={f.name}
                        type={f.type}
                        required
                        placeholder={f.placeholder}
                        value={(form as Record<string, string>)[f.name]}
                        onChange={handleDeliveryChange}
                        className="w-full px-4 py-3 bg-[#faf8f5] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all font-medium"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Destination State *
                    </label>
                    <select
                      name="state"
                      required
                      value={form.state}
                      onChange={handleDeliveryChange}
                      className="w-full px-4 py-3 bg-[#faf8f5] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all font-medium"
                    >
                      <option value="">Select Destination State</option>
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#18181b] hover:bg-[#312e81] text-white font-bold py-4 rounded-2xl transition-all shadow-md text-sm uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    Proceed to Bank Payment <FiArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 2: Bank Transfer Details Card
            ══════════════════════════════════════════════════════════════════ */}
            {currentStep === 2 && (
              <div className="bg-gradient-to-br from-[#18181b] to-[#27272a] text-white rounded-3xl p-6 sm:p-8 shadow-md border border-white/10 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#d97706] text-black flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-white">
                      Make Your Bank Transfer
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#d97706] text-xs font-bold uppercase tracking-wider">
                    <FiCreditCard size={15} /> Official Account
                  </div>
                </div>

                {/* ⚡ 5-Minute Guarantee Banner */}
                <div className="bg-[#d97706]/15 border border-[#d97706]/35 rounded-2xl p-4 flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#d97706] text-black flex items-center justify-center font-black text-xs flex-shrink-0">
                    <FiClock size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#d97706]">
                      Fast Verification: Orders Confirmed in Under 5 Minutes
                    </p>
                    <p className="text-[11px] text-white/80 mt-0.5 leading-relaxed">
                      Please make the transfer to the official bank account below. We confirm all payments in under 5 minutes and immediately dispatch your official receipt!
                    </p>
                  </div>
                </div>

                {/* Amount to transfer highlight */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-white/50 font-bold">
                      Total Amount to Transfer
                    </p>
                    <p className="font-serif text-2xl sm:text-3xl font-extrabold text-[#d97706]">
                      ₦{total().toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(total().toString(), 'amount')}
                    className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedAmount ? <FiCheck className="text-emerald-400" /> : <FiCopy size={13} />}
                    <span>{copiedAmount ? 'Copied Amount' : 'Copy Amount'}</span>
                  </button>
                </div>

                {/* Account details grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Bank Name */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Bank Name</p>
                    <p className="font-serif text-xl font-bold text-white mt-1">LOTUS BANK</p>
                  </div>

                  {/* Account Name */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Account Name</p>
                    <p className="font-serif text-lg font-bold text-white mt-1">TUNMISEALADIRE_ASOOKE</p>
                  </div>

                  {/* Account Number with Copy Button */}
                  <div className="sm:col-span-2 bg-[#d97706]/10 border border-[#d97706]/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-[#d97706]">
                        Account Number (NUBAN)
                      </p>
                      <p className="font-mono text-3xl font-black text-white tracking-widest mt-0.5">
                        1009183129
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('1009183129', 'account')}
                      className="inline-flex items-center gap-2 bg-[#d97706] hover:bg-[#f59e0b] text-black px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0"
                    >
                      {copiedAccount ? (
                        <>
                          <FiCheck size={16} /> Copied!
                        </>
                      ) : (
                        <>
                          <FiCopy size={16} /> Copy Account
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Narration guidance */}
                <div className="flex items-start gap-2.5 text-xs text-white/70 bg-white/5 p-3.5 rounded-xl border border-white/5">
                  <FiInfo size={16} className="text-[#d97706] flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Transfer Narration:</strong> Please use your <strong>Full Name ({form.name || 'Your Name'})</strong> as the transaction remark/narration on your banking app.
                  </p>
                </div>

                {/* Navigation Buttons for Step 2 */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="sm:w-1/3 bg-white/10 hover:bg-white/20 text-white py-3.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FiArrowLeft size={14} /> Back to Address
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToStep3}
                    className="sm:w-2/3 bg-[#c2410c] hover:bg-[#ea580c] text-white py-4 px-6 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <FiCheckCircle size={18} /> I Have Sent The Payment &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                STEP 3: Payment Confirmation Form ("I Have Paid")
            ══════════════════════════════════════════════════════════════════ */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmitOrder} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-black/5 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#c2410c] text-white flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-[#18181b]">
                      Payment Confirmation Form (&ldquo;I Have Paid&rdquo;)
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Instant Atelier Alert
                  </span>
                </div>

                {/* 5-minute confirmation reminder */}
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3 text-amber-900">
                  <FiClock size={20} className="text-[#d97706] flex-shrink-0" />
                  <p className="text-xs leading-relaxed">
                    <strong>We confirm orders in under 5 minutes.</strong> Once submitted, our accounts team immediately validates the transfer and emails your receipt and tracking link to <strong>{form.email}</strong>.
                  </p>
                </div>

                {/* Pre-filled Order & Customization Summary Box */}
                <div className="bg-[#faf8f5] rounded-2xl p-4 sm:p-5 border border-black/5 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Pre-filled Pieces & Customizations to Confirm
                  </p>
                  <div className="divide-y divide-gray-200/60">
                    {items.map((item, i) => (
                      <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-[#18181b] truncate">{item.product.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Size: <span className="font-semibold text-gray-800">{item.selectedSize}</span> &bull; Color: <span className="font-semibold text-gray-800">{item.selectedColor.split('|')[0]}</span> &bull; Qty: {item.quantity}
                          </p>
                        </div>
                        <span className="font-bold text-[#c2410c] flex-shrink-0">
                          ₦{(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transfer inputs */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Sender Account Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Sender Account Name (Name on bank account used) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Babatunde Lawal"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#faf8f5] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all font-medium"
                    />
                  </div>

                  {/* Amount Transferred */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Amount Transferred (₦) *
                    </label>
                    <input
                      type="number"
                      required
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full px-4 py-3 bg-[#faf8f5] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all font-bold text-[#c2410c]"
                    />
                  </div>

                  {/* Sending Bank Dropdown */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Bank Transferred From *
                    </label>
                    <select
                      required
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                      className="w-full px-4 py-3 bg-[#faf8f5] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all font-medium"
                    >
                      <option value="">Select your bank</option>
                      {POPULAR_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Specific Bank name if 'Other Bank' */}
                  {senderBank === 'Other Bank' ? (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                        Specify Bank Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Providus Bank / Taj Bank"
                        value={otherBank}
                        onChange={(e) => setOtherBank(e.target.value)}
                        className="w-full px-4 py-3 bg-[#faf8f5] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all font-medium"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                        Transaction Reference / Narration (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Session ID or bank narration"
                        value={transferReference}
                        onChange={(e) => setTransferReference(e.target.value)}
                        className="w-full px-4 py-3 bg-[#faf8f5] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all font-medium"
                      />
                    </div>
                  )}

                  {/* Additional notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Additional Notes / Transfer Remarks (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Transferred via mobile app at 2:30 PM."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#faf8f5] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Action Buttons for Step 3 */}
                <div className="pt-3 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="sm:w-1/3 bg-gray-100 hover:bg-gray-200 text-[#18181b] py-3.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FiArrowLeft size={14} /> Back to Bank Details
                  </button>

                  <button
                    type="submit"
                    disabled={loading || items.length === 0}
                    className="sm:w-2/3 bg-[#18181b] hover:bg-[#312e81] text-white font-bold py-4 rounded-2xl transition-all shadow-md disabled:opacity-50 text-sm uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        Submitting Confirmation...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle size={17} /> I Have Paid &bull; Submit Order
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400">
                  By clicking submit, our admin is alerted immediately to confirm your transfer and queue your garments for tailoring.
                </p>
              </form>
            )}

          </div>

          {/* Right Column: Order Summary Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 sticky top-28 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-serif text-base font-bold text-[#18181b]">Order Summary</h3>
                <span className="text-xs font-semibold text-gray-400">
                  {items.length} {items.length === 1 ? 'piece' : 'pieces'}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  <p>Your bag is empty.</p>
                  <Link href="/products" className="text-[#c2410c] font-bold text-xs uppercase underline mt-2 inline-block">
                    Browse Collections
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="space-y-3.5 max-h-80 overflow-y-auto pr-1 divide-y divide-gray-50">
                    {items.map((item, i) => (
                      <li key={i} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#18181b] truncate">{item.product.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Size: {item.selectedSize} &bull; Color: {item.selectedColor.split('|')[0]} &times; {item.quantity}
                          </p>
                        </div>
                        <span className="font-bold text-[#18181b] flex-shrink-0">
                          ₦{(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Subtotal</span>
                      <span className="font-semibold text-[#18181b]">₦{total().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Delivery Fee</span>
                      <span className="text-emerald-600 font-bold uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded">
                        Calculated at Fulfilment
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-base font-bold text-[#18181b]">
                      <span>Total Amount Payable</span>
                      <span className="text-xl font-black text-[#c2410c]">
                        ₦{total().toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 5-minute promise in summary box */}
                  <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/60 space-y-1">
                    <div className="flex items-center gap-2 text-[#c2410c] font-bold text-xs uppercase tracking-wider">
                      <FiClock size={14} /> Under 5 Mins Confirmation
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      We manually verify all bank transfers in under 5 minutes to fast-track your atelier production.
                    </p>
                  </div>

                  <div className="bg-[#faf8f5] p-3 rounded-2xl border border-black/5 flex items-center gap-2.5 text-xs text-gray-600">
                    <FiShield size={16} className="text-[#c2410c] flex-shrink-0" />
                    <span>Direct atelier transfer with manual verification guarantees order security.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
