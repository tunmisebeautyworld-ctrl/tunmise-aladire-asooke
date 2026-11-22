'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile, isFirebaseConfigured } from '@/lib/firestore';
import type { UserProfile } from '@/types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (customEmail?: string, customName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check local session first (ensures admin access persists across reloads)
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('tunmise_active_user');
        const storedProfile = localStorage.getItem('tunmise_active_profile');
        if (storedUser && storedProfile) {
          const u = JSON.parse(storedUser);
          const p = JSON.parse(storedProfile);
          if (p?.role === 'admin') {
            setUser(u);
            setProfile(p);
            setLoading(false);
          }
        }
      } catch {
        // ignore
      }
    }

    if (!isFirebaseConfigured()) {
      const timer = setTimeout(() => {
        try {
          const storedUser = localStorage.getItem('tunmise_active_user');
          const storedProfile = localStorage.getItem('tunmise_active_profile');
          if (storedUser && storedProfile) {
            setUser(JSON.parse(storedUser));
            setProfile(JSON.parse(storedProfile));
          }
        } catch {
          // ignore corrupted local storage
        } finally {
          setLoading(false);
        }
      }, 0);
      return () => clearTimeout(timer);
    }

    // ─── Production Firebase Auth ───
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const p = await getUserProfile(u.uid);
        setProfile(p);
        setLoading(false);
      } else {
        // If not logged in via Firebase Auth, retain active admin session if present
        let hasAdminSession = false;
        if (typeof window !== 'undefined') {
          try {
            const storedProfile = localStorage.getItem('tunmise_active_profile');
            if (storedProfile) {
              const p = JSON.parse(storedProfile);
              if (p?.role === 'admin') {
                hasAdminSession = true;
              }
            }
          } catch {}
        }
        if (!hasAdminSession) {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!password) {
      throw new Error('Please enter your password');
    }

    // 1. Direct Store Administrator Master Authentication
    // Admin credentials ALWAYS grant immediate access regardless of Firebase Auth state
    if (cleanEmail === 'tunmisebeautyworld@gmail.com') {
      if (password !== 'TUNMISE2026') {
        throw new Error('Incorrect password. Please verify your admin password.');
      }

      const adminUser = {
        uid: 'admin_tunmise_aladire',
        email: 'tunmisebeautyworld@gmail.com',
        displayName: 'Tunmise Aladire',
      } as User;

      const adminProfile: UserProfile = {
        uid: adminUser.uid,
        email: 'tunmisebeautyworld@gmail.com',
        displayName: 'Tunmise Aladire',
        role: 'admin',
        createdAt: new Date(),
      };

      setUser(adminUser);
      setProfile(adminProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('tunmise_active_user', JSON.stringify(adminUser));
        localStorage.setItem('tunmise_active_profile', JSON.stringify(adminProfile));
      }

      // Sync with Firebase Auth in the background if enabled
      if (isFirebaseConfigured()) {
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, password);
        } catch {
          // Ignore Firebase Auth setup errors for master admin
        }
      }

      toast.success('Welcome back, Admin!');
      return;
    }

    // 2. Try Firebase Auth for customer login if configured
    if (isFirebaseConfigured()) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return;
      } catch (err: unknown) {
        const fbErr = err as { code?: string; message?: string };
        // Fall back gracefully if Email/Password provider has not been enabled in Firebase console yet
        if (
          fbErr.code === 'auth/configuration-not-found' ||
          fbErr.code === 'auth/admin-restricted-operation' ||
          fbErr.code === 'auth/user-not-found'
        ) {
          // Fall through to local accounts check
        } else {
          throw err;
        }
      }
    }

    // 3. Fallback: Registered Member / Customer Authentication
    let accounts: Array<{ name: string; email: string; pass: string; role: 'admin' | 'customer' }> = [];
    try {
      const saved = localStorage.getItem('tunmise_accounts');
      if (saved) accounts = JSON.parse(saved);
    } catch {
      accounts = [];
    }

    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (!existing) {
      throw new Error('No account found with this email. Please click "Create Account" below to register.');
    }

    if (existing.pass !== password) {
      throw new Error('Incorrect password. Please try again.');
    }

    const activeUser = {
      uid: 'usr_' + Math.random().toString(36).substring(2, 10),
      email: existing.email,
      displayName: existing.name,
    } as User;

    const userProfile: UserProfile = {
      uid: activeUser.uid,
      email: existing.email,
      displayName: existing.name,
      role: existing.role || 'customer',
      createdAt: new Date(),
    };

    setUser(activeUser);
    setProfile(userProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tunmise_active_user', JSON.stringify(activeUser));
      localStorage.setItem('tunmise_active_profile', JSON.stringify(userProfile));
    }

    toast.success(`Welcome back, ${existing.name}!`);
  };

  const signup = async (email: string, password: string, name: string) => {
    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    if (!name || name.trim().length === 0) {
      throw new Error('Please provide your full name');
    }

    // 1. Try Production Firebase Auth
    if (isFirebaseConfigured()) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await createUserProfile(cred.user.uid, { email, displayName: name, role: 'customer' });

        const prodOtp = Math.floor(100000 + Math.random() * 900000).toString();
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'otp_verification',
            name: name.trim(),
            email,
            otp: prodOtp,
          }),
        }).catch((e) => console.error('Welcome email error:', e));

        toast.success(`Account created! Welcome, ${name.trim()}!`);
        return;
      } catch (err: unknown) {
        const fbErr = err as { code?: string };
        if (
          fbErr.code !== 'auth/configuration-not-found' &&
          fbErr.code !== 'auth/admin-restricted-operation'
        ) {
          throw err;
        }
        // Fall back gracefully if Firebase Auth is not enabled in Firebase Console yet
      }
    }

    // 2. Fallback: Local Persistent Signup
    let accounts: Array<{ name: string; email: string; pass: string; role: 'admin' | 'customer' }> = [];
    try {
      const saved = localStorage.getItem('tunmise_accounts');
      if (saved) accounts = JSON.parse(saved);
    } catch {
      accounts = [];
    }

    if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists. Please sign in.');
    }

    const activeUser = {
      uid: 'usr_' + Math.random().toString(36).substring(2, 10),
      email,
      displayName: name.trim(),
    } as User;

    const userProfile: UserProfile = {
      uid: activeUser.uid,
      email,
      displayName: name.trim(),
      role: 'customer',
      createdAt: new Date(),
    };

    accounts.push({ name: name.trim(), email, pass: password, role: 'customer' });
    if (typeof window !== 'undefined') {
      localStorage.setItem('tunmise_accounts', JSON.stringify(accounts));
      localStorage.setItem('tunmise_active_user', JSON.stringify(activeUser));
      localStorage.setItem('tunmise_active_profile', JSON.stringify(userProfile));
    }

    setUser(activeUser);
    setProfile(userProfile);

    // Dispatch welcome & verification email
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'otp_verification',
        name: name.trim(),
        email,
        otp: verificationOtp,
      }),
    }).catch((e) => console.error('Welcome email error:', e));

    toast.success(`Account created! Welcome, ${name.trim()}!`);
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured()) {
      throw new Error('Google sign-in requires Firebase authentication to be configured. Please sign in with email and password.');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    const existing = await getUserProfile(cred.user.uid);
    if (!existing) {
      await createUserProfile(cred.user.uid, {
        email: cred.user.email || '',
        displayName: cred.user.displayName || 'Customer',
        role: 'customer',
      });
    }
  };

  const logout = async () => {
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tunmise_active_user');
      localStorage.removeItem('tunmise_active_profile');
    }
    if (isFirebaseConfigured()) {
      try {
        await signOut(auth);
      } catch {
        // ignore
      }
    }
    toast.success('Signed out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
