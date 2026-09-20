# Sợi chỉ — Hướng dẫn làm việc

Dự án web thêu tay thủ công. Next.js 14 (static export) + Supabase + Cloudflare Pages.

> **Rebrand 2026-09-20**: "Miên Man" đã đổi tên thành **"Sợi chỉ"** (slug ASCII: `soi-chi`).
> - GitHub repo: `bvinh3105/soi-chi` (đã rename, GitHub redirect URL cũ)
> - Cloudflare Pages project: **`soi-chi`** — URL production giờ là `https://soi-chi.pages.dev`.
>   Project cũ `mien-man` (URL `soi-chi.pages.dev`) được **giữ lại** làm archive, không deploy
>   nữa (frozen ở version 2026-09-20). Nếu muốn xoá hẳn, vào CF Dashboard → Pages → mien-man → Settings → Delete project.
> - Local directory: vẫn là `G:\...\Projects\mien-man\` (không rename để tránh phá link/path).
> - Order prefix: đơn cũ giữ `MM-XXX`, đơn mới sẽ là `SC-XXX` sau khi chạy migration 008.
> - Admin Gmail `mienman.stu@gmail.com` vẫn giữ (không rename Gmail được).
Code này được sửa từ **2 máy khác nhau** (nhà + công ty), mỗi máy có phiên Claude Code riêng.
Đọc kỹ phần dưới TRƯỚC KHI code hoặc deploy để tránh lặp lại các sự cố đã từng xảy ra.

## Bắt buộc: trước khi bắt đầu sửa code — Sync workflow 2 máy

Code này sửa từ **2 máy khác nhau** (nhà + công ty). Mỗi phiên Claude Code MỚI phải làm đủ
các bước sau, theo đúng thứ tự, trước khi động vào code — kể cả khi tưởng chừng chỉ sửa 1
dòng nhỏ:

```bash
# 1. Pull code mới nhất
git pull origin master

# 2. Xem commit từ lần cuối làm việc — hiểu máy kia đã đổi gì
git log --oneline -10

# 3. Xem migration mới (nếu có) — có thể cần chạy trong Supabase Dashboard
ls supabase/migrations/ | tail -3

# 4. Đọc CLAUDE.md (file này) — máy kia có thể đã thêm hướng dẫn mới
#    Chú ý các dòng "từ 2026-XX-XX" và "Bug X" ghi lại quyết định + nguyên nhân gốc

# 5. Cài lại deps (npm ci không đổi lock, an toàn nếu deps chưa đổi)
npm ci
```

**Rule đã có sẵn tài nguyên bên ngoài code**: GitHub Secrets, Cloudflare Pages settings,
Supabase RLS policies, admin accounts... KHÔNG cần pull vì đã lưu ở cloud service (share
giữa 2 máy tự nhiên). Nhưng nếu MÁY kia vừa thay đổi 1 trong các thứ đó, họ PHẢI ghi lại
trong CLAUDE.md (kèm ngày) để máy này biết.

**Rule đã có sự cố merge**: Đã có tình huống 1 phiên xoá 1 đoạn code có chủ đích (bảo mật),
phiên kia hiểu nhầm là "mất code do lỗi merge" rồi tự khôi phục lại — gây quay vòng sự cố.
**Nếu thấy 1 đoạn code bị xoá mà không rõ lý do, đọc commit message gần nhất
(`git log -3 -p -- <file>`) trước khi khôi phục lại.**

**Rule commit + push**: Xong việc nào (dù nhỏ) → `git add -A && git commit -m "..." && git push`
ngay, đừng dồn. Máy kia có thể mở lại repo bất cứ lúc nào, dồn nhiều commit chưa push tăng
nguy cơ conflict.

## Deploy production — TỰ ĐỘNG qua GitHub Actions (từ 2026-09-08)

**Không cần chạy `wrangler deploy` thủ công nữa.** Mỗi lần `git push` lên `master`,
`.github/workflows/deploy.yml` tự chạy: `npm ci` → `npm run build` (với env vars lấy từ
GitHub Secrets, KHÔNG phải Cloudflare Dashboard) → `wrangler pages deploy`. Xem tiến độ tại
`https://github.com/bvinh3105/soi-chi/actions`.

**Cloudflare Pages "Automatic Deployments" đã bị TẮT** (Settings → Builds & deployments →
Branch control → uncheck "Enable automatic production branch deployments" + Preview branch =
None). Đây là bước quan trọng — nếu không tắt, Cloudflare tự build song song ra placeholder
URL rồi deploy SAU GH Actions → đè lên bản đúng (race condition, 100% các lần Cloudflare thắng
vì build đơn giản hơn). Đã xảy ra rất nhiều lần trước khi tắt.

