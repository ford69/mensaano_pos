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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { User, LogOut, CreditCard as Edit, Save, X } from 'lucide-react-native';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { updateUser } = useRestaurant();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  const handleSave = () => {
    if (!editedUser.username.trim() || !editedUser.email.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedUser.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (user) {
      updateUser(user.id, {
        username: editedUser.username.trim(),
        email: editedUser.email.trim(),
      });
    }

    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditedUser({
      username: user?.username || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#EF4444';
      case 'waiter':
        return '#3B82F6';
      case 'kitchen':
        return '#10B981';
      default:
        return '#6b7280';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'waiter':
        return 'Waiter';
      case 'kitchen':
        return 'Kitchen Staff';
      default:
        return role;
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.headerActions}>
            {isEditing ? (
              <>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                  <X color="#6b7280" size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Save color="#ffffff" size={20} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <Edit color="#10B981" size={20} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: getRoleColor(user.role) }]}>
              <User color="#ffffff" size={32} />
            </View>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
              <Text style={styles.roleText}>{getRoleLabel(user.role)}</Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.infoGroup}>
              <Text style={styles.label}>Username</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedUser.username}
                  onChangeText={(text) => setEditedUser(prev => ({ ...prev, username: text }))}
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.value}>{user.username}</Text>
              )}
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.label}>Email</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedUser.email}
                  onChangeText={(text) => setEditedUser(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.value}>{user.email}</Text>
              )}
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.label}>Role</Text>
              <Text style={styles.value}>{getRoleLabel(user.role)}</Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.value}>
                {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color="#EF4444" size={20} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>Restaurant POS System</Text>
          <Text style={styles.appInfoText}>Version 1.0.0</Text>
          <Text style={styles.appInfoText}>© 2025 Restaurant Management</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  cancelButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileInfo: {
    gap: 16,
  },
  infoGroup: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  actions: {
    padding: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  appInfoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
});