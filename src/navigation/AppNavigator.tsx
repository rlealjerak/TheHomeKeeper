import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';

import Onboarding from '../screens/Onboarding';
import IntroScreen from '../screens/IntroScreen';
import ItemDashboard from '../screens/ItemDashboard';
import AddItem from '../screens/AddItem';
import Settings from '../screens/Settings';
import EditProfile from '../screens/EditProfile';
import MaintenanceHistory from '../screens/MaintenanceHistory';
import AllMaintenanceHistory from '../screens/AllMaintenanceHistory';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { t } = useTranslation();
  const [uid, setUid] = useState<string | null>(null);
  const [hasItems, setHasItems] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  // Track if user just completed onboarding (to skip IntroScreen and go to AddItem)
  const [comingFromOnboarding, setComingFromOnboarding] = useState(false);

  // Get uid
  useEffect(() => {
    const unsub = auth().onAuthStateChanged(user => {
      setUid(user?.uid ?? null);
    });
    return unsub;
  }, []);

  // Check if user has completed onboarding (stored per-account in Firestore)
  useEffect(() => {
    if (!uid) {
      // Wait for uid before checking onboarding status
      return;
    }

    const checkOnboarding = async () => {
      try {
        const userDoc = await firestore().collection('users').doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setHasOnboarded(userData?.hasOnboarded === true);
        } else {
          // User document doesn't exist yet, show onboarding
          setHasOnboarded(false);
        }
      } catch (error) {
        setHasOnboarded(false);
      }
    };
    checkOnboarding();
  }, [uid]);

  // Listen for items - wait for uid before marking as loaded
  useEffect(() => {
    if (!uid) {
      // Don't mark as loaded until we have a uid and can check Firestore
      return;
    }

    const unsubscribe = firestore()
      .collection('items')
      .where('uid', '==', uid)
      .onSnapshot(
        snapshot => {
          setHasItems(snapshot.size > 0);
          setItemsLoaded(true);
        },
        error => {
          setHasItems(false);
          setItemsLoaded(true);
        }
      );

    return unsubscribe;
  }, [uid]);

  // Complete onboarding callback - saves to Firestore (per-account)
  // Sets comingFromOnboarding flag so user goes directly to AddItem (not IntroScreen)
  const handleOnboardingComplete = async () => {
    try {
      if (uid) {
        await firestore().collection('users').doc(uid).update({
          hasOnboarded: true,
        });
      }
      setComingFromOnboarding(true); // Flag to skip IntroScreen
      setHasOnboarded(true);
    } catch (error) {
      setComingFromOnboarding(true);
      setHasOnboarded(true); // Still proceed even if save fails
    }
  };

  // Wait for onboarding check only (not items)
  if (hasOnboarded === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show onboarding if user hasn't completed it
  if (!hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Show loading while checking items (but only briefly)
  if (!itemsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Determine initial route:
  // - If user has items → ItemDashboard
  // - If coming from onboarding (first-time) → AddItem directly (skip IntroScreen)
  // - If returning user with 0 items → Intro (Welcome screen)
  const getInitialRoute = () => {
    if (hasItems) return 'ItemDashboard';
    if (comingFromOnboarding) return 'AddItem';
    return 'Intro';
  };

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={getInitialRoute()}
    >
      <Stack.Screen name="Intro" component={IntroScreen} />
      <Stack.Screen name="ItemDashboard" component={ItemDashboard} />
      <Stack.Screen
        name="AddItem"
        component={AddItem}
        options={({ route }) => ({
          headerShown: true,
          headerTitle: route.params?.item ? t('navigation.editItem') : t('navigation.addItem'),
          headerBackTitle: t('navigation.back'),
        })}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{
          headerShown: true,
          headerTitle: t('navigation.settings'),
          headerBackTitle: t('navigation.back'),
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{
          headerShown: true,
          headerTitle: t('navigation.editProfile'),
          headerBackTitle: t('navigation.back'),
        }}
      />
      <Stack.Screen
        name="MaintenanceHistory"
        component={MaintenanceHistory}
        options={{
          headerShown: true,
          headerTitle: t('history.title'),
          headerBackTitle: t('navigation.back'),
        }}
      />
      <Stack.Screen
        name="AllMaintenanceHistory"
        component={AllMaintenanceHistory}
        options={{
          headerShown: true,
          headerTitle: t('history.allHistory'),
          headerBackTitle: t('navigation.back'),
        }}
      />
    </Stack.Navigator>
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
