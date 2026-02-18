import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { sendEmailVerification } from '../services/emailVerification';

// Screen shown when user is logged in but email is not verified
const EmailVerification = ({ onVerified }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const user = auth().currentUser;
  const email = user?.email || '';

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Resend verification email
  const handleResendEmail = async () => {
    if (sending || cooldown > 0) return;

    setSending(true);
    const result = await sendEmailVerification();
    setSending(false);

    if (result.success) {
      setCooldown(60);
      Alert.alert(
        t('emailVerification.emailSent'),
        t('emailVerification.checkInbox')
      );
    } else if (result.alreadyVerified) {
      // Email is already verified, trigger navigation
      if (onVerified) {
        onVerified();
      }
    } else {
      Alert.alert(t('common.error'), t('emailVerification.sendFailed'));
    }
  };

  // Check if email is now verified
  const handleCheckVerification = async () => {
    if (checking) return;

    setChecking(true);
    try {
      // Reload user to get fresh data from Firebase
      await auth().currentUser?.reload();
      const updatedUser = auth().currentUser;

      if (__DEV__) {
        console.log('[EmailVerification] After reload, emailVerified:', updatedUser?.emailVerified);
      }

      if (updatedUser?.emailVerified) {
        // Update Firestore
        try {
          await firestore().collection('users').doc(updatedUser.uid).update({
            emailVerified: true,
          });
        } catch (e) {
          // Non-critical
        }

        // Notify parent that verification is complete
        if (onVerified) {
          onVerified();
        } else {
          // Fallback: Show success and the polling will catch it
          Alert.alert(
            t('emailVerification.verified'),
            t('emailVerification.verifiedMessage')
          );
        }
      } else {
        Alert.alert(
          t('emailVerification.notVerified'),
          t('emailVerification.notVerifiedMessage')
        );
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[EmailVerification] Error:', error);
      }
      Alert.alert(t('common.error'), t('validation.unknownError'));
    } finally {
      setChecking(false);
    }
  };

  // Sign out and go back to auth screens
  const handleSignOut = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.logoutError'));
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 8,
    },
    email: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 32,
    },
    buttonContainer: {
      width: '100%',
      marginBottom: 16,
    },
    secondaryButton: {
      marginTop: 12,
    },
    signOutContainer: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    signOutText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    signOutLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginTop: 24,
      borderWidth: 1,
      borderColor: colors.border,
      width: '100%',
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="mail" size={56} color={colors.primary} />
        </View>

        <Text style={styles.title}>{t('emailVerification.title')}</Text>
        <Text style={styles.subtitle}>{t('emailVerification.subtitle')}</Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.buttonContainer}>
          <Button
            title={checking ? t('emailVerification.checking') : t('emailVerification.checkButton')}
            onPress={handleCheckVerification}
            loading={checking}
            disabled={checking}
          />

          <Button
            title={
              cooldown > 0
                ? `${t('emailVerification.resendIn')} ${cooldown}s`
                : t('emailVerification.resendButton')
            }
            onPress={handleResendEmail}
            variant="outline"
            loading={sending}
            disabled={sending || cooldown > 0}
            style={styles.secondaryButton}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('emailVerification.didntReceive')}</Text>
          <Text style={styles.infoText}>{t('emailVerification.checkSpam')}</Text>
        </View>

        <View style={styles.signOutContainer}>
          <Text style={styles.signOutText}>{t('emailVerification.wrongEmail')}</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.signOutLink}>{t('emailVerification.signOutLink')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EmailVerification;
