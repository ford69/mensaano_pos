import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Order } from '@/types';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useAuth } from '@/contexts/AuthContext';
import StatusBadge from './StatusBadge';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Print from 'expo-print';

function generateTextReceipt(order: Order, menuItems: any[]) {
  const date = new Date(order.createdAt);
  const lines = [];
  
  // Header - centered for 80mm paper (approximately 32 characters wide)
  lines.push('        MENSAANO & THE SHAWARMA SHARK');
  lines.push('      Anevon Crescent,Spintex Rd Accra');
  lines.push('        Tel: 05577780035 & 0591483073');
  lines.push(''); // Empty line for spacing
  
  // Order details
  lines.push(`Order #: ${order.id.slice(-6)}`);
  lines.push(`Date: ${date.toLocaleDateString()}`);
  lines.push(`Time: ${date.toLocaleTimeString()}`);
  lines.push(`Customer: ${order.customer.name}`);
  
  // Add customer contact info for all orders
  const customer = order.customer as any; // Use any to check for different field names
  const phoneValue = customer.phone || customer.phoneNumber || customer.contact || customer.tel;
  
  // Always show phone for all orders, even if empty
  const phoneNumber = phoneValue && phoneValue.trim() 
    ? phoneValue.trim() 
    : 'No phone provided';
  lines.push(`Phone: ${phoneNumber}`);
  
  // Add address and rider contact only for delivery orders
  if (order.type === 'delivery') {
    if (order.customer.address && order.customer.address.trim()) {
      lines.push(`Address: ${order.customer.address.trim()}`);
    }
    
    const customer = order.customer as any;
    const riderContact = customer.riderContact || customer.rider_contact || customer.driverContact;
    if (riderContact && riderContact.trim()) {
      lines.push(`Rider Contact: ${riderContact.trim()}`);
    }
  }
  
  lines.push(`Type: ${order.type === 'dine-in' ? `Dine-In (Table ${order.tableNumber})` : 'Delivery'}`);
  
  // Add order creator information if available
  if (order.createdBy) {
    lines.push(`Created by: ${order.createdBy}`);
  }
  
  lines.push(''); // Empty line for spacing
  
  // Separator line
  lines.push('--------------------------------');
  
  // Column headers
  lines.push('Item                    Qty  Price');
  lines.push('--------------------------------');
  
  let subtotal = 0;
  order.items.forEach((item: any) => {
    const menuItem = menuItems.find((m: any) => m.id === item.menuItemId);
    if (menuItem) {
      let total = 0;
      let displayName = menuItem.name;
      
      if (item.size && menuItem.sizeVariants) {
        const variant = menuItem.sizeVariants.find((v: any) => v.size === item.size);
        total = variant ? variant.price * item.quantity : 0;
        displayName = `${menuItem.name} (${item.size})`;
      } else {
        total = (menuItem.price || 0) * item.quantity;
      }
      subtotal += total;
      
      // Format item line for 80mm paper
      const itemLine = `${displayName.slice(0, 20).padEnd(20)} ${String(item.quantity).padStart(2)}  ₵${total.toFixed(2)}`;
      lines.push(itemLine);
      
      // Add note if present
      if (item.note) {
        lines.push(`  Note: ${item.note}`);
      }
    }
  });
  
  // Separator
  lines.push('--------------------------------');
  
  // Totals
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  
  lines.push(`Subtotal:                    ₵${subtotal.toFixed(2)}`);
  lines.push(`Tax (5%):                    ₵${tax.toFixed(2)}`);
  lines.push('--------------------------------');
  lines.push(`TOTAL:                       ₵${total.toFixed(2)}`);
  lines.push(''); // Empty line for spacing
  
  // Payment status
  lines.push(`Payment: ${order.paymentStatus.toUpperCase()}`);
  
  // Special instructions if any
  if (order.specialInstructions) {
    lines.push('');
    lines.push('Special Instructions:');
    lines.push(order.specialInstructions);
  }
  
  lines.push(''); // Empty line for spacing
  lines.push('        Thank you for your order!');
  lines.push('         Please come again!');
  lines.push(''); // Empty line for spacing
  lines.push('--------------------------------');
  lines.push('        Powered by SoftCode Lab');
  
  return lines.join('\n');
}

