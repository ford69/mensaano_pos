import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { MenuItem, SizeVariant } from '@/types';
import { Plus, CreditCard as Edit, Trash2, Search } from 'lucide-react-native';

export default function MenuPage() {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useRestaurant();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categorizedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMenuItem(id) },
      ]
    );
  };

  const toggleAvailability = (item: MenuItem) => {
    updateMenuItem(item.id, { available: !item.available });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
        <Text style={styles.title}>Menu Management</Text>
          <Text style={styles.subtitle}>Manage menu categories and items</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus color="#ffffff" size={20} />
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search color="#6b7280" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.menuList}>
        {Object.entries(categorizedItems).map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.menuItem}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, !item.available && styles.unavailableText]}>
                    {item.name}
                  </Text>
                  <View style={styles.priceContainer}>
                    {item.sizeVariants && item.sizeVariants.length > 0 ? (
                      item.sizeVariants.map((variant) => (
                        <Text key={variant.size} style={styles.itemPrice}>
                          {variant.size.charAt(0).toUpperCase() + variant.size.slice(1)}: ₵{variant.price.toFixed(2)}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.itemPrice}>₵{item.price?.toFixed(2) || '0.00'}</Text>
                    )}
                  </View>
                  {item.description && (
                    <Text style={styles.itemDescription}>{item.description}</Text>
                  )}
                  <View style={styles.availabilityContainer}>
                    <Text style={[styles.availability, item.available ? styles.available : styles.unavailable]}>
                      {item.available ? 'Available' : 'Out of Stock'}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={[styles.toggleButton, item.available ? styles.disableButton : styles.enableButton]}
                    onPress={() => toggleAvailability(item)}
                  >
                    <Text style={styles.toggleButtonText}>
                      {item.available ? 'Disable' : 'Enable'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setEditingItem(item)}
                  >
                    <Edit color="#3B82F6" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 color="#EF4444" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <MenuItemModal
        visible={showAddModal || editingItem !== null}
        item={editingItem}
        onClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
        }}
        onSave={(itemData) => {
          if (editingItem) {
            updateMenuItem(editingItem.id, itemData);
          } else {
            addMenuItem(itemData);
          }
          setShowAddModal(false);
          setEditingItem(null);
        }}
      />
    </SafeAreaView>
  );
}

interface MenuItemModalProps {
  visible: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onSave: (item: Omit<MenuItem, 'id'>) => void;
}

