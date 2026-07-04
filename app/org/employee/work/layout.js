"use client";
import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { ListTodo, Clock, MessageSquare, Users, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function EmpWorkLayout({ children }) {
  const { user } = useAuth();
  const isTeamLead = user?.is_team_lead === true;

  const tabs = [
    { label: "My Tasks",       href: "/org/employee/work/my-tasks",       icon: ListTodo      },
    { label: "Timesheets",     href: "/org/employee/work/timesheets",     icon: Clock         },
    { label: "Daily Updates",  href: "/org/employee/work/daily-updates",  icon: MessageSquare },
    // Team Lead extra tabs
    ...(isTeamLead ? [
      { label: "Team Tasks",      href: "/org/employee/work/team-tasks",      icon: Users         },
      { label: "Team Updates",    href: "/org/employee/work/team-updates",    icon: MessageSquare },
      { label: "Approve Sheets",  href: "/org/employee/work/team-timesheets", icon: CheckCircle2  },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title={isTeamLead ? "Work Management (Team Lead)" : "My Work"} />
      <div className="px-4 md:px-6 pt-4 md:pt-5">
        <TabNav tabs={tabs} />
      </div>
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
