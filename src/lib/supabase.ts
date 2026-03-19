import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'audience' | 'artist' | 'admin';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
}

export interface Artist {
  id: string;
  user_id: string;
  name: string;
  bio: string;
  city: string;
  genre: string;
  photo_url: string;
  instagram: string;
  youtube: string;
  spotify: string;
  website: string;
  media_url: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  stream_url: string;
  youtube_video_id: string | null;
  is_live: boolean;
  is_accepting_applications: boolean;
  archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  event_id: string;
  artist_id: string;
  preliminary_song_title: string;
  final_song_title: string;
  technical_requirements: string;
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string;
  created_at: string;
}

export type RoundType = 'preliminary' | 'final';
export type RoundStatus = 'upcoming' | 'active' | 'completed';

export interface Round {
  id: string;
  event_id: string;
  round_number: number;
  round_type: RoundType;
  status: RoundStatus;
  voting_open: boolean;
  max_participants: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Performance {
  id: string;
  event_id: string;
  artist_id: string;
  round_id: string | null;
  song_title: string;
  performance_order: number;
  total_votes: number;
  advanced_to_final: boolean;
  created_at: string;
}

export interface Vote {
  id: string;
  performance_id: string;
  event_id: string;
  round_id: string | null;
  user_id: string;
  base_rating: number;
  multiplier: number;
  weighted_vote: number;
  created_at: string;
}

export interface ShowState {
  id: string;
  event_id: string;
  current_performance_id: string | null;
  current_round_id: string | null;
  voting_open: boolean;
  voting_ends_at: string | null;
  updated_at: string;
  updated_by: string;
}
