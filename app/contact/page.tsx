'use client';

import { useState } from 'react';
import { createCustomerMessage } from '@/lib/firestore';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  FiMail,
  FiPhone,
  FiUser,
  FiInfo,
  FiMessageSquare,
  FiSend,
  FiArrowLeft,
  FiMapPin,
  FiClock,
  FiCheckCircle,
} from 'react-icons/fi';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await createCustomerMessage({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message,
        type: 'general',
        status: 'unread',
      });
      toast.success('Inquiry submitted successfully! We will get back to you soon. ✨');
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient px-4 py-12 text-[#1e1b4b]">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#fefce8]/70 hover:text-[#d97706] transition-colors mb-6 text-sm"
        >
          <FiArrowLeft size={16} /> Back to storefront
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Physical Studio & Hours Info Card */}
          <div className="lg:col-span-5 bg-[#1e1b4b] text-[#fefce8] rounded-3xl p-8 shadow-2xl border border-[#d97706]/30 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <FiCheckCircle size={13} className="text-emerald-400" /> We are Open!!
                </span>
              </div>

              <div>
                <h1 className="font-serif text-3xl font-bold text-[#d97706]">
                  Tunmise Aladire
                </h1>
                <p className="text-xs uppercase tracking-[0.25em] text-[#fefce8]/60 font-semibold mt-1">
                  Asooke Fashion Studio
                </p>
                <p className="text-sm text-[#fefce8]/80 mt-3 leading-relaxed">
                  Visit our physical atelier for fabric consultations, custom fittings, and ready-to-wear pieces, or reach us online.
                </p>
              </div>

              {/* Physical Address */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-[#d97706] text-xs font-bold uppercase tracking-wider">
                  <FiMapPin size={15} /> Physical Store & Studio
                </div>
                <p className="text-sm font-semibold text-white leading-snug">
                  Shop FF29 & K-KLAMP 7&8
                  <br />
                  <span className="text-xs text-[#fefce8]/70 font-normal">
                    (Upstairs & Downstairs)
                  </span>
                </p>
                <p className="text-xs text-[#fefce8]/80 leading-relaxed">
                  LKJ BUSINESS HUB, NYSC BUS STOP, IGANDO, LAGOS, NIGERIA.
                </p>
              </div>

              {/* Business Hours */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-[#d97706] text-xs font-bold uppercase tracking-wider">
                  <FiClock size={15} /> Business Hours
                </div>
                <p className="text-sm font-semibold text-white">
                  9:00 AM – 7:00 PM
                </p>
                <p className="text-xs text-[#fefce8]/75">
                  Monday – Saturday
                </p>
                <div className="pt-1">
                  <span className="inline-block bg-[#d97706]/20 text-[#d97706] text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-[#d97706]/30">
                    Online & Walk-In
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 text-xs text-[#fefce8]/50">
              Every stitch handcrafted with love in Lagos.
            </div>
          </div>

          {/* Right: Message Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl shadow-2xl p-8 border border-[#d97706]/10 flex flex-col justify-center">
            <div className="mb-6">
              <h2 className="font-serif text-2xl text-brand-indigo font-bold">
                Send Us a Message
              </h2>
              <p className="text-brand-indigo/50 mt-1 text-sm">
                Have a question or custom design request? Let us know!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="relative">
                <FiUser size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-indigo/40" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full Name *"
                  className="w-full pl-11 pr-4 py-3 border-2 border-brand-indigo/10 rounded-xl text-sm focus:outline-none focus:border-brand-gold bg-gray-50/50"
                />
              </div>

              {/* Email Address */}
              <div className="relative">
                <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-indigo/40" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email Address *"
                  className="w-full pl-11 pr-4 py-3 border-2 border-brand-indigo/10 rounded-xl text-sm focus:outline-none focus:border-brand-gold bg-gray-50/50"
                />
              </div>

              {/* Phone Number */}
              <div className="relative">
                <FiPhone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-indigo/40" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone Number (e.g. +234...)"
                  className="w-full pl-11 pr-4 py-3 border-2 border-brand-indigo/10 rounded-xl text-sm focus:outline-none focus:border-brand-gold bg-gray-50/50"
                />
              </div>

              {/* Subject */}
              <div className="relative">
                <FiInfo size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-indigo/40" />
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Subject (e.g. Coral Beads / Custom Set) *"
                  className="w-full pl-11 pr-4 py-3 border-2 border-brand-indigo/10 rounded-xl text-sm focus:outline-none focus:border-brand-gold bg-gray-50/50"
                />
              </div>

              {/* Message Body */}
              <div className="relative">
                <FiMessageSquare size={16} className="absolute left-4 top-4 text-brand-indigo/40" />
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="How can we help you? *"
                  className="w-full pl-11 pr-4 py-3 border-2 border-brand-indigo/10 rounded-xl text-sm focus:outline-none focus:border-brand-gold resize-none bg-gray-50/50"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1e1b4b] hover:bg-[#312e81] text-[#fefce8] font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-[#fefce8] border-t-transparent rounded-full" />
                    Sending Message...
                  </>
                ) : (
                  <>
                    <FiSend size={15} /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
