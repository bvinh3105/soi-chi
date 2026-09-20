"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackGuestOrder, fmtVnd, STATUS_LABEL, STATUS_COLOR, STATUS_FLOW, type OrderTrackingResult } from "@/lib/orders";

// Timeline step
const STEP_ICONS: Record<string, string> = {
  pending:       "⏳",
  confirmed:     "✅",
  in_progress:   "🧵",
  quality_check: "🔍",
  ready_to_ship: "📦",
  shipped:       "🚚",
  delivered:     "🏠",
};

function TrackForm() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("order") ?? "");
  const [phone, setPhone] = useState(params.get("phone") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OrderTrackingResult | null>(null);

  // Tự động tra cứu nếu có params trên URL
  useEffect(() => {
    if (params.get("order") && params.get("phone")) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await trackGuestOrder(orderNumber.trim(), phone.trim());
      if (!data) {
        setError("Không tìm thấy đơn hàng. Kiểm tra lại mã đơn và số điện thoại.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Không thể kết nối, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const statusIndex = result ? STATUS_FLOW.indexOf(result.status as typeof STATUS_FLOW[number]) : -1;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-sage-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <img src="/logo.png" alt="Sợi chỉ" className="h-8 w-auto" />
          </Link>
          <span className="text-sage-300">/</span>
          <span className="text-sm text-sage-600">Tra cứu đơn hàng</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Search box */}
        <div className="bg-white rounded-xl border border-sage-100 p-6 shadow-sm">
          <h1 className="text-lg font-display font-semibold text-charcoal mb-1">Tra cứu đơn hàng</h1>
          <p className="text-xs text-sage-500 mb-5">Nhập mã đơn (ví dụ: SC-001, hoặc MM-XXX cho đơn cũ) và số điện thoại đặt hàng.</p>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Mã đơn hàng</label>
                <input
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="SC-001"
                  required
                  className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Số điện thoại</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  type="tel"
                  placeholder="0901 234 567"
                  required
                  className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm"
                />
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-sage-500 text-white rounded-xl font-medium hover:bg-sage-600 transition text-sm disabled:opacity-50"
            >
              {loading ? "Đang tìm kiếm..." : "Tra cứu"}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
          )}
        </div>

        {/* Kết quả */}
        {result && (
          <div className="space-y-4">

            {/* Status badge */}
            <div className="bg-white rounded-xl border border-sage-100 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-sage-500 mb-1">Mã đơn hàng</p>
                  <p className="text-xl font-bold font-mono text-charcoal">{result.orderNumber}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_COLOR[result.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {STATUS_LABEL[result.status] ?? result.status}
                </span>
              </div>

              {/* Timeline */}
              {result.status !== "cancelled" && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    {STATUS_FLOW.map((step, idx) => {
                      const done = idx <= statusIndex;
                      const active = idx === statusIndex;
                      return (
                        <div key={step} className="flex flex-col items-center flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${active ? "bg-sage-500 text-white ring-4 ring-sage-200" : done ? "bg-sage-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                            {done ? (active ? STEP_ICONS[step] : "✓") : STEP_ICONS[step]}
                          </div>
                          {idx < STATUS_FLOW.length - 1 && (
                            <div className={`h-0.5 w-full mt-4 ${idx < statusIndex ? "bg-sage-500" : "bg-gray-200"}`} style={{ position: "absolute", left: "50%", width: "calc(100% - 2rem)" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {STATUS_FLOW.map((step, idx) => (
                      <div key={step} className="flex-1 text-center">
                        <p className={`text-[9px] leading-tight ${idx === statusIndex ? "font-bold text-sage-700" : "text-gray-400"}`}>
                          {STATUS_LABEL[step]?.split(" ")[0]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.status === "cancelled" && (
                <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700 mt-2">
                  Đơn hàng đã bị hủy. Liên hệ Sợi chỉ để được hỗ trợ.
                </div>
              )}
            </div>

            {/* Thông tin đơn */}
            <div className="bg-white rounded-xl border border-sage-100 p-6 shadow-sm">
              <h3 className="font-semibold text-charcoal text-sm mb-4">Thông tin đơn hàng</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-sage-500">Người đặt</span>
                  <span className="font-medium text-charcoal">{result.guestName}</span>
                </div>
                {result.guestAddress && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">Địa chỉ giao</span>
                    <span className="font-medium text-charcoal text-right max-w-[60%]">
                      {[result.guestAddress.street, result.guestAddress.ward, result.guestAddress.district, result.guestAddress.province].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sage-500">Thanh toán</span>
                  <span className="font-medium text-charcoal capitalize">
                    {result.paymentMethod === "cod" ? "💵 COD (nhận hàng trả tiền)" : "🏦 Chuyển khoản"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sage-500">Ngày đặt</span>
                  <span className="font-medium text-charcoal">
                    {new Date(result.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {result.note && (
                  <div className="flex justify-between">
                    <span className="text-sage-500">Ghi chú</span>
                    <span className="font-medium text-charcoal text-right max-w-[60%]">{result.note}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sản phẩm */}
            {result.items.length > 0 && (
              <div className="bg-white rounded-xl border border-sage-100 p-6 shadow-sm">
                <h3 className="font-semibold text-charcoal text-sm mb-4">Sản phẩm đặt ({result.items.length})</h3>
                <div className="space-y-3">
                  {result.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-sage-50 shrink-0 overflow-hidden">
                        {item.image ? <img src={item.image} alt={item.productName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🧵</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal truncate">{item.productName}</p>
                        <p className="text-xs text-sage-500">x{item.quantity} · {fmtVnd(item.unitPrice)}/cái</p>
                      </div>
                      <p className="text-sm font-semibold text-charcoal shrink-0">{fmtVnd(item.unitPrice * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-sage-100 space-y-1.5 text-sm">
                  <div className="flex justify-between text-sage-600">
                    <span>Tạm tính</span>
                    <span>{fmtVnd(result.totalAmount - result.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-sage-600">
                    <span>Phí ship</span>
                    <span>{result.shippingFee === 0 ? "Miễn phí" : fmtVnd(result.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-charcoal pt-1 border-t border-sage-100">
                    <span>Tổng cộng</span>
                    <span className="text-sage-600">{fmtVnd(result.totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Liên hệ */}
            <div className="bg-sage-50 rounded-xl border border-sage-200 p-4 text-center">
              <p className="text-sm text-sage-700 font-medium mb-1">Cần hỗ trợ thêm?</p>
              <p className="text-xs text-sage-500">Nhắn Zalo <span className="font-semibold">0901 234 567</span> hoặc inbox fanpage Sợi chỉ</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense>
      <TrackForm />
    </Suspense>
  );
}
