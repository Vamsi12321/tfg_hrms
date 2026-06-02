"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDefaultRoute } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(getDefaultRoute(user.role));
    } else {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Show spinner while deciding
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading TFG HRMS...</p>
      </div>
    </div>
  );
}
