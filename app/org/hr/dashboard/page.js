"use client";

import { motion } from "framer-motion";
import {
  Users, CalendarCheck, Clock, Wallet, Brain, TrendingUp,
  AlertTriangle, Sparkles, CheckCircle2, XCircle, Bell,
  ChevronRight, Activity, Heart, ClipboardList, ListTodo,
  RefreshCw, Cake, ArrowUpRight
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";
import { useDashboard, useInvalidate } from "@/lib/queries";
import { formatDate, timeAgo } from "@/lib/date";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from "recharts";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();
  const invalidate = useInvalidate();
  const activeUser = user || { name: "Admin" };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-100">
        <TopBar title="Dashboard" />
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-slate-200 rounded-2xl" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-56 bg-slate-200 rounded-2xl" />
                <div className="h-40 bg-slate-200 rounded-2xl" />
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-slate-200 rounded-2xl" />
                <div className="h-48 bg-slate-200 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !data) {
    return (
      <div className="min-h-screen bg-surface-100">
        <TopBar title="Dashboard" />
        <div className="p-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Unable to load dashboard</p>
            <p className="text-xs text-slate-400 mt-1">Please try again later</p>
            <button onClick={() => invalidate(["dashboard"])} className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition-colors">
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kpis = data.kpis || {};
  const attendance = data.attendance_today || {};
  const attendanceTrend = data.attendance_trend || [];
  const headcountGrowth = data.headcount_growth || [];
  const pendingActions = data.pending_actions || [];
  const recentActivity = data.recent_activity || [];
  const workSummary = data.work_summary || {};
  const upcoming = data.upcoming_holidays || data.upcoming || [];
  const upcomingBirthdays = data.upcoming_birthdays || [];
  const aiAlerts = data.ai_alerts || [];
  const greeting = data.greeting || `Good day, ${activeUser.name}`;

  // KPI cards config
  const kpiCards = [
    { label: "Total Employees", value: kpis.total_employees ?? 0, icon: Users, color: "blue", sub: `${kpis.active_today ?? 0} active today` },
    { label: "Present Today", value: kpis.active_today ?? 0, icon: CalendarCheck, color: "green", sub: `${kpis.on_leave_today ?? 0} on leave` },
    { label: "Pending Approvals", value: kpis.pending_approvals ?? 0, icon: Bell, color: "amber", sub: "leave, timesheets" },
    { label: "Open Work Items", value: kpis.open_work_items ?? 0, icon: ListTodo, color: "indigo", sub: `${kpis.overdue_items ?? 0} overdue` },
    { label: "Payroll (Net)", value: kpis.this_month_payroll ? `₹${(kpis.this_month_payroll / 1000).toFixed(0)}K` : "₹0", icon: Wallet, color: "emerald", sub: "this month" },
    { label: "Wellness Score", value: kpis.wellness_score ? `${kpis.wellness_score}/5` : "—", icon: Heart, color: "pink", sub: "avg mood" },
  ];

  const colorMap = {
    blue:    { bg: "bg-blue-50",    icon: "text-blue-600" },
    green:   { bg: "bg-green-50",   icon: "text-green-600" },
    amber:   { bg: "bg-amber-50",   icon: "text-amber-600" },
    indigo:  { bg: "bg-indigo-50",  icon: "text-indigo-600" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
    pink:    { bg: "bg-pink-50",    icon: "text-pink-600" },
  };

  const moduleIcons = {
    leave: "🌴", attendance: "📅", work: "🔧", timesheet: "⏱️", payroll: "💰",
    team: "👥", announcement: "📢", document: "📄", employee: "👤",
    wellness: "💚", holiday: "🎉", auth: "🔐", default: "📋",
  };

  // Format attendance trend for chart
  const chartData = attendanceTrend.map(d => ({
    date: d.date.slice(5), // "07-01"
    present: d.present,
    absent: d.absent,
    late: d.late,
  }));

  // Format headcount growth for chart
  const headcountData = headcountGrowth.map(d => ({
    month: d.month.replace(" 2026", "").replace(" 2025", ""),
    count: d.count,
  }));

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Dashboard" />

      <div className="p-4 md:p-6 space-y-6">
        {/* ─── Welcome Banner ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 p-5 md:p-6 text-white shadow-xl shadow-brand-500/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium text-blue-100">{data.org_name || ""}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-1">{greeting}</h2>
            <p className="text-blue-100 text-sm max-w-lg">
              {pendingActions.length > 0
                ? `You have ${pendingActions.reduce((s, a) => s + (a.count || 0), 0)} pending actions. Here's your organization overview.`
                : "All caught up! Here's your organization overview."
              }
            </p>
          </div>
        </motion.div>

        {/* ─── KPI Cards ──────────────────────────────────────────── */}
        <motion.div
          initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4"
        >
          {kpiCards.map((kpi, i) => {
            const Icon = kpi.icon;
            const colors = colorMap[kpi.color];
            return (
              <motion.div
                key={i} variants={fadeUp}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group flex items-center justify-between"
              >
                <div>
                  <p className="text-2xl font-black text-slate-900 leading-none">{kpi.value}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1.5">{kpi.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.bg}`}>
                  <Icon className={`w-5 h-5 ${colors.icon} group-hover:scale-110 transition-transform`} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── Main Grid ──────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* ── Left Column (2/3) ──────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Attendance Trend Chart */}
            {chartData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Attendance Trend</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Last 7 days overview</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-slate-500 font-medium">Present</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="text-[10px] text-slate-500 font-medium">Absent</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="text-[10px] text-slate-500 font-medium">Late</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }}
                      labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                    />
                    <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2.5} fill="url(#gradPresent)" />
                    <Area type="monotone" dataKey="absent" stroke="#f87171" strokeWidth={2} fill="url(#gradAbsent)" />
                    <Area type="monotone" dataKey="late" stroke="#fbbf24" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Headcount Growth */}
            {headcountData.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Headcount Growth</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Team size over last 6 months</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {headcountData.length > 1 && headcountData[headcountData.length - 1].count > 0
                      ? `${headcountData[headcountData.length - 1].count} now`
                      : ""}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={headcountData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Attendance Today */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Today's Attendance</h3>
                <Link href="/org/hr/attendance/daily" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "Present", value: attendance.present ?? 0, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
                  { label: "Absent", value: attendance.absent ?? 0, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
                  { label: "Late", value: attendance.late ?? 0, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
                  { label: "On Leave", value: attendance.on_leave ?? 0, icon: CalendarCheck, color: "text-blue-500", bg: "bg-blue-50" },
                  { label: "Total", value: attendance.total ?? 0, icon: Users, color: "text-slate-500", bg: "bg-slate-50" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className={`${item.bg} rounded-xl p-3 text-center border border-transparent hover:border-black/5 hover:shadow-sm hover:-translate-y-0.5 transition-all`}>
                      <Icon className={`w-4 h-4 ${item.color} mx-auto mb-1`} />
                      <p className="text-lg font-black text-slate-900">{item.value}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Work Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Work Items Summary</h3>
                <Link href="/org/hr/work/work-items" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "To Do", value: workSummary.todo ?? 0, bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
                  { label: "In Progress", value: workSummary.in_progress ?? 0, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
                  { label: "Blocked", value: workSummary.blocked ?? 0, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
                  { label: "Done This Week", value: workSummary.done_this_week ?? 0, bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} ${item.text} border ${item.border} rounded-xl p-3 text-center hover:shadow-sm hover:-translate-y-0.5 transition-all`}>
                    <p className="text-xl font-black">{item.value}</p>
                    <p className="text-[10px] font-semibold mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Pending Actions */}
            {pendingActions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Pending Actions</h3>
                <div className="space-y-2">
                  {pendingActions.map((action, i) => (
                    <Link key={i} href={action.href || "#"}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100 hover:bg-amber-50 transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800">{action.label}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{action.type}</p>
                        </div>
                        <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">{action.count}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI Alerts — only show if non-empty */}
            {aiAlerts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">AI Alerts</h3>
                </div>
                <div className="space-y-2">
                  {aiAlerts.map((alert, i) => (
                    <Link key={i} href={alert.href || "/org/hr/ai-insights"}>
                      <div className={`p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${
                        alert.severity === "critical" ? "bg-red-50/50 border-red-100" :
                        alert.severity === "warning" ? "bg-amber-50/50 border-amber-100" :
                        "bg-blue-50/50 border-blue-100"
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            alert.severity === "critical" ? "bg-red-100" :
                            alert.severity === "warning" ? "bg-amber-100" : "bg-blue-100"
                          }`}>
                            {alert.severity === "critical" && <AlertTriangle className="w-3 h-3 text-red-600" />}
                            {alert.severity === "warning" && <Activity className="w-3 h-3 text-amber-600" />}
                            {alert.severity !== "critical" && alert.severity !== "warning" && <Sparkles className="w-3 h-3 text-blue-600" />}
                          </div>
                          <p className="text-xs font-semibold text-slate-800 flex-1">{alert.title}</p>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right Column (1/3) ─────────────────────────────────── */}
          <div className="space-y-5">

            {/* Upcoming Holidays */}
            {upcoming.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Upcoming Holidays</h3>
                <div className="space-y-2.5">
                  {upcoming.map((event, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-100">
                        <span className="text-sm">🎉</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{event.name || event.label}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(event.date)}</p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
                        holiday
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Upcoming Birthdays — only show if non-empty */}
            {upcomingBirthdays.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Cake className="w-4 h-4 text-pink-500" />
                  <h3 className="text-sm font-bold text-slate-900">Upcoming Birthdays</h3>
                </div>
                <div className="space-y-2.5">
                  {upcomingBirthdays.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-pink-50/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-[10px] font-bold">
                        {(b.name || "?").split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{b.name}</p>
                        <p className="text-[10px] text-slate-400">{b.department || ""}</p>
                      </div>
                      <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded-full border border-pink-100">
                        {formatDate(b.date, { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
                <Link href="/org/hr/logs" className="text-[10px] font-bold text-brand-600 hover:underline">
                  View Logs
                </Link>
              </div>
              {recentActivity.length === 0 ? (
                <div className="py-6 text-center">
                  <Activity className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto hide-scrollbar">
                  {recentActivity.slice(0, 8).map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-sm flex-shrink-0 mt-0.5">{moduleIcons[item.module] || moduleIcons.default}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 leading-snug">{item.description}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{item.time || timeAgo(item.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Links */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Employees", href: "/org/hr/employees", icon: Users, color: "bg-blue-50 text-blue-600" },
                  { label: "Leaves", href: "/org/hr/leaves/requests", icon: CalendarCheck, color: "bg-green-50 text-green-600" },
                  { label: "Attendance", href: "/org/hr/attendance/daily", icon: Clock, color: "bg-amber-50 text-amber-600" },
                  { label: "Payroll", href: "/org/hr/payroll/runs", icon: Wallet, color: "bg-emerald-50 text-emerald-600" },
                  { label: "Work Items", href: "/org/hr/work/work-items", icon: ClipboardList, color: "bg-indigo-50 text-indigo-600" },
                  { label: "Analytics", href: "/org/hr/analytics", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
                ].map((link, i) => {
                  const Icon = link.icon;
                  return (
                    <Link key={i} href={link.href}>
                      <div className={`${link.color} rounded-xl p-3 text-center hover:shadow-sm hover:scale-[1.02] transition-all cursor-pointer`}>
                        <Icon className="w-[18px] h-[18px] mx-auto mb-1.5" />
                        <p className="text-[10px] font-bold">{link.label}</p>
                      </div>
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
