"use client";
import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { Bell, FileText, Shield, File } from "lucide-react";

const tabs = [
  { label:"HR Requests",  href:"/org/employee/documents/requests",  icon:Bell     },
  { label:"My Uploads",   href:"/org/employee/documents/my-docs",   icon:FileText },
  { label:"Company Docs", href:"/org/employee/documents/company",   icon:Shield   },
  { label:"Templates",    href:"/org/employee/documents/templates", icon:File     },
];

export default function EmpDocumentsLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Documents" />
      <div className="p-4 md:p-6 space-y-6">
        <TabNav tabs={tabs} className="w-fit" />
        {children}
      </div>
    </div>
  );
}
