import SignUp from './src/screens/SignUp';
import React from 'react';
import addItem from './src/services/addItems';
import getItems from './src/services/getItems';
/*import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignUp">
        <Stack.Screen name="SignUp" component={SignUpScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App; */

export default function App() {
  return <SignUp />;
}


    