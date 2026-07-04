"use client";
import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { FolderKanban, ListTodo, Clock, MessageSquare } from "lucide-react";

const tabs = [
  { label: "Projects",       href: "/org/hr/work/projects",       icon: FolderKanban  },
  { label: "Work Items",     href: "/org/hr/work/work-items",     icon: ListTodo      },
  { label: "Timesheets",     href: "/org/hr/work/timesheets",     icon: Clock         },
  { label: "Daily Updates",  href: "/org/hr/work/daily-updates",  icon: MessageSquare },
];

export default function WorkLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Work Management" />
      <div className="px-4 md:px-6 pt-4 md:pt-5">
        <TabNav tabs={tabs} />
      </div>
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
