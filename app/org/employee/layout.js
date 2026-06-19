"use client";

import Sidebar from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function EmployeeContent({ children }) {
  const { collapsed } = useSidebar();
  return (
    <div className="flex min-h-screen bg-surface-100">
      <Sidebar />
      <main
        className="flex-1 min-w-0 transition-all duration-300"
        style={{ marginLeft: collapsed ? "72px" : "260px" }}
      >
        {children}
      </main>
    </div>
  );
}

export default function EmployeeLayout({ children }) {
  // TODO: Add auth protection later
  return (
    <SidebarProvider>
      <EmployeeContent>{children}</EmployeeContent>
    </SidebarProvider>
  );
}
