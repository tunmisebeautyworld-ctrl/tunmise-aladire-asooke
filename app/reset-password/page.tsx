'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
    inputs.current[0]?.focus();
  }, [initialEmail]);

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...otp];
    updated[index] = val.slice(-1);
    setOtp(updated);
    if (val && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('');

    if (enteredOtp.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Check stored reset OTP
      const stored = localStorage.getItem(`tunmise_reset_otp_${email}`);
      if (!stored) {
        toast.error('Reset request expired. Please request a new code.');
        return;
      }

      const { code: savedCode, expires } = JSON.parse(stored);
      if (Date.now() > expires) {
        localStorage.removeItem(`tunmise_reset_otp_${email}`);
        toast.error('Reset code has expired. Please request a new code.');
        return;
      }

      if (enteredOtp !== savedCode) {
        toast.error('Incorrect reset code. Please check your email.');
        return;
      }

      // Update password in local account store
      let accounts: Array<{ name: string; email: string; pass: string; role: 'admin' | 'customer' }> = [];
      try {
        const saved = localStorage.getItem('tunmise_accounts');
        if (saved) accounts = JSON.parse(saved);
      } catch {
        accounts = [];
      }

      const accountIdx = accounts.findIndex((a) => a.email.toLowerCase() === email.toLowerCase());
      if (accountIdx !== -1) {
        accounts[accountIdx].pass = newPassword;
        localStorage.setItem('tunmise_accounts', JSON.stringify(accounts));
      }

      // Clear the used reset OTP
      localStorage.removeItem(`tunmise_reset_otp_${email}`);

      setSuccess(true);
      toast.success('Password updated successfully!');
    } catch {
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-black/5 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <FiCheckCircle size={32} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#18181b]">Password Updated</h2>
          <p className="text-gray-500 text-sm">
            Your password has been changed. You can now sign in with your new credentials.
          </p>
          <Link
            href="/login"
            className="block w-full bg-[#18181b] hover:bg-[#312e81] text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-xs transition-all shadow-md mt-4"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="w-96 h-96 rounded-full bg-[#c2410c]/5 blur-3xl absolute -top-16 -left-16 pointer-events-none" />
      <div className="w-96 h-96 rounded-full bg-black/5 blur-3xl absolute -bottom-16 -right-16 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <span className="text-[10px] tracking-[0.3em] text-[#c2410c] uppercase font-bold block mb-1">
              Luxury Nigerian Fashion
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#18181b] font-bold tracking-wider group-hover:text-[#c2410c] transition-colors">
              Tunmise Aladire
            </h1>
            <span className="text-xs tracking-[0.4em] text-[#18181b]/50 uppercase block mt-0.5">
              Asooke
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-9 border border-black/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c2410c] to-[#ea580c]" />

          <div className="text-center mb-6">
            <h2 className="font-serif text-2xl font-bold text-[#18181b]">Set New Password</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Enter the 6-digit code sent to <strong className="text-[#18181b]">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* 6-Digit Code */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 text-center">
                Verification Code
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-13 text-center text-lg font-black bg-[#faf8f5] border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#c2410c] focus:bg-white text-[#18181b] transition-all"
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <FiLock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 bg-[#faf8f5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all text-[#18181b]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <FiLock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#faf8f5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all text-[#18181b]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-[#18181b] hover:bg-[#27272a] text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 text-xs sm:text-sm uppercase tracking-widest mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                'Save New Password'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <Link href="/login" className="text-xs text-[#c2410c] hover:underline font-bold">
              ← Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
