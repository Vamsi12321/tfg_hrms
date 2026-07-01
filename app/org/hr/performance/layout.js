"use client";
import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { Target, RefreshCw, Star, Award, BarChart3 } from "lucide-react";

const tabs = [
  { label:"OKRs",        href:"/org/hr/performance/okrs",        icon:Target   },
  { label:"Cycles",      href:"/org/hr/performance/cycles",      icon:RefreshCw},
  { label:"Reviews",     href:"/org/hr/performance/reviews",     icon:Star     },
  { label:"Leaderboard", href:"/org/hr/performance/leaderboard", icon:Award    },
  { label:"Analytics",   href:"/org/hr/performance/analytics",   icon:BarChart3},
];

export default function PerformanceLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Performance & OKRs" />
      <div className="p-4 md:p-6 space-y-6">
        <TabNav tabs={tabs} className="w-fit" />
        {children}
      </div>
    </div>
  );
}
