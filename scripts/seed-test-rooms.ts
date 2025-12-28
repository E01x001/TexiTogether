/**
 * Test Room Seeding Script
 *
 * Creates sample rooms for testing the RoomListScreen
 *
 * Usage:
 *   npx tsx scripts/seed-test-rooms.ts
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const sampleRooms = [
  {
    start_point: 'Pyeongtaek Station',
    end_point: 'Walking Gate',
    departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    capacity: 4,
    status: 'recruiting',
  },
  {
    start_point: 'Walking Gate',
    end_point: 'Pyeongtaek Station',
    departure_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    capacity: 3,
    status: 'recruiting',
  },
  {
    start_point: 'CPX',
    end_point: 'Pyeongtaek Station',
    departure_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
    capacity: 4,
    status: 'recruiting',
  },
];

async function seedRooms() {
  console.log('🌱 Seeding test rooms...\n');

  // First, check if we need a test user profile
  console.log('Checking for test user profile...');

  // For now, we'll insert rooms without host_id (it's nullable)
  for (const room of sampleRooms) {
    console.log(`Creating room: ${room.start_point} → ${room.end_point}`);

    const { data, error } = await supabase
      .from('rooms')
      .insert(room)
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating room:`, error.message);
    } else {
      console.log(`✅ Created room ${data.id}`);
    }
  }

  console.log('\n✅ Seeding complete!');
}

seedRooms()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
