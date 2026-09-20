-- ============================================================
-- Migration 008 — Rebrand: đổi prefix order_number MM- → SC-
-- ============================================================
-- Ngày: 2026-09-20
-- Lý do: Đổi tên thương hiệu "Miên Man" → "Sợi chỉ".
--         MM- viết tắt của "Miên Man" nên đổi sang SC- = "Sợi chỉ".
--
-- Behavior:
--   - Đơn cũ (MM-001 ... MM-019+) giữ NGUYÊN order_number — tra cứu
--     bằng mã cũ vẫn hoạt động.
--   - Đơn mới từ khi chạy migration này sẽ nhận SC-<seq> — sequence
--     `order_number_seq` không reset, tiếp tục từ số hiện tại (ví dụ
--     nếu MM-019 là đơn cuối, đơn mới sẽ là SC-020).
--
-- Nếu muốn reset về SC-001, chạy thêm dòng:
--   alter sequence public.order_number_seq restart with 1;
-- (không khuyến khích — dễ trùng số với đơn cũ nếu chưa xoá hết đơn MM-).
-- ============================================================

create or replace function public.generate_order_number()
returns trigger as $$
begin
  new.order_number := 'SC-' || lpad(nextval('order_number_seq')::text, 3, '0');
  return new;
end;
$$ language plpgsql;

-- Trigger cũ đã bind vào function này rồi, không cần drop/create lại trigger.
-- Chỉ cần replace function → trigger tự dùng bản mới ngay lập tức.

-- ============================================================
-- Cách chạy:
-- 1. Supabase Dashboard → SQL Editor → New query
-- 2. Copy toàn bộ file này paste vào → Run
-- 3. Test: đặt 1 đơn mới, kiểm tra order_number có prefix SC-
-- ============================================================
