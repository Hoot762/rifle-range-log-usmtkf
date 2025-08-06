
import React, { useState } from 'react';
import { Text, View, SafeAreaView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
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
    <SafeAreaView style={commonStyles.wrapper}>
      <KeyboardAvoidingView 
        style={commonStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={commonStyles.content}>
          <Text style={commonStyles.title}>Rifle Range Logger</Text>
          <Text style={[commonStyles.text, { marginBottom: 30 }]}>
            Please enter your login code to access the app
          </Text>
          
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Login Code</Text>
            <TextInput
              style={commonStyles.input}
              value={loginCode}
              onChangeText={setLoginCode}
              placeholder="Enter login code"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            
            <View style={[commonStyles.buttonContainer, { marginTop: 20 }]}>
              <Button
                text={isLoading ? "Logging in..." : "Login"}
                onPress={handleLogin}
                style={buttonStyles.primary}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