Nếu sau này ai đó bật lại (vô tình hoặc do reset settings), sẽ thấy hiện tượng cũ: production
serve placeholder URL, login báo "Chức năng đăng nhập tài khoản đang được cập nhật". Vào lại
Cloudflare Dashboard → Settings → Builds & deployments tắt lại là xong.

**Setup 1 lần (đã làm — chỉ cần biết khi đổi máy/repo mới)**: 4 GitHub Secrets tại
Settings → Secrets and variables → Actions:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`.

**Nếu vẫn muốn deploy thủ công** (test nhanh, hoặc GitHub Actions đang lỗi):
```bash
npm run build
npx wrangler pages deploy out --project-name=soi-chi --commit-dirty=true
```

**Cách nhận biết production đang bị đè bản lỗi** (không cần đăng nhập):
```js
// Chạy trong Console (F12) trên soi-chi.pages.dev, hoặc qua javascript_tool
const res = await fetch('/login?_cb=' + Date.now(), { cache: 'no-store' });
const html = await res.text();
const match = html.match(/login\/page-[a-f0-9]+\.js/);
const script = await fetch('/_next/static/chunks/app/(auth)/' + match[0], { cache: 'no-store' });
const text = await script.text();
console.log('OK:', text.includes('etbtzznxkedbdeihoqmp'), '| BỊ ĐÈ:', text.includes('your-project-url-here'));
```

## Supabase

- Project: "miên man" (tên trong Supabase Dashboard) — `etbtzznxkedbdeihoqmp.supabase.co`
  (giữ nguyên tên project bên Supabase — chỉ là label, không ảnh hưởng gì đến app)
- `.env.local` (không commit — mỗi máy tự tạo file này, publishable key nên an toàn ghi thẳng ở đây):
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://etbtzznxkedbdeihoqmp.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_CK2IR45EDqvhVGBSGNgTzQ_QZKK3q59
  ```
- 3 tài khoản Admin thật (Supabase Auth, role=admin trong bảng `profiles`): bachvinhtran@gmail.com,
  hthaoan0108@gmail.com, và tài khoản studio (đã đổi Gmail 2026-09-20 từ `mienman.stu@gmail.com`
  sang `soichi.stu@gmail.com` — cần đổi email tài khoản Supabase Auth qua Dashboard, xem note dưới)

**Đổi email admin studio (2026-09-20)**: gmail cũ `mienman.stu@gmail.com` → mới `soichi.stu@gmail.com`.
Supabase Auth chưa tự nhận biết → phải vào Dashboard → Authentication → Users → click vào tài khoản
mienman.stu → Change Email → nhập soichi.stu@gmail.com → Save. Row `profiles` giữ nguyên (chỉ đổi
email trong `auth.users`, id không đổi nên role admin vẫn còn).
- Đăng nhập Admin: `/login` bằng 1 trong 3 email trên — **không còn "mã nội bộ"**, đã gỡ bỏ vĩnh viễn
  (hash lộ trong bundle, không an toàn, và không tương thích RLS `is_admin()`). Đừng khôi phục lại.

**Tính năng "Quên mật khẩu" (từ 2026-09-20)**: `/forgot-password` (nhập email →
`resetPasswordForEmail`) → email link → `/reset-password` (Supabase tự detect session từ URL
hash, xem `user` trong `useAuth()` — nếu null nghĩa là link hết hạn/không hợp lệ) → form đặt
mật khẩu mới (`updateUser({password})`). Cả 2 hàm nằm trong `src/lib/auth.tsx`
(`resetPassword`, `updatePassword`), theo đúng pattern các hàm auth khác trong file.

**Tên hiển thị admin (từ 2026-09-20)**: `src/app/admin/page.tsx` không còn hardcode
"Trần Bảo Vinh" — đọc từ `profile.full_name` qua `useAuth()`. Nếu 1 admin mới đăng nhập lần
đầu và profile chưa có `full_name` (VD tạo trực tiếp qua Supabase Dashboard, không qua form
`/register`), sidebar sẽ show phần trước `@` của email. Bấm icon bút chì cạnh tên để đổi
(gọi `updateProfile()` → RLS `"Users update own profile"` cho phép ghi).

