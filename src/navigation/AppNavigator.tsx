import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import getItems from '../services/getItems'; 
import auth from '@react-native-firebase/auth';
import IntroScreen from '../screens/IntroScreen';
import ItemDashboard from '../screens/ItemDashboard';
import AddItem from '../screens/AddItem';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [hasItems, setHasItems] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkItems = async () => {
      try {
        const uid = auth().currentUser?.uid;
        if (!uid) {
          setHasItems(false);
          return;
        }
        const items = await getItems(uid);
        setHasItems(items.length > 0);
      } catch (error) {
        console.error('Error fetching items:', error);
        setHasItems(false);
      } finally { 
        setLoading(false);
      }
    };
    checkItems();
  }, []);
  
  if (loading) return null; // or a loading splash or loader component
 
    return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
  <Stack.Screen
    name="Home"
    component={hasItems ? ItemDashboard : IntroScreen}
  />
  <Stack.Screen name="AddItem" component={AddItem} />
</Stack.Navigator>

  );
}