import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, Alert } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { router, useLocalSearchParams } from 'expo-router';

export default function VerifyOtpScreen() {
  const { phoneNumber } = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  async function verifyOtp() {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phoneNumber as string,
      token: otp,
      type: 'sms',
    });

    if (error) {
      Alert.alert(error.message);
    } else {
      Alert.alert('Success!', 'You have been successfully signed in.');
      router.replace('/'); // Navigate to the main app after successful verification
    }
    setLoading(false);
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Verify OTP</ThemedText>
      <ThemedText style={styles.subtitle}>
        Enter the 6-digit code sent to {phoneNumber}
      </ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
      />
      <Button
        title={loading ? 'Verifying...' : 'Verify Code'}
        onPress={verifyOtp}
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
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
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
