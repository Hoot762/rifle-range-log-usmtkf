import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../styles/commonStyles';
import { useState, useRef } from 'react';

interface ButtonProps {
  text: string;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export default function Button({ 
  text, 
  onPress, 
  style, 
  textStyle, 
  disabled = false,
  variant = 'primary'
}: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'ghost':
        return styles.ghost;
      default:
        return styles.primary;
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'ghost':
        return styles.ghostText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={[
          styles.button, 
          getVariantStyle(),
          style,
          disabled && styles.disabled,
          isPressed && styles.pressed
        ]} 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
      >
        <Text style={[
          styles.buttonText, 
          getVariantTextStyle(),
          textStyle,
          disabled && styles.disabledText
        ]}>
          {text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...shadows.md,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
    ...shadows.sm,
  },
  buttonText: {
    ...typography.bodyMedium,
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryText: {
    color: colors.background,
  },
  secondaryText: {
    color: colors.text,
  },
  ghostText: {
    color: colors.accent,
  },
  disabledText: {
    color: colors.textMuted,
  },
});