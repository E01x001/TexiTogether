import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, Linking, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { GiftedChat, IMessage, User } from 'react-native-gifted-chat';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/src/lib/supabase';
import { calculateSplitAmount, formatCurrency, generateTossLink, generatePayPalLink } from '@/src/utils/paymentHelpers';
import { getCoordinates, getCenterCoordinate, getRegionDelta } from '@/src/utils/locationCoordinates';

interface Room {
  id: string;
  start_point: string;
  end_point: string;
  departure_time: string;
  capacity: number;
  status: string;
  host_id: string;
  participant_count?: number;
}

interface HostPaymentInfo {
  paypal_id: string | null;
  toss_bank_name: string | null;
  toss_account_no: string | null;
  full_name: string;
}

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function RoomDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [hostPaymentInfo, setHostPaymentInfo] = useState<HostPaymentInfo | null>(null);
  const [totalFare, setTotalFare] = useState('');
  const [splitAmount, setSplitAmount] = useState(0);

  useEffect(() => {
    fetchRoomDetails();
    fetchCurrentUser();
    fetchMessages();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`public:messages:room_id=eq.${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${id}`,
        },
        async (payload) => {
          console.log('New message:', payload);

          // Fetch the full message with user profile
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(full_name)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const newMessage = convertToGiftedChatMessage(data as Message);
            setMessages((previousMessages) =>
              GiftedChat.append(previousMessages, [newMessage])
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [id]);

  async function fetchCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        setCurrentUser({
          _id: user.id,
          name: profile?.full_name || 'Unknown User',
        });
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }

  async function fetchRoomDetails() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('rooms')
        .select('*, room_members(count)')
        .eq('id', id)
        .single();

      if (error) throw error;

      const roomData = {
        ...data,
        participant_count: data.room_members?.[0]?.count || 0,
      };

      setRoom(roomData);

      // Check if current user is host
      if (user && data.host_id === user.id) {
        setIsHost(true);
      }

      // Fetch host payment information
      const { data: hostData, error: hostError } = await supabase
        .from('profiles')
        .select('full_name, paypal_id, toss_bank_name, toss_account_no')
        .eq('id', data.host_id)
        .single();

      if (hostError) {
        console.error('Error fetching host info:', hostError);
      } else if (hostData) {
        setHostPaymentInfo(hostData);
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
    }
  }

  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(full_name)')
        .eq('room_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const giftedChatMessages = (data as Message[]).map(convertToGiftedChatMessage);
      setMessages(giftedChatMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }

  function convertToGiftedChatMessage(message: Message): IMessage {
    return {
      _id: message.id,
      text: message.content,
      createdAt: new Date(message.created_at),
      user: {
        _id: message.user_id,
        name: message.profiles?.full_name || 'Unknown User',
      },
    };
  }

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    try {
      const messageToSend = newMessages[0];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: id,
          user_id: user.id,
          content: messageToSend.text,
        });

      if (error) throw error;

      // Message will be added to the list via real-time subscription
    } catch (error: any) {
      console.error('Error sending message:', error);
    }
  }, [id]);

  // Calculate split amount when total fare changes
  useEffect(() => {
    if (totalFare && room?.participant_count) {
      const fareNum = parseFloat(totalFare);
      if (!isNaN(fareNum) && fareNum > 0) {
        const split = calculateSplitAmount(fareNum, room.participant_count);
        setSplitAmount(split);
      } else {
        setSplitAmount(0);
      }
    } else {
      setSplitAmount(0);
    }
  }, [totalFare, room?.participant_count]);

  async function handlePayWithToss() {
    try {
      if (!hostPaymentInfo?.toss_bank_name || !hostPaymentInfo?.toss_account_no) {
        Alert.alert('오류', '호스트가 토스 결제 정보를 설정하지 않았습니다.');
        return;
      }

      const link = generateTossLink(
        splitAmount,
        hostPaymentInfo.toss_bank_name,
        hostPaymentInfo.toss_account_no
      );

      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      } else {
        Alert.alert(
          '토스 앱 필요',
          '토스 앱이 설치되어 있지 않습니다. 앱스토어에서 다운로드하세요.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '다운로드',
              onPress: () => {
                const storeUrl = Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/id839333328'
                  : 'https://play.google.com/store/apps/details?id=viva.republica.toss';
                Linking.openURL(storeUrl);
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error opening Toss:', error);
      Alert.alert('오류', '토스 앱을 열 수 없습니다.');
    }
  }

  async function handlePayWithPayPal() {
    try {
      if (!hostPaymentInfo?.paypal_id) {
        Alert.alert('오류', '호스트가 PayPal ID를 설정하지 않았습니다.');
        return;
      }

      const link = generatePayPalLink(splitAmount, hostPaymentInfo.paypal_id);

      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      } else {
        Alert.alert('오류', 'PayPal 링크를 열 수 없습니다.');
      }
    } catch (error: any) {
      console.error('Error opening PayPal:', error);
      Alert.alert('오류', 'PayPal 링크를 열 수 없습니다.');
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>방 정보를 불러오는 중...</ThemedText>
      </ThemedView>
    );
  }

  if (!room) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText>방을 찾을 수 없습니다.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: `${room.start_point} → ${room.end_point}`,
        }}
      />

      <ThemedView style={styles.roomInfo}>
        <ThemedText type="subtitle" style={styles.routeText}>
          {room.start_point} → {room.end_point}
        </ThemedText>
        <ThemedText style={styles.infoText}>
          출발: {new Date(room.departure_time).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </ThemedText>
        <ThemedText style={styles.infoText}>
          참가자: {room.participant_count}/{room.capacity}명
        </ThemedText>
      </ThemedView>

      {/* Map Section */}
      {(() => {
        const startCoord = getCoordinates(room.start_point);
        const endCoord = getCoordinates(room.end_point);

        if (startCoord && endCoord) {
          const center = getCenterCoordinate(startCoord, endCoord);
          const delta = getRegionDelta(startCoord, endCoord);

          return (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  ...center,
                  ...delta,
                }}
              >
                <Marker
                  coordinate={startCoord}
                  title={room.start_point}
                  description="출발지"
                  pinColor="green"
                />
                <Marker
                  coordinate={endCoord}
                  title={room.end_point}
                  description="도착지"
                  pinColor="red"
                />
              </MapView>
            </View>
          );
        }
        return null;
      })()}

      {/* Settlement Section - Only show for host or when fare is entered */}
      {(isHost || totalFare) && (room.status === 'in_progress' || room.status === 'completed' || room.status === 'full') && (
        <ThemedView style={styles.settlementSection}>
          <ThemedText type="subtitle" style={styles.settlementTitle}>
            💰 정산
          </ThemedText>

          {isHost && (
            <ThemedView style={styles.settlementInput}>
              <ThemedText style={styles.label}>총 택시비</ThemedText>
              <TextInput
                style={styles.fareInput}
                value={totalFare}
                onChangeText={setTotalFare}
                placeholder="택시비를 입력하세요"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
            </ThemedView>
          )}

          {splitAmount > 0 && (
            <>
              <ThemedView style={styles.splitInfo}>
                <ThemedText style={styles.splitLabel}>1인당 금액</ThemedText>
                <ThemedText type="subtitle" style={styles.splitAmount}>
                  {formatCurrency(splitAmount)}
                </ThemedText>
              </ThemedView>

              {!isHost && hostPaymentInfo && (
                <>
                  <ThemedText style={styles.paymentLabel}>
                    {hostPaymentInfo.full_name}님에게 송금하기
                  </ThemedText>

                  <ThemedView style={styles.paymentButtons}>
                    {hostPaymentInfo.toss_bank_name && hostPaymentInfo.toss_account_no && (
                      <TouchableOpacity
                        style={[styles.paymentButton, styles.tossButton]}
                        onPress={handlePayWithToss}
                      >
                        <ThemedText style={styles.paymentButtonText}>토스로 송금</ThemedText>
                      </TouchableOpacity>
                    )}

                    {hostPaymentInfo.paypal_id && (
                      <TouchableOpacity
                        style={[styles.paymentButton, styles.paypalButton]}
                        onPress={handlePayWithPayPal}
                      >
                        <ThemedText style={styles.paymentButtonText}>PayPal로 송금</ThemedText>
                      </TouchableOpacity>
                    )}
                  </ThemedView>
                </>
              )}
            </>
          )}
        </ThemedView>
      )}

      <View style={styles.chatContainer}>
        <GiftedChat
          messages={messages}
          onSend={(messages) => onSend(messages)}
          user={currentUser || { _id: '', name: 'Unknown' }}
          placeholder="메시지를 입력하세요..."
          alwaysShowSend
          scrollToBottom
          renderUsernameOnMessage
        />
      </View>
    </KeyboardAvoidingView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    gap: 4,
  },
  routeText: {
    fontSize: 18,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
  },
  mapContainer: {
    height: 250,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  settlementSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    gap: 12,
    backgroundColor: '#f9f9f9',
  },
  settlementTitle: {
    fontSize: 18,
  },
  settlementInput: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  fareInput: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  splitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  splitLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  splitAmount: {
    fontSize: 24,
    color: '#007AFF',
  },
  paymentLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
  },
  paymentButtons: {
    gap: 8,
  },
  paymentButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  tossButton: {
    backgroundColor: '#0064FF',
  },
  paypalButton: {
    backgroundColor: '#0070BA',
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
