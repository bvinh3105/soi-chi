-- ============================================================
-- Migration 012 — Bảng landing_content cho Puck block editor
-- ============================================================
-- Ngày tạo: 2026-09-20
-- Mục đích:
--   Owner/Manager sửa nội dung landing page (khối Hero, Features, CTA...)
--   qua Puck editor ở /admin/landing. Payload là JSONB — Puck lo shape.
--   Web landing (`/`) fetch client-side khi mount, render qua Puck's
--   <Render> component. Static export vẫn dùng được vì hydrate ở client.
-- ============================================================

create table if not exists public.landing_content (
  id           text primary key,          -- 'home' — đơn trang chủ. Sau này có thể thêm 'about', 'blog', ...
  data         jsonb not null default '{"content":[],"root":{"props":{}}}',
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.profiles(id) on delete set null
);

-- Seed row 'home' rỗng — để INSERT của admin trở thành UPDATE (idempotent)
insert into public.landing_content (id, data)
values ('home', '{"content":[],"root":{"props":{}}}')
on conflict (id) do nothing;

-- Trigger updated_at
create trigger landing_content_updated_at before update on public.landing_content
  for each row execute function public.set_updated_at();

-- RLS
alter table public.landing_content enable row level security;

-- Ai cũng đọc được — landing page phải render cho anonymous visitor
drop policy if exists "Anyone read landing content" on public.landing_content;
create policy "Anyone read landing content"
  on public.landing_content for select
  using (true);

-- Chỉ admin update — RLS is_admin() lo check
drop policy if exists "Admin update landing content" on public.landing_content;
create policy "Admin update landing content"
  on public.landing_content for update
  using (public.is_admin())
  with check (public.is_admin());

-- Không cần INSERT/DELETE policy vì bảng chỉ có 1 row seed sẵn ('home').

-- ============================================================
-- Cách chạy migration này:
-- 1. Vào https://supabase.com/dashboard → SQL Editor → New query
-- 2. Copy toàn bộ file này paste vào rồi Run
-- 3. Sau khi chạy: vào /admin/landing để sửa nội dung.
-- ============================================================
