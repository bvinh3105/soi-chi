"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await resetPassword(email);
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg border border-sage-100 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sage-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-semibold text-charcoal mb-2">Đã gửi email</h1>
          <p className="text-sage-600 mb-6">Kiểm tra hộp thư <strong>{email}</strong> để lấy link đặt lại mật khẩu.</p>
          <Link href="/login" className="inline-block py-2 px-6 bg-sage-500 text-white rounded-md hover:bg-sage-600 transition font-medium">
            Về trang đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sage-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg border border-sage-100 shadow-sm">
        <Link href="/login" className="text-sm text-sage-600 hover:text-sage-800 hover:underline transition">&larr; Đăng nhập</Link>
        <h1 className="text-2xl font-display font-semibold text-center my-6 text-charcoal">Quên mật khẩu</h1>
        <p className="text-sm text-sage-600 mb-4 text-center">Nhập email tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-sage-700">Email</label>
            <input
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              className="mt-1 w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-400 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-sage-500 text-white rounded-md hover:bg-sage-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang gửi..." : "Gửi link đặt lại"}
          </button>
        </form>
      </div>
    </div>
  );
}
