"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Calendar, RefreshCw, Activity, Users, Clock,
  Shield, FileText, Bell, Heart, Target, ChevronLeft,
  ChevronRight, AlertCircle, CheckCircle2, Download
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { getActivityLogs, getActivityLogStats, listOrganizations } from "@/lib/api";

const moduleIcons = {
  employee: Users, leave: Clock, attendance: Activity,
  department: Shield, auth: Shield, announcement: Bell,
  document: FileText, wellness: Heart, performance: Target,
  organization: Shield,
};

const moduleColors = {
  employee: "bg-blue-50 text-blue-600", leave: "bg-amber-50 text-amber-600",
  attendance: "bg-green-50 text-green-600", department: "bg-purple-50 text-purple-600",
  auth: "bg-red-50 text-red-600", announcement: "bg-indigo-50 text-indigo-600",
  document: "bg-cyan-50 text-cyan-600", wellness: "bg-emerald-50 text-emerald-600",
  performance: "bg-orange-50 text-orange-600", organization: "bg-slate-100 text-slate-600",
};

const actionColors = {
  created: "bg-green-50 text-green-600 border-green-200",
  updated: "bg-blue-50 text-blue-600 border-blue-200",
  deleted: "bg-red-50 text-red-500 border-red-200",
  approved: "bg-emerald-50 text-emerald-600 border-emerald-200",
  rejected: "bg-rose-50 text-rose-600 border-rose-200",
  login: "bg-slate-50 text-slate-600 border-slate-200",
  logout: "bg-slate-50 text-slate-500 border-slate-200",
};

export default function SuperadminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    module: "", action: "", user_role: "", from_date: "", to_date: "", search: ""
  });

  const fetchLogs = async () => {
    setLoading(true);
    const params = { page, limit: 50 };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    const [logsRes, statsRes] = await Promise.all([getActivityLogs(params), getActivityLogStats()]);
    if (logsRes.ok && logsRes.data) { setLogs(logsRes.data.logs || []); setTotal(logsRes.data.total || 0); setTotalPages(logsRes.data.pages || 1); }
    if (statsRes.ok && statsRes.data) setStats(statsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page, filters]);

  useEffect(() => {
    async function fetchOrgs() {
      const res = await listOrganizations({ limit: 100 });
      if (res.ok && res.data) setOrgs(res.data.organizations || []);
    }
    fetchOrgs();
  }, []);

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Audit Logs — All Organizations" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-black text-purple-600">{stats.total_today}</p>
              <p className="text-xs text-slate-500">Actions Today</p>
            </motion.div>
            <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-black text-slate-700">{stats.total_all}</p>
              <p className="text-xs text-slate-500">Total All Time</p>
            </motion.div>
            {stats.today_by_module && Object.entries(stats.today_by_module).slice(0, 2).map(([mod, count], i) => (
              <motion.div key={mod} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 + i * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                <p className="text-2xl font-black text-slate-700">{count}</p>
                <p className="text-xs text-slate-500 capitalize">{mod} today</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs focus-within:border-purple-400">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))}
              placeholder="Search description..." className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
          </div>
          <select value={filters.module} onChange={e => { setFilters(f => ({...f, module: e.target.value})); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none">
            <option value="">All Modules</option>
            {["employee", "leave", "attendance", "department", "organization", "auth", "announcement", "document", "wellness", "performance"].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filters.action} onChange={e => { setFilters(f => ({...f, action: e.target.value})); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none">
            <option value="">All Actions</option>
            {["created", "updated", "deleted", "approved", "rejected", "login", "logout"].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filters.user_role} onChange={e => { setFilters(f => ({...f, user_role: e.target.value})); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none">
            <option value="">All Roles</option>
            {["superadmin", "org_admin", "hr_admin", "employee"].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <input type="date" value={filters.from_date} onChange={e => setFilters(f => ({...f, from_date: e.target.value}))}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none" />
          <input type="date" value={filters.to_date} onChange={e => setFilters(f => ({...f, to_date: e.target.value}))}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none" />
          <button onClick={fetchLogs} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Logs List */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No activity logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {logs.map((log, i) => {
                const Icon = moduleIcons[log.module] || Activity;
                const modColor = moduleColors[log.module] || "bg-slate-50 text-slate-600";
                const actColor = actionColors[log.action] || "bg-slate-50 text-slate-500 border-slate-200";
                return (
                  <motion.div key={log.id || i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i * 0.02 }}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${modColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800">{log.description}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[10px] text-slate-600 font-semibold">{log.user_name}</span>
                        <span className="text-[10px] text-slate-400">{log.user_role}</span>
                        {log.organization_name && <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">{log.organization_name}</span>}
                        <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${actColor}`}>{log.action}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${modColor}`}>{log.module}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {page} of {totalPages} ({total} logs)</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
