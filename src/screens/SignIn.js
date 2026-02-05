import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
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

// New redesigned components
import AuthScreenWrapper from '../components/AuthScreenWrapper';
import AnimatedLogo from '../components/AnimatedLogo';
import FloatingLabelInput from '../components/FloatingLabelInput';
import GradientButton from '../components/GradientButton';
import AuthDivider from '../components/AuthDivider';
import { SocialButton } from '../components/SocialButton';

const SignIn = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Staggered animation for form elements
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

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    if (googleLoading || loading) return;
    setGoogleLoading(true);

    const result = await signInWithGoogle();

    if (!result.success) {
      if (result.error !== 'cancelled') {
        Alert.alert(t('common.error'), t('validation.googleAuthError'));
      }
    }
    setGoogleLoading(false);
  };

  // Validate if input looks like an email
  const isEmail = (input) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  // Clear error when user starts typing
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

  const handleSignIn = async () => {
    // Clear previous errors
    setErrors({});

    // Validation
    const newErrors = {};
    if (!identifier.trim()) {
      newErrors.identifier = t('validation.enterEmail');
    }
    if (!password.trim()) {
      newErrors.password = t('validation.enterPassword');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      let emailToSignInWith = identifier.trim();

      // If the identifier is not an email, assume it's a username and look up the email
      if (!isEmail(emailToSignInWith)) {
        // Usernames are stored in lowercase, so convert to lowercase for lookup
        const usernameToLookup = emailToSignInWith.toLowerCase();

        const usersRef = firestore().collection('users');
        const querySnapshot = await usersRef.where('username', '==', usernameToLookup).limit(1).get();

        if (querySnapshot.empty) {
          setErrors({ identifier: t('validation.usernameNotFound') });
          setLoading(false);
          return;
        }

        const userData = querySnapshot.docs[0].data();
        if (!userData.email) {
          setErrors({ identifier: t('validation.invalidCredentials') });
          setLoading(false);
          return;
        }
        emailToSignInWith = userData.email;
      }

      await auth().signInWithEmailAndPassword(emailToSignInWith, password);
      // Navigation handled by RootNavigator's onAuthStateChanged
    } catch (error) {
      let errorMessage = t('validation.unknownError');
      switch (error.code) {
        case 'auth/invalid-email':
        case 'auth/user-disabled':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = t('validation.invalidCredentials');
          break;
        case 'auth/network-request-failed':
          errorMessage = t('validation.networkError');
          break;
        default:
          break;
      }
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
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
      {/* Logo */}
      <View style={styles.logoContainer}>
        <AnimatedLogo size="large" showTagline={true} />
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
        <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
        <Text style={styles.subtitle}>{t('auth.signInToContinue')}</Text>

        <FloatingLabelInput
          label={t('auth.emailOrUsername')}
          value={identifier}
          onChangeText={handleIdentifierChange}
          icon="mail"
          keyboardType="email-address"
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

      {/* Footer */}
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
