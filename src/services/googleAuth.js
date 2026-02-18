import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';
import { logError } from './errorLogging';
import { normalizeUsername, isUsernameTaken } from './usernameService';

// Configure Google Sign-In - call this once at app startup
export const configureGoogleSignIn = () => {
  // Web Client ID from Firebase Console > Authentication > Sign-in method > Google
  const webClientId = '999583790732-321pt9to5398ejrahl1udnlo3kvs3csj.apps.googleusercontent.com';

  // iOS Client ID from GoogleService-Info.plist CLIENT_ID field
  const iosClientId = '999583790732-m1tbsm5p7o5nougdalg5hc58e5b0ptig.apps.googleusercontent.com';

  const config = {
    webClientId,
    offlineAccess: true,
  };

  // On iOS, we need to provide the iosClientId
  if (Platform.OS === 'ios') {
    config.iosClientId = iosClientId;
  }

  if (__DEV__) {
    console.log('[GoogleAuth] Configuring for', Platform.OS);
  }

  GoogleSignin.configure(config);
};

// Sign in with Google and authenticate with Firebase
export const signInWithGoogle = async () => {
  try {
    if (__DEV__) {
      console.log('[GoogleAuth] Starting sign-in flow...');
    }

    // Check Play Services only on Android
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    // Get the user's ID token
    const signInResult = await GoogleSignin.signIn();

    // Handle different response formats between library versions
    const idToken = signInResult.data?.idToken || signInResult.idToken;

    if (!idToken) {
      if (__DEV__) {
        console.error('[GoogleAuth] No ID token received');
      }
      logError(new Error('No ID token in Google Sign-In result'), {
        platform: Platform.OS,
      });
      throw new Error('No ID token found');
    }

    if (__DEV__) {
      console.log('[GoogleAuth] Got ID token, signing in to Firebase...');
    }

    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign-in the user with the credential
    const userCredential = await auth().signInWithCredential(googleCredential);

    if (__DEV__) {
      console.log('[GoogleAuth] Firebase sign-in successful:', userCredential.user.uid);
    }

    // Check if this is a new user and create their Firestore profile
    if (userCredential.additionalUserInfo?.isNewUser) {
      if (__DEV__) {
        console.log('[GoogleAuth] New user, creating profile...');
      }
      await createUserProfile(userCredential.user);
    }

    return { success: true, user: userCredential.user };
  } catch (error) {
    if (__DEV__) {
      console.error('[GoogleAuth] Error:', error.code, error.message);
    }
    logError(error, { context: 'signInWithGoogle', platform: Platform.OS });
    return handleGoogleError(error);
  }
};

// Create user profile in Firestore for new Google users
const createUserProfile = async (user) => {
  try {
    const nameParts = (user.displayName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate a username from email
    const emailUsername = (user.email || '').split('@')[0];
    const baseUsernameRaw = emailUsername.replace(/[^a-zA-Z0-9]/g, '');
    const baseUsername = normalizeUsername(baseUsernameRaw) || `user${Math.floor(Math.random() * 10000)}`;

    // Check if username exists and add random suffix if needed
    let username = baseUsername;
    let attempts = 0;
    while (attempts < 5) {
      const taken = await isUsernameTaken(username);
      if (!taken) break;
      username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
      attempts++;
    }

    if (__DEV__) {
      console.log('[GoogleAuth] Creating profile with username:', username);
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

    if (__DEV__) {
      console.log('[GoogleAuth] Profile created successfully');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[GoogleAuth] Failed to create profile:', error);
    }
    logError(error, { context: 'createUserProfile' });
    // Don't throw - profile creation failure shouldn't block auth
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
    errorMessage = 'configurationError';
    if (__DEV__) {
      console.error('[GoogleAuth] DEVELOPER_ERROR - Check SHA-1 fingerprint and client IDs');
    }
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
