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
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { signInWithGoogle } from '../services/googleAuth';
import { findEmailByUsername } from '../services/usernameService';

// Redesigned components
import AuthScreenWrapper from '../components/AuthScreenWrapper';
import AnimatedLogo from '../components/AnimatedLogo';
import FloatingLabelInput from '../components/FloatingLabelInput';
import GradientButton from '../components/GradientButton';
import AuthDivider from '../components/AuthDivider';
import { SocialButton } from '../components/SocialButton';

// Sign In screen
const SignIn = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Animation
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;

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

  // Check if input looks like an email
  const isEmail = (input) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  const handleIdentifierChange = (text) => {
    setIdentifier(text);
    if (errors.identifier) {
      setErrors(prev => ({ ...prev, identifier: null }));
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: null }));
    }
  };

  // Handle sign in
  const handleSignIn = async () => {
    setErrors({});

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password;

    if (!trimmedIdentifier) {
      setErrors({ identifier: t('validation.enterEmailOrUsername') });
      return;
    }
    if (!trimmedPassword) {
      setErrors({ password: t('validation.enterPassword') });
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      let emailToSignInWith = trimmedIdentifier;
      let authProvider = null;

      // Determine if input is email or username
      if (isEmail(trimmedIdentifier)) {
        // Input is an email
        emailToSignInWith = trimmedIdentifier.toLowerCase();
        if (__DEV__) {
          console.log('[SignIn] Using email:', emailToSignInWith);
        }
      } else {
        // Input is a username - look up the email
        if (__DEV__) {
          console.log('[SignIn] Looking up username:', trimmedIdentifier);
        }

        const userLookup = await findEmailByUsername(trimmedIdentifier);

        if (__DEV__) {
          console.log('[SignIn] Username lookup result:', JSON.stringify(userLookup));
        }

        if (!userLookup.found) {
          setErrors({ identifier: t('validation.usernameNotFound') });
          setLoading(false);
          return;
        }

        if (!userLookup.email) {
          Alert.alert(
            t('common.error'),
            'Account found but no email associated. Please sign in with Google.'
          );
          setLoading(false);
          return;
        }

        emailToSignInWith = userLookup.email;
        authProvider = userLookup.authProvider;

        if (__DEV__) {
          console.log('[SignIn] Found email:', emailToSignInWith);
          console.log('[SignIn] Auth provider:', authProvider);
        }

        // Check if this is a Google-only account
        if (authProvider === 'google') {
          Alert.alert(
            t('common.error'),
            t('validation.useGoogleSignIn')
          );
          setLoading(false);
          return;
        }
      }

      // Attempt Firebase Auth sign-in
      if (__DEV__) {
        console.log('[SignIn] Attempting Firebase sign-in with:', emailToSignInWith);
      }

      await auth().signInWithEmailAndPassword(emailToSignInWith, trimmedPassword);

      if (__DEV__) {
        console.log('[SignIn] Success!');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[SignIn] Firebase error:', error.code, error.message);
      }

      let errorMessage = t('validation.unknownError');

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = t('validation.invalidEmail');
          break;
        case 'auth/user-disabled':
          errorMessage = t('validation.userDisabled');
          break;
        case 'auth/user-not-found':
          errorMessage = t('validation.userNotFound');
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          // Check if this might be a Google-only account
          try {
            const methods = await auth().fetchSignInMethodsForEmail(identifier.trim().toLowerCase());
            if (__DEV__) {
              console.log('[SignIn] Sign-in methods for email:', methods);
            }
            if (methods.includes('google.com') && !methods.includes('password')) {
              errorMessage = t('validation.useGoogleSignIn');
            } else {
              errorMessage = t('validation.invalidCredentials');
            }
          } catch {
            errorMessage = t('validation.invalidCredentials');
          }
          break;
        case 'auth/too-many-requests':
          errorMessage = t('validation.tooManyAttempts');
          break;
        case 'auth/network-request-failed':
          errorMessage = t('validation.networkError');
          break;
      }

      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    if (googleLoading || loading) return;
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();

      if (!result.success && result.error !== 'cancelled') {
        if (__DEV__) {
          console.error('[SignIn] Google error:', result.error);
        }
        Alert.alert(t('common.error'), t('validation.googleAuthError'));
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[SignIn] Google exception:', error);
      }
      Alert.alert(t('common.error'), t('validation.googleAuthError'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const styles = StyleSheet.create({
    logoContainer: {
      alignItems: 'center',
      paddingTop: 40,
      paddingBottom: 40,
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
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: -8,
      marginBottom: 20,
      paddingVertical: 4,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
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
  });

  return (
    <AuthScreenWrapper>
      <View style={styles.logoContainer}>
        <AnimatedLogo size="large" showTagline={true} />
      </View>

      <Animated.View
        style={[
          styles.formCard,
          {
            opacity: formOpacity,
            transform: [{ translateY: formTranslateY }],
          },
        ]}
      >
        <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
        <Text style={styles.subtitle}>{t('auth.signInToContinue')}</Text>

        <FloatingLabelInput
          label={t('auth.emailOrUsername')}
          value={identifier}
          onChangeText={handleIdentifierChange}
          icon="mail"
          keyboardType="default"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.identifier}
        />

        <FloatingLabelInput
          label={t('auth.password')}
          value={password}
          onChangeText={handlePasswordChange}
          icon="lock"
          secureTextEntry
          showPasswordToggle
          error={errors.password}
        />

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
        </TouchableOpacity>

        <GradientButton
          title={t('auth.signIn')}
          onPress={handleSignIn}
          loading={loading}
          disabled={loading || googleLoading}
        />

        <AuthDivider text={t('common.or')} />

        <SocialButton
          provider="google"
          title={t('auth.continueWithGoogle')}
          onPress={handleGoogleSignIn}
          loading={googleLoading}
          disabled={loading}
        />
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SignUp')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.footerLink}>{t('auth.signUp')}</Text>
        </TouchableOpacity>
      </View>
    </AuthScreenWrapper>
  );
};

export default SignIn;
