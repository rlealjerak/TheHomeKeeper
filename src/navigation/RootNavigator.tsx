import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

export default function RootNavigator(){
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { 
        const unsubscribe = auth().onAuthStateChanged(currentUser => {
            setUser(currentUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    if (loading) return null; 

    return ( 
        <NavigationContainer>
            {user ? <AppNavigator/> : <AuthNavigator />}
        </NavigationContainer>
    )

    
}