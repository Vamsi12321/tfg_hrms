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
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Leaves" />
      <div className="px-4 md:px-6 pt-4 md:pt-5">
        <TabNav tabs={tabs} />
      </div>
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
