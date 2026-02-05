import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../contexts/ThemeContext';

// Social sign-in button component for Google and Apple authentication
export const SocialButton = ({ provider, onPress, loading, disabled, title }) => {
  const { colors } = useTheme();

  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          icon: 'google',
          iconColor: '#DB4437',
          backgroundColor: colors.surface,
          textColor: colors.text,
          borderColor: colors.border,
        };
      case 'apple':
        return {
          icon: 'apple',
          iconColor: colors.text,
          backgroundColor: colors.text,
          textColor: colors.background,
          borderColor: colors.text,
          invertColors: true,
        };
      default:
        return {
          icon: 'user',
          iconColor: colors.text,
          backgroundColor: colors.surface,
          textColor: colors.text,
          borderColor: colors.border,
        };
    }
  };

  const config = getProviderConfig();
  const isDisabled = disabled || loading;

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: config.borderColor,
      backgroundColor: provider === 'apple' ? config.backgroundColor : colors.surface,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    iconContainer: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    text: {
      fontSize: 16,
      fontWeight: '600',
      color: provider === 'apple' ? config.textColor : colors.text,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={provider === 'apple' ? config.textColor : colors.primary}
          size="small"
        />
      ) : (
        <>
          <View style={styles.iconContainer}>
            <Icon
              name={config.icon}
              size={20}
              color={provider === 'apple' ? config.textColor : config.iconColor}
            />
          </View>
          <Text style={styles.text}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// Divider component with "or" text
export const OrDivider = ({ text = 'or' }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    text: {
      marginHorizontal: 16,
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
};
