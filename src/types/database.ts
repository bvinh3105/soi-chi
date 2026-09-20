// Auto-generated Supabase types — matches supabase/schema.sql
// Regenerate with: npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "quality_check"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "error";

export type PaymentMethod = "cod" | "bank_transfer" | "momo" | "vnpay";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type UserRole = "admin" | "customer";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          avatar_url: string;
          role: UserRole;
          role_key: "owner" | "manager" | "staff" | "accountant" | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string;
          avatar_url?: string;
          role?: UserRole;
          role_key?: "owner" | "manager" | "staff" | "accountant" | null;
        };
        Update: {
          full_name?: string;
          phone?: string;
          avatar_url?: string;
          role?: UserRole;
          role_key?: "owner" | "manager" | "staff" | "accountant" | null;
        };
      };
      landing_content: {
        Row: {
          id: string;
          data: Record<string, unknown>;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id: string;
          data?: Record<string, unknown>;
          updated_by?: string | null;
        };
        Update: {
          data?: Record<string, unknown>;
          updated_by?: string | null;
        };
      };
      invitations: {
        Row: {
          id: string;
          email: string;
          role_key: "owner" | "manager" | "staff" | "accountant";
          invited_by: string | null;
          invited_at: string;
          used_at: string | null;
          used_by: string | null;
          revoked_at: string | null;
          revoked_by: string | null;
          note: string;
        };
        Insert: {
          id?: string;
          email: string;
          role_key: "owner" | "manager" | "staff" | "accountant";
          invited_by?: string | null;
          note?: string;
        };
        Update: {
          role_key?: "owner" | "manager" | "staff" | "accountant";
          used_at?: string | null;
          used_by?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          note?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          recipient_name: string;
          phone: string;
          street: string;
          ward: string;
          district: string;
          province: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipient_name: string;
          phone: string;
          street: string;
          ward?: string;
          district: string;
          province: string;
          is_default?: boolean;
        };
        Update: {
          recipient_name?: string;
          phone?: string;
          street?: string;
          ward?: string;
          district?: string;
          province?: string;
          is_default?: boolean;
        };
      };
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          name: string;
          slug: string;
          description: string;
          image_url: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          name: string;
          slug: string;
          description?: string;
          image_url?: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          parent_id?: string | null;
          name?: string;
          slug?: string;
          description?: string;
          image_url?: string;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string;
          base_price: number;
          sale_price: number | null;
          images: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string;
          base_price: number;
          sale_price?: number | null;
          images?: string[];
          is_active?: boolean;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string;
          base_price?: number;
          sale_price?: number | null;
          images?: string[];
          is_active?: boolean;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          sku: string;
          price_adj: number;
          stock: number;
          attributes: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          sku?: string;
          price_adj?: number;
          stock?: number;
          attributes?: Record<string, unknown>;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          sku?: string;
          price_adj?: number;
          stock?: number;
          attributes?: Record<string, unknown>;
          is_active?: boolean;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          address_id: string | null;
          status: OrderStatus;
          total_amount: number;
          shipping_fee: number;
          discount: number;
          note: string;
          // Guest fields (null nếu là user đăng nhập)
          guest_name: string | null;
          guest_phone: string | null;
          guest_email: string | null;
          guest_address: GuestAddress | null;
          payment_method: PaymentMethod;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          address_id?: string | null;
          status?: OrderStatus;
          total_amount: number;
          shipping_fee?: number;
          discount?: number;
          note?: string;
          guest_name?: string | null;
          guest_phone?: string | null;
          guest_email?: string | null;
          guest_address?: GuestAddress | null;
          payment_method?: PaymentMethod;
        };
        Update: {
          address_id?: string | null;
          status?: OrderStatus;
          total_amount?: number;
          shipping_fee?: number;
          discount?: number;
          note?: string;
          guest_name?: string | null;
          guest_phone?: string | null;
          guest_email?: string | null;
          guest_address?: GuestAddress | null;
          payment_method?: PaymentMethod;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price: number;
          custom_options: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity?: number;
          unit_price: number;
          custom_options?: Record<string, unknown>;
        };
        Update: {
          quantity?: number;
          unit_price?: number;
          custom_options?: Record<string, unknown>;
        };
      };
      order_history: {
        Row: {
          id: string;
          order_id: string;
          from_status: OrderStatus | null;
          to_status: OrderStatus;
          changed_by: string | null;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_status?: OrderStatus | null;
          to_status: OrderStatus;
          changed_by?: string | null;
          note?: string;
        };
        Update: {
          note?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          method: PaymentMethod;
          amount: number;
          status: PaymentStatus;
          txn_id: string;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          method?: PaymentMethod;
          amount: number;
          status?: PaymentStatus;
          txn_id?: string;
          paid_at?: string | null;
        };
        Update: {
          method?: PaymentMethod;
          amount?: number;
          status?: PaymentStatus;
          txn_id?: string;
          paid_at?: string | null;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          custom_options: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity?: number;
          custom_options?: Record<string, unknown>;
        };
        Update: {
          quantity?: number;
          custom_options?: Record<string, unknown>;
        };
      };
      admin_activity_log: {
        Row: {
          id: string;
          admin_id: string | null;
          admin_email: string;
          admin_name: string;
          action: string;
          target_type: string;
          target_id: string;
          details: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          admin_email?: string;
          admin_name?: string;
          action: string;
          target_type?: string;
          target_id?: string;
          details?: Record<string, unknown>;
        };
        Update: {
          details?: Record<string, unknown>;
        };
      };
    };
  };
}

// ============================================================
// Guest address shape (lưu trong JSONB)
// ============================================================
export interface GuestAddress {
  street: string;
  ward?: string;
  district: string;
  province: string;
}

// ============================================================
// Convenience aliases
// ============================================================
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Address = Database["public"]["Tables"]["addresses"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type OrderHistoryEntry = Database["public"]["Tables"]["order_history"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type CartItem = Database["public"]["Tables"]["cart_items"]["Row"];

// Order status labels (Vietnamese) for UI
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  in_progress: "Đang thêu",
  quality_check: "Kiểm tra",
  ready_to_ship: "Sẵn sàng giao",
  shipped: "Đang giao",
  delivered: "Hoàn thành",
  cancelled: "Đã hủy",
  error: "Lỗi",
};

// Kanban column order
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "quality_check",
  "ready_to_ship",
  "shipped",
  "delivered",
];

// Status colors for Kanban columns
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#d1d5db",
  confirmed: "#3b82f6",
  in_progress: "#eab308",
  quality_check: "#22c55e",
  ready_to_ship: "#f97316",
  shipped: "#a855f7",
  delivered: "#10b981",
  cancelled: "#6b7280",
  error: "#ef4444",
};
