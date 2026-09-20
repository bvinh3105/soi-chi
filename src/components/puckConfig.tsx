"use client";

// ============================================================
// Puck block config cho landing page
// ============================================================
// Mỗi block là 1 entry trong `components`. Admin kéo từ sidebar
// Puck editor, sắp xếp thứ tự, sửa props trong panel bên phải.
// Muốn thêm block mới: thêm entry vào `components` bên dưới.

import type { Config, ComponentConfig } from "@measured/puck";
import Link from "next/link";

// ─── BLOCK: Hero ────────────────────────────────────────────
interface HeroProps {
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
  imageUrl: string;
  imageAlt: string;
}

function Hero({ title, subtitle, primaryCtaText, primaryCtaHref, secondaryCtaText, secondaryCtaHref, imageUrl, imageAlt }: HeroProps) {
  return (
    <section className="bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-charcoal leading-[1.1] tracking-tight uppercase whitespace-pre-line">
              {title}
            </h1>
            <p className="mt-5 text-sage-600 text-base leading-relaxed max-w-sm">{subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-4">
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
          </div>
          {imageUrl && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={imageAlt || ""} className="w-full h-auto rounded-2xl shadow-lg" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── BLOCK: FeatureBullets ──────────────────────────────────
interface FeatureBulletsProps {
  items: { text: string }[];
}

function FeatureBullets({ items }: FeatureBulletsProps) {
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

// ─── BLOCK: CtaBanner ───────────────────────────────────────
interface CtaBannerProps {
  heading: string;
  description: string;
  ctaText: string;
  ctaHref: string;
}

function CtaBanner({ heading, description, ctaText, ctaHref }: CtaBannerProps) {
  return (
    <section className="bg-sage-500 py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">{heading}</h2>
        <p className="text-sage-50 text-base mb-8 max-w-2xl mx-auto">{description}</p>
        {ctaText && (
          <Link href={ctaHref || "#"} className="inline-block bg-white text-sage-700 text-sm font-bold rounded-full px-8 py-3.5 hover:bg-cream transition shadow-md">
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  );
}

// ─── BLOCK: TextSection (freeform) ──────────────────────────
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
// TypeScript tightness của Puck rất khắt khe — cast từng ComponentConfig
// sang <any> để giữ code render đơn giản. Runtime shape vẫn đúng.
type AnyConfig = ComponentConfig<any>;

export const puckConfig: Config = {
  components: {
    Hero: {
      label: "Hero (banner đầu trang)",
      fields: {
        title: { type: "textarea", label: "Tiêu đề (Enter để xuống dòng)" },
        subtitle: { type: "textarea", label: "Mô tả ngắn" },
        primaryCtaText: { type: "text", label: "Nút chính — chữ" },
        primaryCtaHref: { type: "text", label: "Nút chính — link" },
        secondaryCtaText: { type: "text", label: "Nút phụ — chữ" },
        secondaryCtaHref: { type: "text", label: "Nút phụ — link" },
        imageUrl: { type: "text", label: "Ảnh minh họa — URL" },
        imageAlt: { type: "text", label: "Ảnh minh họa — alt text" },
      },
      defaultProps: {
        title: "Mỗi mũi thêu,\nmột câu\nchuyện riêng",
        subtitle: "Thêu tay thủ công lên tranh, quần áo và túi — hoặc tự tay thêu với bộ kit DIY của chúng tôi.",
        primaryCtaText: "Xem dịch vụ",
        primaryCtaHref: "#san-pham",
        secondaryCtaText: "",
        secondaryCtaHref: "",
        imageUrl: "",
        imageAlt: "",
      },
      render: Hero as unknown as AnyConfig["render"],
    } as AnyConfig,
    FeatureBullets: {
      label: "Điểm mạnh (checklist)",
      fields: {
        items: {
          type: "array",
          label: "Điểm mạnh",
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
    CtaBanner: {
      label: "Kêu gọi hành động",
      fields: {
        heading: { type: "text", label: "Tiêu đề" },
        description: { type: "textarea", label: "Mô tả" },
        ctaText: { type: "text", label: "Nút — chữ" },
        ctaHref: { type: "text", label: "Nút — link" },
      },
      defaultProps: {
        heading: "Bắt đầu đặt thêu hôm nay",
        description: "Đăng ký để theo dõi đơn hàng, nhận ưu đãi và xem bộ sưu tập mẫu thêu mới.",
        ctaText: "Đăng ký ngay",
        ctaHref: "/register",
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
