// ============================================================
// Team management — thành viên admin + invitations
// ============================================================
// Bảng dùng: profiles (role_key), invitations (migration 011).
// Xem migration 011 để biết cơ chế promote khi user được mời signup.

import { getSupabase } from "./supabase";

export type RoleKey = "owner" | "manager" | "staff" | "accountant";

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "admin" | "customer";
  role_key: RoleKey | null;
  created_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role_key: RoleKey;
  invited_by: string | null;
  invited_at: string;
  used_at: string | null;
  used_by: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  note: string;
  // Enrich: tên admin mời — join tại client
  invited_by_name?: string;
  invited_by_email?: string;
}

// Fetch tất cả thành viên admin (role='admin') — kèm email từ auth.users
// (auth.users không public → cần dùng RPC hoặc view; tạm thời lấy từ
// profiles.id + gọi supabase.auth.admin nếu có service_role. Ở đây dùng
// bảng `profiles` + JOIN với `auth.users` qua view chưa có — nên tạm
// lấy email từ activity log gần nhất, hoặc để trống nếu chưa có).
export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, phone, role, role_key, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  // Email trong auth.users không public — lấy email của mỗi admin qua log
  // hoạt động (bảng admin_activity_log có snapshot admin_email).
  const ids = (data ?? []).map((p: any) => p.id);
  const emailMap: Record<string, string> = {};
  if (ids.length > 0) {
    const { data: logs } = await client
      .from("admin_activity_log")
      .select("admin_id, admin_email")
      .in("admin_id", ids)
      .not("admin_email", "eq", "")
      .order("created_at", { ascending: false })
      .limit(500);
    for (const row of logs ?? []) {
      if (row.admin_id && row.admin_email && !emailMap[row.admin_id]) {
        emailMap[row.admin_id] = row.admin_email;
      }
    }
  }

  return (data ?? []).map((p: any) => ({
    id: p.id,
    email: emailMap[p.id] ?? "",
    full_name: p.full_name ?? "",
    phone: p.phone ?? "",
    role: p.role,
    role_key: p.role_key,
    created_at: p.created_at,
  }));
}

// Fetch invitations — mặc định chỉ pending (chưa dùng, chưa thu hồi).
export async function fetchInvitations(opts?: { includeAll?: boolean }): Promise<Invitation[]> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  let query = client
    .from("invitations")
    .select("*")
    .order("invited_at", { ascending: false });
  if (!opts?.includeAll) {
    query = query.is("used_at", null).is("revoked_at", null);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Invitation[];

  // Enrich invited_by_name/email từ profiles + activity log
  const inviterIds = Array.from(new Set(rows.map(r => r.invited_by).filter(Boolean)));
  if (inviterIds.length > 0) {
    const { data: profs } = await client
      .from("profiles")
      .select("id, full_name")
      .in("id", inviterIds);
    const nameMap: Record<string, string> = {};
    for (const p of profs ?? []) nameMap[p.id] = p.full_name ?? "";

    const { data: logs } = await client
      .from("admin_activity_log")
      .select("admin_id, admin_email")
      .in("admin_id", inviterIds)
      .not("admin_email", "eq", "")
      .order("created_at", { ascending: false })
      .limit(300);
    const emailMap: Record<string, string> = {};
    for (const l of logs ?? []) {
      if (l.admin_id && l.admin_email && !emailMap[l.admin_id]) emailMap[l.admin_id] = l.admin_email;
    }

    for (const r of rows) {
      if (r.invited_by) {
        r.invited_by_name = nameMap[r.invited_by] ?? "";
        r.invited_by_email = emailMap[r.invited_by] ?? "";
      }
    }
  }
  return rows;
}

// Tạo invitation mới.
// - Validate email format ở đây (server RLS đã lo phần role check).
// - Trả về invitation vừa tạo.
export async function createInvitation(params: {
  email: string;
  role_key: RoleKey;
  invited_by: string;
  note?: string;
}): Promise<Invitation> {
  const email = params.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email không hợp lệ.");
  }
  const client = getSupabase() as unknown as { from: (t: string) => any };
  const { data, error } = await client
    .from("invitations")
    .insert({
      email,
      role_key: params.role_key,
      invited_by: params.invited_by,
      note: params.note ?? "",
    })
    .select()
    .single();
  if (error) {
    // Unique constraint conflict → invitation đã tồn tại cho email này
    if (error.code === "23505") {
      throw new Error(`Đã có lời mời đang chờ cho ${email}. Thu hồi lời mời cũ trước khi mời lại.`);
    }
    throw new Error(error.message);
  }
  return data as Invitation;
}

// Thu hồi invitation (chưa dùng)
export async function revokeInvitation(id: string, revokedBy: string): Promise<void> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  const { error } = await client
    .from("invitations")
    .update({ revoked_at: new Date().toISOString(), revoked_by: revokedBy })
    .eq("id", id)
    .is("used_at", null);
  if (error) throw new Error(error.message);
}

// Đổi role_key của 1 thành viên đã có (chỉ owner được phép — RLS lo)
export async function updateMemberRoleKey(userId: string, roleKey: RoleKey): Promise<void> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  const { error } = await client
    .from("profiles")
    .update({ role_key: roleKey })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

// Gỡ 1 thành viên khỏi nhóm admin (đưa role về customer, xóa role_key)
export async function removeMemberFromAdmin(userId: string): Promise<void> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  const { error } = await client
    .from("profiles")
    .update({ role: "customer", role_key: null })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}
