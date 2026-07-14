"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Search, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEmailLogs } from "@/lib/communication-queries";

const STATUS_CFG = {
  delivered: { cls: "bg-green-50 text-green-600 border-green-200", label: "Delivered" },
  sent: { cls: "bg-blue-50 text-blue-600 border-blue-200", label: "Sent" },
  failed: { cls: "bg-red-50 text-red-600 border-red-200", label: "Failed" },
  pending: { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "Pending" },
  queued: { cls: "bg-slate-50 text-slate-600 border-slate-200", label: "Queued" },
  bounced: { cls: "bg-orange-50 text-orange-600 border-orange-200", label: "Bounced" },
};

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const params = { page, limit: 50 };
  if (statusFilter) params.status = statusFilter;
  if (appliedSearch) params.search = appliedSearch;
  if (appliedFrom) params.from_date = appliedFrom;
  if (appliedTo) params.to_date = appliedTo;

  const { data: logData, isLoading: loading } = useEmailLogs(params);
  const logs = logData?.logs || [];
  const total = logData?.total || 0;
  const totalPages = logData?.pages || 1;

  const handleApply = () => { setAppliedSearch(search); setAppliedFrom(fromDate); setAppliedTo(toDate); setPage(1); };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {["", "delivered", "sent", "pending", "failed", "bounced"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${statusFilter === s ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-blue-200"}`}>
              {s || "All"}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-auto">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-[10px] outline-none focus:border-blue-400" />
            <span className="text-slate-400 text-xs">—</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-[10px] outline-none focus:border-blue-400" />
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleApply()}
              placeholder="Search…" className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400 w-44" />
          </div>
          <button onClick={handleApply} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold shadow-sm">Apply</button>
        </div>
      </div>

      {/* Table */}
      {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      : logs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center"><Mail className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm font-semibold text-slate-400">No logs found</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600">
                {["Recipient", "Subject", "Template", "Status", "Sent At"].map(h => <th key={h} className="text-[10px] font-bold text-white uppercase px-5 py-3 tracking-wide">{h}</th>)}
              </tr></thead>
              <tbody>
                {logs.map((log, i) => {
                  const sc = STATUS_CFG[log.status] || STATUS_CFG.pending;
                  return (
                    <motion.tr key={log.id || log._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-3.5"><p className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">{log.to_name || log.to_email}</p>{log.to_name && <p className="text-[9px] text-slate-400">{log.to_email}</p>}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[220px] truncate">{log.subject}</td>
                      <td className="px-5 py-3.5">{log.template_slug ? <span className="font-mono text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">{log.template_slug}</span> : <span className="text-[9px] text-slate-300">—</span>}</td>
                      <td className="px-5 py-3.5"><span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span></td>
                      <td className="px-5 py-3.5 text-[10px] font-semibold text-slate-500">{log.sent_at ? new Date(log.sent_at).toLocaleString() : "—"}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {page} of {totalPages} ({total} logs)</p>
              <div className="flex gap-2">
                <button onClick={() => { setPage(p => Math.max(1, p - 1)); }} disabled={page === 1} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
                <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); }} disabled={page >= totalPages} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
