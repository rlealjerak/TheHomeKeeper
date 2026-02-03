import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';

export default function IntroScreen({ navigation }) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    welcomeHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    icon: {
      marginBottom: 12,
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.welcomeHeader}>
        <Icon name="home" size={40} color={colors.primary} style={styles.icon} />
        <Text style={styles.title}>Welcome to TheHomeKeeper</Text>
      </View>

      <Text style={styles.subtitle}>
        You don't have any items yet.
        Start tracking your maintenance and keep everything organized.
      </Text>

      <Button
        title="Add Your First Item"
        onPress={() => navigation.navigate('AddItem')}
      />
    </SafeAreaView>
  );
}
