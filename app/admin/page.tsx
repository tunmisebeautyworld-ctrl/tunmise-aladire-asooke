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
} from '@/lib/firestore';
import { sendEmailBroadcast } from '@/lib/email';
import type { Product, Order, CustomerMessage, StoreSettings } from '@/types';
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
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUS_OPTIONS: Order['status'][] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
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

  // Orders filters state
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Messages state
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessage | null>(null);

  // Email broadcast form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailImage, setEmailImage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Store Settings (Category Launch Controls)
  const [settings, setSettings] = useState<StoreSettings>({ beadsAccessoriesStatus: 'coming_soon' });
  const [updatingSettings, setUpdatingSettings] = useState(false);

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

  useEffect(() => {
    if (profile?.role === 'admin') {
      Promise.all([getProducts(), getAllOrders(), getCustomerMessages(), getStoreSettings()])
        .then(([p, o, m, s]) => {
          setProducts(p);
          setOrders(o);
          setMessages(m);
          if (s) setSettings(s);
          if (m.length > 0) setSelectedMessage(m[0]);
        })
        .catch(() => {
          toast.error('Failed to load dashboard data');
        })
        .finally(() => setLoading(false));
    }
  }, [profile]);

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

  // Handle Order Status Change
  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      toast.success(`Order status updated to ${status}`);
    } catch {
      toast.error('Failed to update order status');
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
    <div className="min-h-screen bg-gray-50 text-[#1e1b4b]">
      {/* Admin Header */}
      <div className="bg-[#1e1b4b] text-[#fefce8] px-6 py-5 flex items-center justify-between border-b border-[#d97706]/20 shadow-md">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-[#d97706]">
            Admin Dashboard
          </h1>
          <p className="text-xs text-[#fefce8]/60 uppercase tracking-widest mt-0.5">
            Tunmise Aladire Asooke
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[#fefce8]/70 hover:text-[#d97706] transition-colors"
        >
          <FiArrowLeft size={16} /> Back to Storefront
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 mb-8 border-b border-gray-200">
          {(['overview', 'products', 'orders', 'communications'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3.5 text-sm font-bold capitalize border-b-2 transition-all -mb-px cursor-pointer ${
                tab === t
                  ? 'border-[#d97706] text-[#d97706]'
                  : 'border-transparent text-gray-500 hover:text-[#1e1b4b]'
              }`}
            >
              {t === 'communications' ? `Communications (${unreadMsgCount})` : t}
            </button>
          ))}
        </div>

        {/* ── Tab Content: Overview ── */}
        {tab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stat Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                icon={<FiDollarSign size={22} />}
                label="Total Revenue"
                value={`₦${totalRevenue.toLocaleString()}`}
                color="bg-emerald-600 text-white"
              />
              <StatCard
                icon={<FiShoppingBag size={22} />}
                label="Active Orders"
                value={activeOrdersCount.toString()}
                color="bg-[#c2410c] text-white"
              />
              <StatCard
                icon={<FiPackage size={22} />}
                label="Total Products"
                value={products.length.toString()}
                color="bg-[#1e1b4b] text-white"
              />
              <StatCard
                icon={<FiAlertTriangle size={22} />}
                label="Low Stock Items"
                value={lowStockCount.toString()}
                color={lowStockCount > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-400 text-white'}
              />
              <StatCard
                icon={<FiMessageSquare size={22} />}
                label="Unread Messages"
                value={unreadMsgCount.toString()}
                color={unreadMsgCount > 0 ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}
              />
            </div>

            {/* Category Launch Controls: Beads & Accessories */}
            <div className="bg-gradient-to-r from-[#1e1b4b] to-[#312e81] text-white rounded-2xl p-6 shadow-md border border-[#d97706]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-serif text-lg font-bold text-[#d97706]">
                    Category Launch Control: Beads & Accessories
                  </h3>
                  <span
                    className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                      settings.beadsAccessoriesStatus === 'active'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-amber-400 text-[#1e1b4b] shadow-xs'
                    }`}
                  >
                    {settings.beadsAccessoriesStatus === 'active' ? 'Live & Open' : 'Coming Soon (Locked)'}
                  </span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  {settings.beadsAccessoriesStatus === 'active'
                    ? 'The Beads & Accessories collection is currently OPEN to all customers. Shoppers can view and purchase accessories from the catalog.'
                    : 'The collection is currently LOCKED in Coming Soon mode. Customers clicking on &ldquo;Beads & Accessories&rdquo; will see the exclusive Coming Soon showcase with launch notification signup.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleBeadsStatus}
                disabled={updatingSettings}
                className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer flex-shrink-0 disabled:opacity-50 ${
                  settings.beadsAccessoriesStatus === 'active'
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    : 'bg-[#d97706] hover:bg-[#f59e0b] text-[#1e1b4b]'
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
                  'Open Category to Public (Launch Now)'
                )}
              </button>
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
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1e1b4b] font-serif">Products Catalog</h2>
                <p className="text-xs text-gray-500">Track listings, pricing, and make quick stock adjustments</p>
              </div>
              <Link
                href="/admin/products/new"
                className="flex items-center gap-2 bg-[#1e1b4b] hover:bg-[#312e81] text-white px-5 py-3 rounded-xl text-sm font-bold shadow-sm transition-all"
              >
                <FiPlus size={16} /> Add New Product
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#1e1b4b]/5 text-[#1e1b4b]/60 uppercase text-xs tracking-wider">
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
                        <td className="px-6 py-4 font-semibold text-[#1e1b4b]">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-14 bg-gray-100 rounded-lg overflow-hidden border relative flex-shrink-0">
                              {p.images?.[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#1e1b4b] to-[#c2410c]" />
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
                              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-[#1e1b4b] hover:border-[#c2410c] hover:text-[#c2410c] transition-colors cursor-pointer"
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
                              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-[#1e1b4b] hover:border-[#c2410c] hover:text-[#c2410c] transition-colors cursor-pointer"
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
                {products.length === 0 && (
                  <div className="text-center py-20 bg-white">
                    <p className="text-gray-400">No products found in the catalog.</p>
                    <Link href="/admin/products/new" className="mt-3 inline-block text-[#d97706] hover:underline font-bold text-sm">
                      Create First Product &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content: Orders (Filters & Cards Layout) ── */}
        {tab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filters Row */}
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1e1b4b] font-serif">Customer Orders</h2>
                <p className="text-xs text-gray-500">View payment references and update shipping statuses</p>
              </div>
              <div className="flex flex-wrap gap-1 bg-[#1e1b4b]/5 p-1 rounded-xl">
                {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setOrderFilter(f)}
                    className={`px-3 py-1.5 text-xs font-bold capitalize rounded-lg transition-all cursor-pointer ${
                      orderFilter === f
                        ? 'bg-white text-[#1e1b4b] shadow-sm'
                        : 'text-gray-500 hover:text-[#1e1b4b]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Feed */}
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                  {/* Customer Information */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-xs text-[#1e1b4b]/40 font-semibold bg-gray-100 px-2 py-0.5 rounded">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>

                    <div>
                      <p className="font-bold text-base text-[#1e1b4b]">{order.customerInfo?.name}</p>
                      <p className="text-xs text-gray-500 font-medium">
                        {order.customerInfo?.email} &bull; {order.customerInfo?.phone}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Shipping Address: {order.customerInfo?.address}, {order.customerInfo?.city}, {order.customerInfo?.state}
                      </p>
                    </div>

                    {/* Bought Items list */}
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Items Purchased</p>
                      <ul className="text-sm space-y-1">
                        {order.items.map((item, i) => (
                          <li key={i} className="text-[#1e1b4b]/80 font-medium">
                            {item.product.name} &times; <span className="font-bold text-black">{item.quantity}</span>
                            <span className="text-xs text-gray-400 ml-1.5">
                              (Size: {item.selectedSize} | Color: {item.selectedColor.split('|')[0]})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="flex flex-col justify-between items-end text-right min-w-[200px]">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Total paid</p>
                      <p className="text-2xl font-black text-[#c2410c]">₦{order.total.toLocaleString()}</p>
                      {order.paystackRef && (
                        <p className="text-[10px] text-gray-400 font-mono">Ref: {order.paystackRef}</p>
                      )}
                    </div>

                    <div className="mt-4 md:mt-0 space-y-1.5 w-full md:w-auto">
                      <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Delivery Status
                      </label>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                        className={`w-full md:w-auto text-xs px-3 py-1.5 rounded-full font-bold uppercase border focus:ring-1 focus:ring-[#d97706] cursor-pointer ${STATUS_COLORS[order.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border">
                  <p className="text-gray-400">No orders found matching this filter.</p>
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
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`${color} p-3 rounded-xl flex items-center justify-center`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl font-bold text-[#1e1b4b] mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}
