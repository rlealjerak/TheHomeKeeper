import auth from '@react-native-firebase/auth';

// Send email verification to current user
export const sendEmailVerification = async () => {
  try {
    const user = auth().currentUser;
    if (!user) {
      return { success: false, error: 'noUser' };
    }

    if (user.emailVerified) {
      return { success: true, alreadyVerified: true };
    }

    await user.sendEmailVerification();
    return { success: true };
  } catch (error) {

    let errorMessage = 'unknownError';
    if (error.code === 'auth/too-many-requests') {
      errorMessage = 'tooManyRequests';
    }

    return { success: false, error: errorMessage, originalError: error };
  }
};

// Check if current user's email is verified
export const isEmailVerified = () => {
  const user = auth().currentUser;
  return user?.emailVerified ?? false;
};

// Reload user to get fresh verification status
export const reloadUser = async () => {
  try {
    const user = auth().currentUser;
    if (!user) {
      return { success: false, error: 'noUser' };
    }

    await user.reload();
    return { success: true, emailVerified: user.emailVerified };
  } catch (error) {
    return { success: false, error: 'reloadFailed' };
  }
};

// Get current user's email verification status
export const getVerificationStatus = () => {
  const user = auth().currentUser;
  if (!user) {
    return { isLoggedIn: false, emailVerified: false };
  }

  return {
    isLoggedIn: true,
    emailVerified: user.emailVerified,
    email: user.email,
    authProvider: user.providerData[0]?.providerId || 'password',
  };
};
