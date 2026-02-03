import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import addItem from '../services/addItems';
import dayjs from 'dayjs';
import DatePicker from 'react-native-ui-datepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import updateItem from '../services/updateItems';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { CategoryPicker } from '../components/CategoryPicker';
import { useTheme } from '../contexts/ThemeContext';
import {
  requestNotificationPermission,
  scheduleMaintenanceNotifications,
  updateNotifications
} from '../services/notificationService';

const AddItemScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState(new Date());
  const [frequency, setFrequency] = useState('');
  const [uid, setUid] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isEditing = !!route.params?.item;

  // Get current user id
  useEffect(() => {
    const user = auth().currentUser;
    if (user) setUid(user.uid);
  }, []);

  // Check if an Item is being passed for editing
  useEffect(() => {
    const editItem = route.params?.item ?? null;
    if (editItem) {
      setName(editItem.name || '');
      setCategory(editItem.category || 'other');
      setNotes(editItem.notes || '');
      setLastMaintenanceDate(editItem.lastMaintenanceDate ? new Date(editItem.lastMaintenanceDate) : new Date());
      setFrequency(editItem.frequency ? String(editItem.frequency) : '');
    }
  }, [route.params?.item]);

  const handleAddItem = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Field', 'Please enter an item name.');
      return;
    }
    if (!uid) {
      Alert.alert('Authentication Error', 'User not authenticated. Please sign in again.');
      return;
    }
    if (!lastMaintenanceDate) {
      Alert.alert('Missing Field', 'Please select a last maintenance date.');
      return;
    }
    if (!frequency || !frequency.trim()) {
      Alert.alert('Missing Field', 'Please enter maintenance frequency in days.');
      return;
    }

    // Check if notifications are enabled
    const notificationsEnabledValue = await AsyncStorage.getItem('notificationsEnabled');
    const notificationsEnabled = notificationsEnabledValue !== 'false'; // Default to true

    // Request notification permission if enabled
    let hasPermission = false;
    if (notificationsEnabled) {
      hasPermission = await requestNotificationPermission();
    }

    if (isEditing) {
      const result = await updateItem(route.params.item.id, {
        name,
        category,
        notes,
        lastMaintenanceDate,
        frequency: Number(frequency),
      });
      if (!result.success) {
        Alert.alert('Error', 'Failed to update item. Please try again.');
        return;
      }

      // Update notifications if enabled and permission granted
      if (notificationsEnabled && hasPermission) {
        await updateNotifications({
          id: route.params.item.id,
          name,
          lastMaintenanceDate,
          frequency: Number(frequency),
        });
      }

      navigation.goBack();
      return;
    }

    const result = await addItem(uid, name, category, notes, lastMaintenanceDate, Number(frequency));
    if (!result.success) {
      Alert.alert('Error', 'Failed to add item. Please try again.');
      return;
    }

    // Schedule notifications if enabled and permission granted
    if (notificationsEnabled && hasPermission && result.id) {
      await scheduleMaintenanceNotifications({
        id: result.id,
        name,
        lastMaintenanceDate,
        frequency: Number(frequency),
      });
    }

    // Navigate to ItemDashboard after adding a new item (replaces the stack)
    navigation.reset({
      index: 0,
      routes: [{ name: 'ItemDashboard' }],
    });
  };

  // Dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    notesInput: {
      height: 80,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    dateInputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 6,
    },
    dateInput: {
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
    },
    dateText: {
      fontSize: 16,
      color: colors.text,
    },
    submitButton: {
      marginTop: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            label="Item Name"
            placeholder="e.g., Air Filter, Water Heater"
            value={name}
            onChangeText={setName}
          />

          <CategoryPicker
            label="Category"
            selectedCategory={category}
            onSelect={setCategory}
          />

          <TextInput
            label="Notes (Optional)"
            placeholder="Add any notes about this item"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />

          <View style={styles.dateInputContainer}>
            <Text style={styles.label}>Last Maintenance Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Text style={styles.dateText}>
                {lastMaintenanceDate
                  ? dayjs(lastMaintenanceDate).format('MMM D, YYYY')
                  : 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DatePicker
              mode="single"
              date={lastMaintenanceDate}
              onChange={event => {
                const date = event.date instanceof Date
                  ? event.date
                  : dayjs(event.date).toDate();
                setLastMaintenanceDate(date);
                setShowDatePicker(false);
              }}
            />
          )}

          <TextInput
            label="Maintenance Frequency"
            placeholder="Number of days"
            value={frequency}
            onChangeText={setFrequency}
            keyboardType="numeric"
          />

          <Button
            title={isEditing ? 'Save Changes' : 'Add Item'}
            onPress={handleAddItem}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddItemScreen;

