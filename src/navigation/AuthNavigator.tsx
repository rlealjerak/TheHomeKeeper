import React from 'react';
import SignIn from '../screens/SignIn';
import SignUp from '../screens/SignUp';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator(); 

export default function AuthNavigator(){ 
    return (
    <Stack.Navigator initialRouteName="SignUp" screenOptions={{ headerShown: false }}> 
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="SignIn" component={SignIn} />
    </Stack.Navigator>
  );
}
