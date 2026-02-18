import firestore from '@react-native-firebase/firestore';

// Normalize username to lowercase
export const normalizeUsername = (username) => {
  if (!username) return '';
  return username.trim().toLowerCase();
};

// Check if a username is already taken
export const isUsernameTaken = async (username) => {
  const normalized = normalizeUsername(username);
  if (!normalized) return false;

  try {
    if (__DEV__) {
      console.log('[usernameService] isUsernameTaken checking:', normalized);
    }

    const snapshot = await firestore()
      .collection('users')
      .where('username', '==', normalized)
      .limit(1)
      .get();

    const result = !snapshot.empty;

    if (__DEV__) {
      console.log('[usernameService] isUsernameTaken result:', result);
      if (result) {
        console.log('[usernameService] Found user doc:', snapshot.docs[0].id);
      }
    }

    return result;
  } catch (error) {
    if (__DEV__) {
      console.error('[usernameService] isUsernameTaken error:', error);
    }
    return false;
  }
};

// Find a user's email by their username
export const findEmailByUsername = async (username) => {
  if (!username || !username.trim()) {
    if (__DEV__) {
      console.log('[usernameService] findEmailByUsername: empty username');
    }
    return { found: false };
  }

  const input = username.trim();
  const normalized = input.toLowerCase();

  if (__DEV__) {
    console.log('[usernameService] findEmailByUsername input:', input);
    console.log('[usernameService] findEmailByUsername normalized:', normalized);
  }

  try {
    // First try: exact lowercase match (how new users are stored)
    const snapshot = await firestore()
      .collection('users')
      .where('username', '==', normalized)
      .limit(1)
      .get();

    if (__DEV__) {
      console.log('[usernameService] Query result empty?', snapshot.empty);
      console.log('[usernameService] Query result size:', snapshot.size);
    }

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const userData = doc.data();

      if (__DEV__) {
        console.log('[usernameService] Found user!');
        console.log('[usernameService] Doc ID:', doc.id);
        console.log('[usernameService] Username in DB:', userData.username);
        console.log('[usernameService] Email in DB:', userData.email);
        console.log('[usernameService] Auth provider:', userData.authProvider);
      }

      return {
        found: true,
        email: userData.email || '',
        uid: doc.id,
        username: userData.username,
        authProvider: userData.authProvider,
      };
    }

    // Second try: original case (for legacy data)
    if (input !== normalized) {
      if (__DEV__) {
        console.log('[usernameService] Trying original case:', input);
      }

      const snapshot2 = await firestore()
        .collection('users')
        .where('username', '==', input)
        .limit(1)
        .get();

      if (!snapshot2.empty) {
        const doc = snapshot2.docs[0];
        const userData = doc.data();

        if (__DEV__) {
          console.log('[usernameService] Found with original case!');
        }

        return {
          found: true,
          email: userData.email || '',
          uid: doc.id,
          username: userData.username,
          authProvider: userData.authProvider,
        };
      }
    }

    if (__DEV__) {
      console.log('[usernameService] Username not found in database');
    }

    return { found: false };
  } catch (error) {
    if (__DEV__) {
      console.error('[usernameService] findEmailByUsername error:', error);
    }
    return { found: false, error: error.message };
  }
};
