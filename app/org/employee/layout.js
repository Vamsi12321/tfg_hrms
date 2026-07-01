"use client";

import Sidebar from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useEffect, useState } from "react";

function EmployeeContent({ children }) {
  const { collapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="flex min-h-screen bg-surface-100">
      <Sidebar />
      <main
        className="flex-1 min-w-0 transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : collapsed ? "72px" : "260px" }}
      >
        {children}
      </main>
    </div>
  );
}

export default function EmployeeLayout({ children }) {
  return (
    <SidebarProvider>
      <EmployeeContent>{children}</EmployeeContent>
    </SidebarProvider>
  );
}
