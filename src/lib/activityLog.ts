// ============================================================
// Admin Activity Log — ghi lại thao tác admin vào bảng admin_activity_log
// ============================================================
// - Fire-and-forget: không await, không throw. Bug logging không được
//   phép chặn UX admin.
// - Migration 010 tạo bảng + RLS "Auth users insert own activity".
// - Client throttle first-view-per-day cho action="view_order" bằng
//   localStorage để không spam log mỗi lần bấm.

import { getSupabase } from "./supabase";

export type ActivityAction =
  | "login"
  | "logout"
  | "view_order"
  | "drag_order"
  | "delete_order"
  | "create_product"
  | "update_product"
  | "delete_product"
  | "update_profile";

export interface ActivityContext {
  admin_id: string;
  admin_email?: string | null;
  admin_name?: string | null;
}

export interface ActivityPayload {
  action: ActivityAction;
  target_type?: "order" | "product" | "profile" | "";
  target_id?: string;
  details?: Record<string, unknown>;
}

const VIEW_THROTTLE_KEY = "sc_admin_view_log_v1";

function shouldLogView(adminId: string, orderId: string): boolean {
  try {
    const raw = localStorage.getItem(VIEW_THROTTLE_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    const key = `${adminId}:${orderId}`;
    const today = new Date().toISOString().slice(0, 10);
    if (map[key] === today) return false;
    map[key] = today;
    localStorage.setItem(VIEW_THROTTLE_KEY, JSON.stringify(map));
    return true;
  } catch {
    return true;
  }
}

export function logActivity(ctx: ActivityContext | null, payload: ActivityPayload): void {
  if (!ctx || !ctx.admin_id) return;

  if (payload.action === "view_order" && payload.target_id) {
    if (!shouldLogView(ctx.admin_id, payload.target_id)) return;
  }

  try {
    const sb = getSupabase() as unknown as { from: (t: string) => any };
    sb.from("admin_activity_log")
      .insert({
        admin_id: ctx.admin_id,
        admin_email: ctx.admin_email ?? "",
        admin_name: ctx.admin_name ?? "",
        action: payload.action,
        target_type: payload.target_type ?? "",
        target_id: payload.target_id ?? "",
        details: payload.details ?? {},
      })
      .then((res: { error: unknown }) => {
        if (res?.error) {
          console.warn("[activityLog] insert failed:", res.error);
        }
      });
  } catch (e) {
    console.warn("[activityLog] exception:", e);
  }
}

// ─── Đọc log cho UI ───────────────────────────────────────
export interface ActivityLogRow {
  id: string;
  admin_id: string | null;
  admin_email: string;
  admin_name: string;
  action: ActivityAction;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export async function fetchActivityLog(opts?: {
  targetId?: string;
  limit?: number;
}): Promise<ActivityLogRow[]> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  let query = client
    .from("admin_activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (opts?.targetId) {
    query = query.eq("target_id", opts.targetId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ActivityLogRow[];
}

// ─── Nhãn hiển thị (tiếng Việt) cho từng loại action ───────
export const ACTION_LABELS: Record<ActivityAction, string> = {
  login: "Đăng nhập",
  logout: "Đăng xuất",
  view_order: "Xem đơn hàng",
  drag_order: "Chuyển trạng thái đơn",
  delete_order: "Xóa đơn hàng",
  create_product: "Thêm sản phẩm",
  update_product: "Sửa sản phẩm",
  delete_product: "Xóa sản phẩm",
  update_profile: "Sửa hồ sơ",
};

export const ACTION_COLORS: Record<ActivityAction, string> = {
  login: "bg-blue-50 text-blue-700 border-blue-200",
  logout: "bg-gray-50 text-gray-700 border-gray-200",
  view_order: "bg-slate-50 text-slate-600 border-slate-200",
  drag_order: "bg-emerald-50 text-emerald-700 border-emerald-200",
  delete_order: "bg-red-50 text-red-700 border-red-200",
  create_product: "bg-sky-50 text-sky-700 border-sky-200",
  update_product: "bg-amber-50 text-amber-700 border-amber-200",
  delete_product: "bg-red-50 text-red-700 border-red-200",
  update_profile: "bg-purple-50 text-purple-700 border-purple-200",
};
