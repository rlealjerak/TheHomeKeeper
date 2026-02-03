import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import Onboarding from '../screens/Onboarding';
import IntroScreen from '../screens/IntroScreen';
import ItemDashboard from '../screens/ItemDashboard';
import AddItem from '../screens/AddItem';
import Settings from '../screens/Settings';
import EditProfile from '../screens/EditProfile';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [uid, setUid] = useState<string | null>(null);
  const [hasItems, setHasItems] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [itemsLoaded, setItemsLoaded] = useState(false);

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
        console.error('Error checking onboarding status:', error);
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
          console.error('Error checking items:', error);
          setHasItems(false);
          setItemsLoaded(true);
        }
      );

    return unsubscribe;
  }, [uid]);

  // Complete onboarding callback - saves to Firestore (per-account)
  const handleOnboardingComplete = async () => {
    try {
      if (uid) {
        await firestore().collection('users').doc(uid).update({
          hasOnboarded: true,
        });
      }
      setHasOnboarded(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setHasOnboarded(true); // Still proceed even if save fails
    }
  };

  // Wait for onboarding check only (not items)
  if (hasOnboarded === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4A84B" />
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
        <ActivityIndicator size="large" color="#D4A84B" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasItems ? 'ItemDashboard' : 'Intro'}
    >
      <Stack.Screen name="Intro" component={IntroScreen} />
      <Stack.Screen name="ItemDashboard" component={ItemDashboard} />
      <Stack.Screen
        name="AddItem"
        component={AddItem}
        options={{
          headerShown: true,
          headerTitle: 'Add Item',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{
          headerShown: true,
          headerTitle: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{
          headerShown: true,
          headerTitle: 'Edit Profile',
          headerBackTitle: 'Back',
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
    backgroundColor: '#FAF8F5',
  },
});
