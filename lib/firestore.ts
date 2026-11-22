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
import type { Product, Order, UserProfile, CustomerMessage, StoreSettings, BankDetails } from '@/types';
import { DEMO_MESSAGES, STORE_PRODUCTS } from './demoData';

export function isFirebaseConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBkc_F8XVYxD58UtIF4O6amVAxvR3wzvyA';
  return (
    apiKey !== undefined &&
    apiKey !== '' &&
    apiKey !== 'YOUR_API_KEY' &&
    apiKey !== 'your_firebase_api_key'
  );
}

export function parseFirestoreDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val === 'object' && val !== null) {
    if ('toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
      try {
        return (val as { toDate: () => Date }).toDate();
      } catch {
        // fallback
      }
    }
    if ('seconds' in val && typeof (val as { seconds: number }).seconds === 'number') {
      return new Date((val as { seconds: number }).seconds * 1000);
    }
  }
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function getDeletedProductIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem('tunmise_deleted_products');
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // fallback
  }
  return new Set();
}

export function markProductDeletedLocally(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const deleted = getDeletedProductIds();
    deleted.add(id);
    localStorage.setItem('tunmise_deleted_products', JSON.stringify(Array.from(deleted)));
  } catch {
    // fallback
  }
}

export async function getProducts(): Promise<Product[]> {
  const deletedIds = getDeletedProductIds();
  if (isFirebaseConfigured()) {
    try {
      const snap = await getDocs(collection(db, 'products'));
      const dbProducts = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Product))
        .filter((p) => !deletedIds.has(p.id));
      if (dbProducts.length > 0) {
        return dbProducts;
      }
    } catch (e) {
      console.warn('Could not read products from Firestore:', e);
    }
  }
  // Fallback only if Firestore is unreachable
  return STORE_PRODUCTS.filter((p) => !deletedIds.has(p.id));
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const deletedIds = getDeletedProductIds();
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, 'products'), where('featured', '==', true));
      const snap = await getDocs(q);
      const featured = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Product))
        .filter((p) => !deletedIds.has(p.id));
      if (featured.length > 0) return featured;
    } catch {
      // fallback
    }
  }
  return STORE_PRODUCTS.filter((p) => p.featured && !deletedIds.has(p.id));
}

export async function getProductById(id: string): Promise<Product | null> {
  const deletedIds = getDeletedProductIds();
  if (deletedIds.has(id)) return null;

  if (isFirebaseConfigured()) {
    try {
      let snap = await getDoc(doc(db, 'products', id));
      if (!snap.exists() && id.startsWith('demo-')) {
        const cleanId = id.replace(/^demo-/, '');
        if (!deletedIds.has(cleanId)) {
          snap = await getDoc(doc(db, 'products', cleanId));
        }
      }
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Product;
      }
    } catch {
      // fallback
    }
  }

  // Fallback to static catalog only if exists and not deleted
  const cleanId = id.replace(/^demo-/, '');
  const match = STORE_PRODUCTS.find((x) => (x.id === id || x.id === cleanId) && !deletedIds.has(x.id));
  return match || null;
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const deletedIds = getDeletedProductIds();
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, 'products'), where('category', '==', category));
      const snap = await getDocs(q);
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Product))
        .filter((p) => !deletedIds.has(p.id));
      if (items.length > 0) return items;
    } catch {
      // fallback
    }
  }
  return STORE_PRODUCTS.filter(
    (p) =>
      !deletedIds.has(p.id) &&
      (p.category === category ||
        (category === 'beads-and-accessories' &&
          (p.category === 'accessories' || (p.category as string) === 'beads-and-accessories')))
  );
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
  // If product has a name, create a clean slug-based or unique ID
  const cleanId = data.name
    ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : 'prod-' + Date.now();

  const ref = doc(db, 'products', cleanId);
  await setDoc(ref, {
    ...data,
    id: cleanId,
    createdAt: serverTimestamp(),
  });
  return cleanId;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, 'products', id), data as Record<string, unknown>);
}

