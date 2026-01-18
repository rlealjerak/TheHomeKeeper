import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import IntroScreen from '../screens/IntroScreen';
import ItemDashboard from '../screens/ItemDashboard';
import AddItem from '../screens/AddItem';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [uid, setUid] = useState<string | null>(null);
  const [hasItems, setHasItems] = useState(false);
  const [ready, setReady] = useState(false);

  // Get uid (on cold start currentUser can be null briefly; RootNavigator already gates auth,
  // but this is still safer than relying on a single synchronous read)
  useEffect(() => {
    const unsub = auth().onAuthStateChanged(user => {
      setUid(user?.uid ?? null);
    });
    return unsub;
  }, []);

  // Listen for items + mark ready after first result
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = firestore()
      .collection('items')
      .where('uid', '==', uid)
      .onSnapshot(
        snapshot => {
          setHasItems(snapshot.size > 0);
          setReady(true);
        },
        error => {
          console.error('Error checking items:', error);
          setHasItems(false);
          setReady(true);
        }
      );

    return unsubscribe;
  }, [uid]);

  if (!ready) return null; // swap for a Splash component later

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasItems ? 'ItemDashboard' : 'Intro'}
    >
      <Stack.Screen name="Intro" component={IntroScreen} />
      <Stack.Screen name="ItemDashboard" component={ItemDashboard} />
      <Stack.Screen name="AddItem" component={AddItem} />
    </Stack.Navigator>
  );
}
