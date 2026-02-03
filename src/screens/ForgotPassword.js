import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { Logo } from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

// Forgot Password screen - sends password reset email via Firebase Auth
const ForgotPassword = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Dynamic styles - must be defined before any return statements
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    formContainer: {
      marginTop: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 32,
      textAlign: 'center',
      lineHeight: 24,
    },
    backButton: {
      marginTop: 12,
    },
    successCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      marginVertical: 32,
      borderWidth: 1,
      borderColor: colors.border,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    successMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 8,
      textAlign: 'center',
    },
    email: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 16,
      textAlign: 'center',
    },
    successHint: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    resendButton: {
      marginTop: 12,
    },
  });

  // Validate email format
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Send password reset email
  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter your email address.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await auth().sendPasswordResetEmail(email);
      setEmailSent(true);
    } catch (error) {
      let errorMessage = 'Failed to send reset email. Please try again.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Logo size="medium" showTagline={false} />

          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We've sent password reset instructions to:
            </Text>
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.successHint}>
              Didn't receive the email? Check your spam folder or try again.
            </Text>
          </View>

          <Button
            title="Back to Sign In"
            onPress={() => navigation.navigate('SignIn')}
          />

          <Button
            title="Resend Email"
            variant="outline"
            onPress={() => setEmailSent(false)}
            style={styles.resendButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Logo size="medium" showTagline={false} />

          <View style={styles.formContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>

            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />

            <Button
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
            />

            <Button
              title="Back to Sign In"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


export default ForgotPassword;
