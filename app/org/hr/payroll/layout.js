"use client";

import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { Play, IndianRupee, Plus, Settings } from "lucide-react";

const tabs = [
  { label: "Runs",        href: "/org/hr/payroll/runs",        icon: Play         },
  { label: "Payslips",    href: "/org/hr/payroll/payslips",    icon: IndianRupee  },
  { label: "Adjustments", href: "/org/hr/payroll/adjustments", icon: Plus         },
  { label: "Config",      href: "/org/hr/payroll/config",      icon: Settings     },
];

export default function PayrollLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Payroll" />
      <div className="p-4 md:p-6 space-y-6">
        <TabNav tabs={tabs} className="w-fit" />
        {children}
      </div>
    </div>
  );
}
