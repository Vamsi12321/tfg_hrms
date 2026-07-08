"use client";

import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { Clock, Settings, CalendarDays, ArrowRight, BarChart3 } from "lucide-react";

const tabs = [
  { label: "Requests",    href: "/org/hr/leaves/requests",    icon: Clock        },
  { label: "Leave Types", href: "/org/hr/leaves/leave-types", icon: Settings     },
  { label: "Holidays",    href: "/org/hr/leaves/holidays",    icon: CalendarDays },
  { label: "Workflow",    href: "/org/hr/leaves/workflow",    icon: ArrowRight   },
  { label: "Reports",     href: "/org/hr/leaves/reports",     icon: BarChart3    },
];

export default function LeavesLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-100 flex flex-col">
      <TopBar title="Leave Management" nav={<TabNav tabs={tabs} />} />
      <div className="p-4 md:p-6 flex-1">
        {children}
      </div>
    </div>
  );
}
