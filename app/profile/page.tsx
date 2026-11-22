'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiUser,
  FiMail,
  FiLock,
  FiPackage,
  FiLogOut,
  FiShield,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiArrowRight,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#c2410c] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-black/5 space-y-4">
          <div className="w-14 h-14 bg-black/5 rounded-2xl flex items-center justify-center mx-auto text-[#18181b]">
            <FiUser size={24} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#18181b]">Member Sign In Required</h2>
          <p className="text-xs text-gray-500">
            Please sign in to view your profile and manage your orders.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full bg-[#18181b] hover:bg-[#312e81] text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl text-xs uppercase tracking-wider border border-gray-200 transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setUpdating(true);

    try {
      let accounts: Array<{ name: string; email: string; pass: string; role: 'admin' | 'customer' }> = [];
      try {
        const saved = localStorage.getItem('tunmise_accounts');
        if (saved) accounts = JSON.parse(saved);
      } catch {
        accounts = [];
      }

      const accountIdx = accounts.findIndex(
        (a) => a.email.toLowerCase() === (user.email || '').toLowerCase()
      );

      if (accountIdx !== -1) {
        if (accounts[accountIdx].pass !== currentPassword) {
          toast.error('Current password is incorrect');
          setUpdating(false);
          return;
        }
        accounts[accountIdx].pass = newPassword;
        localStorage.setItem('tunmise_accounts', JSON.stringify(accounts));
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.success('Password updated');
      }
    } catch {
      toast.error('Could not update password');
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#18181b]">Member Profile</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your personal credentials, contact info, and security
          </p>
        </div>

        {/* Profile Card & Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Member Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-black/5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#18181b] text-white flex items-center justify-center font-serif text-2xl font-bold flex-shrink-0">
                {(profile?.displayName || user.displayName || user.email || 'T').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-lg font-bold text-[#18181b] truncate">
                  {profile?.displayName || user.displayName || 'Valued Client'}
                </h2>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <FiCheckCircle size={10} /> Verified Member
                  </span>
                  {profile?.role === 'admin' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#c2410c] text-white">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
              <Link
                href="/orders"
                className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] hover:bg-gray-100 text-[#18181b] font-semibold transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FiPackage className="text-[#c2410c]" /> My Orders
                </span>
                <FiArrowRight size={13} className="text-gray-400" />
              </Link>

              <Link
                href="/track-order"
                className="flex items-center justify-between p-3 rounded-xl bg-[#faf8f5] hover:bg-gray-100 text-[#18181b] font-semibold transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FiShield className="text-[#c2410c]" /> Track Live Order
                </span>
                <FiArrowRight size={13} className="text-gray-400" />
              </Link>

              {profile?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#18181b] text-white font-bold transition-all"
                >
                  <span>Admin Atelier Dashboard</span>
                  <FiArrowRight size={13} />
                </Link>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700 py-3 rounded-xl border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <FiLogOut size={14} /> Sign Out
              </button>
            </div>
          </div>

          {/* Right Column (2 Cols): Change Password & Security */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-black/5 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2 text-[#c2410c]">
                <FiLock size={18} />
                <h3 className="font-serif text-lg font-bold text-[#18181b]">Security & Password</h3>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Update your account password to ensure your member details remain protected
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-11 pr-11 py-3 bg-[#faf8f5] border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all text-[#18181b]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-3 bg-[#faf8f5] border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all text-[#18181b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-4 py-3 bg-[#faf8f5] border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#c2410c] focus:bg-white transition-all text-[#18181b]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-[#18181b] hover:bg-[#312e81] text-white font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {updating ? 'Updating Password...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
