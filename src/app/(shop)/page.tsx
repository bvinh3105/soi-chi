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
                <li>
                  <a
                    href="https://www.instagram.com/soichi.stu2026/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/50 hover:text-white transition inline-flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.threads.com/@soichi.stu2026"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/50 hover:text-white transition inline-flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M17.185 11.13c-.093-.045-.187-.088-.284-.129-.166-3.096-1.867-4.87-4.72-4.888-1.523-.008-2.855.605-3.7 1.883l1.315.87c.6-.9 1.542-1.092 2.379-1.092h.032c1.05.007 1.842.312 2.354.907.372.435.62 1.036.744 1.795-.943-.16-1.962-.209-3.05-.146-3.06.176-5.027 1.96-4.895 4.44.067 1.258.694 2.34 1.766 3.048.906.598 2.073.89 3.286.827 1.6-.088 2.855-.696 3.73-1.809.664-.844 1.084-1.938 1.267-3.316.75.454 1.307 1.05 1.615 1.767.523 1.219.553 3.22-1.081 4.854-1.432 1.431-3.155 2.05-5.762 2.07-2.892-.022-5.078-.949-6.499-2.756C3.373 17.51 2.687 15.36 2.66 12.001c.026-3.361.712-5.511 2.026-7.13C6.108 3.065 8.293 2.137 11.187 2.116c2.914.022 5.137.953 6.607 2.768.72.891 1.263 2.011 1.622 3.322l1.766-.472c-.436-1.614-1.12-3.005-2.05-4.155-1.878-2.321-4.635-3.518-8.194-3.543-3.552.025-6.235 1.229-8.03 3.579-1.593 2.086-2.42 4.999-2.457 8.657C.489 15.951 1.31 18.85 2.9 20.938c1.795 2.35 4.484 3.55 8.03 3.577h.036c3.152-.022 5.375-.855 7.204-2.685 2.394-2.393 2.32-5.394 1.532-7.235-.564-1.316-1.658-2.395-3.164-3.114l-.353-.351zm-3.845 5.302c-1.342.076-2.735-.529-2.802-1.774-.05-.923.658-1.955 2.878-2.083.253-.014.502-.021.746-.021.808 0 1.564.078 2.253.229-.257 3.213-1.769 3.591-3.075 3.649z" />
                    </svg>
                    Threads
                  </a>
                </li>
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
