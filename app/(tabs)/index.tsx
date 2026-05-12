import React, { useMemo, useState, useCallback, type ComponentType } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Order } from '@/types';
import OrderCard from '@/components/OrderCard';
import StatusBadge from '@/components/StatusBadge';
import ExternalOrdersSummaryCard from '@/components/ExternalOrdersSummaryCard';
import {
  ShoppingBag,
  Clock,
  CircleCheck as CheckCircle,
  TrendingUp,
} from 'lucide-react-native';

type IconComp = ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
  iconBg,
}: {
  icon: IconComp;
  label: string;
  value: string;
  accent: string;
  iconBg: string;
}) {
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIconCircle, { backgroundColor: iconBg }]}>
        <Icon color={accent} size={22} strokeWidth={2} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DashboardHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <LinearGradient
      colors={['#0f172a', '#1e3a5f', '#0f172a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <Text style={styles.heroEyebrow}>Overview</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>
    </LinearGradient>
  );
}

function ScreenShell({
  children,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f172a" />
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    orders,
    menuItems,
    getOrdersByStatus,
    getCompletedOrdersLast6Days,
    updateOrderStatus,
    refresh,
  } = useRestaurant();
  const [refreshing, setRefreshing] = useState(false);

  const externalOrders = useMemo(
    () =>
      orders
        .filter((o) => Boolean(o.source || o.externalOrderId))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [orders]
  );

  const todaysOrders = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(
      (order) => new Date(order.createdAt).toDateString() === today
    );
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return todaysOrders.reduce((sum, order) => {
      const line = order.items.reduce((total, item) => {
        const menuItem = menuItems.find((m) => m.id === item.menuItemId);
        if (!menuItem) return total;
        if (item.size && menuItem.sizeVariants) {
          const variant = menuItem.sizeVariants.find((v) => v.size === item.size);
          return total + (variant ? variant.price * item.quantity : 0);
        }
        return total + (menuItem.price || 0) * item.quantity;
      }, 0);
      return sum + line;
    }, 0);
  }, [todaysOrders, menuItems]);

  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === 'pending').length,
    [orders]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const goToOrders = useCallback(() => {
    router.push('/(tabs)/orders');
  }, [router]);

  if (!user) return null;

  if (user.role === 'admin') {
    const recent = [...orders].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );

    return (
      <ScreenShell refreshing={refreshing} onRefresh={onRefresh}>
        <DashboardHero
          title="Dashboard"
          subtitle={`Welcome back, ${user.username}`}
        />

        <View style={styles.statsSection}>
          <Text style={styles.sectionHeading}>Today at a glance</Text>
          <View style={styles.statsGrid}>
            <StatTile
              icon={TrendingUp}
              label="Today's revenue"
              value={`₵${totalRevenue.toFixed(2)}`}
              accent="#0d9488"
              iconBg="#ccfbf1"
            />
            <StatTile
              icon={ShoppingBag}
              label="Orders today"
              value={String(todaysOrders.length)}
              accent="#2563eb"
              iconBg="#dbeafe"
            />
            <StatTile
              icon={Clock}
              label="Pending"
              value={String(pendingCount)}
              accent="#d97706"
              iconBg="#fef3c7"
            />
            <StatTile
              icon={CheckCircle}
              label="Completed (6d)"
              value={String(getCompletedOrdersLast6Days().length)}
              accent="#059669"
              iconBg="#d1fae5"
            />
          </View>
        </View>

        <ExternalOrdersSummaryCard orders={externalOrders} onViewAll={goToOrders} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent orders</Text>
            <TouchableOpacity onPress={goToOrders} hitSlop={12}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>
          {recent.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No orders yet. Create one from New Order.</Text>
            </View>
          ) : (
            recent.slice(0, 5).map((order) => (
              <View key={order.id} style={styles.orderShell}>
                <OrderCard order={order} />
              </View>
            ))
          )}
        </View>
      </ScreenShell>
    );
  }

  if (user.role === 'waiter') {
    const allOrders = [...orders].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );

    return (
      <ScreenShell refreshing={refreshing} onRefresh={onRefresh}>
        <DashboardHero
          title="Orders"
          subtitle="Track every ticket in one place"
        />
        <View style={styles.section}>
          {allOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No orders yet. Tap New Order to create your first one.
              </Text>
            </View>
          ) : (
            allOrders.map((order) => (
              <View key={order.id} style={styles.orderShell}>
                <OrderCard order={order} />
              </View>
            ))
          )}
        </View>
      </ScreenShell>
    );
  }

  if (user.role === 'kitchen') {
    const activeOrders = orders.filter((order) =>
      ['pending', 'in-prep', 'ready'].includes(order.status)
    );

    const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
      updateOrderStatus(orderId, newStatus);
    };

    return (
      <ScreenShell refreshing={refreshing} onRefresh={onRefresh}>
        <DashboardHero
          title="Kitchen"
          subtitle={`${activeOrders.length} active on the line`}
        />
        <View style={styles.section}>
          {activeOrders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active orders — you're all caught up.</Text>
            </View>
          ) : (
            activeOrders.map((order) => (
              <View key={order.id} style={styles.kitchenBlock}>
                <View style={styles.orderShell}>
                  <OrderCard order={order} />
                </View>
                <View style={styles.kitchenActions}>
                  {order.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.kitchenBtn, styles.kitchenBtnPrimary]}
                      onPress={() => handleStatusUpdate(order.id, 'in-prep')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.kitchenBtnText}>Start prep</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'in-prep' && (
                    <TouchableOpacity
                      style={[styles.kitchenBtn, styles.kitchenBtnSuccess]}
                      onPress={() => handleStatusUpdate(order.id, 'ready')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.kitchenBtnText}>Mark ready</Text>
                    </TouchableOpacity>
                  )}
                  {order.status === 'ready' && (
                    <View style={styles.readyHint}>
                      <StatusBadge status="ready" size="small" />
                      <Text style={styles.readyHintText}>Waiting for pickup / serve</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScreenShell>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 28,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    marginTop: 8,
    lineHeight: 22,
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statTile: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4f46e5',
  },
  orderShell: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 15,
    lineHeight: 22,
  },
  kitchenBlock: {
    marginBottom: 16,
  },
  kitchenActions: {
    marginTop: -4,
    paddingHorizontal: 4,
  },
  kitchenBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  kitchenBtnPrimary: {
    backgroundColor: '#2563eb',
  },
  kitchenBtnSuccess: {
    backgroundColor: '#059669',
  },
  kitchenBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  readyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  readyHintText: {
    flex: 1,
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
  },
});
