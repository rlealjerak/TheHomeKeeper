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
import { validateEmailFormat, validateEmailDomain } from '../utils/emailValidation';
import { signInWithGoogle } from '../services/googleAuth';
import { sendEmailVerification } from '../services/emailVerification';

// New redesigned components
import AuthScreenWrapper from '../components/AuthScreenWrapper';
import AnimatedLogo from '../components/AnimatedLogo';
import FloatingLabelInput from '../components/FloatingLabelInput';
import GradientButton from '../components/GradientButton';
import AuthDivider from '../components/AuthDivider';
import { SocialButton } from '../components/SocialButton';

const SignUpScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [validatingEmail, setValidatingEmail] = useState(false);
  const [errors, setErrors] = useState({});

  // Staggered animation for form elements
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle Google Sign-In (also works for sign-up)
  const handleGoogleSignIn = async () => {
    if (googleLoading || loading || validatingEmail) return;
    setGoogleLoading(true);

    const result = await signInWithGoogle();

    if (!result.success) {
      if (result.error !== 'cancelled') {
        Alert.alert(t('common.error'), t('validation.googleAuthError'));
      }
    }
    setGoogleLoading(false);
  };

  // Clear error when field changes
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate email when user leaves the field
  const handleEmailBlur = () => {
    if (!email.trim()) return;

    const result = validateEmailFormat(email);
    if (!result.valid) {
      setErrors(prev => ({
        ...prev,
        email: result.error || t('validation.invalidEmail'),
        emailSuggestion: result.suggestion,
      }));
    }
  };

  // Apply email suggestion
  const applySuggestion = () => {
    if (errors.emailSuggestion) {
      setEmail(errors.emailSuggestion);
      setErrors(prev => ({ ...prev, email: null, emailSuggestion: null }));
    }
  };

  // Function to handle sign up with email and password
  const handleSignUp = async () => {
    // Clear previous errors
    setErrors({});

    // Validation
    const newErrors = {};
    if (!name.trim()) newErrors.name = t('validation.enterFirstName');
    if (!lastName.trim()) newErrors.lastName = t('validation.enterLastName');
    if (!username.trim()) newErrors.username = t('validation.chooseUsername');
    if (!email.trim()) newErrors.email = t('validation.enterEmail');
    if (!password.trim()) newErrors.password = t('validation.createPasswordRequired');
    if (password.trim() && password.length < 6) newErrors.password = t('validation.weakPassword');

    // Email format validation
    if (email.trim() && !newErrors.email) {
      const formatResult = validateEmailFormat(email);
      if (!formatResult.valid) {
        newErrors.email = formatResult.error || t('validation.invalidEmail');
        if (formatResult.suggestion) {
          newErrors.emailSuggestion = formatResult.suggestion;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (loading || validatingEmail) return;

    // Validate email domain (MX check)
    setValidatingEmail(true);
    const domainResult = await validateEmailDomain(email);
    setValidatingEmail(false);

    if (!domainResult.valid) {
      setErrors({ email: domainResult.error || t('validation.invalidEmail') });
      return;
    }

    setLoading(true);

    try {
      // Check if username is already taken
      const usersRef = firestore().collection('users');
      const usernameQuery = await usersRef.where('username', '==', username).limit(1).get();

      if (!usernameQuery.empty) {
        setErrors({ username: t('validation.usernameTaken') });
        setLoading(false);
        return;
      }

      // Create user account
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const uid = userCredential.user.uid;

      // Store user information in Firestore
      await firestore().collection('users').doc(uid).set({
        name,
        lastName,
        username,
        email,
        authProvider: 'password',
        emailVerified: false,
        hasOnboarded: false,
        createdAt: new Date(),
      });

      // Send email verification
      const verificationResult = await sendEmailVerification();
      if (verificationResult.success && !verificationResult.alreadyVerified) {
        Alert.alert(
          t('validation.verifyEmailTitle'),
          t('validation.verifyEmailMessage'),
          [{ text: t('common.ok') }]
        );
      }

      // Navigation handled by RootNavigator's onAuthStateChanged
    } catch (error) {
      let errorMessage = t('validation.unknownError');
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('validation.emailInUse');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('validation.invalidEmail');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('validation.weakPassword');
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = t('validation.networkError');
      }
      Alert.alert(t('validation.signUpError'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    logoContainer: {
      alignItems: 'center',
      paddingTop: 24,
      paddingBottom: 24,
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
      marginBottom: 24,
      textAlign: 'center',
    },
    nameRow: {
      flexDirection: 'row',
      marginHorizontal: -6,
    },
    nameField: {
      flex: 1,
      marginHorizontal: 6,
    },
    suggestionButton: {
      marginTop: -12,
      marginBottom: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: colors.primaryLight,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    suggestionText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    suggestionEmail: {
      color: colors.primary,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 28,
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
        <Text style={styles.title}>{t('auth.createAccount')}</Text>
        <Text style={styles.subtitle}>{t('auth.signUpToStart')}</Text>

        {/* Name Fields Row */}
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <FloatingLabelInput
              label={t('auth.firstName')}
              value={name}
              onChangeText={(text) => { setName(text); clearError('name'); }}
              icon="user"
              autoCapitalize="words"
              error={errors.name}
            />
          </View>
          <View style={styles.nameField}>
            <FloatingLabelInput
              label={t('auth.lastName')}
              value={lastName}
              onChangeText={(text) => { setLastName(text); clearError('lastName'); }}
              icon="user"
              autoCapitalize="words"
              error={errors.lastName}
            />
          </View>
        </View>

        <FloatingLabelInput
          label={t('auth.username')}
          value={username}
          onChangeText={(text) => { setUsername(text.toLowerCase()); clearError('username'); }}
          icon="at-sign"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.username}
        />

        <FloatingLabelInput
          label={t('auth.email')}
          value={email}
          onChangeText={(text) => { setEmail(text); clearError('email'); }}
          onBlur={handleEmailBlur}
          icon="mail"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
        />

        {errors.emailSuggestion && (
          <TouchableOpacity onPress={applySuggestion} style={styles.suggestionButton}>
            <Text style={styles.suggestionText}>
              {t('validation.tapToUse')} <Text style={styles.suggestionEmail}>{errors.emailSuggestion}</Text>
            </Text>
          </TouchableOpacity>
        )}

        <FloatingLabelInput
          label={t('auth.password')}
          value={password}
          onChangeText={(text) => { setPassword(text); clearError('password'); }}
          icon="lock"
          secureTextEntry
          showPasswordToggle
          error={errors.password}
        />

        <GradientButton
          title={validatingEmail ? t('validation.validatingEmail') : t('auth.signUp')}
          onPress={handleSignUp}
          loading={loading || validatingEmail}
          disabled={loading || validatingEmail || googleLoading}
        />

        <AuthDivider text={t('common.or')} />

        <SocialButton
          provider="google"
          title={t('auth.continueWithGoogle')}
          onPress={handleGoogleSignIn}
          loading={googleLoading}
          disabled={loading || validatingEmail}
        />
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('auth.hasAccount')}</Text>
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

export default SignUpScreen;
