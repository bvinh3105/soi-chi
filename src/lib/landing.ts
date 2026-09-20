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
