import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import EmailVerification from '../screens/EmailVerification';
import { colors } from '../theme/colors';

export default function RootNavigator(){
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [emailVerified, setEmailVerified] = useState(false);
    const [authProvider, setAuthProvider] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Check email verification status
                setEmailVerified(currentUser.emailVerified);

                // Get auth provider from Firestore to know if user signed up via Google
                try {
                    const userDoc = await firestore()
                        .collection('users')
                        .doc(currentUser.uid)
                        .get();

                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        setAuthProvider(userData?.authProvider || 'password');
                    } else {
                        setAuthProvider('password');
                    }
                } catch (error) {
                    setAuthProvider('password');
                }
            } else {
                setEmailVerified(false);
                setAuthProvider(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Periodically check if email has been verified (for email/password users)
    useEffect(() => {
        if (!user || emailVerified || authProvider === 'google') return;

        const interval = setInterval(async () => {
            try {
                await user.reload();
                const refreshedUser = auth().currentUser;
                if (refreshedUser?.emailVerified) {
                    setEmailVerified(true);
                }
            } catch (error) {
                // Silent fail - user might have signed out
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [user, emailVerified, authProvider]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Determine which screen to show
    const renderContent = () => {
        if (!user) {
            // Not logged in - show auth screens
            return <AuthNavigator />;
        }

        // User is logged in
        // Google users are pre-verified, skip verification screen
        if (authProvider === 'google') {
            return <AppNavigator />;
        }

        // Email/password users must verify their email
        if (!emailVerified) {
            return <EmailVerification />;
        }

        // Verified user - show main app
        return <AppNavigator />;
    };

    return (
        <NavigationContainer>
            {renderContent()}
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
