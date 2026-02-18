import React, { useState, useEffect, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import {
  requestNotificationPermission,
  scheduleMaintenanceNotifications,
  updateNotifications
} from '../services/notificationService';

const AddItemScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
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
      Alert.alert(t('validation.required'), t('addItem.missingName'));
      return;
    }
    if (!uid) {
      Alert.alert(t('common.error'), t('addItem.authError'));
      return;
    }
    if (!lastMaintenanceDate) {
      Alert.alert(t('validation.required'), t('addItem.missingDate'));
      return;
    }
    if (!frequency || !frequency.trim()) {
      Alert.alert(t('validation.required'), t('addItem.missingFrequency'));
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
        Alert.alert(t('common.error'), t('addItem.updateError'));
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
      Alert.alert(t('common.error'), t('addItem.addError'));
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

  // DatePicker styles for dark mode support
  const datePickerStyles = useMemo(() => ({
    // Day labels (the numbers in the calendar)
    day_label: {
      color: colors.text,
    },
    // Today's date styling
    today: {
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
    },
    today_label: {
      color: colors.primary,
      fontWeight: '600',
    },
    // Selected date styling
    selected: {
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    selected_label: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    // Days outside current month
    outside_label: {
      color: colors.textMuted,
    },
    // Disabled days
    disabled_label: {
      color: colors.textMuted,
      opacity: 0.5,
    },
    // Header month/year selectors
    month_selector_label: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 16,
    },
    year_selector_label: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 16,
    },
    // Weekday labels (Mon, Tue, etc.)
    weekday_label: {
      color: colors.textSecondary,
      fontSize: 12,
      textTransform: 'uppercase',
    },
    // Month grid items
    month: {
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
    },
    month_label: {
      color: colors.text,
    },
    selected_month: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    selected_month_label: {
      color: '#FFFFFF',
    },
    // Year grid items
    year: {
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
    },
    year_label: {
      color: colors.text,
    },
    selected_year: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    selected_year_label: {
      color: '#FFFFFF',
    },
    active_year: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primaryLight,
    },
    active_year_label: {
      color: colors.primary,
    },
  }), [colors]);

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
    datePickerContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
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
            label={t('addItem.itemName')}
            placeholder={t('addItem.itemNamePlaceholder')}
            value={name}
            onChangeText={setName}
          />

          <CategoryPicker
            label={t('addItem.category')}
            selectedCategory={category}
            onSelect={setCategory}
          />

          <TextInput
            label={t('addItem.notesOptional')}
            placeholder={t('addItem.notesPlaceholder')}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />

          <View style={styles.dateInputContainer}>
            <Text style={styles.label}>{t('addItem.lastMaintenanceDate')}</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Text style={styles.dateText}>
                {lastMaintenanceDate
                  ? dayjs(lastMaintenanceDate).format('MMM D, YYYY')
                  : t('addItem.selectDate')}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <View style={styles.datePickerContainer}>
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
                styles={datePickerStyles}
              />
            </View>
          )}

          <TextInput
            label={t('addItem.maintenanceFrequency')}
            placeholder={t('addItem.frequencyPlaceholder')}
            value={frequency}
            onChangeText={setFrequency}
            keyboardType="numeric"
          />

          <Button
            title={isEditing ? t('addItem.saveChanges') : t('addItem.addItemButton')}
            onPress={handleAddItem}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddItemScreen;

