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
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/Feather';
import { Button } from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage, getCurrentLanguage } from '../i18n';
import {
  requestNotificationPermission,
  cancelAllNotifications,
  getScheduledNotifications
} from '../services/notificationService';

// Settings screen component - displays user profile and logout functionality
const Settings = ({ navigation }) => {
  const { colors, themeMode, setTheme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const currentLanguage = getCurrentLanguage();

  // Handle language change
  const handleLanguageChange = async (langCode) => {
    await changeLanguage(langCode);
    setLanguageModalVisible(false);
  };

  // Get current language display name
  const getCurrentLanguageName = () => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage);
    return lang ? lang.nativeName : 'English';
  };

  // Dynamic styles based on theme - must be inside component to access colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
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
    languageButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    languageButtonText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    languageValue: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    languageValueText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginRight: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '85%',
      maxWidth: 340,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    languageOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    languageOptionActive: {
      backgroundColor: colors.primaryLight,
    },
    languageOptionText: {
      fontSize: 16,
      color: colors.text,
    },
    languageOptionNative: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    modalCloseButton: {
      marginTop: 16,
    },
    legalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
    },
    legalRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    legalRowText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    versionText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 16,
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
        // Failed to load notification preference
      }
    };
    loadNotificationPreference();
  }, []);

  // Handles user logout with confirmation dialog
  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
              // RootNavigator's onAuthStateChanged will handle navigation
            } catch (err) {
              Alert.alert(
                t('common.error'),
                t('settings.logoutError'),
                [{ text: t('common.ok') }]
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
            t('settings.permissionDenied'),
            t('settings.enableNotifications'),
            [{ text: t('common.ok') }]
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
      Alert.alert(t('common.error'), t('settings.notificationError'));
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
            <Button title={t('common.retry')} onPress={handleRetry} />
            <Button
              title={t('common.back')}
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Text style={styles.sectionHeader}>{t('settings.profile')}</Text>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>{t('settings.fullName')}</Text>
          <Text style={styles.profileValue}>
            {userData?.name || 'N/A'} {userData?.lastName || ''}
          </Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>{t('settings.username')}</Text>
          <Text style={styles.profileValue}>
            @{userData?.username || 'N/A'}
          </Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>{t('settings.email')}</Text>
          <Text style={styles.profileValue}>{userData?.email || authEmail || 'N/A'}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>{t('settings.accountCreated')}</Text>
          <Text style={styles.profileValue}>
            {t('settings.memberSince')} {formatDate(userData?.createdAt)}
          </Text>
        </View>
      </View>

      {/* Theme Settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.sectionHeader}>{t('settings.appearance')}</Text>

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
              {t('settings.light')}
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
              {t('settings.dark')}
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
              {t('settings.auto')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification Settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.sectionHeader}>{t('settings.notifications')}</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>{t('settings.maintenanceReminders')}</Text>
            <Text style={styles.settingDescription}>
              {t('settings.notificationDesc')}
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

      {/* Language Settings */}
      <View style={styles.settingsCard}>
        <Text style={styles.sectionHeader}>{t('settings.language')}</Text>

        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setLanguageModalVisible(true)}
        >
          <Text style={styles.languageButtonText}>{t('settings.selectLanguage')}</Text>
          <View style={styles.languageValue}>
            <Text style={styles.languageValueText}>{getCurrentLanguageName()}</Text>
            <Icon name="chevron-right" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Legal Section */}
      <View style={styles.settingsCard}>
        <Text style={styles.sectionHeader}>{t('settings.legal')}</Text>

        <TouchableOpacity
          style={[styles.legalRow, styles.legalRowBorder]}
          onPress={() => Linking.openURL('https://thehomekeeper-175e2.web.app/privacy-policy')}
        >
          <Text style={styles.legalRowText}>{t('settings.privacyPolicy')}</Text>
          <Icon name="external-link" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.legalRow}
          onPress={() => Linking.openURL('https://thehomekeeper-175e2.web.app/terms-of-service')}
        >
          <Text style={styles.legalRowText}>{t('settings.termsOfService')}</Text>
          <Icon name="external-link" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Edit Profile Button */}
      <Button
        title={t('settings.editProfile')}
        variant="outline"
        onPress={() => navigation.navigate('EditProfile')}
        style={styles.editButton}
      />

      {/* Logout Button */}
      <Button title={t('settings.logout')} onPress={handleLogout} />

      {/* Version */}
      <Text style={styles.versionText}>{t('settings.version')} 1.0.0</Text>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>

            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLanguage === lang.code && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <View>
                  <Text style={styles.languageOptionText}>{lang.nativeName}</Text>
                  <Text style={styles.languageOptionNative}>{lang.name}</Text>
                </View>
                {currentLanguage === lang.code && (
                  <Icon name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <Button
              title={t('common.cancel')}
              variant="outline"
              onPress={() => setLanguageModalVisible(false)}
              style={styles.modalCloseButton}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default Settings;
