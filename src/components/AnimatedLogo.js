import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../contexts/ThemeContext';

// Animated logo component for auth screens with entrance animation
const AnimatedLogo = ({ size = 'large', showTagline = true, animate = true }) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(animate ? 0.8 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const taglineOpacity = useRef(new Animated.Value(animate ? 0 : 1)).current;

  useEffect(() => {
    if (animate) {
      // Logo entrance animation
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Tagline fades in after logo
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animate]);

  const iconSize = size === 'large' ? 56 : size === 'medium' ? 44 : 32;
  const titleSize = size === 'large' ? 28 : size === 'medium' ? 24 : 20;
  const taglineSize = size === 'large' ? 14 : 12;

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    logoContainer: {
      width: iconSize + 32,
      height: iconSize + 32,
      borderRadius: (iconSize + 32) / 2,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    logoInner: {
      width: iconSize + 16,
      height: iconSize + 16,
      borderRadius: (iconSize + 16) / 2,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: titleSize,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: taglineSize,
      color: colors.textSecondary,
      marginTop: 6,
      fontWeight: '500',
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logoInner}>
          <Icon name="home" size={iconSize} color="white" />
        </View>
      </View>
      <Text style={styles.title}>TheHomeKeeper</Text>
      {showTagline && (
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Your home, always cared for
        </Animated.Text>
      )}
    </Animated.View>
  );
};

export default AnimatedLogo;
