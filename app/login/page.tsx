'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      if (email.toLowerCase().includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Subtle Editorial Ambient Glow */}
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

        {/* Auth Editorial Card */}
        <div className="bg-white rounded-3xl shadow-xl p-7 sm:p-9 border border-black/5 relative overflow-hidden">
          {/* Subtle top terracotta accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c2410c] to-[#ea580c]" />

          <div className="text-center mb-7">
            <h2 className="font-serif text-2xl font-bold text-[#18181b]">Welcome Back</h2>
            <p className="text-gray-500 mt-1 text-xs sm:text-sm">Sign in to your member account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <FiMail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#faf8f5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all text-[#18181b] placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  Password
                </label>
              </div>
              <div className="relative">
                <FiLock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3.5 bg-[#faf8f5] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all text-[#18181b] placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPw ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#18181b] hover:bg-[#27272a] text-[#faf8f5] font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-50 text-xs sm:text-sm uppercase tracking-widest mt-2 flex items-center justify-center gap-2 btn-shimmer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              Do not have an account?{' '}
              <Link href="/signup" className="text-[#c2410c] hover:text-[#ea580c] font-bold underline underline-offset-4 ml-1">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Back to store navigation */}
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-[#18181b]/60 hover:text-[#18181b] transition-colors underline underline-offset-4">
            ← Return to storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
