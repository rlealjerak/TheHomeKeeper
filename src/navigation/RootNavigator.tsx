import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import EmailVerification from '../screens/EmailVerification';
import { colors } from '../theme/colors';

// Check if user signed in via Google (using Firebase Auth provider data, not Firestore)
const isGoogleUser = (user: FirebaseAuthTypes.User | null): boolean => {
    if (!user) return false;
    return user.providerData.some(provider => provider.providerId === 'google.com');
};

export default function RootNavigator() {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            if (initializing) {
                setInitializing(false);
            }
        });

        return unsubscribe;
    }, [initializing]);

    // Periodically check if email has been verified (for email/password users waiting on verification screen)
    useEffect(() => {
        // Only run this check if user exists, is NOT a Google user, and email is NOT verified
        if (!user || isGoogleUser(user) || user.emailVerified) return;

        const interval = setInterval(async () => {
            try {
                await user.reload();
                // Force re-render by getting fresh user reference
                const refreshedUser = auth().currentUser;
                if (refreshedUser?.emailVerified) {
                    // Trigger state update to re-render with verified status
                    setUser({ ...refreshedUser } as FirebaseAuthTypes.User);
                }
            } catch (error) {
                // Silent fail - user might have signed out
            }
        }, 3000); // Check every 3 seconds

        return () => clearInterval(interval);
    }, [user]);

    if (initializing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Not logged in - show auth screens
    if (!user) {
        return (
            <NavigationContainer>
                <AuthNavigator />
            </NavigationContainer>
        );
    }

    // User is logged in - check verification status
    // Google users are pre-verified, skip verification screen
    const isGoogle = isGoogleUser(user);
    const needsVerification = !isGoogle && !user.emailVerified;

    return (
        <NavigationContainer>
            {needsVerification ? <EmailVerification /> : <AppNavigator />}
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
