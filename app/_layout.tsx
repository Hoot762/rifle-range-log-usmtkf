
import React, { useEffect, useState } from 'react';
import { Stack, useGlobalSearchParams, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, SafeAreaView, Text, View } from 'react-native';
import { commonStyles } from '../styles/commonStyles';
import { setupErrorLogging } from '../utils/errorLogger';
import { supabase } from './integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

const STORAGE_KEY = 'emulated_device';

export default function RootLayout() {
  console.log('RootLayout rendering...');
  
  const actualInsets = useSafeAreaInsets();
  const { emulate } = useGlobalSearchParams<{ emulate?: string }>();
  const [storedEmulate, setStoredEmulate] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  
  console.log('RootLayout state:', { isLoading, hasSession: !!session, segments });

  useEffect(() => {
    // Set up global error logging
    try {
      setupErrorLogging();
      console.log('Error logging setup completed');
    } catch (error) {
      console.error('Failed to setup error logging:', error);
    }

    if (Platform.OS === 'web') {
      try {
        // If there's a new emulate parameter, store it
        if (emulate) {
          localStorage.setItem(STORAGE_KEY, emulate);
          setStoredEmulate(emulate);
        } else {
          // If no emulate parameter, try to get from localStorage
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            setStoredEmulate(stored);
          }
        }
      } catch (error) {
        console.error('Failed to handle emulation settings:', error);
      }
    }
  }, [emulate]);

  useEffect(() => {
    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        console.log('Initializing Supabase auth...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        } else {
          console.log('Initial session:', session?.user?.email || 'No session');
          setSession(session);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes with error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        console.log('Auth state changed:', session?.user?.email || 'No session');
        setSession(session);
        setIsLoading(false);
      } catch (error) {
        console.error('Error handling auth state change:', error);
      }
    });

    return () => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from auth changes:', error);
      }
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      console.log('Still loading, skipping navigation logic');
      return;
    }

    const inAuthGroup = segments[0] === 'login';
    console.log('Navigation logic:', { hasSession: !!session, inAuthGroup, segments });

    try {
      if (!session && !inAuthGroup) {
        // Redirect to login if not authenticated
        console.log('No session, redirecting to login');
        router.replace('/login');
      } else if (session && inAuthGroup) {
        // Redirect to home if authenticated and on login page
        console.log('Session exists, redirecting to home');
        router.replace('/');
      }
    } catch (error) {
      console.error('Error in navigation logic:', error);
    }
  }, [session, segments, isLoading]);

  let insetsToUse = actualInsets;

  if (Platform.OS === 'web') {
    const simulatedInsets = {
      ios: { top: 47, bottom: 20, left: 0, right: 0 },
      android: { top: 40, bottom: 0, left: 0, right: 0 },
    };

    // Use stored emulate value if available, otherwise use the current emulate parameter
    const deviceToEmulate = storedEmulate || emulate;
    insetsToUse = deviceToEmulate ? simulatedInsets[deviceToEmulate as keyof typeof simulatedInsets] || actualInsets : actualInsets;
  }

  try {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[commonStyles.wrapper, {
            paddingTop: insetsToUse.top,
            paddingBottom: insetsToUse.bottom,
            paddingLeft: insetsToUse.left,
            paddingRight: insetsToUse.right,
         }]}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'default',
            }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  } catch (error) {
    console.error('Error rendering RootLayout:', error);
    return (
      <SafeAreaProvider>
        <SafeAreaView style={commonStyles.wrapper}>
          <View style={commonStyles.content}>
            <Text style={commonStyles.title}>App Error</Text>
            <Text style={commonStyles.text}>
              Something went wrong. Please restart the app.
            </Text>
            <Text style={commonStyles.text}>
              Error: {error?.toString()}
            </Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
}
