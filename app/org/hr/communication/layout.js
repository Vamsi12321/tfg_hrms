"use client";
import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { Send, FileText, Megaphone, Mail, Settings } from "lucide-react";

const tabs = [
  { label: "Compose",    href: "/org/hr/communication/compose",   icon: Send },
  { label: "Templates",  href: "/org/hr/communication/templates", icon: FileText },
  { label: "Campaigns",  href: "/org/hr/communication/campaigns", icon: Megaphone },
  { label: "Sent / Logs",href: "/org/hr/communication/logs",      icon: Mail },
  { label: "Settings",   href: "/org/hr/communication/settings",  icon: Settings },
];

export default function CommunicationLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-100 flex flex-col">
      <TopBar title="Communication Hub" nav={<TabNav tabs={tabs} />} />
      <div className="p-4 md:p-6 flex-1">
        {children}
      </div>
    </div>
  );
}
