import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, Alert } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';

export default function SignInScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithPhoneNumber() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
    });

    if (error) {
      Alert.alert(error.message);
    } else {
      Alert.alert('OTP sent!', 'Please check your phone for the verification code.');
      router.push({
        pathname: '/auth/verify-otp',
        params: { phoneNumber },
      });
    }
    setLoading(false);
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Sign In with Phone Number</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Enter your phone number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        autoCapitalize="none"
      />
      <Button
        title={loading ? 'Sending...' : 'Send Code'}
        onPress={signInWithPhoneNumber}
        disabled={loading}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});
