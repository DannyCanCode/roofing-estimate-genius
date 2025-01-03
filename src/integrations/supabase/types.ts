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
      estimates: {
        Row: {
          created_at: string
          drip_edge_length: number | null
          eaves_count: number | null
          eaves_length: number | null
          flashing_length: number | null
          hips_count: number | null
          hips_length: number | null
          id: string
          material_type: string | null
          notes: string | null
          predominant_pitch: string | null
          pricing_details: Json
          rakes_count: number | null
          rakes_length: number | null
          report_id: string
          ridges_count: number | null
          ridges_length: number | null
          status: string
          step_flashing_length: number | null
          total_amount: number | null
          total_penetrations_area: number | null
          total_roof_area: number | null
          total_roof_squares: number | null
          updated_at: string
          valleys_count: number | null
          valleys_length: number | null
          waste_factor_percent: number | null
        }
        Insert: {
          created_at: string
          drip_edge_length?: number | null
          eaves_count?: number | null
          eaves_length?: number | null
          flashing_length?: number | null
          hips_count?: number | null
          hips_length?: number | null
          id?: string
          material_type?: string | null
          notes?: string | null
          predominant_pitch?: string | null
          pricing_details?: Json
          rakes_count?: number | null
          rakes_length?: number | null
          report_id: string
          ridges_count?: number | null
          ridges_length?: number | null
          status?: string
          step_flashing_length?: number | null
          total_amount?: number | null
          total_penetrations_area?: number | null
          total_roof_area?: number | null
          total_roof_squares?: number | null
          updated_at: string
          valleys_count?: number | null
          valleys_length?: number | null
          waste_factor_percent?: number | null
        }
        Update: {
          created_at?: string
          drip_edge_length?: number | null
          eaves_count?: number | null
          eaves_length?: number | null
          flashing_length?: number | null
          hips_count?: number | null
          hips_length?: number | null
          id?: string
          material_type?: string | null
          notes?: string | null
          predominant_pitch?: string | null
          pricing_details?: Json
          rakes_count?: number | null
          rakes_length?: number | null
          report_id?: string
          ridges_count?: number | null
          ridges_length?: number | null
          status?: string
          step_flashing_length?: number | null
          total_amount?: number | null
          total_penetrations_area?: number | null
          total_roof_area?: number | null
          total_roof_squares?: number | null
          updated_at?: string
          valleys_count?: number | null
          valleys_length?: number | null
          waste_factor_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          error_message: string | null
          file_path: string
          id: string
          metadata: Json
          original_filename: string
          page_count: number | null
          processed_text: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_path: string
          id?: string
          metadata: Json
          original_filename: string
          page_count?: number | null
          processed_text?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_path?: string
          id?: string
          metadata?: Json
          original_filename?: string
          page_count?: number | null
          processed_text?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
