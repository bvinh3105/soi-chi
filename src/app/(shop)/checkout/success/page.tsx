"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const orderNumber = params.get("order") ?? "";
  const phone = params.get("phone") ?? "";

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-sage-100 shadow-sm p-10 max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-display font-bold text-charcoal mb-2">Đặt hàng thành công!</h1>
        <p className="text-sage-600 text-sm mb-6">
          Sợi chỉ đã nhận được đơn của bạn và sẽ xác nhận sớm nhất có thể.
        </p>

        {/* Mã đơn */}
        <div className="bg-sage-50 rounded-xl p-4 mb-6">
          <p className="text-xs text-sage-500 mb-1">Mã đơn hàng</p>
          <p className="text-2xl font-bold font-mono text-sage-700 tracking-wider">{orderNumber}</p>
          <p className="text-xs text-sage-400 mt-2">Lưu mã này để theo dõi đơn hàng</p>
        </div>

        {/* Thông tin */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-bold text-blue-700 mb-2">📱 Chúng tôi sẽ liên hệ bạn qua:</p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Zalo / Điện thoại để xác nhận đơn</li>
            <li>• Gửi thông tin thanh toán (nếu chuyển khoản)</li>
            <li>• Cập nhật tiến độ thêu</li>
          </ul>
        </div>

        {/* Nút actions */}
        <div className="space-y-3">
          {orderNumber && phone && (
            <Link
              href={`/track?order=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`}
              className="block w-full py-3 bg-sage-500 text-white rounded-xl font-medium hover:bg-sage-600 transition text-sm"
            >
              Theo dõi đơn hàng →
            </Link>
          )}
          <Link
            href="/"
            className="block w-full py-3 border border-sage-200 text-sage-700 rounded-xl font-medium hover:bg-sage-50 transition text-sm"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
