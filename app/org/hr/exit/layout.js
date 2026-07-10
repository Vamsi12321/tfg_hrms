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
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Exit Management" />
      <div className="px-4 md:px-6 pt-4 md:pt-5">
        <TabNav tabs={tabs} />
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}
