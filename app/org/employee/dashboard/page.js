"use client";

import { motion } from "framer-motion";
import {
  ListTodo, AlertTriangle, CheckCircle2, CalendarCheck, Users,
  Clock, ClipboardList, FileText, Wallet, Bell, ChevronRight,
  Sparkles, RefreshCw, Activity
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";
import { useDashboard, useInvalidate } from "@/lib/queries";
import { formatDate } from "@/lib/date";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

export default function MyDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();
  const invalidate = useInvalidate();
  const activeUser = user || { name: "Employee" };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-100">
        <TopBar title="Dashboard" />
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-28 bg-slate-200 rounded-2xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
            </div>
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                <div className="h-40 bg-slate-200 rounded-2xl" />
                <div className="h-32 bg-slate-200 rounded-2xl" />
              </div>
              <div className="space-y-5">
                <div className="h-40 bg-slate-200 rounded-2xl" />
                <div className="h-40 bg-slate-200 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-surface-100">
        <TopBar title="Dashboard" />
        <div className="p-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Unable to load dashboard</p>
            <button onClick={() => invalidate(["dashboard"])} className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition-colors">
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isTeamLead = data.is_team_lead === true;
  const greeting = data.greeting || `Good day, ${activeUser.name}`;
  const myInfo = data.my_info || {};
  const myWork = data.my_work || {};
  const myAttendance = data.my_attendance || {};
  const leaveBalance = myAttendance.leave_balance || {};
  const myTimesheets = data.my_timesheets || {};
  const recentNotifs = data.recent_notifications || [];
  const upcomingHolidays = data.upcoming_holidays || [];
  const teamSummary = data.team_summary || {};
  const pendingApprovals = data.pending_approvals || {};
  const recentActivity = data.recent_activity || [];

  // KPI cards
  const kpiCards = [
    { label: "Tasks Assigned", value: myWork.assigned_to_me ?? 0, icon: ListTodo, color: "blue" },
    { label: "Overdue", value: myWork.overdue ?? 0, icon: AlertTriangle, color: "red" },
    { label: "Done This Week", value: myWork.completed_this_week ?? 0, icon: CheckCircle2, color: "green" },
    { label: "Present Days", value: myAttendance.present_this_month ?? 0, icon: CalendarCheck, color: "emerald" },
  ];
  if (isTeamLead) {
    kpiCards.push({ label: "Team Members", value: teamSummary.total_members ?? 0, icon: Users, color: "indigo" });
    kpiCards.push({ label: "Pending Approvals", value: pendingApprovals.total ?? 0, icon: Clock, color: "amber" });
  }

  const colorMap = {
    blue:    { bg: "bg-blue-50",    icon: "text-blue-600" },
    red:     { bg: "bg-red-50",     icon: "text-red-600" },
    green:   { bg: "bg-green-50",   icon: "text-green-600" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
    indigo:  { bg: "bg-indigo-50",  icon: "text-indigo-600" },
    amber:   { bg: "bg-amber-50",   icon: "text-amber-600" },
  };

  const notiIcons = {
    work_item: "🔧", leave: "🌴", timesheet: "⏱️", attendance: "📅",
    announcement: "📢", document: "📄", payroll: "💰", default: "🔔",
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Dashboard" />

      <div className="p-4 md:p-6 space-y-6">
        {/* ─── Welcome Banner (Premium but original sizing/colors) ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 p-5 md:p-6 text-white shadow-xl shadow-brand-500/20"
        >
          {/* Animated Orbs for premium feel */}
          <motion.div 
            animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[50%] -right-[10%] w-64 h-64 bg-white/5 rounded-full blur-xl pointer-events-none"
          />
          <motion.div 
            animate={{ rotate: -360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[50%] left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium text-blue-100">{data.org_name || ""}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-1">{greeting}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {myInfo.department && (
                <span className="text-[10px] font-bold bg-white/15 border border-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">{myInfo.department}</span>
              )}
              {myInfo.designation && (
                <span className="text-[10px] font-bold bg-white/15 border border-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">{myInfo.designation}</span>
              )}
              {myInfo.employee_id && (
                <span className="text-[10px] font-bold bg-white/15 border border-white/20 px-2.5 py-1 rounded-full backdrop-blur-md">{myInfo.employee_id}</span>
              )}
              {isTeamLead && (
                <span className="text-[10px] font-bold bg-yellow-400/20 border border-yellow-300/30 text-yellow-200 px-2.5 py-1 rounded-full backdrop-blur-md">⭐ Team Lead</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── KPI Cards (Original sizing, new hover effect) ────────────────────────────── */}
        <motion.div
          initial="hidden" animate="visible" variants={stagger}
          className={`grid grid-cols-2 ${isTeamLead ? "lg:grid-cols-6" : "lg:grid-cols-4"} gap-3 md:gap-4`}
        >
          {kpiCards.map((kpi, i) => {
            const Icon = kpi.icon;
            const colors = colorMap[kpi.color];
            return (
              <motion.div
                key={i} variants={fadeUp}
                whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm cursor-default transition-all"
              >
                <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center mb-2.5 shadow-inner`}>
                  <Icon className={`w-[18px] h-[18px] ${colors.icon}`} />
                </div>
                <p className="text-xl font-black text-slate-900">{kpi.value}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{kpi.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── Main Grid ──────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* ── Left Column (2/3) ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* My Work Items */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">My Work Items</h3>
                <Link href="/org/employee/work/my-tasks" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                  View My Tasks <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="h-44 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Assigned', value: myWork.assigned_to_me ?? 0, color: '#3b82f6' },
                    { name: 'Overdue', value: myWork.overdue ?? 0, color: '#ef4444' },
                    { name: 'Done This Week', value: myWork.completed_this_week ?? 0, color: '#22c55e' }
                  ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                      {[{color: '#3b82f6'}, {color: '#ef4444'}, {color: '#22c55e'}].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* My Attendance */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">My Attendance (This Month)</h3>
                <Link href="/org/employee/attendance" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                  View Details <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="h-44 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Present', value: myAttendance.present_this_month ?? 0, color: '#22c55e' },
                    { name: 'Absent', value: myAttendance.absent ?? 0, color: '#ef4444' },
                    { name: 'Late', value: myAttendance.late ?? 0, color: '#f59e0b' }
                  ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                      {[{color: '#22c55e'}, {color: '#ef4444'}, {color: '#f59e0b'}].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Team Summary — Team Lead only */}
            {isTeamLead && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-900">Team Summary</h3>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {teamSummary.total_members ?? 0} members
                    </span>
                  </div>
                  <Link href="/org/employee/work/team-tasks" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                    Team Tasks <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "To Do", value: teamSummary.todo ?? 0, bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-100" },
                    { label: "In Progress", value: teamSummary.in_progress ?? 0, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
                    { label: "Blocked", value: teamSummary.blocked ?? 0, bg: "bg-red-50", text: "text-red-700", border: "border-red-100" },
                    { label: "Done This Week", value: teamSummary.done_this_week ?? 0, bg: "bg-green-50", text: "text-green-700", border: "border-green-100" },
                  ].map((item, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.02 }} className={`${item.bg} ${item.text} border ${item.border} rounded-xl p-3 text-center transition-all hover:shadow-sm cursor-default`}>
                      <p className="text-xl font-black">{item.value}</p>
                      <p className="text-[10px] font-semibold mt-0.5">{item.label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Pending Approvals — Team Lead only */}
            {isTeamLead && (pendingApprovals.total ?? 0) > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Pending Approvals</h3>
                <Link href="/org/employee/work/approve-sheets">
                  <motion.div whileHover={{ scale: 1.01 }} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100/70 transition-colors cursor-pointer group shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{pendingApprovals.timesheets ?? 0} timesheets pending your approval</p>
                      <p className="text-[10px] text-slate-400">Click to review and approve</p>
                    </div>
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">{pendingApprovals.total ?? 0}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                  </motion.div>
                </Link>
              </motion.div>
            )}

            {/* Team Activity — Team Lead only */}
            {isTeamLead && recentActivity.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-500" /> Team Activity
                </h3>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-sm flex-shrink-0 mt-0.5">{notiIcons[item.module] || notiIcons.default}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 leading-snug">{item.description}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right Column (1/3) ─────────────────────────────────── */}
          <div className="space-y-5">

            {/* Leave Balance */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Leave Balance</h3>
                <Link href="/org/employee/leaves/overview" className="text-[10px] font-bold text-brand-600 hover:underline">
                  View Leaves
                </Link>
              </div>
              {Object.keys(leaveBalance).length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-[10px] text-slate-400">No leave types configured</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(leaveBalance).map(([type, remaining]) => {
                    const total = type === "CL" ? 12 : type === "SL" ? 12 : type === "EL" ? 15 : 12;
                    const pct = Math.min(100, ((remaining || 0) / total) * 100);
                    return (
                      <div key={type} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700">{type}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{remaining} remaining</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full transition-all ${pct > 50 ? "bg-green-400" : pct > 25 ? "bg-amber-400" : "bg-red-400"}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Timesheets */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Timesheets</h3>
                <Link href="/org/employee/work/timesheets" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="h-44 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Submitted', value: myTimesheets.submitted_this_week ?? 0, color: '#22c55e' },
                    { name: 'Pending', value: myTimesheets.pending ?? 0, color: '#f59e0b' }
                  ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                      {[{color: '#22c55e'}, {color: '#f59e0b'}].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Recent Notifications */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Notifications</h3>
              {recentNotifs.length === 0 ? (
                <div className="py-4 text-center">
                  <Bell className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400">No recent notifications</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentNotifs.slice(0, 5).map((n, i) => (
                    <motion.div key={i} whileHover={{ x: 2 }} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-default">
                      <span className="text-sm flex-shrink-0">{notiIcons[n.category] || notiIcons.default}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{n.title}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{n.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Upcoming Holidays */}
            {upcomingHolidays.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Upcoming Holidays</h3>
                <div className="space-y-2.5">
                  {upcomingHolidays.map((h, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.02 }} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 transition-transform cursor-default">
                      <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs">🎉</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{h.name}</p>
                      </div>
                      <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                        {formatDate(h.date, { day: "numeric", month: "short" })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Links */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "My Tasks", href: "/org/employee/work/my-tasks", icon: ClipboardList, color: "bg-blue-50 text-blue-600 border-blue-100" },
                  { label: "Leaves", href: "/org/employee/leaves/overview", icon: CalendarCheck, color: "bg-green-50 text-green-600 border-green-100" },
                  { label: "Attendance", href: "/org/employee/attendance", icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-100" },
                  { label: "Timesheets", href: "/org/employee/work/timesheets", icon: ListTodo, color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
                  { label: "Documents", href: "/org/employee/documents/my-docs", icon: FileText, color: "bg-purple-50 text-purple-600 border-purple-100" },
                  { label: "Payslips", href: "/org/employee/payslips", icon: Wallet, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
                ].map((link, i) => {
                  const Icon = link.icon;
                  return (
                    <Link key={i} href={link.href}>
                      <motion.div whileHover={{ scale: 1.05 }} className={`${link.color} rounded-xl p-3 border text-center hover:shadow-md transition-all cursor-pointer`}>
                        <Icon className="w-[18px] h-[18px] mx-auto mb-1.5" />
                        <p className="text-[10px] font-bold">{link.label}</p>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
