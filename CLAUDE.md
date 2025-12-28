# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Texitogether is a React Native mobile application built with Expo Router and Supabase. The app facilitates carpooling/ridesharing with phone-based authentication and room-based ride coordination.

## Development Commands

### Start Development Server
```bash
npm install                # Install dependencies
npx expo start             # Start development server
```

### Platform-Specific Launch
```bash
npm run android            # Launch on Android emulator
npm run ios               # Launch on iOS simulator
npm run web               # Launch web version
```

### Code Quality
```bash
npm run lint              # Run ESLint
```

## Architecture

### Routing
- **File-based routing** using Expo Router (v6)
- All screens in `app/` directory map directly to routes
- Root entry point: [app/index.tsx](app/index.tsx) - handles auth state and redirects
- Main layout: [app/_layout.tsx](app/_layout.tsx) - configures navigation stack and theme
- Tab navigation: `app/(tabs)/` directory with `_layout.tsx`
- Auth screens: `app/auth/` directory (sign-in, verify-otp)

### Authentication Flow
1. User opens app → [app/index.tsx](app/index.tsx) checks Supabase session
2. No session → redirect to `/auth/sign-in` (phone number OTP)
3. OTP sent → redirect to `/auth/verify-otp`
4. Session exists → redirect to `/(tabs)` (main app)
5. Auth state changes are monitored via `supabase.auth.onAuthStateChange()`

### Supabase Integration
- Client configured in [src/lib/supabase.ts](src/lib/supabase.ts)
- Uses platform-specific storage (AsyncStorage for mobile, localStorage for web)
- Environment variables: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`
- Auto-refresh tokens enabled with persistent sessions

### Database Schema
The app uses these main tables:

**profiles** (user data):
- Linked to `auth.users` via UUID
- Fields: `full_name`, `affiliation` (Mil/KATUSA/Civilian), `dod_id`, `verification_status`, `id_card_url`, `phone_number`
- Auto-created via trigger when auth user is created

**rooms** (carpool rides):
- Fields: `start_point`, `end_point`, `departure_time`, `capacity`, `status`, `host_id`
- Status enum: recruiting/full/in_progress/completed

**room_members** (join table):
- Links users to rooms they've joined
- Composite primary key on (room_id, user_id)

### Path Aliases
- `@/` maps to project root (configured in [tsconfig.json](tsconfig.json) and [babel.config.js](babel.config.js))
- Import example: `import { supabase } from '@/src/lib/supabase'`

### Theming
- Uses React Navigation theme system (DarkTheme/DefaultTheme)
- Custom themed components: `ThemedView`, `ThemedText` in `components/`
- Color scheme detection via `@/hooks/use-color-scheme`

### Expo Configuration
- Project slug: `Texitogether`
- New Architecture enabled (`newArchEnabled: true`)
- Typed routes enabled (`experiments.typedRoutes: true`)
- React Compiler enabled (`experiments.reactCompiler: true`)
- Supports iOS, Android, and Web

## Key Dependencies
- **expo-router**: File-based navigation
- **@supabase/supabase-js**: Backend and auth
- **react-native-url-polyfill**: Required for Supabase on React Native
- **@react-native-async-storage/async-storage**: Mobile session persistence
- **task-master-ai**: AI task management (configured in `.gemini/settings.json`)

## Environment Setup
Copy `.env.example` to `.env` and configure:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- API keys for task-master-ai (if using)

## Database Migrations
Located in `supabase/migrations/`:
1. `01_create_enums.sql` - Custom enum types
2. `02_create_profiles_table.sql` - User profiles
3. `03_create_rooms_table.sql` - Carpool rooms
4. `04_create_room_members_table.sql` - Room membership
5. `05_enable_rls.sql` - Row Level Security policies
6. `20240101000007_create_handle_new_user_function.sql` - Auto-create profile trigger

## Important Notes
- All auth routes must be configured in the Stack navigator in [app/_layout.tsx](app/_layout.tsx)
- Supabase client should be imported from `@/src/lib/supabase`, not re-instantiated
- Phone authentication uses OTP flow via `supabase.auth.signInWithOtp()`
