import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../contexts/ThemeContext';

// Modern input with floating label animation
const FloatingLabelInput = ({
  label,
  value,
  onChangeText,
  error,
  icon,
  secureTextEntry,
  showPasswordToggle,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  onBlur,
  onFocus,
  editable = true,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const labelPosition = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderColor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(labelPosition, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.timing(borderColor, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  const labelStyle = {
    position: 'absolute',
    left: icon ? 48 : 16,
    top: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 6],
    }),
    fontSize: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.textMuted, error ? colors.error : isFocused ? colors.primary : colors.textSecondary],
    }),
  };

  const animatedBorderColor = borderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error : colors.border, error ? colors.error : colors.primary],
  });

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 2,
      borderRadius: 12,
      backgroundColor: colors.surface,
      minHeight: 60,
    },
    iconContainer: {
      width: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      paddingTop: 22,
      paddingBottom: 8,
      paddingRight: showPasswordToggle ? 48 : 16,
      paddingLeft: icon ? 0 : 16,
    },
    passwordToggle: {
      position: 'absolute',
      right: 0,
      width: 48,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 6,
      marginLeft: 4,
    },
    disabledContainer: {
      backgroundColor: colors.border + '30',
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor: animatedBorderColor },
          !editable && styles.disabledContainer,
        ]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            <Icon
              name={icon}
              size={20}
              color={isFocused ? colors.primary : colors.textMuted}
            />
          </View>
        )}
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          placeholderTextColor={colors.textMuted}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default FloatingLabelInput;
