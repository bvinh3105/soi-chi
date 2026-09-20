import { products, getProductBySlug } from "@/lib/data";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductActions from "./ProductActions";

function formatVND(price: number) {
  return price.toLocaleString("vi-VN") + "đ";
}

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();

  const displayPrice = product.salePrice || product.price;
  const discount = product.salePrice
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-cream">
      {/* Navbar */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-sage-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-display font-semibold text-charcoal tracking-wide">
            Sợi chỉ
          </Link>
          <Link href="/" className="text-sm text-sage-600 hover:text-sage-800 hover:underline transition">
            &larr; Quay lại
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-16">
        <div className="bg-white rounded-2xl border border-sage-100 shadow-sm overflow-hidden md:flex">

          {/* Ảnh sản phẩm */}
          <div className="md:w-[45%] bg-sage-50 relative">
            <div className="aspect-[3/4] md:aspect-auto md:h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-sage-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* Thông tin sản phẩm */}
          <div className="md:w-[55%] p-6 md:p-10 flex flex-col">
            {/* Category breadcrumb */}
            <p className="text-xs text-sage-400 uppercase tracking-wide mb-2 font-medium">
              {product.category.name}
            </p>

            <h1 className="text-2xl md:text-3xl font-display font-semibold text-charcoal leading-snug mb-4">
              {product.name}
            </h1>

            <p className="text-sage-600 text-sm leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Giá */}
            <div className="flex items-end gap-3 mb-6">
              <span className="text-3xl font-bold text-sage-700">
                {formatVND(displayPrice)}
              </span>
              {product.salePrice && (
                <span className="text-lg text-sage-300 line-through pb-0.5">
                  {formatVND(product.price)}
                </span>
              )}
            </div>

            {/* Thông tin thêm */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-sm text-sage-600">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Còn {product.stock} sản phẩm
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                Giao toàn quốc 3–7 ngày
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Thêu tay 100% thủ công
              </span>
            </div>

            {/* Client actions: qty + add to cart */}
            <ProductActions product={{
              productId: product.id,
              name: product.name,
              price: displayPrice,
              originalPrice: product.price,
              image: product.images[0],
              slug: product.slug,
            }} />

            {/* Cam kết */}
            <div className="mt-8 pt-6 border-t border-sage-100 grid grid-cols-3 gap-4 text-center text-xs text-sage-500">
              <div>
                <div className="text-xl mb-1">🔄</div>
                <div>Đổi trả<br />7 ngày</div>
              </div>
              <div>
                <div className="text-xl mb-1">🛡️</div>
                <div>Bảo hành<br />chất lượng</div>
              </div>
              <div>
                <div className="text-xl mb-1">💬</div>
                <div>Tư vấn<br />qua Zalo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
