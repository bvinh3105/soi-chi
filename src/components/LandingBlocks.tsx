"use client";

// ============================================================
// LandingBlocks — render Puck blocks trên trang chủ shop
// ============================================================
// Fetch client-side khi mount. Nếu DB rỗng → không render gì (trang
// chủ giữ layout gốc). Nếu có content → dynamic import Puck's Render
// (giữ trang chủ không phải ship Puck runtime 90KB cho visitor thường).

import { useEffect, useState, type ComponentType } from "react";
import type { Data } from "@measured/puck";
import { fetchLandingContent } from "@/lib/landing";

interface RendererProps {
  data: Data;
}

export default function LandingBlocks() {
  const [data, setData] = useState<Data | null>(null);
  const [Renderer, setRenderer] = useState<ComponentType<RendererProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLandingContent().then(async d => {
      if (cancelled) return;
      if (!d?.content || d.content.length === 0) {
        setData(d);
        return;
      }
      const [{ Render }, { puckConfig }] = await Promise.all([
        import("@measured/puck"),
        import("./puckConfig"),
      ]);
      if (cancelled) return;
      const Wrapped: ComponentType<RendererProps> = ({ data: rd }) => <Render config={puckConfig} data={rd} />;
      setRenderer(() => Wrapped);
      setData(d);
    });
    return () => { cancelled = true; };
  }, []);

  if (!data || !data.content || data.content.length === 0 || !Renderer) return null;
  return <Renderer data={data} />;
}
