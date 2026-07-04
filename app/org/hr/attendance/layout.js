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
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Attendance Management" />
      <div className="px-4 md:px-6 pt-4 md:pt-5">
        <TabNav tabs={tabs} />
      </div>
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
