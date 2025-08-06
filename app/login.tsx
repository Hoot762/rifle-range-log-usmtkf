
import React, { useState } from 'react';
import { Text, View, SafeAreaView, TextInput, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';

const CORRECT_LOGIN_CODE = '27PutneyRifles!';
const LOGIN_STORAGE_KEY = 'rifle_range_login_status';

export default function LoginScreen() {
  const [loginCode, setLoginCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  console.log('LoginScreen rendered');

  const handleLogin = async () => {
    console.log('Login attempt with code:', loginCode);
    
    if (!loginCode.trim()) {
      Alert.alert('Error', 'Please enter a login code');
      return;
    }

    setIsLoading(true);

    try {
      if (loginCode === CORRECT_LOGIN_CODE) {
        console.log('Login successful');
        // Store login status
        await AsyncStorage.setItem(LOGIN_STORAGE_KEY, 'true');
        // Navigate to home screen
        router.replace('/');
      } else {
        console.log('Login failed - incorrect code');
        Alert.alert(
          'Access Denied', 
          'You are not allowed to use this app.',
          [{ text: 'OK', onPress: () => setLoginCode('') }]
        );
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Error', 'An error occurred during login. Please try again.');
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
            <Text style={styles.title}>Rifle Range Logger</Text>
            <Text style={styles.subtitle}>
              Please enter your login code to access the app
            </Text>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.label}>Login Code</Text>
            <TextInput
              style={styles.input}
              value={loginCode}
              onChangeText={setLoginCode}
              placeholder="Enter your login code here"
              placeholderTextColor="#999999"
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!isLoading}
            />
            
            <View style={styles.buttonContainer}>
              <Button
                text={isLoading ? "Logging in..." : "Login"}
                onPress={handleLogin}
                style={[buttonStyles.primary, styles.loginButton]}
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
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
    borderWidth: 2,
    borderColor: colors.border,
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.4)',
    elevation: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'left',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    color: '#000000',
    fontSize: 18,
    fontWeight: '500',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
    elevation: 2,
    minHeight: 50,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 12,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    elevation: 6,
    minHeight: 50,
  },
});
