"use client";

// ============================================================
// Puck block config cho landing page
// ============================================================
// Mỗi block là 1 entry trong `components`. Admin kéo từ sidebar
// Puck editor, sắp xếp thứ tự, sửa props trong panel bên phải.
//
// Blocks có 2 loại:
// - STATIC: chỉ nhận text/ảnh do admin nhập (Hero, CtaBanner, ...)
// - DYNAMIC: đọc data thật từ `src/lib/data.ts` — admin không sửa
//   nội dung item được, chỉ chọn filter/số lượng (CategoriesGrid,
//   ProductGrid). Sau này khi products/categories đọc từ Supabase,
//   chỉ cần sửa các block dynamic ở đây, không đụng puckConfig.

import type { Config, ComponentConfig } from "@measured/puck";
import Link from "next/link";
import { categories, products } from "@/lib/data";
import AddToCartButton from "./AddToCartButton";

type AnyConfig = ComponentConfig<any>;

function formatVND(price: number) {
  return price.toLocaleString("vi-VN") + "đ";
}

function placeholderFor(slug: string) {
  const map: Record<string, string> = {
    "tranh-theu-hoa-sen": "EEF1EA/556b2f?text=Hoa+Sen",
    "tranh-theu-lang-que": "D4DCCA/2f4f4f?text=Phong+Canh",
    "theu-ten-ao-phong": "f8f8f8/556b2f?text=Ao+Phong",
    "theu-logo-dong-phuc": "A8B496/fff?text=Dong+Phuc",
    "theu-hoa-tiet-ao-khoac": "7D8B6A/fff?text=Ao+Khoac",
    "theu-tui-tote": "556b2f/fff?text=Tui+Tote",
    "theu-tui-da": "8b6914/fff?text=Tui+Da",
    "bo-tu-theu-hoa-cuc": "EEF1EA/7D8B6A?text=Hoa+Cuc",
    "bo-tu-theu-meo": "D4DCCA/2C2C2C?text=Hinh+Meo",
    "bo-tu-theu-chu": "A8B496/fff?text=Chu+Nghe+Thuat",
  };
  return `https://placehold.co/600x800/${map[slug] ?? "EEF1EA/556b2f?text=SP"}`;
}

