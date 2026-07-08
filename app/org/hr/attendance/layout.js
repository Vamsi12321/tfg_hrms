"use client";

import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { Calendar, BarChart3, MapPin, Clock, Settings } from "lucide-react";

const tabs = [
  { label: "Daily View",       href: "/org/hr/attendance/daily",           icon: Calendar  },
  { label: "Summary",          href: "/org/hr/attendance/summary",         icon: BarChart3 },
  { label: "Locations",        href: "/org/hr/attendance/locations",       icon: MapPin    },
  { label: "Regularizations",  href: "/org/hr/attendance/regularizations", icon: Clock     },
  { label: "Config",           href: "/org/hr/attendance/config",          icon: Settings  },
  { label: "Reports",          href: "/org/hr/attendance/reports",         icon: BarChart3 },
];

export default function AttendanceLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-100 flex flex-col">
      <TopBar title="Attendance Management" nav={<TabNav tabs={tabs} />} />
      <div className="p-4 md:p-6 flex-1">
        {children}
      </div>
    </div>
  );
}
