"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { getSupabaseSafe } from "./supabase";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: { full_name?: string; phone?: string; avatar_url?: string }) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from profiles table
  async function fetchProfile(userId: string) {
    const sb = getSupabaseSafe();
    if (!sb) return;
    const { data } = await sb
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  }

  useEffect(() => {
    const sb = getSupabaseSafe();
    if (!sb) {
      // Supabase chưa config → bỏ qua auth, app vẫn chạy bình thường
      setLoading(false);
      return;
    }

    // Get initial session
    sb.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) fetchProfile(s.user.id);
      })
      .catch(() => {
        // Supabase unreachable — bỏ qua, vẫn cho dùng mã nội bộ
      })
      .finally(() => setLoading(false));

    // Listen for auth changes
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const result = sb.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }
      });
      subscription = result.data.subscription;
    } catch {
      // Supabase unreachable — bỏ qua
    }

    return () => subscription?.unsubscribe();
  }, []);

  async function signUp(email: string, password: string, fullName: string) {
    const sb = getSupabaseSafe();
    if (!sb) return { error: "Chức năng đăng ký tài khoản đang được cập nhật. Vui lòng thử lại sau." };
    try {
      const { error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      return { error: error?.message ?? null };
    } catch {
      return { error: "Không thể kết nối server. Vui lòng thử lại sau." };
    }
  }

  async function signIn(email: string, password: string) {
    const sb = getSupabaseSafe();
    if (!sb) return { error: "Chức năng đăng nhập tài khoản đang được cập nhật. Vui lòng thử lại sau." };
    try {
      const { error } = await sb.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message ?? null };
    } catch {
      return { error: "Không thể kết nối server. Vui lòng thử lại sau." };
    }
  }

  async function resetPassword(email: string) {
    const sb = getSupabaseSafe();
    if (!sb) return { error: "Chức năng đặt lại mật khẩu đang được cập nhật. Vui lòng thử lại sau." };
    try {
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error: error?.message ?? null };
    } catch {
      return { error: "Không thể kết nối server. Vui lòng thử lại sau." };
    }
  }

  async function updatePassword(password: string) {
    const sb = getSupabaseSafe();
    if (!sb) return { error: "Chức năng đặt lại mật khẩu đang được cập nhật. Vui lòng thử lại sau." };
    try {
      const { error } = await sb.auth.updateUser({ password });
      return { error: error?.message ?? null };
    } catch {
      return { error: "Không thể kết nối server. Vui lòng thử lại sau." };
    }
  }

  async function updateProfile(updates: { full_name?: string; phone?: string; avatar_url?: string }) {
    const sb = getSupabaseSafe();
    if (!sb || !user) return { error: "Chưa đăng nhập." };
    try {
      const client = sb as unknown as { from: (t: string) => any };
      const { data, error } = await client
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();
      if (error) return { error: error.message };
      if (data) setProfile(data as Profile);
      return { error: null };
    } catch {
      return { error: "Không thể kết nối server. Vui lòng thử lại sau." };
    }
  }

  async function signOut() {
    const sb = getSupabaseSafe();
    if (sb) {
      try {
        await sb.auth.signOut();
      } catch {
        // Supabase unreachable — vẫn clear local state
      }
    }
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAdmin: profile?.role === "admin",
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
