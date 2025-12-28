import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native' // Import Platform

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required.')
}

const getAuthStorage = () => {
  if (Platform.OS === 'web') {
    // For web, use localStorage directly or a similar polyfill
    return globalThis.localStorage || window.localStorage; // Using globalThis for broader compatibility
  }
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getAuthStorage(), // Use the conditional storage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
