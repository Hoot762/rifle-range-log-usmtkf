
import React, { useState } from 'react';
import { Text, View, SafeAreaView, TextInput, Alert, KeyboardAvoidingView, Platform, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import Button from '../components/Button';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';
import { supabase } from './integrations/supabase/client';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://natively.dev/email-confirmed'
      });

      if (error) {
        console.log('Password reset failed:', error.message);
        Alert.alert('Password Reset Failed', error.message);
        return;
      }

      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email for instructions to reset your password.',
        [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
      );
    } catch (error) {
      console.error('Error during password reset:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
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
              {showForgotPassword 
                ? 'Reset your password' 
                : 'Sign in to access your rifle range data'
              }
            </Text>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              placeholderTextColor="#888888"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!isLoading}
            />
            
            {!showForgotPassword && (
              <>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#888888"
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!isLoading}
                />
              </>
            )}
            
            <View style={styles.buttonContainer}>
              <Button
                text={
                  isLoading 
                    ? (showForgotPassword 
                      ? "Sending Reset Email..." 
                      : "Signing In..."
                    )
                    : (showForgotPassword 
                      ? "Send Reset Email" 
                      : "Sign In"
                    )
                }
                onPress={showForgotPassword ? handleForgotPassword : handleLogin}
                style={[buttonStyles.primary, styles.authButton]}
              />
            </View>

            <View style={styles.toggleContainer}>
              <Button
                text={showForgotPassword ? 'Back to Sign In' : 'Forgot Password?'}
                onPress={toggleForgotPassword}
                style={[buttonStyles.accent, styles.forgotButton]}
                textStyle={styles.forgotText}
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
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  targetImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: colors.border,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.4)',
    elevation: 6,
  },
  targetImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 30,
    borderWidth: 3,
    borderColor: colors.border,
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.4)',
    elevation: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'left',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderWidth: 3,
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    width: '100%',
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    elevation: 4,
    minHeight: 55,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  authButton: {
    paddingVertical: 18,
    borderRadius: 12,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    elevation: 6,
    minHeight: 60,
  },
  toggleContainer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  forgotButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minHeight: 35,
  },
  forgotText: {
    fontSize: 12,
    opacity: 0.8,
  },
});
