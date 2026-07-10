"use client";
import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { Package, BarChart3, Tag } from "lucide-react";

const tabs = [
  { label: "All Assets",  href: "/org/hr/assets/all",        icon: Package  },
  { label: "Categories",  href: "/org/hr/assets/categories",  icon: Tag      },
  { label: "Reports",     href: "/org/hr/assets/reports",     icon: BarChart3},
];

export default function AssetsLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Asset Management" />
      <div className="px-4 md:px-6 pt-4 md:pt-5">
        <TabNav tabs={tabs} />
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}
