"use client";

import { motion } from "framer-motion";
import {
  Building2, Users, CalendarCheck, TrendingUp, Sparkles,
  AlertTriangle, ShieldCheck, RefreshCw, Activity,
  CreditCard, ScrollText, Settings, ChevronRight, Globe
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useDashboard, useInvalidate } from "@/lib/queries";
import Link from "next/link";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

export default function SuperAdminDashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const invalidate = useInvalidate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-100">
        <TopBar title="Platform Dashboard" />
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-28 bg-slate-200 rounded-2xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
            </div>
            <div className="h-64 bg-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-surface-100">
        <TopBar title="Platform Dashboard" />
        <div className="p-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Unable to load dashboard</p>
            <button onClick={() => invalidate(["dashboard"])} className="mt-4 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors">
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const greeting = data.greeting || "Good day, Super Admin";
  const organizations = data.organizations || [];
  const totalOrgs = data.total_orgs ?? organizations.length;
  const totalEmployees = data.total_employees_all ?? 0;
  const totalActive = data.total_active_today ?? 0;
  const activeRate = totalEmployees > 0 ? Math.round((totalActive / totalEmployees) * 100) : 0;
  const recentActivity = data.recent_activity || [];

  const kpiCards = [
    { label: "Total Organizations", value: totalOrgs, icon: Building2, color: "amber" },
    { label: "Total Employees", value: totalEmployees, icon: Users, color: "blue" },
    { label: "Active Today", value: totalActive, icon: CalendarCheck, color: "green" },
    { label: "Active Rate", value: `${activeRate}%`, icon: TrendingUp, color: "emerald" },
  ];

  const colorMap = {
    amber:   { bg: "bg-amber-50",   icon: "text-amber-600" },
    blue:    { bg: "bg-blue-50",    icon: "text-blue-600" },
    green:   { bg: "bg-green-50",   icon: "text-green-600" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
  };

  const moduleIcons = {
    organization: "🏢", auth: "🔐", user: "👤", billing: "💳",
    settings: "⚙️", default: "📋",
  };

  const activeOrgs = organizations.filter(o => o.status === "active").length;
  const suspendedOrgs = organizations.filter(o => o.status !== "active").length;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Platform Dashboard" />

      <div className="p-4 md:p-6 space-y-6">
        {/* ─── Welcome Banner ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-5 md:p-6 text-white shadow-xl shadow-amber-500/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-yellow-200" />
              <span className="text-sm font-medium text-orange-100">TFG HRMS Platform</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-1">{greeting}</h2>
            <p className="text-orange-100 text-sm">
              Managing {totalOrgs} organization{totalOrgs !== 1 ? "s" : ""} with {totalEmployees} total employees across the platform.
            </p>
          </div>
        </motion.div>

        {/* ─── KPI Cards ──────────────────────────────────────────── */}
        <motion.div
          initial="hidden" animate="visible" variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
        >
          {kpiCards.map((kpi, i) => {
            const Icon = kpi.icon;
            const colors = colorMap[kpi.color];
            return (
              <motion.div
                key={i} variants={fadeUp}
                whileHover={{ y: -2, boxShadow: "0 8px 30px -8px rgba(0,0,0,0.1)" }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
              >
                <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center mb-2.5`}>
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

            {/* Organization Overview Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Organization Overview</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{totalOrgs} registered organizations</p>
                </div>
                <Link href="/superadmin/organizations" className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-0.5">
                  Manage All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {organizations.length === 0 ? (
                <div className="p-8 text-center">
                  <Building2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No organizations yet</p>
                  <Link href="/superadmin/organizations" className="inline-block mt-3 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700">
                    Add Organization
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3">Organization</th>
                        <th className="px-5 py-3">Domain</th>
                        <th className="px-5 py-3 text-center">Employees</th>
                        <th className="px-5 py-3 text-center">Active Today</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {organizations.map((org) => (
                        <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center flex-shrink-0 bg-slate-50">
                                {org.logo ? (
                                  <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-sm font-black text-amber-600">
                                    {org.name?.charAt(0) || "?"}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-900">{org.name}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Globe className="w-3 h-3 text-slate-400" />
                              {org.domain || "—"}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="text-xs font-bold text-slate-800">{org.employees ?? 0}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="text-xs font-bold text-green-700">{org.active_today ?? 0}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              org.status === "active"
                                ? "bg-green-50 text-green-700 border border-green-100"
                                : "bg-red-50 text-red-700 border border-red-100"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${org.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
                              {org.status === "active" ? "Active" : "Suspended"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Platform Health */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Platform Health</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">Active Organizations</span>
                    <span className="text-xs font-bold text-green-600">{activeOrgs}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full" style={{ width: `${totalOrgs > 0 ? (activeOrgs / totalOrgs * 100) : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">Suspended Organizations</span>
                    <span className="text-xs font-bold text-red-600">{suspendedOrgs}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${totalOrgs > 0 ? (suspendedOrgs / totalOrgs * 100) : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">Employee Activity Rate</span>
                    <span className="text-xs font-bold text-emerald-600">{activeRate}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${activeRate}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Right Column (1/3) ─────────────────────────────────── */}
          <div className="space-y-5">

            {/* Recent Activity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
                <Link href="/superadmin/logs" className="text-[10px] font-bold text-amber-600 hover:underline">
                  View Logs
                </Link>
              </div>
              {recentActivity.length === 0 ? (
                <div className="py-6 text-center">
                  <Activity className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto hide-scrollbar">
                  {recentActivity.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-sm flex-shrink-0 mt-0.5">{moduleIcons[item.module] || moduleIcons.default}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 leading-snug">{item.description}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Links */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Organizations", href: "/superadmin/organizations", icon: Building2, color: "bg-amber-50 text-amber-600" },
                  { label: "Users", href: "/superadmin/users", icon: Users, color: "bg-blue-50 text-blue-600" },
                  { label: "Billing", href: "/superadmin/billing", icon: CreditCard, color: "bg-green-50 text-green-600" },
                  { label: "Logs", href: "/superadmin/logs", icon: ScrollText, color: "bg-purple-50 text-purple-600" },
                  { label: "Settings", href: "/superadmin/settings/platform", icon: Settings, color: "bg-slate-100 text-slate-600" },
                  { label: "Roles", href: "/superadmin/roles", icon: ShieldCheck, color: "bg-indigo-50 text-indigo-600" },
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
