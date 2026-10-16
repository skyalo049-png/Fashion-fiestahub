
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "addresses": {
                  Row: {
                    "area": string | null,"city": string | null,"county": string | null,"created_at": string,"customer_id": string,"id": string,"is_default": boolean,"label": string | null,"line1": string | null,"line2": string | null,"phone": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "area"?: string | null,"city"?: string | null,"county"?: string | null,"created_at"?: string,"customer_id": string,"id"?: string,"is_default"?: boolean,"label"?: string | null,"line1"?: string | null,"line2"?: string | null,"phone"?: string | null
                  }
                  Update: {
                    "area"?: string | null,"city"?: string | null,"county"?: string | null,"created_at"?: string,"customer_id"?: string,"id"?: string,"is_default"?: boolean,"label"?: string | null,"line1"?: string | null,"line2"?: string | null,"phone"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "addresses_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"collection_products": {
                  Row: {
                    "collection_id": string,"position": number,"product_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "collection_id": string,"position"?: number,"product_id": string
                  }
                  Update: {
                    "collection_id"?: string,"position"?: number,"product_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "collection_products_collection_id_fkey"
      columns: ["collection_id"]
isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collection_products_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"collections": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"position": number,"slug": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"position"?: number,"slug": string,"title": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"position"?: number,"slug"?: string,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"customers": {
                  Row: {
                    "created_at": string,"email": string | null,"full_name": string | null,"id": string,"phone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id"?: string,"phone": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id"?: string,"phone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"inventory_movements": {
                  Row: {
                    "created_at": string,"delta": number,"id": string,"note": string | null,"order_id": number | null,"reason": Database["public"]['Enums']["movement_reason"],"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"delta": number,"id"?: string,"note"?: string | null,"order_id"?: number | null,"reason": Database["public"]['Enums']["movement_reason"],"variant_id": string
                  }
                  Update: {
                    "created_at"?: string,"delta"?: number,"id"?: string,"note"?: string | null,"order_id"?: number | null,"reason"?: Database["public"]['Enums']["movement_reason"],"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventory_movements_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_movements_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "variant_availability"
      referencedColumns: ["variant_id"]
    }
                  ]
                },"lookup_attempts": {
                  Row: {
                    "attempted_at": string,"id": number,"ip": unknown,"order_number": string | null,"succeeded": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "attempted_at"?: string,"id"?: number,"ip"?: unknown,"order_number"?: string | null,"succeeded"?: boolean
                  }
                  Update: {
                    "attempted_at"?: string,"id"?: number,"ip"?: unknown,"order_number"?: string | null,"succeeded"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"order_events": {
                  Row: {
                    "actor": Database["public"]['Enums']["event_actor"],"created_at": string,"id": string,"order_id": number,"payload": NonNullable<Json>,"type": string,"visible_to_customer": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "actor"?: Database["public"]['Enums']["event_actor"],"created_at"?: string,"id"?: string,"order_id": number,"payload"?: NonNullable<Json>,"type": string,"visible_to_customer"?: boolean
                  }
                  Update: {
                    "actor"?: Database["public"]['Enums']["event_actor"],"created_at"?: string,"id"?: string,"order_id"?: number,"payload"?: NonNullable<Json>,"type"?: string,"visible_to_customer"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_events_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "color_snapshot": string | null,"created_at": string,"id": string,"line_total_kes": number,"order_id": number,"qty": number,"size_snapshot": string | null,"sku_snapshot": string,"title_snapshot": string,"unit_price_kes": number,"variant_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "color_snapshot"?: string | null,"created_at"?: string,"id"?: string,"line_total_kes": number,"order_id": number,"qty": number,"size_snapshot"?: string | null,"sku_snapshot": string,"title_snapshot": string,"unit_price_kes": number,"variant_id"?: string | null
                  }
                  Update: {
                    "color_snapshot"?: string | null,"created_at"?: string,"id"?: string,"line_total_kes"?: number,"order_id"?: number,"qty"?: number,"size_snapshot"?: string | null,"sku_snapshot"?: string,"title_snapshot"?: string,"unit_price_kes"?: number,"variant_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "variant_availability"
      referencedColumns: ["variant_id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "address_id": string | null,"created_at": string,"customer_id": string,"delivery_fee_kes": number | null,"id": number,"mpesa_code": string | null,"notes": string | null,"order_number": string,"payment_phone": string | null,"payment_submitted_at": string | null,"payment_verified_at": string | null,"payment_verified_by": string | null,"reservation_expires_at": string,"status": Database["public"]['Enums']["order_status"],"subtotal_kes": number,"total_kes": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address_id"?: string | null,"created_at"?: string,"customer_id": string,"delivery_fee_kes"?: number | null,"id"?: number,"mpesa_code"?: string | null,"notes"?: string | null,"order_number": string,"payment_phone"?: string | null,"payment_submitted_at"?: string | null,"payment_verified_at"?: string | null,"payment_verified_by"?: string | null,"reservation_expires_at": string,"status"?: Database["public"]['Enums']["order_status"],"subtotal_kes"?: number,"total_kes"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "address_id"?: string | null,"created_at"?: string,"customer_id"?: string,"delivery_fee_kes"?: number | null,"id"?: number,"mpesa_code"?: string | null,"notes"?: string | null,"order_number"?: string,"payment_phone"?: string | null,"payment_submitted_at"?: string | null,"payment_verified_at"?: string | null,"payment_verified_by"?: string | null,"reservation_expires_at"?: string,"status"?: Database["public"]['Enums']["order_status"],"subtotal_kes"?: number,"total_kes"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_address_id_fkey"
      columns: ["address_id"]
isOneToOne: false
      referencedRelation: "addresses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"product_images": {
                  Row: {
                    "alt": string | null,"created_at": string,"id": string,"position": number,"product_id": string,"url": string,"variant_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: string | null,"created_at"?: string,"id"?: string,"position"?: number,"product_id": string,"url": string,"variant_id"?: string | null
                  }
                  Update: {
                    "alt"?: string | null,"created_at"?: string,"id"?: string,"position"?: number,"product_id"?: string,"url"?: string,"variant_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_images_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_images_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_images_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "variant_availability"
      referencedColumns: ["variant_id"]
    }
                  ]
                },"product_variants": {
                  Row: {
                    "color": string | null,"created_at": string,"id": string,"is_active": boolean,"price_kes": number,"product_id": string,"size": string | null,"sku": string,"stock_qty": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string | null,"created_at"?: string,"id"?: string,"is_active"?: boolean,"price_kes": number,"product_id": string,"size"?: string | null,"sku": string,"stock_qty"?: number,"updated_at"?: string
                  }
                  Update: {
                    "color"?: string | null,"created_at"?: string,"id"?: string,"is_active"?: boolean,"price_kes"?: number,"product_id"?: string,"size"?: string | null,"sku"?: string,"stock_qty"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_variants_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "care": string | null,"created_at": string,"description": string | null,"fabric": string | null,"fit_notes": string | null,"id": string,"size_chart": Json | null,"sku_prefix": string | null,"slug": string,"status": Database["public"]['Enums']["product_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "care"?: string | null,"created_at"?: string,"description"?: string | null,"fabric"?: string | null,"fit_notes"?: string | null,"id"?: string,"size_chart"?: Json | null,"sku_prefix"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["product_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "care"?: string | null,"created_at"?: string,"description"?: string | null,"fabric"?: string | null,"fit_notes"?: string | null,"id"?: string,"size_chart"?: Json | null,"sku_prefix"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["product_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"staff": {
                  Row: {
                    "created_at": string,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"role"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "variant_availability": {
                  Row: {
                    "available_qty": number | null,"color": string | null,"price_kes": number | null,"product_id": string | null,"reserved_qty": number | null,"size": string | null,"sku": string | null,"stock_qty": number | null,"variant_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "product_variants_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "admin_list_orders":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_status"?: string }; Returns: Json
                           },
"admin_order_detail":
{ Args: { "p_order_number": string }; Returns: Json
                           },
"create_order":
{ Args: { "p_address": Json,"p_email": string,"p_full_name": string,"p_items": Json,"p_notes"?: string,"p_phone": string }; Returns: Json
                           },
"expire_stale_reservations":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"lookup_order":
{ Args: { "p_order_number": string,"p_phone": string }; Returns: Json
                           },
"normalize_phone":
{ Args: { "raw": string }; Returns: string
                           },
"purge_lookup_attempts":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"quote_delivery":
{ Args: { "p_fee_kes": number,"p_note"?: string,"p_order_number": string }; Returns: Json
                           },
"save_product_variants":
{ Args: { "p_cells": Json,"p_default_price": number,"p_note"?: string,"p_product_id": string }; Returns: Json
                           },
"set_order_status":
{ Args: { "p_note"?: string,"p_order_number": string,"p_status": string }; Returns: Json
                           },
"set_variant_stock":
{ Args: { "p_note"?: string,"p_reason"?: string,"p_stock_qty": number,"p_variant_id": string }; Returns: Json
                           },
"sku_code":
{ Args: { "p_fallback"?: string,"p_text": string }; Returns: string
                           },
"submit_payment_proof":
{ Args: { "p_mpesa_code": string,"p_order_number": string,"p_payment_phone"?: string,"p_phone": string }; Returns: Json
                           },
"verify_payment":
{ Args: { "p_approve": boolean,"p_order_number": string,"p_reason"?: string }; Returns: Json
                           },
"whoami":
{ Args: Record<PropertyKey, never>; Returns: Json
                           }
          }
          Enums: {
            "event_actor": "customer"|"staff"|"system","movement_reason": "reserve"|"release"|"sale"|"adjustment"|"restock","order_status": "awaiting_delivery_quote"|"awaiting_payment"|"awaiting_payment_verification"|"paid"|"processing"|"shipped"|"delivered"|"cancelled","product_status": "draft"|"active"|"archived"
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
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "event_actor": ["customer", "staff", "system"],"movement_reason": ["reserve", "release", "sale", "adjustment", "restock"],"order_status": ["awaiting_delivery_quote", "awaiting_payment", "awaiting_payment_verification", "paid", "processing", "shipped", "delivered", "cancelled"],"product_status": ["draft", "active", "archived"]
          }
        }
} as const
