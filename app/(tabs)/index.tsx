import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, View, TouchableOpacity } from 'react-native';
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
}

export default function RoomListScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();

    // Set up Realtime subscription
    const channel = supabase
      .channel('public:rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: 'status=eq.recruiting',
        },
        (payload) => {
          console.log('Realtime event:', payload);

          if (payload.eventType === 'INSERT') {
            setRooms((current) => {
              // Avoid duplicates
              if (current.find((room) => room.id === payload.new.id)) {
                return current;
              }
              return [...current, payload.new as Room].sort(
                (a, b) =>
                  new Date(a.departure_time).getTime() -
                  new Date(b.departure_time).getTime()
              );
            });
          } else if (payload.eventType === 'UPDATE') {
            setRooms((current) => {
              const updatedRoom = payload.new as Room;
              // Remove room if status changed from recruiting
              if (updatedRoom.status !== 'recruiting') {
                return current.filter((room) => room.id !== updatedRoom.id);
              }
              // Update existing room
              return current.map((room) =>
                room.id === updatedRoom.id ? updatedRoom : room
              );
            });
          } else if (payload.eventType === 'DELETE') {
            setRooms((current) => current.filter((room) => room.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchRooms() {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'recruiting')
        .order('departure_time', { ascending: true });

      if (error) throw error;

      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }

  const renderRoomItem = ({ item }: { item: Room }) => (
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
        정원: {item.capacity}명
      </ThemedText>
    </ThemedView>
  );

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
