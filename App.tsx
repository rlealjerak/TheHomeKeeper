import React, { useEffect } from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import BootSplash from "react-native-bootsplash";

export default function App() {
  useEffect(() => { 
    BootSplash.hide({ fade: true}); 
}, []);
  return <RootNavigator />;
}


    