"use client";
import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { UserMinus, BarChart3 } from "lucide-react";

const tabs = [
  { label: "All Exits",  href: "/org/hr/exit/all",     icon: UserMinus },
  { label: "Reports",    href: "/org/hr/exit/reports",  icon: BarChart3 },
];

export default function ExitLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-100 flex flex-col">
      <TopBar title="Exit Management" nav={<TabNav tabs={tabs} />} />
      <div className="p-4 md:p-6 flex-1">
        {children}
      </div>
    </div>
  );
}
