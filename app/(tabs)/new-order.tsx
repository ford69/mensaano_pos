import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Order, OrderItem } from '@/types';
import { Plus, Minus, ShoppingCart, Search, Trash2, X } from 'lucide-react-native';

export default function NewOrderPage() {
  const { user } = useAuth();
  const { menuItems, createOrder } = useRestaurant();
  const [orderType, setOrderType] = useState<'dine-in' | 'delivery'>('dine-in');
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<Order['paymentStatus']>('unpaid');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

  const addItem = (menuItemId: string, size?: string) => {
    const existingItem = selectedItems.find(item => item.menuItemId === menuItemId && item.size === size);
    if (existingItem) {
      setSelectedItems(prev => 
        prev.map(item => 
          item.menuItemId === menuItemId && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems(prev => [...prev, { menuItemId, size, quantity: 1 }]);
    }
  };

  const removeItem = (menuItemId: string, size?: string) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.menuItemId === menuItemId && item.size === size && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ).filter(item => !(item.menuItemId === menuItemId && item.size === size && item.quantity <= 1))
    );
  };

  const removeItemFromOrder = (menuItemId: string, size?: string) => {
    setSelectedItems(prev => prev.filter(item => 
      !(item.menuItemId === menuItemId && item.size === size)
    ));
    // Also remove any notes for this item
    const noteKey = `${menuItemId}-${size || 'single'}`;
    setItemNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[noteKey];
      return newNotes;
    });
  };

  const getItemQuantity = (menuItemId: string, size?: string) => {
    return selectedItems.find(item => item.menuItemId === menuItemId && item.size === size)?.quantity || 0;
  };

  const getTotal = () => {
    return selectedItems.reduce((total, item) => {
      const menuItem = menuItems.find(m => m.id === item.menuItemId);
      
      if (item.size && menuItem?.sizeVariants) {
        const variant = menuItem.sizeVariants.find(v => v.size === item.size);
        return total + (variant ? variant.price * item.quantity : 0);
      } else {
        return total + (menuItem?.price ? menuItem.price * item.quantity : 0);
      }
    }, 0);
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    if (orderType === 'dine-in' && !tableNumber.trim()) {
      Alert.alert('Error', 'Please enter table number');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    if (orderType === 'delivery' && !address.trim()) {
      Alert.alert('Error', 'Please enter delivery address');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select at least one item');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        type: orderType,
        customer: {
          name: customerName.trim(),
          phone: phone.trim(),
          address: address.trim() || undefined,
        },
        tableNumber: orderType === 'dine-in' ? parseInt(tableNumber) : undefined,
        items: selectedItems.map(item => ({
          ...item,
          note: itemNotes[`${item.menuItemId}-${item.size || 'single'}`] || undefined,
        })),
        status: 'pending' as const,
        paymentStatus,
        specialInstructions: specialInstructions.trim() || undefined,
        createdBy: user?.username || '',
      };

      await createOrder(orderData);
      
      // Reset form
      setCustomerName('');
      setTableNumber('');
      setPhone('');
      setAddress('');
      setSpecialInstructions('');
      setSelectedItems([]);
      setItemNotes({});
      
      Alert.alert('Success', 'Order created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter menu items based on search query
  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categorizedItems = filteredMenuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create New Order</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Type</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={orderType}
              onValueChange={(value) => setOrderType(value)}
            >
              <Picker.Item label="Dine-In" value="dine-in" />
              <Picker.Item label="Delivery" value="delivery" />
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Customer Name"
            value={customerName}
            onChangeText={setCustomerName}
          />
          
          {/* Phone Number - Always shown for both dine-in and delivery */}
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          
          {orderType === 'dine-in' ? (
            <TextInput
              style={styles.input}
              placeholder="Table Number"
              value={tableNumber}
              onChangeText={setTableNumber}
              keyboardType="numeric"
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Delivery Address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Status</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={paymentStatus}
              onValueChange={(value) => setPaymentStatus(value)}
            >
              <Picker.Item label="Unpaid" value="unpaid" />
              <Picker.Item label="Paid" value="paid" />
              <Picker.Item label="Partially Paid" value="partial" />
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu Items</Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search color="#6b7280" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search menu items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color="#6b7280" size={20} />
              </TouchableOpacity>
            )}
          </View>

          {Object.entries(categorizedItems).map(([category, items]) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.menuItem}>
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    {item.sizeVariants && item.sizeVariants.length > 0 ? (
                      <View style={styles.sizeVariants}>
                        {item.sizeVariants.map((variant) => (
                          <View key={variant.size} style={styles.sizeVariant}>
                            <Text style={styles.sizeLabel}>
                              {variant.size.charAt(0).toUpperCase() + variant.size.slice(1)}: ₵{variant.price.toFixed(2)}
                            </Text>
                            <View style={styles.quantityControls}>
                              <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => removeItem(item.id, variant.size)}
                              >
                                <Minus color="#6b7280" size={16} />
                              </TouchableOpacity>
                              <Text style={styles.quantity}>{getItemQuantity(item.id, variant.size)}</Text>
                              <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => addItem(item.id, variant.size)}
                              >
                                <Plus color="#6b7280" size={16} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.singlePriceItem}>
                        <Text style={styles.menuItemPrice}>₵{item.price?.toFixed(2) || '0.00'}</Text>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => removeItem(item.id)}
                          >
                            <Minus color="#6b7280" size={16} />
                          </TouchableOpacity>
                          <Text style={styles.quantity}>{getItemQuantity(item.id)}</Text>
                          <TouchableOpacity
                            style={styles.quantityButton}
                            onPress={() => addItem(item.id)}
                          >
                            <Plus color="#6b7280" size={16} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Special instructions (optional)"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          {selectedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingCart color="#9ca3af" size={48} />
              <Text style={styles.emptyStateText}>No items selected</Text>
              <Text style={styles.emptyStateSubtext}>Add items from the menu above to create your order</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryItems}>
                {selectedItems.map((item) => {
                  const menuItem = menuItems.find(m => m.id === item.menuItemId);
                  let itemPrice = 0;
                  let displayName = menuItem?.name || 'Unknown Item';
                  const noteKey = `${item.menuItemId}-${item.size || 'single'}`;
                  const itemNote = itemNotes[noteKey];
                  
                  if (item.size && menuItem?.sizeVariants) {
                    const variant = menuItem.sizeVariants.find(v => v.size === item.size);
                    itemPrice = variant ? variant.price * item.quantity : 0;
                    displayName = `${menuItem.name} (${item.size})`;
                  } else {
                    itemPrice = menuItem?.price ? menuItem.price * item.quantity : 0;
                  }
                  
                  return (
                    <View key={`${item.menuItemId}-${item.size || 'single'}`} style={styles.summaryItem}>
                      <View style={styles.summaryItemContent}>
                        <View style={styles.summaryItemHeader}>
                          <Text style={styles.summaryItemName}>
                            {displayName} x{item.quantity}
                          </Text>
                          <TouchableOpacity
                            style={styles.removeItemButton}
                            onPress={() => removeItemFromOrder(item.menuItemId, item.size)}
                          >
                            <Trash2 color="#ef4444" size={16} />
                          </TouchableOpacity>
                        </View>
                        {itemNote && (
                          <Text style={styles.itemNote}>Note: {itemNote}</Text>
                        )}
                        <TextInput
                          style={styles.itemNoteInput}
                          placeholder="Add note for this item..."
                          value={itemNote || ''}
                          onChangeText={(text) => setItemNotes(prev => ({ ...prev, [noteKey]: text }))}
                          multiline
                        />
                      </View>
                      <Text style={styles.summaryItemPrice}>
                        ₵{itemPrice.toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>₵{getTotal().toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting || selectedItems.length === 0}
        >
          <ShoppingCart color="#ffffff" size={20} />
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating Order...' : 'Create Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  form: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  menuItemPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  sizeVariants: {
    marginTop: 8,
    gap: 8,
  },
  sizeVariant: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  sizeLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 20,
    textAlign: 'center',
  },
  singlePriceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  summary: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  summaryItems: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryItemContent: {
    flex: 1,
    marginRight: 12,
  },
  summaryItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  removeItemButton: {
    padding: 4,
  },
  itemNote: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  itemNoteInput: {
    fontSize: 12,
    color: '#6b7280',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f9fafb',
    minHeight: 24,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  submitButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});