async function printTextReceipt(receiptText: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.2;
          margin: 0;
          padding: 10px;
          width: 80mm;
          max-width: 80mm;
          background: white;
        }
        pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
        }
        @media print {
          body {
            width: 80mm;
            max-width: 80mm;
          }
        }
      </style>
    </head>
    <body>
      <pre>${receiptText}</pre>
    </body>
    </html>
  `;
  
  await Print.printAsync({ 
    html
  });
}

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  showActions?: boolean;
}

export default function OrderCard({ order, onPress, showActions = false }: OrderCardProps) {
  const { menuItems, updateOrderStatus, updateOrder } = useRestaurant();
  const { user } = useAuth();
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [riderContact, setRiderContact] = useState(order.customer.riderContact || '');
  const [showRiderInput, setShowRiderInput] = useState(false);
  const isAdmin = user?.role === 'admin';

  const getOrderTotal = () => {
    return order.items.reduce((total, item) => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      if (!menuItem) return total;
      
      if (item.size && menuItem.sizeVariants) {
        const variant = menuItem.sizeVariants.find(v => v.size === item.size);
        return total + (variant ? variant.price * item.quantity : 0);
      } else {
        return total + ((menuItem.price || 0) * item.quantity);
      }
    }, 0);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusUpdate = (newStatus: Order['status']) => {
    updateOrderStatus(order.id, newStatus);
    setShowStatusPicker(false);
  };

  const handleRiderContactUpdate = async () => {
    if (!riderContact.trim()) {
      Alert.alert('Error', 'Please enter rider contact number');
      return;
    }
    
    try {
      // Update the order with rider contact
      const updatedCustomer = {
        ...order.customer,
        riderContact: riderContact.trim()
      };
      
      await updateOrder(order.id, {
        customer: updatedCustomer
      });
      
      setShowRiderInput(false);
      Alert.alert('Success', 'Rider contact updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update rider contact');
    }
  };

  const getNextStatusOptions = (): Order['status'][] => {
    // If order is completed, no further status changes allowed
    if (order.status === 'completed') {
      return [];
    }
    
    const statusFlow: Order['status'][] = ['pending', 'in-prep', 'ready', 'served', 'dispatched', 'completed'];
    const currentIndex = statusFlow.indexOf(order.status);
    return statusFlow.slice(currentIndex + 1);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
          <StatusBadge status={order.status} size="small" />
        </View>
        <Text style={styles.time}>{formatTime(order.createdAt)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{order.customer.name}</Text>
          <Text style={styles.orderType}>
            {order.type === 'dine-in' ? `Table ${order.tableNumber}` : 'Delivery'}
          </Text>
        </View>

        <View style={styles.items}>
          {order.items.map((item, index) => {
            const menuItem = menuItems.find(m => m.id === item.menuItemId);
            let displayName = menuItem?.name || 'Unknown Item';
            
            if (item.size && menuItem?.sizeVariants) {
              displayName = `${menuItem.name} (${item.size})`;
            }
            
            return (
              <Text key={index} style={styles.item}>
                {displayName} x{item.quantity}
              </Text>
            );
          })}
        </View>

        {order.specialInstructions && (
          <Text style={styles.instructions}>
            Note: {order.specialInstructions}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.total}>
            Total: ₵{getOrderTotal().toFixed(2)}
          </Text>
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentText}>
              {order.paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Admin Status Update Section */}
      {isAdmin && (
        <View style={styles.adminSection}>
          {order.status === 'completed' ? (
            <>
              <View style={styles.completedMessage}>
                <Text style={styles.completedText}>Order completed - No further changes allowed</Text>
              </View>
              <TouchableOpacity
                style={styles.printButton}
                onPress={() => printTextReceipt(generateTextReceipt(order, menuItems))}
              >
                <Text style={styles.printButtonText}>Print Receipt</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.statusUpdateButton}
                onPress={() => setShowStatusPicker(!showStatusPicker)}
              >
                <Text style={styles.statusUpdateText}>Update Status</Text>
                {showStatusPicker ? (
                  <ChevronUp color="#6b7280" size={16} />
                ) : (
                  <ChevronDown color="#6b7280" size={16} />
                )}
              </TouchableOpacity>

                            {showStatusPicker && (
                <View style={styles.statusPickerContainer}>
                  <Text style={styles.statusPickerTitle}>Change to:</Text>
                  {getNextStatusOptions().map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={styles.statusOption}
                      onPress={() => handleStatusUpdate(status)}
                    >
                      <Text style={styles.statusOptionText}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Rider Contact Input for Ready Delivery Orders */}
              {order.type === 'delivery' && order.status === 'ready' && (
                <View style={styles.riderContactSection}>
                  <Text style={styles.riderContactTitle}>Rider Contact:</Text>
                  {showRiderInput ? (
                    <View style={styles.riderInputContainer}>
                      <TextInput
                        style={styles.riderInput}
                        placeholder="Enter rider contact number"
                        value={riderContact}
                        onChangeText={setRiderContact}
                        keyboardType="phone-pad"
                      />
                      <View style={styles.riderInputButtons}>
                        <TouchableOpacity
                          style={styles.riderSaveButton}
                          onPress={handleRiderContactUpdate}
                        >
                          <Text style={styles.riderSaveButtonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.riderCancelButton}
                          onPress={() => {
                            setShowRiderInput(false);
                            setRiderContact(order.customer.riderContact || '');
                          }}
                        >
                          <Text style={styles.riderCancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.riderDisplayContainer}>
                      <Text style={styles.riderContactText}>
                        {order.customer.riderContact || 'No rider assigned'}
                      </Text>
                      <TouchableOpacity
                        style={styles.riderEditButton}
                        onPress={() => setShowRiderInput(true)}
                      >
                        <Text style={styles.riderEditButtonText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  time: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    gap: 8,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  orderType: {
    fontSize: 14,
    color: '#6b7280',
  },
  items: {
    gap: 4,
  },
  item: {
    fontSize: 14,
    color: '#374151',
  },
  instructions: {
    fontSize: 14,
    color: '#f59e0b',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  paymentBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  adminSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statusUpdateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  statusUpdateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  statusPickerContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusPickerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  statusOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  completedMessage: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  completedText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
    textAlign: 'center',
  },
  printButton: {
    marginTop: 12,
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  printButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Rider Contact Styles
  riderContactSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  riderContactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  riderInputContainer: {
    gap: 8,
  },
  riderInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  riderInputButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  riderSaveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  riderSaveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  riderCancelButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  riderCancelButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  riderDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riderContactText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  riderEditButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  riderEditButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
});