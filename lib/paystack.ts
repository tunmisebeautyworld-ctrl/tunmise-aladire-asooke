export const PAYSTACK_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_YOUR_PAYSTACK_PUBLIC_KEY';

/** Paystack uses kobo — multiply NGN by 100 */
export function formatAmount(amount: number): number {
  return Math.round(amount * 100);
}

export function generateRef(): string {
  return `TAA-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}
