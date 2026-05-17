import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  ChefHat,
  ShoppingCart,
  ChartBar as BarChart3,
  Settings,
  ClipboardList,
  PlusCircle,
} from 'lucide-react-native';

export default function TabLayout() {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;
  const isAdmin = role === 'admin';
  const isWaiter = role === 'waiter';
  const isKitchen = role === 'kitchen';

  const tabBarIcon =
    (Icon: typeof BarChart3) =>
    ({ color, size }: { color: string; size: number }) =>
      <Icon color={color} size={size} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ffae00',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Dashboard' : isKitchen ? 'Kitchen' : 'Orders',
          href: isAdmin || isWaiter || isKitchen ? undefined : null,
          tabBarIcon: tabBarIcon(isAdmin ? BarChart3 : isKitchen ? ChefHat : ClipboardList),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          href: isAdmin ? undefined : null,
          tabBarIcon: tabBarIcon(ClipboardList),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          href: isAdmin ? undefined : null,
          tabBarIcon: tabBarIcon(ShoppingCart),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          href: isAdmin ? undefined : null,
          tabBarIcon: tabBarIcon(User),
        }}
      />
      <Tabs.Screen
        name="new-order"
        options={{
          title: 'New Order',
          href: isAdmin || isWaiter ? undefined : null,
          tabBarIcon: tabBarIcon(PlusCircle),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: undefined,
          tabBarIcon: tabBarIcon(Settings),
        }}
      />
    </Tabs>
  );
}
