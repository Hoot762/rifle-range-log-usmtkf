
import React, { useState } from 'react';
import { Text, View, SafeAreaView, TextInput, Alert, KeyboardAvoidingView, Platform, StyleSheet, Image, Animated } from 'react-native';
import { router } from 'expo-router';
import Button from '../components/Button';
import { commonStyles, buttonStyles, colors, spacing, borderRadius, shadows, typography } from '../styles/commonStyles';
import { supabase } from './integrations/supabase/client';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  console.log('LoginScreen rendered');

  const handleLogin = async () => {
    console.log('Login attempt with email:', email);
    
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.log('Login failed:', error.message);
        Alert.alert('Login Failed', error.message);
        return;
      }

      if (data.user) {
        console.log('Login successful for user:', data.user.email);
        Alert.alert('Success', 'Login successful!', [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.headerSection}>
            {/* Target image in circular container - same as home screen */}
            <View style={styles.targetImageContainer}>
              <Image 
                source={require('../assets/images/0c6f758e-3623-49b9-8253-850b43db8407.png')}
                style={styles.targetImage}
                resizeMode="cover"
              />
            </View>
            
            <Text style={styles.title}>Rifle Range Logger</Text>
            <Text style={styles.subtitle}>
              Sign in to access your range data
            </Text>
          </View>
          
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  emailFocused && styles.inputFocused
                ]}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="Enter your email address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!isLoading}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  passwordFocused && styles.inputFocused
                ]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!isLoading}
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                text={isLoading ? "Signing In..." : "Sign In"}
                onPress={handleLogin}
                style={styles.authButton}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  targetImageContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent,
    ...shadows.lg,
  },
  targetImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    ...shadows.sm,
    minHeight: 48,
  },
  inputFocused: {
    borderColor: colors.accent,
    borderWidth: 2,
    ...shadows.md,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  authButton: {
    paddingVertical: spacing.md,
    minHeight: 52,
    ...shadows.lg,
  },
});
