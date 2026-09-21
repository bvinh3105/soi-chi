"use client";

// ============================================================
// LandingBlocks — render Puck blocks trên trang chủ shop
// ============================================================
// Đây là toàn bộ nội dung landing (từ 2026-09-21) — thay thế toàn bộ
// hero/categories/products hardcoded cũ. Nếu DB rỗng thì fallback vào
// DEFAULT_LANDING (giao diện gốc), nên trang chủ không bao giờ trắng.
// Puck runtime + config load qua dynamic import để không cost initial
// bundle khi visitor mới ghé.

import { useEffect, useState, type ComponentType } from "react";
import type { Data } from "@measured/puck";
import { fetchLandingContent, DEFAULT_LANDING } from "@/lib/landing";

interface RendererProps {
  data: Data;
}

export default function LandingBlocks() {
  const [data, setData] = useState<Data | null>(null);
  const [Renderer, setRenderer] = useState<ComponentType<RendererProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fetched = await fetchLandingContent().catch(() => null);
      const finalData = fetched && fetched.content && fetched.content.length > 0 ? fetched : DEFAULT_LANDING;
      const [{ Render }, { puckConfig }] = await Promise.all([
        import("@measured/puck"),
        import("./puckConfig"),
      ]);
      if (cancelled) return;
      const Wrapped: ComponentType<RendererProps> = ({ data: rd }) => <Render config={puckConfig} data={rd} />;
      setRenderer(() => Wrapped);
      setData(finalData);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!data || !Renderer) {
    // Trong lúc chờ Puck load, hiện placeholder skeleton để layout không nhảy
    return <div className="min-h-screen bg-cream" aria-hidden />;
  }

  return <Renderer data={data} />;
}
