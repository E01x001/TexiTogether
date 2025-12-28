import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, View, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { supabase } from '@/src/lib/supabase';

interface Room {
  id: string;
  created_at: string;
  start_point: string;
  end_point: string;
  departure_time: string;
  capacity: number;
  status: 'recruiting' | 'full' | 'in_progress' | 'completed';
  host_id: string;
  participant_count?: number;
  is_member?: boolean;
}

export default function RoomListScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
    let currentUserId: string | null = null;

    // Get current user ID for real-time updates
    supabase.auth.getUser().then(({ data: { user } }) => {
      currentUserId = user?.id || null;
    });

    // Subscribe to rooms table changes
    const roomsChannel = supabase
      .channel('public:rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
        },
        async (payload) => {
          console.log('Rooms event:', payload);

          if (payload.eventType === 'INSERT') {
            // Fetch full room data with participant count
            const { data } = await supabase
              .from('rooms')
              .select('*, room_members(count)')
              .eq('id', payload.new.id)
              .single();

            if (data && data.status === 'recruiting') {
              setRooms((current) => {
                if (current.find((room) => room.id === data.id)) {
                  return current;
                }
                return [
                  ...current,
                  {
                    ...data,
                    participant_count: data.room_members?.[0]?.count || 0,
                    is_member: false,
                    room_members: undefined,
                  },
                ].sort(
                  (a, b) =>
                    new Date(a.departure_time).getTime() -
                    new Date(b.departure_time).getTime()
                );
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            setRooms((current) => {
              const updatedRoom = payload.new as Room;
              if (updatedRoom.status !== 'recruiting') {
                return current.filter((room) => room.id !== updatedRoom.id);
              }
              return current.map((room) =>
                room.id === updatedRoom.id ? { ...room, ...updatedRoom } : room
              );
            });
          } else if (payload.eventType === 'DELETE') {
            setRooms((current) => current.filter((room) => room.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to room_members table changes for real-time participant updates
    const membersChannel = supabase
      .channel('public:room_members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
        },
        async (payload) => {
          console.log('Room members event:', payload);

          const roomId =
            payload.eventType === 'DELETE'
              ? payload.old.room_id
              : payload.new.room_id;

          // Fetch updated participant count
          const { count } = await supabase
            .from('room_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', roomId);

          const participantCount = count || 0;

          setRooms((current) =>
            current.map((room) => {
              if (room.id === roomId) {
                const isMember =
                  payload.eventType === 'INSERT' &&
                  payload.new.user_id === currentUserId
                    ? true
                    : payload.eventType === 'DELETE' &&
                      payload.old.user_id === currentUserId
                    ? false
                    : room.is_member;

                return {
                  ...room,
                  participant_count: participantCount,
                  is_member: isMember,
                };
              }
              return room;
            })
          );
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(membersChannel);
    };
  }, []);

  async function fetchRooms() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Get rooms with member count
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          *,
          room_members(count)
        `)
        .eq('status', 'recruiting')
        .order('departure_time', { ascending: true });

      if (roomsError) throw roomsError;

      // Get user's memberships if user is authenticated
      let memberships: { room_id: string }[] = [];
      if (user) {
        const { data: memberData, error: memberError } = await supabase
          .from('room_members')
          .select('room_id')
          .eq('user_id', user.id);

        if (memberError) throw memberError;
        memberships = memberData || [];
      }

      // Merge data
      const roomsWithMembership = (roomsData || []).map((room: any) => ({
        ...room,
        participant_count: room.room_members?.[0]?.count || 0,
        is_member: memberships.some((m) => m.room_id === room.id),
        room_members: undefined, // Remove nested data
      }));

      setRooms(roomsWithMembership);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    try {
      const { error } = await supabase.rpc('join_room', { p_room_id: roomId });

      if (error) throw error;

      Alert.alert('성공', '방에 참가했습니다!');
      fetchRooms(); // Refresh room list
    } catch (error: any) {
      console.error('Error joining room:', error);
      Alert.alert('오류', error.message || '방 참가에 실패했습니다.');
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    try {
      const { error } = await supabase.rpc('leave_room', { p_room_id: roomId });

      if (error) throw error;

      Alert.alert('성공', '방에서 나갔습니다.');
      fetchRooms(); // Refresh room list
    } catch (error: any) {
      console.error('Error leaving room:', error);
      Alert.alert('오류', error.message || '방 퇴장에 실패했습니다.');
    }
  };

  const renderRoomItem = ({ item }: { item: Room }) => {
    const isFull = (item.participant_count || 0) >= item.capacity;
    const canJoin = !item.is_member && !isFull;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/room/${item.id}`)}
        activeOpacity={0.7}
      >
        <ThemedView style={styles.roomCard}>
          <ThemedText type="subtitle" style={styles.routeText}>
            {item.start_point} → {item.end_point}
          </ThemedText>
          <ThemedText style={styles.timeText}>
            {new Date(item.departure_time).toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </ThemedText>
          <ThemedText style={styles.capacityText}>
            인원: {item.participant_count || 0}/{item.capacity}명
          </ThemedText>

          {item.is_member ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleLeaveRoom(item.id);
              }}
            >
              <ThemedText style={styles.leaveButtonText}>퇴장</ThemedText>
            </TouchableOpacity>
          ) : isFull ? (
            <ThemedView style={[styles.actionButton, styles.fullButton]}>
              <ThemedText style={styles.fullButtonText}>정원 마감</ThemedText>
            </ThemedView>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.joinButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleJoinRoom(item.id);
              }}
            >
              <ThemedText style={styles.joinButtonText}>참가</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>
        현재 모집 중인 방이 없습니다
      </ThemedText>
      <ThemedText style={styles.emptySubtext}>
        새로운 방을 만들어보세요!
      </ThemedText>
    </ThemedView>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>방 목록을 불러오는 중...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">택시 카풀 방</ThemedText>
        <ThemedText style={styles.subtitle}>
          모집 중인 방 {rooms.length}개
        </ThemedText>
      </ThemedView>

      <FlatList
        data={rooms}
        renderItem={renderRoomItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-room')}
      >
        <ThemedText style={styles.fabText}>+</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  roomCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    gap: 8,
  },
  routeText: {
    fontSize: 18,
  },
  timeText: {
    fontSize: 14,
    opacity: 0.7,
  },
  capacityText: {
    fontSize: 14,
    opacity: 0.7,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#007AFF',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: '#FF3B30',
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  fullButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
  },
  fullButtonText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
});
