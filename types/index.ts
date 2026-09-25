export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'asooke' | 'adire' | 'bespoke' | 'accessories' | 'beads-and-accessories';
  sizes: string[];
  colors: string[];
  images: string[];
  stock: number;
  featured: boolean;
  createdAt: Date;
  colorImages?: Record<string, string[]>;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
  };
  paystackRef: string;
  createdAt: Date;
  deliveryNotes?: string;
  trackingNumber?: string;
  courierName?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'customer' | 'admin';
  createdAt: Date;
}

export interface CustomerMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  type: 'general' | 'bespoke_inquiry' | 'custom_measurement';
  measurements?: {
    bust?: string;
    waist?: string;
    hips?: string;
    height?: string;
    additionalDetails?: string;
  };
  status: 'unread' | 'read' | 'replied';
  createdAt: Date;
}

export interface StoreSettings {
  beadsAccessoriesStatus: 'coming_soon' | 'active';
}

