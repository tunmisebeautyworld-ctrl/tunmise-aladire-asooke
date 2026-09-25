import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Product, Order, UserProfile, CustomerMessage, StoreSettings } from '@/types';
import { DEMO_MESSAGES, DEMO_PRODUCTS } from './demoData';

export function isFirebaseConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return (
    apiKey !== undefined &&
    apiKey !== '' &&
    apiKey !== 'YOUR_API_KEY' &&
    apiKey !== 'your_firebase_api_key'
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  let dbProducts: Product[] = [];
  if (isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, 'products'));
      dbProducts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
    } catch {
      // Fallback if network fails
    }
  }
  const all = [...dbProducts];
  DEMO_PRODUCTS.forEach((dp) => {
    if (!all.some((ap) => ap.id === dp.id)) {
      all.push(dp);
    }
  });
  return all;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  let dbFeatured: Product[] = [];
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, 'products'), where('featured', '==', true));
      const snap = await getDocs(q);
      dbFeatured = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
    } catch {
      // Fallback if network fails
    }
  }
  const all = [...dbFeatured];
  DEMO_PRODUCTS.filter((p) => p.featured).forEach((dp) => {
    if (!all.some((ap) => ap.id === dp.id)) {
      all.push(dp);
    }
  });
  return all;
}

export async function getProductById(id: string): Promise<Product | null> {
  const demo = DEMO_PRODUCTS.find((x) => x.id === id);
  if (demo) return demo;
  if (!isFirebaseConfigured()) return null;
  try {
    const snap = await getDoc(doc(db, 'products', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Product;
  } catch {
    return null;
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  let dbCats: Product[] = [];
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, 'products'), where('category', '==', category));
      const snap = await getDocs(q);
      dbCats = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
    } catch {
      // Fallback
    }
  }
  const all = [...dbCats];
  DEMO_PRODUCTS.filter(
    (p) =>
      p.category === category ||
      (category === 'beads-and-accessories' &&
        (p.category === 'accessories' || (p.category as string) === 'beads-and-accessories'))
  ).forEach((dp) => {
    if (!all.some((ap) => ap.id === dp.id)) {
      all.push(dp);
    }
  });
  return all;
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'products'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, 'products', id), data as Record<string, unknown>);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(data: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
  let orderId = 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();

  if (isFirebaseConfigured()) {
    try {
      const ref = await addDoc(collection(db, 'orders'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      orderId = ref.id;
    } catch (e) {
      console.warn('Firebase order creation error, using fallback:', e);
    }
  }

  // Always persist locally in browser for offline/instant tracking and demo support
  if (typeof window !== 'undefined') {
    try {
      let orders: Order[] = [];
      const saved = localStorage.getItem('tunmise_orders');
      if (saved) orders = JSON.parse(saved);
      const newOrder: Order = {
        ...data,
        id: orderId,
        createdAt: new Date(),
      };
      orders.unshift(newOrder);
      localStorage.setItem('tunmise_orders', JSON.stringify(orders));
    } catch {
      // ignore
    }
  }

  return orderId;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const cleanId = orderId.trim().replace(/^#/, '');

  if (isFirebaseConfigured()) {
    try {
      const snap = await getDoc(doc(db, 'orders', cleanId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Order;
      }
    } catch {
      // ignore
    }
  }

  // Check local storage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('tunmise_orders');
      if (saved) {
        const localOrders: Order[] = JSON.parse(saved);
        const match = localOrders.find(
          (o) =>
            o.id.toLowerCase() === cleanId.toLowerCase() ||
            o.id.toLowerCase().startsWith(cleanId.toLowerCase()) ||
            cleanId.toLowerCase().includes(o.id.slice(0, 8).toLowerCase())
        );
        if (match) return match;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  let dbOrders: Order[] = [];
  if (isFirebaseConfigured()) {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      dbOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    } catch {
      // ignore
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('tunmise_orders');
      if (saved) {
        const localOrders: Order[] = JSON.parse(saved);
        localOrders
          .filter((o) => o.userId === userId || userId === 'guest')
          .forEach((lo) => {
            if (!dbOrders.some((dbo) => dbo.id === lo.id)) {
              dbOrders.push(lo);
            }
          });
      }
    } catch {
      // ignore
    }
  }

  return dbOrders;
}

export async function getAllOrders(): Promise<Order[]> {
  let dbOrders: Order[] = [];
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      dbOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    } catch {
      // ignore
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('tunmise_orders');
      if (saved) {
        const localOrders: Order[] = JSON.parse(saved);
        localOrders.forEach((lo) => {
          if (!dbOrders.some((dbo) => dbo.id === lo.id)) {
            dbOrders.push(lo);
          }
        });
      }
    } catch {
      // ignore
    }
  }

  return dbOrders;
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  notes?: string
): Promise<void> {
  if (isFirebaseConfigured()) {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        ...(notes ? { deliveryNotes: notes } : {}),
      });
    } catch (e) {
      console.warn('Firebase order update error:', e);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('tunmise_orders');
      if (saved) {
        const orders: Order[] = JSON.parse(saved);
        const updated = orders.map((o) =>
          o.id === orderId ? { ...o, status, ...(notes ? { deliveryNotes: notes } : {}) } : o
        );
        localStorage.setItem('tunmise_orders', JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, 'uid' | 'createdAt'>
): Promise<void> {
  await addDoc(collection(db, 'users'), {
    uid,
    ...data,
    role: 'customer',
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured()) return null;
  const q = query(collection(db, 'users'), where('uid', '==', uid));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
}

// ─── Customer Messages ─────────────────────────────────────────────────────────

export async function createCustomerMessage(
  data: Omit<CustomerMessage, 'id' | 'createdAt'>
): Promise<string> {
  if (!isFirebaseConfigured()) return 'demo-msg-' + Date.now();
  const ref = await addDoc(collection(db, 'messages'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getCustomerMessages(): Promise<CustomerMessage[]> {
  if (!isFirebaseConfigured()) return DEMO_MESSAGES;
  const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CustomerMessage));
}

export async function updateMessageStatus(
  id: string,
  status: CustomerMessage['status']
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await updateDoc(doc(db, 'messages', id), { status });
}

// ─── Store Settings ───────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: StoreSettings = {
  beadsAccessoriesStatus: 'coming_soon',
};

export async function getStoreSettings(): Promise<StoreSettings> {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('tunmise_store_settings');
    if (cached) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      } catch {}
    }
  }
  if (!isFirebaseConfigured()) return DEFAULT_SETTINGS;
  try {
    const snap = await getDoc(doc(db, 'settings', 'store'));
    if (snap.exists()) {
      const data = { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<StoreSettings>) };
      if (typeof window !== 'undefined') {
        localStorage.setItem('tunmise_store_settings', JSON.stringify(data));
      }
      return data;
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export async function updateStoreSettings(
  settings: Partial<StoreSettings>
): Promise<void> {
  if (typeof window !== 'undefined') {
    const current = await getStoreSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('tunmise_store_settings', JSON.stringify(updated));
    window.dispatchEvent(new Event('store_settings_updated'));
  }
  if (!isFirebaseConfigured()) return;
  try {
    await setDoc(doc(db, 'settings', 'store'), settings, { merge: true });
  } catch {}
}


