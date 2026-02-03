import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Reusable Logo component for branding throughout the app
export const Logo = ({ size = 'medium', showTagline = false, light = false }) => {
  const { colors } = useTheme();
  const sizes = {
    small: { logo: 60, title: 18, tagline: 12 },
    medium: { logo: 80, title: 24, tagline: 14 },
    large: { logo: 120, title: 32, tagline: 16 },
  };

  const currentSize = sizes[size] || sizes.medium;
  const textColor = light ? colors.textLight : colors.text;

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/bootsplash/logo.png')}
        style={[styles.logo, { width: currentSize.logo, height: currentSize.logo }]}
        resizeMode="contain"
      />
      <Text style={[styles.title, { fontSize: currentSize.title, color: textColor }]}>
        TheHomeKeeper
      </Text>
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: currentSize.tagline, color: light ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
          Track. Maintain. Relax.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagline: {
    marginTop: 6,
    fontWeight: '400',
  },
});
