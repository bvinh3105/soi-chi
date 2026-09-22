-- ============================================================
-- Migration 013 — Nguyên liệu (raw materials) + nhập/xuất kho
-- ============================================================
-- Ngày tạo: 2026-09-22
-- Mục đích:
--   Quản lý nguyên liệu thô (vải, chỉ, khung, kim, phụ kiện...) —
--   tách hoàn toàn với `products` (sản phẩm thành phẩm bán ra).
--
--   Cơ chế: 2 bảng
--   - raw_materials: định nghĩa từng loại nguyên liệu + ngưỡng cảnh báo
--   - material_receipts: log MỌI thay đổi tồn kho (nhập/xuất/điều chỉnh)
--
--   Tồn kho hiện tại = SUM(receipts.quantity) — quantity signed.
--   Nhập: kind='in', quantity > 0
--   Xuất: kind='out', quantity < 0 (âm sẵn khi lưu)
--   Điều chỉnh: kind='adjust', quantity signed (+/-)
--
--   Không link với `orders` — MVP chỉ track kho thô, admin canh min_stock
--   để đặt lại. Sau này nếu cần có product-recipe thì thêm bảng khác.
-- ============================================================

create table if not exists public.raw_materials (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  category      text default '',              -- 'vải' | 'chỉ' | 'khung' | 'kim' | 'phụ kiện' | ...
  unit          text not null default 'chiếc', -- 'm' | 'cuộn' | 'chiếc' | 'gói' | 'hộp' | ...
  min_stock     numeric not null default 0,   -- ngưỡng cảnh báo — dưới ngưỡng thì UI hiện đỏ
  notes         text default '',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_raw_materials_active on public.raw_materials(is_active);

create trigger raw_materials_updated_at before update on public.raw_materials
  for each row execute function public.set_updated_at();

create table if not exists public.material_receipts (
  id            uuid primary key default uuid_generate_v4(),
  material_id   uuid not null references public.raw_materials(id) on delete cascade,
  quantity      numeric not null,             -- signed: + nhập, - xuất
  unit_price    numeric,                      -- VND — chỉ có khi kind='in' hoặc nhập bổ sung
  kind          text not null default 'in' check (kind in ('in','out','adjust')),
  supplier      text default '',              -- nguồn cung — có ý nghĩa khi kind='in'
  receipt_date  date not null default current_date,
  note          text default '',
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_material_receipts_material on public.material_receipts(material_id);
create index if not exists idx_material_receipts_date on public.material_receipts(receipt_date desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.raw_materials enable row level security;
alter table public.material_receipts enable row level security;

drop policy if exists "Admin manage raw materials" on public.raw_materials;
create policy "Admin manage raw materials"
  on public.raw_materials for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin manage material receipts" on public.material_receipts;
create policy "Admin manage material receipts"
  on public.material_receipts for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- Cách chạy migration:
-- 1. Supabase Dashboard → SQL Editor → New query
-- 2. Copy toàn bộ file này → Run
-- 3. Không có ERROR → xong. Vào /admin → Kho & Sản phẩm → tab Nguyên liệu.
-- ============================================================
