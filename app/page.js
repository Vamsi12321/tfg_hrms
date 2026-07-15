"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDefaultRoute } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't wait for loading if no user cached — redirect immediately
    if (!loading) {
      if (user) {
        router.replace(getDefaultRoute(user.role));
      } else {
        router.replace("/login");
      }
    } else {
      // If loading takes too long (backend down), force redirect to login after 3s
      const timeout = setTimeout(() => {
        if (!user) router.replace("/login");
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading TFG HRMS...</p>
      </div>
    </div>
  );
}
