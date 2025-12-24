import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Order } from '@/types';
import OrderCard from '@/components/OrderCard';
import { Search, Filter, ShoppingCart } from 'lucide-react-native';

export default function OrdersPage() {
  const router = useRouter();
  const { orders, updateOrderStatus, updatePaymentStatus } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      const matchesSearch = searchQuery.trim() === '' || 
                           order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           order.id.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort orders: active orders first, then completed orders
    // Within each group, sort by date (newest first)
    return filtered.sort((a, b) => {
      const aIsCompleted = a.status === 'completed';
      const bIsCompleted = b.status === 'completed';

      // If one is completed and the other isn't, put active orders first
      if (aIsCompleted !== bIsCompleted) {
        return aIsCompleted ? 1 : -1;
      }

      // Within the same group (both completed or both active), sort by date (newest first)
      const aDate = new Date(a.updatedAt || a.createdAt).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt).getTime();
      return bDate - aDate;
    });
  }, [orders, searchQuery, statusFilter]);

  const renderOrder = useCallback(({ item }: { item: Order }) => (
    <OrderCard key={item.id} order={item} />
  ), []);

  const keyExtractor = useCallback((item: Order) => item.id, []);

  const statusOptions: Array<{ value: Order['status'] | 'all', label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-prep', label: 'In Prep' },
    { value: 'ready', label: 'Ready' },
    { value: 'served', label: 'Served' },
    { value: 'dispatched', label: 'Dispatched' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <View style={styles.titleTextContainer}>
              <Text style={styles.title}>Orders Management</Text>
              <Text style={styles.subtitle}>Track and manage customer orders</Text>
            </View>
            <TouchableOpacity
              style={styles.createOrderButton}
              onPress={() => router.push('/(tabs)/new-order')}
              activeOpacity={0.7}
            >
              <ShoppingCart color="#ffffff" size={18} />
              <Text style={styles.createOrderButtonText}>Create Order</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.searchContainer}>
          <Search color="#6b7280" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterButton,
                statusFilter === option.value && styles.filterButtonActive
              ]}
              onPress={() => setStatusFilter(option.value)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                statusFilter === option.value && styles.filterButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No orders found</Text>
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={10}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    zIndex: 10,
  },
  titleContainer: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  createOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  createOrderButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
  },
  filterButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  ordersList: {
    flexGrow: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
  },
});