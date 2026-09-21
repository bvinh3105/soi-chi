-- ============================================================
-- SỢI CHỈ — Database Schema for Supabase (PostgreSQL)
-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 0. Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES — extends Supabase Auth (auth.users)
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null default '',
  phone         text default '',
  avatar_url    text default '',
  role          text not null default 'customer' check (role in ('admin', 'customer')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. ADDRESSES — shipping addresses per user
-- ============================================================
create table public.addresses (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  recipient_name  text not null,
  phone           text not null,
  street          text not null,
  ward            text default '',
  district        text not null,
  province        text not null,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index idx_addresses_user on public.addresses(user_id);

-- ============================================================
-- 3. CATEGORIES — supports nesting via parent_id
-- ============================================================
create table public.categories (
  id          uuid primary key default uuid_generate_v4(),
  parent_id   uuid references public.categories(id) on delete set null,
  name        text not null,
  slug        text not null unique,
  description text default '',
  image_url   text default '',
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 4. PRODUCTS
-- ============================================================
create table public.products (
  id            uuid primary key default uuid_generate_v4(),
  category_id   uuid references public.categories(id) on delete set null,
  name          text not null,
  slug          text not null unique,
  description   text default '',
  base_price    int not null default 0,
  sale_price    int default null,
  images        text[] default '{}',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_products_category on public.products(category_id);
create index idx_products_slug on public.products(slug);

-- ============================================================
-- 5. PRODUCT VARIANTS — size, color, frame type, etc.
-- ============================================================
create table public.product_variants (
  id            uuid primary key default uuid_generate_v4(),
  product_id    uuid not null references public.products(id) on delete cascade,
  name          text not null,
  sku           text default '',
  price_adj     int not null default 0,
  stock         int not null default 0,
  attributes    jsonb default '{}',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index idx_variants_product on public.product_variants(product_id);

-- ============================================================
-- 6. ORDERS
-- ============================================================
create type order_status as enum (
  'pending',
  'confirmed',
  'in_progress',
  'quality_check',
  'ready_to_ship',
  'shipped',
  'delivered',
  'cancelled',
  'error'
);

create table public.orders (
  id              uuid primary key default uuid_generate_v4(),
  order_number    text not null unique,
  user_id         uuid references public.profiles(id),      -- NULL cho khách vãng lai
  address_id      uuid references public.addresses(id),
  status          order_status not null default 'pending',
  total_amount    int not null default 0,
  shipping_fee    int not null default 0,
  discount        int not null default 0,
  note            text default '',
  -- Guest checkout fields
  guest_name      text default null,
  guest_phone     text default null,
  guest_email     text default null,
  guest_address   jsonb default null,
  payment_method  text not null default 'cod'
    check (payment_method in ('cod', 'bank_transfer', 'momo', 'vnpay')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Bảo toàn: phải có user_id HOẶC guest_phone
  constraint orders_identity_check check (user_id is not null or guest_phone is not null)
);

create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(status);

-- Auto-generate order number: MM-001, MM-002, ...
create sequence order_number_seq start 1;

create or replace function public.generate_order_number()
returns trigger as $$
begin
  new.order_number := 'MM-' || lpad(nextval('order_number_seq')::text, 3, '0');
  return new;
end;
$$ language plpgsql;

create trigger set_order_number
  before insert on public.orders
  for each row execute function public.generate_order_number();

-- ============================================================
-- 7. ORDER ITEMS — locked price + custom embroidery options
-- ============================================================
create table public.order_items (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  product_id      uuid not null references public.products(id),
  variant_id      uuid references public.product_variants(id),
  quantity        int not null default 1,
  unit_price      int not null,
  custom_options  jsonb default '{}',
  created_at      timestamptz not null default now()
);

create index idx_order_items_order on public.order_items(order_id);

-- ============================================================
-- 8. ORDER HISTORY — audit trail for Kanban status changes
-- ============================================================
create table public.order_history (
  id            uuid primary key default uuid_generate_v4(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  from_status   order_status,
  to_status     order_status not null,
  changed_by    uuid references public.profiles(id),
  note          text default '',
  created_at    timestamptz not null default now()
);

create index idx_order_history_order on public.order_history(order_id);

-- ============================================================
-- 9. PAYMENTS
-- ============================================================
create type payment_method as enum ('cod', 'bank_transfer', 'momo', 'vnpay');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.payments (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  method          payment_method not null default 'cod',
  amount          int not null,
  status          payment_status not null default 'pending',
  txn_id          text default '',
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_payments_order on public.payments(order_id);

-- ============================================================
-- 10. CART — persistent server-side cart
-- ============================================================
create table public.cart_items (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete cascade,
  variant_id      uuid references public.product_variants(id),
  quantity        int not null default 1,
  custom_options  jsonb default '{}',
  created_at      timestamptz not null default now(),
  unique(user_id, product_id, variant_id)
);

create index idx_cart_user on public.cart_items(user_id);

-- ============================================================
-- 11. updated_at AUTO-TRIGGER
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- PROFILES
alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Hàm SECURITY DEFINER để check quyền admin — tránh infinite recursion.
-- Nếu policy admin ở đây tự query lại profiles bằng exists(...) trực tiếp,
-- Postgres sẽ áp RLS lên chính câu query đó → lặp vô hạn (error 42P17).
-- Hàm này chạy với quyền người tạo (bypass RLS) nên không bị đệ quy.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Admin read all profiles"
  on public.profiles for select using (public.is_admin());

-- ADDRESSES
alter table public.addresses enable row level security;

create policy "Users manage own addresses"
  on public.addresses for all using (auth.uid() = user_id);

-- CATEGORIES — public read, admin write
alter table public.categories enable row level security;

create policy "Anyone read categories"
  on public.categories for select using (true);

create policy "Admin manage categories"
  on public.categories for all using (
    public.is_admin()
  );

-- PRODUCTS — public read active, admin all
alter table public.products enable row level security;

create policy "Anyone read active products"
  on public.products for select using (is_active = true);

create policy "Admin manage products"
  on public.products for all using (
    public.is_admin()
  );

-- PRODUCT VARIANTS
alter table public.product_variants enable row level security;

create policy "Anyone read variants"
  on public.product_variants for select using (true);

create policy "Admin manage variants"
  on public.product_variants for all using (
    public.is_admin()
  );

-- ORDERS
alter table public.orders enable row level security;

create policy "Users read own orders"
  on public.orders for select using (auth.uid() = user_id);

create policy "Users create own orders"
  on public.orders for insert with check (auth.uid() = user_id);

create policy "Guest insert order"
  on public.orders for insert to anon
  with check (user_id is null and guest_phone is not null);

create policy "Guest track own order"
  on public.orders for select to anon
  using (user_id is null);

create policy "Admin read all orders"
  on public.orders for select using (
    public.is_admin()
  );

create policy "Admin update orders"
  on public.orders for update using (
    public.is_admin()
  );

-- ORDER ITEMS
alter table public.order_items enable row level security;

create policy "Users read own order items"
  on public.order_items for select using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );

create policy "Users insert own order items"
  on public.order_items for insert with check (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );

create policy "Guest insert order items"
  on public.order_items for insert
  to anon
  with check (
    exists (select 1 from public.orders where id = order_id and user_id is null)
  );

create policy "Guest read own order items"
  on public.order_items for select
  to anon
  using (
    exists (select 1 from public.orders where id = order_id and user_id is null)
  );

create policy "Admin read all order items"
  on public.order_items for select using (
    public.is_admin()
  );

-- ORDER HISTORY
alter table public.order_history enable row level security;

create policy "Users read own order history"
  on public.order_history for select using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );

create policy "Admin manage order history"
  on public.order_history for all using (
    public.is_admin()
  );

-- PAYMENTS
alter table public.payments enable row level security;

create policy "Users read own payments"
  on public.payments for select using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );

create policy "Admin manage payments"
  on public.payments for all using (
    public.is_admin()
  );

-- CART
alter table public.cart_items enable row level security;

create policy "Users manage own cart"
  on public.cart_items for all using (auth.uid() = user_id);

-- ============================================================
-- 13. REALTIME — enable for orders (Kanban live updates)
-- ============================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_history;

-- ============================================================
-- 14. SEED DATA — categories
-- ============================================================
insert into public.categories (name, slug, description, sort_order) values
  ('Thêu trên tranh',   'theu-tranh',    'Tranh thêu tay tinh xảo, khung gỗ tự nhiên',      1),
  ('Thêu trên quần áo', 'theu-quan-ao',  'Thêu logo, tên, họa tiết lên áo phông, áo khoác', 2),
  ('Thêu trên túi',     'theu-tui',      'Túi vải, túi canvas, túi da thêu tay',             3),
  ('Tranh thêu tự làm', 'tu-lam',        'Bộ nguyên liệu tự thêu tại nhà (DIY kit)',         4);
