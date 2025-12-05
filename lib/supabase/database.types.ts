/**
 * Supabase Database Types
 * 
 * Auto-generated types for the Campus Connect schema.
 * Regenerate with: supabase gen types typescript --local > lib/supabase/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          username: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          username: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          username?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          user_id: string
          name: string | null
          avatar: string | null
          bio: string | null
          major: string | null
          year: string | null
          student_id: string | null
          topics: string[]
          squads: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name?: string | null
          avatar?: string | null
          bio?: string | null
          major?: string | null
          year?: string | null
          student_id?: string | null
          topics?: string[]
          squads?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          name?: string | null
          avatar?: string | null
          bio?: string | null
          major?: string | null
          year?: string | null
          student_id?: string | null
          topics?: string[]
          squads?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          interests: string[]
          preferred_event_types: string[]
          preferred_squad_topics: string[]
          notification_frequency: string
          discovery_enabled: boolean
          last_updated: string
        }
        Insert: {
          user_id: string
          interests?: string[]
          preferred_event_types?: string[]
          preferred_squad_topics?: string[]
          notification_frequency?: string
          discovery_enabled?: boolean
          last_updated?: string
        }
        Update: {
          user_id?: string
          interests?: string[]
          preferred_event_types?: string[]
          preferred_squad_topics?: string[]
          notification_frequency?: string
          discovery_enabled?: boolean
          last_updated?: string
        }
      }
      user_levels: {
        Row: {
          user_id: string
          total_points: number
          total_events_attended: number
          total_squads_created: number
          total_messages_count: number
          login_streak: number
          current_level: string
          achievements: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          total_points?: number
          total_events_attended?: number
          total_squads_created?: number
          total_messages_count?: number
          login_streak?: number
          current_level?: string
          achievements?: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_points?: number
          total_events_attended?: number
          total_squads_created?: number
          total_messages_count?: number
          login_streak?: number
          current_level?: string
          achievements?: Json
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          title: string
          description: string | null
          owner_id: string | null
          privacy: string
          topics: string[]
          location: string | null
          avatar: string | null
          member_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          owner_id?: string | null
          privacy?: string
          topics?: string[]
          location?: string | null
          avatar?: string | null
          member_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          owner_id?: string | null
          privacy?: string
          topics?: string[]
          location?: string | null
          avatar?: string | null
          member_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          title: string
          description: string | null
          host_id: string | null
          group_id: string | null
          location: string
          start_at: string
          end_at: string
          capacity: number | null
          privacy: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          host_id?: string | null
          group_id?: string | null
          location: string
          start_at: string
          end_at: string
          capacity?: number | null
          privacy?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          host_id?: string | null
          group_id?: string | null
          location?: string
          start_at?: string
          end_at?: string
          capacity?: number | null
          privacy?: string
          created_at?: string
          updated_at?: string
        }
      }
      session_rsvps: {
        Row: {
          id: string
          session_id: string
          user_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      spaces: {
        Row: {
          id: string
          group_id: string
          host_id: string | null
          title: string
          description: string | null
          type: string
          privacy: string
          status: string
          max_participants: number
          audio_enabled: boolean
          video_enabled: boolean
          screenshare_enabled: boolean
          started_at: string
          ended_at: string | null
          scheduled_for: string | null
          session_id: string | null
          chat_room_id: string | null
          peak_participants: number
          total_joins: number
          room_name: string | null
          room_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          host_id?: string | null
          title: string
          description?: string | null
          type: string
          privacy: string
          status?: string
          max_participants?: number
          audio_enabled?: boolean
          video_enabled?: boolean
          screenshare_enabled?: boolean
          started_at?: string
          ended_at?: string | null
          scheduled_for?: string | null
          session_id?: string | null
          chat_room_id?: string | null
          peak_participants?: number
          total_joins?: number
          room_name?: string | null
          room_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          host_id?: string | null
          title?: string
          description?: string | null
          type?: string
          privacy?: string
          status?: string
          max_participants?: number
          audio_enabled?: boolean
          video_enabled?: boolean
          screenshare_enabled?: boolean
          started_at?: string
          ended_at?: string | null
          scheduled_for?: string | null
          session_id?: string | null
          chat_room_id?: string | null
          peak_participants?: number
          total_joins?: number
          room_name?: string | null
          room_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      space_participants: {
        Row: {
          id: string
          space_id: string
          user_id: string
          role: string
          audio_muted: boolean
          video_muted: boolean
          hand_raised: boolean
          screen_sharing: boolean
          connection_status: string
          joined_at: string
          left_at: string | null
        }
        Insert: {
          id?: string
          space_id: string
          user_id: string
          role?: string
          audio_muted?: boolean
          video_muted?: boolean
          hand_raised?: boolean
          screen_sharing?: boolean
          connection_status?: string
          joined_at?: string
          left_at?: string | null
        }
        Update: {
          id?: string
          space_id?: string
          user_id?: string
          role?: string
          audio_muted?: boolean
          video_muted?: boolean
          hand_raised?: boolean
          screen_sharing?: boolean
          connection_status?: string
          joined_at?: string
          left_at?: string | null
        }
      }
      space_invitations: {
        Row: {
          id: string
          space_id: string
          invited_user_id: string
          invited_by_user_id: string
          status: string
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          space_id: string
          invited_user_id: string
          invited_by_user_id: string
          status?: string
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          space_id?: string
          invited_user_id?: string
          invited_by_user_id?: string
          status?: string
          created_at?: string
          expires_at?: string | null
        }
      }
      chat_rooms: {
        Row: {
          id: string
          group_id: string | null
          name: string
          topic: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id?: string | null
          name: string
          topic?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string | null
          name?: string
          topic?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          chat_room_id: string
          sender_id: string | null
          content: string
          reactions: Json
          created_at: string
        }
        Insert: {
          id?: string
          chat_room_id: string
          sender_id?: string | null
          content: string
          reactions?: Json
          created_at?: string
        }
        Update: {
          id?: string
          chat_room_id?: string
          sender_id?: string | null
          content?: string
          reactions?: Json
          created_at?: string
        }
      }
      group_messages: {
        Row: {
          id: string
          group_id: string | null
          session_id: string | null
          sender_id: string | null
          content: string
          reply_to_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id?: string | null
          session_id?: string | null
          sender_id?: string | null
          content: string
          reply_to_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string | null
          session_id?: string | null
          sender_id?: string | null
          content?: string
          reply_to_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          action_url: string | null
          related_id: string | null
          metadata: Json | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          action_url?: string | null
          related_id?: string | null
          metadata?: Json | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          action_url?: string | null
          related_id?: string | null
          metadata?: Json | null
          read_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      squads: {
        Row: {
          id: string
          name: string
          description: string | null
          creator_id: string | null
          interests: string[]
          image: string | null
          location: string | null
          privacy: string
          member_count: number
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
