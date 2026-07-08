"use client";
import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { Clock, CalendarDays } from "lucide-react";

const tabs = [
  { label:"Balance & Leaves",  href:"/org/employee/leaves/overview",  icon:Clock        },
  { label:"Holiday Calendar",  href:"/org/employee/leaves/calendar",  icon:CalendarDays },
];

export default function EmpLeavesLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-100 flex flex-col">
      <TopBar title="My Leaves" nav={<TabNav tabs={tabs} />} />
      <div className="p-4 md:p-6 flex-1">
        {children}
      </div>
    </div>
  );
}
