"use client";

import { motion } from "framer-motion";
import {
  Users, CalendarCheck, Clock, Wallet, Brain, TrendingUp,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Sparkles,
  CheckCircle2, XCircle, Coffee, Home, Cake, Bell,
  ChevronRight, Activity, Target, Heart
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  employees, attendanceToday, leaveRequests, payrollSummary,
  aiInsights, recentActivities, announcements, upcomingBirthdays,
  monthlyAttendanceData, headcountTrend
} from "@/lib/fakeData";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } }
};

export default function DashboardPage() {
  const stats = [
    { label: "Total Employees", value: employees.length, icon: Users, color: "blue", change: "+2", up: true },
    { label: "Present Today", value: attendanceToday.present, icon: CalendarCheck, color: "green", change: "83%", up: true },
    { label: "On Leave", value: attendanceToday.onLeave, icon: Clock, color: "amber", change: "1", up: false },
    { label: "Pending Requests", value: leaveRequests.filter(l => l.status === "pending").length, icon: Bell, color: "red", change: "2 new", up: false },
  ];

  const colorMap = {
    blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
    green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-100" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
    red: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-100" },
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 p-6 text-white shadow-xl shadow-brand-500/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium text-blue-100">Good Morning!</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Welcome back, Priya</h2>
            <p className="text-blue-100 text-sm max-w-lg">You have 2 pending leave requests, 1 AI alert, and payroll is due in 8 days. Here&apos;s your team overview.</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            const colors = colorMap[stat.color];
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -2, boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)" }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-default"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.up ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                    {stat.change}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Attendance Trend</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Monthly attendance percentage</p>
                </div>
                <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Last 5 months</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyAttendanceData}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[85, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                  <Area type="monotone" dataKey="present" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorPresent)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Headcount Growth */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Headcount Growth</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Team size over time</p>
                </div>
                <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +33% YTD
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={headcountTrend}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Insights</h3>
                  <p className="text-xs text-slate-400">Powered by TFG Intelligence Engine</p>
                </div>
              </div>
              <div className="space-y-3">
                {aiInsights.slice(0, 3).map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={`p-4 rounded-xl border ${
                      insight.severity === "high" ? "bg-red-50/50 border-red-100" :
                      insight.severity === "positive" ? "bg-green-50/50 border-green-100" :
                      insight.severity === "medium" ? "bg-amber-50/50 border-amber-100" :
                      "bg-blue-50/50 border-blue-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        insight.severity === "high" ? "bg-red-100" :
                        insight.severity === "positive" ? "bg-green-100" :
                        insight.severity === "medium" ? "bg-amber-100" :
                        "bg-blue-100"
                      }`}>
                        {insight.severity === "high" && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                        {insight.severity === "positive" && <TrendingUp className="w-3.5 h-3.5 text-green-600" />}
                        {insight.severity === "medium" && <Activity className="w-3.5 h-3.5 text-amber-600" />}
                        {insight.severity === "info" && <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{insight.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Attendance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <h3 className="text-sm font-bold text-slate-900 mb-4">Today&apos;s Attendance</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Present", value: attendanceToday.present, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
                  { label: "Absent", value: attendanceToday.absent, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
                  { label: "WFH", value: attendanceToday.wfh, icon: Home, color: "text-blue-500", bg: "bg-blue-50" },
                  { label: "Late", value: attendanceToday.late, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className={`${item.bg} rounded-xl p-3 text-center`}>
                      <Icon className={`w-4 h-4 ${item.color} mx-auto mb-1`} />
                      <p className="text-lg font-black text-slate-900">{item.value}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Pending Leave Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Leave Requests</h3>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  {leaveRequests.filter(l => l.status === "pending").length} pending
                </span>
              </div>
              <div className="space-y-3">
                {leaveRequests.filter(l => l.status === "pending").map((req, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {req.employee.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{req.employee}</p>
                      <p className="text-[10px] text-slate-400">{req.type} • {req.days} days</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      </button>
                      <button className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Upcoming Birthdays */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Cake className="w-4 h-4 text-pink-500" />
                <h3 className="text-sm font-bold text-slate-900">Upcoming Birthdays</h3>
              </div>
              <div className="space-y-2.5">
                {upcomingBirthdays.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-pink-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-[10px] font-bold">
                      {b.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">{b.name}</p>
                      <p className="text-[10px] text-slate-400">{b.department}</p>
                    </div>
                    <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded-full">{b.date}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivities.slice(0, 4).map((activity, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{activity.action}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{activity.description}</p>
                      <p className="text-[9px] text-slate-300 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
