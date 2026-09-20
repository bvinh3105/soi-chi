// ============================================================
// Orders Service — tạo đơn hàng (guest + user) + tra cứu
// Có fallback localStorage khi Supabase chưa được cấu hình
// ============================================================

import { getSupabase as _getSupabase } from "./supabase";
import type { CartItem } from "./cart";
import type { GuestAddress, OrderStatus } from "@/types/database";

// ─── LOCAL ORDER FALLBACK (localStorage) ───────────────────
const LOCAL_ORDERS_KEY = "mm_local_orders";

interface LocalOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  shippingFee: number;
  status: OrderStatus;
  guest: GuestInfo;
  items: CartItem[];
  createdAt: string;
}

function getLocalOrders(): LocalOrder[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: LocalOrder[]) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

function generateLocalOrderNumber(): string {
  const orders = getLocalOrders();
  const next = orders.length + 1;
  return `MM-${String(next).padStart(3, "0")}`;
}

function createLocalOrder(guest: GuestInfo, cartItems: CartItem[]): CreatedOrder {
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const totalAmount = subtotal + shippingFee;
  const orderNumber = generateLocalOrderNumber();
  const id = `local-${Date.now()}`;

  const order: LocalOrder = {
    id,
    orderNumber,
    totalAmount,
    shippingFee,
    status: "pending",
    guest,
    items: cartItems,
    createdAt: new Date().toISOString(),
  };

  const orders = getLocalOrders();
  orders.push(order);
  saveLocalOrders(orders);

  return { id, orderNumber, totalAmount, status: "pending" };
}

function trackLocalOrder(orderNumber: string, phone: string): OrderTrackingResult | null {
  const orders = getLocalOrders();
  const order = orders.find(
    o => o.orderNumber === orderNumber.toUpperCase() && o.guest.phone.trim() === phone.trim()
  );
  if (!order) return null;
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    shippingFee: order.shippingFee,
    guestName: order.guest.name,
    guestAddress: order.guest.address,
    paymentMethod: order.guest.paymentMethod ?? "cod",
    note: order.guest.note ?? "",
    createdAt: order.createdAt,
    items: order.items.map(i => ({
      productId: i.productId,
      productName: i.name,
      quantity: i.quantity,
      unitPrice: i.price,
      image: i.image,
    })),
  };
}

// Cast để tránh strict Supabase generics (giống products.ts)
function getSupabase() {
  return _getSupabase() as unknown as { from: (table: string) => any };
}

export interface GuestInfo {
  name: string;
  phone: string;
  email?: string;
  address: GuestAddress;
  note?: string;
  paymentMethod?: "cod" | "bank_transfer";
}

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
}

