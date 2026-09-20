"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { user, loading: authLoading, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50">
        <p className="text-sage-500">Đang tải...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg border border-sage-100 shadow-sm text-center">
          <h1 className="text-2xl font-display font-semibold text-charcoal mb-2">Link không hợp lệ</h1>
          <p className="text-sage-600 mb-6">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
          <Link href="/forgot-password" className="inline-block py-2 px-6 bg-sage-500 text-white rounded-md hover:bg-sage-600 transition font-medium">
            Yêu cầu link mới
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg border border-sage-100 shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sage-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-semibold text-charcoal mb-2">Đã đổi mật khẩu</h1>
          <p className="text-sage-600">Đang chuyển đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sage-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg border border-sage-100 shadow-sm">
        <h1 className="text-2xl font-display font-semibold text-center my-6 text-charcoal">Đặt mật khẩu mới</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-sage-700">Mật khẩu mới</label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="mt-1 w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-400 bg-white"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-sage-700">Nhập lại mật khẩu mới</label>
            <input
              id="confirmPassword" type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
              className="mt-1 w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-400 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-sage-500 text-white rounded-md hover:bg-sage-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang lưu..." : "Đặt mật khẩu mới"}
          </button>
        </form>
      </div>
    </div>
  );
}
