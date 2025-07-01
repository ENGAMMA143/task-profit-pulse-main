export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      daily_tasks: {
        Row: {
          available_at: string | null
          created_at: string | null
          earnings: number | null
          id: string
          reward_amount: number | null
          task_completed: boolean | null
          task_date: string | null
          task_number: number | null
          user_id: string | null
        }
        Insert: {
          available_at?: string | null
          created_at?: string | null
          earnings?: number | null
          id?: string
          reward_amount?: number | null
          task_completed?: boolean | null
          task_date?: string | null
          task_number?: number | null
          user_id?: string | null
        }
        Update: {
          available_at?: string | null
          created_at?: string | null
          earnings?: number | null
          id?: string
          reward_amount?: number | null
          task_completed?: boolean | null
          task_date?: string | null
          task_number?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          amount: number
          amount_expected: number | null
          binance_address: string | null
          created_at: string | null
          id: string
          level_requested:
            | Database["public"]["Enums"]["investment_level"]
            | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          amount_expected?: number | null
          binance_address?: string | null
          created_at?: string | null
          id?: string
          level_requested?:
            | Database["public"]["Enums"]["investment_level"]
            | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          amount_expected?: number | null
          binance_address?: string | null
          created_at?: string | null
          id?: string
          level_requested?:
            | Database["public"]["Enums"]["investment_level"]
            | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          created_at: string | null
          id: string
          level: Database["public"]["Enums"]["investment_level"]
          max_daily_earning: number
          max_deposit: number
          min_daily_earning: number
          min_deposit: number
          tasks_per_day: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: Database["public"]["Enums"]["investment_level"]
          max_daily_earning: number
          max_deposit: number
          min_daily_earning: number
          min_deposit: number
          tasks_per_day: number
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: Database["public"]["Enums"]["investment_level"]
          max_daily_earning?: number
          max_deposit?: number
          min_daily_earning?: number
          min_deposit?: number
          tasks_per_day?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          current_balance: number | null
          current_level: Database["public"]["Enums"]["investment_level"] | null
          email: string
          id: string
          total_deposited: number | null
          total_profit: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          current_balance?: number | null
          current_level?: Database["public"]["Enums"]["investment_level"] | null
          email: string
          id: string
          total_deposited?: number | null
          total_profit?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          current_balance?: number | null
          current_level?: Database["public"]["Enums"]["investment_level"] | null
          email?: string
          id?: string
          total_deposited?: number | null
          total_profit?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      profits: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          level_at_time: Database["public"]["Enums"]["investment_level"]
          profit_date: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          level_at_time: Database["public"]["Enums"]["investment_level"]
          profit_date?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          level_at_time?: Database["public"]["Enums"]["investment_level"]
          profit_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          session_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          session_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      investment_level: "bronze" | "silver" | "gold" | "platinum"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      investment_level: ["bronze", "silver", "gold", "platinum"],
    },
  },
} as const
