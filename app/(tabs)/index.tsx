import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Order } from '@/types';
import OrderCard from '@/components/OrderCard';
import StatusBadge from '@/components/StatusBadge';
import { ShoppingBag, Clock, CircleCheck as CheckCircle } from 'lucide-react-native';

export default function HomePage() {
  const { user } = useAuth();
  const { orders, getTodaysOrders, getOrdersByStatus, updateOrderStatus } = useRestaurant();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderAdminDashboard = () => {
    const todaysOrders = getTodaysOrders();
    const { menuItems } = useRestaurant();
    
    const totalRevenue = todaysOrders.reduce((sum, order) => {
      return sum + order.items.reduce((total, item) => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        if (!menuItem) return total;
        
        if (item.size && menuItem.sizeVariants) {
          const variant = menuItem.sizeVariants.find(v => v.size === item.size);
          return total + (variant ? variant.price * item.quantity : 0);
        } else {
          return total + ((menuItem.price || 0) * item.quantity);
        }
      }, 0);
    }, 0);

    return (
      <SafeAreaView style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, {user?.username}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
              <Text style={styles.currencySymbol}>₵</Text>
              <Text style={styles.statValue}>₵{totalRevenue.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <ShoppingBag color="#3B82F6" size={24} />
            <Text style={styles.statValue}>{todaysOrders.length}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Clock color="#F59E0B" size={24} />
            <Text style={styles.statValue}>{getOrdersByStatus('pending').length}</Text>
            <Text style={styles.statLabel}>Pending Orders</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle color="#059669" size={24} />
            <Text style={styles.statValue}>{getOrdersByStatus('completed').length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {orders.slice(0, 5).map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>
      </ScrollView>
      </SafeAreaView>
    );
  };

  const renderWaiterDashboard = () => {
    const userOrders = orders.filter(order => order.createdBy === user?.id);

    return (
      <SafeAreaView style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>Track your orders</Text>
        </View>

        <View style={styles.section}>
          {userOrders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet. Create your first order!</Text>
          ) : (
            userOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </View>
      </ScrollView>
      </SafeAreaView>
    );
  };

  const renderKitchenDashboard = () => {
    const activeOrders = orders.filter(order => 
      ['pending', 'in-prep', 'ready'].includes(order.status)
    );

    const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
      updateOrderStatus(orderId, newStatus);
    };

    return (
      <SafeAreaView style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Kitchen Orders</Text>
          <Text style={styles.subtitle}>Manage cooking queue</Text>
        </View>

        <View style={styles.section}>
          {activeOrders.length === 0 ? (
            <Text style={styles.emptyText}>No active orders</Text>
          ) : (
            activeOrders.map((order) => (
              <View key={order.id} style={styles.kitchenOrderCard}>
                <OrderCard order={order} />
                <View style={styles.actionButtons}>
                  {order.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.prepButton]}
                      onPress={() => handleStatusUpdate(order.id, 'in-prep')}
                    >
                      <Text style={styles.actionButtonText}>Start Prep</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'in-prep' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.readyButton]}
                      onPress={() => handleStatusUpdate(order.id, 'ready')}
                    >
                      <Text style={styles.actionButtonText}>Mark Ready</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      </SafeAreaView>
    );
  };

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return renderAdminDashboard();
      case 'waiter':
        return renderWaiterDashboard();
      case 'kitchen':
        return renderKitchenDashboard();
      default:
        return null;
    }
  };

  return renderDashboard();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
  },
  kitchenOrderCard: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  prepButton: {
    backgroundColor: '#3B82F6',
  },
  readyButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});