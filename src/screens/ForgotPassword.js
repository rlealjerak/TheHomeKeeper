import auth from '@react-native-firebase/auth';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { validateEmailFormat } from '../utils/emailValidation';

// New redesigned components
import AuthScreenWrapper from '../components/AuthScreenWrapper';
import AnimatedLogo from '../components/AnimatedLogo';
import FloatingLabelInput from '../components/FloatingLabelInput';
import GradientButton from '../components/GradientButton';

// Forgot Password screen - sends password reset email via Firebase Auth
const ForgotPassword = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);

  // Staggered animation for form elements
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate success state
  useEffect(() => {
    if (emailSent) {
      Animated.parallel([
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(successScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [emailSent]);

  // Clear error when field changes
  const handleEmailChange = (text) => {
    setEmail(text);
    if (error) setError(null);
  };

  // Validate email when user leaves the field
  const handleEmailBlur = () => {
    if (!email.trim()) return;

    const result = validateEmailFormat(email);
    if (!result.valid) {
      setError(result.error || t('validation.invalidEmail'));
    }
  };

  // Send password reset email
  const handleResetPassword = async () => {
    // Clear previous error
    setError(null);

    if (!email.trim()) {
      setError(t('validation.enterEmail'));
      return;
    }

    const formatResult = validateEmailFormat(email);
    if (!formatResult.valid) {
      setError(formatResult.error || t('validation.invalidEmail'));
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      await auth().sendPasswordResetEmail(email);
      setEmailSent(true);
    } catch (err) {
      let errorMessage = t('validation.resetEmailFailed');

      if (err.code === 'auth/user-not-found') {
        errorMessage = t('validation.userNotFound');
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = t('validation.invalidEmail');
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = t('validation.networkError');
      }

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend - reset to form state
  const handleResend = () => {
    setEmailSent(false);
    successOpacity.setValue(0);
    successScale.setValue(0.8);
  };

  const styles = StyleSheet.create({
    logoContainer: {
      alignItems: 'center',
      paddingTop: 40,
      paddingBottom: 32,
    },
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
    },
    title: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 28,
      textAlign: 'center',
      lineHeight: 22,
    },
    backButton: {
      marginTop: 16,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 32,
      paddingBottom: 24,
    },
    footerText: {
      fontSize: 15,
      color: colors.textSecondary,
    },
    footerLink: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: '700',
      marginLeft: 4,
    },
    // Success state styles
    successCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
      alignItems: 'center',
    },
    successIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.success + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    successMessage: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 16,
      textAlign: 'center',
      lineHeight: 22,
    },
    emailText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 24,
      textAlign: 'center',
    },
    successHint: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    buttonSpacing: {
      marginTop: 12,
    },
  });

  // Success state view
  if (emailSent) {
    return (
      <AuthScreenWrapper>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <AnimatedLogo size="medium" showTagline={false} />
        </View>

        {/* Success Card */}
        <Animated.View
          style={[
            styles.successCard,
            {
              opacity: successOpacity,
              transform: [{ scale: successScale }],
            },
          ]}
        >
          <View style={styles.successIconContainer}>
            <Icon name="mail" size={36} color={colors.success} />
          </View>

          <Text style={styles.successTitle}>{t('auth.checkYourEmail')}</Text>
          <Text style={styles.successMessage}>
            {t('auth.resetEmailSent')}
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.successHint}>
            {t('auth.didntReceiveEmail')}
          </Text>

          <GradientButton
            title={t('auth.backToSignIn')}
            onPress={() => navigation.navigate('SignIn')}
          />

          <View style={styles.buttonSpacing}>
            <GradientButton
              title={t('auth.resendEmail')}
              variant="outline"
              onPress={handleResend}
            />
          </View>
        </Animated.View>
      </AuthScreenWrapper>
    );
  }

  // Form state view
  return (
    <AuthScreenWrapper>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <AnimatedLogo size="medium" showTagline={false} />
      </View>

      {/* Form Card */}
      <Animated.View
        style={[
          styles.formCard,
          {
            opacity: formOpacity,
            transform: [{ translateY: formTranslateY }],
          },
        ]}
      >
        <Text style={styles.title}>{t('auth.resetPassword')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.resetPasswordDesc')}
        </Text>

        <FloatingLabelInput
          label={t('auth.email')}
          value={email}
          onChangeText={handleEmailChange}
          onBlur={handleEmailBlur}
          icon="mail"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={error}
        />

        <GradientButton
          title={t('auth.sendResetLink')}
          onPress={handleResetPassword}
          loading={loading}
          disabled={loading}
        />

        <View style={styles.backButton}>
          <GradientButton
            title={t('auth.backToSignIn')}
            variant="outline"
            onPress={() => navigation.goBack()}
          />
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('auth.rememberPassword')}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SignIn')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.footerLink}>{t('auth.signIn')}</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenWrapper>
  );
};

export default ForgotPassword;
