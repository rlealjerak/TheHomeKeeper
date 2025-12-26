import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'; // Import firestore
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

const SignIn = ({ navigation }) => {
  const [identifier, setIdentifier] = useState(''); // This can be email or username
  const [password, setPassword] = useState('');

  // Function to validate if the input looks like an email
  const isEmail = (input) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

  const handleSignIn = async () => {
    try {
      let emailToSignInWith = identifier;

      // If the identifier is not an email, assume it's a username and look up the email
      if (!isEmail(identifier)) {
        const usersRef = firestore().collection('users');
        const querySnapshot = await usersRef.where('username', '==', identifier).limit(1).get();

        if (querySnapshot.empty) {
          Alert.alert('Sign-In Error', 'No user found with that username.');
          return;
        }

        // Assuming you store the email in the user's document in Firestore
        // You might need to add email to your user document during sign-up if you haven't
        const userData = querySnapshot.docs[0].data();
        if (!userData.email) {
          Alert.alert('Sign-In Error', 'Email not found for this username. Please sign in with email.');
          return;
        }
        emailToSignInWith = userData.email;
        console.log(`Username '${identifier}' mapped to email: ${emailToSignInWith}`);
      }

      const userCredential = await auth().signInWithEmailAndPassword(emailToSignInWith, password);
      console.log('User signed in successfully:', userCredential.user.uid);
      // You can navigate to another screen upon successful sign-in
      // For example: navigation.navigate('HomeScreen');
    } catch (error) {
      let errorMessage = 'An unexpected error occurred during sign-in.';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'The provided identifier (email or username) is invalid or not registered.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This user account has been disabled.';
          break;
        case 'auth/user-not-found':
          // This case might still occur if an email was provided but not found
          errorMessage = 'No user found with this email or username.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
        default:
          console.error('Error signing in:', error);
          errorMessage = 'Failed to sign in. Please try again.';
          break;
      }
      Alert.alert('Sign-In Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        style={styles.input}
        placeholder="Email or Username" // Updated placeholder
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign In" onPress={handleSignIn} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});

export default SignIn;
