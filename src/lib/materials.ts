// ============================================================
// Raw Materials — quản lý nguyên liệu + nhập/xuất kho
// ============================================================
// - `raw_materials`: từng loại nguyên liệu (name, unit, min_stock)
// - `material_receipts`: log mọi thay đổi tồn kho (signed quantity)
// - Tồn kho hiện tại = SUM(receipts.quantity) — tính ở client
//   để đơn giản. Nếu về sau số receipt > 10K/nguyên liệu thì chuyển
//   sang materialized view hoặc RPC ở DB.

import { getSupabase } from "./supabase";

export type MaterialKind = "in" | "out" | "adjust";

export interface RawMaterial {
  id: string;
  name: string;
  category: string;
  unit: string;
  min_stock: number;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialReceipt {
  id: string;
  material_id: string;
  quantity: number;
  unit_price: number | null;
  kind: MaterialKind;
  supplier: string;
  receipt_date: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

// Enriched: material + computed current stock + last receipt info
export interface MaterialWithStock extends RawMaterial {
  current_stock: number;
  last_receipt_date: string | null;
  last_supplier: string | null;
  avg_unit_price: number | null; // weighted avg giá nhập (in only)
  total_in_qty: number;          // tổng lượng đã nhập (cho stats)
  is_low: boolean;               // current_stock < min_stock
}

const KIND_LABELS: Record<MaterialKind, string> = {
  in: "Nhập kho",
  out: "Xuất kho",
  adjust: "Điều chỉnh",
};
export function kindLabel(k: MaterialKind): string {
  return KIND_LABELS[k];
}

// ─── Fetch ────────────────────────────────────────────────
export async function fetchMaterials(): Promise<RawMaterial[]> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  const { data, error } = await client
    .from("raw_materials")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as RawMaterial[];
}

export async function fetchReceipts(materialId?: string, limit = 200): Promise<MaterialReceipt[]> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  let q = client
    .from("material_receipts")
    .select("*")
    .order("receipt_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (materialId) q = q.eq("material_id", materialId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as MaterialReceipt[];
}

// Tính tồn kho hiện tại + avg price cho từng nguyên liệu.
export function computeStocks(materials: RawMaterial[], receipts: MaterialReceipt[]): MaterialWithStock[] {
  const byMat: Record<string, MaterialReceipt[]> = {};
  for (const r of receipts) {
    (byMat[r.material_id] ||= []).push(r);
  }
  return materials.map(m => {
    const rs = byMat[m.id] ?? [];
    const sum = rs.reduce((s, r) => s + Number(r.quantity || 0), 0);
    // Weighted avg giá đơn vị — chỉ tính receipt kind='in' có unit_price
    let inQty = 0, inCost = 0;
    for (const r of rs) {
      if (r.kind === "in" && r.unit_price != null && r.quantity > 0) {
        inQty += Number(r.quantity);
        inCost += Number(r.quantity) * Number(r.unit_price);
      }
    }
    const avg = inQty > 0 ? inCost / inQty : null;
    // Last receipt (rs is sorted desc từ fetchReceipts)
    const last = rs[0];
    return {
      ...m,
      current_stock: Number(sum.toFixed(3)),
      avg_unit_price: avg,
      total_in_qty: inQty,
      last_receipt_date: last?.receipt_date ?? null,
      last_supplier: last?.supplier ?? null,
      is_low: sum <= Number(m.min_stock || 0) && Number(m.min_stock || 0) > 0,
    };
  });
}

// ─── CRUD material ────────────────────────────────────────
export async function createMaterial(input: Omit<RawMaterial, "id" | "created_at" | "updated_at" | "is_active"> & { is_active?: boolean }): Promise<RawMaterial> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  const { data, error } = await client
    .from("raw_materials")
    .insert({
      name: input.name,
      category: input.category ?? "",
      unit: input.unit ?? "chiếc",
      min_stock: input.min_stock ?? 0,
      notes: input.notes ?? "",
      is_active: input.is_active ?? true,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RawMaterial;
}

export async function updateMaterial(id: string, patch: Partial<Omit<RawMaterial, "id" | "created_at" | "updated_at">>): Promise<RawMaterial> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  const { data, error } = await client
    .from("raw_materials")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RawMaterial;
}

// Soft delete — is_active=false. Không xóa hẳn để giữ lịch sử receipts.
export async function archiveMaterial(id: string): Promise<void> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  const { error } = await client
    .from("raw_materials")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Receipt (nhập/xuất/điều chỉnh) ──────────────────────
export interface ReceiptInput {
  material_id: string;
  quantity: number;        // absolute value from UI; sign derived below
  kind: MaterialKind;
  unit_price?: number | null;
  supplier?: string;
  receipt_date?: string;   // YYYY-MM-DD
  note?: string;
  adjust_sign?: "up" | "down"; // only used when kind='adjust'
}

export async function createReceipt(input: ReceiptInput, createdBy?: string): Promise<MaterialReceipt> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  const absQty = Math.abs(Number(input.quantity));
  let signedQty: number;
  if (input.kind === "in") signedQty = absQty;
  else if (input.kind === "out") signedQty = -absQty;
  else signedQty = input.adjust_sign === "down" ? -absQty : absQty;

  const { data, error } = await client
    .from("material_receipts")
    .insert({
      material_id: input.material_id,
      quantity: signedQty,
      unit_price: input.kind === "in" ? (input.unit_price ?? null) : null,
      kind: input.kind,
      supplier: input.kind === "in" ? (input.supplier ?? "") : "",
      receipt_date: input.receipt_date ?? new Date().toISOString().slice(0, 10),
      note: input.note ?? "",
      created_by: createdBy ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MaterialReceipt;
}

export async function deleteReceipt(id: string): Promise<void> {
  const client = getSupabase() as unknown as { from: (t: string) => any };
  const { error } = await client.from("material_receipts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
