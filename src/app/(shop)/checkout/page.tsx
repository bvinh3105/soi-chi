"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { createGuestOrder, fmtVnd, type GuestInfo } from "@/lib/orders";
import { listProvinces, listDistricts, listWards, type AdminUnit } from "@/lib/vnaddress";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { user, profile } = useAuth();

  const shippingFee = totalPrice >= 500000 ? 0 : 30000;
  const grandTotal = totalPrice + shippingFee;

  const [form, setForm] = useState<GuestInfo>({
    name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    email: user?.email ?? "",
    address: { street: "", ward: "", district: "", province: "" },
    note: "",
    paymentMethod: "cod",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Cascading dropdown state — chỉ giữ CODE ở đây, name lưu thẳng vào form.address
  const [provinces, setProvinces] = useState<AdminUnit[]>([]);
  const [districts, setDistricts] = useState<AdminUnit[]>([]);
  const [wards,     setWards]     = useState<AdminUnit[]>([]);
  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [districtCode, setDistrictCode] = useState<number | null>(null);
  const [addrLoading, setAddrLoading] = useState<'provinces'|'districts'|'wards'|null>('provinces');
  const [addrApiDown, setAddrApiDown] = useState(false); // true = fallback text input

  // Load tỉnh 1 lần khi mount
  useEffect(() => {
    listProvinces()
      .then(list => { setProvinces(list); setAddrLoading(null); })
      .catch(err => {
        console.error('[checkout] listProvinces failed:', err);
        setAddrApiDown(true);
        setAddrLoading(null);
      });
  }, []);

  // Khi đổi tỉnh → load quận, reset quận/phường/wards state
  useEffect(() => {
    if (!provinceCode) return;
    setAddrLoading('districts');
    setDistricts([]); setWards([]); setDistrictCode(null);
    setForm(f => ({ ...f, address: { ...f.address, district: '', ward: '' } }));
    listDistricts(provinceCode)
      .then(list => { setDistricts(list); setAddrLoading(null); })
      .catch(err => { console.error('[checkout] listDistricts failed:', err); setAddrLoading(null); });
  }, [provinceCode]);

  // Khi đổi quận → load phường
  useEffect(() => {
    if (!districtCode) return;
    setAddrLoading('wards');
    setWards([]);
    setForm(f => ({ ...f, address: { ...f.address, ward: '' } }));
    listWards(districtCode)
      .then(list => { setWards(list); setAddrLoading(null); })
      .catch(err => { console.error('[checkout] listWards failed:', err); setAddrLoading(null); });
  }, [districtCode]);

  function set(field: keyof GuestInfo, val: string) {
    setForm(f => ({ ...f, [field]: val }));
  }
  function setAddr(field: "street" | "ward" | "district" | "province", val: string) {
    setForm(f => ({ ...f, address: { ...f.address, [field]: val } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setError("");
    setSubmitting(true);
    try {
      const order = await createGuestOrder(form, items);
      clearCart();
      router.push(`/checkout/success?order=${order.orderNumber}&phone=${encodeURIComponent(form.phone)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🛒</div>
        <h1 className="text-xl font-display font-semibold text-charcoal">Giỏ hàng trống</h1>
        <p className="text-sage-600 text-sm">Hãy thêm sản phẩm trước khi thanh toán.</p>
        <Link href="/" className="mt-2 px-6 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition text-sm font-medium">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <header className="bg-white border-b border-sage-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <img src="/logo.png" alt="Sợi chỉ" className="h-8 w-auto" />
          </Link>
          <span className="text-sage-300">/</span>
          <span className="text-sm text-sage-600">Thanh toán</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ─── Form bên trái ─── */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">

          {/* Thông tin người nhận */}
          <div className="bg-white rounded-xl border border-sage-100 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-charcoal mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-sage-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              Thông tin người nhận
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-sage-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                <input
                  value={form.name} onChange={e => set("name", e.target.value)}
                  required placeholder="Nguyễn Thị Hoa"
                  className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                <input
                  value={form.phone} onChange={e => set("phone", e.target.value)}
                  required type="tel" placeholder="0901 234 567"
                  className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Email <span className="text-sage-400 font-normal">(tuỳ chọn)</span></label>
                <input
                  value={form.email ?? ""} onChange={e => set("email", e.target.value)}
                  type="email" placeholder="email@example.com"
                  className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Địa chỉ giao hàng */}
          <div className="bg-white rounded-xl border border-sage-100 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-charcoal mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-sage-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Địa chỉ giao hàng
            </h2>
            {addrApiDown && (
              <div className="mb-3 p-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded">
                ⚠️ Không tải được danh sách tỉnh/quận từ server. Vui lòng nhập tay — nhớ ghi đúng để giao được hàng.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                {addrApiDown ? (
                  <input
                    value={form.address.province} onChange={e => setAddr("province", e.target.value)}
                    required placeholder="Hà Nội"
                    className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm"
                  />
                ) : (
                  <select
                    value={provinceCode ?? ""}
                    onChange={e => {
                      const code = Number(e.target.value) || null;
                      setProvinceCode(code);
                      const p = provinces.find(x => x.code === code);
                      setAddr("province", p?.name ?? "");
                    }}
                    required
                    disabled={addrLoading === 'provinces'}
                    className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm bg-white disabled:bg-gray-50"
                  >
                    <option value="">{addrLoading === 'provinces' ? '— Đang tải…' : '— Chọn tỉnh/thành —'}</option>
                    {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Quận / Huyện <span className="text-red-500">*</span></label>
                {addrApiDown ? (
                  <input
                    value={form.address.district} onChange={e => setAddr("district", e.target.value)}
                    required placeholder="Hoàn Kiếm"
                    className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm"
                  />
                ) : (
                  <select
                    value={districtCode ?? ""}
                    onChange={e => {
                      const code = Number(e.target.value) || null;
                      setDistrictCode(code);
                      const d = districts.find(x => x.code === code);
                      setAddr("district", d?.name ?? "");
                    }}
                    required
                    disabled={!provinceCode || addrLoading === 'districts'}
                    className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">
                      {!provinceCode        ? '— Chọn tỉnh trước —' :
                       addrLoading === 'districts' ? '— Đang tải…' :
                                                      '— Chọn quận/huyện —'}
                    </option>
                    {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Phường / Xã <span className="text-red-500">*</span></label>
                {addrApiDown ? (
                  <input
                    value={form.address.ward ?? ""} onChange={e => setAddr("ward", e.target.value)}
                    required placeholder="Phường Tràng Tiền"
                    className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm"
                  />
                ) : (
                  <select
                    value={form.address.ward ?? ""}
                    onChange={e => setAddr("ward", e.target.value)}
                    required
                    disabled={!districtCode || addrLoading === 'wards'}
                    className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">
                      {!districtCode        ? '— Chọn quận trước —' :
                       addrLoading === 'wards' ? '— Đang tải…' :
                                                  '— Chọn phường/xã —'}
                    </option>
                    {wards.map(w => <option key={w.code} value={w.name}>{w.name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-700 mb-1">Số nhà, tên đường <span className="text-red-500">*</span></label>
                <input
                  value={form.address.street} onChange={e => setAddr("street", e.target.value)}
                  required placeholder="12 Lý Thường Kiệt"
                  className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="bg-white rounded-xl border border-sage-100 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-charcoal mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-sage-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              {[
                { value: "cod", label: "Thanh toán khi nhận hàng (COD)", desc: "Trả tiền mặt khi shipper giao hàng", icon: "💵" },
                { value: "bank_transfer", label: "Chuyển khoản ngân hàng", desc: "Thông tin tài khoản gửi qua Zalo/email sau khi đặt", icon: "🏦" },
              ].map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${form.paymentMethod === opt.value ? "border-sage-400 bg-sage-50" : "border-sage-100 hover:border-sage-200"}`}>
                  <input
                    type="radio" name="payment" value={opt.value}
                    checked={form.paymentMethod === opt.value}
                    onChange={() => set("paymentMethod", opt.value as "cod" | "bank_transfer")}
                    className="mt-1 accent-sage-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-charcoal">{opt.icon} {opt.label}</div>
                    <div className="text-xs text-sage-500 mt-0.5">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Ghi chú */}
          <div className="bg-white rounded-xl border border-sage-100 p-6 shadow-sm">
            <label className="block text-sm font-medium text-sage-700 mb-2">Ghi chú đơn hàng <span className="text-sage-400 font-normal">(tuỳ chọn)</span></label>
            <textarea
              value={form.note ?? ""} onChange={e => set("note", e.target.value)}
              rows={3} placeholder="Yêu cầu đặc biệt về thêu, màu chỉ, font chữ..."
              className="w-full px-3 py-2.5 border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-400 text-sm resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit" disabled={submitting}
            className="w-full py-3.5 bg-sage-500 text-white rounded-xl font-semibold hover:bg-sage-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Đang xử lý...
              </>
            ) : `Đặt hàng — ${fmtVnd(grandTotal)}`}
          </button>

          <p className="text-center text-xs text-sage-400">
            Bằng cách đặt hàng, bạn đồng ý với chính sách đổi trả của Sợi chỉ.
          </p>
        </form>

        {/* ─── Tóm tắt giỏ hàng bên phải ─── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-sage-100 p-5 shadow-sm sticky top-24">
            <h3 className="font-semibold text-charcoal mb-4 text-sm">Đơn hàng ({items.length} sản phẩm)</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map(item => (
                <div key={item.productId} className="flex gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-sage-50 shrink-0">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-lg">🧵</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">{item.name}</p>
                    <p className="text-xs text-sage-500">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-charcoal shrink-0">{fmtVnd(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-sage-100 space-y-2 text-sm">
              <div className="flex justify-between text-sage-600">
                <span>Tạm tính</span>
                <span>{fmtVnd(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sage-600">
                <span>Phí vận chuyển</span>
                <span className={shippingFee === 0 ? "text-emerald-600 font-medium" : ""}>
                  {shippingFee === 0 ? "Miễn phí" : fmtVnd(shippingFee)}
                </span>
              </div>
              {shippingFee === 0 && (
                <p className="text-xs text-emerald-600">✓ Miễn phí vận chuyển cho đơn từ 500.000đ</p>
              )}
              {shippingFee > 0 && (
                <p className="text-xs text-sage-400">Mua thêm {fmtVnd(500000 - totalPrice)} để miễn phí ship</p>
              )}
              <div className="flex justify-between font-bold text-charcoal pt-2 border-t border-sage-100 text-base">
                <span>Tổng cộng</span>
                <span className="text-sage-600">{fmtVnd(grandTotal)}</span>
              </div>
            </div>

            <Link href="/" className="mt-4 block text-center text-xs text-sage-500 hover:text-sage-700 hover:underline">
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
