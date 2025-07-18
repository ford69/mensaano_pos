import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { User, ChefHat, ShoppingCart, ChartBar as BarChart3, Settings, ClipboardList } from 'lucide-react-native';

export default function TabLayout() {
  const { user } = useAuth();

  if (!user) return null;

  const getTabsForRole = () => {
    switch (user.role) {
      case 'admin':
        return [
          { name: 'index', title: 'Dashboard', icon: BarChart3 },
          { name: 'orders', title: 'Orders', icon: ClipboardList },
          { name: 'menu', title: 'Menu', icon: ShoppingCart },
          { name: 'users', title: 'Users', icon: User },
          { name: 'profile', title: 'Profile', icon: Settings },
        ];
      case 'waiter':
        return [
          { name: 'index', title: 'Orders', icon: ClipboardList },
          { name: 'new-order', title: 'New Order', icon: ShoppingCart },
          { name: 'profile', title: 'Profile', icon: Settings },
        ];
      case 'kitchen':
        return [
          { name: 'index', title: 'Kitchen', icon: ChefHat },
          { name: 'profile', title: 'Profile', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabsForRole();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981',
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
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <tab.icon color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}