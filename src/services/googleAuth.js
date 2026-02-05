import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';
import { logError } from './errorLogging';

// Configure Google Sign-In - call this once at app startup
export const configureGoogleSignIn = () => {
  // Web Client ID from Firebase Console > Authentication > Sign-in method > Google
  const webClientId = '999583790732-321pt9to5398ejrahl1udnlo3kvs3csj.apps.googleusercontent.com';

  // iOS Client ID from GoogleService-Info.plist CLIENT_ID field
  // Format: {ID}.apps.googleusercontent.com (NOT reversed)
  // The reversed format (com.googleusercontent.apps.{ID}) is only for URL schemes in Info.plist
  const iosClientId = '999583790732-m1tbsm5p7o5nougdalg5hc58e5b0ptig.apps.googleusercontent.com';

  const config = {
    webClientId,
    offlineAccess: true,
  };

  // On iOS, we need to provide the iosClientId
  if (Platform.OS === 'ios') {
    config.iosClientId = iosClientId;
  }

  GoogleSignin.configure(config);
};

// Sign in with Google and authenticate with Firebase
export const signInWithGoogle = async () => {
  try {
    // Check Play Services only on Android
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    // Get the user's ID token
    const signInResult = await GoogleSignin.signIn();

    // Handle different response formats between library versions
    const idToken = signInResult.data?.idToken || signInResult.idToken;

    if (!idToken) {
      logError(new Error('No ID token in Google Sign-In result'), {
        signInResult: JSON.stringify(signInResult),
        platform: Platform.OS
      });
      throw new Error('No ID token found');
    }

    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential
    const userCredential = await auth().signInWithCredential(googleCredential);

    // Check if this is a new user and create their Firestore profile
    if (userCredential.additionalUserInfo?.isNewUser) {
      await createUserProfile(userCredential.user);
    }

    return { success: true, user: userCredential.user };
  } catch (error) {
    logError(error, { context: 'signInWithGoogle', platform: Platform.OS });
    return handleGoogleError(error);
  }
};

// Create user profile in Firestore for new OAuth users
const createUserProfile = async (user) => {
  try {
    const nameParts = (user.displayName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate a username from email
    const emailUsername = (user.email || '').split('@')[0];
    const baseUsername = emailUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    // Check if username exists and add random suffix if needed
    let username = baseUsername;
    let attempts = 0;
    while (attempts < 5) {
      const existing = await firestore()
        .collection('users')
        .where('username', '==', username)
        .limit(1)
        .get();

      if (existing.empty) break;
      username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
      attempts++;
    }

    await firestore().collection('users').doc(user.uid).set({
      name: firstName,
      lastName: lastName,
      username: username,
      email: user.email,
      photoURL: user.photoURL,
      authProvider: 'google',
      emailVerified: true, // Google emails are pre-verified
      hasOnboarded: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // Profile creation failed - log but don't block auth
    logError(error, { context: 'createUserProfile' });
  }
};

// Handle Google Sign-In errors
const handleGoogleError = (error) => {
  let errorMessage = 'unknownError';

  if (error.code === statusCodes.SIGN_IN_CANCELLED) {
    errorMessage = 'cancelled';
  } else if (error.code === statusCodes.IN_PROGRESS) {
    errorMessage = 'inProgress';
  } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    errorMessage = 'playServicesNotAvailable';
  } else if (error.code === '-5') {
    // iOS specific: User cancelled
    errorMessage = 'cancelled';
  } else if (error.message?.includes('DEVELOPER_ERROR')) {
    // Configuration issue - SHA-1 or client ID mismatch
    errorMessage = 'configurationError';
  }

  return { success: false, error: errorMessage, originalError: error };
};

// Sign out from Google
export const signOutGoogle = async () => {
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (isSignedIn) {
      await GoogleSignin.signOut();
    }
    return { success: true };
  } catch (error) {
    logError(error, { context: 'signOutGoogle' });
    return { success: false, error };
  }
};

// Check if user is signed in with Google
export const isGoogleSignedIn = async () => {
  try {
    return await GoogleSignin.isSignedIn();
  } catch (error) {
    return false;
  }
};
