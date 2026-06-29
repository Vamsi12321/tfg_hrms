"use client";

import { AuthProvider } from "@/context/AuthContext";
import QueryProvider from "@/components/QueryProvider";

export default function Providers({ children }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
