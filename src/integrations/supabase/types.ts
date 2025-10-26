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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      approved_admin_emails: {
        Row: {
          added_at: string
          added_by: string | null
          email: string
          id: string
          notes: string | null
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          email: string
          id?: string
          notes?: string | null
        }
        Update: {
          added_at?: string
          added_by?: string | null
          email?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      carriers: {
        Row: {
          am_best_rating: string | null
          company_history: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          employees: string | null
          founded: string | null
          headquarters: string | null
          id: string
          illustration_url: string | null
          logo_url: string | null
          name: string
          niches: string[] | null
          pdf_documents: Json | null
          phone: string | null
          portal_url: string | null
          products: string[] | null
          quotes_url: string | null
          short_code: string
          special_products: string[] | null
          turnaround: string | null
          underwriting_strengths: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          am_best_rating?: string | null
          company_history?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employees?: string | null
          founded?: string | null
          headquarters?: string | null
          id?: string
          illustration_url?: string | null
          logo_url?: string | null
          name: string
          niches?: string[] | null
          pdf_documents?: Json | null
          phone?: string | null
          portal_url?: string | null
          products?: string[] | null
          quotes_url?: string | null
          short_code: string
          special_products?: string[] | null
          turnaround?: string | null
          underwriting_strengths?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          am_best_rating?: string | null
          company_history?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employees?: string | null
          founded?: string | null
          headquarters?: string | null
          id?: string
          illustration_url?: string | null
          logo_url?: string | null
          name?: string
          niches?: string[] | null
          pdf_documents?: Json | null
          phone?: string | null
          portal_url?: string | null
          products?: string[] | null
          quotes_url?: string | null
          short_code?: string
          special_products?: string[] | null
          turnaround?: string | null
          underwriting_strengths?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_items: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          id: string
          time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trainings: {
        Row: {
          category: string | null
          completed_count: number | null
          created_at: string | null
          created_by: string | null
          description: string
          description_html: string | null
          duration: number
          embed_code: string | null
          id: string
          level: Database["public"]["Enums"]["training_level"]
          notify_email: boolean | null
          notify_on_publish: boolean | null
          notify_sms: boolean | null
          publish_date: string | null
          resources: Json | null
          specific_agents: string[] | null
          status: Database["public"]["Enums"]["training_status"] | null
          tags: string[] | null
          thumbnail_url: string
          title: string
          type: Database["public"]["Enums"]["training_type"]
          updated_at: string | null
          video_type: string | null
          video_url: string | null
          views: number | null
          visibility: string[] | null
        }
        Insert: {
          category?: string | null
          completed_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description: string
          description_html?: string | null
          duration: number
          embed_code?: string | null
          id?: string
          level: Database["public"]["Enums"]["training_level"]
          notify_email?: boolean | null
          notify_on_publish?: boolean | null
          notify_sms?: boolean | null
          publish_date?: string | null
          resources?: Json | null
          specific_agents?: string[] | null
          status?: Database["public"]["Enums"]["training_status"] | null
          tags?: string[] | null
          thumbnail_url: string
          title: string
          type: Database["public"]["Enums"]["training_type"]
          updated_at?: string | null
          video_type?: string | null
          video_url?: string | null
          views?: number | null
          visibility?: string[] | null
        }
        Update: {
          category?: string | null
          completed_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          description_html?: string | null
          duration?: number
          embed_code?: string | null
          id?: string
          level?: Database["public"]["Enums"]["training_level"]
          notify_email?: boolean | null
          notify_on_publish?: boolean | null
          notify_sms?: boolean | null
          publish_date?: string | null
          resources?: Json | null
          specific_agents?: string[] | null
          status?: Database["public"]["Enums"]["training_status"] | null
          tags?: string[] | null
          thumbnail_url?: string
          title?: string
          type?: Database["public"]["Enums"]["training_type"]
          updated_at?: string | null
          video_type?: string | null
          video_url?: string | null
          views?: number | null
          visibility?: string[] | null
        }
        Relationships: []
      }
      user_brand_kits: {
        Row: {
          accent_color: string | null
          company_name: string
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          tagline: string | null
          text_color: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          company_name: string
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tagline?: string | null
          text_color?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tagline?: string | null
          text_color?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_brand_kits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_at: string
          invited_by: string | null
          notes: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }
        Insert: {
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_at?: string
          invited_by?: string | null
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Update: {
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_at?: string
          invited_by?: string | null
          notes?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Relationships: []
      }
      user_marketing_templates: {
        Row: {
          content: string | null
          created_at: string
          description: string
          file_url: string | null
          id: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          description: string
          file_url?: string | null
          id?: string
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string
          file_url?: string | null
          id?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_marketing_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_training_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_accessed_at: string | null
          last_watched_position: number | null
          progress_percentage: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["progress_status"] | null
          training_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_accessed_at?: string | null
          last_watched_position?: number | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["progress_status"] | null
          training_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_accessed_at?: string | null
          last_watched_position?: number | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["progress_status"] | null
          training_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_progress_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_training_views: {
        Args: { training_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "user"
      progress_status: "not_started" | "in_progress" | "completed"
      training_level: "beginner" | "intermediate" | "advanced"
      training_status: "draft" | "published" | "archived"
      training_type: "video" | "audio" | "article" | "pdf" | "quiz" | "live"
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
    Enums: {
      app_role: ["admin", "agent", "user"],
      progress_status: ["not_started", "in_progress", "completed"],
      training_level: ["beginner", "intermediate", "advanced"],
      training_status: ["draft", "published", "archived"],
      training_type: ["video", "audio", "article", "pdf", "quiz", "live"],
    },
  },
} as const