// ─── Tạo đơn hàng cho khách vãng lai ──────────────────────
export async function createGuestOrder(
  guest: GuestInfo,
  cartItems: CartItem[]
): Promise<CreatedOrder> {
  if (cartItems.length === 0) throw new Error("Giỏ hàng trống");
  if (!guest.name.trim()) throw new Error("Vui lòng nhập họ tên");
  if (!guest.phone.trim()) throw new Error("Vui lòng nhập số điện thoại");
  if (!guest.address.street) throw new Error("Vui lòng nhập địa chỉ");
  if (!guest.address.district) throw new Error("Vui lòng nhập quận/huyện");
  if (!guest.address.province) throw new Error("Vui lòng nhập tỉnh/thành");

  // Thử Supabase — CHỈ fallback localStorage khi Supabase CHƯA CONFIG.
  // Nếu Supabase đã config nhưng insert lỗi (RLS chặn, network, v.v.) → THROW
  // để user thấy lỗi thật thay vì nhận "thành công giả" mà đơn không vào DB.
  let supabase: ReturnType<typeof getSupabase>;
  try {
    supabase = getSupabase();
  } catch {
    // Supabase chưa config (dev/staging without env vars) → dùng local
    console.warn("[createGuestOrder] Supabase not configured, using localStorage fallback");
    return createLocalOrder(guest, cartItems);
  }

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = subtotal >= 500000 ? 0 : 30000; // Miễn ship ≥ 500k
  const totalAmount = subtotal + shippingFee;

  // Tóm tắt sản phẩm — ghi vào note để Admin Kanban hiển thị ngay,
  // không phụ thuộc join order_items (phòng khi resolve product_id thất bại)
  const itemsSummary = cartItems.map((i) => `${i.name} (x${i.quantity})`).join(", ");

  // 1. Tạo order
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: null,
      guest_name: guest.name.trim(),
      guest_phone: guest.phone.trim(),
      guest_email: guest.email?.trim() || null,
      guest_address: guest.address,
      total_amount: totalAmount,
      shipping_fee: shippingFee,
      note: guest.note?.trim() || itemsSummary,
      payment_method: guest.paymentMethod ?? "cod",
      status: "pending",
    })
    .select("id, order_number, total_amount, status")
    .single();

  // Supabase trả lỗi → THROW để user biết (không giả vờ thành công như trước)
  if (orderErr) {
    console.error("[createGuestOrder] Supabase INSERT failed:", orderErr);
    // Message hữu ích cho từng loại lỗi phổ biến
    if (orderErr.code === "42501" || orderErr.message?.includes("row-level security")) {
      throw new Error(
        "Không thể tạo đơn hàng do quyền truy cập bị chặn. " +
        "Nếu bạn đang đăng nhập admin, hãy đăng xuất rồi thử lại (guest checkout yêu cầu chưa đăng nhập). " +
        `Chi tiết: ${orderErr.message}`
      );
    }
    throw new Error(`Không tạo được đơn hàng: ${orderErr.message}`);
  }
  if (!order) {
    throw new Error("Không tạo được đơn hàng: Supabase trả về rỗng (kiểm tra RLS policy).");
  }

  // 2. Resolve product_id thật qua slug — trang sản phẩm là static (data.ts),
  // nên cartItems.productId là id giả ("p1"...) không khớp UUID thật trong DB.
  const slugs = Array.from(new Set(cartItems.map((i) => i.slug)));
  const { data: realProducts } = await supabase
    .from("products")
    .select("id, slug")
    .in("slug", slugs);
  const slugToId = new Map((realProducts ?? []).map((p: any) => [p.slug, p.id]));

  // 3. Tạo order_items — bỏ qua sản phẩm chưa có trong DB (chưa chạy seed.sql)
  const orderItems = cartItems
    .filter((item) => slugToId.has(item.slug))
    .map((item) => ({
      order_id: order.id,
      product_id: slugToId.get(item.slug),
      variant_id: null,
      quantity: item.quantity,
      unit_price: item.price,
      custom_options: {},
    }));

  if (orderItems.length > 0) {
    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) console.warn("order_items insert failed:", itemsErr.message);
  } else {
    console.warn("Không resolve được product_id nào — sản phẩm chưa có trong Supabase (chạy seed.sql?)");
  }

  return {
    id: order.id,
    orderNumber: order.order_number,
    totalAmount: order.total_amount,
    status: order.status as OrderStatus,
  };
}

// ─── Tạo đơn hàng cho user đã đăng nhập ───────────────────
export async function createUserOrder(
  userId: string,
  addressId: string,
  cartItems: CartItem[],
  note: string = "",
  paymentMethod: "cod" | "bank_transfer" = "cod"
): Promise<CreatedOrder> {
  if (cartItems.length === 0) throw new Error("Giỏ hàng trống");

  const supabase = getSupabase();
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const totalAmount = subtotal + shippingFee;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      address_id: addressId,
      total_amount: totalAmount,
      shipping_fee: shippingFee,
      note,
      payment_method: paymentMethod,
      status: "pending",
    })
    .select("id, order_number, total_amount, status")
    .single();

  if (orderErr) throw orderErr;
  if (!order) throw new Error("Không tạo được đơn hàng");

  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    variant_id: null,
    quantity: item.quantity,
    unit_price: item.price,
    custom_options: {},
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
  if (itemsErr) throw itemsErr;

  return {
    id: order.id,
    orderNumber: order.order_number,
    totalAmount: order.total_amount,
    status: order.status as OrderStatus,
  };
}

