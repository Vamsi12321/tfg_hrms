"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

export default function EmployeeLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    // HR/admin trying to access employee routes → send to HR dashboard
    if (user.role === "hr" || user.role === "admin") {
      router.replace("/org/hr/dashboard");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-green-200 border-t-green-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role === "hr" || user.role === "admin") return null;

  return (
    <div className="flex min-h-screen bg-surface-100">
      <Sidebar />
      <main className="flex-1 min-w-0 ml-[260px] transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
