-- Seed data for D1 (LEGACY — dự án đã rollback từ D1 về Supabase 2026-09-08)
-- Run after migration: npx wrangler d1 execute soi-chi-db --remote --file=./d1-seed.sql

-- Admin (password: admin123, bcrypt hash)
INSERT OR IGNORE INTO "User" (id, email, hashedPassword, fullName, role, createdAt, updatedAt)
VALUES ('admin001', 'admin@soichi.vn', '$2a$12$LJ3a4PBfMfN3.DGM8z5H4eVrYKJ3vGz1jFQOaH5rU5K.YFVxq8bXq', 'Admin', 'admin', datetime('now'), datetime('now'));

-- Customer (password: test123, bcrypt hash)
INSERT OR IGNORE INTO "User" (id, email, hashedPassword, fullName, phone, role, createdAt, updatedAt)
VALUES ('cust001', 'khach@soichi.vn', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Khách Test', '0901234567', 'customer', datetime('now'), datetime('now'));

-- Categories
INSERT OR IGNORE INTO "Category" (id, name, slug, description, sortOrder, isActive, createdAt)
VALUES
  ('cat-ao', 'Áo', 'ao', 'Các loại áo thời trang', 1, 1, datetime('now')),
  ('cat-quan', 'Quần', 'quan', 'Các loại quần thời trang', 2, 1, datetime('now')),
  ('cat-pk', 'Phụ kiện', 'phu-kien', 'Phụ kiện thời trang', 3, 1, datetime('now')),
  ('cat-gd', 'Giày dép', 'giay-dep', 'Giày dép các loại', 4, 1, datetime('now'));

-- Products
INSERT OR IGNORE INTO "Product" (id, name, slug, description, price, salePrice, stock, isActive, categoryId, images, createdAt, updatedAt)
VALUES
  ('p1', 'Áo thun basic trắng', 'ao-thun-basic-trang', 'Áo thun cotton 100% form regular fit', 199000, 149000, 50, 1, 'cat-ao', '["https://placehold.co/600x800/f8f8f8/333?text=Ao+Thun+Trang"]', datetime('now'), datetime('now')),
  ('p2', 'Áo thun basic đen', 'ao-thun-basic-den', 'Áo thun cotton 100% form regular fit', 199000, NULL, 35, 1, 'cat-ao', '["https://placehold.co/600x800/333/fff?text=Ao+Thun+Den"]', datetime('now'), datetime('now')),
  ('p3', 'Áo sơ mi linen', 'ao-so-mi-linen', 'Áo sơ mi chất liệu linen thoáng mát', 450000, 389000, 20, 1, 'cat-ao', '["https://placehold.co/600x800/e8dcc8/333?text=So+Mi+Linen"]', datetime('now'), datetime('now')),
  ('p4', 'Quần jeans slim fit', 'quan-jeans-slim-fit', 'Quần jeans co giãn form slim fit', 550000, 459000, 30, 1, 'cat-quan', '["https://placehold.co/600x800/4a6fa5/fff?text=Jeans+Slim"]', datetime('now'), datetime('now')),
  ('p5', 'Quần kaki', 'quan-kaki', 'Quần kaki form regular thoải mái', 399000, NULL, 40, 1, 'cat-quan', '["https://placehold.co/600x800/c4a97d/333?text=Quan+Kaki"]', datetime('now'), datetime('now')),
  ('p6', 'Quần short thể thao', 'quan-short-the-thao', 'Quần short thể thao chất liệu thấm hút', 249000, 199000, 60, 1, 'cat-quan', '["https://placehold.co/600x800/2d5a27/fff?text=Short+Sport"]', datetime('now'), datetime('now')),
  ('p7', 'Nón bucket', 'non-bucket', 'Nón bucket vải canvas phong cách', 159000, NULL, 100, 1, 'cat-pk', '["https://placehold.co/600x800/8b6914/fff?text=Non+Bucket"]', datetime('now'), datetime('now')),
  ('p8', 'Túi tote canvas', 'tui-tote-canvas', 'Túi tote canvas dày dặn tiện lợi', 189000, 149000, 45, 1, 'cat-pk', '["https://placehold.co/600x800/556b2f/fff?text=Tui+Tote"]', datetime('now'), datetime('now')),
  ('p9', 'Giày sneaker trắng', 'giay-sneaker-trang', 'Giày sneaker da trắng đế cao su', 750000, 599000, 25, 1, 'cat-gd', '["https://placehold.co/600x800/f0f0f0/333?text=Sneaker+Trang"]', datetime('now'), datetime('now')),
  ('p10', 'Dép quai ngang', 'dep-quai-ngang', 'Dép quai ngang êm nhẹ phù hợp mọi lúc', 199000, NULL, 80, 1, 'cat-gd', '["https://placehold.co/600x800/2f4f4f/fff?text=Dep+Quai+Ngang"]', datetime('now'), datetime('now'));