// ─── Tra cứu đơn hàng (guest: số ĐT + mã đơn) ─────────────
export interface OrderTrackingResult {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  shippingFee: number;
  guestName: string;
  guestAddress: GuestAddress | null;
  paymentMethod: string;
  note: string;
  createdAt: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    image: string;
  }[];
}

export async function trackGuestOrder(
  orderNumber: string,
  phone: string
): Promise<OrderTrackingResult | null> {
  // Check localStorage trước (đơn local)
  const localResult = trackLocalOrder(orderNumber, phone);
  if (localResult) return localResult;

  // Thử Supabase
  let supabase: ReturnType<typeof getSupabase>;
  try {
    supabase = getSupabase();
  } catch {
    return null;
  }

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, status, total_amount, shipping_fee,
      guest_name, guest_address, payment_method, note, created_at,
      order_items (
        product_id, quantity, unit_price,
        products ( name, images )
      )
    `)
    .eq("order_number", orderNumber.toUpperCase())
    .eq("guest_phone", phone.trim())
    .maybeSingle();

  if (error) return null;
  if (!data) return null;

  const items = (data.order_items ?? []).map((oi: any) => ({
    productId: oi.product_id,
    productName: oi.products?.name ?? "Sản phẩm",
    quantity: oi.quantity,
    unitPrice: oi.unit_price,
    image: oi.products?.images?.[0] ?? "",
  }));

  return {
    id: data.id,
    orderNumber: data.order_number,
    status: data.status as OrderStatus,
    totalAmount: data.total_amount,
    shippingFee: data.shipping_fee,
    guestName: data.guest_name ?? "",
    guestAddress: data.guest_address as GuestAddress | null,
    paymentMethod: data.payment_method,
    note: data.note ?? "",
    createdAt: data.created_at,
    items,
  };
}

// ─── Xóa đơn hàng (chỉ admin — RLS check) ──────────────────
// Cascade sẵn từ schema.sql: order_items, order_history, payments cùng
// bị xóa. Migration 009 mới thêm policy DELETE cho is_admin() — nếu
// migration chưa chạy, câu này sẽ trả về error "new row violates
// row-level security policy" hoặc chỉ đơn giản không xóa row nào.
export async function deleteOrder(orderId: string): Promise<void> {
  const sb = _getSupabase();
  const { error, count } = await sb
    .from("orders")
    .delete({ count: "exact" })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
  if (count === 0) {
    throw new Error(
      "Không xóa được đơn. Có thể migration 009 chưa chạy hoặc tài khoản không phải admin."
    );
  }
}

// ─── Format tiền VNĐ ───────────────────────────────────────
export function fmtVnd(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ";
}

// ─── Status label + màu ────────────────────────────────────
export const STATUS_LABEL: Record<string, string> = {
  pending:       "Chờ xác nhận",
  confirmed:     "Đã xác nhận",
  in_progress:   "Đang sản xuất",
  quality_check: "Kiểm tra chất lượng",
  ready_to_ship: "Sẵn sàng giao",
  shipped:       "Đang giao hàng",
  delivered:     "Đã giao — Hoàn thành",
  cancelled:     "Đã hủy",
  error:         "Tạm dừng",
};

export const STATUS_COLOR: Record<string, string> = {
  pending:       "bg-gray-100 text-gray-700",
  confirmed:     "bg-blue-100 text-blue-700",
  in_progress:   "bg-yellow-100 text-yellow-800",
  quality_check: "bg-green-100 text-green-700",
  ready_to_ship: "bg-orange-100 text-orange-700",
  shipped:       "bg-purple-100 text-purple-700",
  delivered:     "bg-emerald-100 text-emerald-700",
  cancelled:     "bg-red-100 text-red-700",
  error:         "bg-purple-100 text-purple-800",
};

export const STATUS_FLOW = [
  "pending",
  "confirmed",
  "in_progress",
  "quality_check",
  "ready_to_ship",
  "shipped",
  "delivered",
] as const;
