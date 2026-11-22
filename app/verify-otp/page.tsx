'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Suspense } from 'react';

function VerifyOtpContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const stored = localStorage.getItem(`tunmise_otp_${email}`);
      if (!stored) {
        toast.error('Verification code expired. Please request a new one.');
        return;
      }
      const { code: savedCode, expires } = JSON.parse(stored);
      if (Date.now() > expires) {
        localStorage.removeItem(`tunmise_otp_${email}`);
        toast.error('Code expired. Please request a new one.');
        return;
      }
      if (code !== savedCode) {
        toast.error('Incorrect code. Please check your email and try again.');
        return;
      }
      localStorage.removeItem(`tunmise_otp_${email}`);
      localStorage.setItem(`tunmise_verified_${email}`, 'true');
      toast.success('Email verified! Welcome to Tunmise Aladire Asooke.');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem(`tunmise_otp_${email}`, JSON.stringify({
        code: newOtp,
        expires: Date.now() + 10 * 60 * 1000,
      }));
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'otp_verification', email, otp: newOtp }),
      });
      toast.success('New code sent to your email.');
    } catch {
      toast.error('Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

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

          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-[#c2410c]/10 flex items-center justify-center mx-auto mb-4">
              <FiShield size={28} className="text-[#c2410c]" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#18181b]">Verify Your Email</h2>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              We sent a 6-digit code to<br />
              <strong className="text-[#18181b]">{email || 'your email address'}</strong>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-3 text-center">
                Enter Verification Code
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-black bg-[#faf8f5] border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all text-[#18181b]"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-[#18181b] hover:bg-[#27272a] text-[#faf8f5] font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>Verifying...</span></>
              ) : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-2">
            <p className="text-xs text-gray-400">Did not receive the code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm font-bold text-[#c2410c] hover:text-[#ea580c] cursor-pointer disabled:opacity-50 transition-colors"
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-[#18181b]/60 hover:text-[#18181b] transition-colors underline underline-offset-4">
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpContent />
    </Suspense>
  );
}
