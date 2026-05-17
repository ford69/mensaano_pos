import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Order } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { MessageSquareText, ChevronRight, Inbox } from 'lucide-react-native';

interface ExternalOrdersSummaryCardProps {
  /** Orders where `source` or `externalOrderId` is set (integration / WhatsApp bridge). */
  orders: Order[];
  onViewAll: () => void;
}

export default function ExternalOrdersSummaryCard({
  orders,
  onViewAll,
}: ExternalOrdersSummaryCardProps) {
  const { todayCount, activeCount, preview } = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayCount = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === todayStr
    ).length;
    const activeCount = orders.filter((o) =>
      ['pending', 'in-prep', 'ready'].includes(o.status)
    ).length;
    const preview = [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 4);
    return { todayCount, activeCount, preview };
  }, [orders]);

  const formatShortId = (id: string) => id.slice(-6).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <MessageSquareText color="#4f46e5" size={22} strokeWidth={2} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>WhatsApp orders</Text>
            <Text style={styles.subtitle}>
              {orders.length} total
              {orders.length > 4 ? ' · showing 4 most recent' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>{todayCount}</Text>
            <Text style={styles.metricLabel}>Today</Text>
          </View>
          <View style={[styles.metricPill, styles.metricPillActive]}>
            <Text style={styles.metricValueActive}>{activeCount}</Text>
            <Text style={styles.metricLabelActive}>Active queue</Text>
          </View>
        </View>

        {preview.length === 0 ? (
          <View style={styles.empty}>
            <Inbox color="#94a3b8" size={36} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No WhatsApp orders yet</Text>
            <Text style={styles.emptyHint}>
              New WhatsApp orders will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {preview.map((order) => (
              <View key={order.id} style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {order.customer.name}
                  </Text>
                  <Text style={styles.meta}>
                    #{formatShortId(order.id)} · {order.type === 'delivery' ? 'Delivery' : 'Dine-in'}
                    {order.source ? ` · ${order.source}` : ''}
                  </Text>
                </View>
                <StatusBadge status={order.status} size="small" />
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={onViewAll}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>Open orders tab</Text>
          <ChevronRight color="#4f46e5" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#4f46e5',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  inner: {
    padding: 18,
    paddingLeft: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  metrics: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricPill: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricPillActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  metricValueActive: {
    fontSize: 22,
    fontWeight: '800',
    color: '#b45309',
  },
  metricLabelActive: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 2,
    fontWeight: '500',
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  rowMain: {
    flex: 1,
    marginRight: 10,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  meta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 3,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    gap: 4,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4338ca',
  },
});
