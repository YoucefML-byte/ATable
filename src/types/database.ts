
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "allergens": {
                  Row: {
                    "code": string,"label_fr": string,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"label_fr": string,"position": number
                  }
                  Update: {
                    "code"?: string,"label_fr"?: string,"position"?: number
                  }
                  Relationships: [
                    
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_kind": string,"actor_member_id": string | null,"actor_user_id": string | null,"changes": Json | null,"created_at": string,"entity_id": string | null,"entity_type": string | null,"id": number,"request_ip": unknown,"shop_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_kind": string,"actor_member_id"?: string | null,"actor_user_id"?: string | null,"changes"?: Json | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: never,"request_ip"?: unknown,"shop_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_kind"?: string,"actor_member_id"?: string | null,"actor_user_id"?: string | null,"changes"?: Json | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: never,"request_ip"?: unknown,"shop_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"description": string | null,"id": string,"is_hidden": boolean,"is_sold_out": boolean,"name": string,"position": number,"prep_station": Database["public"]['Enums']["prep_station"],"shop_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"description"?: string | null,"id"?: string,"is_hidden"?: boolean,"is_sold_out"?: boolean,"name": string,"position"?: number,"prep_station"?: Database["public"]['Enums']["prep_station"],"shop_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"description"?: string | null,"id"?: string,"is_hidden"?: boolean,"is_sold_out"?: boolean,"name"?: string,"position"?: number,"prep_station"?: Database["public"]['Enums']["prep_station"],"shop_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"devices": {
                  Row: {
                    "enrolled_at": string,"enrolled_by": string,"failed_attempts": number,"failed_attempts_window_start": string | null,"id": string,"last_seen_at": string | null,"locked": boolean,"name": string,"revoked_at": string | null,"revoked_by": string | null,"secret_hash": string,"shop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "enrolled_at"?: string,"enrolled_by": string,"failed_attempts"?: number,"failed_attempts_window_start"?: string | null,"id"?: string,"last_seen_at"?: string | null,"locked"?: boolean,"name": string,"revoked_at"?: string | null,"revoked_by"?: string | null,"secret_hash": string,"shop_id": string
                  }
                  Update: {
                    "enrolled_at"?: string,"enrolled_by"?: string,"failed_attempts"?: number,"failed_attempts_window_start"?: string | null,"id"?: string,"last_seen_at"?: string | null,"locked"?: boolean,"name"?: string,"revoked_at"?: string | null,"revoked_by"?: string | null,"secret_hash"?: string,"shop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "devices_enrolled_by_fkey"
      columns: ["enrolled_by"]
isOneToOne: false
      referencedRelation: "shop_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "devices_revoked_by_fkey"
      columns: ["revoked_by"]
isOneToOne: false
      referencedRelation: "shop_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "devices_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"dining_tables": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"id": string,"is_active": boolean,"label": string,"position": number,"seats": number | null,"shop_id": string,"updated_at": string,"zone": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"id"?: string,"is_active"?: boolean,"label": string,"position"?: number,"seats"?: number | null,"shop_id": string,"updated_at"?: string,"zone"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"id"?: string,"is_active"?: boolean,"label"?: string,"position"?: number,"seats"?: number | null,"shop_id"?: string,"updated_at"?: string,"zone"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "dining_tables_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"menu_categories": {
                  Row: {
                    "category_id": string,"menu_id": string,"position": number,"shop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"menu_id": string,"position"?: number,"shop_id": string
                  }
                  Update: {
                    "category_id"?: string,"menu_id"?: string,"position"?: number,"shop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "menu_categories_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "menu_categories_menu_id_fkey"
      columns: ["menu_id"]
isOneToOne: false
      referencedRelation: "menus"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "menu_categories_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"menu_schedules": {
                  Row: {
                    "days": (number)[],"end_time": string,"id": string,"menu_id": string,"shop_id": string,"start_time": string
                  }
                  ComputedFields: never
                  Insert: {
                    "days": (number)[],"end_time": string,"id"?: string,"menu_id": string,"shop_id": string,"start_time": string
                  }
                  Update: {
                    "days"?: (number)[],"end_time"?: string,"id"?: string,"menu_id"?: string,"shop_id"?: string,"start_time"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "menu_schedules_menu_id_fkey"
      columns: ["menu_id"]
isOneToOne: false
      referencedRelation: "menus"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "menu_schedules_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"menus": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"description": string | null,"id": string,"is_active": boolean,"is_default": boolean,"name": string,"position": number,"shop_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"is_default"?: boolean,"name": string,"position"?: number,"shop_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean,"is_default"?: boolean,"name"?: string,"position"?: number,"shop_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "menus_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"option_allergens": {
                  Row: {
                    "allergen_code": string,"option_id": string,"presence": Database["public"]['Enums']["allergen_presence"],"shop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allergen_code": string,"option_id": string,"presence": Database["public"]['Enums']["allergen_presence"],"shop_id": string
                  }
                  Update: {
                    "allergen_code"?: string,"option_id"?: string,"presence"?: Database["public"]['Enums']["allergen_presence"],"shop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "option_allergens_allergen_code_fkey"
      columns: ["allergen_code"]
isOneToOne: false
      referencedRelation: "allergens"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "option_allergens_option_id_fkey"
      columns: ["option_id"]
isOneToOne: false
      referencedRelation: "options"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "option_allergens_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"option_groups": {
                  Row: {
                    "allow_quantity": boolean,"created_at": string,"deleted_at": string | null,"id": string,"internal_name": string | null,"is_hidden": boolean,"max_per_option": number,"max_select": number | null,"min_select": number,"name": string,"position": number,"shop_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allow_quantity"?: boolean,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"internal_name"?: string | null,"is_hidden"?: boolean,"max_per_option"?: number,"max_select"?: number | null,"min_select"?: number,"name": string,"position"?: number,"shop_id": string,"updated_at"?: string
                  }
                  Update: {
                    "allow_quantity"?: boolean,"created_at"?: string,"deleted_at"?: string | null,"id"?: string,"internal_name"?: string | null,"is_hidden"?: boolean,"max_per_option"?: number,"max_select"?: number | null,"min_select"?: number,"name"?: string,"position"?: number,"shop_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "option_groups_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"options": {
                  Row: {
                    "allergens_declared_at": string | null,"created_at": string,"deleted_at": string | null,"group_id": string,"id": string,"is_default": boolean,"is_hidden": boolean,"is_sold_out": boolean,"name": string,"position": number,"price_delta_cents": number,"shop_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allergens_declared_at"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"group_id": string,"id"?: string,"is_default"?: boolean,"is_hidden"?: boolean,"is_sold_out"?: boolean,"name": string,"position"?: number,"price_delta_cents"?: number,"shop_id": string,"updated_at"?: string
                  }
                  Update: {
                    "allergens_declared_at"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"group_id"?: string,"id"?: string,"is_default"?: boolean,"is_hidden"?: boolean,"is_sold_out"?: boolean,"name"?: string,"position"?: number,"price_delta_cents"?: number,"shop_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "options_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "option_groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "options_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"order_item_options": {
                  Row: {
                    "group_id": string,"group_name": string,"id": string,"option_id": string,"option_name": string,"order_item_id": string,"price_delta_cents": number,"quantity": number,"shop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "group_id": string,"group_name": string,"id"?: string,"option_id": string,"option_name": string,"order_item_id": string,"price_delta_cents": number,"quantity"?: number,"shop_id": string
                  }
                  Update: {
                    "group_id"?: string,"group_name"?: string,"id"?: string,"option_id"?: string,"option_name"?: string,"order_item_id"?: string,"price_delta_cents"?: number,"quantity"?: number,"shop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_item_options_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "option_groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_item_options_option_id_fkey"
      columns: ["option_id"]
isOneToOne: false
      referencedRelation: "options"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_item_options_order_item_id_fkey"
      columns: ["order_item_id"]
isOneToOne: false
      referencedRelation: "order_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_item_options_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "base_price_cents": number,"category_name": string,"id": string,"line_total_cents": number,"order_id": string,"position": number,"prep_station": Database["public"]['Enums']["prep_station"],"product_id": string,"product_name": string,"quantity": number,"shop_id": string,"unit_price_cents": number
                  }
                  ComputedFields: never
                  Insert: {
                    "base_price_cents": number,"category_name": string,"id"?: string,"line_total_cents": number,"order_id": string,"position": number,"prep_station": Database["public"]['Enums']["prep_station"],"product_id": string,"product_name": string,"quantity": number,"shop_id": string,"unit_price_cents": number
                  }
                  Update: {
                    "base_price_cents"?: number,"category_name"?: string,"id"?: string,"line_total_cents"?: number,"order_id"?: string,"position"?: number,"prep_station"?: Database["public"]['Enums']["prep_station"],"product_id"?: string,"product_name"?: string,"quantity"?: number,"shop_id"?: string,"unit_price_cents"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"order_status_events": {
                  Row: {
                    "actor_id": string | null,"actor_name": string | null,"created_at": string,"from_status": Database["public"]['Enums']["order_status"] | null,"id": number,"order_id": string,"reason": string | null,"shop_id": string,"to_status": Database["public"]['Enums']["order_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"actor_name"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["order_status"] | null,"id"?: never,"order_id": string,"reason"?: string | null,"shop_id": string,"to_status": Database["public"]['Enums']["order_status"]
                  }
                  Update: {
                    "actor_id"?: string | null,"actor_name"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["order_status"] | null,"id"?: never,"order_id"?: string,"reason"?: string | null,"shop_id"?: string,"to_status"?: Database["public"]['Enums']["order_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_status_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "shop_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_status_events_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_status_events_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"business_day": string,"cancelled_at": string | null,"cancelled_by": string | null,"client_key_hash": string | null,"created_at": string,"id": string,"idempotency_key": string,"internal_reason": string | null,"item_count": number,"note": string | null,"number": number,"ready_at": string | null,"ready_by": string | null,"rejected_at": string | null,"rejected_by": string | null,"served_at": string | null,"served_by": string | null,"shop_id": string,"source": Database["public"]['Enums']["order_source"],"status": Database["public"]['Enums']["order_status"],"subtotal_cents": number,"table_id": string,"table_session_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"business_day": string,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"client_key_hash"?: string | null,"created_at"?: string,"id"?: string,"idempotency_key": string,"internal_reason"?: string | null,"item_count"?: number,"note"?: string | null,"number": number,"ready_at"?: string | null,"ready_by"?: string | null,"rejected_at"?: string | null,"rejected_by"?: string | null,"served_at"?: string | null,"served_by"?: string | null,"shop_id": string,"source"?: Database["public"]['Enums']["order_source"],"status"?: Database["public"]['Enums']["order_status"],"subtotal_cents"?: number,"table_id": string,"table_session_id": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"business_day"?: string,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"client_key_hash"?: string | null,"created_at"?: string,"id"?: string,"idempotency_key"?: string,"internal_reason"?: string | null,"item_count"?: number,"note"?: string | null,"number"?: number,"ready_at"?: string | null,"ready_by"?: string | null,"rejected_at"?: string | null,"rejected_by"?: string | null,"served_at"?: string | null,"served_by"?: string | null,"shop_id"?: string,"source"?: Database["public"]['Enums']["order_source"],"status"?: Database["public"]['Enums']["order_status"],"subtotal_cents"?: number,"table_id"?: string,"table_session_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_accepted_by_fkey"
      columns: ["accepted_by"]
isOneToOne: false
      referencedRelation: "shop_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_cancelled_by_fkey"
      columns: ["cancelled_by"]
isOneToOne: false
      referencedRelation: "shop_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_ready_by_fkey"
      columns: ["ready_by"]
isOneToOne: false
      referencedRelation: "shop_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_rejected_by_fkey"
      columns: ["rejected_by"]
isOneToOne: false
      referencedRelation: "shop_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_served_by_fkey"
      columns: ["served_by"]
isOneToOne: false
      referencedRelation: "shop_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_table_id_fkey"
      columns: ["table_id"]
isOneToOne: false
      referencedRelation: "dining_tables"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_table_session_id_fkey"
      columns: ["table_session_id"]
isOneToOne: false
      referencedRelation: "table_sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"platform_admins": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"product_allergens": {
                  Row: {
                    "allergen_code": string,"presence": Database["public"]['Enums']["allergen_presence"],"product_id": string,"shop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allergen_code": string,"presence": Database["public"]['Enums']["allergen_presence"],"product_id": string,"shop_id": string
                  }
                  Update: {
                    "allergen_code"?: string,"presence"?: Database["public"]['Enums']["allergen_presence"],"product_id"?: string,"shop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_allergens_allergen_code_fkey"
      columns: ["allergen_code"]
isOneToOne: false
      referencedRelation: "allergens"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "product_allergens_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_allergens_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"product_option_groups": {
                  Row: {
                    "group_id": string,"max_override": number | null,"min_override": number | null,"position": number,"product_id": string,"shop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "group_id": string,"max_override"?: number | null,"min_override"?: number | null,"position"?: number,"product_id": string,"shop_id": string
                  }
                  Update: {
                    "group_id"?: string,"max_override"?: number | null,"min_override"?: number | null,"position"?: number,"product_id"?: string,"shop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_option_groups_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "option_groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_option_groups_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_option_groups_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "allergens_declared_at": string | null,"base_price_cents": number,"category_id": string,"created_at": string,"deleted_at": string | null,"description": string | null,"id": string,"image_path": string | null,"is_hidden": boolean,"is_sold_out": boolean,"name": string,"origin_info": string | null,"position": number,"shop_id": string,"tags": (string)[],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allergens_declared_at"?: string | null,"base_price_cents": number,"category_id": string,"created_at"?: string,"deleted_at"?: string | null,"description"?: string | null,"id"?: string,"image_path"?: string | null,"is_hidden"?: boolean,"is_sold_out"?: boolean,"name": string,"origin_info"?: string | null,"position"?: number,"shop_id": string,"tags"?: (string)[],"updated_at"?: string
                  }
                  Update: {
                    "allergens_declared_at"?: string | null,"base_price_cents"?: number,"category_id"?: string,"created_at"?: string,"deleted_at"?: string | null,"description"?: string | null,"id"?: string,"image_path"?: string | null,"is_hidden"?: boolean,"is_sold_out"?: boolean,"name"?: string,"origin_info"?: string | null,"position"?: number,"shop_id"?: string,"tags"?: (string)[],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"shop_billing": {
                  Row: {
                    "monthly_fee_cents": number | null,"next_due_on": string | null,"notes": string | null,"setup_fee_cents": number | null,"setup_paid_at": string | null,"shop_id": string,"status": Database["public"]['Enums']["billing_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "monthly_fee_cents"?: number | null,"next_due_on"?: string | null,"notes"?: string | null,"setup_fee_cents"?: number | null,"setup_paid_at"?: string | null,"shop_id": string,"status"?: Database["public"]['Enums']["billing_status"],"updated_at"?: string
                  }
                  Update: {
                    "monthly_fee_cents"?: number | null,"next_due_on"?: string | null,"notes"?: string | null,"setup_fee_cents"?: number | null,"setup_paid_at"?: string | null,"shop_id"?: string,"status"?: Database["public"]['Enums']["billing_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shop_billing_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: true
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"shop_daily_counters": {
                  Row: {
                    "business_day": string,"last_number": number,"shop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_day": string,"last_number": number,"shop_id": string
                  }
                  Update: {
                    "business_day"?: string,"last_number"?: number,"shop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shop_daily_counters_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"shop_domains": {
                  Row: {
                    "created_at": string,"hostname": string,"id": string,"is_primary": boolean,"kind": Database["public"]['Enums']["domain_kind"],"provider_state": NonNullable<Json>,"shop_id": string,"updated_at": string,"verified_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"hostname": string,"id"?: string,"is_primary"?: boolean,"kind": Database["public"]['Enums']["domain_kind"],"provider_state"?: NonNullable<Json>,"shop_id": string,"updated_at"?: string,"verified_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"hostname"?: string,"id"?: string,"is_primary"?: boolean,"kind"?: Database["public"]['Enums']["domain_kind"],"provider_state"?: NonNullable<Json>,"shop_id"?: string,"updated_at"?: string,"verified_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "shop_domains_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"shop_members": {
                  Row: {
                    "color": string,"created_at": string,"deactivated_at": string | null,"display_name": string,"id": string,"is_active": boolean,"permissions": (string)[],"pin_failed_count": number,"pin_hard_locked": boolean,"pin_hash": string | null,"pin_lock_level": number,"pin_locked_until": string | null,"role": Database["public"]['Enums']["member_role"],"shop_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"created_at"?: string,"deactivated_at"?: string | null,"display_name": string,"id"?: string,"is_active"?: boolean,"permissions"?: (string)[],"pin_failed_count"?: number,"pin_hard_locked"?: boolean,"pin_hash"?: string | null,"pin_lock_level"?: number,"pin_locked_until"?: string | null,"role": Database["public"]['Enums']["member_role"],"shop_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"deactivated_at"?: string | null,"display_name"?: string,"id"?: string,"is_active"?: boolean,"permissions"?: (string)[],"pin_failed_count"?: number,"pin_hard_locked"?: boolean,"pin_hash"?: string | null,"pin_lock_level"?: number,"pin_locked_until"?: string | null,"role"?: Database["public"]['Enums']["member_role"],"shop_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shop_members_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"shop_themes": {
                  Row: {
                    "accent_color": string,"color_scheme": string,"cover_path": string | null,"density": string,"font_pair": string,"logo_path": string | null,"menu_layout": string,"preset": string,"primary_color": string,"radius": string,"shop_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accent_color"?: string,"color_scheme"?: string,"cover_path"?: string | null,"density"?: string,"font_pair"?: string,"logo_path"?: string | null,"menu_layout"?: string,"preset"?: string,"primary_color"?: string,"radius"?: string,"shop_id": string,"updated_at"?: string
                  }
                  Update: {
                    "accent_color"?: string,"color_scheme"?: string,"cover_path"?: string | null,"density"?: string,"font_pair"?: string,"logo_path"?: string | null,"menu_layout"?: string,"preset"?: string,"primary_color"?: string,"radius"?: string,"shop_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shop_themes_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: true
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"shops": {
                  Row: {
                    "accepting_orders": boolean,"address_text": string | null,"archived_at": string | null,"business_day_start": string,"business_type": Database["public"]['Enums']["business_type"],"created_at": string,"currency": string,"features": (string)[],"floor_alert_repeat_seconds": number,"id": string,"kitchen_critical_minutes": number,"kitchen_warning_minutes": number,"legal_address": string | null,"legal_form": string | null,"legal_name": string | null,"legal_publication_director": string | null,"legal_siret": string | null,"locale": string,"max_lines_per_order": number,"max_order_total_cents": number,"max_orders_per_client_10min": number,"max_pending_orders_per_table": number,"max_quantity_per_line": number,"name": string,"opening_hours_text": string | null,"order_note_enabled": boolean,"phone": string | null,"price_notice": string,"public_menu_enabled": boolean,"slug": string,"sold_out_label": string,"staff_idle_lock_minutes": number,"status": Database["public"]['Enums']["shop_status"],"timezone": string,"updated_at": string,"welcome_message": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accepting_orders"?: boolean,"address_text"?: string | null,"archived_at"?: string | null,"business_day_start"?: string,"business_type"?: Database["public"]['Enums']["business_type"],"created_at"?: string,"currency"?: string,"features"?: (string)[],"floor_alert_repeat_seconds"?: number,"id"?: string,"kitchen_critical_minutes"?: number,"kitchen_warning_minutes"?: number,"legal_address"?: string | null,"legal_form"?: string | null,"legal_name"?: string | null,"legal_publication_director"?: string | null,"legal_siret"?: string | null,"locale"?: string,"max_lines_per_order"?: number,"max_order_total_cents"?: number,"max_orders_per_client_10min"?: number,"max_pending_orders_per_table"?: number,"max_quantity_per_line"?: number,"name": string,"opening_hours_text"?: string | null,"order_note_enabled"?: boolean,"phone"?: string | null,"price_notice"?: string,"public_menu_enabled"?: boolean,"slug": string,"sold_out_label"?: string,"staff_idle_lock_minutes"?: number,"status"?: Database["public"]['Enums']["shop_status"],"timezone"?: string,"updated_at"?: string,"welcome_message"?: string | null
                  }
                  Update: {
                    "accepting_orders"?: boolean,"address_text"?: string | null,"archived_at"?: string | null,"business_day_start"?: string,"business_type"?: Database["public"]['Enums']["business_type"],"created_at"?: string,"currency"?: string,"features"?: (string)[],"floor_alert_repeat_seconds"?: number,"id"?: string,"kitchen_critical_minutes"?: number,"kitchen_warning_minutes"?: number,"legal_address"?: string | null,"legal_form"?: string | null,"legal_name"?: string | null,"legal_publication_director"?: string | null,"legal_siret"?: string | null,"locale"?: string,"max_lines_per_order"?: number,"max_order_total_cents"?: number,"max_orders_per_client_10min"?: number,"max_pending_orders_per_table"?: number,"max_quantity_per_line"?: number,"name"?: string,"opening_hours_text"?: string | null,"order_note_enabled"?: boolean,"phone"?: string | null,"price_notice"?: string,"public_menu_enabled"?: boolean,"slug"?: string,"sold_out_label"?: string,"staff_idle_lock_minutes"?: number,"status"?: Database["public"]['Enums']["shop_status"],"timezone"?: string,"updated_at"?: string,"welcome_message"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"staff_sessions": {
                  Row: {
                    "created_at": string,"device_id": string,"expires_at": string,"last_seen_at": string | null,"member_id": string,"revoked_at": string | null,"revoked_reason": string | null,"session_id": string,"shop_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"device_id": string,"expires_at": string,"last_seen_at"?: string | null,"member_id": string,"revoked_at"?: string | null,"revoked_reason"?: string | null,"session_id": string,"shop_id": string
                  }
                  Update: {
                    "created_at"?: string,"device_id"?: string,"expires_at"?: string,"last_seen_at"?: string | null,"member_id"?: string,"revoked_at"?: string | null,"revoked_reason"?: string | null,"session_id"?: string,"shop_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "staff_sessions_device_id_fkey"
      columns: ["device_id"]
isOneToOne: false
      referencedRelation: "devices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "staff_sessions_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "shop_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "staff_sessions_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    }
                  ]
                },"table_sessions": {
                  Row: {
                    "business_day": string,"closed_at": string | null,"closed_by": string | null,"id": string,"opened_at": string,"shop_id": string,"table_id": string,"total_cents": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "business_day": string,"closed_at"?: string | null,"closed_by"?: string | null,"id"?: string,"opened_at"?: string,"shop_id": string,"table_id": string,"total_cents"?: number | null
                  }
                  Update: {
                    "business_day"?: string,"closed_at"?: string | null,"closed_by"?: string | null,"id"?: string,"opened_at"?: string,"shop_id"?: string,"table_id"?: string,"total_cents"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "table_sessions_closed_by_fkey"
      columns: ["closed_by"]
isOneToOne: false
      referencedRelation: "shop_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "table_sessions_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "table_sessions_table_id_fkey"
      columns: ["table_id"]
isOneToOne: false
      referencedRelation: "dining_tables"
      referencedColumns: ["id"]
    }
                  ]
                },"table_tokens": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"revoked_at": string | null,"shop_id": string,"table_id": string,"token": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"revoked_at"?: string | null,"shop_id": string,"table_id": string,"token": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"revoked_at"?: string | null,"shop_id"?: string,"table_id"?: string,"token"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "table_tokens_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "shop_members"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "table_tokens_shop_id_fkey"
      columns: ["shop_id"]
isOneToOne: false
      referencedRelation: "shops"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "table_tokens_table_id_fkey"
      columns: ["table_id"]
isOneToOne: false
      referencedRelation: "dining_tables"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "analytics_alerts":
{ Args: { "p_shop_id": string }; Returns: Json
                           },
"analytics_by_category":
{ Args: { "p_from": string,"p_shop_id": string,"p_to": string }; Returns: Json
                           },
"analytics_by_table":
{ Args: { "p_from": string,"p_shop_id": string,"p_to": string }; Returns: Json
                           },
"analytics_heatmap":
{ Args: { "p_from": string,"p_shop_id": string,"p_to": string }; Returns: Json
                           },
"analytics_overview":
{ Args: { "p_from": string,"p_shop_id": string,"p_to": string }; Returns: Json
                           },
"analytics_reject_reasons":
{ Args: { "p_from": string,"p_shop_id": string,"p_to": string }; Returns: Json
                           },
"analytics_timeseries":
{ Args: { "p_bucket": string,"p_from": string,"p_shop_id": string,"p_to": string }; Returns: Json
                           },
"analytics_top_options":
{ Args: { "p_from": string,"p_shop_id": string,"p_to": string }; Returns: Json
                           },
"analytics_top_products":
{ Args: { "p_from": string,"p_limit"?: number,"p_order_by"?: string,"p_shop_id": string,"p_to": string }; Returns: Json
                           },
"analytics_unsold_products":
{ Args: { "p_from": string,"p_shop_id": string,"p_to": string }; Returns: Json
                           },
"auth_mfa_wait_seconds":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"auth_register_mfa_failure":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"auth_reset_mfa_failures":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"console_anomalies":
{ Args: Record<PropertyKey, never>; Returns: {
              "name": string,"open_tables_old": number,"pin_failures_1h": number,"refusal_rate_today": number,"shop_id": string
            }[]
                           },
"console_create_shop":
{ Args: { "p_business_type": Database["public"]['Enums']["business_type"],"p_name": string,"p_root_domain": string,"p_slug": string,"p_timezone": string }; Returns: string
                           },
"console_revoke_device":
{ Args: { "p_device_id": string }; Returns: undefined
                           },
"console_set_primary_domain":
{ Args: { "p_domain_id": string }; Returns: undefined
                           },
"console_set_shop_features":
{ Args: { "p_features": (string)[],"p_shop_id": string }; Returns: undefined
                           },
"console_set_shop_status":
{ Args: { "p_shop_id": string,"p_status": Database["public"]['Enums']["shop_status"] }; Returns: undefined
                           },
"console_shop_health":
{ Args: Record<PropertyKey, never>; Returns: {
              "active_devices": number,"billing_status": Database["public"]['Enums']["billing_status"],"created_at": string,"last_order_at": string,"name": string,"next_due_on": string,"orders_7d": number,"primary_host": string,"shop_id": string,"slug": string,"status": Database["public"]['Enums']["shop_status"]
            }[]
                           },
"owner_create_tables":
{ Args: { "p_shop_id": string,"p_tables": Json }; Returns: number
                           },
"owner_duplicate_product":
{ Args: { "p_product_id": string }; Returns: string
                           },
"owner_enroll_device":
{ Args: { "p_name": string,"p_secret_hash": string,"p_shop_id": string }; Returns: string
                           },
"owner_reorder":
{ Args: { "p_entity": string,"p_ids": (string)[] }; Returns: undefined
                           },
"owner_restock_all":
{ Args: { "p_shop_id": string }; Returns: number
                           },
"owner_revoke_device":
{ Args: { "p_device_id": string }; Returns: undefined
                           },
"owner_revoke_member_sessions":
{ Args: { "p_member_id": string }; Returns: undefined
                           },
"owner_revoke_staff_session":
{ Args: { "p_session_id": string }; Returns: undefined
                           },
"owner_rotate_table_token":
{ Args: { "p_new_token": string,"p_table_id": string }; Returns: undefined
                           },
"owner_set_default_menu":
{ Args: { "p_menu_id": string }; Returns: undefined
                           },
"owner_set_option_allergens":
{ Args: { "p_allergens": Json,"p_none": boolean,"p_option_id": string }; Returns: undefined
                           },
"owner_set_product_allergens":
{ Args: { "p_allergens": Json,"p_none": boolean,"p_product_id": string }; Returns: undefined
                           },
"owner_soft_delete":
{ Args: { "p_entity": string,"p_id": string }; Returns: undefined
                           },
"owner_unlock_device":
{ Args: { "p_device_id": string }; Returns: undefined
                           },
"owner_unlock_member":
{ Args: { "p_member_id": string }; Returns: undefined
                           },
"public_get_menu":
{ Args: { "p_shop_id": string }; Returns: Json
                           },
"public_my_orders":
{ Args: { "p_client_key": string,"p_shop_id": string,"p_token": string }; Returns: Json
                           },
"public_open_table":
{ Args: { "p_shop_id": string,"p_token": string }; Returns: Json
                           },
"public_place_order":
{ Args: { "p_client_key": string,"p_idempotency_key": string,"p_items": Json,"p_note"?: string,"p_shop_id": string,"p_source"?: Database["public"]['Enums']["order_source"],"p_token": string }; Returns: Json
                           },
"public_resolve_host":
{ Args: { "p_host": string }; Returns: Json
                           },
"staff_close_table_session":
{ Args: { "p_session_id": string }; Returns: Json
                           },
"staff_preview_menu":
{ Args: { "p_at"?: string,"p_shop_id": string }; Returns: Json
                           },
"staff_set_accepting_orders":
{ Args: { "p_shop_id": string,"p_value": boolean }; Returns: undefined
                           },
"staff_set_sold_out":
{ Args: { "p_entity": string,"p_id": string,"p_sold_out": boolean }; Returns: undefined
                           },
"staff_transition_order":
{ Args: { "p_order_id": string,"p_reason"?: string,"p_to": Database["public"]['Enums']["order_status"] }; Returns: Json
                           }
          }
          Enums: {
            "allergen_presence": "contains"|"may_contain","billing_status": "trial"|"active"|"past_due"|"cancelled","business_type": "restaurant"|"bar"|"cafe"|"tea_room"|"bakery"|"lounge"|"food_court"|"hotel"|"other","domain_kind": "custom"|"platform","member_role": "owner"|"staff","order_source": "qr"|"nfc"|"staff","order_status": "submitted"|"accepted"|"ready"|"served"|"rejected"|"cancelled","prep_station": "kitchen"|"bar"|"none","shop_status": "onboarding"|"active"|"suspended"|"archived"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "allergen_presence": ["contains", "may_contain"],"billing_status": ["trial", "active", "past_due", "cancelled"],"business_type": ["restaurant", "bar", "cafe", "tea_room", "bakery", "lounge", "food_court", "hotel", "other"],"domain_kind": ["custom", "platform"],"member_role": ["owner", "staff"],"order_source": ["qr", "nfc", "staff"],"order_status": ["submitted", "accepted", "ready", "served", "rejected", "cancelled"],"prep_station": ["kitchen", "bar", "none"],"shop_status": ["onboarding", "active", "suspended", "archived"]
          }
        }
} as const
