import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Order } from '@/types';
import OrderCard from '@/components/OrderCard';
import { Search, Filter, Plus } from 'lucide-react-native';

export default function OrdersPage() {
  const router = useRouter();
  const { orders, updateOrderStatus, updatePaymentStatus } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <Text style={styles.title}>Orders Management</Text>
          <Text style={styles.subtitle}>Track and manage customer orders</Text>
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

      <ScrollView style={styles.ordersList}>
        {filteredOrders.length === 0 ? (
          <Text style={styles.emptyText}>No orders found</Text>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/new-order')}
      >
        <Plus color="#ffffff" size={24} />
      </TouchableOpacity>
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
  },
  titleContainer: {
    marginBottom: 16,
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
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 80, // Above the tab bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});