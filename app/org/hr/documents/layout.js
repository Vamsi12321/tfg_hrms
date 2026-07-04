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
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Documents" />
      <div className="px-4 md:px-6 pt-4 md:pt-5">
        <TabNav tabs={tabs} />
      </div>
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
