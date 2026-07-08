"use client";
import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { Shield, File, Bell } from "lucide-react";

const tabs = [
  { label:"Company Docs", href:"/org/hr/documents/company",   icon:Shield },
  { label:"Templates",    href:"/org/hr/documents/templates", icon:File   },
  { label:"Doc Requests", href:"/org/hr/documents/requests",  icon:Bell   },
];

export default function DocumentsLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-100 flex flex-col">
      <TopBar title="Documents" nav={<TabNav tabs={tabs} />} />
      <div className="p-4 md:p-6 flex-1">
        {children}
      </div>
    </div>
  );
}
