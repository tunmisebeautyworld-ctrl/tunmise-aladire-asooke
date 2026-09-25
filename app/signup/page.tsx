'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signup(email, password, name);
      toast.success('Welcome to Tunmise Aladire Asooke! 🎉');
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Account created! Welcome 🎉');
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
            <h2 className="font-serif text-2xl text-brand-indigo">Create Account</h2>
            <p className="text-brand-indigo/50 mt-1 text-sm">Join the Tunmise community</p>
          </div>

          <button
            onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 border-2 border-brand-indigo/10 hover:border-brand-gold rounded-xl py-3 mb-6 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <FcGoogle size={20} /> Continue with Google
          </button>

          <div className="relative text-center mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-indigo/10" /></div>
            <span className="relative bg-white px-4 text-xs text-brand-indigo/40">or create with email</span>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="relative">
              <FiUser size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-indigo/40" />
              <input
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full pl-11 pr-4 py-3 border-2 border-brand-indigo/10 rounded-xl text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div className="relative">
              <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-indigo/40" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-11 pr-4 py-3 border-2 border-brand-indigo/10 rounded-xl text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div className="relative">
              <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-indigo/40" />
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 6 characters)"
                className="w-full pl-11 pr-4 py-3 border-2 border-brand-indigo/10 rounded-xl text-sm focus:outline-none focus:border-brand-gold"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-indigo hover:bg-brand-indigo-light text-brand-cream font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-brand-indigo/50 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-gold hover:text-brand-gold-light font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
