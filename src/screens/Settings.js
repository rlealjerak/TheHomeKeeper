import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/Feather';
import { Button } from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';
import {
  requestNotificationPermission,
  cancelAllNotifications,
  getScheduledNotifications
} from '../services/notificationService';

// Settings screen component - displays user profile and logout functionality
const Settings = ({ navigation }) => {
  const { colors, themeMode, setTheme, isDark } = useTheme();

  // Dynamic styles based on theme - must be inside component to access colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: colors.text,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorText: {
      fontSize: 16,
      color: colors.error,
      marginBottom: 20,
      textAlign: 'center',
    },
    buttonContainer: {
      width: '100%',
      maxWidth: 300,
      gap: 12,
    },
    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: colors.text,
    },
    profileItem: {
      marginBottom: 12,
    },
    profileLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    profileValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    settingsCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    settingInfo: {
      flex: 1,
      marginRight: 16,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    themeOptions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    themeOptionActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    themeOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      marginTop: 8,
    },
    themeOptionTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    editButton: {
      marginBottom: 12,
    },
  });
  const [uid, setUid] = useState(null);
  const [authEmail, setAuthEmail] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Get current user's UID and email from Firebase Auth
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      setUid(currentUser.uid);
      setAuthEmail(currentUser.email); // Fallback email from Firebase Auth
    } else {
      setError('User not authenticated');
      setLoading(false);
      // Auto-logout if not authenticated
      setTimeout(() => {
        auth().signOut();
      }, 2000);
    }
  }, []);

  // Fetch user data from Firestore with real-time listener
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = firestore()
      .collection('users')
      .doc(uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setUserData(doc.data());
            setError(null);
          } else {
            setError('User profile not found');
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching user data:', err);
          setError('Failed to load user data');
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [uid]);

  // Load notification preference from AsyncStorage
  useEffect(() => {
    const loadNotificationPreference = async () => {
      try {
        const value = await AsyncStorage.getItem('notificationsEnabled');
        if (value !== null) {
          setNotificationsEnabled(value === 'true');
        }
      } catch (error) {
        console.error('Error loading notification preference:', error);
      }
    };
    loadNotificationPreference();
  }, []);

  // Handles user logout with confirmation dialog
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
              // RootNavigator's onAuthStateChanged will handle navigation
            } catch (err) {
              console.error('Logout error:', err);
              Alert.alert(
                'Logout Failed',
                'An error occurred while logging out. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Retry loading user data
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    const currentUser = auth().currentUser;
    if (currentUser) {
      setUid(currentUser.uid);
    }
  };

  // Toggle notifications
  const handleToggleNotifications = async (value) => {
    try {
      if (value) {
        // Request permission when enabling
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          Alert.alert(
            'Permission Denied',
            'Please enable notifications in your device settings to receive maintenance reminders.',
            [{ text: 'OK' }]
          );
          return;
        }
      } else {
        // Cancel all notifications when disabling
        await cancelAllNotifications();
      }

      setNotificationsEnabled(value);
      await AsyncStorage.setItem('notificationsEnabled', value.toString());
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.buttonContainer}>
            <Button title="Retry" onPress={handleRetry} />
            <Button
              title="Go Back"
              variant="secondary"
              onPress={() => navigation.goBack()}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Format account creation date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return dayjs(timestamp.toDate()).format('MMMM D, YYYY');
    } catch (err) {
      return 'N/A';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Text style={styles.sectionHeader}>Profile</Text>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Full Name</Text>
          <Text style={styles.profileValue}>
            {userData?.name || 'N/A'} {userData?.lastName || ''}
          </Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Username</Text>
          <Text style={styles.profileValue}>
            @{userData?.username || 'N/A'}
          </Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Email</Text>
          <Text style={styles.profileValue}>{userData?.email || authEmail || 'N/A'}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Account Created</Text>
          <Text style={styles.profileValue}>
            Member since {formatDate(userData?.createdAt)}
          </Text>
        </View>
      </View>

      {/* Theme Settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.sectionHeader}>Appearance</Text>

        <View style={styles.themeOptions}>
          <TouchableOpacity
            style={[
              styles.themeOption,
              themeMode === 'light' && styles.themeOptionActive,
            ]}
            onPress={() => setTheme('light')}
          >
            <Icon
              name="sun"
              size={24}
              color={themeMode === 'light' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.themeOptionText,
                themeMode === 'light' && styles.themeOptionTextActive,
              ]}
            >
              Light
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              themeMode === 'dark' && styles.themeOptionActive,
            ]}
            onPress={() => setTheme('dark')}
          >
            <Icon
              name="moon"
              size={24}
              color={themeMode === 'dark' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.themeOptionText,
                themeMode === 'dark' && styles.themeOptionTextActive,
              ]}
            >
              Dark
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              themeMode === 'auto' && styles.themeOptionActive,
            ]}
            onPress={() => setTheme('auto')}
          >
            <Icon
              name="smartphone"
              size={24}
              color={themeMode === 'auto' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.themeOptionText,
                themeMode === 'auto' && styles.themeOptionTextActive,
              ]}
            >
              Auto
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.sectionHeader}>Notifications</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Maintenance Reminders</Text>
            <Text style={styles.settingDescription}>
              Get notified before items need maintenance
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={notificationsEnabled ? colors.primary : colors.textMuted}
          />
        </View>
      </View>

      {/* Edit Profile Button */}
      <Button
        title="Edit Profile"
        variant="outline"
        onPress={() => navigation.navigate('EditProfile')}
        style={styles.editButton}
      />

      {/* Logout Button */}
      <Button title="Logout" onPress={handleLogout} />
    </SafeAreaView>
  );
};

export default Settings;
