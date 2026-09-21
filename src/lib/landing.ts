// ============================================================
// Landing content — load/save Puck JSONB blob từ Supabase
// ============================================================
// - Bảng: landing_content (migration 012). Row cố định id='home'.
// - Shape: { content: [...blocks], root: { props: {} } } — Puck native.
// - Save: chỉ admin (RLS lo). Read: public (anon cũng load được).

import type { Data } from "@measured/puck";
import { getSupabase } from "./supabase";

export const LANDING_ID = "home";

export const EMPTY_LANDING: Data = {
  content: [],
  root: { props: {} },
};

// Template mặc định — reproduces layout hiện tại. Editor dùng cái này
// khi DB rỗng để admin thấy giao diện đang có, sửa/kéo/sắp xếp thoải mái.
// Public landing (`/`) cũng fallback vào cái này khi DB rỗng.
export const DEFAULT_LANDING: Data = {
  content: [
    {
      type: "HeroWithDecor",
      props: {
        id: "HeroWithDecor-default",
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
    },
    {
      type: "FeatureBullets",
      props: {
        id: "FeatureBullets-default",
        items: [
          { text: "Thêu tay 100% thủ công" },
          { text: "Theo yêu cầu riêng" },
          { text: "Bộ tự thêu cho người mới" },
        ],
      },
    },
    {
      type: "ProcessSteps",
      props: {
        id: "ProcessSteps-default",
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
    },
    {
      type: "CategoriesGrid",
      props: {
        id: "CategoriesGrid-default",
        heading: "Dịch vụ thêu của Sợi chỉ",
      },
    },
    {
      type: "ProductGrid",
      props: {
        id: "ProductGrid-default",
        heading: "Mẫu thêu & Kit nổi bật",
        subtitle: "{count} sản phẩm — thêu theo yêu cầu hoặc tự tay làm",
        anchorId: "san-pham",
        maxItems: 0,
      },
    },
    {
      type: "CtaBanner",
      props: {
        id: "CtaBanner-default",
        heading: "Bắt đầu đặt thêu hôm nay",
        description: "Đăng ký để theo dõi đơn hàng, nhận ưu đãi và xem bộ sưu tập mẫu thêu mới nhất",
        ctaText: "Đặt thêu ngay",
        ctaHref: "/register",
        variant: "cream",
      },
    },
  ],
  root: { props: {} },
};

export async function fetchLandingContent(): Promise<Data> {
  try {
    const client = getSupabase() as unknown as { from: (t: string) => any };
    const { data, error } = await client
      .from("landing_content")
      .select("data")
      .eq("id", LANDING_ID)
      .single();
    if (error || !data) return EMPTY_LANDING;
    return (data.data as Data) ?? EMPTY_LANDING;
  } catch {
    return EMPTY_LANDING;
  }
}

export async function saveLandingContent(data: Data, updatedBy: string): Promise<void> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  const { error } = await client
    .from("landing_content")
    .update({ data, updated_by: updatedBy })
    .eq("id", LANDING_ID);
  if (error) throw new Error(error.message);
}
