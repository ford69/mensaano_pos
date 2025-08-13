export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'waiter' | 'kitchen';
  createdAt: string;
}

export interface SizeVariant {
  size: string; // Allow any string for custom size names
  price: number;
  available: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  available: boolean;
  description?: string;
  price?: number; // Single price for items without size variants
  sizeVariants?: SizeVariant[]; // Optional size variants
}

export interface OrderItem {
  menuItemId: string;
  size?: string; // Optional size for items with variants
  quantity: number;
  note?: string;
}

export interface Customer {
  name: string;
  phone?: string;
  address?: string;
  riderContact?: string;
}

export interface Order {
  id: string;
  type: 'dine-in' | 'delivery';
  tableNumber?: number;
  customer: Customer;
  items: OrderItem[];
  status: 'pending' | 'in-prep' | 'ready' | 'served' | 'dispatched' | 'delivered' | 'completed';
  createdBy: string;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesReport {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  dineInOrders: number;
  deliveryOrders: number;
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}