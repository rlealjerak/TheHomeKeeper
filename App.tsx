import React, { useEffect } from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import BootSplash from "react-native-bootsplash";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';
import { ThemeProvider } from './src/contexts/ThemeContext';

export default function App() {
  useEffect(() => {
    BootSplash.hide({ fade: true });
  }, []);

  // Handle notification events (foreground)
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('User pressed notification:', detail.notification);
        // Note: Deep linking to specific item would require navigation ref
        // For now, just log the event
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle notification events (background/quit state)
  useEffect(() => {
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('User pressed notification in background:', detail.notification);
      }
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


    