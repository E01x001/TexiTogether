import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { GiftedChat, IMessage, User } from 'react-native-gifted-chat';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/src/lib/supabase';

interface Room {
  id: string;
  start_point: string;
  end_point: string;
  departure_time: string;
  capacity: number;
  status: string;
  participant_count?: number;
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
      const { data, error } = await supabase
        .from('rooms')
        .select('*, room_members(count)')
        .eq('id', id)
        .single();

      if (error) throw error;

      setRoom({
        ...data,
        participant_count: data.room_members?.[0]?.count || 0,
      });
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
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
