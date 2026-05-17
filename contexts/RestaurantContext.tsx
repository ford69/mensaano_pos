import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { MenuItem, Order, User } from '@/types';
import { useAuth } from './AuthContext';
import { API_URL } from '@/config/api';

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
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getOrdersByStatus: (status: Order['status']) => Order[];
  getOrdersByUser: (userId: string) => Order[];
  getTodaysOrders: () => Order[];
  getCompletedOrdersLast6Days: () => Order[];
  loading: boolean;
  /** Reload menu, orders (if logged in), and users from the API */
  refresh: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const { token, loading: authLoading, logout } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (authLoading) return;

    setLoading(true);
    try {
      if (!token) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const promises = [];

      promises.push(
        fetch(`${API_URL}/menu_items`)
          .then(res => res.json())
          .then(menuData => {
            const transformedMenuItems = menuData.map((item: any) => ({
              ...item,
              id: item._id,
            }));
            setMenuItems(transformedMenuItems);
          })
          .catch(e => {
            if (__DEV__) console.error('Error loading menu items:', e);
          })
      );

      if (token) {
        promises.push(
          fetch(`${API_URL}/orders`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(async res => {
              if (res.status === 401) {
                await logout();
                return;
              }
              if (!res.ok) {
                if (__DEV__) console.error('Error loading orders:', res.status, await res.text());
                return;
              }
              return res.json();
            })
            .then(ordersData => {
              if (!Array.isArray(ordersData)) return;
              const transformedOrders = ordersData.map((order: any) => ({
                ...order,
                id: order._id,
              }));
              setOrders(transformedOrders);
            })
            .catch(e => {
              if (__DEV__) console.error('Error loading orders:', e);
            })
        );
      }

      promises.push(
        fetch(`${API_URL}/users`)
          .then(res => res.json())
          .then(usersData => {
            const transformedUsers = usersData.map((user: any) => ({
              ...user,
              id: user._id,
            }));
            setUsers(transformedUsers);
          })
          .catch(e => {
            if (__DEV__) console.error('Error loading users:', e);
          })
      );

      await Promise.allSettled(promises);
    } catch (e) {
      if (__DEV__) {
        console.error('Error in loadAll function:', e);
      }
    } finally {
      setLoading(false);
    }
  }, [token, authLoading, logout]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

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

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    setLoading(true);
    console.log('🔍 CONTEXT DEBUG: Updating order:', orderId);
    console.log('🔍 CONTEXT DEBUG: Updates:', JSON.stringify(updates, null, 2));
    
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() }),
    });
    
    console.log('🔍 CONTEXT DEBUG: Response status:', response.status);
    const responseData = await response.json();
    console.log('🔍 CONTEXT DEBUG: Response data:', JSON.stringify(responseData, null, 2));
    
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
  const getCompletedOrdersLast6Days = () => {
    const now = new Date();
    // Set to today's midnight (12:00 AM)
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    // Calculate 6 days ago from today's midnight
    const sixDaysAgo = new Date(todayMidnight);
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    
    return orders.filter(order => {
      if (order.status !== 'completed') return false;
      
      // Use updatedAt for when the order was actually completed
      const completedDate = new Date(order.updatedAt || order.createdAt);
      
      // Only include orders completed within the last 6 days (from today's midnight)
      return completedDate >= sixDaysAgo && completedDate <= now;
    });
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
        updateOrder,
        addUser,
        updateUser,
        deleteUser,
        getOrdersByStatus,
        getOrdersByUser,
        getTodaysOrders,
        getCompletedOrdersLast6Days,
        loading,
        refresh: loadAll,
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