import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/src/lib/supabase';

const LOCATIONS = [
  'Pyeongtaek Station',
  'Walking Gate',
  'CPX',
  'Main Gate',
  'BX',
] as const;

export default function CreateRoomScreen() {
  const [startPoint, setStartPoint] = useState<string>('');
  const [endPoint, setEndPoint] = useState<string>('');
  const [departureTime, setDepartureTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour from now
  const [capacity, setCapacity] = useState('4');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRoom = async () => {
    // Validation
    if (!startPoint || !endPoint) {
      Alert.alert('입력 오류', '출발지와 도착지를 선택해주세요.');
      return;
    }

    if (startPoint === endPoint) {
      Alert.alert('입력 오류', '출발지와 도착지는 다른 장소여야 합니다.');
      return;
    }

    const capacityNum = parseInt(capacity, 10);
    if (isNaN(capacityNum) || capacityNum < 1 || capacityNum > 10) {
      Alert.alert('입력 오류', '정원은 1~10명 사이로 설정해주세요.');
      return;
    }

    if (departureTime <= new Date()) {
      Alert.alert('입력 오류', '출발 시간은 현재 시간 이후여야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('create_room', {
        p_start_point: startPoint,
        p_end_point: endPoint,
        p_departure_time: departureTime.toISOString(),
        p_capacity: capacityNum,
      });

      if (error) throw error;

      Alert.alert('성공', '방이 생성되었습니다!', [
        {
          text: '확인',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating room:', error);
      Alert.alert('오류', error.message || '방 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDepartureTime(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          새 카풀 방 만들기
        </ThemedText>

        {/* Start Point */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.label}>
            출발지
          </ThemedText>
          <ThemedView style={styles.pickerContainer}>
            {LOCATIONS.map((location) => (
              <TouchableOpacity
                key={`start-${location}`}
                style={[
                  styles.locationButton,
                  startPoint === location && styles.locationButtonSelected,
                ]}
                onPress={() => setStartPoint(location)}
              >
                <ThemedText
                  style={[
                    styles.locationButtonText,
                    startPoint === location && styles.locationButtonTextSelected,
                  ]}
                >
                  {location}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        {/* End Point */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.label}>
            도착지
          </ThemedText>
          <ThemedView style={styles.pickerContainer}>
            {LOCATIONS.map((location) => (
              <TouchableOpacity
                key={`end-${location}`}
                style={[
                  styles.locationButton,
                  endPoint === location && styles.locationButtonSelected,
                ]}
                onPress={() => setEndPoint(location)}
              >
                <ThemedText
                  style={[
                    styles.locationButtonText,
                    endPoint === location && styles.locationButtonTextSelected,
                  ]}
                >
                  {location}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        {/* Departure Time */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.label}>
            출발 시간
          </ThemedText>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <ThemedText>
              {departureTime.toLocaleString('ko-KR', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </ThemedText>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={departureTime}
              mode="datetime"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </ThemedView>

        {/* Capacity */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.label}>
            정원
          </ThemedText>
          <TextInput
            style={styles.input}
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="4"
          />
        </ThemedView>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
          onPress={handleCreateRoom}
          disabled={isSubmitting}
        >
          <ThemedText style={styles.createButtonText}>
            {isSubmitting ? '생성 중...' : '방 만들기'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 12,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  locationButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  locationButtonText: {
    fontSize: 14,
  },
  locationButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  dateButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
