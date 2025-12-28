/**
 * Supabase Connection Test Script
 *
 * Run this after applying migrations to verify database connectivity
 *
 * Usage:
 *   npx tsx scripts/test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  // Test 1: Profiles table
  console.log('Test 1: Checking profiles table...');
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (profilesError) {
    console.error('❌ Profiles table error:', profilesError.message);
    return false;
  }
  console.log('✅ Profiles table accessible');

  // Test 2: Rooms table
  console.log('\nTest 2: Checking rooms table...');
  const { data: roomsData, error: roomsError } = await supabase
    .from('rooms')
    .select('*')
    .limit(1);

  if (roomsError) {
    console.error('❌ Rooms table error:', roomsError.message);
    return false;
  }
  console.log('✅ Rooms table accessible');

  // Test 3: Room members table
  console.log('\nTest 3: Checking room_members table...');
  const { data: membersData, error: membersError } = await supabase
    .from('room_members')
    .select('*')
    .limit(1);

  if (membersError) {
    console.error('❌ Room members table error:', membersError.message);
    return false;
  }
  console.log('✅ Room members table accessible');

  // Test 4: Check table structure
  console.log('\nTest 4: Verifying table structures...');

  // Check if we can query with specific columns
  const { error: structureError } = await supabase
    .from('profiles')
    .select('id, full_name, affiliation, verification_status, phone_number')
    .limit(1);

  if (structureError) {
    console.error('❌ Table structure error:', structureError.message);
    return false;
  }
  console.log('✅ Table structures correct');

  console.log('\n✅ All tests passed! Database is ready.');
  console.log('\n📊 Summary:');
  console.log(`   - Profiles: ${profilesData?.length || 0} records found`);
  console.log(`   - Rooms: ${roomsData?.length || 0} records found`);
  console.log(`   - Room members: ${membersData?.length || 0} records found`);

  return true;
}

testConnection()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Migration verification complete!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Please check the migration steps.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
