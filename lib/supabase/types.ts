export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          frequency_type: string
          custom_days: number[] | null
          target_count: number
          start_date: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          frequency_type: string
          custom_days?: number[] | null
          target_count: number
          start_date: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          frequency_type?: string
          custom_days?: number[] | null
          target_count?: number
          start_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      habit_checkins: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          checkin_date: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          checkin_date: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          checkin_date?: string
          status?: string
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
