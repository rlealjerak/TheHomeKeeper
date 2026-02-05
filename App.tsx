import React, { useEffect } from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import BootSplash from "react-native-bootsplash";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';
import { ThemeProvider } from './src/contexts/ThemeContext';
// Initialize i18n - must be imported before any component that uses translations
import './src/i18n';
// Initialize Google Sign-In configuration
import { configureGoogleSignIn } from './src/services/googleAuth';

export default function App() {
  // Initialize Google Sign-In on app startup
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  useEffect(() => {
    BootSplash.hide({ fade: true });
  }, []);

  // Handle notification events (foreground)
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        // Notification pressed - deep linking to specific item would require navigation ref
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle notification events (background/quit state)
  useEffect(() => {
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      // Background notification handler
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}


    