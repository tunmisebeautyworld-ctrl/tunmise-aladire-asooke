import { NextResponse } from 'next/server';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isFirebaseConfigured, parseFirestoreDate } from '@/lib/firestore';
import type { Order } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ orders: [] });
    }

    let snap;
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(collection(db, 'orders'));
    }

    const orders: Order[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: parseFirestoreDate(data.createdAt),
      } as Order;
    });

    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    console.error('[API ORDERS ERROR]', message);
    return NextResponse.json({ error: message, orders: [] }, { status: 500 });
  }
}
