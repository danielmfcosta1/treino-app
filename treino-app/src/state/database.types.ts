export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      body_metrics: {
        Row: {
          body_fat: number | null
          created_at: string
          deleted: boolean
          id: string
          measured_at: string
          measurements: Json | null
          notes: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          body_fat?: number | null
          created_at?: string
          deleted?: boolean
          id?: string
          measured_at?: string
          measurements?: Json | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Update: {
          body_fat?: number | null
          created_at?: string
          deleted?: boolean
          id?: string
          measured_at?: string
          measurements?: Json | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      cardio_sessions: {
        Row: {
          avg_heart_rate: number | null
          created_at: string
          deleted: boolean
          distance_meters: number | null
          duration_seconds: number | null
          exercise_id: string | null
          id: string
          max_heart_rate: number | null
          notes: string | null
          updated_at: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          avg_heart_rate?: number | null
          created_at?: string
          deleted?: boolean
          distance_meters?: number | null
          duration_seconds?: number | null
          exercise_id?: string | null
          id?: string
          max_heart_rate?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          workout_id?: string | null
        }
        Update: {
          avg_heart_rate?: number | null
          created_at?: string
          deleted?: boolean
          distance_meters?: number | null
          duration_seconds?: number | null
          exercise_id?: string | null
          id?: string
          max_heart_rate?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cardio_sessions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cardio_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          area: string | null
          banco_rmc: string | null
          chat_id: string
          confirmacao_rmc_at: string | null
          confirmacao_rmc_texto: string | null
          created_at: string
          last_message_at: string
          lead_data: Json
          messages: Json
          status: string
          subtipo_rmc: string | null
          updated_at: string
          urgency: string | null
        }
        Insert: {
          area?: string | null
          banco_rmc?: string | null
          chat_id: string
          confirmacao_rmc_at?: string | null
          confirmacao_rmc_texto?: string | null
          created_at?: string
          last_message_at?: string
          lead_data?: Json
          messages?: Json
          status?: string
          subtipo_rmc?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          area?: string | null
          banco_rmc?: string | null
          chat_id?: string
          confirmacao_rmc_at?: string | null
          confirmacao_rmc_texto?: string | null
          created_at?: string
          last_message_at?: string
          lead_data?: Json
          messages?: Json
          status?: string
          subtipo_rmc?: string | null
          updated_at?: string
          urgency?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string | null
          created_at: string
          deleted: boolean
          equipment: string | null
          force: string | null
          id: string
          is_custom: boolean
          mechanic: string | null
          name: string
          primary_muscles: string[] | null
          secondary_muscles: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          deleted?: boolean
          equipment?: string | null
          force?: string | null
          id?: string
          is_custom?: boolean
          mechanic?: string | null
          name: string
          primary_muscles?: string[] | null
          secondary_muscles?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          deleted?: boolean
          equipment?: string | null
          force?: string | null
          id?: string
          is_custom?: boolean
          mechanic?: string | null
          name?: string
          primary_muscles?: string[] | null
          secondary_muscles?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_messages: {
        Row: {
          chat_id: string
          debounce_token: string
          id: number
          message_text: string
          received_at: string
        }
        Insert: {
          chat_id: string
          debounce_token: string
          id?: number
          message_text: string
          received_at?: string
        }
        Update: {
          chat_id?: string
          debounce_token?: string
          id?: number
          message_text?: string
          received_at?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_at: string
          created_at: string
          deleted: boolean
          exercise_id: string
          id: string
          record_type: string
          reps: number | null
          updated_at: string
          user_id: string
          value: number
          weight: number | null
          workout_id: string | null
        }
        Insert: {
          achieved_at?: string
          created_at?: string
          deleted?: boolean
          exercise_id: string
          id?: string
          record_type: string
          reps?: number | null
          updated_at?: string
          user_id?: string
          value: number
          weight?: number | null
          workout_id?: string | null
        }
        Update: {
          achieved_at?: string
          created_at?: string
          deleted?: boolean
          exercise_id?: string
          id?: string
          record_type?: string
          reps?: number | null
          updated_at?: string
          user_id?: string
          value?: number
          weight?: number | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_photos: {
        Row: {
          created_at: string
          deleted: boolean
          id: string
          notes: string | null
          pose: string | null
          storage_path: string
          taken_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted?: boolean
          id?: string
          notes?: string | null
          pose?: string | null
          storage_path: string
          taken_at?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted?: boolean
          id?: string
          notes?: string | null
          pose?: string | null
          storage_path?: string
          taken_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_exercises: {
        Row: {
          created_at: string
          deleted: boolean
          exercise_id: string
          id: string
          notes: string | null
          position: number
          routine_id: string
          target_reps: string | null
          target_sets: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted?: boolean
          exercise_id: string
          id?: string
          notes?: string | null
          position?: number
          routine_id: string
          target_reps?: string | null
          target_sets?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted?: boolean
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          routine_id?: string
          target_reps?: string | null
          target_sets?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string
          deleted: boolean
          id: string
          name: string
          notes: string | null
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted?: boolean
          id?: string
          name: string
          notes?: string | null
          position?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted?: boolean
          id?: string
          name?: string
          notes?: string | null
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sets: {
        Row: {
          created_at: string
          deleted: boolean
          id: string
          duration_seconds: number | null
          is_completed: boolean
          notes: string | null
          position: number
          reps: number | null
          rir: number | null
          rpe: number | null
          set_type: string
          updated_at: string
          user_id: string
          weight: number | null
          workout_exercise_id: string
        }
        Insert: {
          created_at?: string
          deleted?: boolean
          id?: string
          duration_seconds?: number | null
          is_completed?: boolean
          notes?: string | null
          position?: number
          reps?: number | null
          rir?: number | null
          rpe?: number | null
          set_type?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
          workout_exercise_id: string
        }
        Update: {
          created_at?: string
          deleted?: boolean
          id?: string
          duration_seconds?: number | null
          is_completed?: boolean
          notes?: string | null
          position?: number
          reps?: number | null
          rir?: number | null
          rpe?: number | null
          set_type?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string
          deleted: boolean
          exercise_id: string
          id: string
          notes: string | null
          position: number
          equipment: string | null
          superset_group: number | null
          updated_at: string
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          deleted?: boolean
          exercise_id: string
          id?: string
          notes?: string | null
          position?: number
          equipment?: string | null
          superset_group?: number | null
          updated_at?: string
          user_id?: string
          workout_id: string
        }
        Update: {
          created_at?: string
          deleted?: boolean
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          equipment?: string | null
          superset_group?: number | null
          updated_at?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          deleted: boolean
          ended_at: string | null
          id: string
          name: string | null
          notes: string | null
          routine_id: string | null
          started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted?: boolean
          ended_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          routine_id?: string | null
          started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted?: boolean
          ended_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          routine_id?: string | null
          started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      drain_pending_messages: {
        Args: { chat_id_param: string }
        Returns: {
          message_text: string
          received_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
