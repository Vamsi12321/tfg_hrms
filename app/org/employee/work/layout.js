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
    <div className="min-h-screen bg-surface-100 flex flex-col">
      <TopBar title={isTeamLead ? "Work Management (Team Lead)" : "My Work"} nav={<TabNav tabs={tabs} />} />
      <div className="p-4 md:p-6 flex-1">
        {children}
      </div>
    </div>
  );
}
