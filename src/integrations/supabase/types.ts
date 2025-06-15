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
      account_sync_logs: {
        Row: {
          account_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          sync_data: Json | null
          sync_duration_ms: number | null
          sync_status: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          sync_data?: Json | null
          sync_duration_ms?: number | null
          sync_status: string
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          sync_data?: Json | null
          sync_duration_ms?: number | null
          sync_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_sync_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mt5_connected_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          total_orders: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          description: string | null
          employee_name: string | null
          expense_date: string
          id: string
          is_recurring: boolean
          payment_method: string
          receipt_url: string | null
          recurring_end_date: string | null
          recurring_frequency: string | null
          supplier_name: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          description?: string | null
          employee_name?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean
          payment_method?: string
          receipt_url?: string | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          supplier_name?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          description?: string | null
          employee_name?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean
          payment_method?: string
          receipt_url?: string | null
          recurring_end_date?: string | null
          recurring_frequency?: string | null
          supplier_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          status: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          category_id: string
          created_at: string
          description: string
          duration: string
          estimated_hours: number | null
          id: string
          location_details: string | null
          location_type: string
          payment_amount: number
          payment_currency: string
          payment_type: string
          poster_id: string
          required_skills: string[]
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description: string
          duration: string
          estimated_hours?: number | null
          id?: string
          location_details?: string | null
          location_type: string
          payment_amount: number
          payment_currency?: string
          payment_type: string
          poster_id: string
          required_skills: string[]
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string
          duration?: string
          estimated_hours?: number | null
          id?: string
          location_details?: string | null
          location_type?: string
          payment_amount?: number
          payment_currency?: string
          payment_type?: string
          poster_id?: string
          required_skills?: string[]
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json[] | null
          content: string
          created_at: string | null
          id: string
          role: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json[] | null
          content: string
          created_at?: string | null
          id?: string
          role: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json[] | null
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      mt5_accounts: {
        Row: {
          account_number: number
          balance: number
          company: string | null
          created_at: string
          currency: string
          equity: number
          free_margin: number | null
          id: string
          is_active: boolean
          last_sync: string
          leverage: number | null
          margin: number | null
          margin_level: number | null
          name: string
          server: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: number
          balance: number
          company?: string | null
          created_at?: string
          currency: string
          equity: number
          free_margin?: number | null
          id?: string
          is_active?: boolean
          last_sync?: string
          leverage?: number | null
          margin?: number | null
          margin_level?: number | null
          name: string
          server: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: number
          balance?: number
          company?: string | null
          created_at?: string
          currency?: string
          equity?: number
          free_margin?: number | null
          id?: string
          is_active?: boolean
          last_sync?: string
          leverage?: number | null
          margin?: number | null
          margin_level?: number | null
          name?: string
          server?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mt5_connected_accounts: {
        Row: {
          account_name: string | null
          account_number: number
          balance: number | null
          broker: string | null
          created_at: string | null
          currency: string | null
          equity: number | null
          free_margin: number | null
          id: string
          is_connected: boolean | null
          last_sync: string | null
          leverage: number | null
          margin: number | null
          margin_level: number | null
          server: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number: number
          balance?: number | null
          broker?: string | null
          created_at?: string | null
          currency?: string | null
          equity?: number | null
          free_margin?: number | null
          id?: string
          is_connected?: boolean | null
          last_sync?: string | null
          leverage?: number | null
          margin?: number | null
          margin_level?: number | null
          server: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: number
          balance?: number | null
          broker?: string | null
          created_at?: string | null
          currency?: string | null
          equity?: number | null
          free_margin?: number | null
          id?: string
          is_connected?: boolean | null
          last_sync?: string | null
          leverage?: number | null
          margin?: number | null
          margin_level?: number | null
          server?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mt5_market_data: {
        Row: {
          ask: number
          bid: number
          created_at: string
          id: string
          spread: number
          symbol: string
          timestamp: string
          volume: number | null
        }
        Insert: {
          ask: number
          bid: number
          created_at?: string
          id?: string
          spread: number
          symbol: string
          timestamp?: string
          volume?: number | null
        }
        Update: {
          ask?: number
          bid?: number
          created_at?: string
          id?: string
          spread?: number
          symbol?: string
          timestamp?: string
          volume?: number | null
        }
        Relationships: []
      }
      mt5_trades: {
        Row: {
          close_price: number | null
          close_time: string | null
          comment: string | null
          commission: number | null
          created_at: string
          id: string
          magic_number: number | null
          open_price: number
          open_time: string
          profit: number | null
          status: string
          stop_loss: number | null
          swap: number | null
          symbol: string
          take_profit: number | null
          ticket: number
          trade_type: string
          updated_at: string
          user_id: string
          volume: number
        }
        Insert: {
          close_price?: number | null
          close_time?: string | null
          comment?: string | null
          commission?: number | null
          created_at?: string
          id?: string
          magic_number?: number | null
          open_price: number
          open_time: string
          profit?: number | null
          status?: string
          stop_loss?: number | null
          swap?: number | null
          symbol: string
          take_profit?: number | null
          ticket: number
          trade_type: string
          updated_at?: string
          user_id: string
          volume: number
        }
        Update: {
          close_price?: number | null
          close_time?: string | null
          comment?: string | null
          commission?: number | null
          created_at?: string
          id?: string
          magic_number?: number | null
          open_price?: number
          open_time?: string
          profit?: number | null
          status?: string
          stop_loss?: number | null
          swap?: number | null
          symbol?: string
          take_profit?: number | null
          ticket?: number
          trade_type?: string
          updated_at?: string
          user_id?: string
          volume?: number
        }
        Relationships: []
      }
      Omni: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          page_path: string
          referrer: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          page_path: string
          referrer?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          id: string
          min_stock: number
          name: string
          price: number
          sku: string
          status: string
          stock: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          min_stock?: number
          name: string
          price: number
          sku: string
          status?: string
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          min_stock?: number
          name?: string
          price?: number
          sku?: string
          status?: string
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          created_at: string
          id: string
          receipt_number: string
          receipt_url: string | null
          sale_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receipt_number: string
          receipt_url?: string | null
          sale_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receipt_number?: string
          receipt_url?: string | null
          sale_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          job_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          job_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          job_id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cash_paid: number | null
          created_at: string
          customer_name: string
          debit_balance: number | null
          id: string
          items_count: number
          order_id: string
          payment_method: string | null
          sale_date: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          cash_paid?: number | null
          created_at?: string
          customer_name: string
          debit_balance?: number | null
          id?: string
          items_count: number
          order_id: string
          payment_method?: string | null
          sale_date?: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          cash_paid?: number | null
          created_at?: string
          customer_name?: string
          debit_balance?: number | null
          id?: string
          items_count?: number
          order_id?: string
          payment_method?: string | null
          sale_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          credit_card_token: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_type: string
          trial_expires_at: string | null
          trial_started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credit_card_token?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_type?: string
          trial_expires_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credit_card_token?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_type?: string
          trial_expires_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          analysis: string | null
          Analysis: string | null
          created_at: string
          description: string | null
          eta: string | null
          id: string
          progress: number
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis?: string | null
          Analysis?: string | null
          created_at?: string
          description?: string | null
          eta?: string | null
          id?: string
          progress?: number
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis?: string | null
          Analysis?: string | null
          created_at?: string
          description?: string | null
          eta?: string | null
          id?: string
          progress?: number
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_bot_configs: {
        Row: {
          bot_token: string
          chat_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_token: string
          chat_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_token?: string
          chat_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          id: string
          name: string
          payment_method: string
          plan_id: string
          price: number
          status: string
          timestamp: string
          tx_id: string
          user_email: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          payment_method: string
          plan_id: string
          price: number
          status?: string
          timestamp?: string
          tx_id: string
          user_email?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          payment_method?: string
          plan_id?: string
          price?: number
          status?: string
          timestamp?: string
          tx_id?: string
          user_email?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_employer: boolean | null
          is_freelancer: boolean | null
          location: string | null
          skills: string[] | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_employer?: boolean | null
          is_freelancer?: boolean | null
          location?: string | null
          skills?: string[] | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_employer?: boolean | null
          is_freelancer?: boolean | null
          location?: string | null
          skills?: string[] | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_sessions: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          page_path: string
          referrer: string | null
          session_id: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          page_path: string
          referrer?: string | null
          session_id: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          page_path?: string
          referrer?: string | null
          session_id?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      update_account_sync_status: {
        Args: {
          account_id: string
          sync_status: string
          sync_data?: Json
          error_message?: string
          sync_duration_ms?: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
