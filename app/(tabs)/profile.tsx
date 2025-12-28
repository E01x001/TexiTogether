import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/src/lib/supabase';

interface ProfileData {
  full_name: string;
  phone_number: string;
  paypal_id: string;
  toss_bank_name: string;
  toss_account_no: string;
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone_number: '',
    paypal_id: '',
    toss_bank_name: '',
    toss_account_no: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone_number, paypal_id, toss_bank_name, toss_account_no')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone_number: data.phone_number || '',
          paypal_id: data.paypal_id || '',
          toss_bank_name: data.toss_bank_name || '',
          toss_account_no: data.toss_account_no || '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Alert.alert('오류', '프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('오류', '로그인이 필요합니다.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          paypal_id: profile.paypal_id || null,
          toss_bank_name: profile.toss_bank_name || null,
          toss_account_no: profile.toss_account_no || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('성공', '프로필이 저장되었습니다.');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('오류', error.message || '프로필 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing out:', error);
      Alert.alert('오류', '로그아웃에 실패했습니다.');
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>프로필을 불러오는 중...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            기본 정보
          </ThemedText>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>이름</ThemedText>
            <TextInput
              style={styles.input}
              value={profile.full_name}
              onChangeText={(text) => setProfile({ ...profile, full_name: text })}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#999"
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>전화번호</ThemedText>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={profile.phone_number}
              editable={false}
              placeholderTextColor="#999"
            />
            <ThemedText style={styles.hint}>전화번호는 변경할 수 없습니다</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            결제 정보
          </ThemedText>
          <ThemedText style={styles.sectionDescription}>
            택시비 정산을 위한 결제 정보를 입력하세요
          </ThemedText>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>PayPal ID</ThemedText>
            <TextInput
              style={styles.input}
              value={profile.paypal_id}
              onChangeText={(text) => setProfile({ ...profile, paypal_id: text })}
              placeholder="PayPal ID 입력 (선택사항)"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>토스 은행명</ThemedText>
            <TextInput
              style={styles.input}
              value={profile.toss_bank_name}
              onChangeText={(text) => setProfile({ ...profile, toss_bank_name: text })}
              placeholder="예: 국민은행, 신한은행 (선택사항)"
              placeholderTextColor="#999"
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText style={styles.label}>토스 계좌번호</ThemedText>
            <TextInput
              style={styles.input}
              value={profile.toss_account_no}
              onChangeText={(text) => setProfile({ ...profile, toss_account_no: text })}
              placeholder="계좌번호 입력 (선택사항)"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </ThemedView>
        </ThemedView>

        <TouchableOpacity
          style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
          onPress={saveProfile}
          disabled={saving}
        >
          <ThemedText style={styles.saveButtonText}>
            {saving ? '저장 중...' : '프로필 저장'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <ThemedText style={styles.signOutButtonText}>로그아웃</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    opacity: 0.7,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  hint: {
    fontSize: 12,
    opacity: 0.6,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
