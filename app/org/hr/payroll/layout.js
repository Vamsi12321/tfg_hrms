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
    <div className="min-h-screen bg-surface-100 flex flex-col">
      <TopBar title="Payroll" nav={<TabNav tabs={tabs} />} />
      <div className="p-4 md:p-6 flex-1">
        {children}
      </div>
    </div>
  );
}
