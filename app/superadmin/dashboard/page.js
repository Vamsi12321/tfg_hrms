"use client";

import { motion } from "framer-motion";
import {
  Building2, Users, CreditCard, Activity, Sparkles, TrendingUp,
  AlertTriangle, ShieldCheck, CheckCircle2, XCircle, Clock, Bell,
  Settings, ArrowUpRight, ArrowDownRight, RefreshCw
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  organizations,
  platformStats,
  orgGrowthData,
  revenueData,
  systemAlerts,
  platformActivity
} from "@/lib/superAdminData";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } }
};

export default function SuperAdminDashboard() {
  const stats = [
    {
      label: "Total Organizations",
      value: platformStats.totalOrganizations,
      icon: Building2,
      color: "amber",
      change: `${platformStats.activeOrganizations} Active`,
      desc: "Registered tenants",
      up: true
    },
    {
      label: "Total Platform Users",
      value: platformStats.totalUsers,
      icon: Users,
      color: "blue",
      change: `+12%`,
      desc: "Across all tenants",
      up: true
    },
    {
      label: "Monthly Recurring Revenue",
      value: `₹${platformStats.mrr.toLocaleString()}`,
      icon: CreditCard,
      color: "green",
      change: `+8.4%`,
      desc: "Active subscriptions",
      up: true
    },
    {
      label: "Active Sessions",
      value: platformStats.activeSessions,
      icon: Activity,
      color: "purple",
      change: `${platformStats.uptime}% Uptime`,
      desc: "Live users right now",
      up: true
    }
  ];

  const colorMap = {
    amber: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100" },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
    green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
  };

  const getAlertStyles = (severity) => {
    switch (severity) {
      case "critical":
        return { bg: "bg-rose-50/50 border-rose-100", text: "text-rose-700", iconBg: "bg-rose-100", iconColor: "text-rose-600", icon: AlertTriangle };
      case "warning":
        return { bg: "bg-amber-50/50 border-amber-100", text: "text-amber-700", iconBg: "bg-amber-100", iconColor: "text-amber-600", icon: AlertTriangle };
      case "success":
        return { bg: "bg-emerald-50/50 border-emerald-100", text: "text-emerald-700", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", icon: CheckCircle2 };
      default:
        return { bg: "bg-blue-50/50 border-blue-100", text: "text-blue-700", iconBg: "bg-blue-100", iconColor: "text-blue-600", icon: Sparkles };
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "critical": return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
      case "warning": return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case "success": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Platform Admin Dashboard" />

      <div className="p-6 space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-6 text-white shadow-xl shadow-orange-500/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              <span className="text-sm font-semibold text-orange-100">Platform Control Center</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Super Admin Panel</h2>
            <p className="text-orange-50 text-sm max-w-2xl">
              Monitor multi-tenant operations, manage billing tiers, configure roles across organizations, and audit real-time system performance from a single interface.
            </p>
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
                whileHover={{ y: -2, boxShadow: "0 10px 40px -10px rgba(245, 158, 11, 0.1)" }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-default"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.up ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {stat.change}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{stat.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{stat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts and Alerts Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Charts Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Platform Revenue Trend</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Monthly recurring revenue (MRR) performance</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200/50 px-3 py-1.5 rounded-xl">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> +93.4% Growth YoY
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip
                    formatter={(val) => [`₹${val.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Tenant and User Growth */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tenant & User Growth</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Scale of organizations and users over the last 6 months</p>
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Active Mode</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={orgGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="users" name="Platform Users" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="orgs" name="Organizations" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Right Column - Alerts & Activity */}
          <div className="space-y-6">
            {/* System Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <h3 className="text-sm font-bold text-slate-900">System Alerts</h3>
                </div>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                  {systemAlerts.filter(a => a.severity === "critical").length} Critical
                </span>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {systemAlerts.map((alert) => {
                  const styles = getAlertStyles(alert.severity);
                  const Icon = styles.icon;
                  return (
                    <div key={alert.id} className={`p-3 rounded-xl border ${styles.bg} flex items-start gap-3 transition-colors hover:bg-white`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}>
                        <Icon className={`w-4 h-4 ${styles.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold text-slate-800 truncate">{alert.title}</p>
                          <span className="text-[8px] font-medium text-slate-400 whitespace-nowrap">{alert.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{alert.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Platform Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Recent Platform Operations</h3>
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" />
              </div>
              <div className="space-y-4">
                {platformActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{activity.action}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{activity.description}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-medium">{activity.time}</p>
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
