"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScrollText, Search, Filter, Download, Calendar,
  AlertCircle, AlertTriangle, CheckCircle2, Info, Building2,
  User, ShieldCheck, Terminal
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { auditLogs as initialLogs, organizations } from "@/lib/superAdminData";

export default function LogsPage() {
  const [logs, setLogs] = useState(initialLogs);
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [alertMessage, setAlertMessage] = useState("");

  const handleExport = () => {
    setAlertMessage("Generating CSV payload... Audit logs audit_log_export.csv downloaded successfully.");
    setTimeout(() => setAlertMessage(""), 4000);
  };

  const handleClearLogs = () => {
    if (confirm("Are you sure you want to clear the audit logs cache? This action is for demonstration purposes only.")) {
      setLogs([]);
      setAlertMessage("Audit logs database cache cleared.");
      setTimeout(() => setAlertMessage(""), 4000);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.ip.toLowerCase().includes(search.toLowerCase());

    const matchesOrg = orgFilter === "all" || (orgFilter === "platform" && log.orgId === null) || log.orgId === orgFilter;
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    
    let matchesAction = true;
    if (actionFilter !== "all") {
      if (actionFilter === "login") matchesAction = log.action.includes("Login");
      else if (actionFilter === "role") matchesAction = log.action.includes("Role");
      else if (actionFilter === "payment") matchesAction = log.action.includes("Payment");
      else if (actionFilter === "security") matchesAction = log.action.includes("Security") || log.action.includes("Suspended");
      else if (actionFilter === "system") matchesAction = log.orgId === null;
    }

    return matchesSearch && matchesOrg && matchesSeverity && matchesAction;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "critical":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-100">
          <AlertCircle className="w-3 h-3 text-rose-500" /> Critical
        </span>;
      case "warning":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-100">
          <AlertTriangle className="w-3 h-3 text-amber-500" /> Warning
        </span>;
      case "success":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Success
        </span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-100">
          <Info className="w-3 h-3 text-blue-500" /> Info
        </span>;
    }
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Platform Audit Trail" />

      <div className="p-6 space-y-6">
        {/* Toast Alert */}
        <AnimatePresence>
          {alertMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{alertMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">System Logs & Audit Trail</h2>
            <p className="text-xs text-slate-500">Real-time log of security events, configuration modifications, and API calls across all tenant accounts.</p>
          </div>

          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClearLogs}
              className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-50"
            >
              Clear Cache
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExport}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-orange-500/10"
            >
              <Download className="w-4 h-4" /> Export CSV
            </motion.button>
          </div>
        </div>

        {/* Logs Filter Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>

            {/* Selects */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 cursor-pointer transition-colors"
              >
                <option value="all">All Organizations</option>
                <option value="platform">Platform (Global)</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 cursor-pointer transition-colors"
              >
                <option value="all">All Severities</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 cursor-pointer transition-colors"
              >
                <option value="all">All Actions</option>
                <option value="login">Login/Logout Activity</option>
                <option value="role">Role Modif. Events</option>
                <option value="payment">Payment & Sub. Events</option>
                <option value="security">Security & Suspensions</option>
                <option value="system">System Admin Events</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Trail List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Description Details</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Tenant Scope</th>
                  <th className="px-6 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {log.timestamp}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getSeverityBadge(log.severity)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {log.user}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.orgName ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {log.orgName}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold uppercase tracking-wider">
                            <Terminal className="w-3.5 h-3.5" />
                            Platform
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                        {log.ip}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                      No matching audit trails found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