export async function deleteProduct(id: string): Promise<void> {
  markProductDeletedLocally(id);
  if (isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      console.error('Failed to delete doc from Firestore:', e);
    }
  }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(data: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
  const orderId = 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();

  // Strip all undefined properties so Firestore never rejects the payload
  const cleanData = JSON.parse(JSON.stringify(data));

  if (isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, 'orders', orderId), {
        ...cleanData,
        id: orderId,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Firebase order creation error:', e);
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

export async function syncLocalOrdersToFirestore(): Promise<void> {
  if (typeof window === 'undefined' || !isFirebaseConfigured()) return;
  try {
    const saved = localStorage.getItem('tunmise_orders');
    if (!saved) return;
    const localOrders: Order[] = JSON.parse(saved);
    if (!Array.isArray(localOrders) || localOrders.length === 0) return;

    for (const order of localOrders) {
      if (order && order.id) {
        const cleanOrder = JSON.parse(JSON.stringify(order));
        await setDoc(
          doc(db, 'orders', order.id),
          {
            ...cleanOrder,
            id: order.id,
            createdAt: order.createdAt ? new Date(order.createdAt) : serverTimestamp(),
          },
          { merge: true }
        );
      }
    }
  } catch (e) {
    console.warn('Auto-sync local orders error:', e);
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const rawId = orderId.trim().replace(/^#/, '');
  const cleanId = rawId.toLowerCase();
  const normalizedWithPrefix = rawId.toUpperCase().startsWith('ORD-') ? rawId.toUpperCase() : `ORD-${rawId.toUpperCase()}`;

  if (isFirebaseConfigured()) {
    try {
      // 1. Try exact and upper-cased document ID
      let snap = await getDoc(doc(db, 'orders', rawId));
      if (!snap.exists()) {
        snap = await getDoc(doc(db, 'orders', rawId.toUpperCase()));
      }
      if (!snap.exists()) {
        snap = await getDoc(doc(db, 'orders', normalizedWithPrefix));
      }

      if (snap.exists()) {
        const data = snap.data();
        return {
          id: snap.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
        } as Order;
      }

      // 2. Try query by paystackRef or transferReference
      const qRef = query(collection(db, 'orders'), where('paystackRef', '==', rawId));
      const refSnap = await getDocs(qRef);
      if (!refSnap.empty) {
        const docSnap = refSnap.docs[0];
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
        } as Order;
      }
    } catch {
      // ignore network/firestore error and fall back to local storage
    }
  }

  // Check local storage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('tunmise_orders');
      if (saved) {
        const localOrders: Order[] = JSON.parse(saved);
        const match = localOrders.find(
          (o) => {
            const id = (o.id || '').toLowerCase();
            const pRef = (o.paystackRef || '').toLowerCase();
            const tRef = (o.paymentDetails?.transferReference || '').toLowerCase();
            return (
              id === cleanId ||
              id === normalizedWithPrefix.toLowerCase() ||
              id.replace(/^ord-/, '') === cleanId.replace(/^ord-/, '') ||
              (pRef && pRef === cleanId) ||
              (tRef && tRef === cleanId) ||
              id.startsWith(cleanId) ||
              cleanId.includes(id.slice(0, 8))
            );
          }
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
      let snap;
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        snap = await getDocs(q);
      } catch {
        const q = query(collection(db, 'orders'), where('userId', '==', userId));
        snap = await getDocs(q);
      }
      dbOrders = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
        } as Order;
      });
      dbOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
      let snap;
      try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
        snap = await getDocs(q);
      } catch {
        snap = await getDocs(collection(db, 'orders'));
      }
      dbOrders = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: parseFirestoreDate(data.createdAt),
        } as Order;
      });
      dbOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.warn('Firebase getAllOrders error:', e);
    }
  }

  // If client-side query was empty or blocked by network, query server API
  if (dbOrders.length === 0 && typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.orders) && json.orders.length > 0) {
          dbOrders = json.orders;
        }
      }
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
  try {
    let snap;
    try {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(collection(db, 'messages'));
    }
    const msgs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: parseFirestoreDate(data.createdAt),
      } as CustomerMessage;
    });
    msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return msgs;
  } catch {
    return DEMO_MESSAGES;
  }
}

export async function updateMessageStatus(
  id: string,
  status: CustomerMessage['status']
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  await updateDoc(doc(db, 'messages', id), { status });
}

// ─── Store Settings ───────────────────────────────────────────────────────────

export const DEFAULT_BANK_DETAILS: BankDetails = {
  bankName: process.env.NEXT_PUBLIC_BANK_NAME || 'LOTUS BANK',
  accountName: process.env.NEXT_PUBLIC_ACCOUNT_NAME || 'TUNMISEALADIRE_ASOOKE',
  accountNumber: process.env.NEXT_PUBLIC_ACCOUNT_NUMBER || '1009183129',
  instructions: 'Please transfer the exact order amount and use your Full Name as the transaction remark/narration. We confirm orders in under 5 minutes!',
};

const DEFAULT_SETTINGS: StoreSettings = {
  beadsAccessoriesStatus: 'coming_soon',
  bankDetails: DEFAULT_BANK_DETAILS,
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


