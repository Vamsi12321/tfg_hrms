"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

export default function HRLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    // Only hr and admin can access /hr/* routes
    if (user.role !== "hr" && user.role !== "admin") {
      router.replace("/employee/dashboard");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "hr" && user.role !== "admin")) return null;

  return (
    <div className="flex min-h-screen bg-surface-100">
      <Sidebar />
      <main className="flex-1 min-w-0 ml-[260px] transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
