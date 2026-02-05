import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Primary action button with gradient-like appearance and press animation
const GradientButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary', 'secondary', 'outline'
  style,
  icon,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const isDisabled = disabled || loading;

  const getBackgroundColor = () => {
    if (variant === 'secondary') return colors.surface;
    if (variant === 'outline') return 'transparent';
    return colors.primary;
  };

  const getTextColor = () => {
    if (variant === 'secondary') return colors.primary;
    if (variant === 'outline') return colors.primary;
    return 'white';
  };

  const styles = StyleSheet.create({
    button: {
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      backgroundColor: getBackgroundColor(),
      borderWidth: variant === 'outline' ? 2 : 0,
      borderColor: colors.primary,
      shadowColor: variant === 'primary' ? colors.primary : 'transparent',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: variant === 'primary' ? 0.3 : 0,
      shadowRadius: 8,
      elevation: variant === 'primary' ? 4 : 0,
    },
    buttonDisabled: {
      opacity: 0.6,
      shadowOpacity: 0,
      elevation: 0,
    },
    text: {
      fontSize: 17,
      fontWeight: '600',
      color: getTextColor(),
      letterSpacing: 0.3,
    },
    iconContainer: {
      marginRight: 8,
    },
  });

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={styles.text}>{title}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default GradientButton;
