/**
 * i18n Configuration for TheHomeKeeper
 *
 * Supported languages: English (en), Spanish (es), Portuguese (pt), French (fr)
 *
 * HOW TO ADD A NEW LANGUAGE:
 * 1. Create a new JSON file in src/i18n/locales/ (e.g., de.json for German)
 * 2. Copy the structure from en.json and translate all values
 * 3. Import the file below and add it to the resources object
 * 4. Add the language to SUPPORTED_LANGUAGES array
 *
 * HOW TO ADD A NEW STRING:
 * 1. Add the key-value pair to ALL language files in src/i18n/locales/
 * 2. Use the key in your component: const { t } = useTranslation(); t('yourKey')
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';

// Supported languages configuration
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
];

const LANGUAGE_STORAGE_KEY = 'user_language';

// Get device language, fallback to 'en' if not supported
const getDeviceLanguage = () => {
  const locales = RNLocalize.getLocales();
  if (locales && locales.length > 0) {
    const deviceLang = locales[0].languageCode;
    // Check if device language is supported
    const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === deviceLang);
    if (isSupported) {
      return deviceLang;
    }
  }
  return 'en';
};

// Language detector - checks AsyncStorage first, then device language
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Check if user has manually selected a language
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
    } catch (error) {
      // Failed to read saved language, will use device language
    }

    // Fall back to device language
    const deviceLang = getDeviceLanguage();
    callback(deviceLang);
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      // Failed to save language preference
    }
  },
};

// Initialize i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

// Helper function to change language (for Settings screen)
export const changeLanguage = async (languageCode) => {
  await i18n.changeLanguage(languageCode);
};

// Helper function to get current language
export const getCurrentLanguage = () => {
  return i18n.language || 'en';
};

export default i18n;
