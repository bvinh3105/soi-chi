-- ============================================================
-- SEED DATA — Admin user + sample products
-- ============================================================
-- Chạy sau schema.sql trong Supabase SQL Editor
-- hoặc: psql -f supabase/seed.sql
-- ============================================================

-- 1. Tạo admin user qua Supabase Auth API (chạy bằng Dashboard hoặc curl)
-- Lưu ý: Supabase Auth user tạo bằng Dashboard > Authentication > Users > Add user
-- Email: admin@soichi.vn / Password: admin123456
-- Sau đó chạy lệnh dưới để set role = admin:

-- Nếu đã tạo user qua Dashboard, update role:
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<UUID từ Dashboard>';

-- Hoặc dùng Supabase local: đăng ký qua UI rồi chạy:
-- UPDATE public.profiles SET role = 'admin'
-- WHERE full_name = 'Admin Sợi chỉ';

-- ============================================================
-- 2. Seed products (10 sản phẩm khớp với data.ts hiện tại)
-- ============================================================

-- Lấy category IDs
DO $$
DECLARE
  cat_tranh uuid;
  cat_ao uuid;
  cat_tui uuid;
  cat_diy uuid;
BEGIN
  SELECT id INTO cat_tranh FROM public.categories WHERE slug = 'theu-tranh';
  SELECT id INTO cat_ao FROM public.categories WHERE slug = 'theu-quan-ao';
  SELECT id INTO cat_tui FROM public.categories WHERE slug = 'theu-tui';
  SELECT id INTO cat_diy FROM public.categories WHERE slug = 'tu-lam';

  -- Products
  INSERT INTO public.products (category_id, name, slug, description, base_price, sale_price, images) VALUES
    (cat_tranh, 'Tranh thêu hoa sen', 'tranh-theu-hoa-sen',
     'Tranh thêu tay hoa sen truyền thống, kích thước 30x40cm, khung gỗ tự nhiên',
     850000, 720000, ARRAY['https://placehold.co/600x800/EEF1EA/556b2f?text=Hoa+Sen']),

    (cat_tranh, 'Tranh thêu phong cảnh làng quê', 'tranh-theu-lang-que',
     'Tranh thêu phong cảnh đồng lúa, kích thước 40x60cm',
     1200000, NULL, ARRAY['https://placehold.co/600x800/D4DCCA/2f4f4f?text=Phong+Canh']),

    (cat_ao, 'Thêu tên lên áo phông', 'theu-ten-ao-phong',
     'Thêu tên, chữ ký hoặc logo nhỏ lên áo phông, font chữ đa dạng',
     120000, 99000, ARRAY['https://placehold.co/600x800/f8f8f8/556b2f?text=Ao+Phong']),

    (cat_ao, 'Thêu logo lên áo đồng phục', 'theu-logo-dong-phuc',
     'Thêu logo công ty, trường học lên áo đồng phục, đặt số lượng',
     80000, NULL, ARRAY['https://placehold.co/600x800/A8B496/fff?text=Dong+Phuc']),

    (cat_ao, 'Thêu họa tiết áo khoác', 'theu-hoa-tiet-ao-khoac',
     'Thêu hoa, chim, hình thú lên vai hoặc ngực áo khoác',
     250000, 199000, ARRAY['https://placehold.co/600x800/7D8B6A/fff?text=Ao+Khoac']),

    (cat_tui, 'Thêu tên lên túi tote', 'theu-tui-tote',
     'Thêu tên hoặc họa tiết theo yêu cầu lên túi tote canvas',
     180000, 149000, ARRAY['https://placehold.co/600x800/556b2f/fff?text=Tui+Tote']),

    (cat_tui, 'Thêu trên túi da nhỏ', 'theu-tui-da',
     'Thêu hoa nhỏ hoặc chữ tắt lên túi da, tinh tế và sang trọng',
     320000, NULL, ARRAY['https://placehold.co/600x800/8b6914/fff?text=Tui+Da']),

    (cat_diy, 'Bộ tự thêu hoa cúc', 'bo-tu-theu-hoa-cuc',
     'Bộ tự thêu hoa cúc dại tại nhà, bao gồm khung, chỉ, kim và hướng dẫn chi tiết',
     199000, 169000, ARRAY['https://placehold.co/600x800/EEF1EA/7D8B6A?text=Hoa+Cuc']),

    (cat_diy, 'Bộ tự thêu hình mèo', 'bo-tu-theu-meo',
     'Bộ tự thêu hình mèo dễ thương cho người mới bắt đầu',
     150000, NULL, ARRAY['https://placehold.co/600x800/D4DCCA/2C2C2C?text=Hinh+Meo']),

    (cat_diy, 'Bộ tự thêu chữ nghệ thuật', 'bo-tu-theu-chu',
     'Bộ tự thêu câu trích dẫn hoặc tên yêu thích, kích thước 20x20cm',
     175000, 145000, ARRAY['https://placehold.co/600x800/A8B496/fff?text=Chu+Nghe+Thuat']);

  -- Product variants (ví dụ cho Túi Tote)
  INSERT INTO public.product_variants (product_id, name, sku, price_adj, stock, attributes) VALUES
    ((SELECT id FROM public.products WHERE slug = 'theu-tui-tote'), 'Size S (25x30cm)', 'TOTE-S', 0, 30,
     '{"size": "S", "dimensions": "25x30cm"}'::jsonb),
    ((SELECT id FROM public.products WHERE slug = 'theu-tui-tote'), 'Size M (30x40cm)', 'TOTE-M', 30000, 20,
     '{"size": "M", "dimensions": "30x40cm"}'::jsonb),
    ((SELECT id FROM public.products WHERE slug = 'theu-tui-tote'), 'Size L (35x45cm)', 'TOTE-L', 50000, 15,
     '{"size": "L", "dimensions": "35x45cm"}'::jsonb);

END $$;
