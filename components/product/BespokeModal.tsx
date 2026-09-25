'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { createCustomerMessage } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import type { Product } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function BespokeModal({ isOpen, onClose, product }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    bust: '',
    waist: '',
    hips: '',
    height: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.bust.trim() || !form.waist.trim() || !form.hips.trim() || !form.height.trim()) {
      toast.error('Please fill in all required sizes and details');
      return;
    }
    setLoading(true);
    try {
      await createCustomerMessage({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: `Bespoke Request: ${product.name}`,
        message: `Bespoke body measurements submitted for ${product.name}. Special Requests: ${form.notes || 'None'}`,
        type: 'custom_measurement',
        measurements: {
          bust: form.bust,
          waist: form.waist,
          hips: form.hips,
          height: form.height,
          additionalDetails: form.notes,
        },
        status: 'unread',
      });
      toast.success('Measurements submitted! Our tailoring team will contact you shortly.');
      setForm({
        name: '',
        email: '',
        phone: '',
        bust: '',
        waist: '',
        hips: '',
        height: '',
        notes: '',
      });
      onClose();
    } catch {
      toast.error('Failed to submit sizes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg p-6 border border-[#d97706]/10">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5">
                  <div>
                    <Dialog.Title as="h3" className="font-serif text-xl font-bold text-brand-indigo">
                      Custom Body Measurements
                    </Dialog.Title>
                    <p className="text-xs text-brand-indigo/50 font-medium">Bespoke sizing for: {product.name}</p>
                  </div>
                  <button onClick={onClose} aria-label="Close modal" className="text-gray-400 hover:text-brand-indigo p-1 cursor-pointer">
                    <FiX size={20} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-brand-indigo/60 uppercase mb-1">Your Name</label>
                      <input
                        type="text" required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Name"
                        className="w-full px-3 py-2 border-2 border-brand-indigo/10 rounded-xl focus:outline-none focus:border-brand-gold bg-gray-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-indigo/60 uppercase mb-1">Email</label>
                      <input
                        type="email" required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="Email Address"
                        className="w-full px-3 py-2 border-2 border-brand-indigo/10 rounded-xl focus:outline-none focus:border-brand-gold bg-gray-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-indigo/60 uppercase mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="e.g. +234..."
                      className="w-full px-3 py-2 border-2 border-brand-indigo/10 rounded-xl focus:outline-none focus:border-brand-gold bg-gray-50/50"
                    />
                  </div>

                  {/* Measurements sizes row */}
                  <div className="bg-[#1e1b4b]/5 p-4 rounded-2xl border border-[#1e1b4b]/5 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-terracotta">
                      Body Dimensions (inches / cm)
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bust / Chest *</label>
                        <input
                          type="text" required placeholder="e.g. 34 inches"
                          value={form.bust}
                          onChange={(e) => setForm({ ...form, bust: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-gold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Waist *</label>
                        <input
                          type="text" required placeholder="e.g. 28 inches"
                          value={form.waist}
                          onChange={(e) => setForm({ ...form, waist: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-gold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hips *</label>
                        <input
                          type="text" required placeholder="e.g. 38 inches"
                          value={form.hips}
                          onChange={(e) => setForm({ ...form, hips: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-gold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Total Height *</label>
                        <input
                          type="text" required placeholder="e.g. 5ft 6in or 168cm"
                          value={form.height}
                          onChange={(e) => setForm({ ...form, height: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-gold bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-indigo/60 uppercase mb-1">Styling Requests or Notes</label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="e.g. Add 2 inches to sleeve length, high neckline request..."
                      className="w-full px-3 py-2 border-2 border-brand-indigo/10 rounded-xl focus:outline-none focus:border-brand-gold resize-none bg-gray-50/50"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-[#1e1b4b] hover:bg-[#312e81] text-[#fefce8] font-bold py-3 rounded-xl transition-all shadow active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Submitting...' : 'Submit Measurements'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
