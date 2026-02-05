/**
 * Error Logging Service
 *
 * This service provides a centralized place for error logging.
 * Currently logs to nothing in production (silent fail).
 *
 * TO ENABLE FIREBASE CRASHLYTICS:
 * 1. Install: npm install @react-native-firebase/crashlytics
 * 2. For Android, add to android/build.gradle:
 *    classpath 'com.google.firebase:firebase-crashlytics-gradle:2.9.9'
 * 3. For Android, add to android/app/build.gradle:
 *    apply plugin: 'com.google.firebase.crashlytics'
 * 4. For iOS: cd ios && pod install
 * 5. Uncomment the Crashlytics imports below
 */

// Uncomment when Crashlytics is installed:
// import crashlytics from '@react-native-firebase/crashlytics';

// Log a non-fatal error for tracking
export const logError = (error, context = {}) => {
  // In development, we might want to see errors
  if (__DEV__) {
    console.error('[ErrorLogging]', error, context);
    return;
  }

  // When Crashlytics is enabled, uncomment:
  // crashlytics().recordError(error);
  // Object.entries(context).forEach(([key, value]) => {
  //   crashlytics().setAttribute(key, String(value));
  // });
};

// Log a message (for breadcrumbs)
export const logMessage = (message) => {
  if (__DEV__) {
    console.log('[Log]', message);
    return;
  }

  // When Crashlytics is enabled, uncomment:
  // crashlytics().log(message);
};

// Set user identifier for crash reports
export const setUserId = (userId) => {
  if (__DEV__) return;

  // When Crashlytics is enabled, uncomment:
  // crashlytics().setUserId(userId);
};

// Set custom attributes
export const setAttributes = (attributes) => {
  if (__DEV__) return;

  // When Crashlytics is enabled, uncomment:
  // Object.entries(attributes).forEach(([key, value]) => {
  //   crashlytics().setAttribute(key, String(value));
  // });
};

// Force a crash (for testing only)
export const testCrash = () => {
  if (__DEV__) {
    console.log('[ErrorLogging] Test crash - would crash in production');
    return;
  }

  // When Crashlytics is enabled, uncomment:
  // crashlytics().crash();
};
