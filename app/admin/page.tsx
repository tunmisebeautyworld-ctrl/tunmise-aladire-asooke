'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  getProducts,
  getAllOrders,
  deleteProduct,
  updateOrderStatus,
  updateProduct,
  getCustomerMessages,
  updateMessageStatus,
  getStoreSettings,
  updateStoreSettings,
  DEFAULT_BANK_DETAILS,
  syncLocalOrdersToFirestore,
} from '@/lib/firestore';
import { sendEmailBroadcast } from '@/lib/email';
import type { Product, Order, CustomerMessage, StoreSettings, BankDetails } from '@/types';
import Link from 'next/link';
import {
  FiPackage,
  FiShoppingBag,
  FiDollarSign,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiArrowLeft,
  FiMail,
  FiAlertTriangle,
  FiMessageSquare,
  FiSend,
  FiMinus,
  FiExternalLink,
  FiTruck,
  FiCheckCircle,
  FiCreditCard,
  FiRefreshCw,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUS_OPTIONS: Order['status'][] = ['pending', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
  in_production: 'bg-amber-100 text-amber-800 border border-amber-200',
  shipped: 'bg-purple-100 text-purple-800 border border-purple-200',
  delivered: 'bg-green-100 text-green-800 border border-green-200',
  cancelled: 'bg-red-100 text-red-800 border border-red-200',
};

const MSG_STATUS_COLORS: Record<string, string> = {
  unread: 'bg-red-100 text-red-800 border border-red-200',
  read: 'bg-blue-100 text-blue-800 border border-blue-200',
  replied: 'bg-green-100 text-green-800 border border-green-200',
};

type Tab = 'overview' | 'products' | 'orders' | 'communications';

export default function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<CustomerMessage[]>([]);

  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Orders filters state
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Messages state
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessage | null>(null);

  // Email broadcast form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailImage, setEmailImage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Store Settings (Category Launch Controls & Bank Details)
  const [settings, setSettings] = useState<StoreSettings>({
    beadsAccessoriesStatus: 'coming_soon',
    bankDetails: DEFAULT_BANK_DETAILS,
  });
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [bankForm, setBankForm] = useState<BankDetails>(DEFAULT_BANK_DETAILS);
  const [savingBank, setSavingBank] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (profile && profile.role !== 'admin') {
        router.push('/');
        return;
      }
    }
  }, [user, profile, authLoading, router]);

  const fetchDashboardData = async (showToast = false) => {
    try {
      setRefreshing(true);
      await syncLocalOrdersToFirestore();
      const [p, o, m, s] = await Promise.all([
        getProducts(),
        getAllOrders(),
        getCustomerMessages(),
        getStoreSettings(),
      ]);
      setProducts(p);
      setOrders(o);
      setMessages(m);
      if (s) {
        setSettings(s);
        if (s.bankDetails) setBankForm(s.bankDetails);
      }
      if (m.length > 0) setSelectedMessage(m[0]);
      if (showToast) {
        toast.success('Dashboard synced with latest data');
      }
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchDashboardData(false);
    }
  }, [profile]);

  // Clear orders for client fresh start
  const handleClearOrders = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tunmise_orders');
    }
    setOrders([]);
    toast.success('Orders cleared to 0. Ready for client handover.');
  };

  // Handle Toggle Beads & Accessories Launch Status
  const handleToggleBeadsStatus = async () => {
    const nextStatus = settings.beadsAccessoriesStatus === 'coming_soon' ? 'active' : 'coming_soon';
    setUpdatingSettings(true);
    try {
      await updateStoreSettings({ beadsAccessoriesStatus: nextStatus });
      setSettings((prev) => ({ ...prev, beadsAccessoriesStatus: nextStatus }));
      toast.success(
        nextStatus === 'active'
          ? 'Beads & Accessories is now LIVE on the store!'
          : 'Beads & Accessories is now set to COMING SOON.'
      );
    } catch {
      toast.error('Failed to update category status');
    } finally {
      setUpdatingSettings(false);
    }
  };

  // Handle Save Bank Account Details
  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      await updateStoreSettings({ bankDetails: bankForm });
      setSettings((prev) => ({ ...prev, bankDetails: bankForm }));
      toast.success('Official bank account details saved! Checkout page will now display these details.');
    } catch {
      toast.error('Failed to update bank details');
    } finally {
      setSavingBank(false);
    }
  };

  // Handle Confirm Bank Transfer Payment & Dispatch Receipt to Customer
  const handleConfirmBankPayment = async (order: Order) => {
    setUpdatingOrderId(order.id);
    try {
      const notes = orderNotes[order.id] ?? order.deliveryNotes ?? 'Bank transfer verified by store admin';
      await updateOrderStatus(order.id, 'confirmed', notes);

      const updatedOrder: Order = {
        ...order,
        status: 'confirmed',
        deliveryNotes: notes,
      };

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? updatedOrder : o))
      );

      // Automatically dispatch full official itemized receipt to customer email
      if (order.customerInfo?.email) {
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order_confirmation',
            order: updatedOrder,
          }),
        }).catch((err) => console.error('Failed to dispatch receipt email:', err));

        toast.success(`Payment verified! Official itemized receipt emailed to ${order.customerInfo.email}`);
      } else {
        toast.success('Order status updated to confirmed');
      }
    } catch {
      toast.error('Failed to confirm payment');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action is permanent.`)) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  // Quick Stock Adjustment
  const handleAdjustStock = async (productId: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      // Update local state first
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
      );
      // Call background update
      await updateProduct(productId, { stock: newStock });
      toast.success('Stock adjusted');
    } catch {
      toast.error('Failed to adjust stock');
    }
  };

  // Handle Order Status Change & Automatic Customer Notification
  const handleStatusChange = async (orderId: string, status: Order['status'], customNotes?: string) => {
    setUpdatingOrderId(orderId);
    try {
      const targetOrder = orders.find((o) => o.id === orderId);
      const notes = customNotes !== undefined ? customNotes : (orderNotes[orderId] ?? targetOrder?.deliveryNotes ?? '');

      await updateOrderStatus(orderId, status, notes);

      const updatedOrder: Order | null = targetOrder
        ? { ...targetOrder, status, ...(notes ? { deliveryNotes: notes } : {}) }
        : null;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status, ...(notes ? { deliveryNotes: notes } : {}) } : o))
      );

      // Trigger automatic transactional status email to customer
      if (updatedOrder && updatedOrder.customerInfo?.email) {
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order_status_update',
            order: updatedOrder,
            notes: notes || undefined,
          }),
        }).catch((err) => console.error('Failed to dispatch status email:', err));

        toast.success(`Status updated to "${status.replace('_', ' ')}" & email dispatched to customer!`);
      } else {
        toast.success(`Order status updated to ${status.replace('_', ' ')}`);
      }
    } catch {
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle message status updates
  const handleMessageStatus = async (msgId: string, status: CustomerMessage['status']) => {
    try {
      await updateMessageStatus(msgId, status);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, status } : m))
      );
      if (selectedMessage && selectedMessage.id === msgId) {
        setSelectedMessage((prev) => (prev ? { ...prev, status } : null));
      }
      toast.success(`Inquiry marked as ${status}`);
    } catch {
      toast.error('Failed to update inquiry status');
    }
  };

  // Handle Email Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error('Subject and Body are required');
      return;
    }
    setSendingBroadcast(true);
    try {
      const res = await sendEmailBroadcast(
        emailSubject,
        emailBody,
        emailImage ? [emailImage.trim()] : []
      );
      if (res.success) {
        toast.success(`Email blast dispatched to ${res.recipientCount} subscribers!`);
        setEmailSubject('');
        setEmailBody('');
        setEmailImage('');
      }
    } catch {
      toast.error('Failed to send broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Calculations for overview stats
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total, 0);

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  ).length;

  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const unreadMsgCount = messages.filter((m) => m.status === 'unread').length;

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  if (authLoading || (loading && profile?.role === 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fefce8]/30">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#d97706] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#1e1b4b]/50 text-sm font-semibold">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-[#18181b]">
      {/* Admin Header - Sticky, mobile-optimized */}
      <div className="bg-[#18181b] text-[#fefce8] px-4 sm:px-6 py-3.5 sm:py-5 flex items-center justify-between border-b border-white/10 shadow-sm sticky top-0 z-30">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <h1 className="font-serif text-lg sm:text-2xl font-bold tracking-wide text-white">
              Admin Atelier
            </h1>
          </div>
          <p className="text-[10px] sm:text-xs text-[#fefce8]/60 uppercase tracking-widest mt-0.5">
            Tunmise Aladire Asooke
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Refresh dashboard data and new orders"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="font-semibold">{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-[#fefce8]/80 hover:text-[#d97706] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
          >
            <FiArrowLeft size={14} /> <span className="hidden xs:inline sm:inline">Storefront</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Navigation Tabs - Horizontally scrollable touch pills on mobile */}
        <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200">
          {(['overview', 'products', 'orders', 'communications'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all cursor-pointer whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
                tab === t
                  ? 'bg-[#18181b] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <span>{t}</span>
              {t === 'orders' && orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-[#18181b]">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
              {t === 'communications' && unreadMsgCount > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#c2410c] text-white">
                  {unreadMsgCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content: Overview ── */}
        {tab === 'overview' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* Stat Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
              <StatCard
                icon={<FiDollarSign size={20} />}
                label="Total Revenue"
                value={`₦${totalRevenue.toLocaleString()}`}
                color="bg-emerald-600 text-white"
              />
              <StatCard
                icon={<FiShoppingBag size={20} />}
                label="Active Orders"
                value={activeOrdersCount.toString()}
                color="bg-[#c2410c] text-white"
              />
              <StatCard
                icon={<FiPackage size={20} />}
                label="Total Products"
                value={products.length.toString()}
                color="bg-[#18181b] text-white"
              />
              <StatCard
                icon={<FiAlertTriangle size={20} />}
                label="Low Stock"
                value={lowStockCount.toString()}
                color={lowStockCount > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-400 text-white'}
              />
              <StatCard
                icon={<FiMessageSquare size={20} />}
                label="Messages"
                value={unreadMsgCount.toString()}
                color={unreadMsgCount > 0 ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}
              />
            </div>

            {/* Category Launch Controls: Beads & Accessories */}
            <div className="bg-gradient-to-r from-[#18181b] to-[#312e81] text-white rounded-2xl p-4 sm:p-6 shadow-md border border-[#d97706]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#d97706]">
                    Category Launch Control: Beads & Accessories
                  </h3>
                  <span
                    className={`text-[10px] sm:text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                      settings.beadsAccessoriesStatus === 'active'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-400 text-[#18181b]'
                    }`}
                  >
                    {settings.beadsAccessoriesStatus === 'active' ? 'Live & Open' : 'Coming Soon'}
                  </span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  {settings.beadsAccessoriesStatus === 'active'
                    ? 'The Beads & Accessories collection is OPEN to all customers.'
                    : 'The collection is LOCKED in Coming Soon mode with waitlist signup.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleBeadsStatus}
                disabled={updatingSettings}
                className={`w-full sm:w-auto px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 disabled:opacity-50 ${
                  settings.beadsAccessoriesStatus === 'active'
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    : 'bg-[#d97706] hover:bg-[#f59e0b] text-[#18181b]'
                }`}
              >
                {updatingSettings ? (
                  <>
                    <div className="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
                    Updating...
                  </>
                ) : settings.beadsAccessoriesStatus === 'active' ? (
                  'Revert to Coming Soon'
                ) : (
                  'Open to Public (Launch Now)'
                )}
              </button>
            </div>

            {/* Bank Account Settings: Official Transfer Account */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Section Header */}
              <div className="px-6 py-4 bg-[#faf8f5] border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#c2410c]/10 flex items-center justify-center flex-shrink-0">
                  <FiCreditCard className="text-[#c2410c]" size={18} />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#18181b]">Store Receiving Account</h3>
                  <p className="text-xs text-gray-400 mt-0.5">These details are shown to customers at checkout and in confirmation emails.</p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Live Preview Card */}
                <div className="lg:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Customer Preview</p>
                  <div className="rounded-2xl bg-gradient-to-br from-[#18181b] to-[#312e81] p-5 text-white shadow-md">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-4">Transfer To This Account</p>
                    <p className="font-mono text-3xl font-black tracking-wider text-white">{bankForm.accountNumber || '— — — — — — — —'}</p>
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-0.5">
                      <p className="font-bold text-sm text-white">{bankForm.accountName || 'Account Name'}</p>
                      <p className="text-xs text-white/60 font-semibold uppercase tracking-wide">{bankForm.bankName || 'Bank Name'}</p>
                    </div>
                    {bankForm.instructions && (
                      <p className="mt-3 text-[10px] text-white/50 italic leading-relaxed">{bankForm.instructions}</p>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleSaveBankDetails} className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm((b) => ({ ...b, bankName: e.target.value }))}
                      placeholder="e.g. LOTUS BANK"
                      className="w-full text-sm p-3 bg-[#faf8f5] border border-gray-200 rounded-xl focus:outline-none focus:border-[#d97706] focus:bg-white font-semibold transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Account Number</label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm((b) => ({ ...b, accountNumber: e.target.value }))}
                      placeholder="e.g. 1009183129"
                      className="w-full text-sm px-3.5 py-3 bg-[#faf8f5] border border-gray-200 rounded-xl focus:outline-none focus:border-[#d97706] focus:bg-white font-mono font-bold tracking-wide transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Account Name</label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountName}
                      onChange={(e) => setBankForm((b) => ({ ...b, accountName: e.target.value }))}
                      placeholder="e.g. TUNMISEALADIRE_ASOOKE"
                      className="w-full text-sm p-3 bg-[#faf8f5] border border-gray-200 rounded-xl focus:outline-none focus:border-[#d97706] focus:bg-white font-semibold transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Transfer Instructions (shown to customers)</label>
                    <input
                      type="text"
                      value={bankForm.instructions || ''}
                      onChange={(e) => setBankForm((b) => ({ ...b, instructions: e.target.value }))}
                      placeholder="e.g. Use your Full Name as narration. We confirm in under 5 minutes."
                      className="w-full text-sm p-3 bg-[#faf8f5] border border-gray-200 rounded-xl focus:outline-none focus:border-[#d97706] focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingBank}
                      className="bg-[#18181b] hover:bg-[#312e81] text-white text-xs font-bold py-3 px-6 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingBank ? (
                        <>
                          <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                          Saving...
                        </>
                      ) : (
                        'Save Bank Account Details'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Split Dashboard widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Recent Orders */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                  <h3 className="font-serif text-lg font-bold text-[#1e1b4b]">Recent Orders</h3>
                  <button onClick={() => setTab('orders')} className="text-xs font-bold text-[#d97706] hover:underline">
                    View All Orders
                  </button>
                </div>
                <div className="divide-y divide-gray-100 space-y-4">
                  {orders.slice(0, 3).map((o) => (
                    <div key={o.id} className="flex justify-between items-center pt-3 first:pt-0">
                      <div>
                        <p className="text-sm font-semibold text-[#1e1b4b]">{o.customerInfo?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {o.items.length} items &bull; {new Date(o.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="font-bold text-sm text-[#c2410c]">₦{o.total.toLocaleString()}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${STATUS_COLORS[o.status]}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">No orders yet.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Inventory Stock Warnings */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                  <h3 className="font-serif text-lg font-bold text-[#1e1b4b]">Low Stock Alert</h3>
                  <button onClick={() => setTab('products')} className="text-xs font-bold text-[#d97706] hover:underline">
                    Manage Stock
                  </button>
                </div>
                <div className="space-y-3.5">
                  {products.filter((p) => p.stock <= 5).slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1e1b4b] truncate">{p.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{p.category}</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-xl border border-red-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        <span className="text-xs font-bold text-red-700">{p.stock} left</span>
                      </div>
                    </div>
                  ))}
                  {products.filter((p) => p.stock <= 5).length === 0 && (
                    <p className="text-sm text-green-600 text-center py-6 font-medium">All stock levels healthy.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content: Products & Inventory (Quick Stock Editor) ── */}
        {tab === 'products' && (
          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 sm:mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#18181b] font-serif">Products Catalog</h2>
                <p className="text-xs text-gray-500">Track listings, pricing, and make quick stock adjustments</p>
              </div>
              <Link
                href="/admin/products/new"
                className="flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#312e81] text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all"
              >
                <FiPlus size={16} /> Add New Product
              </Link>
            </div>

            {/* Mobile View: Product Cards (shown on mobile, hidden on tablet/desktop) */}
            <div className="block md:hidden space-y-3">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-16 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative flex-shrink-0">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#18181b] to-[#c2410c]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/products/${p.id}`} target="_blank" className="font-bold text-sm text-[#18181b] hover:text-[#c2410c] line-clamp-1">
                          {p.name}
                        </Link>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0 ${p.featured ? 'bg-[#d97706]/15 text-[#d97706]' : 'bg-gray-100 text-gray-400'}`}>
                          {p.featured ? 'Featured' : 'Regular'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">
                        {p.category === 'beads-and-accessories' ? 'Beads & Accessories' : p.category}
                      </p>
                      <p className="text-xs font-black text-[#c2410c] mt-1">₦{p.price.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Mobile Stock + Action Controls */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
                    <div className="flex items-center gap-1.5 bg-[#faf8f5] p-1 rounded-xl border border-gray-200">
                      <span className="text-[10px] uppercase font-bold text-gray-400 px-1">Stock:</span>
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(p.id, p.stock - 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#18181b] active:scale-95 transition-transform"
                      >
                        <FiMinus size={12} />
                      </button>
                      <span className="w-8 text-center font-bold text-xs">{p.stock}</span>
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(p.id, p.stock + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#18181b] active:scale-95 transition-transform"
                      >
                        <FiPlus size={12} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:text-[#18181b] text-xs font-bold flex items-center gap-1"
                      >
                        <FiEdit size={13} /> Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 text-xs transition-colors"
                        title="Delete Listing"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Product Table (hidden on mobile, visible on md+) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#18181b]/5 text-[#18181b]/60 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Item details</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4 text-center">Quick Stock Adjust</th>
                      <th className="px-6 py-4 text-center">Featured</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#18181b]">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-14 bg-gray-100 rounded-lg overflow-hidden border relative flex-shrink-0">
                              {p.images?.[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#18181b] to-[#c2410c]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{p.name}</p>
                              <span className="text-[10px] text-gray-400 font-mono">ID: {p.id.slice(0, 10)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize font-medium text-gray-500">
                          {p.category === 'beads-and-accessories' ? 'Beads & Accessories' : p.category}
                        </td>
                        <td className="px-6 py-4 text-[#c2410c] font-bold">₦{p.price.toLocaleString()}</td>
                        
                        {/* Quick Stock Controls */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p.id, p.stock - 1)}
                              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-[#18181b] hover:border-[#c2410c] hover:text-[#c2410c] transition-colors cursor-pointer"
                            >
                              <FiMinus size={13} />
                            </button>
                            <input
                              type="number"
                              value={p.stock}
                              onChange={(e) => handleAdjustStock(p.id, Number(e.target.value))}
                              className="w-14 text-center py-1 border border-gray-200 rounded-lg font-bold text-sm bg-gray-50"
                            />
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p.id, p.stock + 1)}
                              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-[#18181b] hover:border-[#c2410c] hover:text-[#c2410c] transition-colors cursor-pointer"
                            >
                              <FiPlus size={13} />
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${p.featured ? 'bg-[#d97706]/15 text-[#d97706]' : 'text-gray-300'}`}>
                            {p.featured ? 'Featured' : 'No'}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-3 justify-end">
                            <Link
                              href={`/admin/products/${p.id}/edit`}
                              className="text-gray-400 hover:text-[#d97706] p-1.5 transition-colors"
                              title="Edit Details"
                            >
                              <FiEdit size={16} />
                            </Link>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="text-gray-400 hover:text-red-600 p-1.5 transition-colors cursor-pointer"
                              title="Delete Listing"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {products.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border">
                <p className="text-gray-400">No products found in the catalog.</p>
                <Link href="/admin/products/new" className="mt-3 inline-block text-[#d97706] hover:underline font-bold text-sm">
                  Create First Product &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Tab Content: Orders (Filters & Cards Layout) ── */}
        {tab === 'orders' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-serif font-bold text-[#18181b]">Customer Orders</h2>
                  <button
                    type="button"
                    onClick={() => fetchDashboardData(true)}
                    disabled={refreshing}
                    className="p-1.5 text-gray-400 hover:text-[#c2410c] hover:bg-orange-50 rounded-lg border border-gray-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Refresh orders list"
                  >
                    <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#c2410c]' : ''}`} />
                  </button>
                  {orders.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearOrders}
                      className="px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 transition-all cursor-pointer"
                      title="Clear test orders so client starts fresh"
                    >
                      Clear Orders to 0
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Status updates automatically email the customer.</p>
              </div>
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'all', label: 'All', count: orders.length },
                  { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
                  { key: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
                  { key: 'in_production', label: 'Packaged / Ready', count: orders.filter(o => o.status === 'in_production').length },
                  { key: 'shipped', label: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
                  { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
                  { key: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setOrderFilter(key)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                      orderFilter === key
                        ? 'bg-[#18181b] text-white shadow-sm'
                        : 'bg-white text-gray-500 border border-gray-200 hover:border-[#18181b] hover:text-[#18181b]'
                    }`}
                  >
                    {label}
                    {count > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${orderFilter === key ? 'bg-white/20' : 'bg-gray-100'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Feed */}
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* ── Card Header ── */}
                  <div className={`px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 ${
                    order.status === 'pending' ? 'bg-amber-50/60' : 'bg-[#faf8f5]'
                  }`}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs font-black text-[#18181b] bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                        #{order.id.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      {/* Payment method badge */}
                      {order.paymentMethod === 'bank_transfer' ? (
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                          order.status === 'pending'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          <FiCreditCard size={10} />
                          {order.status === 'pending' ? 'Bank Transfer — Awaiting Verification' : 'Bank Transfer — Verified'}
                        </span>
                      ) : order.paystackRef ? (
                        <span className="text-[10px] text-gray-400 font-mono bg-white border border-gray-200 px-2 py-0.5 rounded">
                          Paystack: {order.paystackRef}
                        </span>
                      ) : null}
                      {/* Status pill */}
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${STATUS_COLORS[order.status]}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <Link
                      href={`/track-order?orderId=${order.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#c2410c] hover:text-[#ea580c] transition-colors"
                    >
                      <FiExternalLink size={12} /> Track Order
                    </Link>
                  </div>

                  {/* ── Card Body ── */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-5 gap-6">

                    {/* Col 1-2: Customer Info */}
                    <div className="md:col-span-2 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</p>
                      <div>
                        <p className="font-bold text-sm text-[#18181b]">{order.customerInfo?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{order.customerInfo?.email}</p>
                        <p className="text-xs text-gray-500">Phone: {order.customerInfo?.phone}</p>
                        {order.customerInfo?.whatsapp && (
                          <p className="text-xs text-emerald-700 font-semibold">WhatsApp: {order.customerInfo.whatsapp}</p>
                        )}
                      </div>
                      <div className="bg-[#faf8f5] rounded-xl px-3 py-2 border border-black/5 text-xs text-gray-600 leading-relaxed">
                        {order.customerInfo?.address},<br />
                        {order.customerInfo?.city}, {order.customerInfo?.state}
                      </div>

                      {/* Bank Transfer Proof (if applicable) */}
                      {order.paymentMethod === 'bank_transfer' && (
                        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 space-y-1.5 text-xs">
                          <p className="font-black text-[10px] uppercase tracking-widest text-amber-800 flex items-center gap-1">
                            <FiCreditCard size={11} /> Transfer Details Submitted
                          </p>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Sender</span>
                              <strong className="text-[#18181b]">{order.paymentDetails?.senderName || order.customerInfo?.name}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Amount</span>
                              <strong className="text-[#c2410c]">₦{(order.paymentDetails?.amountPaid || order.total).toLocaleString()}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Bank</span>
                              <strong className="text-[#18181b]">{order.paymentDetails?.senderBank || 'Direct Transfer'}</strong>
                            </div>
                            {(order.paymentDetails?.transferReference) && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Ref</span>
                                <code className="font-mono text-[#18181b]">{order.paymentDetails.transferReference}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Col 3: Items Ordered */}
                    <div className="md:col-span-2 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Items Ordered</p>
                      <div className="divide-y divide-gray-100">
                        {order.items.map((item, i) => (
                          <div key={i} className="py-2.5 first:pt-0">
                            <div className="flex items-start gap-2.5">
                              {/* Product Image */}
                              <div className="w-10 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                {item.product.images?.[0] ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#18181b] to-[#c2410c]" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                {/* Clickable product name that links to the product page */}
                                <Link
                                  href={`/products/${item.product.id}`}
                                  target="_blank"
                                  className="font-semibold text-xs text-[#18181b] hover:text-[#c2410c] transition-colors flex items-center gap-1 group"
                                >
                                  <span className="truncate">{item.product.name}</span>
                                  <FiExternalLink size={10} className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                                </Link>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  Qty: <strong className="text-[#18181b]">{item.quantity}</strong>
                                  {' '}&bull; Size: <strong className="text-[#18181b]">{item.selectedSize}</strong>
                                  {' '}&bull; Colour: <strong className="text-[#18181b]">{item.selectedColor.split('|')[0]}</strong>
                                </p>
                                <p className="text-xs font-bold text-[#c2410c] mt-0.5">
                                  ₦{(item.product.price * item.quantity).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-semibold">Order Total</span>
                        <span className="font-black text-sm text-[#c2410c]">₦{order.total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Col 5: Status Controls */}
                    <div className="md:col-span-1 flex flex-col gap-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</p>

                      {/* 1-Click Confirm Bank Payment */}
                      {order.status === 'pending' && (
                        <button
                          type="button"
                          disabled={updatingOrderId === order.id}
                          onClick={() => handleConfirmBankPayment(order)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                        >
                          {updatingOrderId === order.id ? (
                            <>
                              <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                              Confirming...
                            </>
                          ) : (
                            <>
                              <FiCheckCircle size={13} /> Confirm Payment
                            </>
                          )}
                        </button>
                      )}

                      {/* Status Dropdown */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                          Update Status
                        </label>
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                          className={`w-full text-xs px-3 py-2 rounded-xl font-bold border focus:outline-none focus:ring-1 focus:ring-[#d97706] cursor-pointer ${STATUS_COLORS[order.status]}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s === 'in_production' ? 'packaged (ready for dispatch)' : s.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Courier Notes */}
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                          Courier Notes
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. GIG Logistics #29182"
                          value={orderNotes[order.id] !== undefined ? orderNotes[order.id] : order.deliveryNotes || ''}
                          onChange={(e) => setOrderNotes((prev) => ({ ...prev, [order.id]: e.target.value }))}
                          className="w-full text-xs p-2 bg-[#faf8f5] border border-gray-200 rounded-lg focus:outline-none focus:border-[#d97706] resize-none"
                        />
                      </div>

                      {/* Update Button */}
                      <button
                        type="button"
                        disabled={updatingOrderId === order.id}
                        onClick={() =>
                          handleStatusChange(
                            order.id,
                            order.status,
                            orderNotes[order.id] !== undefined ? orderNotes[order.id] : order.deliveryNotes || ''
                          )
                        }
                        className="w-full bg-[#18181b] hover:bg-[#312e81] text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {updatingOrderId === order.id ? (
                          <>
                            <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FiTruck size={12} /> Save & Notify
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                  <FiPackage size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-500">
                    {orderFilter === 'all' ? 'No customer orders yet' : 'No orders matching this filter'}
                  </p>
                  {orderFilter === 'all' && (
                    <p className="text-xs text-gray-400 mt-1">Ready for client launch. Fresh orders will appear here automatically.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab Content: Communications (Bespoke Inquiries & Brevo Email Broadcast) ── */}
        {tab === 'communications' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-[#1e1b4b] font-serif">Customer Communications</h2>
              <p className="text-xs text-gray-500">Manage custom tailor measurements, inbox messages, and dispatch newsletter email blasts</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Inbox Feed */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-serif text-lg font-bold border-b border-gray-100 pb-3 mb-4">
                    Bespoke Inquiries & Messages ({messages.length})
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Feed List */}
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {messages.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMessage(m)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                            selectedMessage?.id === m.id
                              ? 'bg-[#fefce8] border-[#d97706] shadow-sm'
                              : 'bg-white border-gray-100 hover:border-[#1e1b4b]/20'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm truncate">{m.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${MSG_STATUS_COLORS[m.status]}`}>
                              {m.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#c2410c]">{m.subject}</p>
                          <span className="text-[10px] text-gray-400">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </button>
                      ))}
                      {messages.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-10">No inquiries yet.</p>
                      )}
                    </div>

                    {/* View Inquiry Details card */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200/60 flex flex-col justify-between">
                      {selectedMessage ? (
                        <div className="space-y-4 flex-1">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                selectedMessage.type === 'custom_measurement' ? 'bg-[#c2410c] text-white'
                                : selectedMessage.type === 'bespoke_inquiry' ? 'bg-[#d97706] text-white'
                                : 'bg-[#1e1b4b] text-white'
                              }`}>
                                {selectedMessage.type.replace('_', ' ')}
                              </span>
                            </div>
                            <h4 className="font-serif text-lg font-bold mt-2 text-[#1e1b4b]">{selectedMessage.subject}</h4>
                            <p className="text-xs text-gray-500 font-semibold">{selectedMessage.name} &bull; {selectedMessage.email}</p>
                            {selectedMessage.phone && <p className="text-xs text-gray-400">{selectedMessage.phone}</p>}
                          </div>

                          <div className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100 italic leading-relaxed">
                            &ldquo;{selectedMessage.message}&rdquo;
                          </div>

                          {/* Bespoke Custom Measurements Grid */}
                          {selectedMessage.type === 'custom_measurement' && selectedMessage.measurements && (
                            <div className="bg-[#1e1b4b]/5 p-3 rounded-xl border border-[#1e1b4b]/5">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#c2410c] mb-2">
                                Body Measurements Supplied
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-[#1e1b4b]">
                                <div>Bust: <span className="font-bold">{selectedMessage.measurements.bust || 'N/A'}</span></div>
                                <div>Waist: <span className="font-bold">{selectedMessage.measurements.waist || 'N/A'}</span></div>
                                <div>Hips: <span className="font-bold">{selectedMessage.measurements.hips || 'N/A'}</span></div>
                                <div>Height: <span className="font-bold">{selectedMessage.measurements.height || 'N/A'}</span></div>
                              </div>
                              {selectedMessage.measurements.additionalDetails && (
                                <p className="text-[10px] text-gray-500 mt-2 italic">
                                  Notes: {selectedMessage.measurements.additionalDetails}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="flex gap-2 pt-4 border-t border-gray-200">
                            {selectedMessage.status !== 'read' && (
                              <button
                                onClick={() => handleMessageStatus(selectedMessage.id, 'read')}
                                className="flex-1 py-2 text-xs font-bold border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 cursor-pointer"
                              >
                                Mark as Read
                              </button>
                            )}
                            {selectedMessage.status !== 'replied' && (
                              <button
                                onClick={() => handleMessageStatus(selectedMessage.id, 'replied')}
                                className="flex-1 py-2 text-xs font-bold bg-[#1e1b4b] hover:bg-[#312e81] text-[#fefce8] rounded-lg cursor-pointer"
                              >
                                Mark as Replied
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-20 text-gray-400">
                          Select an inquiry to view details.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Brevo Marketing Email Blast */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                    <FiMail size={20} className="text-[#c2410c]" />
                    <h3 className="font-serif text-lg font-bold text-[#1e1b4b]">Email Broadcast</h3>
                  </div>

                  <form onSubmit={handleSendBroadcast} className="space-y-4 text-sm text-[#1e1b4b]">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. The New Terracotta Adire Drop is Live!"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#d97706]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Header Image URL (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="https://example.com/banner.jpg"
                        value={emailImage}
                        onChange={(e) => setEmailImage(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#d97706]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Email Body (Announcements / Drop details)
                      </label>
                      <textarea
                        required
                        rows={6}
                        placeholder="Hello family! The wait is over. Our handwoven metallic gold Asooke sets and tie-dye crepe co-ords have been restocked. Shop now before they fly out..."
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#d97706] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingBroadcast}
                      className="w-full bg-[#c2410c] hover:bg-[#ea580c] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow cursor-pointer disabled:opacity-50"
                    >
                      {sendingBroadcast ? (
                        <>
                          <div className="animate-spin w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full" />
                          Broadcasting via Brevo...
                        </>
                      ) : (
                        <>
                          <FiSend size={15} /> Send Email Blast
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-sm border border-gray-100 flex items-center gap-2.5 sm:gap-4">
      <div className={`${color} p-2 sm:p-3 rounded-xl flex items-center justify-center flex-shrink-0 text-sm sm:text-base`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-wider truncate">{label}</p>
        <p className="text-sm sm:text-xl font-bold text-[#18181b] mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}
