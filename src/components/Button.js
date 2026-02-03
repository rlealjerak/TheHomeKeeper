import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Custom button component with loading states and variants
export const Button = ({ title, onPress, loading, disabled, variant = 'primary', style }) => {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const styles = StyleSheet.create({
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonSecondary: {
      backgroundColor: colors.secondary,
      shadowColor: colors.secondary,
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.textLight,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    buttonTextSecondary: {
      color: colors.textLight,
    },
    buttonTextOutline: {
      color: colors.primary,
    },
  });

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'outline' && styles.buttonOutline,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textLight : colors.primary} />
      ) : (
        <Text style={[
          styles.buttonText,
          variant === 'secondary' && styles.buttonTextSecondary,
          variant === 'outline' && styles.buttonTextOutline,
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
