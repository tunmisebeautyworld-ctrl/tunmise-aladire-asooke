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
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ─── Demo Mode Auth Bypass ───
    if (!isFirebaseConfigured()) {
      const timer = setTimeout(() => {
        try {
          const storedUser = sessionStorage.getItem('demo_user');
          const storedProfile = sessionStorage.getItem('demo_profile');
          if (storedUser && storedProfile) {
            setUser(JSON.parse(storedUser));
            setProfile(JSON.parse(storedProfile));
          }
        } catch {
          // ignore corrupted session storage
        } finally {
          setLoading(false);
        }
      }, 0);
      return () => clearTimeout(timer);
    }

    // ─── Production Firebase Auth ───
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const p = await getUserProfile(u.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    // ─── Demo Mode Auth Bypass ───
    if (!isFirebaseConfigured()) {
      if (email.includes('@')) {
        const mockUser = { uid: 'demo-admin-uid', email } as User;
        const mockProfile = {
          uid: 'demo-admin-uid',
          email,
          displayName: 'Demo Administrator',
          role: email.toLowerCase().includes('admin') ? 'admin' : 'customer',
          createdAt: new Date(),
        } as UserProfile;
        
        setUser(mockUser);
        setProfile(mockProfile);
        sessionStorage.setItem('demo_user', JSON.stringify(mockUser));
        sessionStorage.setItem('demo_profile', JSON.stringify(mockProfile));
        toast.success(`Logged in as Demo ${mockProfile.role === 'admin' ? 'Admin' : 'Customer'}!`);
        return;
      }
      throw new Error('Please enter a valid email format for demo bypass');
    }

    // ─── Production Firebase Auth ───
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, name: string) => {
    // ─── Demo Mode Auth Bypass ───
    if (!isFirebaseConfigured()) {
      const mockUser = { uid: 'demo-user-uid', email } as User;
      const mockProfile = {
        uid: 'demo-user-uid',
        email,
        displayName: name,
        role: 'customer',
        createdAt: new Date(),
      } as UserProfile;

      setUser(mockUser);
      setProfile(mockProfile);
      sessionStorage.setItem('demo_user', JSON.stringify(mockUser));
      sessionStorage.setItem('demo_profile', JSON.stringify(mockProfile));
      toast.success('Demo account created successfully!');
      return;
    }

    // ─── Production Firebase Auth ───
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfile(cred.user.uid, { email, displayName: name, role: 'customer' });
  };

  const loginWithGoogle = async () => {
    // ─── Demo Mode Auth Bypass ───
    if (!isFirebaseConfigured()) {
      const mockUser = { uid: 'demo-google-uid', email: 'google-user@example.com' } as User;
      const mockProfile = {
        uid: 'demo-google-uid',
        email: 'google-user@example.com',
        displayName: 'Google Demo User',
        role: 'customer',
        createdAt: new Date(),
      } as UserProfile;

      setUser(mockUser);
      setProfile(mockProfile);
      sessionStorage.setItem('demo_user', JSON.stringify(mockUser));
      sessionStorage.setItem('demo_profile', JSON.stringify(mockProfile));
      toast.success('Logged in with Demo Google account!');
      return;
    }

    // ─── Production Firebase Auth ───
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const existing = await getUserProfile(cred.user.uid);
    if (!existing) {
      await createUserProfile(cred.user.uid, {
        email: cred.user.email || '',
        displayName: cred.user.displayName || '',
        role: 'customer',
      });
    }
  };

  const logout = async () => {
    // ─── Demo Mode Auth Bypass ───
    if (!isFirebaseConfigured()) {
      setUser(null);
      setProfile(null);
      sessionStorage.removeItem('demo_user');
      sessionStorage.removeItem('demo_profile');
      toast.success('Logged out successfully.');
      return;
    }

    // ─── Production Firebase Auth ───
    await signOut(auth);
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
