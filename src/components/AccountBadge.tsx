"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";

function initialsOf(name: string, email: string): string {
  const trimmed = (name || "").trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return (email || "?").charAt(0).toUpperCase();
}

export default function AccountBadge() {
  const { user, profile, loading, signOut, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (loading) {
    return (
      <div className="w-24 h-9 bg-sage-100 rounded-full animate-pulse hidden sm:block" aria-hidden />
    );
  }

  if (!user) {
    return (
      <>
        <Link href="/login" className="text-sm text-sage-700 hover:text-charcoal border border-sage-200 rounded-full px-4 py-2 transition hidden sm:inline-block">
          Đăng nhập
        </Link>
        <Link href="/register" className="text-sm bg-sage-500 text-white rounded-full px-4 py-2 hover:bg-sage-600 transition font-medium hidden sm:inline-block">
          Đăng ký
        </Link>
      </>
    );
  }

  const name = profile?.full_name?.trim() || (user.email?.split("@")[0] ?? "Tài khoản");
  const initials = initialsOf(profile?.full_name || "", user.email ?? "");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-sage-200 hover:border-sage-300 hover:bg-sage-50 transition group"
      >
        <span className="w-7 h-7 rounded-full bg-sage-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
          {initials}
        </span>
        <span className="hidden sm:flex flex-col items-start text-left leading-tight">
          <span className="text-xs font-bold text-charcoal truncate max-w-[140px]">{name}</span>
          <span className="text-[10px] text-sage-500 truncate max-w-[140px]">{user.email}</span>
        </span>
        <svg className={`hidden sm:block w-3 h-3 text-sage-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg border border-sage-100 shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 bg-sage-50 border-b border-sage-100">
            <p className="text-sm font-bold text-charcoal truncate">{name}</p>
            <p className="text-xs text-sage-600 truncate">{user.email}</p>
            {isAdmin && (
              <span className="inline-block mt-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                ADMIN
              </span>
            )}
          </div>
          <div className="py-1">
            <Link
              href="/track"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-sage-700 hover:bg-sage-50 hover:text-charcoal transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Tra cứu đơn hàng
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-sage-700 hover:bg-sage-50 hover:text-charcoal transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Trang quản trị
              </Link>
            )}
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await signOut();
                window.location.reload();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition text-left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
