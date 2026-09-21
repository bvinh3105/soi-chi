import { categories } from "@/lib/data";
import Link from "next/link";
import CartBar from "@/components/CartBar";
import AccountBadge from "@/components/AccountBadge";
import LandingBlocks from "@/components/LandingBlocks";

// Từ 2026-09-21: mọi nội dung landing (hero, categories, products, CTA)
// đã chuyển vào Puck editor — sửa qua /admin/landing. Chỉ Navbar + Footer
// giữ hardcode vì chứa client logic (cart, account, nav to categories).
export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* ─── NAVBAR ──────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-sage-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Sợi chỉ" className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {categories.map((cat) => (
              <Link key={cat.id} href="#san-pham" className="text-sm text-sage-600 hover:text-charcoal transition">
                {cat.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/track" className="text-xs text-sage-500 hover:text-charcoal transition hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-full hover:bg-sage-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              Tra cứu đơn
            </Link>
            <CartBar />
            <AccountBadge />
          </div>
        </div>
      </header>

      {/* ─── NỘI DUNG LANDING — Puck editor ────────────── */}
      <LandingBlocks />

      {/* ─── FOOTER ──────────────────────────────────────── */}
      <footer className="bg-charcoal text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Sợi chỉ" className="h-7 w-auto mb-3" style={{ filter: 'brightness(0) invert(1)' }} />
              <p className="text-white/50 text-sm leading-relaxed">
                Thêu tay thủ công<br />theo yêu cầu riêng của bạn
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-widest mb-4 text-sage-300">Danh mục</h4>
              <ul className="space-y-2.5">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link href={`/?category=${cat.slug}`} className="text-sm text-white/50 hover:text-white transition">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-widest mb-4 text-sage-300">Hỗ trợ</h4>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-white/50">Chính sách đổi trả</span></li>
                <li><span className="text-sm text-white/50">Vận chuyển</span></li>
                <li><span className="text-sm text-white/50">Liên hệ</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-widest mb-4 text-sage-300">Kết nối</h4>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-white/50">Facebook</span></li>
                <li><span className="text-sm text-white/50">Instagram</span></li>
                <li><span className="text-sm text-white/50">TikTok</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-white/30">
            © 2026 Sợi chỉ.
          </div>
        </div>
      </footer>
    </main>
  );
}