**Mời thành viên + role_key (từ 2026-09-20)**: Migration 011 thêm cột `profiles.role_key`
(`owner`/`manager`/`staff`/`accountant`) + bảng `invitations` + trigger auto-apply. Cơ chế:
Owner mở tab "Phân quyền" → "Mời thành viên" → nhập email + role → tạo row invitation. Người
được mời tự vào `/register` với email đó → trigger `apply_pending_invitation` promote profile
lên `role='admin'` + gán `role_key`. Chỉ Owner (role_key='owner') được mời/đổi role/gỡ
thành viên khác — RLS `"Owner update any profile role"` lo phần đó. `role='admin'` (auth
level) và `role_key` (permission level) là 2 khái niệm khác nhau: `role='admin'` là điều kiện
duy nhất để `is_admin()` = true (dùng cho mọi RLS admin-only), `role_key` chỉ để phân sub-role
hiển thị trong UI. 3 admin gốc tự động được set `role_key='owner'` khi chạy migration.

**Nhật ký thao tác admin (từ 2026-09-20)**: Migration 010 tạo bảng `admin_activity_log`.
Log 9 loại action: `login`, `logout`, `view_order`, `drag_order`, `delete_order`,
`create_product`, `update_product`, `delete_product`, `update_profile`. Helper trong
`src/lib/activityLog.ts` là fire-and-forget (không await, không throw — bug logging không
được chặn UX). `view_order` throttle client-side: 1 lần/ngày/đơn/admin qua localStorage
(key `sc_admin_view_log_v1`) để không spam khi admin bấm đi bấm lại. Hiển thị 2 chỗ:
(1) tab "Nhật ký thao tác" trong sidebar admin — bảng toàn hệ thống có filter theo
loại action + admin; (2) trong modal chi tiết từng đơn — timeline compact chỉ event của
đơn đó. `order_history.changed_by` giờ cũng được truyền đúng khi kéo Kanban.

**Bắt buộc set up 1 lần trên Supabase Dashboard** (chưa làm — cần làm để tính năng hoạt động):
vào Authentication → URL Configuration → Redirect URLs, thêm `https://soi-chi.pages.dev/reset-password`
(và `http://localhost:3000/reset-password` nếu muốn test local). Thiếu bước này, Supabase sẽ
từ chối redirect kèm token → link trong email dẫn về trang chủ không có session, `/reset-password`
sẽ luôn báo "Link không hợp lệ".

### Thay đổi schema/RLS
Viết thành file migration mới trong `supabase/migrations/`, đánh số thứ tự tiếp theo (hiện đã có
001–008). Không sửa trực tiếp `schema.sql` cho phần đã deploy — chỉ cập nhật `schema.sql` để phản ánh
state mới nhất (dùng cho project mới tạo từ đầu). Chạy migration trong Supabase Dashboard → SQL Editor,
tab query mới mỗi lần.

**Sync migration giữa 2 máy**: Supabase là 1 project chung (`etbtzznxkedbdeihoqmp`) — migration
chạy 1 lần từ máy nào cũng được, cả 2 máy đều thấy hiệu ứng ngay. Nhưng file `.sql` phải được
commit vào repo để máy kia biết migration đó đã tồn tại (đừng chỉ chạy rồi quên commit).

**Bug 2026-09-08 — Bị đè đơn / không hiện realtime**: `007_fix_guest_checkout_for_authenticated.sql`
sửa RLS cho phép user đang đăng nhập cũng đặt được guest order. Trước đó policy `to anon` chặn
insert khi user đã login → frontend fallback localStorage âm thầm → đơn không vào DB → admin
Kanban không thấy. Kèm theo, `src/lib/orders.ts` đã bỏ silent fallback, giờ THROW lỗi rõ để
tránh "success giả".

## Khi gặp lỗi khó hiểu — thứ tự chẩn đoán

1. **Mở DevTools (F12) → Console** trên trang đang lỗi, thử lại thao tác, đọc dòng đỏ đầu tiên.
   Đã lộ ra nhiều nguyên nhân thật (VD: request gọi nhầm `127.0.0.1:54321` thay vì Supabase thật).
2. **Kiểm tra dữ liệu thật trong Supabase** (REST API hoặc SQL Editor) trước khi kết luận là bug code —
   không phải mọi lỗi báo cáo đều do code (từng có trường hợp do firewall mạng công ty chặn kết nối
   tới `supabase.co`, không liên quan gì tới app).
3. Nếu nghi ngờ bundle cũ/cache: fetch trực tiếp trang với `cache: 'no-store'` + query string ngẫu
   nhiên, so hash file JS với hash trong thư mục `out/` local — nếu khác nhau, production đang phục vụ
   bản cũ (xem mục "deploy" ở trên).

## Đơn hàng test

Khi tạo đơn test trong Supabase để debug, nhớ dọn lại sau: xoá theo thứ tự `order_items` →
`order_history` → `orders` (foreign key). Không xoá qua REST API (RLS chặn) — chạy SQL trực tiếp trong
SQL Editor.