const CAT_ICONS: Record<string, JSX.Element> = {
  "theu-tranh": (
    <svg className="w-7 h-7 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
  "theu-quan-ao": (
    <svg className="w-7 h-7 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  ),
  "theu-tui": (
    <svg className="w-7 h-7 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
    </svg>
  ),
  "tu-lam": (
    <svg className="w-7 h-7 text-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
    </svg>
  ),
};

function StarIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg className={`w-4 h-4 ${filled ? "text-sage-500" : "text-sage-300"}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

// ─── BLOCK: HeroWithDecor ───────────────────────────────────
// Match hero hiện tại: text bên trái, decor bên phải (khung thêu,
// brand card, cuộn chỉ, price tag...). Chỉ text + CTA editable.
interface HeroDecorProps {
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  footnote: string;
  showDecor: boolean;
  priceTag: string;
  priceTagLabel: string;
  brandTop: string;
  brandBottom: string;
}

function HeroWithDecor({ title, subtitle, primaryCtaText, primaryCtaHref, secondaryCtaText, secondaryCtaHref, footnote, showDecor, priceTag, priceTagLabel, brandTop, brandBottom }: HeroDecorProps) {
  return (
    <section className="bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className={`grid ${showDecor ? "md:grid-cols-2" : "grid-cols-1 text-center"} gap-12 items-center`}>
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-charcoal leading-[1.1] tracking-tight uppercase whitespace-pre-line">
              {title}
            </h1>
            <p className="mt-5 text-sage-600 text-base leading-relaxed max-w-sm">{subtitle}</p>
            <div className={`mt-8 flex flex-wrap gap-4 ${showDecor ? "" : "justify-center"}`}>
              {primaryCtaText && (
                <Link href={primaryCtaHref || "#"} className="inline-block bg-sage-500 text-white text-sm font-medium rounded-full px-8 py-3.5 hover:bg-sage-600 transition shadow-sm">
                  {primaryCtaText}
                </Link>
              )}
              {secondaryCtaText && (
                <Link href={secondaryCtaHref || "#"} className="inline-block border border-sage-300 text-sage-700 text-sm font-medium rounded-full px-8 py-3.5 hover:bg-sage-50 transition">
                  {secondaryCtaText}
                </Link>
              )}
            </div>
            {footnote && <p className="text-xs text-sage-400 mt-4">{footnote}</p>}
          </div>

          {showDecor && (
            <div className="relative">
              <div className="relative w-full aspect-[4/3] bg-sage-50 rounded-3xl overflow-hidden">
                <div className="absolute inset-6 rounded-full border-2 border-dashed border-sage-200 opacity-40" />
                <div className="absolute inset-12 rounded-full border border-sage-200 opacity-30" />

                <div className="absolute left-[8%] top-[15%] w-[42%] aspect-[4/5] bg-cream rounded-2xl shadow-lg border border-sage-100 rotate-[-4deg]">
                  <div className="absolute inset-3 border border-dashed border-sage-300 rounded-xl flex items-center justify-center">
                    <svg className="w-24 h-24 text-sage-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M20 60 Q30 20, 50 40 T80 60" strokeDasharray="4 4" />
                      <path d="M30 75 L40 65 L50 75 L60 65 L70 75" strokeDasharray="3 3" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-sage-400 border-2 border-white" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-sage-400 border-2 border-white" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-sage-400 border-2 border-white" />
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-sage-400 border-2 border-white" />
                </div>

                <div className="absolute right-[8%] top-[10%] w-[38%] aspect-square bg-sage-700 rounded-2xl shadow-xl overflow-hidden rotate-[5deg]">
                  <div className="absolute top-0 left-1/4 w-2 h-8 bg-sage-800" />
                  <div className="absolute top-0 right-1/4 w-2 h-8 bg-sage-800" />
                  <div className="absolute inset-6 top-10 rounded-xl border-2 border-dashed border-cream/40 flex items-center justify-center">
                    <span className="font-display italic text-cream text-2xl leading-none text-center">{brandTop}<br />{brandBottom}</span>
                  </div>
                </div>

                <div className="absolute left-[35%] bottom-[12%] w-[22%] aspect-square rotate-[-8deg]">
                  <div className="w-full h-full bg-white rounded-2xl shadow-lg border border-sage-100 flex items-center justify-center relative overflow-hidden">
                    <div className="w-3/4 aspect-square rounded-full bg-gradient-to-br from-sage-300 to-sage-500 relative">
                      <div className="absolute inset-[15%] rounded-full bg-cream" />
                      <div className="absolute inset-[35%] rounded-full bg-sage-400" />
                    </div>
                  </div>
                </div>

                <div className="absolute right-[6%] bottom-[8%] w-[30%] aspect-square rotate-[6deg]">
                  <div className="w-full h-full bg-cream rounded-full shadow-xl border-8 border-sage-600 flex items-center justify-center relative">
                    <svg className="w-16 h-16 text-sage-500" viewBox="0 0 100 100" fill="currentColor">
                      <path d="M50 20 Q60 40 50 50 Q40 40 50 20 Z" />
                      <path d="M35 45 Q45 55 40 65 Q30 55 35 45 Z" opacity="0.7" />
                      <path d="M65 45 Q75 55 60 65 Q55 55 65 45 Z" opacity="0.7" />
                    </svg>
                  </div>
                </div>

                <div className="absolute left-[6%] bottom-[5%] bg-white rounded-full shadow-lg border border-sage-100 px-3 py-2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-sage-500 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2 L11 8 L18 10 L11 12 L10 18 L9 12 L2 10 L9 8 Z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-medium text-sage-700 uppercase tracking-wider">Thủ công</span>
                </div>

                {priceTag && (
                  <div className="absolute right-[2%] top-[45%] bg-sage-500 text-white rounded-2xl shadow-xl px-4 py-3 rotate-6">
                    <p className="text-[9px] uppercase tracking-widest opacity-80">{priceTagLabel}</p>
                    <p className="font-display text-lg font-bold leading-none">{priceTag}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-center gap-3 text-sage-500">
                <div className="flex -space-x-1">
                  {[1, 2, 3, 4].map(i => <StarIcon key={i} filled />)}
                  <StarIcon filled={false} />
                </div>
                <span className="text-xs">Khách hàng yêu thích</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── BLOCK: SimpleHero (không decor) ────────────────────────
interface SimpleHeroProps {
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  imageUrl: string;
}

function SimpleHero({ title, subtitle, primaryCtaText, primaryCtaHref, secondaryCtaText, secondaryCtaHref, imageUrl }: SimpleHeroProps) {
  return (
    <section className="bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-charcoal leading-[1.1] tracking-tight uppercase whitespace-pre-line">{title}</h1>
            <p className="mt-5 text-sage-600 text-base leading-relaxed max-w-sm">{subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              {primaryCtaText && <Link href={primaryCtaHref || "#"} className="inline-block bg-sage-500 text-white text-sm font-medium rounded-full px-8 py-3.5 hover:bg-sage-600 transition shadow-sm">{primaryCtaText}</Link>}
              {secondaryCtaText && <Link href={secondaryCtaHref || "#"} className="inline-block border border-sage-300 text-sage-700 text-sm font-medium rounded-full px-8 py-3.5 hover:bg-sage-50 transition">{secondaryCtaText}</Link>}
            </div>
          </div>
          {imageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={imageUrl} alt="" className="w-full h-auto rounded-2xl shadow-lg" />
          )}
        </div>
      </div>
    </section>
  );
}

// ─── BLOCK: FeatureBullets ──────────────────────────────────
function FeatureBullets({ items }: { items: { text: string }[] }) {
  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-sm text-sage-700">
              <svg className="w-5 h-5 text-sage-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── BLOCK: ProcessSteps ────────────────────────────────────
interface ProcessStepsProps {
  heading: string;
  steps: { title: string; desc: string }[];
  ctaText: string;
  ctaHref: string;
  showPreviewGrid: boolean;
  previewBadge: string;
}

function ProcessSteps({ heading, steps, ctaText, ctaHref, showPreviewGrid, previewBadge }: ProcessStepsProps) {
  return (
    <section className="bg-sage-500 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className={`grid ${showPreviewGrid ? "md:grid-cols-2" : "grid-cols-1 max-w-2xl mx-auto text-center"} gap-12 items-center`}>
          <div className="text-white">
            <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight whitespace-pre-line">{heading}</h2>
            <div className="space-y-6 mt-10">
              {steps.map((s, i) => (
                <div key={i} className={`flex gap-4 items-start ${showPreviewGrid ? "" : "text-left"}`}>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{s.title}</h3>
                    <p className="text-white/70 text-sm mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {ctaText && (
              <Link href={ctaHref || "#"} className="inline-block mt-10 bg-white text-sage-700 font-medium rounded-full px-8 py-3.5 hover:bg-cream transition text-sm shadow-sm">
                {ctaText}
              </Link>
            )}
          </div>

          {showPreviewGrid && (
            <div className="relative">
              <div className="bg-sage-400/30 rounded-2xl p-6 md:p-8">
                <div className="grid grid-cols-2 gap-3">
                  {products.slice(0, 4).map(p => (
                    <Link key={p.id} href={`/product/${p.slug}`} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition group">
                      <div className="aspect-square bg-sage-50 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={placeholderFor(p.slug)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      </div>
                      <div className="p-2.5">
                        <p className="text-[10px] font-medium text-sage-500 uppercase tracking-wider">{p.category?.name}</p>
                        <p className="text-xs font-medium text-charcoal truncate mt-0.5">{p.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                {previewBadge && <div className="absolute -top-3 -right-3 bg-cream text-sage-700 rounded-full px-4 py-2 shadow-lg text-xs font-bold uppercase tracking-wider">{previewBadge}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── BLOCK: CategoriesGrid (dynamic — auto reads categories) ─
interface CategoriesGridProps {
  heading: string;
}
function CategoriesGrid({ heading }: CategoriesGridProps) {
  const CAT_DESC: Record<string, string> = {
    "theu-tranh": "Tranh thêu tay tinh xảo",
    "theu-quan-ao": "Thêu logo, tên, họa tiết",
    "theu-tui": "Túi vải, túi canvas, túi da",
    "tu-lam": "Bộ nguyên liệu tự thêu tại nhà",
  };
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      {heading && <h2 className="text-3xl font-display font-bold text-center text-charcoal mb-10">{heading}</h2>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map(cat => (
          <Link key={cat.id} href={`/?category=${cat.slug}`} className="bg-white rounded-2xl border border-sage-100 p-6 text-center hover:shadow-md hover:border-sage-300 transition group">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sage-50 flex items-center justify-center group-hover:bg-sage-100 transition">
              {CAT_ICONS[cat.slug] ?? CAT_ICONS["theu-tranh"]}
            </div>
            <p className="font-medium text-charcoal">{cat.name}</p>
            <p className="text-xs text-sage-400 mt-1">{CAT_DESC[cat.slug] ?? ""}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── BLOCK: ProductGrid (dynamic — auto reads products) ─────
interface ProductGridProps {
  heading: string;
  subtitle: string;
  anchorId: string;
  maxItems: number;
}
function ProductGrid({ heading, subtitle, anchorId, maxItems }: ProductGridProps) {
  const items = products.slice(0, maxItems > 0 ? maxItems : products.length);
  return (
    <section className="max-w-7xl mx-auto px-4 pb-20" id={anchorId || undefined}>
      <div className="flex items-end justify-between mb-8">
        <div>
          {heading && <h2 className="text-3xl font-display font-bold text-charcoal">{heading}</h2>}
          {subtitle && <p className="text-sage-500 mt-1">{subtitle.replace("{count}", String(items.length))}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map(product => (
          <div key={product.id} className="bg-white rounded-xl overflow-hidden border border-sage-100 hover:shadow-lg transition group relative">
            <Link href={`/product/${product.slug}`} className="block">
              <div className="aspect-[3/4] bg-sage-50 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={placeholderFor(product.slug)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                {product.salePrice && (
                  <span className="absolute top-2 left-2 bg-sage-700 text-white text-[10px] px-2.5 py-1 rounded-full font-medium">
                    -{Math.round((1 - product.salePrice / product.price) * 100)}%
                  </span>
                )}
              </div>
              <div className="p-3 pb-1">
                <p className="text-[10px] text-sage-400 uppercase tracking-wider mb-1">{product.category?.name}</p>
                <h3 className="text-sm font-medium text-charcoal line-clamp-2 mb-2">{product.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-sage-700">{formatVND(product.salePrice || product.price)}</span>
                  {product.salePrice && <span className="text-xs text-sage-300 line-through">{formatVND(product.price)}</span>}
                </div>
              </div>
            </Link>
            <div className="p-3 pt-2 flex items-center justify-between">
              <span className="text-[10px] text-sage-400">{product.stock > 0 ? `Còn ${product.stock}` : "Đặt trước"}</span>
              <AddToCartButton
                compact
                product={{
                  productId: product.id,
                  name: product.name,
                  price: product.salePrice ?? product.price,
                  originalPrice: product.price,
                  image: placeholderFor(product.slug),
                  slug: product.slug,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── BLOCK: CtaBanner ───────────────────────────────────────
interface CtaBannerProps {
  heading: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  variant: "sage" | "cream";
}
function CtaBanner({ heading, description, ctaText, ctaHref, variant }: CtaBannerProps) {
  const bg = variant === "cream" ? "bg-sage-50 border-t border-sage-100" : "bg-sage-500";
  const headingColor = variant === "cream" ? "text-charcoal" : "text-white";
  const descColor = variant === "cream" ? "text-sage-500" : "text-sage-50";
  const btnClass = variant === "cream"
    ? "inline-block bg-sage-500 text-white font-medium rounded-full px-10 py-4 hover:bg-sage-600 transition text-sm shadow-sm"
    : "inline-block bg-white text-sage-700 text-sm font-bold rounded-full px-8 py-3.5 hover:bg-cream transition shadow-md";
  return (
    <section className={bg}>
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className={`text-4xl md:text-5xl font-display font-bold ${headingColor} mb-4`}>{heading}</h2>
        <p className={`${descColor} max-w-lg mx-auto mb-10`}>{description}</p>
        {ctaText && <Link href={ctaHref || "#"} className={btnClass}>{ctaText}</Link>}
      </div>
    </section>
  );
}

// ─── BLOCK: TextSection ─────────────────────────────────────
interface TextSectionProps {
  heading: string;
  body: string;
  align: "left" | "center";
  background: "white" | "cream" | "sage";
}
function TextSection({ heading, body, align, background }: TextSectionProps) {
  const bgClass = background === "cream" ? "bg-cream" : background === "sage" ? "bg-sage-50" : "bg-white";
  const alignClass = align === "center" ? "text-center" : "text-left";
  return (
    <section className={`${bgClass} py-12`}>
      <div className={`max-w-3xl mx-auto px-4 ${alignClass}`}>
        {heading && <h2 className="text-2xl md:text-3xl font-display font-bold text-charcoal mb-4">{heading}</h2>}
        {body && <div className="text-sage-700 text-base leading-relaxed whitespace-pre-line">{body}</div>}
      </div>
    </section>
  );
}

// ─── PUCK CONFIG ────────────────────────────────────────────
export const puckConfig: Config = {
  components: {
    HeroWithDecor: {
      label: "Hero — có ảnh minh họa thêu (mặc định)",
      fields: {
        title: { type: "textarea", label: "Tiêu đề (Enter để xuống dòng)" },
        subtitle: { type: "textarea", label: "Mô tả ngắn" },
        primaryCtaText: { type: "text", label: "Nút chính — chữ" },
        primaryCtaHref: { type: "text", label: "Nút chính — link" },
        secondaryCtaText: { type: "text", label: "Nút phụ — chữ" },
        secondaryCtaHref: { type: "text", label: "Nút phụ — link" },
        footnote: { type: "text", label: "Ghi chú nhỏ dưới nút" },
        showDecor: {
          type: "radio",
          label: "Ảnh minh họa bên phải",
          options: [
            { label: "Hiện", value: true },
            { label: "Ẩn (text căn giữa)", value: false },
          ],
        },
        priceTag: { type: "text", label: "Nhãn giá (VD: 720.000đ, để trống để ẩn)" },
        priceTagLabel: { type: "text", label: "Chữ trên nhãn giá" },
        brandTop: { type: "text", label: "Brand card — chữ trên" },
        brandBottom: { type: "text", label: "Brand card — chữ dưới" },
      },
      defaultProps: {
        title: "Mỗi mũi thêu,\nmột câu\nchuyện riêng",
        subtitle: "Thêu tay thủ công lên tranh, quần áo và túi — hoặc tự tay thêu với bộ kit DIY của chúng tôi.",
        primaryCtaText: "Xem dịch vụ",
        primaryCtaHref: "#san-pham",
        secondaryCtaText: "Bộ tự thêu tại nhà",
        secondaryCtaHref: "#san-pham",
        footnote: "4 loại dịch vụ · Đặt theo yêu cầu",
        showDecor: true,
        priceTag: "720.000đ",
        priceTagLabel: "Đã đặt",
        brandTop: "Sợi",
        brandBottom: "chỉ",
      },
      render: HeroWithDecor as unknown as AnyConfig["render"],
    } as AnyConfig,

    SimpleHero: {
      label: "Hero — đơn giản (text + ảnh)",
      fields: {
        title: { type: "textarea", label: "Tiêu đề" },
        subtitle: { type: "textarea", label: "Mô tả" },
        primaryCtaText: { type: "text", label: "Nút chính — chữ" },
        primaryCtaHref: { type: "text", label: "Nút chính — link" },
        secondaryCtaText: { type: "text", label: "Nút phụ — chữ" },
        secondaryCtaHref: { type: "text", label: "Nút phụ — link" },
        imageUrl: { type: "text", label: "Ảnh — URL (để trống nếu chỉ muốn text)" },
      },
      defaultProps: {
        title: "Mỗi mũi thêu,\nmột câu chuyện riêng",
        subtitle: "Thêu tay thủ công theo yêu cầu.",
        primaryCtaText: "Xem sản phẩm",
        primaryCtaHref: "#san-pham",
        secondaryCtaText: "",
        secondaryCtaHref: "",
        imageUrl: "",
      },
      render: SimpleHero as unknown as AnyConfig["render"],
    } as AnyConfig,

    FeatureBullets: {
      label: "Điểm mạnh (checklist)",
      fields: {
        items: {
          type: "array",
          label: "Danh sách",
          arrayFields: {
            text: { type: "text", label: "Nội dung" },
          },
          getItemSummary: (item: { text?: string }) => item?.text || "Mục mới",
        },
      },
      defaultProps: {
        items: [
          { text: "Thêu tay 100% thủ công" },
          { text: "Theo yêu cầu riêng" },
          { text: "Bộ tự thêu cho người mới" },
        ],
      },
      render: FeatureBullets as unknown as AnyConfig["render"],
    } as AnyConfig,

    ProcessSteps: {
      label: "Quy trình (sage bg + số bước)",
      fields: {
        heading: { type: "textarea", label: "Tiêu đề (xuống dòng bằng Enter)" },
        steps: {
          type: "array",
          label: "Các bước",
          arrayFields: {
            title: { type: "text", label: "Tên bước" },
            desc: { type: "textarea", label: "Mô tả" },
          },
          getItemSummary: (item: { title?: string }) => item?.title || "Bước mới",
        },
        ctaText: { type: "text", label: "Nút CTA — chữ" },
        ctaHref: { type: "text", label: "Nút CTA — link" },
        showPreviewGrid: {
          type: "radio",
          label: "Preview 4 sản phẩm bên phải",
          options: [
            { label: "Hiện", value: true },
            { label: "Ẩn", value: false },
          ],
        },
        previewBadge: { type: "text", label: "Badge trên preview (VD: Mới)" },
      },
      defaultProps: {
        heading: "Thêu theo\ný bạn,\ntay nghề của tôi",
        steps: [
          { title: "Gửi ý tưởng", desc: "Bạn chọn họa tiết, kích thước, màu chỉ — tôi tư vấn thêm" },
          { title: "Thêu thủ công", desc: "Từng mũi kim được thêu tỉ mỉ bằng tay, không máy móc" },
          { title: "Giao tận tay", desc: "Đóng gói cẩn thận, giao toàn quốc trong 3–7 ngày" },
        ],
        ctaText: "Đặt thêu ngay",
        ctaHref: "#san-pham",
        showPreviewGrid: true,
        previewBadge: "Mới",
      },
      render: ProcessSteps as unknown as AnyConfig["render"],
    } as AnyConfig,

    CategoriesGrid: {
      label: "Grid Danh mục (auto)",
      fields: {
        heading: { type: "text", label: "Tiêu đề" },
      },
      defaultProps: {
        heading: "Dịch vụ thêu của Sợi chỉ",
      },
      render: CategoriesGrid as unknown as AnyConfig["render"],
    } as AnyConfig,

    ProductGrid: {
      label: "Grid Sản phẩm (auto)",
      fields: {
        heading: { type: "text", label: "Tiêu đề" },
        subtitle: { type: "text", label: "Mô tả (dùng {count} để chèn số lượng)" },
        anchorId: { type: "text", label: "Anchor id (VD: san-pham — để link nội bộ)" },
        maxItems: { type: "number", label: "Số sản phẩm tối đa (0 = tất cả)" },
      },
      defaultProps: {
        heading: "Mẫu thêu & Kit nổi bật",
        subtitle: "{count} sản phẩm — thêu theo yêu cầu hoặc tự tay làm",
        anchorId: "san-pham",
        maxItems: 0,
      },
      render: ProductGrid as unknown as AnyConfig["render"],
    } as AnyConfig,

    CtaBanner: {
      label: "Kêu gọi hành động (banner)",
      fields: {
        heading: { type: "text", label: "Tiêu đề" },
        description: { type: "textarea", label: "Mô tả" },
        ctaText: { type: "text", label: "Nút — chữ" },
        ctaHref: { type: "text", label: "Nút — link" },
        variant: {
          type: "radio",
          label: "Kiểu",
          options: [
            { label: "Sage (nền xanh, chữ trắng)", value: "sage" },
            { label: "Cream (nền sáng, chữ đậm)", value: "cream" },
          ],
        },
      },
      defaultProps: {
        heading: "Bắt đầu đặt thêu hôm nay",
        description: "Đăng ký để theo dõi đơn hàng, nhận ưu đãi và xem bộ sưu tập mẫu thêu mới nhất",
        ctaText: "Đặt thêu ngay",
        ctaHref: "/register",
        variant: "cream",
      },
      render: CtaBanner as unknown as AnyConfig["render"],
    } as AnyConfig,

    TextSection: {
      label: "Đoạn văn bản",
      fields: {
        heading: { type: "text", label: "Tiêu đề (để trống nếu không cần)" },
        body: { type: "textarea", label: "Nội dung" },
        align: {
          type: "radio",
          label: "Canh lề",
          options: [
            { label: "Trái", value: "left" },
            { label: "Giữa", value: "center" },
          ],
        },
        background: {
          type: "radio",
          label: "Nền",
          options: [
            { label: "Trắng", value: "white" },
            { label: "Cream", value: "cream" },
            { label: "Sage", value: "sage" },
          ],
        },
      },
      defaultProps: {
        heading: "",
        body: "Nội dung ở đây...",
        align: "left",
        background: "white",
      },
      render: TextSection as unknown as AnyConfig["render"],
    } as AnyConfig,
  },
};
