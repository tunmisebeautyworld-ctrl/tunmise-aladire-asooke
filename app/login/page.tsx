'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
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

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Signed in with Google!');
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1b4b] relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Animated Ambient Luxury Lighting */}
      <div className="w-80 h-80 rounded-full bg-[#d97706]/20 blur-3xl absolute -top-10 -left-10 animate-float pointer-events-none" />
      <div className="w-96 h-96 rounded-full bg-[#c2410c]/20 blur-3xl absolute -bottom-10 -right-10 animate-pulse-glow pointer-events-none" />
      <div className="absolute inset-0 tie-dye-bg opacity-30 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <span className="text-[10px] tracking-[0.3em] text-[#d97706] uppercase font-bold block mb-1">
              Luxury Nigerian Fashion
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#fefce8] font-bold tracking-wider group-hover:text-[#d97706] transition-colors">
              Tunmise Aladire
            </h1>
            <span className="text-xs tracking-[0.4em] text-white/50 uppercase block mt-0.5">
              Asooke
            </span>
          </Link>
        </div>

        {/* Auth Glassmorphism Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-7 sm:p-9 border border-[#d97706]/25 relative overflow-hidden">
          {/* Subtle top gold accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d97706] via-[#c2410c] to-[#1e1b4b]" />

          <div className="text-center mb-7">
            <h2 className="font-serif text-2xl font-bold text-[#1e1b4b]">Welcome Back</h2>
            <p className="text-gray-500 mt-1 text-xs sm:text-sm">Sign in to your member account</p>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-[#d97706] rounded-xl py-3.5 px-4 mb-6 text-sm font-semibold text-gray-700 transition-all shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <FcGoogle size={22} className="flex-shrink-0" />
            <span>Continue with Google</span>
          </button>

          <div className="relative text-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              or sign in with email
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Email Address
              </label>
              <div className="relative">
                <FiMail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. tunmisebeautyworld@gmail.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d97706] focus:bg-white transition-all text-[#1e1b4b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Password
              </label>
              <div className="relative">
                <FiLock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 bg-gray-50/80 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d97706] focus:bg-white transition-all text-[#1e1b4b]"
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
              className="w-full bg-[#1e1b4b] hover:bg-[#312e81] text-[#fefce8] font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-50 text-sm uppercase tracking-wider mt-2 flex items-center justify-center gap-2"
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
          <Link href="/" className="text-xs text-white/70 hover:text-white transition-colors underline underline-offset-4">
            ← Return to storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
