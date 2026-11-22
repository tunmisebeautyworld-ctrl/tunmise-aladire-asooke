'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      // Generate OTP and store with 10-min expiry
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem(`tunmise_reset_otp_${email}`, JSON.stringify({
        code: otp,
        expires: Date.now() + 10 * 60 * 1000,
      }));

      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'forgot_password', email, otp }),
      });

      setSent(true);
      toast.success('Reset code sent to your email');
    } catch {
      toast.error('Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block group">
              <span className="text-[10px] tracking-[0.3em] text-[#c2410c] uppercase font-bold block mb-1">Luxury Nigerian Fashion</span>
              <h1 className="font-serif text-3xl text-[#18181b] font-bold tracking-wider group-hover:text-[#c2410c] transition-colors">Tunmise Aladire</h1>
              <span className="text-xs tracking-[0.4em] text-[#18181b]/50 uppercase block mt-0.5">Asooke</span>
            </Link>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-9 border border-black/5 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c2410c] to-[#ea580c]" />
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <FiMail size={28} className="text-emerald-600" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#18181b] mb-2">Check Your Email</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              We sent a 6-digit reset code to<br />
              <strong className="text-[#18181b]">{email}</strong>.<br />
              It expires in 10 minutes.
            </p>
            <button
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="w-full bg-[#18181b] hover:bg-[#27272a] text-[#faf8f5] font-bold py-3.5 rounded-xl transition-all shadow-md cursor-pointer text-xs uppercase tracking-widest"
            >
              Enter Reset Code
            </button>
            <button
              onClick={() => setSent(false)}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="w-96 h-96 rounded-full bg-[#c2410c]/5 blur-3xl absolute -top-16 -left-16 pointer-events-none" />
      <div className="w-96 h-96 rounded-full bg-black/5 blur-3xl absolute -bottom-16 -right-16 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <span className="text-[10px] tracking-[0.3em] text-[#c2410c] uppercase font-bold block mb-1">Luxury Nigerian Fashion</span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#18181b] font-bold tracking-wider group-hover:text-[#c2410c] transition-colors">Tunmise Aladire</h1>
            <span className="text-xs tracking-[0.4em] text-[#18181b]/50 uppercase block mt-0.5">Asooke</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-7 sm:p-9 border border-black/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c2410c] to-[#ea580c]" />

          <div className="mb-7">
            <h2 className="font-serif text-2xl font-bold text-[#18181b]">Forgot Password</h2>
            <p className="text-gray-500 mt-1 text-sm">Enter your email and we will send you a reset code.</p>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">Email Address</label>
              <div className="relative">
                <FiMail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. name@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#faf8f5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all text-[#18181b] placeholder-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#18181b] hover:bg-[#27272a] text-[#faf8f5] font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 text-xs sm:text-sm uppercase tracking-widest mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Sending...</span></>
              ) : 'Send Reset Code'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[#c2410c] hover:text-[#ea580c] font-bold transition-colors">
              <FiArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
