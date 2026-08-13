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
    PostgrestVersion: "14.15"
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
      customers: {
        Row: {
          address: string | null
          alt_phone: string | null
          area: string | null
          created_at: string
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
      hero_slides: {
        Row: {
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
        Relationships: []
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
      product_colors: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
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
          name?: string
          price_delta?: number
          product_id?: string
          sort_order?: number
          swatch?: string
          updated_at?: string
        }
        Relationships: [
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
          price: number
          sku: string
          slug: string
          sort_order: number | null
          stock_qty: number
          supplier_id: string | null
          updated_at: string
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
          price?: number
          sku: string
          slug: string
          sort_order?: number | null
          stock_qty?: number
          supplier_id?: string | null
          updated_at?: string
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
          price?: number
          sku?: string
          slug?: string
          sort_order?: number | null
          stock_qty?: number
          supplier_id?: string | null
          updated_at?: string
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
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          mfa_required: boolean
          updated_at: string
        }
        Insert: {
          access_note?: string | null
          access_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          mfa_required?: boolean
          updated_at?: string
        }
        Update: {
          access_note?: string | null
          access_status?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          mfa_required?: boolean
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      next_invoice_no: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff" | "super_admin"
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
