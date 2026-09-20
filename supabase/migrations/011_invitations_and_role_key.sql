-- ============================================================
-- Migration 011 — Invitations + role_key cho phân quyền chi tiết
-- ============================================================
-- Ngày tạo: 2026-09-20
-- Mục đích:
--   3 admin gốc (bachvinhtran/hthaoan0108/soichi.stu) cần mời thêm
--   thành viên (Manager, Staff, Accountant). Cơ chế:
--     1. Admin nhập email + role vào form → INSERT vào `invitations`.
--     2. Người được mời tự vào /register bằng email đó → signup thành công.
--     3. Trigger BEFORE INSERT trên profiles (chạy sau handle_new_user)
--        tự set profiles.role='admin' + role_key=<từ invitation> và mark
--        invitation.used_at.
--     4. Nếu email không có trong invitations → profile giữ role='customer'
--        như user thường (không có backdoor để tự upgrade lên admin).
-- ============================================================

-- 1. Thêm cột role_key vào profiles (owner/manager/staff/accountant)
alter table public.profiles
  add column if not exists role_key text
    check (role_key is null or role_key in ('owner', 'manager', 'staff', 'accountant'));

create index if not exists idx_profiles_role_key on public.profiles(role_key);

-- Seed cho 3 admin gốc = 'owner' (nếu chưa có role_key)
update public.profiles
set role_key = 'owner'
where role = 'admin' and role_key is null;

-- 2. Bảng invitations
create table if not exists public.invitations (
  id           uuid primary key default uuid_generate_v4(),
  email        text not null,
  role_key     text not null
    check (role_key in ('owner', 'manager', 'staff', 'accountant')),
  invited_by   uuid references public.profiles(id) on delete set null,
  invited_at   timestamptz not null default now(),
  used_at      timestamptz,
  used_by      uuid references public.profiles(id) on delete set null,
  revoked_at   timestamptz,       -- admin có thể thu hồi invitation trước khi dùng
  revoked_by   uuid references public.profiles(id) on delete set null,
  note         text default ''
);

-- Chỉ 1 invitation ĐANG HOẠT ĐỘNG cho mỗi email (chưa dùng, chưa thu hồi)
create unique index if not exists uniq_invitations_email_active
  on public.invitations(lower(email))
  where used_at is null and revoked_at is null;

create index if not exists idx_invitations_email on public.invitations(lower(email));
create index if not exists idx_invitations_invited_at on public.invitations(invited_at desc);

-- 3. RLS: chỉ admin mới quản lý invitations
alter table public.invitations enable row level security;

drop policy if exists "Admin manage invitations" on public.invitations;
create policy "Admin manage invitations"
  on public.invitations for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Trigger — apply invitation khi user vừa được tạo
-- handle_new_user() đã insert profile với role='customer' mặc định.
-- Trigger mới này chạy AFTER INSERT trên profiles, promote lên admin
-- nếu email có trong invitations còn hiệu lực.
create or replace function public.apply_pending_invitation()
returns trigger as $$
declare
  v_email text;
  v_invitation record;
begin
  -- Lấy email của user từ auth.users (profile chỉ có id)
  select lower(email) into v_email from auth.users where id = new.id;
  if v_email is null then return new; end if;

  -- Tìm invitation còn hiệu lực
  select * into v_invitation
  from public.invitations
  where lower(email) = v_email
    and used_at is null
    and revoked_at is null
  order by invited_at desc
  limit 1;

  if not found then return new; end if;

  -- Promote profile
  update public.profiles
    set role = 'admin',
        role_key = v_invitation.role_key
    where id = new.id;

  -- Mark invitation đã dùng
  update public.invitations
    set used_at = now(),
        used_by = new.id
    where id = v_invitation.id;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_profile_created_apply_invitation on public.profiles;
create trigger on_profile_created_apply_invitation
  after insert on public.profiles
  for each row execute function public.apply_pending_invitation();

-- 5. Cho phép admin update role_key của profile khác (để đổi role sau khi đã mời)
-- Chỉ owner được đổi role của người khác. Policy "Users update own profile"
-- cũ đã cho phép mọi user update chính mình — nay thêm rule cho admin/owner.
drop policy if exists "Owner update any profile role" on public.profiles;
create policy "Owner update any profile role"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles p2
            where p2.id = auth.uid() and p2.role = 'admin' and p2.role_key = 'owner')
  );

-- 6. Cho phép admin đọc mọi profile (để list thành viên) — hiện tại
-- "Admin read all profiles" đã có từ schema.sql, không thêm lại.
-- Nếu chưa có, uncomment dòng dưới:
-- create policy "Admin read all profiles" on public.profiles for select using (public.is_admin());

-- ============================================================
-- Cách chạy migration này:
-- 1. Vào https://supabase.com/dashboard → project "miên man" → SQL Editor
-- 2. Bấm "New query"
-- 3. Copy toàn bộ file này paste vào rồi bấm "Run"
-- 4. Kiểm tra output không có ERROR
-- 5. Sau khi chạy: 3 admin gốc tự động có role_key='owner'.
--    Các invitation mới tạo qua UI sẽ tự động apply khi người được mời signup.
-- ============================================================
