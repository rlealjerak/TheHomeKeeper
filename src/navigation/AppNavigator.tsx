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

// Main app navigator - handles onboarding, dashboard, and other authenticated screens
export default function AppNavigator() {
  const { t } = useTranslation();
  const [uid, setUid] = useState<string | null>(null);
  const [hasItems, setHasItems] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [comingFromOnboarding, setComingFromOnboarding] = useState(false);

  // Get uid
  useEffect(() => {
    const unsub = auth().onAuthStateChanged(user => {
      setUid(user?.uid ?? null);
    });
    return unsub;
  }, []);

  // Check if user has completed onboarding
  useEffect(() => {
    if (!uid) return;

    const checkOnboarding = async () => {
      try {
        const userDoc = await firestore().collection('users').doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setHasOnboarded(userData?.hasOnboarded === true);
        } else {
          setHasOnboarded(false);
        }
      } catch (error) {
        if (__DEV__) {
          console.log('[AppNavigator] Error checking onboarding:', error);
        }
        setHasOnboarded(false);
      }
    };
    checkOnboarding();
  }, [uid]);

  // Listen for items
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = firestore()
      .collection('items')
      .where('uid', '==', uid)
      .onSnapshot(
        snapshot => {
          setHasItems(snapshot.size > 0);
          setItemsLoaded(true);
        },
        error => {
          if (__DEV__) {
            console.log('[AppNavigator] Error loading items:', error);
          }
          setHasItems(false);
          setItemsLoaded(true);
        }
      );

    return unsubscribe;
  }, [uid]);

  // Complete onboarding
  const handleOnboardingComplete = async () => {
    try {
      if (uid) {
        await firestore().collection('users').doc(uid).update({
          hasOnboarded: true,
        });
      }
      setComingFromOnboarding(true);
      setHasOnboarded(true);
    } catch (error) {
      if (__DEV__) {
        console.log('[AppNavigator] Error saving onboarding status:', error);
      }
      setComingFromOnboarding(true);
      setHasOnboarded(true);
    }
  };

  // Loading states
  if (hasOnboarded === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!itemsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Determine initial route
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
