import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { PasswordInput } from '../components/PasswordInput';
import { Logo } from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const SignUpScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate email format
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Function to handle sign up with email and password
  const handleSignUp = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your first name.');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Required Field', 'Please enter your last name.');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Required Field', 'Please choose a username.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter your email.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Required Field', 'Please create a password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      // Check if username is already taken
      const usersRef = firestore().collection('users');
      const usernameQuery = await usersRef.where('username', '==', username).limit(1).get();

      if (!usernameQuery.empty) {
        Alert.alert('Username Taken', 'This username is already in use. Please choose another.');
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
        createdAt: new Date(),
      });

      console.log('User signed up successfully:', uid);
      // Navigation handled by RootNavigator's onAuthStateChanged
    } catch (error) {
      let errorMessage = 'An unexpected error occurred during sign-up.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'That email address is already in use!';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'That email address is invalid!';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Use at least 6 characters.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        console.error('Error signing up:', error);
      }
      Alert.alert('Sign-Up Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  nameGap: {
    width: 12,
  },
  halfInput: {
    flex: 1,
  },
  signUpButton: {
    marginTop: 8,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  signInText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  signInLink: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
});
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <Logo size="medium" showTagline={true} />
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>

            <View style={styles.nameRow}>
              <TextInput
                label="First Name"
                placeholder="First name"
                value={name}
                onChangeText={setName}
                style={styles.halfInput}
              />
              <View style={styles.nameGap} />
              <TextInput
                label="Last Name"
                placeholder="Last name"
                value={lastName}
                onChangeText={setLastName}
                style={styles.halfInput}
              />
            </View>

            <TextInput
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PasswordInput
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              showStrength={true}
            />

            <Button
              title="Sign Up"
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
              style={styles.signUpButton}
            />

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SignIn')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


export default SignUpScreen;