function MenuItemModal({ visible, item, onClose, onSave }: MenuItemModalProps) {
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || 'Mains');
  const [description, setDescription] = useState(item?.description || '');
  const [available, setAvailable] = useState(item?.available ?? true);
  
  // Pricing mode: 'single' or 'variants'
  const [pricingMode, setPricingMode] = useState<'single' | 'variants'>('single');
  
  // Single price state
  const [singlePrice, setSinglePrice] = useState(item?.price?.toString() || '');
  
  // Size variants state - start empty
  const [sizeVariants, setSizeVariants] = useState<SizeVariant[]>([]);
  const [newSizeName, setNewSizeName] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }

    if (pricingMode === 'single') {
      const priceNumber = parseFloat(singlePrice);
      if (isNaN(priceNumber) || priceNumber <= 0) {
        Alert.alert('Error', 'Please enter a valid price');
        return;
      }
      
      onSave({
        name: name.trim(),
        category,
        description: description.trim(),
        available,
        price: priceNumber,
        sizeVariants: undefined,
      });
    } else {
      // Check if at least one size variant has a price
      const hasValidPrice = sizeVariants.some(variant => variant.price > 0);
      if (!hasValidPrice) {
        Alert.alert('Error', 'Please set at least one price for a size variant');
        return;
      }

      onSave({
        name: name.trim(),
        category,
        description: description.trim(),
        available,
        price: undefined,
        sizeVariants: sizeVariants.filter(variant => variant.price > 0), // Only include variants with prices
      });
    }

    // Reset form
    setName('');
    setCategory('Mains');
    setDescription('');
    setAvailable(true);
    setPricingMode('single');
    setSinglePrice('');
    setSizeVariants([]);
    setNewSizeName('');
  };

  const addSizeVariant = () => {
    if (!newSizeName.trim()) {
      Alert.alert('Error', 'Please enter a size name');
      return;
    }
    
    if (sizeVariants.some(variant => variant.size.toLowerCase() === newSizeName.trim().toLowerCase())) {
      Alert.alert('Error', 'This size already exists');
      return;
    }

    setSizeVariants(prev => [...prev, { 
      size: newSizeName.trim(), 
      price: 0, 
      available: true 
    }]);
    setNewSizeName('');
  };

  const removeSizeVariant = (sizeToRemove: string) => {
    setSizeVariants(prev => prev.filter(variant => variant.size !== sizeToRemove));
  };

  const updateSizeVariant = (size: string, field: 'price' | 'available', value: number | boolean) => {
    setSizeVariants(prev => 
      prev.map(variant => 
        variant.size === size 
          ? { ...variant, [field]: value }
          : variant
      )
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {item ? 'Edit Menu Item' : 'Add Menu Item'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Item name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
              >
                <Picker.Item label="Appetizers" value="Appetizers" />
                <Picker.Item label="Salads" value="Salads" />
                <Picker.Item label="Mains" value="Mains" />
                <Picker.Item label="Beverages" value="Beverages" />
                <Picker.Item label="Desserts" value="Desserts" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Item description"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pricing Mode</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={pricingMode}
                onValueChange={setPricingMode}
              >
                <Picker.Item label="Single Price" value="single" />
                <Picker.Item label="Size Variants" value="variants" />
              </Picker>
            </View>
          </View>

          {pricingMode === 'single' ? (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                value={singlePrice}
                onChangeText={setSinglePrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Size Variants & Pricing</Text>
              
              {/* Add new size variant */}
              <View style={styles.addSizeContainer}>
                <TextInput
                  style={styles.sizeNameInput}
                  value={newSizeName}
                  onChangeText={setNewSizeName}
                  placeholder="Size name (e.g., Small, Medium, Large)"
                  autoCapitalize="words"
                />
                <TouchableOpacity
                  style={styles.addSizeButton}
                  onPress={addSizeVariant}
                >
                  <Plus color="#ffffff" size={16} />
                </TouchableOpacity>
              </View>

              {/* Existing size variants */}
              {sizeVariants.map((variant) => (
                <View key={variant.size} style={styles.sizeVariantContainer}>
                  <View style={styles.sizeHeader}>
                    <Text style={styles.sizeLabel}>{variant.size}</Text>
                    <View style={styles.sizeControls}>
                      <TextInput
                        style={styles.priceInput}
                        value={variant.price.toString()}
                        onChangeText={(text) => updateSizeVariant(variant.size, 'price', parseFloat(text) || 0)}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                      />
                      <TouchableOpacity
                        style={[styles.availabilityToggle, variant.available ? styles.availableToggle : styles.unavailableToggle]}
                        onPress={() => updateSizeVariant(variant.size, 'available', !variant.available)}
                      >
                        <Text style={styles.availabilityText}>
                          {variant.available ? 'Available' : 'Unavailable'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeSizeButton}
                        onPress={() => removeSizeVariant(variant.size)}
                      >
                        <Text style={styles.removeSizeText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Overall Availability</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={available}
                onValueChange={setAvailable}
              >
                <Picker.Item label="Available" value={true} />
                <Picker.Item label="Out of Stock" value={false} />
              </Picker>
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {item ? 'Update Item' : 'Add Item'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  menuList: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  unavailableText: {
    color: '#9ca3af',
  },
  priceContainer: {
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  availabilityContainer: {
    alignSelf: 'flex-start',
  },
  availability: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  available: {
    color: '#059669',
    backgroundColor: '#d1fae5',
  },
  unavailable: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
  },
  itemActions: {
    gap: 8,
    alignItems: 'flex-end',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  enableButton: {
    backgroundColor: '#10B981',
  },
  disableButton: {
    backgroundColor: '#6b7280',
  },
  toggleButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  cancelButton: {
    color: '#6b7280',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sizeVariantContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 14,
    textAlign: 'right',
    backgroundColor: '#ffffff',
  },
  availabilityToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  availableToggle: {
    backgroundColor: '#d1fae5',
    borderColor: '#059669',
  },
  unavailableToggle: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  addSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  sizeNameInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addSizeButton: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 6,
  },
  removeSizeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  removeSizeText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});