-- ============================================================
-- Migration 009 — Cho phép admin xóa đơn hàng
-- ============================================================
-- Ngày tạo: 2026-09-20
-- Mục đích:
--   Tạo đơn test để debug là bình thường. Trước migration này, xóa đơn
--   phải chạy SQL trực tiếp trong Supabase Dashboard (đúng thứ tự
--   order_items → order_history → orders vì FK). Nay cho phép admin
--   xóa đơn qua UI, sử dụng ON DELETE CASCADE có sẵn ở các bảng con.
--
-- Cách sửa:
--   Thêm policy DELETE cho admin trên bảng orders (chỉ admin — user
--   thường KHÔNG được xóa đơn của mình, tránh mất audit trail).
--   Các bảng con (order_items, order_history, payments) đã có
--   `references public.orders(id) on delete cascade` từ schema.sql
--   → Postgres tự xóa row con khi row cha bị xóa.
-- ============================================================

drop policy if exists "Admin delete orders" on public.orders;
create policy "Admin delete orders"
  on public.orders for delete
  using (public.is_admin());

-- ============================================================
-- Cách chạy migration này:
-- 1. Vào https://supabase.com/dashboard → project "miên man" → SQL Editor
-- 2. Bấm "New query"
-- 3. Copy toàn bộ file này paste vào rồi bấm "Run"
-- 4. Kiểm tra output không có ERROR
-- ============================================================
