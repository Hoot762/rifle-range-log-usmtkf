
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';

const SUPABASE_URL = "https://zvyyfvyfwwgznbxfejpt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eXlmdnlmd3dnem5ieGZlanB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTM2MTIsImV4cCI6MjA3MDA2OTYxMn0.MGiX74wcUCOUBgIhQ4z_I25yvQiT4sou5ZNKHs6R7Ns";

// Secure storage adapter for native platforms
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Create Supabase client with proper configuration
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  Platform.OS === 'web'
    ? {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    : {
        auth: {
          storage: ExpoSecureStoreAdapter,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
);

// Default export for compatibility
export default supabase;
