import React, { createContext, useContext, useEffect, useState } from 'react';
import { MenuItem, Order, User } from '@/types';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:3001/api'; // Updated to match your backend port

interface RestaurantContextType {
  menuItems: MenuItem[];
  orders: Order[];
  users: User[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  updatePaymentStatus: (orderId: string, paymentStatus: Order['paymentStatus']) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getOrdersByStatus: (status: Order['status']) => Order[];
  getOrdersByUser: (userId: string) => Order[];
  getTodaysOrders: () => Order[];
  loading: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount or when token changes
  useEffect(() => {
    if (token) {
      loadAll();
    }
  }, [token]);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Menu Items (public)
      const menuRes = await fetch(`${API_URL}/menu_items`);
      const menuData = await menuRes.json();
      // Transform _id to id for frontend compatibility
      const transformedMenuItems = menuData.map((item: any) => ({
        ...item,
        id: item._id,
      }));
      setMenuItems(transformedMenuItems);
      
      // Orders (protected)
      const ordersRes = await fetch(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ordersData = await ordersRes.json();
      // Transform _id to id for orders as well
      const transformedOrders = ordersData.map((order: any) => ({
        ...order,
        id: order._id,
      }));
      setOrders(transformedOrders);
      
      // Users (public for now)
      const usersRes = await fetch(`${API_URL}/users`);
      const usersData = await usersRes.json();
      // Transform _id to id for users as well
      const transformedUsers = usersData.map((user: any) => ({
        ...user,
        id: user._id,
      }));
      setUsers(transformedUsers);
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Menu Items
  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    setLoading(true);
    await fetch(`${API_URL}/menu_items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    await loadAll();
  };
  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    setLoading(true);
    await fetch(`${API_URL}/menu_items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await loadAll();
  };
  const deleteMenuItem = async (id: string) => {
    setLoading(true);
    await fetch(`${API_URL}/menu_items/${id}`, { method: 'DELETE' });
    await loadAll();
  };

  // Orders
  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...orderData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });
    await loadAll();
  };
  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    setLoading(true);
    await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, updatedAt: new Date().toISOString() }),
    });
    await loadAll();
  };
  const updatePaymentStatus = async (orderId: string, paymentStatus: Order['paymentStatus']) => {
    setLoading(true);
    await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paymentStatus, updatedAt: new Date().toISOString() }),
    });
    await loadAll();
  };

  // Users
  const addUser = async (userData: Omit<User, 'id'>) => {
    setLoading(true);
    await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    await loadAll();
  };
  const updateUser = async (id: string, updates: Partial<User>) => {
    setLoading(true);
    await fetch(`${API_URL}/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await loadAll();
  };
  const deleteUser = async (id: string) => {
    setLoading(true);
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
    await loadAll();
  };

  // Helpers
  const getOrdersByStatus = (status: Order['status']) => orders.filter(order => order.status === status);
  const getOrdersByUser = (userId: string) => orders.filter(order => order.createdBy === userId);
  const getTodaysOrders = () => {
    const today = new Date().toDateString();
    return orders.filter(order => new Date(order.createdAt).toDateString() === today);
  };

  return (
    <RestaurantContext.Provider
      value={{
        menuItems,
        orders,
        users,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        createOrder,
        updateOrderStatus,
        updatePaymentStatus,
        addUser,
        updateUser,
        deleteUser,
        getOrdersByStatus,
        getOrdersByUser,
        getTodaysOrders,
        loading,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
};