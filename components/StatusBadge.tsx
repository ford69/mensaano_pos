import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Order } from '@/types';

interface StatusBadgeProps {
  status: Order['status'];
  size?: 'small' | 'medium' | 'large';
}

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'in-prep':
        return '#3b82f6';
      case 'ready':
        return '#10b981';
      case 'served':
      case 'dispatched':
        return '#8b5cf6';
      case 'delivered':
      case 'completed':
        return '#059669';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-prep':
        return 'In Prep';
      case 'ready':
        return 'Ready';
      case 'served':
        return 'Served';
      case 'dispatched':
        return 'Dispatched';
      case 'delivered':
        return 'Delivered';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const sizeStyles = {
    small: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 12,
    },
    medium: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 14,
    },
    large: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 16,
    },
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getStatusColor(),
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: sizeStyles[size].fontSize },
        ]}
      >
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
  },
});