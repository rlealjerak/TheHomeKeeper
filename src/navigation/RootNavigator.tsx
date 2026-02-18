import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import EmailVerification from '../screens/EmailVerification';
import { colors } from '../theme/colors';

// Check if user signed in via Google
const isGoogleUser = (user: FirebaseAuthTypes.User | null): boolean => {
  if (!user) return false;
  return user.providerData.some(provider => provider.providerId === 'google.com');
};

// Root navigator - handles auth state and email verification
export default function RootNavigator() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      if (__DEV__) {
        console.log('[RootNavigator] Auth state changed:', currentUser?.uid || 'signed out');
      }

      if (currentUser) {
        const googleUser = isGoogleUser(currentUser);
        setIsGoogleAuth(googleUser);
        setEmailVerified(currentUser.emailVerified);

        // Check Firestore for auth provider if not determined by providerData
        if (!googleUser) {
          try {
            const doc = await firestore().collection('users').doc(currentUser.uid).get();
            if (doc.exists && doc.data()?.authProvider === 'google') {
              setIsGoogleAuth(true);
            }
          } catch (error) {
            // Fallback failed
          }
        }

        if (__DEV__) {
          console.log('[RootNavigator] isGoogleAuth:', googleUser);
          console.log('[RootNavigator] emailVerified:', currentUser.emailVerified);
        }
      } else {
        setIsGoogleAuth(false);
        setEmailVerified(false);
      }

      setUser(currentUser);

      if (initializing) {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, [initializing]);

  // Periodic check for email verification (for users on verification screen)
  useEffect(() => {
    if (!user || isGoogleAuth || emailVerified) {
      return;
    }

    if (__DEV__) {
      console.log('[RootNavigator] Starting email verification polling...');
    }

    const interval = setInterval(async () => {
      try {
        await auth().currentUser?.reload();
        const refreshedUser = auth().currentUser;

        if (refreshedUser?.emailVerified) {
          if (__DEV__) {
            console.log('[RootNavigator] Email verified via polling!');
          }
          setEmailVerified(true);
          setUser({ ...refreshedUser } as FirebaseAuthTypes.User);

          // Update Firestore
          try {
            await firestore().collection('users').doc(refreshedUser.uid).update({
              emailVerified: true,
            });
          } catch (e) {
            // Non-critical
          }
        }
      } catch (error) {
        // Silent fail
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, isGoogleAuth, emailVerified]);

  // Callback for when email verification is confirmed
  const handleVerified = useCallback(async () => {
    if (__DEV__) {
      console.log('[RootNavigator] handleVerified called');
    }

    // Reload user and update state
    try {
      await auth().currentUser?.reload();
      const refreshedUser = auth().currentUser;

      if (refreshedUser?.emailVerified) {
        setEmailVerified(true);
        setUser({ ...refreshedUser } as FirebaseAuthTypes.User);
        // Force re-render
        setRefreshKey(prev => prev + 1);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[RootNavigator] Error in handleVerified:', error);
      }
    }
  }, []);

  // Loading screen
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Logged in - check verification
  const needsVerification = !isGoogleAuth && !emailVerified;

  if (__DEV__) {
    console.log('[RootNavigator] Rendering:', {
      isGoogleAuth,
      emailVerified,
      needsVerification,
      refreshKey,
    });
  }

  // Show verification screen or app
  if (needsVerification) {
    return (
      <NavigationContainer key={`verification-${refreshKey}`}>
        <EmailVerification onVerified={handleVerified} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer key={`app-${refreshKey}`}>
      <AppNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
