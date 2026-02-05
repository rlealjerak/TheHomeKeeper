import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Divider component with text in the middle
const AuthDivider = ({ text = 'or' }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    text: {
      marginHorizontal: 16,
      fontSize: 14,
      fontWeight: '500',
      color: colors.textMuted,
      textTransform: 'lowercase',
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

export default AuthDivider;
