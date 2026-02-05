import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as lightColors } from '../theme/colors';
import { darkColors } from '../theme/darkColors';

const ThemeContext = createContext({
  colors: lightColors,
  theme: 'light',
  themeMode: 'auto',
  setTheme: async () => {},
  isDark: false,
  isLoading: false,
});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'light' or 'dark'
  const [themeMode, setThemeMode] = useState('auto'); // 'auto', 'light', or 'dark'
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from AsyncStorage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme !== null) {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        // Theme loading failed, use default
      } finally {
        setIsLoading(false);
      }
    };
    loadThemePreference();
  }, []);

  // Determine current theme based on mode and system preference
  const getCurrentTheme = () => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  };

  const currentTheme = getCurrentTheme();
  const colors = currentTheme === 'dark' ? darkColors : lightColors;

  // Change theme and save to AsyncStorage
  const setTheme = async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      // Theme saving failed silently
    }
  };

  const value = {
    colors,
    theme: currentTheme, // 'light' or 'dark'
    themeMode, // 'auto', 'light', or 'dark'
    setTheme,
    isDark: currentTheme === 'dark',
    isLoading,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
