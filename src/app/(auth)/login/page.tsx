"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { signIn, user, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sau khi đăng nhập Supabase thành công, chờ profile → redirect
  useEffect(() => {
    if (!loginSuccess || !user) return;
    if (!profile) return;
    if (profile.role === "admin") {
      router.push("/admin");
    } else {
      router.push(redirectTo);
    }
  }, [loginSuccess, user, profile, router, redirectTo]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await signIn(email, password);
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      setLoginSuccess(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sage-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg border border-sage-100 shadow-sm">
        <Link href="/" className="text-sm text-sage-600 hover:text-sage-800 hover:underline transition">&larr; Trang chủ</Link>
        <h1 className="text-2xl font-display font-semibold text-center my-6 text-charcoal">Đăng nhập</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-sage-700">Tài khoản</label>
            <input
              id="email" type="text" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              placeholder="Email hoặc tên đăng nhập"
              className="mt-1 w-full px-3 py-2 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-400 bg-white"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-sage-700">Mật khẩu</label>
              <Link href="/forgot-password" className="text-sm text-sage-600 hover:text-sage-800 hover:underline transition">Quên mật khẩu?</Link>
            </div>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-3 py-2 pr-10 border border-sage-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-400 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 transition"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-sage-500 text-white rounded-md hover:bg-sage-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-sage-500">
          Chưa có tài khoản? <Link href="/register" className="text-sage-700 hover:underline font-medium">Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
