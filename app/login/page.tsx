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
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="font-serif text-brand-gold text-2xl">Tunmise Aladire</h1>
            <p className="text-brand-cream/50 text-xs tracking-widest uppercase">Asooke</p>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl text-brand-indigo">Welcome Back</h2>
            <p className="text-brand-indigo/50 mt-1 text-sm">Sign in to your account</p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border-2 border-brand-indigo/10 hover:border-brand-gold rounded-xl py-3 mb-6 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <FcGoogle size={20} /> Continue with Google
          </button>

          <div className="relative text-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-indigo/10" />
            </div>
            <span className="relative bg-white px-4 text-xs text-brand-indigo/40">or sign in with email</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-indigo/40" />
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-11 pr-4 py-3 border-2 border-brand-indigo/10 rounded-xl text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div className="relative">
              <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-indigo/40" />
              <input
                type={showPw ? 'text' : 'password'} required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-11 pr-11 py-3 border-2 border-brand-indigo/10 rounded-xl text-sm focus:outline-none focus:border-brand-gold"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-indigo/40"
              >
                {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-indigo hover:bg-brand-indigo-light text-brand-cream font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-brand-indigo/50 mt-6">
            No account?{' '}
            <Link href="/signup" className="text-brand-gold hover:text-brand-gold-light font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
