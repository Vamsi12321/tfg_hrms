"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, CalendarCheck, Clock, Wallet, Heart, AlertTriangle,
  Brain, TrendingUp, Sparkles, CheckCircle2, XCircle, Bell,
  ChevronRight, Activity, ClipboardList, ListTodo, RefreshCw,
  Cake, ArrowUpRight, UserPlus, FileText, Briefcase
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";
import { useDashboard, useInvalidate } from "@/lib/queries";
import { formatDate, timeAgo } from "@/lib/date";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell
} from "recharts";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

const DONUT_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6366f1"];

export default function DashboardPage() {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dashParams = {};
  if (fromDate) dashParams.from_date = fromDate;
  if (toDate) dashParams.to_date = toDate;
  const { data, isLoading, isError } = useDashboard(dashParams);
  const invalidate = useInvalidate();
  const activeUser = user || { name: "Admin" };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-100">
        <TopBar title="Dashboard" />
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-36 bg-slate-200 rounded-2xl" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl" />
              <div className="h-72 bg-slate-200 rounded-2xl" />
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

  const kpis = data.kpis || {};
  const attendance = data.attendance_today || {};
  const attendanceTrend = data.attendance_trend || [];
  const headcountGrowth = data.headcount_growth || [];
  const pendingActions = data.pending_actions || [];
  const recentActivity = data.recent_activity || [];
  const workSummary = data.work_summary || {};
  const upcomingHolidays = data.upcoming_holidays || [];
  const upcomingBirthdays = data.upcoming_birthdays || [];
  const aiAlerts = data.ai_alerts || [];
  const greeting = data.greeting || `Good day, ${activeUser.name}`;

  // Chart data
  const chartData = attendanceTrend.map(d => {
    const total = attendance.total || kpis.total_employees || 1;
    return {
      date: d.date.slice(5),
      present: total > 0 ? Math.round((d.present / total) * 100) : 0,
      absent: total > 0 ? Math.round((d.absent / total) * 100) : 0,
      late: total > 0 ? Math.round((d.late / total) * 100) : 0,
      rawPresent: d.present,
      rawAbsent: d.absent,
      rawLate: d.late,
    };
  });
  const avgPresent = chartData.length ? Math.round(chartData.reduce((s, d) => s + d.present, 0) / chartData.length) : 0;
  const avgAbsent = chartData.length ? Math.round(chartData.reduce((s, d) => s + d.absent, 0) / chartData.length) : 0;
  const avgLate = chartData.length ? Math.round(chartData.reduce((s, d) => s + d.late, 0) / chartData.length) : 0;

  const headcountData = headcountGrowth.map(d => ({
    month: d.month.replace(" 2026", "").replace(" 2025", ""),
    count: d.count,
  }));

  // Module icons for activity
  const moduleIcons = {
    leave: "🌴", attendance: "📅", work: "🔧", timesheet: "⏱️", payroll: "💰",
    team: "👥", announcement: "📢", document: "📄", employee: "👤",
    wellness: "💚", holiday: "🎉", auth: "🔐", department: "🏢", organization: "🏛️", default: "📋",
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Dashboard" />

      <div className="p-4 md:p-6 space-y-6">
        {/* ─── Hero Banner ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 p-6 md:p-8 text-white shadow-xl">
          {/* Date filter badge — clickable */}
          <div className="absolute -top-1.5 right-0 hidden md:block z-20">
            <button onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-xs font-semibold text-slate-700 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
              <CalendarCheck className="w-4 h-4 text-brand-500" />
              {fromDate && toDate
                ? `${new Date(fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                : `${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(Date.now() + 6*86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
              }
              <ChevronRight className="w-3 h-3 text-slate-400 rotate-90" />
            </button>
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-64 z-30">
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">From</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">To</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-brand-400" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setFromDate(""); setToDate(""); setShowDatePicker(false); }}
                      className="flex-1 py-2 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50">Reset</button>
                    <button onClick={() => setShowDatePicker(false)}
                      className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-[10px] font-bold hover:bg-brand-700">Apply</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
          {/* Dashboard illustration */}
          <img src="/dashboard/dashboard.png" alt="" className="absolute right-4 bottom-[-29%] h-50 md:h-50 object-contain pointer-events-none z-0 opacity-90 hidden sm:block" />
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-bold">{greeting} 👋</h2>
            <p className="text-blue-100 text-sm mt-1 max-w-md">Here&apos;s what&apos;s happening in your organization today.</p>
            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Link href="/org/hr/employees">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl text-xs font-semibold transition-colors">
                  <UserPlus className="w-3.5 h-3.5" /> Add Employee
                </span>
              </Link>
              <Link href="/org/hr/attendance/daily">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl text-xs font-semibold transition-colors">
                  <CalendarCheck className="w-3.5 h-3.5" /> Mark Attendance
                </span>
              </Link>
              <Link href="/org/hr/leaves/requests">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-xl text-xs font-semibold transition-colors">
                  <Clock className="w-3.5 h-3.5" /> Request Leave
                </span>
              </Link>
              <Link href="/org/hr/analytics">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-indigo-700 rounded-xl text-xs font-bold shadow-sm transition-colors hover:bg-blue-50">
                  <FileText className="w-3.5 h-3.5" /> View Reports
                </span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ─── KPI Cards ──────────────────────────────────────────── */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Employees", value: kpis.total_employees ?? 0, sub: `${kpis.active_today ?? 0} active`, icon: Users, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
            { label: "Present Today", value: kpis.active_today ?? 0, sub: attendance.total ? `${Math.round((kpis.active_today / attendance.total) * 100)}% of total` : "", icon: CalendarCheck, iconBg: "bg-green-50", iconColor: "text-green-600" },
            { label: "Pending Approvals", value: kpis.pending_approvals ?? 0, sub: pendingActions.length > 0 ? pendingActions.map(a => `${a.count} ${a.type}`).slice(0, 2).join(", ") : "all clear", icon: Bell, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
            { label: "Open Work Items", value: kpis.open_work_items ?? 0, sub: `${kpis.overdue_items ?? 0} urgent`, icon: ClipboardList, iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
            { label: "Payroll (Net)", value: kpis.this_month_payroll ? `₹${(kpis.this_month_payroll / 1000).toFixed(kpis.this_month_payroll > 100000 ? 0 : 1)}K` : "₹0", sub: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }), icon: Wallet, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
            { label: "Wellness Score", value: kpis.wellness_score ? `${Math.round(kpis.wellness_score * 20)}/100` : "—", sub: kpis.wellness_score ? `↑ ${kpis.wellness_score}/5` : "", icon: Heart, iconBg: "bg-rose-50", iconColor: "text-rose-500" },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={i} variants={fadeUp}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl ${kpi.iconBg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${kpi.iconColor}`} />
                </div>
                <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{kpi.value}</p>
                {kpi.sub && <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>}
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── Row: Attendance Chart + Upcoming Holidays ───────────── */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Attendance Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="lg:col-span-2 bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Attendance Overview</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-500" />Present</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-red-400" />Absent</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-amber-400" />Late</span>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">Last 7 Days</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} />
                <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2.5} fill="url(#gradP)" name="Present %" />
                <Area type="monotone" dataKey="absent" stroke="#f87171" strokeWidth={1.5} fill="none" strokeDasharray="4 2" name="Absent %" />
                <Area type="monotone" dataKey="late" stroke="#fbbf24" strokeWidth={1.5} fill="none" strokeDasharray="2 2" name="Late %" />
              </AreaChart>
            </ResponsiveContainer>
            {/* Summary boxes below chart */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <p className="text-lg font-black text-green-600">{avgPresent}%</p>
                <p className="text-[10px] text-slate-500">Average Present</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-xl">
                <p className="text-lg font-black text-red-500">{avgAbsent}%</p>
                <p className="text-[10px] text-slate-500">Average Absent</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-xl">
                <p className="text-lg font-black text-amber-600">{avgLate}%</p>
                <p className="text-[10px] text-slate-500">Average Late</p>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Holidays */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Holidays</h3>
              <Link href="/org/hr/leaves/holidays" className="text-[10px] font-bold text-brand-600 hover:underline">View All</Link>
            </div>
            {upcomingHolidays.length === 0 ? (
              <div className="py-8 text-center"><CalendarCheck className="w-6 h-6 text-slate-200 mx-auto mb-2" /><p className="text-[10px] text-slate-400">No upcoming holidays</p></div>
            ) : (
              <div className="space-y-3">
                {upcomingHolidays.slice(0, 5).map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-base">🎉</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{h.name}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(h.date)}</p>
                    </div>
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">Holiday</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ─── Row: Headcount + Work Summary + Recent Activity ──────── */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Headcount Growth */}
          {headcountData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Headcount Growth</h3>
                <div className="flex items-center gap-1 text-green-600 text-[10px] font-bold">
                  <ArrowUpRight className="w-3 h-3" />
                  {headcountData.length > 0 && headcountData[headcountData.length - 1].count} now
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={headcountData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 11 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Work Summary + Pending Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Work Summary</h3>
              <Link href="/org/hr/work/work-items" className="text-[10px] font-bold text-brand-600 hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "To Do", value: workSummary.todo ?? 0, color: "text-slate-700", bg: "bg-slate-50" },
                { label: "In Progress", value: workSummary.in_progress ?? 0, color: "text-blue-700", bg: "bg-blue-50" },
                { label: "Blocked", value: workSummary.blocked ?? 0, color: "text-red-700", bg: "bg-red-50" },
                { label: "Done", value: workSummary.done_this_week ?? 0, color: "text-green-700", bg: "bg-green-50" },
              ].map((item, i) => (
                <div key={i} className={`${item.bg} rounded-xl p-3 text-center`}>
                  <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
            {/* Pending actions */}
            {pendingActions.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-100">
                {pendingActions.slice(0, 3).map((action, i) => (
                  <Link key={i} href={action.href || "#"}>
                    <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-amber-50/50 transition-colors cursor-pointer">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-3 h-3 text-amber-600" />
                      </div>
                      <p className="text-[10px] text-slate-600 font-medium flex-1">{action.label}</p>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{action.count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Activities */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Recent Activities</h3>
              <Link href="/org/hr/logs" className="text-[10px] font-bold text-brand-600 hover:underline">View All</Link>
            </div>
            {recentActivity.length === 0 ? (
              <div className="py-6 text-center"><Activity className="w-6 h-6 text-slate-200 mx-auto mb-2" /><p className="text-[10px] text-slate-400">No recent activity</p></div>
            ) : (
              <div className="space-y-0 max-h-[280px] overflow-y-auto hide-scrollbar divide-y divide-slate-100">
                {recentActivity.slice(0, 8).map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-3">
                    <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-base">{moduleIcons[item.module] || moduleIcons.default}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 leading-snug">{item.description}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{item.time || timeAgo(item.created_at)}</p>
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-400 flex-shrink-0 mt-2" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ─── Row: Birthdays + AI Alerts ──────────────────────────── */}
        {(upcomingBirthdays.length > 0 || aiAlerts.length > 0) && (
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Upcoming Birthdays */}
            {upcomingBirthdays.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Cake className="w-4 h-4 text-pink-500" />
                  <h3 className="text-sm font-bold text-slate-900">Upcoming Birthdays</h3>
                </div>
                <div className="space-y-2.5">
                  {upcomingBirthdays.slice(0, 4).map((b, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-pink-50/50 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {(b.name || "?").split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{b.name}</p>
                        <p className="text-[10px] text-slate-400">{b.department}</p>
                      </div>
                      <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded-full border border-pink-100">
                        {formatDate(b.date, { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI Alerts */}
            {aiAlerts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-purple-500" />
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
                            alert.severity === "critical" ? "bg-red-100" : alert.severity === "warning" ? "bg-amber-100" : "bg-blue-100"
                          }`}>
                            {alert.severity === "critical" ? <AlertTriangle className="w-3 h-3 text-red-600" /> : <Activity className="w-3 h-3 text-amber-600" />}
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
        )}
      </div>
    </div>
  );
}
