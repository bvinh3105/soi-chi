"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { Puck, type Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { puckConfig } from "@/components/puckConfig";
import { EMPTY_LANDING, fetchLandingContent, saveLandingContent } from "@/lib/landing";
import { useAuth } from "@/lib/auth";

function LandingEditor() {
  const { user } = useAuth();
  const [initial, setInitial] = useState<Data | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLandingContent()
      .then(d => setInitial(d || EMPTY_LANDING))
      .catch(() => setInitial(EMPTY_LANDING));
  }, []);

  async function handlePublish(data: Data) {
    if (!user) {
      setError("Chưa đăng nhập.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveLandingContent(data, user.id);
      setSavedAt(new Date());
    } catch (e: any) {
      setError(e?.message || "Không lưu được. Kiểm tra migration 012.");
    } finally {
      setSaving(false);
    }
  }

  if (!initial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sage-600">Đang tải nội dung...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="hover:underline flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Về admin
          </Link>
          <span className="text-emerald-200">|</span>
          <span className="font-bold">Sửa Landing page</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {saving && <span>Đang lưu...</span>}
          {savedAt && !saving && (
            <span className="text-emerald-100">Đã lưu {savedAt.toLocaleTimeString('vi-VN')}</span>
          )}
          {error && <span className="text-red-100 bg-red-800/50 px-2 py-0.5 rounded">{error}</span>}
          <Link href="/" target="_blank" className="bg-white text-emerald-700 px-3 py-1 rounded font-bold hover:bg-emerald-50">
            Xem trang chủ →
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Puck
          config={puckConfig}
          data={initial}
          onPublish={handlePublish}
        />
      </div>
    </div>
  );
}

export default function LandingEditorPage() {
  return (
    <AdminGuard>
      <LandingEditor />
    </AdminGuard>
  );
}
