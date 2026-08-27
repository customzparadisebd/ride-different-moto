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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_role: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          session_id: string | null
          target_id: string | null
          target_label: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          session_id?: string | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          session_id?: string | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          last_seen_at: string
          revoked_at: string | null
          revoked_by: string | null
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          revoked_at?: string | null
          revoked_by?: string | null
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          revoked_at?: string | null
          revoked_by?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          api_key: string | null
          credentials: Json
          enabled: boolean
          id: string
          model_name: string | null
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          api_key?: string | null
          credentials?: Json
          enabled?: boolean
          id?: string
          model_name?: string | null
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          api_key?: string | null
          credentials?: Json
          enabled?: boolean
          id?: string
          model_name?: string | null
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      bike_models: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          label: string | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          label?: string | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          label?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      courier_api_logs: {
        Row: {
          action: string
          actor_id: string | null
          courier_id: string | null
          created_at: string
          id: string
          message: string | null
          order_id: string | null
          status_code: string | null
          success: boolean
        }
        Insert: {
          action: string
          actor_id?: string | null
          courier_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          order_id?: string | null
          status_code?: string | null
          success?: boolean
        }
        Update: {
          action?: string
          actor_id?: string | null
          courier_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          order_id?: string | null
          status_code?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "courier_api_logs_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_api_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_credentials: {
        Row: {
          api_key: string | null
          api_secret: string | null
          courier_id: string
          extra: Json
          password: string | null
          token: string | null
          updated_at: string
          updated_by: string | null
          username: string | null
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          courier_id: string
          extra?: Json
          password?: string | null
          token?: string | null
          updated_at?: string
          updated_by?: string | null
          username?: string | null
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          courier_id?: string
          extra?: Json
          password?: string | null
          token?: string | null
          updated_at?: string
          updated_by?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_credentials_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: true
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_shipments: {
        Row: {
          booked_at: string | null
          cod_amount: number
          consignment_id: string | null
          courier_id: string | null
          courier_name: string
          courier_status: string
          created_at: string
          delivery_charge: number
          id: string
          is_active: boolean
          last_status_at: string | null
          order_id: string
          response_message: string | null
          response_status: string | null
          sent_by: string | null
          sent_by_label: string
          success: boolean
          tracking_code: string | null
          tracking_url: string | null
        }
        Insert: {
          booked_at?: string | null
          cod_amount?: number
          consignment_id?: string | null
          courier_id?: string | null
          courier_name?: string
          courier_status?: string
          created_at?: string
          delivery_charge?: number
          id?: string
          is_active?: boolean
          last_status_at?: string | null
          order_id: string
          response_message?: string | null
          response_status?: string | null
          sent_by?: string | null
          sent_by_label?: string
          success?: boolean
          tracking_code?: string | null
          tracking_url?: string | null
        }
        Update: {
          booked_at?: string | null
          cod_amount?: number
          consignment_id?: string | null
          courier_id?: string | null
          courier_name?: string
          courier_status?: string
          created_at?: string
          delivery_charge?: number
          id?: string
          is_active?: boolean
          last_status_at?: string | null
          order_id?: string
          response_message?: string | null
          response_status?: string | null
          sent_by?: string | null
          sent_by_label?: string
          success?: boolean
          tracking_code?: string | null
          tracking_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_shipments_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_tracking_events: {
        Row: {
          courier_status: string
          created_at: string
          id: string
          message: string | null
          occurred_at: string
          order_id: string | null
          shipment_id: string
          source: string
        }
        Insert: {
          courier_status: string
          created_at?: string
          id?: string
          message?: string | null
          occurred_at?: string
          order_id?: string | null
          shipment_id: string
          source?: string
        }
        Update: {
          courier_status?: string
          created_at?: string
          id?: string
          message?: string | null
          occurred_at?: string
          order_id?: string | null
          shipment_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "courier_tracking_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "courier_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      couriers: {
        Row: {
          base_url: string
          cod_percent: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          extra_config: Json
          id: string
          inside_charge: number
          is_active: boolean
          logo_url: string | null
          name: string
          outside_charge: number
          phone: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          base_url?: string
          cod_percent?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          extra_config?: Json
          id?: string
          inside_charge?: number
          is_active?: boolean
          logo_url?: string | null
          name: string
          outside_charge?: number
          phone?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          base_url?: string
          cod_percent?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          extra_config?: Json
          id?: string
          inside_charge?: number
          is_active?: boolean
          logo_url?: string | null
          name?: string
          outside_charge?: number
          phone?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_fraud_marks: {
        Row: {
          label: string | null
          mark_type: string
          marked_at: string
          marked_by: string | null
          marked_by_label: string | null
          note: string
          phone_number: string
          updated_at: string
        }
        Insert: {
          label?: string | null
          mark_type?: string
          marked_at?: string
          marked_by?: string | null
          marked_by_label?: string | null
          note: string
          phone_number: string
          updated_at?: string
        }
        Update: {
          label?: string | null
          mark_type?: string
          marked_at?: string
          marked_by?: string | null
          marked_by_label?: string | null
          note?: string
          phone_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          alt_phone: string | null
          area: string | null
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          district: string | null
          email: string | null
          id: string
          is_blacklisted: boolean
          is_favorite: boolean
          is_fraud: boolean
          lifetime_value: number
          name: string
          notes: string | null
          phone: string
          tags: string[]
          total_orders: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          alt_phone?: string | null
          area?: string | null
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          district?: string | null
          email?: string | null
          id?: string
          is_blacklisted?: boolean
          is_favorite?: boolean
          is_fraud?: boolean
          lifetime_value?: number
          name: string
          notes?: string | null
          phone: string
          tags?: string[]
          total_orders?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          alt_phone?: string | null
          area?: string | null
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          district?: string | null
          email?: string | null
          id?: string
          is_blacklisted?: boolean
          is_favorite?: boolean
          is_fraud?: boolean
          lifetime_value?: number
          name?: string
          notes?: string | null
          phone?: string
          tags?: string[]
          total_orders?: number
          updated_at?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          charge: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          charge?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          charge?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      flash_sale_products: {
        Row: {
          created_at: string
          flash_sale_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          flash_sale_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          flash_sale_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_sale_products_flash_sale_id_fkey"
            columns: ["flash_sale_id"]
            isOneToOne: false
            referencedRelation: "flash_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_sale_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string | null
          end_time: string | null
          id: string
          is_active: boolean
          name: string
          priority: number
          start_date: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          start_date?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          start_date?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          bike_model_id: string | null
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_label: string | null
          link_url: string | null
          mobile_image_url: string | null
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bike_model_id?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_label?: string | null
          link_url?: string | null
          mobile_image_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          bike_model_id?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_label?: string | null
          link_url?: string | null
          mobile_image_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hero_slides_bike_model_id_fkey"
            columns: ["bike_model_id"]
            isOneToOne: false
            referencedRelation: "bike_models"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          performed_by: string | null
          performed_by_label: string
          product_id: string
          quantity: number
          reference: string | null
          stock_after: number | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_label?: string
          product_id: string
          quantity: number
          reference?: string | null
          stock_after?: number | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
          performed_by_label?: string
          product_id?: string
          quantity?: number
          reference?: string | null
          stock_after?: number | null
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_collisions: {
        Row: {
          attempted_order_payload: Json | null
          detected_at: string | null
          existing_order_id: string | null
          id: string
          invoice_no: string
        }
        Insert: {
          attempted_order_payload?: Json | null
          detected_at?: string | null
          existing_order_id?: string | null
          id?: string
          invoice_no: string
        }
        Update: {
          attempted_order_payload?: Json | null
          detected_at?: string | null
          existing_order_id?: string | null
          id?: string
          invoice_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_collisions_existing_order_id_fkey"
            columns: ["existing_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_settings: {
        Row: {
          current_number: number
          id: string
          prefix: string
          start_number: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          current_number?: number
          id?: string
          prefix?: string
          start_number?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          current_number?: number
          id?: string
          prefix?: string
          start_number?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          internal_notes: string | null
          message: string | null
          name: string
          phone: string
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          internal_notes?: string | null
          message?: string | null
          name: string
          phone: string
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          internal_notes?: string | null
          message?: string | null
          name?: string
          phone?: string
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          email_key: string
          id: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          email_key: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          email_key?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      mfa_backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nav_items: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          path: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          path: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          path?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      not_found_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          path: string
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          path: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          path?: string
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_damages: {
        Row: {
          created_at: string
          id: string
          order_id: string
          processed_by: string
          product_id: string
          quantity: number
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          processed_by: string
          product_id: string
          quantity: number
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          processed_by?: string
          product_id?: string
          quantity?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_damages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_damages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor: string | null
          actor_label: string
          created_at: string
          event_type: string
          id: string
          message: string | null
          metadata: Json | null
          order_id: string
        }
        Insert: {
          actor?: string | null
          actor_label?: string
          created_at?: string
          event_type: string
          id?: string
          message?: string | null
          metadata?: Json | null
          order_id: string
        }
        Update: {
          actor?: string | null
          actor_label?: string
          created_at?: string
          event_type?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          product_slug: string | null
          quantity: number
          unit_price: number
          variant: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          product_slug?: string | null
          quantity: number
          unit_price: number
          variant?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_slug?: string | null
          quantity?: number
          unit_price?: number
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_returns: {
        Row: {
          created_at: string
          id: string
          order_id: string
          processed_by: string
          product_id: string
          quantity: number
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          processed_by: string
          product_id: string
          quantity: number
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          processed_by?: string
          product_id?: string
          quantity?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_returns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_stock_deductions: {
        Row: {
          deducted_at: string
          id: string
          order_id: string
          order_item_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          deducted_at?: string
          id?: string
          order_id: string
          order_item_id: string
          product_id: string
          quantity: number
        }
        Update: {
          deducted_at?: string
          id?: string
          order_id?: string
          order_item_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_stock_deductions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_stock_deductions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_stock_deductions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_line: string
          advance_paid: number
          assigned_to: string | null
          city: string
          cod_amount: number
          consignment_id: string | null
          courier_id: string | null
          courier_name: string | null
          courier_response: Json | null
          courier_status: string
          courier_tracking_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          delivery_zone: string | null
          discount: number
          duplicate_note: string | null
          id: string
          idempotency_key: string | null
          internal_notes: string | null
          invoice_no: string
          is_duplicate: boolean
          is_pinned: boolean
          notes: string | null
          order_source: string
          payment_method: string
          payment_status: string
          pinned_at: string | null
          pinned_by: string | null
          print_count: number
          printed_at: string | null
          printed_by: string | null
          shipment_at: string | null
          shipping: number
          status: string
          subtotal: number
          total: number
          tracking_url: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          address_line: string
          advance_paid?: number
          assigned_to?: string | null
          city: string
          cod_amount?: number
          consignment_id?: string | null
          courier_id?: string | null
          courier_name?: string | null
          courier_response?: Json | null
          courier_status?: string
          courier_tracking_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_zone?: string | null
          discount?: number
          duplicate_note?: string | null
          id?: string
          idempotency_key?: string | null
          internal_notes?: string | null
          invoice_no: string
          is_duplicate?: boolean
          is_pinned?: boolean
          notes?: string | null
          order_source?: string
          payment_method?: string
          payment_status?: string
          pinned_at?: string | null
          pinned_by?: string | null
          print_count?: number
          printed_at?: string | null
          printed_by?: string | null
          shipment_at?: string | null
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          tracking_url?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          address_line?: string
          advance_paid?: number
          assigned_to?: string | null
          city?: string
          cod_amount?: number
          consignment_id?: string | null
          courier_id?: string | null
          courier_name?: string | null
          courier_response?: Json | null
          courier_status?: string
          courier_tracking_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_zone?: string | null
          discount?: number
          duplicate_note?: string | null
          id?: string
          idempotency_key?: string | null
          internal_notes?: string | null
          invoice_no?: string
          is_duplicate?: boolean
          is_pinned?: boolean
          notes?: string | null
          order_source?: string
          payment_method?: string
          payment_status?: string
          pinned_at?: string | null
          pinned_by?: string | null
          print_count?: number
          printed_at?: string | null
          printed_by?: string | null
          shipment_at?: string | null
          shipping?: number
          status?: string
          subtotal?: number
          total?: number
          tracking_url?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          notes: string | null
          order_id: string | null
          received_by: string | null
          received_by_label: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          order_id?: string | null
          received_by?: string | null
          received_by_label?: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          order_id?: string | null
          received_by?: string | null
          received_by_label?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_360_images: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          image_url: string
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          image_url: string
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          image_url?: string
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_360_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_colors: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          linked_product_id: string | null
          name: string
          price_delta: number
          product_id: string
          sort_order: number
          swatch: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          linked_product_id?: string | null
          name: string
          price_delta?: number
          product_id: string
          sort_order?: number
          swatch?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          linked_product_id?: string | null
          name?: string
          price_delta?: number
          product_id?: string
          sort_order?: number
          swatch?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_colors_linked_product_id_fkey"
            columns: ["linked_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_colors_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge_enabled: boolean
          badge_text: string | null
          badge_type: string | null
          barcode: string | null
          bike_compatibility: string[]
          brand_id: string | null
          category: string
          category_id: string | null
          cost_price: number
          created_at: string
          created_by: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          details: string | null
          dimensions: string | null
          discount_percent: number
          has_360_view: boolean | null
          id: string
          image_url: string | null
          images: Json
          internal_notes: string | null
          is_active: boolean
          is_best_deal: boolean
          is_featured: boolean
          is_new_arrival: boolean
          is_universal: boolean
          low_stock_threshold: number
          name: string
          offer_enabled: boolean
          offer_price: number | null
          out_of_stock_toggle: boolean | null
          price: number
          sku: string
          slug: string
          sort_order: number | null
          stock_qty: number
          supplier_id: string | null
          updated_at: string
          video_enabled: boolean | null
          video_platform: string | null
          video_url: string | null
          weight: number | null
        }
        Insert: {
          badge_enabled?: boolean
          badge_text?: string | null
          badge_type?: string | null
          barcode?: string | null
          bike_compatibility?: string[]
          brand_id?: string | null
          category?: string
          category_id?: string | null
          cost_price?: number
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          details?: string | null
          dimensions?: string | null
          discount_percent?: number
          has_360_view?: boolean | null
          id?: string
          image_url?: string | null
          images?: Json
          internal_notes?: string | null
          is_active?: boolean
          is_best_deal?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_universal?: boolean
          low_stock_threshold?: number
          name: string
          offer_enabled?: boolean
          offer_price?: number | null
          out_of_stock_toggle?: boolean | null
          price?: number
          sku: string
          slug: string
          sort_order?: number | null
          stock_qty?: number
          supplier_id?: string | null
          updated_at?: string
          video_enabled?: boolean | null
          video_platform?: string | null
          video_url?: string | null
          weight?: number | null
        }
        Update: {
          badge_enabled?: boolean
          badge_text?: string | null
          badge_type?: string | null
          barcode?: string | null
          bike_compatibility?: string[]
          brand_id?: string | null
          category?: string
          category_id?: string | null
          cost_price?: number
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          details?: string | null
          dimensions?: string | null
          discount_percent?: number
          has_360_view?: boolean | null
          id?: string
          image_url?: string | null
          images?: Json
          internal_notes?: string | null
          is_active?: boolean
          is_best_deal?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_universal?: boolean
          low_stock_threshold?: number
          name?: string
          offer_enabled?: boolean
          offer_price?: number | null
          out_of_stock_toggle?: boolean | null
          price?: number
          sku?: string
          slug?: string
          sort_order?: number | null
          stock_qty?: number
          supplier_id?: string | null
          updated_at?: string
          video_enabled?: boolean | null
          video_platform?: string | null
          video_url?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_note: string | null
          access_status: string
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          last_login_at: string | null
          last_login_ip: string | null
          mfa_required: boolean
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          access_note?: string | null
          access_status?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          last_login_at?: string | null
          last_login_ip?: string | null
          mfa_required?: boolean
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          access_note?: string | null
          access_status?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          mfa_required?: boolean
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_location: string | null
          author_name: string
          body: string
          created_at: string
          id: string
          is_active: boolean
          rating: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          author_location?: string | null
          author_name: string
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          rating?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author_location?: string | null
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          rating?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      section_settings: {
        Row: {
          button_link: string
          button_text: string
          created_at: string
          display_limit: number
          enabled: boolean
          id: string
          is_slider: boolean
          name: string
          product_category: string | null
          show_see_all: boolean
          slider_items: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          button_link: string
          button_text?: string
          created_at?: string
          display_limit?: number
          enabled?: boolean
          id: string
          is_slider?: boolean
          name: string
          product_category?: string | null
          show_see_all?: boolean
          slider_items?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          button_link?: string
          button_text?: string
          created_at?: string
          display_limit?: number
          enabled?: boolean
          id?: string
          is_slider?: boolean
          name?: string
          product_category?: string | null
          show_see_all?: boolean
          slider_items?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          actor_email: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          route: string | null
        }
        Insert: {
          actor_email?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          route?: string | null
        }
        Update: {
          actor_email?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          route?: string | null
        }
        Relationships: []
      }
      site_logos: {
        Row: {
          category: string
          description: string | null
          id: string
          is_active: boolean | null
          label: string
          settings: Json | null
          storage_path: string | null
          updated_at: string | null
          updated_by: string | null
          url: string | null
        }
        Insert: {
          category: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          settings?: Json | null
          storage_path?: string | null
          updated_at?: string | null
          updated_by?: string | null
          url?: string | null
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          settings?: Json | null
          storage_path?: string | null
          updated_at?: string | null
          updated_by?: string | null
          url?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string | null
          branch_relationship: string | null
          business_description: string | null
          business_hours: Json | null
          business_name: string | null
          city: string | null
          country: string | null
          default_meta_description: string | null
          default_meta_title: string | null
          email: string | null
          id: string
          local_business_schema: Json | null
          main_branch_info: string | null
          organization_schema: Json | null
          phone: string | null
          production_domain: string | null
          social_links: Json | null
          tagline: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          branch_relationship?: string | null
          business_description?: string | null
          business_hours?: Json | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          default_meta_description?: string | null
          default_meta_title?: string | null
          email?: string | null
          id?: string
          local_business_schema?: Json | null
          main_branch_info?: string | null
          organization_schema?: Json | null
          phone?: string | null
          production_domain?: string | null
          social_links?: Json | null
          tagline?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          branch_relationship?: string | null
          business_description?: string | null
          business_hours?: Json | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          default_meta_description?: string | null
          default_meta_title?: string | null
          email?: string | null
          id?: string
          local_business_schema?: Json | null
          main_branch_info?: string | null
          organization_schema?: Json | null
          phone?: string | null
          production_domain?: string | null
          social_links?: Json | null
          tagline?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          platform: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          platform: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      steadfast_stats: {
        Row: {
          id: string
          last_invoice_no: string | null
          last_order_id: string | null
          last_success_at: string | null
          successful_submissions_count: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          last_invoice_no?: string | null
          last_order_id?: string | null
          last_success_at?: string | null
          successful_submissions_count?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          last_invoice_no?: string | null
          last_order_id?: string | null
          last_success_at?: string | null
          successful_submissions_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "steadfast_stats_last_order_id_fkey"
            columns: ["last_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          created_at: string
          id: string
          low_stock_threshold: number
          payment_methods: Json
          shipping_flat: number
          steadfast_base_url: string
          steadfast_enabled: boolean
          support_email: string | null
          support_phone: string
          updated_at: string
          whatsapp_floating_enabled: boolean | null
          whatsapp_floating_position: string | null
          whatsapp_message: string
          whatsapp_phone: string
          zone_charges: Json
        }
        Insert: {
          created_at?: string
          id?: string
          low_stock_threshold?: number
          payment_methods?: Json
          shipping_flat?: number
          steadfast_base_url?: string
          steadfast_enabled?: boolean
          support_email?: string | null
          support_phone?: string
          updated_at?: string
          whatsapp_floating_enabled?: boolean | null
          whatsapp_floating_position?: string | null
          whatsapp_message?: string
          whatsapp_phone?: string
          zone_charges?: Json
        }
        Update: {
          created_at?: string
          id?: string
          low_stock_threshold?: number
          payment_methods?: Json
          shipping_flat?: number
          steadfast_base_url?: string
          steadfast_enabled?: boolean
          support_email?: string | null
          support_phone?: string
          updated_at?: string
          whatsapp_floating_enabled?: boolean | null
          whatsapp_floating_position?: string | null
          whatsapp_message?: string
          whatsapp_phone?: string
          zone_charges?: Json
        }
        Relationships: []
      }
      stress_test_settings: {
        Row: {
          current_number: number
          id: string
          updated_at: string | null
        }
        Insert: {
          current_number?: number
          id?: string
          updated_at?: string | null
        }
        Update: {
          current_number?: number
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_next_invoice_no:
        | { Args: never; Returns: string }
        | { Args: { is_test?: boolean }; Returns: string }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_steadfast_count: {
        Args: { invoice_no: string; order_id: string }
        Returns: undefined
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      next_invoice_no: { Args: never; Returns: string }
      save_invoice_settings: {
        Args: { p_next_number?: number; p_prefix: string }
        Returns: {
          current_number: number
          prefix: string
          start_number: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff" | "super_admin"
      lead_status: "new" | "contacted" | "closed"
      movement_type:
        | "stock_in"
        | "stock_out"
        | "adjustment"
        | "return"
        | "damage"
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
      app_role: ["admin", "manager", "staff", "super_admin"],
      lead_status: ["new", "contacted", "closed"],
      movement_type: [
        "stock_in",
        "stock_out",
        "adjustment",
        "return",
        "damage",
      ],
    },
  },
} as const
