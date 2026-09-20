-- ============================================================
-- Migration 010 — Bảng nhật ký thao tác của admin
-- ============================================================
-- Ngày tạo: 2026-09-20
-- Mục đích:
--   Ghi lại mọi thao tác đáng chú ý của admin để truy vết:
--     - login / logout
--     - view_order (mở chi tiết đơn hàng — client throttle first-view-per-day)
--     - drag_order (kéo Kanban đổi trạng thái)
--     - delete_order
--     - create_product / update_product / delete_product
--     - update_profile
--   Không thay thế `order_history` (vốn chỉ ghi status change theo đơn) —
--   `order_history` là chi tiết theo đơn, `admin_activity_log` là dòng
--   sự kiện chung của cả hệ thống admin.
-- ============================================================

create table if not exists public.admin_activity_log (
  id           uuid primary key default uuid_generate_v4(),
  admin_id     uuid references public.profiles(id) on delete set null,
  admin_email  text default '',            -- snapshot vì có thể admin bị xóa sau này
  admin_name   text default '',            -- snapshot của full_name lúc thao tác
  action       text not null,              -- 'login' | 'logout' | 'view_order' | 'drag_order' | 'delete_order' | 'create_product' | 'update_product' | 'delete_product' | 'update_profile' | ...
  target_type  text default '',            -- 'order' | 'product' | 'profile' | ''
  target_id    text default '',            -- id của đơn/sản phẩm nếu có
  details      jsonb default '{}',         -- payload thêm (ví dụ from/to status, tên đơn, ...)
  created_at   timestamptz not null default now()
);

create index if not exists idx_admin_activity_log_admin on public.admin_activity_log(admin_id);
create index if not exists idx_admin_activity_log_created on public.admin_activity_log(created_at desc);
create index if not exists idx_admin_activity_log_target on public.admin_activity_log(target_type, target_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.admin_activity_log enable row level security;

-- Chỉ admin đọc được toàn bộ log
drop policy if exists "Admin read activity log" on public.admin_activity_log;
create policy "Admin read activity log"
  on public.admin_activity_log for select
  using (public.is_admin());

-- Bất kỳ user đã đăng nhập nào cũng insert được log CỦA CHÍNH MÌNH.
-- (Không ép is_admin() vì fetchProfile trong client có thể chưa xong khi
--  logActivity chạy, và insert của guest/customer sẽ không sinh vấn đề gì —
--  không dùng bảng này ngoài admin panel).
drop policy if exists "Auth users insert own activity" on public.admin_activity_log;
create policy "Auth users insert own activity"
  on public.admin_activity_log for insert
  with check (auth.uid() = admin_id);

-- Không ai được update/delete log (immutable audit trail).

-- ============================================================
-- Realtime — để tab "Nhật ký" cập nhật tức thời
-- ============================================================
alter publication supabase_realtime add table public.admin_activity_log;

-- ============================================================
-- Cách chạy migration này:
-- 1. Vào https://supabase.com/dashboard → project "miên man" → SQL Editor
-- 2. Bấm "New query"
-- 3. Copy toàn bộ file này paste vào rồi bấm "Run"
-- 4. Kiểm tra output không có ERROR
-- ============================================================
